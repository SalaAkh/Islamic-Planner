/**
 * Barakah Store — Centralized state management
 * - LocalStorage: lightweight text/checkbox data (fast, sync)
 * - IndexedDB:    heavy binary data like canvas drawings (no size limit)
 */

// =====================================================================
// INDEXEDDB — for heavy drawing data (no 5MB limit!)
// =====================================================================
const DB_NAME = 'barakah_db';
const DB_VERSION = 1;
const STORE_NAME = 'drawings';

function openDb() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
        req.onsuccess = (e) => resolve(e.target.result);
        req.onerror = (e) => reject(e.target.error);
    });
}

async function idbGet(key) {
    try {
        const db = await openDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const req = tx.objectStore(STORE_NAME).get(key);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    } catch (e) {
        console.warn('[Store] IndexedDB read failed:', e);
        return undefined;
    }
}

async function idbSet(key, value) {
    try {
        const db = await openDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const req = tx.objectStore(STORE_NAME).put(value, key);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    } catch (e) {
        console.warn('[Store] IndexedDB write failed:', e);
    }
}

async function idbDelete(key) {
    try {
        const db = await openDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const req = tx.objectStore(STORE_NAME).delete(key);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    } catch (e) {
        console.warn('[Store] IndexedDB delete failed:', e);
    }
}

// =====================================================================
// LOCALSTORAGE — for lightweight text/state data (fast, sync)
// =====================================================================
window.Store = {
    // ── Daily Planner ──────────────────────────────────────────────
    getDayData(dateString) {
        try {
            const data = localStorage.getItem(`barakah_day_${dateString}`);
            return data ? JSON.parse(data) : { tasks: {}, texts: {}, checkboxes: {} };
        } catch (e) {
            return { tasks: {}, texts: {}, checkboxes: {} };
        }
    },

    saveDayData(dateString, data) {
        try {
            localStorage.setItem(`barakah_day_${dateString}`, JSON.stringify(data));
            if (window.DbSync) window.DbSync.syncToCloud(`day_${dateString}`, data);
        } catch (e) {
            console.error('[Store] Failed to save day data:', e);
        }
    },

    // ── Goals ───────────────────────────────────────────────────────
    getGoals() {
        try {
            const goals = localStorage.getItem('barakah_goals');
            return goals ? JSON.parse(goals) : {};
        } catch (e) {
            return {};
        }
    },

    saveGoals(goals) {
        try {
            localStorage.setItem('barakah_goals', JSON.stringify(goals));
            if (window.DbSync) window.DbSync.syncToCloud('goals', goals);
        } catch (e) {
            console.error('[Store] Failed to save goals:', e);
        }
    },

    // ── Board State (notes + viewport) ─────────────────────────────
    getBoardData() {
        try {
            const board = localStorage.getItem('barakah_board_state');
            return board ? JSON.parse(board) : {
                notes: [],
                viewport: { x: 0, y: 0, zoom: 1 }
            };
        } catch (e) {
            return { notes: [], viewport: { x: 0, y: 0, zoom: 1 } };
        }
    },

    saveBoardData(boardData) {
        try {
            // Strip drawingData before saving to LocalStorage — it's too heavy!
            const { drawingData, ...lightData } = boardData;
            localStorage.setItem('barakah_board_state', JSON.stringify(lightData));

            // Sync to cloud
            if (window.DbSync) window.DbSync.syncToCloud('board_state', lightData);
        } catch (e) {
            console.error('[Store] Failed to save board data:', e);
        }
    },

    // ── Drawing (IndexedDB) ─────────────────────────────────────────
    getDrawing() {
        return idbGet('board_drawing');
    },

    saveDrawing(dataUrl) {
        if (!dataUrl) {
            if (window.DbSync && !window._isSyncingDrawing) window.DbSync.syncToCloud('board_drawing', { dataUrl: null });
            return idbDelete('board_drawing');
        }
        if (window.DbSync && !window._isSyncingDrawing) window.DbSync.syncToCloud('board_drawing', { dataUrl });
        return idbSet('board_drawing', dataUrl);
    },

    clearDrawing() {
        if (window.DbSync && !window._isSyncingDrawing) window.DbSync.syncToCloud('board_drawing', { dataUrl: null });
        return idbDelete('board_drawing');
    },

    // ── Events & Reminders ─────────────────────────────────────────
    getEvents() {
        try {
            const events = localStorage.getItem('barakah_events');
            return events ? JSON.parse(events) : {};
        } catch (e) {
            return {};
        }
    },

    getEventsForDate(dateString) {
        const all = this.getEvents();
        return all[dateString] || [];
    },

    saveEvent(dateString, event) {
        const all = this.getEvents();
        if (!all[dateString]) all[dateString] = [];
        // Check if editing existing event by id
        const idx = all[dateString].findIndex(e => e.id === event.id);
        if (idx >= 0) {
            all[dateString][idx] = event;
        } else {
            all[dateString].push(event);
        }
        try {
            localStorage.setItem('barakah_events', JSON.stringify(all));
            if (window.DbSync) window.DbSync.syncToCloud('events', all);
        } catch (e) {
            console.error('[Store] Failed to save event:', e);
        }
    },

    deleteEvent(dateString, eventId) {
        const all = this.getEvents();
        if (!all[dateString]) return;
        all[dateString] = all[dateString].filter(e => e.id !== eventId);
        if (all[dateString].length === 0) delete all[dateString];
        try {
            localStorage.setItem('barakah_events', JSON.stringify(all));
            if (window.DbSync) window.DbSync.syncToCloud('events', all);
        } catch (e) {
            console.error('[Store] Failed to delete event:', e);
        }
    },

    // ── Data Backup & Restore (SurviveKit) ─────────────────────────
    async exportAllData() {
        const data = {
            localStorage: {},
            indexedDB: {}
        };
        // 1. Gather all LocalStorage keys starting with barakah_
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('barakah_')) {
                data.localStorage[key] = localStorage.getItem(key);
            }
        }
        // 2. Gather IndexedDB drawing
        try {
            const drawing = await this.getDrawing();
            if (drawing) {
                data.indexedDB['board_drawing'] = drawing;
            }
        } catch (e) {
            console.error('[Store] Export DB error:', e);
        }
        return JSON.stringify(data);
    },

    async importAllData(jsonData) {
        try {
            const data = JSON.parse(jsonData);

            // 1. Restore LocalStorage
            if (data.localStorage) {
                // Clear ONLY barakah_ keys to avoid orphan data
                const keysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key.startsWith('barakah_')) keysToRemove.push(key);
                }
                keysToRemove.forEach(k => localStorage.removeItem(k));

                for (const [key, value] of Object.entries(data.localStorage)) {
                    localStorage.setItem(key, value);
                }
            }

            // 2. Restore IndexedDB
            if (data.indexedDB && data.indexedDB['board_drawing']) {
                await this.saveDrawing(data.indexedDB['board_drawing']);
            } else {
                await this.clearDrawing();
            }

            return true;
        } catch (e) {
            console.error('[Store] Import error:', e);
            throw e;
        }
    }
};
