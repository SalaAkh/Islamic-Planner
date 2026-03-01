import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

// User's actual Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyAo7qZrXlVmx53rhmoyLgbJccVL7EMtNoU",
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
    const db = getFirestore(app);
    const googleProvider = new GoogleAuthProvider();

    // Export to window for classic scripts to use
    window.firebaseApp = app;
    window.firebaseAuth = auth;
    window.firebaseDb = db;
    window.googleProvider = googleProvider;

    console.log("[Firebase] Initialized successfully. (SurviveKit Ready)");
} catch (error) {
    console.warn("[Firebase] Initialization skipped or failed (offline/placeholder config):", error);
}
