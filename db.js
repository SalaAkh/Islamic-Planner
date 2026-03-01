import { doc, setDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

window.DbSync = {
    async syncToCloud(key, data) {
        if (!window.firebaseDb || !window.Auth || !window.Auth.user) return;
        try {
            const uid = window.Auth.user.uid;
            // Structure: users/UID/data/KEY
            const docRef = doc(window.firebaseDb, `users/${uid}/data`, key);
            await setDoc(docRef, data);
            console.log(`[Sync] Cloud saved: ${key}`);
        } catch (e) {
            console.error('[Sync] Error saving to cloud:', e);
        }
    },

    async syncFromCloud() {
        if (!window.firebaseDb || !window.Auth || !window.Auth.user) return;

        try {
            const uid = window.Auth.user.uid;
            const dataCol = collection(window.firebaseDb, `users/${uid}/data`);
            const snapshot = await getDocs(dataCol);

            if (snapshot.empty) {
                // To prevent data leakage, we only upload local data if we are CERTAIN it's the current user's.
                // If the cloud is empty, but we have local data, it could be leftover from a previous user.
                const localKeys = Object.keys(localStorage).filter(k => k.startsWith('barakah_'));

                if (localKeys.length > 0) {
                    console.log(`[Sync] Cloud empty, found ${localKeys.length} local keys. Uploading to new account...`);
                    await this.initialUpload();
                } else {
                    console.log("[Sync] Fresh account, no local data to upload.");
                }
                document.dispatchEvent(new CustomEvent('cloudDataSynced'));
                return;
            }

            console.log("[Sync] Downloading cloud data...");
            for (const docSnap of snapshot.docs) {
                const key = docSnap.id;
                const data = docSnap.data();

                if (key === 'goals') {
                    localStorage.setItem('barakah_goals', JSON.stringify(data));
                } else if (key === 'settings_ai') {
                    if (data.apiKey && typeof window.encryptApiKey === 'function') {
                        window.encryptApiKey(data.apiKey);
                        if (window.aiAssistant) window.aiAssistant.apiKey = data.apiKey;
                    }
                } else if (key === 'board_state') {
                    localStorage.setItem('barakah_board_state', JSON.stringify(data));
                } else if (key === 'board_drawing') {
                    if (data.dataUrl && window.Store && typeof window.Store.saveDrawing === 'function') {
                        // Flag to prevent recursion
                        window._isSyncingDrawing = true;
                        await window.Store.saveDrawing(data.dataUrl);
                        window._isSyncingDrawing = false;
                    }
                } else if (key === 'events') {
                    localStorage.setItem('barakah_events', JSON.stringify(data));
                } else if (key.startsWith('day_')) {
                    localStorage.setItem(`barakah_${key}`, JSON.stringify(data));
                }
            }

            console.log("[Sync] Download complete. Refreshing UI...");
            document.dispatchEvent(new CustomEvent('cloudDataSynced'));

            if (window.loadDay) window.loadDay(window.currentDate);
            if (window.loadGoals) window.loadGoals();

        } catch (e) {
            console.error('[Sync] Error reading from cloud:', e);
        }
    },

    async initialUpload() {
        try {
            const goals = localStorage.getItem('barakah_goals');
            if (goals) await this.syncToCloud('goals', JSON.parse(goals));

            const aiKey = typeof window.decryptApiKey === 'function'
                ? await window.decryptApiKey()
                : localStorage.getItem('barakah_ai_key');
            if (aiKey) await this.syncToCloud('settings_ai', { apiKey: aiKey });

            const board = localStorage.getItem('barakah_board_state');
            if (board) await this.syncToCloud('board_state', JSON.parse(board));

            const events = localStorage.getItem('barakah_events');
            if (events) await this.syncToCloud('events', JSON.parse(events));

            if (window.Store && typeof window.Store.getDrawing === 'function') {
                const drawing = await window.Store.getDrawing();
                if (drawing) await this.syncToCloud('board_drawing', { dataUrl: drawing });
            }

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('barakah_day_')) {
                    const data = localStorage.getItem(key);
                    const cloudKey = key.replace('barakah_', ''); // day_2026-10-10
                    await this.syncToCloud(cloudKey, JSON.parse(data));
                }
            }
            console.log("[Sync] Initial upload complete.");
        } catch (e) {
            console.error('[Sync] Error in initial upload:', e);
        }
    }
};
