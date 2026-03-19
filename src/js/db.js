import { doc, setDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

window.DbSync = {
    _syncTimers: {},

    async syncToCloud(key, data) {
        if (!window.firebaseDb || !window.Auth || !window.Auth.user) return;

        // Debounce: Clear existing timer for this key
        if (this._syncTimers[key]) {
            clearTimeout(this._syncTimers[key]);
        }

        // Set a new timer to sync after 1.5 seconds of inactivity
        this._syncTimers[key] = setTimeout(async () => {
            try {
                const uid = window.Auth.user.uid;
                // Structure: users/UID/data/KEY
                const docRef = doc(window.firebaseDb, `users/${uid}/data`, key);
                await setDoc(docRef, data);
                console.log(`[Sync] Cloud saved: ${key} (debounced)`);
            } catch (e) {
                console.error('[Sync] Error saving to cloud:', e);
            }
        }, 1500);
    },

    async syncReminderToCloud(event, dateString) {
        if (!window.firebaseDb || !window.Auth || !window.Auth.user || !window.Auth.user.email) return;

        // Only set reminders if there is a specific time
        if (event.allDay || !event.time) {
            await this.deleteReminderFromCloud(event.id);
            return;
        }

        try {
            const uid = window.Auth.user.uid;
            // Structure: users/UID/reminders/EVENT_ID
            const reminderRef = doc(window.firebaseDb, `users/${uid}/reminders`, event.id);

            // Calculate exact trigger time from date and time
            const dateTimeStr = `${dateString}T${event.time}:00`;
            const eventDateObj = new Date(dateTimeStr);
            let triggerDate = new Date(eventDateObj.getTime());

            if (event.alert === '5min') triggerDate.setMinutes(triggerDate.getMinutes() - 5);
            else if (event.alert === '15min') triggerDate.setMinutes(triggerDate.getMinutes() - 15);
            else if (event.alert === '30min') triggerDate.setMinutes(triggerDate.getMinutes() - 30);
            else if (event.alert === '1hour') triggerDate.setHours(triggerDate.getHours() - 1);
            else if (event.alert === '1day') triggerDate.setDate(triggerDate.getDate() - 1);

            // Если событие в прошлом, не ставим напоминание
            if (triggerDate < new Date()) {
                await this.deleteReminderFromCloud(event.id);
                return;
            }

            const reminderData = {
                title: event.title,
                eventTime: event.time,
                eventDate: dateString,
                triggerTime: triggerDate.toISOString(),
                userEmail: window.Auth.user.email,
                sendEmail: !!event.sendEmail,
                notified: false
            };

            await setDoc(reminderRef, reminderData);
            console.log(`[Sync] Reminder set for ${event.id}`);
        } catch (e) {
            console.error('[Sync] Error syncing reminder:', e);
        }
    },

    async deleteReminderFromCloud(eventId) {
        if (!window.firebaseDb || !window.Auth || !window.Auth.user) return;

        try {
            const uid = window.Auth.user.uid;
            const { deleteDoc } = await import("https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js");
            const reminderRef = doc(window.firebaseDb, `users/${uid}/reminders`, eventId);
            await deleteDoc(reminderRef);
            console.log(`[Sync] Reminder deleted for ${eventId}`);
        } catch (e) {
            console.error('[Sync] Error deleting reminder:', e);
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
                } else if (key === 'todo_lists') {
                    localStorage.setItem('barakah_todo_lists', JSON.stringify(data));
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
            document.dispatchEvent(new CustomEvent('cloudDataSynced'));
        }
    },

    async initialUpload() {
        try {
            const goals = localStorage.getItem('barakah_goals');
            if (goals) await this.syncToCloud('goals', JSON.parse(goals));

            const board = localStorage.getItem('barakah_board_state');
            if (board) await this.syncToCloud('board_state', JSON.parse(board));

            const events = localStorage.getItem('barakah_events');
            if (events) await this.syncToCloud('events', JSON.parse(events));

            const todoLists = localStorage.getItem('barakah_todo_lists');
            if (todoLists) await this.syncToCloud('todo_lists', JSON.parse(todoLists));

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
