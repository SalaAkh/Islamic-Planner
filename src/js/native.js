import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

export const NativeApp = {
    async init() {
        if (!Capacitor.isNativePlatform()) return;

        console.log('[NativeApp] Initializing native plugins...');
        
        try {
            // Configure StatusBar
            await StatusBar.setStyle({ style: Style.Dark });
            await StatusBar.setBackgroundColor({ color: '#0f172a' });

            // Hide Splash Screen
            setTimeout(async () => {
                await SplashScreen.hide();
            }, 500);

            // Handle Android Back Button
            App.addListener('backButton', ({ canGoBack }) => {
                const openModal = document.querySelector('dialog[open]');
                if (openModal) {
                    openModal.close();
                    return;
                }
                
                if (!canGoBack) {
                    App.exitApp();
                } else {
                    window.history.back();
                }
            });

            // Initialize Push Notifications
            this.initPushNotifications();
            
        } catch (error) {
            console.error('[NativeApp] Initialization error:', error);
        }
    },

    async initPushNotifications() {
        if (!Capacitor.isNativePlatform()) return;
        
        try {
            let permStatus = await PushNotifications.checkPermissions();
            
            if (permStatus.receive === 'prompt') {
                permStatus = await PushNotifications.requestPermissions();
            }

            if (permStatus.receive !== 'granted') {
                console.warn('[NativeApp] User denied push notification permission');
                return;
            }

            await PushNotifications.register();

            PushNotifications.addListener('registration', (token) => {
                console.log('[NativeApp] Push registration success, token: ' + token.value);
                window.dispatchEvent(new CustomEvent('native:pushToken', { detail: token.value }));
            });

            PushNotifications.addListener('registrationError', (error) => {
                console.error('[NativeApp] Error on push registration: ' + JSON.stringify(error));
            });

            PushNotifications.addListener('pushNotificationReceived', (notification) => {
                console.log('[NativeApp] Push received: ', notification);
            });

            PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
                console.log('[NativeApp] Push action performed: ', notification);
            });
            
        } catch (error) {
            console.error('[NativeApp] Push initialization error:', error);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    NativeApp.init();
});
