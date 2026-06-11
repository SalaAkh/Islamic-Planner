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

            // Handle Deep Links for Google Auth redirect
            App.addListener('appUrlOpen', async (data) => {
                console.log('[NativeApp] App opened with URL:', data.url);
                try {
                    const urlObj = new URL(data.url);
                    if (urlObj.protocol === 'barakahplanner:' && urlObj.host === 'login') {
                        const token = urlObj.searchParams.get('token');
                        if (token) {
                            console.log('[NativeApp] Found login token in URL. Attempting sign-in...');
                            
                            // Visual feedback
                            const errorEl = document.getElementById('auth-error');
                            if (errorEl) {
                                errorEl.className = 'text-xs text-center mt-2 text-indigo-500 font-bold';
                                errorEl.textContent = window.t ? window.t('auth_logging_in') : "Вход...";
                            }
                            
                            const { GoogleAuthProvider, signInWithCredential } = await import("https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js");
                            const credential = GoogleAuthProvider.credential(token);
                            const result = await signInWithCredential(window.firebaseAuth, credential);
                            console.log('[NativeApp] Firebase Sign-In success:', result.user.email);
                        }
                    }
                } catch (err) {
                    console.error('[NativeApp] Deep link sign-in error:', err);
                    const errorEl = document.getElementById('auth-error');
                    if (errorEl) {
                        errorEl.className = 'text-xs text-center mt-2 text-red-500 font-medium';
                        errorEl.textContent = window.t ? window.t('auth_err_google') : "Ошибка входа через Google. Попробуйте снова.";
                    }
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
