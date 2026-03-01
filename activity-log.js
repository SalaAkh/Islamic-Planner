/**
 * ActivityLog — Fire-and-forget user action logger to Firestore
 * Structure: users/{uid}/activity_log/{auto-id}
 * Each doc: { action: string, meta: object, timestamp: serverTimestamp }
 * Max 200 entries per user (oldest auto-pruned).
 */
import {
    collection,
    addDoc,
    serverTimestamp,
    getDocs,
    query,
    orderBy,
    limit,
    deleteDoc,
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const MAX_LOG_ENTRIES = 200;

window.ActivityLog = {
    /**
     * Log a user action to Firestore.
     * @param {string} action - Action type slug (e.g. 'task_toggled', 'event_saved')
     * @param {object} meta   - Any extra context (date, noteId, etc.)
     */
    async log(action, meta = {}) {
        if (!window.firebaseDb || !window.Auth?.user) return;

        try {
            const uid = window.Auth.user.uid;
            const colRef = collection(window.firebaseDb, `users/${uid}/activity_log`);

            await addDoc(colRef, {
                action,
                meta,
                timestamp: serverTimestamp(),
            });

            console.log(`[ActivityLog] ✔ ${action}`, meta);

            // Prune old entries if over limit (async, non-blocking)
            this._pruneOldEntries(uid, colRef).catch(() => { });
        } catch (e) {
            console.warn('[ActivityLog] Failed to log action:', e);
        }
    },

    async _pruneOldEntries(uid, colRef) {
        try {
            const snapshot = await getDocs(
                query(colRef, orderBy('timestamp', 'asc'))
            );
            const total = snapshot.size;
            if (total <= MAX_LOG_ENTRIES) return;

            const toDelete = snapshot.docs.slice(0, total - MAX_LOG_ENTRIES);
            await Promise.all(toDelete.map(d => deleteDoc(d.ref)));
            console.log(`[ActivityLog] Pruned ${toDelete.length} old entries.`);
        } catch (e) {
            console.warn('[ActivityLog] Prune failed:', e);
        }
    }
};
