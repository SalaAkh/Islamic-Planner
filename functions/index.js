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

            const mailOptions = {
                from: `"Barakah Planner" <${process.env.SMTP_USER || 'noreply@barakah.app'}>`,
                to: data.userEmail,
                subject: `Напоминание: ${data.title}`,
                text: `Ассаляму алейкум!\n\nНапоминаем о событии: ${data.title}\nВремя: ${data.eventTime}\n\nДа благословит вас Всевышний!\n\nКоманда Barakah Planner`,
            };

            // Отправляем письмо и, если успешно, помечаем `notified: true`
            const p = mailTransport.sendMail(mailOptions)
                .then(() => {
                    console.log(`Email sent to ${data.userEmail}`);
                    return doc.ref.update({ notified: true });
                })
                .catch((error) => {
                    console.error('There was an error while sending the email:', error);
                });

            promises.push(p);
        });

        await Promise.all(promises);
        console.log(`Successfully processed ${snapshot.size} reminders.`);
    } catch (error) {
        console.error("Error checking reminders:", error);
    }

    return null;
});
