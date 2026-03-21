import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithRedirect,
    getRedirectResult,
    signOut,
    onAuthStateChanged,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";

const GOOGLE_REDIRECT_PENDING_KEY = 'barakah_google_redirect_pending';
const GOOGLE_REDIRECT_LOG_KEY = 'barakah_google_redirect_log';
const GUEST_MODE_KEY = 'barakah_guest';

window.Auth = {
    user: null,

    clearGoogleRedirectState() {
        sessionStorage.removeItem(GOOGLE_REDIRECT_PENDING_KEY);
        sessionStorage.removeItem(GOOGLE_REDIRECT_LOG_KEY);
    },

    showGoogleAuthError(message) {
        const authModal = document.getElementById('auth-modal');
        const errorEl = document.getElementById('auth-error');

        if (errorEl) {
            errorEl.textContent = message || (window.t ? window.t('auth_err_google') : "Ошибка входа через Google. Попробуйте снова.");
        }

        if (authModal && window.location.protocol !== 'file:') {
            authModal.classList.remove('hidden');
            authModal.classList.add('flex');
        }
    },

    async handleGoogleRedirectResult() {
        if (!window.firebaseAuth) return;

        try {
            const result = await getRedirectResult(window.firebaseAuth);
            sessionStorage.removeItem(GOOGLE_REDIRECT_PENDING_KEY);

            if (!result) {
                sessionStorage.removeItem(GOOGLE_REDIRECT_LOG_KEY);
                return;
            }

            sessionStorage.removeItem(GOOGLE_REDIRECT_LOG_KEY);
            console.log("[Auth] Google redirect sign-in success:", result.user.email);
            await window.ActivityLog?.log('user_login', { method: 'google' });
        } catch (error) {
            this.clearGoogleRedirectState();
            console.error("[Auth] Google redirect sign-in error:", error);
            this.showGoogleAuthError(window.t ? window.t('auth_err_google') : "Ошибка входа через Google. Попробуйте снова.");
        }
    },

    init() {
        if (!window.firebaseAuth) return;

        this.handleGoogleRedirectResult();

        // Sync UI on auth state change
        onAuthStateChanged(window.firebaseAuth, (user) => {
            this.user = user;
            const authIcon = document.getElementById('auth-icon');
            const authBtn = document.getElementById('auth-btn');
            const authModal = document.getElementById('auth-modal');
            const authCloseBtn = document.getElementById('auth-close-btn');
            const isGoogleRedirectPending = sessionStorage.getItem(GOOGLE_REDIRECT_PENDING_KEY) === '1';

            if (user) {
                sessionStorage.removeItem(GOOGLE_REDIRECT_PENDING_KEY);

                // --- LOGGED IN ---
                if (authIcon) {
                    authIcon.classList.remove('fa-user');
                    authIcon.classList.add('fa-user-check');
                    // Removed dynamic email override to keep tooltip localized -> we rely on HTML data-i18n
                    authBtn.removeAttribute('aria-label');
                    if (window.t) {
                        authBtn.setAttribute('aria-label', window.t('tooltip_auth') || 'Войти / Профиль');
                    }
                }
                console.log("[Auth] Logged in as:", user.email);

                document.getElementById('auth-login-view')?.classList.add('hidden');
                document.getElementById('auth-profile-view')?.classList.remove('hidden');

                const userEmailEl = document.getElementById('auth-user-email');
                if (userEmailEl) userEmailEl.textContent = user.email;

                const userNameEl = document.getElementById('auth-user-name');
                if (userNameEl) userNameEl.textContent = user.displayName || (window.t ? window.t('auth_no_name') : 'Без имени');

                const nameInput = document.getElementById('auth-name-input');
                if (nameInput) nameInput.value = user.displayName || '';

                // Show close button (user is authenticated, modal is optional)
                if (authCloseBtn) {
                    authCloseBtn.classList.remove('hidden');
                    authCloseBtn.onclick = () => {
                        authModal.classList.add('hidden');
                        authModal.classList.remove('flex');
                    };
                }
                if (authModal) {
                    authModal.classList.add('hidden');
                    authModal.classList.remove('flex');
                }

                // Sync data from cloud
                if (window.DbSync && typeof window.DbSync.syncFromCloud === 'function') {
                    window.DbSync.syncFromCloud();
                }
            } else {
                // --- LOGGED OUT ---
                if (authIcon) {
                    authIcon.classList.remove('fa-user-check');
                    authIcon.classList.add('fa-user');
                    // Reset to standard tooltip (localized via data-i18n in HTML)
                    authBtn.removeAttribute('aria-label');
                    if (window.t) {
                        authBtn.setAttribute('aria-label', window.t('tooltip_auth') || 'Войти / Профиль');
                    } else {
                        authBtn.setAttribute('aria-label', 'Войти / Профиль');
                    }
                }
                console.log("[Auth] Logged out.");

                document.getElementById('auth-login-view')?.classList.remove('hidden');
                document.getElementById('auth-profile-view')?.classList.add('hidden');

                // Check if user previously chose guest mode or is on file: protocol
                const isGuestMode = localStorage.getItem(GUEST_MODE_KEY) === '1';

                if (window.location.protocol === 'file:' || isGuestMode) {
                    // Guest mode or local file — keep modal closed, allow close button
                    if (authModal) {
                        authModal.classList.add('hidden');
                        authModal.classList.remove('flex');
                    }
                    if (authCloseBtn) {
                        authCloseBtn.classList.remove('hidden');
                        authCloseBtn.onclick = () => {
                            if (authModal) {
                                authModal.classList.add('hidden');
                                authModal.classList.remove('flex');
                            }
                        };
                    }
                } else {
                    if (authModal) {
                        if (isGoogleRedirectPending) {
                            authModal.classList.add('hidden');
                            authModal.classList.remove('flex');
                        } else {
                            authModal.classList.remove('hidden');
                            authModal.classList.add('flex');
                        }
                    }
                    if (authCloseBtn) {
                        authCloseBtn.classList.add('hidden');
                        authCloseBtn.onclick = null;
                    }
                }
            }
        });

        // Block Escape key from closing the modal when not logged in
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.user && window.location.protocol !== 'file:') {
                e.preventDefault();
                e.stopPropagation();
            } else if (e.key === 'Escape' && !this.user && window.location.protocol === 'file:') {
                const authModal = document.getElementById('auth-modal');
                if (authModal) {
                    authModal.classList.add('hidden');
                    authModal.classList.remove('flex');
                }
            }
        }, true);

        // Block clicks on the modal backdrop when not logged in
        const authModal = document.getElementById('auth-modal');
        if (authModal) {
            authModal.addEventListener('click', (e) => {
                // If NOT logged in, block any backdrop click from closing
                if (!this.user && e.target === authModal) {
                    if (window.location.protocol === 'file:') {
                        authModal.classList.add('hidden');
                        authModal.classList.remove('flex');
                        return;
                    }
                    e.stopPropagation();
                    // Shake the modal card to give visual feedback
                    const card = authModal.querySelector('div');
                    if (card) {
                        card.classList.add('animate-[shake_0.3s_ease-in-out]');
                        setTimeout(() => card.classList.remove('animate-[shake_0.3s_ease-in-out]'), 400);
                    }
                }
            });
        }
    },

    async register(email, password) {
        if (!window.firebaseAuth) return { error: "Firebase not configured" };
        try {
            const userCredential = await createUserWithEmailAndPassword(window.firebaseAuth, email, password);
            window.ActivityLog?.log('user_register', { email });
            return { user: userCredential.user };
        } catch (error) {
            console.error("[Auth] Register error:", error);
            return { error: error.message };
        }
    },

    async login(email, password) {
        if (!window.firebaseAuth) return { error: "Firebase not configured" };
        try {
            const userCredential = await signInWithEmailAndPassword(window.firebaseAuth, email, password);
            window.ActivityLog?.log('user_login', { method: 'email' });
            return { user: userCredential.user };
        } catch (error) {
            console.error("[Auth] Login error:", error);
            return { error: error.message };
        }
    },

    async signInWithGoogle() {
        if (!window.firebaseAuth) return { error: "Firebase not configured" };
        try {
            sessionStorage.setItem(GOOGLE_REDIRECT_PENDING_KEY, '1');
            sessionStorage.setItem(GOOGLE_REDIRECT_LOG_KEY, '1');
            await signInWithRedirect(window.firebaseAuth, window.googleProvider);
            return { pending: true };
        } catch (error) {
            // Redirect init failed before the browser navigated away.
            this.clearGoogleRedirectState();
            console.error("[Auth] Google redirect start error:", error);
            return { error: error.message };
        }
    },

    async logout() {
        if (!window.firebaseAuth) return;
        try {
            // Log before signing out (user still authenticated at this point)
            await window.ActivityLog?.log('user_logout');
            await signOut(window.firebaseAuth);
            // ── Clear ALL local user data so next user starts clean ──
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('barakah_')) keysToRemove.push(key);
            }
            keysToRemove.forEach(k => localStorage.removeItem(k));

            // Clear IndexedDB drawing too — call Store's method
            if (window.Store && typeof window.Store.clearDrawing === 'function') {
                await window.Store.clearDrawing();
            }

            console.log('[Auth] Local data cleared on logout.');
            // Reload page to ensure all internal states are reset
            window.location.reload();
        } catch (error) {
            console.error("[Auth] Logout error:", error);
        }
    },

    async updateUsername(displayName) {
        if (!window.firebaseAuth || !this.user) return { error: "Не авторизован" };
        try {
            await updateProfile(this.user, { displayName });
            return { success: true };
        } catch (error) {
            console.error("[Auth] Update profile error:", error);
            return { error: error.message };
        }
    }
};

