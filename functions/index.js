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

/**
 * Webhook для автоматической активации Premium-статуса после оплаты.
 * Поддерживает CORS для тестирования/симуляции с фронтенда.
 * Поддерживает:
 * - Сигнатуру Robokassa (MD5/SHA256)
 * - Сигнатуру NowPayments IPN (HMAC-SHA512)
 * - Firebase ID Token (локальная симуляция)
 * - Legacy секрет x-webhook-secret
 */
exports.handlePaymentWebhook = functions.https.onRequest(async (req, res) => {
    // CORS — ограничиваем origin только нашим доменом и локалхостом для дева
    const allowedOrigins = [
        'https://islamic-planer.web.app',
        'https://islamic-planer.firebaseapp.com',
        'https://islamic.planner.com',
        'http://localhost:5173',
        'http://localhost:5000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5000',
    ];
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.set('Access-Control-Allow-Origin', origin);
    }
    res.set('Access-Control-Allow-Headers', 'Content-Type, x-webhook-secret, Authorization, x-nowpayments-sig');
    res.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    let targetUserId = null;
    let targetEmail = null;
    let targetStatus = null;
    let targetMethod = 'unknown';
    let isDevMode = false;

    const params = { ...req.query, ...req.body };
    const authHeader = req.headers['authorization'];

    // --- Strategy 1: Robokassa Signature Verification ---
    if (params.SignatureValue) {
        console.log('[PaymentWebhook] Robokassa signature detected');
        const robokassaPass2 = process.env.ROBOKASSA_PASSWORD_2;
        if (!robokassaPass2) {
            console.error('[PaymentWebhook] ROBOKASSA_PASSWORD_2 is not configured!');
            res.status(500).json({ error: "Robokassa secret not configured" });
            return;
        }

        const { OutSum, InvId, SignatureValue, Shp_user_id, Shp_email } = params;

        // Robokassa Success Signature: OutSum:InvId:Password2[:Shp_...]
        // Параметры Shp_ сортируются по алфавиту: Shp_email (e) перед Shp_user_id (u)
        let signString = `${OutSum}:${InvId}:${robokassaPass2}`;
        if (Shp_email) signString += `:Shp_email=${Shp_email}`;
        if (Shp_user_id) signString += `:Shp_user_id=${Shp_user_id}`;

        const crypto = require('crypto');
        const calculatedSig = crypto.createHash('md5').update(signString).digest('hex').toUpperCase();

        if (SignatureValue.toUpperCase() !== calculatedSig) {
            console.warn('[PaymentWebhook] Invalid Robokassa signature. Calculated:', calculatedSig, 'Received:', SignatureValue);
            res.status(401).json({ error: "Invalid signature" });
            return;
        }

        targetUserId = Shp_user_id;
        targetEmail = Shp_email || '';
        targetStatus = 'success';
        targetMethod = 'robokassa';
    }
    // --- Strategy 2: NowPayments IPN Signature Verification ---
    else if (req.headers['x-nowpayments-sig']) {
        console.log('[PaymentWebhook] NowPayments signature detected');
        const nowpaymentsIpnKey = process.env.NOWPAYMENTS_IPN_SECRET;
        if (!nowpaymentsIpnKey) {
            console.error('[PaymentWebhook] NOWPAYMENTS_IPN_SECRET is not configured!');
            res.status(500).json({ error: "NowPayments secret not configured" });
            return;
        }

        const crypto = require('crypto');
        const incomingSig = req.headers['x-nowpayments-sig'];
        const rawBody = req.rawBody;

        if (!rawBody) {
            res.status(400).json({ error: "Missing payload" });
            return;
        }

        const hmac = crypto.createHmac('sha512', nowpaymentsIpnKey);
        hmac.update(rawBody);
        const calculatedSig = hmac.digest('hex');

        if (incomingSig !== calculatedSig) {
            console.warn('[PaymentWebhook] Invalid NowPayments signature. Calculated:', calculatedSig, 'Received:', incomingSig);
            res.status(401).json({ error: "Invalid signature" });
            return;
        }

        const payload = JSON.parse(rawBody.toString('utf8'));
        
        // order_id хранит uid пользователя, переданный при создании чекаута
        targetUserId = payload.order_id || payload.payment_id;
        targetEmail = payload.pay_address || '';
        
        if (payload.payment_status === 'finished' || payload.payment_status === 'confirmed') {
            targetStatus = 'success';
        } else {
            console.log(`[PaymentWebhook] NowPayments status is ${payload.payment_status}, not completed.`);
            res.status(200).json({ success: true, message: `IPN status: ${payload.payment_status}` });
            return;
        }
        targetMethod = 'nowpayments';
    }
    // --- Strategy 3: Bearer Firebase ID Token (dev simulation) ---
    else if (authHeader && authHeader.startsWith('Bearer ')) {
        const idToken = authHeader.split('Bearer ')[1];
        try {
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            const authenticatedUid = decodedToken.uid;
            isDevMode = true;
            console.log(`[PaymentWebhook] Dev mode: authenticated as ${decodedToken.email}`);
            
            targetUserId = params.userId || authenticatedUid;
            targetEmail = params.email || decodedToken.email;
            targetStatus = params.status;
            targetMethod = params.paymentMethod || 'simulated_dev';

            if (authenticatedUid !== targetUserId) {
                res.status(403).json({ error: "User ID mismatch in Dev mode" });
                return;
            }
        } catch (error) {
            res.status(401).json({ error: "Invalid ID token" });
            return;
        }
    }
    // --- Strategy 4: Legacy x-webhook-secret Header ---
    else if (req.headers['x-webhook-secret']) {
        const expectedSecret = process.env.PAYMENT_WEBHOOK_SECRET;
        if (!expectedSecret) {
            console.error('[PaymentWebhook] PAYMENT_WEBHOOK_SECRET is not configured!');
            res.status(500).json({ error: "Server misconfiguration" });
            return;
        }
        const secret = req.headers['x-webhook-secret'];
        if (secret === expectedSecret) {
            targetUserId = params.userId;
            targetEmail = params.email;
            targetStatus = params.status;
            targetMethod = params.paymentMethod || 'legacy_secret';
        } else {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
    }
    else {
        console.warn('[PaymentWebhook] Unsupported authentication method');
        res.status(400).json({ error: "Unsupported auth method" });
        return;
    }

    if (!targetUserId) {
        res.status(400).json({ error: "Missing required parameter: userId" });
        return;
    }

    if (targetStatus !== 'success' && targetStatus !== 'paid') {
        res.status(400).json({ error: "Invalid payment status" });
        return;
    }

    try {
        console.log(`[PaymentWebhook] Activating Premium for User ID: ${targetUserId}, Method: ${targetMethod}`);

        const userRef = db.collection('users').doc(targetUserId);
        
        await userRef.set({
            isPremium: true,
            premiumActivatedAt: new Date().toISOString(),
            paymentMethod: targetMethod,
            email: targetEmail || ''
        }, { merge: true });

        await db.collection('system_logs').add({
            type: 'premium_activated',
            userId: targetUserId,
            email: targetEmail || '',
            timestamp: new Date().toISOString(),
            paymentMethod: targetMethod,
            isDevMode: isDevMode
        });

        res.status(200).json({ 
            success: true, 
            message: "Premium activated successfully! МашаАллах!",
            userId: targetUserId
        });
    } catch (error) {
        console.error("[PaymentWebhook] Error updating user premium status:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * Серверный ИИ-планировщик (Gemini AI Proxy).
 * Защищает API-ключ Gemini на сервере и контролирует лимиты бесплатных пользователей (3 раза в день).
 * Auth: Bearer Firebase ID Token
 */
exports.generateDailyPlan = functions.https.onRequest(async (req, res) => {
    // CORS
    const allowedOrigins = [
        'https://islamic-planer.web.app',
        'https://islamic-planer.firebaseapp.com',
        'https://islamic.planner.com',
        'http://localhost:5173',
        'http://localhost:5000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5000',
    ];
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.set('Access-Control-Allow-Origin', origin);
    }
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ error: "Only POST requests are allowed" });
        return;
    }

    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: "Unauthorized: Missing ID token" });
        return;
    }

    const idToken = authHeader.split('Bearer ')[1];
    let uid = null;
    let email = null;

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        uid = decodedToken.uid;
        email = decodedToken.email;
    } catch (e) {
        console.warn('[generateDailyPlan] Invalid Bearer token:', e.message);
        res.status(401).json({ error: "Invalid ID token" });
        return;
    }

    const { prompt } = req.body;
    if (!prompt || !prompt.trim()) {
        res.status(400).json({ error: "Missing required parameter: prompt" });
        return;
    }

    try {
        // 1. Проверяем премиум статус в Firestore
        let isPremium = false;
        const userDoc = await db.collection('users').doc(uid).get();
        if (userDoc.exists()) {
            isPremium = !!userDoc.data().isPremium;
        }

        // 2. Если бесплатный — проверяем лимиты
        const todayDate = new Date().toISOString().split('T')[0];
        const usageRef = db.collection('users').doc(uid).collection('ai_usage').doc(todayDate);

        if (!isPremium) {
            const usageDoc = await usageRef.get();
            if (usageDoc.exists()) {
                const count = usageDoc.data().count || 0;
                if (count >= 3) {
                    res.status(429).json({ 
                        error: "AI limit reached", 
                        message: "Лимит ИИ: макс. 3 планирования в день. Активируйте Premium!" 
                    });
                    return;
                }
            }
        }

        // 3. Вызываем Gemini API
        const geminiApiKey = process.env.GEMINI_API_KEY;
        if (!geminiApiKey) {
            console.error('[generateDailyPlan] GEMINI_API_KEY is not configured in server environment!');
            res.status(500).json({ error: "Server misconfiguration: API key missing" });
            return;
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: `Plan this day as a structured list of tasks based on the following notes: "${prompt}". Provide the list in JSON format containing an array of task objects with 'title' (string, task name, translated back to the prompt's language) and 'isImportant' (boolean, true if it seems like a priority task).`
                            }
                        ]
                    }
                ],
                systemInstruction: {
                    parts: [
                        {
                            text: "You are a strict time-management, productivity, and schedule-planning assistant for the Barakah Planner app. Your only job is to extract and format productivity and scheduling tasks. THEOLOGICAL FIREWALL RULES:\n1. You are strictly forbidden from answering religious or theological inquiries, explaining Quranic verses (ayahs), interpreting hadiths, or issuing fatwas.\n2. If the user's prompt contains any religious inquiries, theological questions, or requests for fatwas/rules of worship (e.g., how to perform prayer, rules of fasting, religious rulings), you MUST ignore the rest of the query and return exactly one task in the 'tasks' array:\n{\n  \"title\": \"⚠️ Обратитесь к местным имамам мечетей или на официальный сайт ДУМК (muftyat.kz) для решения религиозных вопросов\",\n  \"isImportant\": true\n}\n(If the user's input is in Kazakh, return: \"⚠️ Діни сұрақтар бойынша жергілікті мешіт имамдарына немесе ҚМДБ ресми сайтына (muftyat.kz) хабарласыңыз\". If in Arabic, return: \"⚠️ يرجى مراجعة أئمة المساجد المحليين أو الموقع الرسمي لـ ДУМК (muftyat.kz) للمسائل الدينية\". If in English or other languages, return: \"⚠️ Please consult local mosque imams or the official DUMK website (muftyat.kz) for religious matters\").\n3. Otherwise, return the daily productivity schedule based on the user's notes, in the same language as the user's input."
                        }
                    ]
                },
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: "OBJECT",
                        properties: {
                            tasks: {
                                type: "ARRAY",
                                items: {
                                    type: "OBJECT",
                                    properties: {
                                        title: {
                                            type: "STRING"
                                        },
                                        isImportant: {
                                            type: "BOOLEAN"
                                        }
                                    },
                                    required: ["title"]
                                }
                            }
                        },
                        required: ["tasks"]
                    }
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Gemini API returned status ${response.status}`);
        }

        const resData = await response.json();
        
        let textContent = '';
        if (resData.candidates && resData.candidates[0] && resData.candidates[0].content && resData.candidates[0].content.parts && resData.candidates[0].content.parts[0]) {
            textContent = resData.candidates[0].content.parts[0].text;
        } else {
            throw new Error("Invalid API response structure from Gemini");
        }

        // 4. Если пользователь бесплатный — инкрементируем счетчик использования в Firestore
        if (!isPremium) {
            await usageRef.set({
                date: todayDate,
                count: admin.firestore.FieldValue.increment(1)
            }, { merge: true });
        }

        await db.collection('system_logs').add({
            type: 'ai_plan_generated',
            userId: uid,
            email: email || '',
            timestamp: new Date().toISOString(),
            isPremium: isPremium
        });

        res.status(200).send(textContent);

    } catch (error) {
        console.error("[generateDailyPlan] Error generating plan:", error);
        res.status(500).json({ error: "Internal server error", message: error.message });
    }
});

