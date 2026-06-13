import {
    getAuth,
    signInAnonymously,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";

const SYNC_ID_KEY = 'barakah_sync_id';

// Convert Uint8Array to Base64 string
function bufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Generates a new 256-bit cryptographically secure key for E2EE
function generateSecureSyncId() {
    const array = new Uint8Array(32); // 256-bit key
    window.crypto.getRandomValues(array);
    return bufferToBase64(array);
}

window.Auth = {
    user: null,
    syncId: localStorage.getItem(SYNC_ID_KEY) || null,

    init() {
        if (!window.firebaseAuth) return;

        // Initialize syncId if it doesn't exist
        if (!this.syncId) {
            this.syncId = generateSecureSyncId();
            localStorage.setItem(SYNC_ID_KEY, this.syncId);
            console.log("[Auth] Generated new secure Sync ID.");
        }

        // Display current syncId in UI if it exists
        const syncIdDisplay = document.getElementById('current-sync-id');
        if (syncIdDisplay) {
            syncIdDisplay.textContent = this.syncId;
        }

        onAuthStateChanged(window.firebaseAuth, (user) => {
            if (user) {
                this.user = user;
                console.log("[Auth] Authenticated anonymously. UID:", user.uid);
                
                // Since we removed accounts, all users get access to cloud sync
                window.Auth.isPremium = true; 
                
                const syncStatusEl = document.getElementById('sync-active-status');
                if (syncStatusEl) syncStatusEl.classList.remove('hidden');

                if (window.DbSync && typeof window.DbSync.syncFromCloud === 'function') {
                    window.DbSync.syncFromCloud();
                }
            } else {
                this.user = null;
                console.log("[Auth] No user. Signing in anonymously...");
                signInAnonymously(window.firebaseAuth).catch(error => {
                    console.error("[Auth] Anonymous sign-in failed:", error);
                });
            }
        });
    },

    setSyncId(newSyncId) {
        if (!newSyncId || newSyncId.trim() === '') return false;
        const normalizedId = newSyncId.trim();
        
        // Basic length check for base64url of 32 bytes (usually 43 chars)
        if (normalizedId.length < 20) {
            console.error("[Auth] Sync ID looks too short to be a valid key.");
            return false;
        }

        // Save new Sync ID
        this.syncId = normalizedId;
        localStorage.setItem(SYNC_ID_KEY, this.syncId);
        
        const syncIdDisplay = document.getElementById('current-sync-id');
        if (syncIdDisplay) {
            syncIdDisplay.textContent = this.syncId;
        }

        console.log("[Auth] Sync ID changed successfully.");
        
        // Trigger a fresh cloud download and overwrite local data
        if (window.DbSync && typeof window.DbSync.syncFromCloud === 'function') {
            window.DbSync.syncFromCloud();
        }

        return true;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    window.Auth.init();

    // Sync Modal Logic
    const syncBtn = document.getElementById('auth-btn'); 
    const syncModal = document.getElementById('sync-modal');
    const closeSyncBtn = document.getElementById('sync-close-btn');
    const applySyncBtn = document.getElementById('btn-apply-sync');
    const syncInput = document.getElementById('sync-id-input');

    if (syncBtn && syncModal) {
        syncBtn.addEventListener('click', () => {
            syncModal.classList.remove('hidden');
            syncModal.classList.add('flex');
            
            // Re-render the sync code to make sure it's up to date
            const syncIdDisplay = document.getElementById('current-sync-id');
            if (syncIdDisplay && window.Auth.syncId) {
                syncIdDisplay.textContent = window.Auth.syncId;
            }

            if (syncInput) syncInput.value = ''; // clear previous input
        });
    }

    if (closeSyncBtn && syncModal) {
        closeSyncBtn.addEventListener('click', () => {
            syncModal.classList.add('hidden');
            syncModal.classList.remove('flex');
        });
    }

    if (applySyncBtn && syncInput) {
        applySyncBtn.addEventListener('click', () => {
            const newId = syncInput.value;
            if (window.Auth.setSyncId(newId)) {
                if (window.showToast) {
                    window.showToast("Синхронизация обновлена! Загрузка данных...");
                }
                syncModal.classList.add('hidden');
                syncModal.classList.remove('flex');
            } else {
                if (window.showToast) {
                    window.showToast("Неверный формат кода синхронизации.");
                }
            }
        });
    }
});
