const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();
const db = admin.firestore();

// Инициализация транспортера для отправки писем.
// В идеале использовать Firebase Secret Manager для хранения кредов.
// Для начала возьмём из окружения.
const mailTransport = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 465,
    secure: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

exports.checkAndSendReminders = functions.pubsub.schedule('every 5 minutes').onRun(async (context) => {
    const now = new Date();
    console.log(`[checkAndSendReminders] Started at ${now.toISOString()}`);

    try {
        // Мы используем collectionGroup для поиска всех напоминаний во всех документах пользователей
        // Это требует создания составного индекса в Firestore (Firebase подскажет ссылку в логах при первой ошибке)
        const remindersRef = db.collectionGroup('reminders');
        const snapshot = await remindersRef
            .where('notified', '==', false)
            .where('triggerTime', '<=', now.toISOString())
            .get();

        if (snapshot.empty) {
            console.log("No new reminders to send.");
            return null;
        }

        const promises = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            console.log(`Processing reminder for ${data.userEmail}: ${data.title}`);
            const uid = doc.ref.parent.parent.id; // get uid from users/{uid}/reminders/{remId}

            const p = (async () => {
                // 1. Отправляем email если разрешено
                if (data.sendEmail) {
                    const mailOptions = {
                        from: `"Barakah Planner" <${process.env.SMTP_USER || 'noreply@barakah.app'}>`,
                        to: data.userEmail,
                        subject: `Напоминание: ${data.title}`,
                        text: `Ассаляму алейкум!\n\nНапоминаем о событии: ${data.title}\nВремя: ${data.eventTime}\n\nДа благословит вас Всевышний!\n\nКоманда Barakah Planner`,
                    };
                    try {
                        await mailTransport.sendMail(mailOptions);
                        console.log(`Email sent to ${data.userEmail}`);
                    } catch (error) {
                        console.error('Error sending email:', error);
                    }
                }

                // 2. Отправляем Push-уведомления
                try {
                    const tokensSnapshot = await db.collection(`users/${uid}/fcmTokens`).get();
                    if (!tokensSnapshot.empty) {
                        const tokens = [];
                        tokensSnapshot.forEach(tDoc => tokens.push(tDoc.id));

                        const message = {
                            notification: {
                                title: "Напоминание: " + data.title,
                                body: `Событие в ${data.eventTime}`
                            },
                            tokens: tokens
                        };

                        const response = await admin.messaging().sendEachForMulticast(message);
                        console.log(`Push sent to ${response.successCount} devices for ${uid}`);

                        // Очистка невалидных токенов
                        if (response.failureCount > 0) {
                            const failedTokens = [];
                            response.responses.forEach((resp, idx) => {
                                if (!resp.success) {
                                    if (resp.error.code === 'messaging/invalid-registration-token' ||
                                        resp.error.code === 'messaging/registration-token-not-registered') {
                                        failedTokens.push(tokens[idx]);
                                    }
                                }
                            });
                            if (failedTokens.length > 0) {
                                const cleanupPromises = failedTokens.map(t =>
                                    db.collection(`users/${uid}/fcmTokens`).doc(t).delete()
                                );
                                await Promise.all(cleanupPromises);
                                console.log(`Cleaned up ${failedTokens.length} expired tokens`);
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error sending push:', error);
                }

                // Помечаем как отправленное
                await doc.ref.update({ notified: true });
            })();

            promises.push(p);
        });

        await Promise.all(promises);
        console.log(`Successfully processed ${snapshot.size} reminders.`);
    } catch (error) {
        console.error("Error checking reminders:", error);
    }

    return null;
});
