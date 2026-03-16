import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { getMessaging, getToken, onMessage, isSupported } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging.js";

// User's actual Firebase Config
const firebaseConfig = {
    apiKey: "__FIREBASE_API_KEY__",
    authDomain: "islamic-planer.firebaseapp.com",
    projectId: "islamic-planer",
    storageBucket: "islamic-planer.firebasestorage.app",
    messagingSenderId: "421489927764",
    appId: "1:421489927764:web:86ceee1dd8591cd6076fc1",
    measurementId: "G-SHJEPJDL0J"
};

try {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);

    // Barakah Planner: Включаем офлайн-кэш для Firestore (будет работать даже без интернета)
    const db = initializeFirestore(app, {
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
    });

    const googleProvider = new GoogleAuthProvider();

    // Export to window for classic scripts to use
    window.firebaseApp = app;
    window.firebaseAuth = auth;
    window.firebaseDb = db;
    window.googleProvider = googleProvider;

    isSupported().then((supported) => {
        if (supported) {
            const messaging = getMessaging(app);
            window.firebaseMessaging = messaging;

            window.requestNotificationPermission = async () => {
                try {
                    const permission = await Notification.requestPermission();
                    if (permission === 'granted') {
                        if (!window.Auth || !window.Auth.user) return; // Only save token if logged in
                        const token = await getToken(messaging);
                        if (token) {
                            const uid = window.Auth.user.uid;
                            await setDoc(doc(db, `users/${uid}/fcmTokens`, token), {
                                token: token,
                                updatedAt: new Date().toISOString()
                            }, { merge: true });
                            console.log('[FCM] Token saved to Firestore');
                        }
                    }
                } catch (error) {
                    console.warn('[Notification] Error requesting permission', error);
                }
            };

            onMessage(messaging, (payload) => {
                console.log('[FCM] Message received in foreground: ', payload);
                if (typeof window.showToast === 'function' && payload.notification) {
                    window.showToast(`🔔 ${payload.notification.title}: ${payload.notification.body}`);
                }
            });
        }
    });

    console.log("[Firebase] Initialized successfully. (Barakah Planner Ready)");
} catch (error) {
    console.warn("[Firebase] Initialization skipped or failed (offline/placeholder config):", error);
}
