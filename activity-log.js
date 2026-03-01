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
    emerald: { bg: 'bg-emerald-50 dark:bg-slate-800/60', icon: 'text-emerald-500 bg-white dark:bg-emerald-500/10', border: 'border-emerald-100 dark:border-emerald-500/20' },
    green: { bg: 'bg-green-50 dark:bg-slate-800/60', icon: 'text-green-500 bg-white dark:bg-green-500/10', border: 'border-green-100 dark:border-green-500/20' },
    gray: { bg: 'bg-slate-50 dark:bg-slate-800/40', icon: 'text-slate-500 bg-white dark:bg-slate-700/50', border: 'border-slate-200 dark:border-slate-700' },
    indigo: { bg: 'bg-indigo-50 dark:bg-slate-800/60', icon: 'text-indigo-500 bg-white dark:bg-indigo-500/10', border: 'border-indigo-100 dark:border-indigo-500/20' },
    blue: { bg: 'bg-blue-50 dark:bg-slate-800/60', icon: 'text-blue-500 bg-white dark:bg-blue-500/10', border: 'border-blue-100 dark:border-blue-500/20' },
    amber: { bg: 'bg-amber-50 dark:bg-slate-800/60', icon: 'text-amber-500 bg-white dark:bg-amber-500/10', border: 'border-amber-100 dark:border-amber-500/20' },
    violet: { bg: 'bg-violet-50 dark:bg-slate-800/60', icon: 'text-violet-500 bg-white dark:bg-violet-500/10', border: 'border-violet-100 dark:border-violet-500/20' },
    yellow: { bg: 'bg-yellow-50 dark:bg-slate-800/60', icon: 'text-yellow-600 bg-white dark:bg-yellow-500/10', border: 'border-yellow-200 dark:border-yellow-500/20' },
    pink: { bg: 'bg-pink-50 dark:bg-slate-800/60', icon: 'text-pink-500 bg-white dark:bg-pink-500/10', border: 'border-pink-100 dark:border-pink-500/20' },
    red: { bg: 'bg-red-50 dark:bg-slate-800/60', icon: 'text-red-500 bg-white dark:bg-red-500/10', border: 'border-red-100 dark:border-red-500/20' },
    teal: { bg: 'bg-teal-50 dark:bg-slate-800/60', icon: 'text-teal-500 bg-white dark:bg-teal-500/10', border: 'border-teal-100 dark:border-teal-500/20' },
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
    if (meta.task) parts.push(`<span class="font-bold">"${meta.task}"</span>`);
    if (meta.title) parts.push(`<span class="font-bold">"${meta.title}"</span>`);
    if (meta.type) parts.push(meta.type === 'ahirat' ? 'Ахират' : 'Дунья');
    if (meta.color) parts.push({ yellow: '🟡 жёлтый', green: '🟢 зелёный', blue: '🔵 синий' }[meta.color] || meta.color);
    if (meta.method) parts.push(meta.method === 'google' ? 'Google' : 'Email');
    if (meta.filename) parts.push(meta.filename);
    return parts.join(' · ');
}

function renderEntry(doc, index) {
    const data = doc.data();
    const info = ACTION_META[data.action] || { label: data.action, icon: 'fa-box', color: 'gray' };
    const styles = PREMIUM_COLORS[info.color] || PREMIUM_COLORS.gray;
    const metaStr = buildMetaLabel(data.action, data.meta);

    return `
<div class="audit-animate-in relative group rounded-2xl p-4 sm:p-5 mb-3 border ${styles.border} ${styles.bg} hover:shadow-xl hover:shadow-${info.color}-500/5 hover:-translate-y-1 hover:-translate-x-1 transition-all duration-300" style="animation-delay: ${index * 0.04}s">
    <div class="flex items-start gap-3 sm:gap-4 relative z-10 w-full">
        <div class="shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-[1rem] ${styles.icon} border border-slate-100 dark:border-slate-700/50 flex items-center justify-center text-lg shadow-sm group-hover:scale-110 group-hover:rotate-[5deg] transition-transform duration-300">
            <i class="fas ${info.icon}"></i>
        </div>
        <div class="flex-1 min-w-0 flex flex-col mt-0.5">
            <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-2 mb-1.5 w-full">
                <p class="text-[15px] sm:text-base font-bold text-slate-800 dark:text-gray-100 leading-tight">${info.label}</p>
                <div class="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-white/60 dark:bg-slate-800 px-2.5 py-1 rounded-lg shrink-0 border border-slate-200/50 dark:border-slate-700/50 w-fit">
                    <i class="far fa-clock"></i> ${formatTimestamp(data.timestamp)}
                </div>
            </div>
            ${metaStr ? `<div class="text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed bg-white/70 dark:bg-slate-900/50 p-2.5 px-3.5 rounded-xl border border-slate-100 dark:border-slate-700/30 mt-1 shadow-sm"><i class="fas fa-info-circle opacity-50 text-xs mr-1"></i> ${metaStr}</div>` : ''}
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

        listEl.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full min-h-[300px] text-slate-400 m-auto">
                <div class="relative w-16 h-16 flex items-center justify-center mb-6">
                    <div class="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-slate-800"></div>
                    <div class="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
                    <i class="fas fa-sync-alt text-indigo-500 text-xl absolute"></i>
                </div>
                <p class="text-sm font-bold tracking-widest uppercase opacity-80 text-indigo-600 dark:text-indigo-400">Синхронизация...</p>
            </div>
        `;

        if (!window.firebaseDb || !window.Auth?.user) {
            listEl.innerHTML = `
                <div class="flex flex-col items-center justify-center h-full min-h-[300px] px-6 text-center m-auto">
                    <div class="w-20 h-20 rounded-[1.5rem] bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center mb-5 border border-slate-200 dark:border-slate-700 shadow-inner">
                        <i class="fas fa-user-lock text-3xl text-slate-400"></i>
                    </div>
                    <h4 class="text-xl font-bold text-slate-800 dark:text-white mb-2 tracking-tight">Доступ ограничен</h4>
                    <p class="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-[260px] mx-auto hidden sm:block">
                        Войдите в аккаунт, чтобы история действий сохранялась и была доступна на всех устройствах.
                    </p>
                    <p class="text-sm text-slate-500 dark:text-slate-400 leading-relaxed sm:hidden">
                        Войдите в аккаунт, чтобы просматривать историю.
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
                        <h4 class="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mb-3 tracking-tight">История пока пуста</h4>
                        <p class="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-[280px] mx-auto">
                            Начните планировать свой день, и здесь появятся ваши первые шаги 🌱
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
                    <p class="font-bold text-slate-800 dark:text-slate-200">Ошибка загрузки данных</p>
                    <p class="text-xs mt-1 text-slate-500">Проверьте подключение к интернету</p>
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

        btnOpen?.addEventListener('click', () => {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            // Slight delay for animation to feel smoother
            setTimeout(() => {
                this.renderAuditLog();
            }, 100);
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
    // Use a small delay to ensure Auth.user is populated before flushing
    setTimeout(() => {
        window.ActivityLog._flushBuffer();
    }, 2000);
});
