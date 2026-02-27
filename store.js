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
export const Store = {
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
        } catch (e) {
            console.error('[Store] Failed to save board data:', e);
        }
    },

    // ── Drawing (IndexedDB) ─────────────────────────────────────────
    getDrawing() {
        return idbGet('board_drawing');
    },

    saveDrawing(dataUrl) {
        if (!dataUrl) return idbDelete('board_drawing');
        return idbSet('board_drawing', dataUrl);
    },

    clearDrawing() {
        return idbDelete('board_drawing');
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
