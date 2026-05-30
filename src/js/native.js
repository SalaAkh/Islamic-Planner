import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
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

        } catch (error) {
            console.error('[NativeApp] Initialization error:', error);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    NativeApp.init();
});
