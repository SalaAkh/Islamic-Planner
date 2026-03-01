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

        const btnSync = document.getElementById('auth-login-view'); // use modal as poor man's indicator
        try {
            const uid = window.Auth.user.uid;
            const dataCol = collection(window.firebaseDb, `users/${uid}/data`);
            const snapshot = await getDocs(dataCol);

            if (snapshot.empty) {
                console.log("[Sync] Cloud is empty, uploading local data...");
                await this.initialUpload();
                return;
            }

            console.log("[Sync] Downloading cloud data...");
            snapshot.forEach(doc => {
                const key = doc.id;
                const data = doc.data();
                if (key === 'goals') {
                    localStorage.setItem('barakah_goals', JSON.stringify(data));
                } else if (key.startsWith('day_')) {
                    localStorage.setItem(`barakah_${key}`, JSON.stringify(data));
                }
            });
            console.log("[Sync] Download complete. Refreshing UI...");
            // trigger UI refresh or just reload for simplicity
            document.dispatchEvent(new CustomEvent('cloudDataSynced'));

            // To ensure UI updates immediately
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

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith('barakah_day_')) {
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