// Auto-init on load
document.addEventListener('DOMContentLoaded', () => {
    window.Auth.init();

    // Auth Form Listeners
    const loginForm = document.getElementById('auth-form');
    const submitBtn = loginForm?.querySelector('button[type="submit"]');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('auth-email').value;
            const password = document.getElementById('auth-password').value;
            const isRegister = document.getElementById('auth-is-register').checked;
            const errorEl = document.getElementById('auth-error');
            const btnText = document.getElementById('auth-submit-text');

            errorEl.textContent = '';
            btnText.textContent = isRegister ? (window.t ? window.t('auth_registering') : 'Регистрация...') : (window.t ? window.t('auth_logging_in') : 'Вход...');
            if (submitBtn) submitBtn.disabled = true;
            submitBtn.classList.add('opacity-70');

            const result = isRegister
                ? await Auth.register(email, password)
                : await Auth.login(email, password);

            if (result.error) {
                // Translate common errors
                if (result.error.includes("auth/invalid-credential")) errorEl.textContent = (window.t ? window.t('auth_err_invalid') : "Неверный логин или пароль");
                else if (result.error.includes("auth/email-already-in-use")) errorEl.textContent = (window.t ? window.t('auth_err_in_use') : "Email уже зарегистрирован");
                else if (result.error.includes("auth/weak-password")) errorEl.textContent = (window.t ? window.t('auth_err_weak') : "Пароль слишком простой (минимум 6 символов)");
                else if (result.error.includes("auth/operation-not-allowed")) errorEl.textContent = (window.t ? window.t('auth_err_not_allowed') : "Глобальная регистрация по Email отключена (Firebase)");
                else errorEl.textContent = result.error;
            } else {
                // Success - clear guest flag and close modal
                localStorage.removeItem(GUEST_MODE_KEY);
                document.getElementById('auth-modal').classList.add('hidden');
                document.getElementById('auth-modal').classList.remove('flex');
                loginForm.reset();
            }

            btnText.textContent = isRegister ? (window.t ? window.t('auth_register_btn') : 'Зарегистрироваться') : (window.t ? window.t('auth_login_btn') : 'Войти');
            if (submitBtn) submitBtn.disabled = false;
            submitBtn.classList.remove('opacity-70');
        });
    }

    const btnGoogle = document.getElementById('btn-google-auth');
    if (btnGoogle) {
        btnGoogle.addEventListener('click', async () => {
            const prevHtml = btnGoogle.innerHTML;
            const errorEl = document.getElementById('auth-error');
            if (errorEl) errorEl.textContent = '';
            btnGoogle.innerHTML = `<i class="fas fa-circle-notch fa-spin text-gray-500"></i> ${window.t ? window.t('auth_loading') : 'Загрузка...'}`;
            btnGoogle.disabled = true;

            const result = await Auth.signInWithGoogle();

            if (result?.pending) {
                return;
            }

            if (!result.error) {
                document.getElementById('auth-modal').classList.add('hidden');
                document.getElementById('auth-modal').classList.remove('flex');
            } else {
                if (errorEl) errorEl.textContent = (window.t ? window.t('auth_err_google') : "Ошибка входа через Google. Попробуйте снова.");
            }

            btnGoogle.innerHTML = prevHtml;
            btnGoogle.disabled = false;
        });
    }

    // Guest bypass — continue without account
    const btnGuest = document.getElementById('btn-guest-auth');
    if (btnGuest) {
        btnGuest.addEventListener('click', () => {
            try { localStorage.setItem(GUEST_MODE_KEY, '1'); } catch (e) { }
            const authModal = document.getElementById('auth-modal');
            if (authModal) {
                authModal.classList.add('hidden');
                authModal.classList.remove('flex');
            }
            console.log('[Auth] Guest mode activated.');
        });
    }

    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
            await Auth.logout();
        });
    }

    const authBtn = document.getElementById('auth-btn');
    if (authBtn) {
        authBtn.addEventListener('click', () => {
            const authModal = document.getElementById('auth-modal');
            if (authModal) {
                authModal.classList.remove('hidden');
                authModal.classList.add('flex');
            }
        });
    }

    const btnUpdateProfile = document.getElementById('btn-update-profile');
    if (btnUpdateProfile) {
        btnUpdateProfile.addEventListener('click', async () => {
            const newName = document.getElementById('auth-name-input').value.trim();
            const msgEl = document.getElementById('auth-profile-msg');
            msgEl.textContent = window.t ? window.t('auth_saving') : 'Сохранение...';
            msgEl.className = 'text-xs text-center mt-1 h-4 font-medium transition-colors text-indigo-500';

            const result = await Auth.updateUsername(newName);
            if (result.success) {
                msgEl.textContent = (window.t ? window.t('auth_name_updated') : 'Имя обновлено!');
                msgEl.className = 'text-xs text-center mt-1 h-4 font-medium transition-colors text-green-500';
                const userNameEl = document.getElementById('auth-user-name');
                if (userNameEl) userNameEl.textContent = newName || (window.t ? window.t('auth_no_name') : 'Без имени');
                setTimeout(() => { msgEl.textContent = ''; }, 3000);
            } else {
                msgEl.textContent = window.t ? window.t('auth_save_err') : 'Ошибка сохранения';
                msgEl.className = 'text-xs text-center mt-1 h-4 font-medium transition-colors text-red-500';
            }
        });
    }

    // Toggle Registration/Login Text
    const toggleRegCheckbox = document.getElementById('auth-is-register');
    if (toggleRegCheckbox) {
        toggleRegCheckbox.addEventListener('change', (e) => {
            const btnSubmit = document.getElementById('auth-submit-text');
            if (e.target.checked) {
                btnSubmit.textContent = window.t ? window.t('auth_register_btn') : "Зарегистрироваться";
            } else {
                btnSubmit.textContent = window.t ? window.t('auth_login_btn') : "Войти";
            }
        });
    }

    // Toggle Password Visibility
    const togglePasswordBtn = document.getElementById('auth-toggle-password');
    const passwordInput = document.getElementById('auth-password');
    const togglePasswordIcon = document.getElementById('auth-toggle-password-icon');

    if (togglePasswordBtn && passwordInput && togglePasswordIcon) {
        togglePasswordBtn.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);

            if (type === 'text') {
                togglePasswordIcon.classList.remove('fa-eye');
                togglePasswordIcon.classList.add('fa-eye-slash');
            } else {
                togglePasswordIcon.classList.remove('fa-eye-slash');
                togglePasswordIcon.classList.add('fa-eye');
            }
        });
    }
});
