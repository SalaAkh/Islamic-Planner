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

const COLOR_CLASS = {
    emerald: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    green: 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/20',
    gray: 'bg-slate-500/20 text-slate-500 dark:text-slate-400 border-slate-500/20',
    indigo: 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    blue: 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/20',
    amber: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/20',
    violet: 'bg-violet-500/20 text-violet-600 dark:text-violet-400 border-violet-500/20',
    yellow: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
    pink: 'bg-pink-500/20 text-pink-600 dark:text-pink-400 border-pink-500/20',
    red: 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/20',
    teal: 'bg-teal-500/20 text-teal-600 dark:text-teal-400 border-teal-500/20',
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
    const info = ACTION_META[data.action] || { label: data.action, icon: 'fa-circle', color: 'gray' };
    const colorCls = COLOR_CLASS[info.color] || COLOR_CLASS.gray;
    const metaStr = buildMetaLabel(data.action, data.meta);

    return `
<div class="audit-entry-wrapper audit-animate-in" style="animation-delay: ${index * 0.05}s">
    <div class="audit-timeline-line"></div>
    <div class="flex items-start gap-5 py-4 audit-entry-hover group">
        <div class="shrink-0 w-11 h-11 rounded-2xl ${colorCls} border flex items-center justify-center text-base audit-icon-container shadow-sm">
            <i class="fas ${info.icon}"></i>
        </div>
        <div class="flex-1 min-w-0 pt-0.5">
            <div class="flex justify-between items-start gap-2 mb-1">
                <p class="text-[15px] font-bold text-gray-900 dark:text-white leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">${info.label}</p>
                <span class="text-[11px] font-bold text-gray-400 dark:text-slate-500 shrink-0 uppercase tracking-tighter whitespace-nowrap bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-full">${formatTimestamp(data.timestamp)}</span>
            </div>
            ${metaStr ? `<p class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">${metaStr}</p>` : ''}
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
            <div class="flex flex-col items-center justify-center py-20 text-indigo-500/40">
                <i class="fas fa-circle-notch fa-spin text-4xl mb-4"></i>
                <p class="text-sm font-bold tracking-widest uppercase opacity-60">Синхронизация...</p>
            </div>
        `;

        if (!window.firebaseDb || !window.Auth?.user) {
            listEl.innerHTML = `
                <div class="flex flex-col items-center justify-center py-16 px-4 text-center">
                    <div class="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6 opacity-50">
                        <i class="fas fa-user-lock text-3xl text-slate-400"></i>
                    </div>
                    <h4 class="text-lg font-bold text-gray-800 dark:text-white mb-2">Доступ ограничен</h4>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Пожалуйста, войдите в аккаунт, чтобы история действий стала доступна.</p>
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
                    <div class="flex flex-col items-center justify-center py-16 px-4 text-center">
                        <div class="w-24 h-24 rounded-[2rem] bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mb-8">
                            <i class="fas fa-seedling text-5xl text-indigo-300 dark:text-indigo-800 animate-pulse"></i>
                        </div>
                        <h4 class="text-xl font-extrabold text-gray-900 dark:text-white mb-3">История пока пуста</h4>
                        <p class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-[240px] mx-auto">
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
                <div class="flex flex-col items-center justify-center py-16 text-red-500/60 text-center">
                    <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
                    <p class="font-bold">Не удалось загрузить данные</p>
                    <p class="text-xs mt-1 opacity-70">Проверьте подключение к интернету</p>
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
