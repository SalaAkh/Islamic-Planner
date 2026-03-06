importScripts("https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js");

const firebaseConfig = {
    apiKey: "AIzaSyAo7qZrXlVMx53rhmoyLgbJccVL7EMtNoU",
    authDomain: "islamic-planer.firebaseapp.com",
    projectId: "islamic-planer",
    storageBucket: "islamic-planer.firebasestorage.app",
    messagingSenderId: "421489927764",
    appId: "1:421489927764:web:86ceee1dd8591cd6076fc1"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/public/favicon.ico',
        badge: '/public/favicon.ico',
        tag: 'barakah-planner-reminder'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
