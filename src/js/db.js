import { doc, setDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

// ============================================================================
// E2E Encryption Utils
// ============================================================================

function base64ToBuffer(b64) {
    // Add padding if missing
    b64 = b64.padEnd(b64.length + (4 - b64.length % 4) % 4, '=');
    const binary = window.atob(b64.replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

function bufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

class E2E {
    static async getKey() {
        if (!window.Auth || !window.Auth.syncId) throw new Error("No Sync ID");
        const rawKey = base64ToBuffer(window.Auth.syncId);
        return window.crypto.subtle.importKey(
            "raw",
            rawKey,
            { name: "AES-GCM" },
            false,
            ["encrypt", "decrypt"]
        );
    }

    static async getWorkspaceHash() {
        if (!window.Auth || !window.Auth.syncId) throw new Error("No Sync ID");
        const rawKey = new TextEncoder().encode(window.Auth.syncId);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', rawKey);
        return bufferToBase64(hashBuffer);
    }

    static async encryptData(dataObj) {
        const key = await this.getKey();
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encodedData = new TextEncoder().encode(JSON.stringify(dataObj));
        
        const encryptedContent = await window.crypto.subtle.encrypt(
            { name: "AES-GCM", iv: iv },
            key,
            encodedData
        );
        
        return {
            ciphertext: bufferToBase64(encryptedContent),
            iv: bufferToBase64(iv)
        };
    }

    static async decryptData(encryptedBlob) {
        if (!encryptedBlob || !encryptedBlob.ciphertext || !encryptedBlob.iv) return null;
        try {
            const key = await this.getKey();
            const iv = base64ToBuffer(encryptedBlob.iv);
            const ciphertext = base64ToBuffer(encryptedBlob.ciphertext);
            
            const decryptedBuffer = await window.crypto.subtle.decrypt(
                { name: "AES-GCM", iv: iv },
                key,
                ciphertext
            );
            
            const decodedString = new TextDecoder().decode(decryptedBuffer);
            return JSON.parse(decodedString);
        } catch (e) {
            console.error("[E2E] Decryption failed. Incorrect Sync ID?", e);
            return null;
        }
    }
}

// ============================================================================
// Database Sync Logic
// ============================================================================

window.DbSync = {
    _syncTimers: {},

    _cleanUndefined(obj) {
        if (obj === null || obj === undefined) return null;
        if (Array.isArray(obj)) {
            return obj.map(item => this._cleanUndefined(item));
        }
        if (typeof obj === 'object') {
            if (Object.prototype.toString.call(obj) !== '[object Object]') {
                return obj;
            }
            const cleaned = {};
            for (const [k, v] of Object.entries(obj)) {
                if (v !== undefined) {
                    cleaned[k] = this._cleanUndefined(v);
                }
            }
            return cleaned;
        }
        return obj;
    },

    async syncToCloud(key, data) {
        if (!window.firebaseDb || !window.Auth || !window.Auth.syncId) return;

        // Debounce: Clear existing timer for this key
        if (this._syncTimers[key]) {
            clearTimeout(this._syncTimers[key]);
        }

        // Set a new timer to sync after 1.5 seconds of inactivity
        this._syncTimers[key] = setTimeout(async () => {
            try {
                const workspaceHash = await E2E.getWorkspaceHash();
                const docRef = doc(window.firebaseDb, `workspaces/${workspaceHash}/data`, key);
                
                let docContent = data;
                if (Array.isArray(data)) {
                    docContent = { _isArray: true, items: data };
                }
                
                docContent = this._cleanUndefined(docContent);
                
                // End-to-End Encrypt before sending to Firebase
                const encryptedPayload = await E2E.encryptData(docContent);
                
                await setDoc(docRef, encryptedPayload);
                console.log(`[Sync] Cloud saved: ${key} (Encrypted)`);
            } catch (e) {
                console.error('[Sync] Error saving to cloud:', e);
            }
        }, 1500);
    },

    async syncReminderToCloud(event, dateString) {
        if (!window.firebaseDb || !window.Auth || !window.Auth.syncId) return;

        // Only set reminders if there is a specific time
        if (event.allDay || !event.time) {
            await this.deleteReminderFromCloud(event.id);
            return;
        }

        try {
            const workspaceHash = await E2E.getWorkspaceHash();
            const reminderRef = doc(window.firebaseDb, `workspaces/${workspaceHash}/reminders`, event.id);

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
                notified: false
            };

            // Encrypt Reminder Data
            const encryptedPayload = await E2E.encryptData(reminderData);

            await setDoc(reminderRef, encryptedPayload);
            console.log(`[Sync] Reminder set for ${event.id}`);
        } catch (e) {
            console.error('[Sync] Error syncing reminder:', e);
        }
    },

    async deleteReminderFromCloud(eventId) {
        if (!window.firebaseDb || !window.Auth || !window.Auth.syncId) return;

        try {
            const workspaceHash = await E2E.getWorkspaceHash();
            const { deleteDoc } = await import("https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js");
            const reminderRef = doc(window.firebaseDb, `workspaces/${workspaceHash}/reminders`, eventId);
            await deleteDoc(reminderRef);
            console.log(`[Sync] Reminder deleted for ${eventId}`);
        } catch (e) {
            console.error('[Sync] Error deleting reminder:', e);
        }
    },

    async syncFromCloud() {
        if (!window.firebaseDb || !window.Auth || !window.Auth.syncId) return;

        try {
            const workspaceHash = await E2E.getWorkspaceHash();
            const dataCol = collection(window.firebaseDb, `workspaces/${workspaceHash}/data`);
            const snapshot = await getDocs(dataCol);

            if (snapshot.empty) {
                const localKeys = Object.keys(localStorage).filter(k => k.startsWith('barakah_') && k !== 'barakah_sync_id');

                if (localKeys.length > 0) {
                    console.log(`[Sync] Cloud empty, found ${localKeys.length} local keys. Uploading to new E2EE workspace...`);
                    await this.initialUpload();
                } else {
                    console.log("[Sync] Fresh workspace, no local data to upload.");
                }
                document.dispatchEvent(new CustomEvent('cloudDataSynced'));
                return;
            }

            console.log("[Sync] Downloading and decrypting cloud data...");
            for (const docSnap of snapshot.docs) {
                const key = docSnap.id;
                const encryptedPayload = docSnap.data();
                
                // Decrypt
                let data = await E2E.decryptData(encryptedPayload);
                
                if (!data) {
                    console.warn(`[Sync] Failed to decrypt document: ${key}. Skipping.`);
                    continue; // Skip if decryption fails
                }
                
                // Unpack array if it was wrapped by db.js
                if (data && data._isArray) {
                    data = data.items || [];
                }

                if (key === 'goals') {
                    localStorage.setItem('barakah_goals', JSON.stringify(data));
                } else if (key === 'board_state') {
                    localStorage.setItem('barakah_board_state', JSON.stringify(data));
                } else if (key === 'board_drawing') {
                    if (data.dataUrl && window.Store && typeof window.Store.saveDrawing === 'function') {
                        window._isSyncingDrawing = true;
                        await window.Store.saveDrawing(data.dataUrl);
                        window._isSyncingDrawing = false;
                    }
                } else if (key === 'events') {
                    localStorage.setItem('barakah_events', JSON.stringify(data));
                } else if (key === 'todo_lists') {
                    localStorage.setItem('barakah_todo_lists', JSON.stringify(data));
                } else if (key === 'mindmap') {
                    localStorage.setItem('barakah_mindmap', JSON.stringify(data));
                } else if (key === 'user_stats') {
                    localStorage.setItem('barakah_user_stats', JSON.stringify(data));
                } else if (key.startsWith('day_')) {
                    localStorage.setItem(`barakah_${key}`, JSON.stringify(data));
                }
            }

            console.log("[Sync] Download and decryption complete. Refreshing UI...");
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

            const mindmap = localStorage.getItem('barakah_mindmap');
            if (mindmap) await this.syncToCloud('mindmap', JSON.parse(mindmap));

            const userStats = localStorage.getItem('barakah_user_stats');
            if (userStats) await this.syncToCloud('user_stats', JSON.parse(userStats));

            if (window.Store && typeof window.Store.getDrawing === 'function') {
                const drawing = await window.Store.getDrawing();
                if (drawing) await this.syncToCloud('board_drawing', { dataUrl: drawing });
            }

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('barakah_day_')) {
                    const data = localStorage.getItem(key);
                    const cloudKey = key.replace('barakah_', '');
                    await this.syncToCloud(cloudKey, JSON.parse(data));
                }
            }
            console.log("[Sync] Initial upload complete.");
        } catch (e) {
            console.error('[Sync] Error in initial upload:', e);
        }
    }
};
