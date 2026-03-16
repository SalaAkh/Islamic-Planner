import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyAo7qZrXlVMx53rhmoyLgbJccVL7EMtNoU",
    authDomain: "islamic-planer.firebaseapp.com",
    projectId: "islamic-planer",
    storageBucket: "islamic-planer.firebasestorage.app",
    messagingSenderId: "421489927764",
    appId: "1:421489927764:web:86ceee1dd8591cd6076fc1",
    measurementId: "G-SHJEPJDL0J"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

signInAnonymously(auth)
    .then((result) => {
        console.log("Success:", result.user.uid);
        process.exit(0);
    })
    .catch((error) => {
        console.error("Error Code:", error.code);
        console.error("Error Message:", error.message);
        process.exit(1);
    });
