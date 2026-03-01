import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";

window.Auth = {
    user: null,

    init() {
        if (!window.firebaseAuth) return;

        // Sync UI on auth state change
        onAuthStateChanged(window.firebaseAuth, (user) => {
            this.user = user;
            const authIcon = document.getElementById('auth-icon');
            const authBtn = document.getElementById('auth-btn');

            if (user) {
                // Logged in
                if (authIcon) {
                    authIcon.classList.remove('fa-user');
                    authIcon.classList.add('fa-user-check');
                    authBtn.setAttribute('aria-label', user.email);
                }
                console.log("[Auth] Logged in as:", user.email);

                // Switch modal views
                document.getElementById('auth-login-view')?.classList.add('hidden');
                document.getElementById('auth-profile-view')?.classList.remove('hidden');

                const userEmailEl = document.getElementById('auth-user-email');
                if (userEmailEl) userEmailEl.textContent = user.email;

                // Sync data from cloud
                if (window.DbSync && typeof window.DbSync.syncFromCloud === 'function') {
                    window.DbSync.syncFromCloud();
                }
            } else {
                // Logged out
                if (authIcon) {
                    authIcon.classList.remove('fa-user-check');
                    authIcon.classList.add('fa-user');
                    authBtn.setAttribute('aria-label', 'Войти / Профиль');
                }
                console.log("[Auth] Logged out.");

                document.getElementById('auth-login-view')?.classList.remove('hidden');
                document.getElementById('auth-profile-view')?.classList.add('hidden');
            }
        });
    },

    async register(email, password) {
        if (!window.firebaseAuth) return { error: "Firebase not configured" };
        try {
            const userCredential = await createUserWithEmailAndPassword(window.firebaseAuth, email, password);
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
            return { user: userCredential.user };
        } catch (error) {
            console.error("[Auth] Login error:", error);
            return { error: error.message };
        }
    },

    async signInWithGoogle() {
        if (!window.firebaseAuth) return { error: "Firebase not configured" };
        try {
            const result = await signInWithPopup(window.firebaseAuth, window.googleProvider);
            return { user: result.user };
        } catch (error) {
            console.error("[Auth] Google sign-in error:", error);
            return { error: error.message };
        }
    },

    async logout() {
        if (!window.firebaseAuth) return;
        try {
            await signOut(window.firebaseAuth);
        } catch (error) {
            console.error("[Auth] Logout error:", error);
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
            btnText.textContent = isRegister ? 'Регистрация...' : 'Вход...';
            if (submitBtn) submitBtn.disabled = true;
            submitBtn.classList.add('opacity-70');

            const result = isRegister
                ? await Auth.register(email, password)
                : await Auth.login(email, password);

            if (result.error) {
                // Translate common errors
                if (result.error.includes("auth/invalid-credential")) errorEl.textContent = "Неверный логин или пароль";
                else if (result.error.includes("auth/email-already-in-use")) errorEl.textContent = "Email уже зарегистрирован";
                else if (result.error.includes("auth/weak-password")) errorEl.textContent = "Пароль слишком простой (минимум 6 символов)";
                else errorEl.textContent = result.error;
            } else {
                // Success - close modal
                document.getElementById('auth-modal').classList.add('hidden');
                document.getElementById('auth-modal').classList.remove('flex');
                loginForm.reset();
            }

            btnText.textContent = isRegister ? 'Зарегистрироваться' : 'Войти';
            if (submitBtn) submitBtn.disabled = false;
            submitBtn.classList.remove('opacity-70');
        });
    }

    const btnGoogle = document.getElementById('btn-google-auth');
    if (btnGoogle) {
        btnGoogle.addEventListener('click', async () => {
            const prevHtml = btnGoogle.innerHTML;
            btnGoogle.innerHTML = '<i class="fas fa-circle-notch fa-spin text-gray-500"></i> Загрузка...';
            btnGoogle.disabled = true;

            const result = await Auth.signInWithGoogle();

            if (!result.error) {
                document.getElementById('auth-modal').classList.add('hidden');
                document.getElementById('auth-modal').classList.remove('flex');
            } else {
                const errorEl = document.getElementById('auth-error');
                if (errorEl) errorEl.textContent = "Ошибка входа через Google. Попробуйте снова.";
            }

            btnGoogle.innerHTML = prevHtml;
            btnGoogle.disabled = false;
        });
    }

    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
            await Auth.logout();
        });
    }

    // Toggle Registration/Login Text
    const toggleRegCheckbox = document.getElementById('auth-is-register');
    if (toggleRegCheckbox) {
        toggleRegCheckbox.addEventListener('change', (e) => {
            const btnSubmit = document.getElementById('auth-submit-text');
            if (e.target.checked) {
                btnSubmit.textContent = "Зарегистрироваться";
            } else {
                btnSubmit.textContent = "Войти";
            }
        });
    }
});
