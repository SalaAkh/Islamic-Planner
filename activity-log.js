/**
 * ActivityLog — Fire-and-forget user action logger to Firestore
 * + Audit UI: renderAuditLog() renders the last 50 entries in a modal.
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

// ─── Human-readable action labels & icon/color mapping ───────────────────────
const ACTION_META = {
    user_login: { label: 'Вход в аккаунт', icon: 'fa-sign-in-alt', color: 'emerald' },
    user_logout: { label: 'Выход из аккаунта', icon: 'fa-sign-out-alt', color: 'gray' },
    user_register: { label: 'Регистрация', icon: 'fa-user-plus', color: 'indigo' },
    task_toggled: { label: 'Задача отмечена', icon: 'fa-check-square', color: 'green' },
    day_saved: { label: 'День сохранён', icon: 'fa-calendar-day', color: 'blue' },
    goals_saved: { label: 'Цели обновлены', icon: 'fa-bullseye', color: 'amber' },
    goal_added: { label: 'Цель добавлена', icon: 'fa-plus-circle', color: 'amber' },
    event_saved: { label: 'Событие сохранено', icon: 'fa-calendar-plus', color: 'violet' },
    event_deleted: { label: 'Событие удалено', icon: 'fa-calendar-times', color: 'red' },
    note_created: { label: 'Стикер создан', icon: 'fa-sticky-note', color: 'yellow' },
    note_deleted: { label: 'Стикер удалён', icon: 'fa-trash-alt', color: 'red' },
    drawing_saved: { label: 'Рисунок сохранён', icon: 'fa-paint-brush', color: 'pink' },
    drawing_stroke_saved: { label: 'Штрих на доске', icon: 'fa-pen', color: 'pink' },
    drawing_cleared: { label: 'Рисунок очищен', icon: 'fa-eraser', color: 'red' },
    backup_exported: { label: 'Резервная копия создана', icon: 'fa-download', color: 'teal' },
    backup_imported: { label: 'Данные восстановлены', icon: 'fa-upload', color: 'teal' },
};

const COLOR_CLASS = {
    emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    gray: 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-300',
    indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    violet: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
    pink: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300',
    teal: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300',
};

function formatTimestamp(ts) {
    if (!ts) return '';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    const now = new Date();
    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (mins < 1) return 'только что';
    if (mins < 60) return `${mins} мин назад`;
    if (hours < 24) return `${hours} ч назад`;

    const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();
    const time = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

    if (isToday) return `сегодня ${time}`;
    if (isYesterday) return `вчера ${time}`;
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) + ` ${time}`;
}

function buildMetaLabel(action, meta) {
    if (!meta) return '';
    const parts = [];
    if (meta.date) parts.push(meta.date);
    if (meta.state) parts.push(meta.state === 'done' ? '✓ выполнено' : '× снято');
    if (meta.task) parts.push(`"${meta.task}"`);
    if (meta.title) parts.push(`"${meta.title}"`);
    if (meta.type) parts.push(meta.type === 'ahirat' ? 'Ахират' : 'Дунья');
    if (meta.color) parts.push({ yellow: '🟡 жёлтый', green: '🟢 зелёный', blue: '🔵 синий' }[meta.color] || meta.color);
    if (meta.method) parts.push(meta.method === 'google' ? 'Google' : 'Email');
    if (meta.filename) parts.push(meta.filename);
    return parts.join(' · ');
}

function renderEntry(doc) {
    const data = doc.data();
    const info = ACTION_META[data.action] || { label: data.action, icon: 'fa-circle', color: 'gray' };
    const colorCls = COLOR_CLASS[info.color] || COLOR_CLASS.gray;
    const metaStr = buildMetaLabel(data.action, data.meta);

    return `
<div class="flex items-start gap-3 py-2.5 border-b border-gray-50 dark:border-slate-800/60 last:border-0 hover:bg-gray-50 dark:hover:bg-slate-800/30 rounded-xl px-2 -mx-2 transition-colors">
    <div class="shrink-0 w-8 h-8 rounded-lg ${colorCls} flex items-center justify-center text-xs mt-0.5">
        <i class="fas ${info.icon}"></i>
    </div>
    <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-tight">${info.label}</p>
        ${metaStr ? `<p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">${metaStr}</p>` : ''}
    </div>
    <span class="text-[11px] text-gray-400 dark:text-slate-500 shrink-0 mt-0.5 whitespace-nowrap">${formatTimestamp(data.timestamp)}</span>
</div>`;
}

// ─── Main ActivityLog object ──────────────────────────────────────────────────
window.ActivityLog = {

    /** Log a user action to Firestore (fire-and-forget). */
    async log(action, meta = {}) {
        if (!window.firebaseDb || !window.Auth?.user) return;
        try {
            const uid = window.Auth.user.uid;
            const colRef = collection(window.firebaseDb, `users/${uid}/activity_log`);
            await addDoc(colRef, { action, meta, timestamp: serverTimestamp() });
            console.log(`[ActivityLog] ✔ ${action}`, meta);
            this._pruneOldEntries(uid, colRef).catch(() => { });
        } catch (e) {
            console.warn('[ActivityLog] Failed to log action:', e);
        }
    },

    /** Remove entries beyond MAX_LOG_ENTRIES (keeps latest). */
    async _pruneOldEntries(uid, colRef) {
        try {
            const snapshot = await getDocs(query(colRef, orderBy('timestamp', 'asc')));
            const total = snapshot.size;
            if (total <= MAX_LOG_ENTRIES) return;
            const toDelete = snapshot.docs.slice(0, total - MAX_LOG_ENTRIES);
            await Promise.all(toDelete.map(d => deleteDoc(d.ref)));
            console.log(`[ActivityLog] Pruned ${toDelete.length} old entries.`);
        } catch (e) {
            console.warn('[ActivityLog] Prune failed:', e);
        }
    },

    /** Fetch last 50 entries and render them in #audit-log-list */
    async renderAuditLog() {
        const listEl = document.getElementById('audit-log-list');
        if (!listEl) return;

        listEl.innerHTML = `<div class="flex items-center justify-center py-12 text-gray-300"><i class="fas fa-circle-notch fa-spin text-2xl"></i></div>`;

        if (!window.firebaseDb || !window.Auth?.user) {
            listEl.innerHTML = `<p class="text-center text-sm text-gray-400 py-8">Войдите в аккаунт, чтобы увидеть историю.</p>`;
            return;
        }

        try {
            const uid = window.Auth.user.uid;
            const colRef = collection(window.firebaseDb, `users/${uid}/activity_log`);
            const snap = await getDocs(query(colRef, orderBy('timestamp', 'desc'), limit(50)));

            if (snap.empty) {
                listEl.innerHTML = `<p class="text-center text-sm text-gray-400 py-10">История пока пуста — начните пользоваться планировщиком 🌱</p>`;
                return;
            }

            listEl.innerHTML = snap.docs.map(renderEntry).join('');
        } catch (e) {
            console.error('[ActivityLog] renderAuditLog error:', e);
            listEl.innerHTML = `<p class="text-center text-sm text-red-400 py-8">Ошибка загрузки истории.</p>`;
        }
    },

    /** Wire up open/close buttons for the audit modal. */
    initAuditModal() {
        const btnOpen = document.getElementById('btn-audit-log');
        const btnClose = document.getElementById('audit-modal-close');
        const modal = document.getElementById('audit-modal');
        if (!modal) return;

        btnOpen?.addEventListener('click', () => {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            this.renderAuditLog();
        });

        const closeModal = () => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        };

        btnClose?.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeModal();
        });
    }
};

// Auto-init modal wiring when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.ActivityLog.initAuditModal();
});
