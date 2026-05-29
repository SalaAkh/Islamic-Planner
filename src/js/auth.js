import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithRedirect,
    getRedirectResult,
    signOut,
    onAuthStateChanged,
    updateProfile,
    signInWithPopup
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

                // Fetch premium status from Firestore
                window.Auth.isPremium = false; // default
                window.Auth.premiumPlan = "free"; // default

                const renderPremiumUI = () => {
                    const statusTextEl = document.getElementById('premium-status-val');
                    const buyBtn = document.getElementById('btn-buy-premium-action');
                    const syncStatusEl = document.getElementById('sync-active-status');

                    if (window.Auth.isPremium) {
                        if (statusTextEl) {
                            if (window.Auth.premiumPlan === 'org') {
                                statusTextEl.textContent = window.t ? window.t('premium_active_org') : "Organization (Медресе!)";
                                statusTextEl.className = "text-indigo-600 dark:text-indigo-400 font-extrabold text-xs";
                            } else {
                                statusTextEl.textContent = window.t ? window.t('premium_active_pro') : "Premium Pro (МашаАллах!)";
                                statusTextEl.className = "text-emerald-600 dark:text-emerald-400 font-bold text-xs";
                            }
                        }
                        if (buyBtn) buyBtn.classList.add('hidden');
                        if (syncStatusEl) syncStatusEl.classList.remove('hidden');
                    } else {
                        if (statusTextEl) {
                            statusTextEl.textContent = window.t ? window.t('premium_free') : "Обычный (Бесплатный)";
                            statusTextEl.className = "text-gray-600 dark:text-gray-400 font-medium text-xs";
                        }
                        if (buyBtn) {
                            buyBtn.classList.remove('hidden');
                        }
                        if (syncStatusEl) syncStatusEl.classList.add('hidden');
                    }
                };

                renderPremiumUI();

                if (window.firebaseDb) {
                    const uid = user.uid;
                    import("https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js").then(({ doc, getDoc }) => {
                        const docRef = doc(window.firebaseDb, "users", uid);
                        getDoc(docRef).then((docSnap) => {
                            if (docSnap.exists()) {
                                const data = docSnap.data();
                                console.log("[Auth] Fetched user doc for isPremium:", data);
                                window.Auth.isPremium = !!data.isPremium;
                                window.Auth.premiumPlan = data.premiumPlan || (data.isPremium ? "pro" : "free");
                            } else {
                                console.warn("[Auth] User doc does not exist, setting isPremium false");
                                window.Auth.isPremium = false;
                                window.Auth.premiumPlan = "free";
                            }
                            renderPremiumUI();

                            // Sync data from cloud if user is Premium
                            if (window.Auth.isPremium && window.DbSync && typeof window.DbSync.syncFromCloud === 'function') {
                                window.DbSync.syncFromCloud();
                            }
                        }).catch(e => {
                            console.error("[Auth] Error fetching user doc:", e);
                            renderPremiumUI();
                        });
                    }).catch(e => {
                        console.error("[Auth] Error importing firestore:", e);
                        renderPremiumUI();
                    });
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
            console.log("[Auth] Attempting Google popup sign-in...");
            const result = await signInWithPopup(window.firebaseAuth, window.googleProvider);
            console.log("[Auth] Google popup sign-in success:", result.user.email);
            
            // Clear redirect states since popup succeeded
            this.clearGoogleRedirectState();
            
            // Log activity
            await window.ActivityLog?.log('user_login', { method: 'google_popup' });
            
            // Trigger storage sync manually on success if premium
            if (window.Store && typeof window.Store.sync === 'function') {
                window.Store.sync();
            }
            
            return { user: result.user };
        } catch (popupError) {
            console.warn("[Auth] Google popup sign-in blocked or failed, trying redirect fallback:", popupError);
            
            // If popup is blocked (common on some mobile browsers/strict blockers), fallback to redirect
            try {
                sessionStorage.setItem(GOOGLE_REDIRECT_PENDING_KEY, '1');
                sessionStorage.setItem(GOOGLE_REDIRECT_LOG_KEY, '1');
                await signInWithRedirect(window.firebaseAuth, window.googleProvider);
                return { pending: true };
            } catch (redirectError) {
                this.clearGoogleRedirectState();
                console.error("[Auth] Google redirect start error:", redirectError);
                return { error: redirectError.message };
            }
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

            // Check consent if registering (RK Compliance)
            if (isRegister) {
                const consentCheckbox = document.getElementById('auth-consent');
                if (consentCheckbox && !consentCheckbox.checked) {
                    errorEl.textContent = window.t ? window.t('auth_consent_error') : 'Необходимо согласие на обработку персональных данных.';
                    return;
                }
            }

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
            const isRegister = document.getElementById('auth-is-register').checked;
            const errorEl = document.getElementById('auth-error');
            if (errorEl) errorEl.textContent = '';

            // Check consent if Google auth is used for registration (RK Compliance)
            if (isRegister) {
                const consentCheckbox = document.getElementById('auth-consent');
                if (consentCheckbox && !consentCheckbox.checked) {
                    if (errorEl) errorEl.textContent = window.t ? window.t('auth_consent_error') : 'Необходимо согласие на обработку персональных данных.';
                    return;
                }
            }

            const prevHtml = btnGoogle.innerHTML;
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

    // Toggle Registration/Login Text and Consent Checkbox
    const toggleRegCheckbox = document.getElementById('auth-is-register');
    if (toggleRegCheckbox) {
        toggleRegCheckbox.addEventListener('change', (e) => {
            const btnSubmit = document.getElementById('auth-submit-text');
            const consentContainer = document.getElementById('auth-consent-container');
            if (e.target.checked) {
                btnSubmit.textContent = window.t ? window.t('auth_register_btn') : "Зарегистрироваться";
                if (consentContainer) consentContainer.classList.remove('hidden');
            } else {
                btnSubmit.textContent = window.t ? window.t('auth_login_btn') : "Войти";
                if (consentContainer) consentContainer.classList.add('hidden');
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

    // ===== PAYMENT / CHECKOUT MODAL LOGIC =====
    const payModal = document.getElementById('payment-modal');
    const payModalInner = document.getElementById('payment-modal-inner');
    const btnBuyPremium = document.getElementById('btn-buy-premium-action');
    const payModalClose = document.getElementById('payment-modal-close');
    const btnPayCrypto = document.getElementById('btn-pay-crypto');
    const btnPayCard = document.getElementById('btn-pay-card');
    const btnPaySimulate = document.getElementById('btn-pay-simulate');
    const payStatusMsg = document.getElementById('payment-status-msg');

    const openPayModal = () => {
        if (!payModal) return;
        if (payStatusMsg) {
            payStatusMsg.textContent = '';
            payStatusMsg.className = 'text-xs text-center font-medium mt-4 h-4 transition-all';
        }
        payModal.classList.remove('hidden');
        payModal.classList.add('flex');
        requestAnimationFrame(() => {
            if (payModalInner) {
                payModalInner.classList.remove('scale-95', 'opacity-0');
                payModalInner.classList.add('scale-100', 'opacity-100');
            }
        });
    };

    const closePayModal = () => {
        if (!payModal) return;
        if (payModalInner) {
            payModalInner.classList.remove('scale-100', 'opacity-100');
            payModalInner.classList.add('scale-95', 'opacity-0');
        }
        setTimeout(() => {
            payModal.classList.add('hidden');
            payModal.classList.remove('flex');
        }, 300);
    };

    let selectedPlan = "pro"; // default

    const updatePricingUI = (plan) => {
        selectedPlan = plan;
        const tabPro = document.getElementById('tab-plan-pro');
        const tabOrg = document.getElementById('tab-plan-org');
        const badge = document.getElementById('payment-plan-badge');
        const title = document.getElementById('payment-plan-title');
        const price = document.getElementById('payment-plan-price');
        const period = document.getElementById('payment-plan-period');
        const list = document.getElementById('payment-features-list');

        const activeClasses = ['bg-white', 'dark:bg-slate-700', 'text-slate-800', 'dark:text-white', 'shadow-sm', 'border', 'border-slate-200/10'];
        const inactiveClasses = ['text-slate-500', 'dark:text-slate-400', 'hover:text-slate-800', 'dark:hover:text-white'];

        if (plan === 'pro') {
            tabPro.className = "flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm border border-slate-200/10";
            tabOrg.className = "flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white cursor-pointer flex items-center justify-center gap-1.5";
            
            if (badge) badge.innerText = "B2C Pro";
            if (title) title.innerText = window.t ? window.t('pricing_tab_pro') : "Barakah Pro";
            if (price) price.innerText = "$4.99";
            if (period) period.innerText = window.t ? window.t('pricing_price_pro').split('/')[1] || " / мес" : " / мес";
            
            if (list) {
                list.innerHTML = `
                    <li class="flex items-start gap-2.5">
                        <i class="fas fa-check-circle text-emerald-500 mt-0.5"></i>
                        <span>${window.t ? window.t('pricing_feature_cloud') : 'Облачная синхронизация данных'}</span>
                    </li>
                    <li class="flex items-start gap-2.5">
                        <i class="fas fa-check-circle text-emerald-500 mt-0.5"></i>
                        <span>${window.t ? window.t('pricing_feature_boards') : 'Безлимитные доски Тафаккур'}</span>
                    </li>
                    <li class="flex items-start gap-2.5">
                        <i class="fas fa-check-circle text-emerald-500 mt-0.5"></i>
                        <span>${window.t ? window.t('pricing_feature_ai') : 'Безлимитное Gemini AI планирование'}</span>
                    </li>
                    <li class="flex items-start gap-2.5">
                        <i class="fas fa-check-circle text-emerald-500 mt-0.5"></i>
                        <span>${window.t ? window.t('pricing_feature_groups') : 'Совместные семейные группы (до 6 человек)'}</span>
                    </li>
                `;
            }
        } else {
            tabPro.className = "flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white cursor-pointer flex items-center justify-center gap-1.5";
            tabOrg.className = "flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm border border-slate-200/10";
            
            if (badge) badge.innerText = "B2B Org";
            if (title) title.innerText = window.t ? window.t('pricing_tab_org') : "Медресе / Орг";
            if (price) price.innerText = "$29.99";
            if (period) period.innerText = window.t ? window.t('pricing_price_org').split('/')[1] || " / мес" : " / мес";
            
            if (list) {
                list.innerHTML = `
                    <li class="flex items-start gap-2.5">
                        <i class="fas fa-check-circle text-indigo-500 mt-0.5"></i>
                        <span>${window.t ? window.t('pricing_feature_students') : 'До 100 учеников / участников'}</span>
                    </li>
                    <li class="flex items-start gap-2.5">
                        <i class="fas fa-check-circle text-indigo-500 mt-0.5"></i>
                        <span>${window.t ? window.t('pricing_feature_hifz') : 'Трекер заучивания Корана (Hifz)'}</span>
                    </li>
                    <li class="flex items-start gap-2.5">
                        <i class="fas fa-check-circle text-indigo-500 mt-0.5"></i>
                        <span>${window.t ? window.t('pricing_feature_audit') : 'История активности и аудит для детей/учеников'}</span>
                    </li>
                    <li class="flex items-start gap-2.5">
                        <i class="fas fa-check-circle text-indigo-500 mt-0.5"></i>
                        <span>${window.t ? window.t('pricing_feature_cloud') : 'Облачная синхронизация данных'}</span>
                    </li>
                `;
            }
        }
    };

    if (btnBuyPremium) {
        btnBuyPremium.addEventListener('click', () => {
            openPayModal();
            updatePricingUI("pro");
        });
    }

    const tabProBtn = document.getElementById('tab-plan-pro');
    const tabOrgBtn = document.getElementById('tab-plan-org');

    if (tabProBtn && tabOrgBtn) {
        tabProBtn.addEventListener('click', () => updatePricingUI("pro"));
        tabOrgBtn.addEventListener('click', () => updatePricingUI("org"));
    }

    if (payModalClose) {
        payModalClose.addEventListener('click', closePayModal);
    }
    if (payModal) {
        payModal.addEventListener('click', (e) => {
            if (e.target === payModal) closePayModal();
        });
    }

    // Настройка ссылок для оплаты (Crypto / Card)
    if (btnPayCrypto) {
        btnPayCrypto.addEventListener('click', (e) => {
            e.preventDefault();
            const user = window.Auth?.user;
            if (!user) {
                if (payStatusMsg) {
                    payStatusMsg.textContent = 'Пожалуйста, авторизуйтесь перед оплатой.';
                    payStatusMsg.className = 'text-xs text-center font-medium mt-4 h-4 transition-all text-red-500';
                }
                return;
            }
            const cryptoPayUrl = `https://nowpayments.io/payment/?user_id=${user.uid}&email=${encodeURIComponent(user.email)}&plan=${selectedPlan}`;
            window.open(cryptoPayUrl, '_blank');
            if (payStatusMsg) {
                payStatusMsg.textContent = 'Окно оплаты криптовалютой открыто. После оплаты Premium активируется автоматически.';
                payStatusMsg.className = 'text-xs text-center font-medium mt-4 h-4 transition-all text-indigo-500';
            }
        });
    }

    if (btnPayCard) {
        btnPayCard.addEventListener('click', (e) => {
            e.preventDefault();
            const user = window.Auth?.user;
            if (!user) {
                if (payStatusMsg) {
                    payStatusMsg.textContent = 'Пожалуйста, авторизуйтесь перед оплатой.';
                    payStatusMsg.className = 'text-xs text-center font-medium mt-4 h-4 transition-all text-red-500';
                }
                return;
            }
            const sum = selectedPlan === 'org' ? 29.99 : 4.99;
            const cardPayUrl = `https://robokassa.ru/merchant/test?user_id=${user.uid}&email=${encodeURIComponent(user.email)}&sum=${sum}&plan=${selectedPlan}`;
            window.open(cardPayUrl, '_blank');
            if (payStatusMsg) {
                payStatusMsg.textContent = 'Окно оплаты картой открыто. После оплаты Premium активируется автоматически.';
                payStatusMsg.className = 'text-xs text-center font-medium mt-4 h-4 transition-all text-indigo-500';
            }
        });
    }

    // Симуляция оплаты — ТОЛЬКО для dev/localhost окружения!
    // В production кнопка скрыта и код не выполняется.
    if (btnPaySimulate) {
        const isDevMode = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        
        if (!isDevMode) {
            // В production — полностью скрываем кнопку симуляции
            btnPaySimulate.style.display = 'none';
        } else {
            btnPaySimulate.addEventListener('click', async () => {
                const user = window.Auth?.user;
                if (!user) {
                    if (payStatusMsg) {
                        payStatusMsg.textContent = 'Пожалуйста, войдите в аккаунт для симуляции оплаты.';
                        payStatusMsg.className = 'text-xs text-center font-medium mt-4 h-4 transition-all text-red-500';
                    }
                    return;
                }

                if (payStatusMsg) {
                    payStatusMsg.textContent = '[DEV] Вызов вебхука Cloud Function...';
                    payStatusMsg.className = 'text-xs text-center font-medium mt-4 h-4 transition-all text-indigo-500';
                }
                btnPaySimulate.disabled = true;
                btnPaySimulate.classList.add('opacity-70');

                try {
                    // В dev-режиме используем локальный эмулятор
                    const emulatorPort = window.location.port && window.location.port !== '80' && window.location.port !== '443'
                        ? 5001
                        : 5001;
                    const baseUrl = `http://${window.location.hostname}:${emulatorPort}/islamic-planer/us-central1`;

                    // Получаем auth token для серверной верификации (вместо hardcoded secret)
                    const idToken = await user.getIdToken();

                    const response = await fetch(`${baseUrl}/handlePaymentWebhook`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${idToken}`
                        },
                        body: JSON.stringify({
                            userId: user.uid,
                            email: user.email,
                            status: 'success',
                            paymentMethod: 'simulated_dev',
                            premiumPlan: selectedPlan,
                            isPremium: true
                        })
                    });

                    const resData = await response.json();
                    if (response.ok && resData.success) {
                        if (payStatusMsg) {
                            payStatusMsg.textContent = 'МашаАллах! Оплата прошла. Лицензия активирована!';
                            payStatusMsg.className = 'text-xs text-center font-medium mt-4 h-4 transition-all text-emerald-600 dark:text-emerald-400';
                        }
                        if (window.showToast) {
                            window.showToast('Premium активирован! МашаАллах! 🎉');
                        }
                        
                        // Запуск конфетти!
                        const script = document.createElement('script');
                        script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js';
                        script.onload = () => {
                            window.confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
                        };
                        document.head.appendChild(script);

                        setTimeout(() => {
                            closePayModal();
                            const authModal = document.getElementById('auth-modal');
                            if (authModal) {
                                authModal.classList.add('hidden');
                                authModal.classList.remove('flex');
                            }
                        }, 2000);
                    } else {
                        throw new Error(resData.error || 'Ошибка вызова функции');
                    }
                } catch(error) {
                    console.error('[DEV Simulate Payment Error]', error);
                    if (payStatusMsg) {
                        payStatusMsg.textContent = `Ошибка: ${error.message}. Убедитесь, что эмулятор запущен.`;
                        payStatusMsg.className = 'text-xs text-center font-medium mt-4 h-4 transition-all text-red-500';
                    }
                } finally {
                    btnPaySimulate.disabled = false;
                    btnPaySimulate.classList.remove('opacity-70');
                }
            });
        }
    }
});
