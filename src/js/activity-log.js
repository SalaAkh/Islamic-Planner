/**
 * ActivityLog — Fire-and-forget user action logger to Firestore
 * + Audit UI: renderAuditLog() renders the last 50 entries with premium styling.
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

const PREMIUM_COLORS = {
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', iconText: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-500/20' },
    green: { bg: 'bg-green-50 dark:bg-green-500/10', iconText: 'text-green-600 dark:text-green-400', border: 'border-green-200 dark:border-green-500/20' },
    gray: { bg: 'bg-slate-100 dark:bg-slate-800', iconText: 'text-slate-600 dark:text-slate-400', border: 'border-slate-200 dark:border-slate-700' },
    indigo: { bg: 'bg-indigo-50 dark:bg-indigo-500/10', iconText: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-500/20' },
    blue: { bg: 'bg-blue-50 dark:bg-blue-500/10', iconText: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-500/20' },
    amber: { bg: 'bg-amber-50 dark:bg-amber-500/10', iconText: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-500/20' },
    violet: { bg: 'bg-violet-50 dark:bg-violet-500/10', iconText: 'text-violet-600 dark:text-violet-400', border: 'border-violet-200 dark:border-violet-500/20' },
    yellow: { bg: 'bg-yellow-50 dark:bg-yellow-500/10', iconText: 'text-yellow-600 dark:text-yellow-400', border: 'border-yellow-200 dark:border-yellow-500/20' },
    pink: { bg: 'bg-pink-50 dark:bg-pink-500/10', iconText: 'text-pink-600 dark:text-pink-400', border: 'border-pink-200 dark:border-pink-500/20' },
    red: { bg: 'bg-red-50 dark:bg-red-500/10', iconText: 'text-red-600 dark:text-red-400', border: 'border-red-200 dark:border-red-500/20' },
    teal: { bg: 'bg-teal-50 dark:bg-teal-500/10', iconText: 'text-teal-600 dark:text-teal-400', border: 'border-teal-200 dark:border-teal-500/20' },
};

function formatTimestamp(ts) {
    if (!ts) return '';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    const now = new Date();
    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    const t = window.t || (k => k);

    if (mins < 1) return t('time_just_now') || 'только что';
    if (mins < 60) return `${mins} ${t('time_mins_ago') || 'мин назад'}`;
    if (hours < 24) return `${hours} ${t('time_hours_ago') || 'ч назад'}`;

    const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();
    const time = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

    if (isToday) return `${t('time_today') || 'сегодня'} ${time}`;
    if (isYesterday) return `${t('time_yesterday') || 'вчера'} ${time}`;
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) + ` ${time}`;
}

function buildMetaLabel(action, meta) {
    if (!meta) return '';
    const parts = [];
    const t = window.t || (k => k);
    if (meta.date) parts.push(meta.date);
    if (meta.state) parts.push(meta.state === 'done' ? `✓ ${t('state_done')}` : `× ${t('state_undone')}`);
    if (meta.task) parts.push(`<span class="font-bold">"${meta.task}"</span>`);
    if (meta.title) parts.push(`<span class="font-bold">"${meta.title}"</span>`);
    if (meta.type) parts.push(meta.type === 'ahirat' ? (t('type_ahirat') || 'Ахират') : (t('type_dunya') || 'Дунья'));
    if (meta.color) parts.push(t('log_color_' + meta.color) || meta.color);
    if (meta.method) parts.push(meta.method === 'google' ? 'Google' : 'Email');
    if (meta.filename) parts.push(meta.filename);
    return parts.join(' · ');
}

function renderEntry(doc, index) {
    const data = doc.data();
    const info = ACTION_META[data.action] || { label: data.action, icon: 'fa-box', color: 'gray' };
    const styles = PREMIUM_COLORS[info.color] || PREMIUM_COLORS.gray;
    const label = (window.t && window.t('log_' + data.action)) || info.label;
    const metaStr = buildMetaLabel(data.action, data.meta);

    return `
<div class="audit-animate-in relative flex gap-4 sm:gap-6 w-full group overflow-visible" style="animation-delay: ${index * 0.03}s">
    <div class="absolute left-[19px] top-[40px] bottom-[-24px] w-[2px] bg-slate-200 dark:bg-slate-800 group-last:hidden"></div>
    <div class="relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${styles.bg} ${styles.iconText} ring-4 ring-slate-50 dark:ring-slate-900 border ${styles.border}">
        <i class="fas ${info.icon} text-sm"></i>
    </div>
    <div class="flex-1 pb-6 w-full min-w-0">
        <div class="bg-white dark:bg-slate-800 rounded-[18px] p-4 sm:p-5 border border-slate-200/60 dark:border-slate-700 shadow-sm group-hover:shadow-md transition-shadow relative overflow-hidden h-full">
            <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-transparent to-${info.color}-500/5 dark:to-${info.color}-500/10 rounded-bl-full pointer-events-none"></div>
            <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-1.5 w-full relative z-10">
                <h4 class="font-bold text-slate-800 dark:text-slate-100 text-[15px] leading-tight">${label}</h4>
                <div class="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/50 px-2.5 py-1 rounded-lg shrink-0 w-fit">
                    <i class="far fa-clock"></i> ${formatTimestamp(data.timestamp)}
                </div>
            </div>
            ${metaStr ? `<div class="text-[13px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed relative z-10 break-words"><span class="mr-1.5 opacity-60"><i class="fas fa-info-circle"></i></span>${metaStr}</div>` : ''}
        </div>
    </div>
</div>`;
}

// ─── Main ActivityLog object ──────────────────────────────────────────────────
window.ActivityLog = {

    /** Log a user action to Firestore (fire-and-forget). */
    async log(action, meta = {}, timestamp = null) {
        // Wait a bit if firebase isn't ready yet
        if (!window.firebaseDb) {
            console.log('[ActivityLog] Waiting for Firebase...');
            setTimeout(() => this.log(action, meta, timestamp), 1000);
            return;
        }

        if (!window.Auth?.user) {
            // If not logged in, we can't save to Firestore. 
            // We just ignore or buffer if we're still in the middle of auth init.
            return;
        }

        try {
            const uid = window.Auth.user.uid;
            const colRef = collection(window.firebaseDb, `users/${uid}/activity_log`);
            const logData = {
                action,
                meta,
                timestamp: timestamp ? (timestamp instanceof Date ? timestamp : new Date(timestamp)) : serverTimestamp()
            };

            await addDoc(colRef, logData);
            console.log(`[ActivityLog] ✔ ${action}`, meta);
            this._pruneOldEntries(uid, colRef).catch(() => { });
        } catch (e) {
            console.warn('[ActivityLog] Failed to log action:', e);
        }
    },

    /** Move buffered logs to Firestore. */
    async _flushBuffer() {
        if (!window._activityLogBuffer || window._activityLogBuffer.length === 0) return;
        console.log(`[ActivityLog] Flushing ${window._activityLogBuffer.length} buffered logs...`);
        const buffer = [...window._activityLogBuffer];
        window._activityLogBuffer = []; // Clear immediately to avoid duplicates

        for (const entry of buffer) {
            await this.log(entry.action, entry.meta, entry.timestamp);
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
        const t = window.t || (k => k);

        listEl.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full min-h-[300px] text-slate-400 m-auto">
                <div class="relative w-16 h-16 flex items-center justify-center mb-6">
                    <div class="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-slate-800"></div>
                    <div class="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
                    <i class="fas fa-sync-alt text-indigo-500 text-xl absolute"></i>
                </div>
                <p class="text-sm font-bold tracking-widest uppercase opacity-80 text-indigo-600 dark:text-indigo-400">${t('log_syncing')}</p>
            </div>
        `;

        if (!window.firebaseDb || !window.Auth?.user) {
            listEl.innerHTML = `
                <div class="flex flex-col items-center justify-center h-full min-h-[300px] px-6 text-center m-auto">
                    <div class="w-20 h-20 rounded-[1.5rem] bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center mb-5 border border-slate-200 dark:border-slate-700 shadow-inner">
                        <i class="fas fa-user-lock text-3xl text-slate-400"></i>
                    </div>
                    <h4 class="text-xl font-bold text-slate-800 dark:text-white mb-2 tracking-tight">${t('log_no_access_title')}</h4>
                    <p class="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-[260px] mx-auto hidden sm:block">
                        ${t('log_no_access_desc')}
                    </p>
                    <p class="text-sm text-slate-500 dark:text-slate-400 leading-relaxed sm:hidden">
                        ${t('log_no_access_desc')}
                    </p>
                </div>
            `;
            return;
        }

        try {
            const uid = window.Auth.user.uid;
            const colRef = collection(window.firebaseDb, `users/${uid}/activity_log`);
            const snap = await getDocs(query(colRef, orderBy('timestamp', 'desc'), limit(50)));

            if (snap.empty) {
                listEl.innerHTML = `
                    <div class="flex flex-col items-center justify-center h-full min-h-[300px] px-6 text-center m-auto">
                        <div class="relative w-24 h-24 mb-6">
                            <div class="absolute inset-0 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-xl scale-150 animate-pulse"></div>
                            <div class="relative w-full h-full rounded-[2rem] bg-gradient-to-br from-indigo-50 dark:from-slate-800/80 to-white dark:to-slate-900 flex items-center justify-center border border-indigo-100/50 dark:border-slate-700 shadow-[0_8px_16px_-6px_rgba(99,102,241,0.2)]">
                                <i class="fas fa-seedling text-5xl text-indigo-400 dark:text-indigo-500"></i>
                            </div>
                        </div>
                        <h4 class="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mb-3 tracking-tight">${t('log_empty_title')}</h4>
                        <p class="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-[280px] mx-auto">
                            ${t('log_empty_desc')}
                        </p>
                    </div>
                `;
                return;
            }

            listEl.innerHTML = snap.docs.map((d, i) => renderEntry(d, i)).join('');
        } catch (e) {
            console.error('[ActivityLog] renderAuditLog error:', e);
            listEl.innerHTML = `
                <div class="flex flex-col items-center justify-center h-full min-h-[300px] text-red-500/80 text-center m-auto">
                    <div class="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 flex items-center justify-center mb-4 text-red-400">
                        <i class="fas fa-exclamation-triangle text-3xl"></i>
                    </div>
                    <p class="font-bold text-slate-800 dark:text-slate-200">${t('log_error_title')}</p>
                    <p class="text-xs mt-1 text-slate-500">${t('log_error_desc')}</p>
                </div>
            `;
        }
    },

    /** Wire up open/close buttons for the audit modal. */
    initAuditModal() {
        const btnOpen = document.getElementById('btn-audit-log');
        const btnClose = document.getElementById('audit-modal-close');
        const modal = document.getElementById('audit-modal');
        if (!modal) return;

        const closeModal = () => {
            modal.classList.add('opacity-0', 'pointer-events-none');
            setTimeout(() => {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }, 300);
        };

        btnOpen?.addEventListener('click', () => {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            // Allow display change to take effect before animating opacity
            requestAnimationFrame(() => {
                modal.classList.remove('opacity-0', 'pointer-events-none');
            });
            setTimeout(() => {
                this.renderAuditLog();
            }, 50);
        });

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
    // Use a small delay to ensure Auth.user is populated before flushing
    setTimeout(() => {
        window.ActivityLog._flushBuffer();
    }, 2000);
});
