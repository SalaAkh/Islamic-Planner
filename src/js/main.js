var escapeHtml = escapeHtml || ((str) => (window.escapeHtml || ((s) => { if (typeof s !== 'string') return ''; const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }))(str));
// State
let currentDate = new Date(); // День, который открыт в планировщике
let calendarDate = new Date(); // Месяц, который открыт в календаре

// monthNames handled dynamically via Intl.DateTimeFormat in renderDailyPlanner and renderCalendar

window.loadDay = () => typeof renderDailyPlanner === 'function' && renderDailyPlanner();
window.loadGoals = () => typeof renderDynamicGoals === 'function' && renderDynamicGoals();


document.addEventListener('DOMContentLoaded', () => {
    // Dynamic manifest loading to prevent CORS on file:// protocol
    if (window.location.protocol !== 'file:') {
        const link = document.createElement('link');
        link.rel = 'manifest';
        link.href = './public/manifest.json';
        document.head.appendChild(link);
    }

    if (typeof initI18n === 'function') {
        initI18n();
    }

    initTabs();
    initDailyPlanner();
    initCalendar();
    initGoals();
    initBackupRestore();
    initTheme();
    initDonationToast();
    initEvents();
    initAIPanner();
    initConsentBanner();
    initSidebarDrawer();

    // Обновление при смене языка
    document.addEventListener('langChanged', () => {
        if (document.getElementById('view-daily').classList.contains('active')) {
            renderDailyPlanner();
        } else if (document.getElementById('view-calendar').classList.contains('active')) {
            renderCalendar();
        }
    });

    // Remove skeleton loader when cloud data is ready
    document.addEventListener('cloudDataSynced', () => {
        const appWrapper = document.getElementById('app-wrapper');
        if (appWrapper) {
            appWrapper.classList.remove('animate-pulse', 'pointer-events-none');
        }
    });

    // Collaborative and workspace updates
    document.addEventListener('groupEventsUpdated', () => {
        renderCalendar();
    });

    document.addEventListener('groupTodoListsUpdated', () => {
        if (window.todoManager && typeof window.todoManager.loadTodoLists === 'function') {
            window.todoManager.loadTodoLists();
        }
    });

    document.addEventListener('groupDayUpdated', (e) => {
        const { dateString } = e.detail;
        if (dateString === formatDate(currentDate)) {
            renderDailyPlanner();
        }
    });

    document.addEventListener('workspaceChanged', (e) => {
        renderCalendar();
        if (window.todoManager && typeof window.todoManager.loadTodoLists === 'function') {
            window.todoManager.loadTodoLists();
        }
        renderDailyPlanner();
        
        if (window.Groups && typeof window.Groups.renderGroupsUI === 'function') {
            window.Groups.renderGroupsUI();
            window.Groups.renderWorkspaceSwitcher();
        }

        const notebook = document.querySelector('.notebook-page');
        if (notebook) {
            if (window.currentGroupId) {
                notebook.classList.add('ring-4', 'ring-emerald-500/20');
            } else {
                notebook.classList.remove('ring-4', 'ring-emerald-500/20');
            }
        }
    });

    // Fallback: remove skeleton after 5s even if no internet/sync fails
    setTimeout(() => {
        const appWrapper = document.getElementById('app-wrapper');
        if (appWrapper) {
            appWrapper.classList.remove('animate-pulse', 'pointer-events-none');
        }
    }, 5000);
});

// --- DONATION TOAST LOGIC ---
let donationToastTimeout;
window.showDonationToast = function () {
    const toast = document.getElementById('donation-toast');
    if (!toast) return;
    toast.classList.remove('-translate-y-[150%]', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');

    // Auto hide after 5 seconds
    clearTimeout(donationToastTimeout);
    donationToastTimeout = setTimeout(() => {
        if (window.hideDonationToast) window.hideDonationToast();
    }, 5000);
};

window.hideDonationToast = function () {
    const toast = document.getElementById('donation-toast');
    if (!toast) return;
    toast.classList.add('-translate-y-[150%]', 'opacity-0');
    toast.classList.remove('translate-y-0', 'opacity-100');
};

window.showDonateModal = function () {
    if (window.hideDonationToast) window.hideDonationToast();
    const modal = document.getElementById('donate-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
};

function initDonationToast() {
    // Show initially after short delay to not overlap with initial animations
    setTimeout(window.showDonationToast, 3000);
    // Repeat every 5 minutes (300000 ms)
    setInterval(window.showDonationToast, 300000);
}

// --- TABS LOGIC ---
function centerActiveTab() {
    const activeTab = document.querySelector('.tab-btn.active') || document.querySelector('.planner-tabs .active');
    const tabsContainer = document.querySelector('.planner-tabs');
    if (activeTab && tabsContainer) {
        const containerRect = tabsContainer.getBoundingClientRect();
        const tabRect = activeTab.getBoundingClientRect();
        const scrollLeft = tabsContainer.scrollLeft;
        const tabLeftRelative = tabRect.left - containerRect.left + scrollLeft;
        tabsContainer.scrollTo({
            left: tabLeftRelative - (containerRect.width / 2) + (tabRect.width / 2),
            behavior: 'smooth'
        });
    }
}

function initTabs() {
    const tabs = document.querySelectorAll('.planner-tabs button');

    // Оборачиваем все страницы в контейнер для 3D трансформаций
    const pagesContainer = document.querySelector('.page-view').parentElement;
    if (pagesContainer && !pagesContainer.classList.contains('page-flip-container')) {
        pagesContainer.classList.add('page-flip-container');
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const currentActivePage = document.querySelector('.page-view.active');
            const viewName = tab.getAttribute('data-tab');
            const targetPage = document.getElementById('view-' + viewName);

            // Если кликаем на ту же активную вкладку - ничего не делаем
            if (currentActivePage === targetPage) {
                centerActiveTab();
                return;
            }

            // Обновляем состояние вкладок
            document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
            tab.classList.add('active');
            centerActiveTab();

            if (currentActivePage) {
                // Запускаем анимацию ухода
                currentActivePage.classList.remove('active', 'page-flip-in');
                currentActivePage.classList.add('page-flip-out');

                // Ждем окончания анимации (0.55s), затем скрываем полностью
                setTimeout(() => {
                    currentActivePage.classList.remove('page-flip-out');
                }, 550);
            }

            // Показываем новую страницу с анимацией появления
            document.querySelectorAll('.page-view').forEach(el => {
                if (el !== targetPage && el !== currentActivePage) {
                    el.classList.remove('active', 'page-flip-in', 'page-flip-out');
                }
            });

            targetPage.classList.add('active', 'page-flip-in');

            // Загружаем данные если нужно
            if (viewName === 'calendar' && document.getElementById('calendar-body').innerHTML.trim() === '') {
                renderCalendar();
            }

            if (viewName === 'boards') {
                if (typeof initBoardsDashboard === 'function') initBoardsDashboard();
            }

            if (viewName === 'mindmap') {
                if (typeof initMindMap === 'function' && !window._mindMapInitialized) {
                    initMindMap();
                    window._mindMapInitialized = true;
                }
            }

            if (viewName === 'groups') {
                if (window.Groups && typeof window.Groups.renderGroupsUI === 'function') {
                    window.Groups.renderGroupsUI();
                }
            }

            // Render daily wisdom on first visit or tab switch
            if (viewName === 'wisdom') {
                if (typeof renderDailyWisdom === 'function') renderDailyWisdom();
            }

            // Recalculate heights for textareas in daily view if it becomes active
            if (viewName === 'daily') {
                document.querySelectorAll('#view-daily textarea.day-input').forEach(input => {
                    input.style.height = 'auto';
                    if (input.scrollHeight > 0) {
                        input.style.height = input.scrollHeight + 'px';
                    }
                });
            }
        });
    });

    // Центрируем активную вкладку при загрузке страницы и ресайзе
    setTimeout(centerActiveTab, 150);
    window.addEventListener('resize', centerActiveTab);
}

function switchToTab(viewName) {
    const tabEl = document.querySelector(`button[data-tab="${viewName}"]`);
    if (tabEl) {
        tabEl.click();
    }
}

// --- DAILY PLANNER LOGIC ---
function formatDate(date) {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
}

function animateDateChange(direction, updateCallback) {
    const gridContainer = document.querySelector('#view-daily > div.grid');
    const headerPanel = document.querySelector('#date-display').closest('.rounded-2xl');

    if (!gridContainer || !headerPanel) {
        updateCallback();
        return;
    }

    const outClass = direction === 'next' ? 'date-slide-out-next' : 'date-slide-out-prev';
    const inClass = direction === 'next' ? 'date-slide-in-next' : 'date-slide-in-prev';

    gridContainer.classList.add('date-anim-container', outClass);
    headerPanel.classList.add('date-anim-container', outClass);

    setTimeout(() => {
        updateCallback();

        gridContainer.classList.remove(outClass);
        gridContainer.classList.add(inClass);

        headerPanel.classList.remove(outClass);
        headerPanel.classList.add(inClass);

        setTimeout(() => {
            gridContainer.classList.remove('date-anim-container', inClass);
            headerPanel.classList.remove('date-anim-container', inClass);
        }, 350);
    }, 350);
}

function initDailyPlanner() {

    document.getElementById('prev-day').addEventListener('click', () => {
        animateDateChange('prev', () => {
            currentDate.setDate(currentDate.getDate() - 1);
            renderDailyPlanner();
        });
    });

    document.getElementById('next-day').addEventListener('click', () => {
        animateDateChange('next', () => {
            currentDate.setDate(currentDate.getDate() + 1);
            renderDailyPlanner();
        });
    });

    // Event Delegation for dynamic elements
    const plannerContainer = document.getElementById('view-daily');

    plannerContainer.addEventListener('input', (e) => {
        if (e.target.tagName.toLowerCase() === 'textarea' && e.target.classList.contains('day-input')) {
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
        }
        if (e.target.classList.contains('day-input') || e.target.classList.contains('day-checkbox')) {
            saveDailyData();
        }
    });

    plannerContainer.addEventListener('change', (e) => {
        if (e.target.classList.contains('day-checkbox')) {
            saveDailyData();
            
            // GA4 Event: Activation tracking
            if (e.target.checked && typeof gtag === 'function') {
                gtag('event', 'ibadah_checked', { namaz: e.target.getAttribute('data-id') });
            }
        }
    });

    plannerContainer.addEventListener('click', (e) => {
        // Handle task toggle (checkboxes)
        const toggleBtn = e.target.closest('.task-toggle');
        if (toggleBtn) {
            toggleTask(toggleBtn);
            saveDailyData();
            return;
        }

        // Handle delete dynamic task button
        const delBtn = e.target.closest('.delete-dyn-task');
        if (delBtn) {
            const row = delBtn.parentElement;
            if (row) {
                row.remove();
                saveDailyData();
            }
            return;
        }

        // Handle Add Task button
        const addBtn = e.target.closest('.add-task-btn');
        if (addBtn) {
            const listContainer = addBtn.parentElement.previousElementSibling;
            const blockIndex = addBtn.getAttribute('data-block-index') || '1';
            const newIndex = Date.now(); // Unique ID

            const newRow = document.createElement('div');
            newRow.className = 'flex items-center group';
            const taskToggleLabel = (window.t && window.t('aria_mark_task')) || 'Отметить задачу';
            const newTaskLabel = (window.t && window.t('aria_new_task')) || 'Новая задача';
            const newTaskPh = (window.t && window.t('ph_new_task')) || 'Новая задача...';
            const deleteTitle = (window.t && window.t('btn_delete_goal')) || 'Удалить';
            newRow.innerHTML = `
                <button data-task-id="t_dyn_${blockIndex}_${newIndex}" aria-label="${taskToggleLabel}" class="task-toggle shrink-0 mr-3"></button>
                <textarea data-id="task_dyn_${blockIndex}_${newIndex}" id="task_dyn_${blockIndex}_${newIndex}" name="task_dyn_${blockIndex}_${newIndex}" rows="1" style="resize:none; overflow:hidden;" placeholder="${newTaskPh}" autocomplete="off" aria-label="${newTaskLabel}" class="ruled-input handwriting day-input placeholder-slate-400 dark:placeholder-slate-500 w-full"></textarea>
                <button type="button" class="delete-dyn-task text-red-500 opacity-30 hover:opacity-100 transition-all p-2 shrink-0 ml-2 cursor-pointer relative z-50" title="${deleteTitle}"><i class="fas fa-trash text-sm pointer-events-none"></i></button>
            `;

            if (listContainer) {
                listContainer.appendChild(newRow);
                newRow.querySelector('textarea').focus();
                saveDailyData();
            }
        }
    });

    renderDailyPlanner();
}

function renderDailyPlanner() {
    const dateStr = formatDate(currentDate);
    if (window.Groups && typeof window.Groups.syncActiveDay === 'function') {
        window.Groups.syncActiveDay(dateStr);
    }
    const data = Store.getDayData(dateStr);

    // Update header
    const todayStr = formatDate(new Date());
    const lang = localStorage.getItem('barakah_lang') || 'ru';
    const monthFormat = new Intl.DateTimeFormat(lang, { month: 'long' });
    let monthName = monthFormat.format(currentDate);
    monthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);

    let displayStr = `${currentDate.getDate()} ${monthName}`;
    if (dateStr === todayStr) {
        const todayWord = (window.translations && window.translations[lang] && window.translations[lang]['date_val_today']) || 'Сегодня';
        displayStr += ` (${todayWord})`;
    }
    const displayInput = document.getElementById('date-display');
    displayInput.value = displayStr;
    document.getElementById('hijri-date-display').innerText = getHijriDate(currentDate);

    // Load inputs
    // For dynamic tasks, we need to rebuild the HTML if necessary, 
    // but building proper HTML serialization requires more complex logic.
    // Given the time, we'll restore inputs IF they exist in HTML. 
    // To support returning dynamic inputs after reload, we inject them into the DOM first.

    // First, clear all dynamic tasks to prevent duplicates on date switch
    document.querySelectorAll('.day-input[data-id^="task_dyn_"]').forEach(el => el.parentElement.remove());

    // Reconstruct dynamic inputs from saved data
    if (data.texts) {
        Object.keys(data.texts).forEach(key => {
            if (key.startsWith('task_dyn_') && !document.querySelector(`[data-id="${key}"]`)) {
                // Parse block index: task_dyn_{blockIndex}_{timestamp}
                const parts = key.split('_');
                let blockIndex = '1';
                let dynId = parts[2];
                if (parts.length >= 4) {
                    blockIndex = parts[2];
                    dynId = parts[2] + '_' + parts[3];
                }

                const addBtn = document.querySelector(`.add-task-btn[data-block-index="${blockIndex}"]`);
                const container = addBtn ? addBtn.parentElement.previousElementSibling : document.querySelector('.add-task-btn').parentElement.previousElementSibling;

                if (container) {
                    const newRow = document.createElement('div');
                    newRow.className = 'flex items-center group';
                    const deleteTitle = (window.t && window.t('btn_delete_goal')) || 'Удалить';
                    newRow.innerHTML = `
                        <button data-task-id="t_dyn_${dynId}" aria-label="Отметить задачу" class="task-toggle shrink-0 mr-3"></button>
                        <textarea data-id="${key}" id="${key}" name="${key}" rows="1" style="resize:none; overflow:hidden;" autocomplete="off" aria-label="Задача" class="ruled-input handwriting day-input placeholder-slate-400 dark:placeholder-slate-500 w-full"></textarea>
                        <button type="button" class="delete-dyn-task text-red-500 opacity-30 hover:opacity-100 transition-all p-2 shrink-0 ml-2 cursor-pointer relative z-50" title="${deleteTitle}"><i class="fas fa-trash text-sm pointer-events-none"></i></button>
                    `;
                    container.appendChild(newRow);
                }
            }
        });
    }

    // Now populate all values
    document.querySelectorAll('.day-input').forEach(input => {
        const id = input.getAttribute('data-id');
        input.value = data.texts && data.texts[id] ? data.texts[id] : '';

        if (input.tagName.toLowerCase() === 'textarea') {
            input.style.height = 'auto';
            if (input.scrollHeight > 0) {
                input.style.height = input.scrollHeight + 'px';
            }
        }

        // Restore task line-through
        if (id && id.startsWith('task')) {
            if (data.tasks && data.tasks[id]) {
                input.classList.add('line-through', 'text-gray-400', 'opacity-60');
            } else {
                input.classList.remove('line-through', 'text-gray-400', 'opacity-60');
            }
        }
    });

    // Load task buttons
    document.querySelectorAll('.task-toggle').forEach(btn => {
        const targetInputId = btn.nextElementSibling.getAttribute('data-id');
        if (data.tasks && data.tasks[targetInputId]) {
            btn.classList.add('task-done');
        } else {
            btn.classList.remove('task-done');
        }
    });

    // Load checkboxes (if any remain)
    document.querySelectorAll('.day-checkbox').forEach(chk => {
        const id = chk.getAttribute('data-id');
        chk.checked = data.checkboxes && data.checkboxes[id] ? !!data.checkboxes[id] : false;
    });

    updateIbadahProgress();
    document.dispatchEvent(new CustomEvent('dateChanged', { detail: dateStr }));
}

function saveDailyData() {
    const dateStr = formatDate(currentDate);
    const existing = Store.getDayData(dateStr);
    const data = { texts: {}, checkboxes: {}, tasks: {}, tasbih: existing.tasbih };

    document.querySelectorAll('.day-input').forEach(input => {
        data.texts[input.getAttribute('data-id')] = input.value;
    });

    document.querySelectorAll('.day-checkbox').forEach(chk => {
        data.checkboxes[chk.getAttribute('data-id')] = chk.checked;
    });

    document.querySelectorAll('.task-toggle').forEach(btn => {
        const targetInputId = btn.nextElementSibling.getAttribute('data-id');
        data.tasks[targetInputId] = btn.classList.contains('task-done');
    });

    Store.saveDayData(dateStr, data);
    updateIbadahProgress();
    showToast();
}

function updateIbadahProgress() {
    const dateStr = formatDate(currentDate);
    const data = Store.getDayData(dateStr);

    const checkboxes = document.querySelectorAll('.day-checkbox');
    const total = checkboxes.length;
    let checked = 0;

    checkboxes.forEach(chk => {
        chk.disabled = false;
        const label = chk.closest('label');
        if (label) {
            label.classList.remove('opacity-50', 'cursor-not-allowed');
            label.classList.add('cursor-pointer');
        }
        if (chk.checked) checked++;
    });

    const percentage = total > 0 ? Math.round((checked / total) * 100) : 0;
    const bar = document.getElementById('ibadah-progress-bar');
    const progressText = document.getElementById('ibadah-progress-text');
    const feedback = document.getElementById('ibadah-feedback');

    if (progressText) progressText.innerText = percentage;
    if (bar) {
        bar.style.width = percentage + '%';

        // Reset classes
        bar.className = 'h-1.5 rounded-full transition-all duration-500 ease-out';

        if (percentage === 100 && total > 0) {
            bar.classList.add('bg-amber-500', 'shadow-[0_0_15px_rgba(245,158,11,0.5)]');
        } else {
            bar.classList.add('bg-green-700');
        }
    }

    if (feedback) {
        const lang = localStorage.getItem('barakah_lang') || 'ru';
        const t = (key) => (window.translations && window.translations[lang] && window.translations[lang][key]) || key;

        let fbKey = 'ibadah_fb_0';
        if (percentage === 100 && total > 0) {
            fbKey = 'ibadah_fb_full';
        } else if (percentage > 50) {
            fbKey = 'ibadah_fb_high';
        } else if (percentage > 0) {
            fbKey = 'ibadah_fb_low';
        }
        feedback.innerHTML = `<i class="fas fa-star-and-crescent mr-1 text-emerald-600/60 dark:text-emerald-400/60"></i>${t(fbKey)}`;
    }
}

function toggleTask(btn) {
    const input = btn.nextElementSibling;
    if (!btn.classList.contains('task-done')) {
        btn.classList.add('task-done');
        input.classList.add('line-through', 'text-gray-400', 'opacity-60');
        window.ActivityLog?.log('task_toggled', { state: 'done', task: input.value?.slice(0, 60) });
    } else {
        btn.classList.remove('task-done');
        input.classList.remove('line-through', 'text-gray-400', 'opacity-60');
        window.ActivityLog?.log('task_toggled', { state: 'undone', task: input.value?.slice(0, 60) });
    }
}

// --- CALENDAR LOGIC ---
function initCalendar() {
    document.getElementById('prev-month').addEventListener('click', () => {
        calendarDate.setMonth(calendarDate.getMonth() - 1);
        renderCalendar();
    });
    document.getElementById('next-month').addEventListener('click', () => {
        calendarDate.setMonth(calendarDate.getMonth() + 1);
        renderCalendar();
    });

    const notes = document.getElementById('month-notes');
    notes.addEventListener('input', () => {
        const monthStr = `${calendarDate.getFullYear()}-${calendarDate.getMonth()}`;
        const goals = Store.getGoals();
        if (!goals.months) goals.months = {};
        goals.months[monthStr] = notes.value;
        Store.saveGoals(goals);
    });

    renderCalendar();
}

function renderCalendar() {
    const body = document.getElementById('calendar-body');
    const title = document.getElementById('calendar-month-title');
    const notesInput = document.getElementById('month-notes');
    body.innerHTML = '';

    const today = new Date();
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth(); // 0-11

    const lang = localStorage.getItem('barakah_lang') || 'ru';
    let monthNameStr = new Intl.DateTimeFormat(lang, { month: 'long' }).format(new Date(year, month));
    monthNameStr = monthNameStr.charAt(0).toUpperCase() + monthNameStr.slice(1);

    title.innerText = monthNameStr + ' ' + year;

    // Restore monthly notes
    const goals = Store.getGoals();
    const monthStr = `${year}-${month}`;
    notesInput.value = (goals.months && goals.months[monthStr]) ? goals.months[monthStr] : "";

    // Math for days
    const firstDay = new Date(year, month, 1).getDay();
    const shift = firstDay === 0 ? 6 : firstDay - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Build all cells off-screen in a Fragment (one DOM reflow instead of 30+)
    const fragment = document.createDocumentFragment();

    // Empty cells for offset
    for (let i = 0; i < shift; i++) {
        const empty = document.createElement('div');
        empty.className = 'calendar-cell empty';
        fragment.appendChild(empty);
    }

    const monthlyIslamicEvents = [];
    const t = (key) => (window.translations && window.translations[lang] && window.translations[lang][key]) || key;

    // Day cells
    const allEvents = Store.getEvents();
    for (let i = 1; i <= daysInMonth; i++) {
        const currentDate = new Date(year, month, i);
        const dayOfWeek = currentDate.getDay();
        const isSunnahFast = (dayOfWeek === 1 || dayOfWeek === 4);
        const isJumuah = (dayOfWeek === 5);
        const isToday = i === today.getDate() && month === today.getMonth() && year === today.getFullYear();
        const dayDateStr = formatDate(currentDate);
        const dayEvents = allEvents[dayDateStr] || [];
        const hasEvents = dayEvents.length > 0;

        // Hijri calculations
        const hijriComps = getHijriDateComponents(currentDate);
        let isIslamicHoliday = false;
        let isRamadan = false;
        let hijriLabelHtml = '';
        let eventBadgesHtml = '';

        if (hijriComps) {
            const hd = hijriComps.day;
            const hm = hijriComps.month;
            const hy = hijriComps.year;
            const hMonthName = HIJRI_MONTHS[lang] ? HIJRI_MONTHS[lang][hm - 1] : "";

            hijriLabelHtml = `<div class="absolute top-1.5 ltr:right-1.5 rtl:left-1.5 text-[9px] md:text-[10px] text-gray-400 dark:text-gray-500 font-semibold pointer-events-none">${hd} <span class="hidden md:inline">${hMonthName}</span></div>`;

            // Check if this date has matching events
            const matching = ISLAMIC_EVENTS.filter(ev => ev.month === hm && ev.day === hd);
            if (matching.length > 0) {
                isIslamicHoliday = true;
                matching.forEach(ev => {
                    const evName = t(ev.key);
                    const evDesc = t(ev.descKey);
                    monthlyIslamicEvents.push({
                        day: i,
                        hijriDay: hd,
                        hijriMonthName: hMonthName,
                        hijriYear: hy,
                        name: evName,
                        desc: evDesc
                    });

                    if (!eventBadgesHtml) {
                        eventBadgesHtml = `<div class="islamic-event-badge mt-1.5 text-[9px] md:text-[10px] px-1.5 py-0.5 rounded text-center truncate font-bold bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 border border-emerald-500/30 shadow-sm flex items-center justify-center gap-1" title="${escapeHtml(evName)}">🌟 <span class="hidden md:inline">${escapeHtml(evName)}</span></div>`;
                    }
                });
            } else if (hm === 9) {
                isRamadan = true;
                eventBadgesHtml = `<div class="ramadan-day-badge mt-1.5 text-[9px] md:text-[10px] px-1 py-0.5 rounded text-center truncate font-medium bg-amber-500/10 text-amber-800 dark:text-amber-200 border border-amber-500/20 flex items-center justify-center gap-1" title="${hMonthName} ${hd}">🌙 <span class="hidden md:inline">${hd} ${hMonthName}</span></div>`;
            }
        }

        let classes = 'calendar-cell group';
        if (isSunnahFast) classes += ' sunnah-fast';
        if (isJumuah) classes += ' jumuah-day';
        if (isIslamicHoliday) classes += ' islamic-holiday';
        else if (isRamadan) classes += ' ramadan-day';
        if (isToday) classes += ' ring-2 ring-green-500';

        const cell = document.createElement('div');
        cell.className = classes;

        const sunnahText = t('calendar_sunnah_badge');
        const jumuahText = t('calendar_jumuah_badge');
        const planText = t('calendar_plan_tooltip');

        cell.innerHTML = `
            <div class="calendar-date pointer-events-none">${i}</div>
            ${hijriLabelHtml}
            ${isSunnahFast ? '<span class="sunnah-badge">' + sunnahText + '</span>' : ''}
            ${isJumuah ? '<span class="jumuah-badge">' + jumuahText + '</span>' : ''}
            <div class="pointer-events-none w-full">
                ${eventBadgesHtml}
            </div>
            ${hasEvents ? '<div class="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-0.5 pointer-events-none">' + dayEvents.slice(0, 3).map(ev => {
                const colors = { islamic: 'bg-emerald-500', work: 'bg-blue-500', personal: 'bg-purple-500', family: 'bg-rose-500', health: 'bg-amber-500' };
                return '<div class="w-1.5 h-1.5 rounded-full ' + (colors[ev.eventType] || 'bg-emerald-500') + '"></div>';
            }).join('') + (dayEvents.length > 3 ? '<span class="text-[8px] text-gray-400">+' + (dayEvents.length - 3) + '</span>' : '') + '</div>' : ''}
            <div class="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-2 ltr:right-2 rtl:left-2 text-xs text-green-700 font-bold"><i class="fas fa-edit"></i> ${planText}</div>
        `;

        cell.addEventListener('click', (e) => {
            e.stopPropagation();
            if (hasEvents) {
                openEventsPopup(dayDateStr, dayEvents);
            } else {
                openEventModal(dayDateStr);
            }
        });

        fragment.appendChild(cell);
    }

    body.appendChild(fragment);

    // Рендерим список исламских событий этого месяца
    const eventsList = document.getElementById('islamic-events-list');
    if (eventsList) {
        eventsList.innerHTML = '';
        if (monthlyIslamicEvents.length === 0) {
            eventsList.innerHTML = `
                <div class="col-span-full text-center py-4 text-gray-400 dark:text-gray-500">
                    <i class="fas fa-calendar-minus mr-2 opacity-50"></i>
                    ${t('no_islamic_events')}
                </div>
            `;
        } else {
            // Сортируем по дням месяца
            monthlyIslamicEvents.sort((a, b) => a.day - b.day);

            monthlyIslamicEvents.forEach(ev => {
                const card = document.createElement('div');
                card.className = "p-3 rounded-lg border border-emerald-500/10 dark:border-slate-700 bg-emerald-500/5 dark:bg-slate-800/50 flex items-start gap-3 hover:border-emerald-500/30 transition-all shadow-sm";
                card.innerHTML = `
                    <div class="w-8 h-8 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 font-bold text-sm border border-emerald-500/20">
                        ${ev.day}
                    </div>
                    <div class="min-w-0 flex-1">
                        <div class="flex flex-wrap items-center justify-between gap-1">
                            <span class="font-bold text-emerald-900 dark:text-emerald-300 truncate text-sm">${escapeHtml(ev.name)}</span>
                            <span class="text-[9px] md:text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded font-semibold whitespace-nowrap border border-emerald-500/10">
                                ${ev.hijriDay} ${ev.hijriMonthName} ${ev.hijriYear}
                            </span>
                        </div>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">${escapeHtml(ev.desc)}</p>
                    </div>
                `;
                eventsList.appendChild(card);
            });
        }
    }
}

// --- GOALS LOGIC ---
function initGoals() {
    const goalsInputs = document.querySelectorAll('.goal-input');

    const data = Store.getGoals();
    goalsInputs.forEach(input => {
        const id = input.getAttribute('data-goal');
        if (data[id]) {
            input.value = data[id];
        }

        input.addEventListener('input', () => {
            const currentData = Store.getGoals();
            currentData[id] = input.value;
            Store.saveGoals(currentData);
        });
    });

    renderDynamicGoals();

    document.getElementById('add-custom-ahirat').addEventListener('click', () => addDynamicGoal('ahirat'));
    document.getElementById('add-custom-dunya').addEventListener('click', () => addDynamicGoal('dunya'));
}

function addDynamicGoal(type) {
    const goals = Store.getGoals();
    if (!goals.dynamic) goals.dynamic = [];
    goals.dynamic.push({ id: 'dyn_' + Date.now(), type, title: '', content: '' });
    Store.saveGoals(goals);
    renderDynamicGoals();
    window.ActivityLog?.log('goal_added', { type });
}

function renderDynamicGoals() {
    const containerAhirat = document.getElementById('dynamic-goals-ahirat');
    const containerDunya = document.getElementById('dynamic-goals-dunya');
    if (!containerAhirat || !containerDunya) return;

    containerAhirat.innerHTML = '';
    containerDunya.innerHTML = '';

    const goals = Store.getGoals();
    if (!goals.dynamic) return;

    goals.dynamic.forEach((goal, index) => {
        const div = document.createElement('div');
        div.className = 'relative group';

        const goalCustomTitle = (window.t && window.t('goal_custom_title')) || 'Своя цель';
        const goalCustomPh = (window.t && window.t('goal_custom_ph')) || 'Напишите свою цель...';
        const deleteTitle = (window.t && window.t('btn_delete_goal')) || 'Удалить';
        div.innerHTML = `
            <div class="flex items-center justify-between mb-2">
                <input type="text" id="dyn-goal-title-${goal.id}" name="dyn-goal-title-${goal.id}" aria-label="${goalCustomTitle}" class="dyn-goal-title bg-transparent border-none p-0 focus:ring-0 text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide w-[85%] placeholder-slate-400" placeholder="${goalCustomTitle}" value="${escapeHtml(goal.title || '')}">
                <button type="button" class="delete-dyn-goal text-red-500 opacity-30 hover:opacity-100 transition-all p-2 shrink-0 cursor-pointer relative z-50" title="${deleteTitle}"><i class="fas fa-trash pointer-events-none"></i></button>
            </div>
            <textarea id="dyn-goal-content-${goal.id}" name="dyn-goal-content-${goal.id}" aria-label="${goalCustomPh}" class="dyn-goal-content ruled-textarea handwriting h-24 placeholder-slate-400 dark:placeholder-slate-500 w-full" placeholder="${goalCustomPh}">${escapeHtml(goal.content || '')}</textarea>
        `;

        const titleInput = div.querySelector('.dyn-goal-title');
        const contentInput = div.querySelector('.dyn-goal-content');
        const delBtn = div.querySelector('.delete-dyn-goal');

        titleInput.addEventListener('input', () => {
            const currentData = Store.getGoals();
            currentData.dynamic[index].title = titleInput.value;
            Store.saveGoals(currentData);
        });

        contentInput.addEventListener('input', () => {
            const currentData = Store.getGoals();
            currentData.dynamic[index].content = contentInput.value;
            Store.saveGoals(currentData);
        });

        delBtn.addEventListener('click', () => {
            const currentData = Store.getGoals();
            currentData.dynamic.splice(index, 1);
            Store.saveGoals(currentData);
            renderDynamicGoals();
        });

        if (goal.type === 'ahirat') {
            containerAhirat.appendChild(div);
        } else {
            containerDunya.appendChild(div);
        }
    });

    if (typeof applyTranslations === 'function') {
        applyTranslations(localStorage.getItem('barakah_lang') || 'ru');
    }
}

const HIJRI_MONTHS = {
    ru: [
        "Мухаррам", "Сафар", "Раби аль-авваль", "Раби ас-сани",
        "Джумада аль-уля", "Джумада ас-сани", "Раджаб", "Шабан",
        "Рамадан", "Шавваль", "Зуль-Када", "Зуль-Хиджа"
    ],
    kk: [
        "Мұхаррам", "Сафар", "Рабиғ әл-әуәл", "Рабиғ әс-сәни",
        "Жұмада әл-улә", "Жұмада әс-сәни", "Ережеп", "Шағбан",
        "Рамазан", "Шәууәл", "Зұлқағда", "Зұлхижжа"
    ],
    en: [
        "Muharram", "Safar", "Rabi' al-Awwal", "Rabi' al-Thani",
        "Jumada al-Awwal", "Jumada al-Thani", "Rajab", "Sha'ban",
        "Ramadan", "Shawwal", "Dhu al-Qi'dah", "Dhu al-Hijjah"
    ],
    ar: [
        "محرم", "صفر", "ربيع الأول", "ربيع الثاني",
        "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان",
        "رمضان", "شوال", "ذو القعدة", "ذو الحجة"
    ]
};

const ISLAMIC_EVENTS = [
    { month: 1, day: 1, key: "event_islamic_new_year", descKey: "desc_islamic_new_year" },
    { month: 1, day: 9, key: "event_ashura", descKey: "desc_ashura" },
    { month: 1, day: 10, key: "event_ashura", descKey: "desc_ashura" },
    { month: 3, day: 12, key: "event_mawlid", descKey: "desc_mawlid" },
    { month: 7, day: 27, key: "event_isra_miraj", descKey: "desc_isra_miraj" },
    { month: 8, day: 15, key: "event_baraah", descKey: "desc_baraah" },
    { month: 9, day: 1, key: "event_ramadan_start", descKey: "desc_ramadan_start" },
    { month: 9, day: 27, key: "event_laylat_al_qadr", descKey: "desc_laylat_al_qadr" },
    { month: 10, day: 1, key: "event_eid_al_fitr", descKey: "desc_eid_al_fitr" },
    { month: 12, day: 9, key: "event_arafah", descKey: "desc_arafah" },
    { month: 12, day: 10, key: "event_eid_al_adha", descKey: "desc_eid_al_adha" }
];

function getHijriDateComponents(date) {
    try {
        const formatter = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', {
            day: 'numeric',
            month: 'numeric',
            year: 'numeric'
        });
        const parts = formatter.formatToParts(date);
        const components = {};
        for (const part of parts) {
            if (part.type === 'day') components.day = parseInt(part.value, 10);
            if (part.type === 'month') components.month = parseInt(part.value, 10);
            if (part.type === 'year') components.year = parseInt(part.value, 10);
        }
        return components;
    } catch (e) {
        try {
            const formatter = new Intl.DateTimeFormat('en-US-u-ca-islamic', {
                day: 'numeric',
                month: 'numeric',
                year: 'numeric'
            });
            const parts = formatter.formatToParts(date);
            const components = {};
            for (const part of parts) {
                if (part.type === 'day') components.day = parseInt(part.value, 10);
                if (part.type === 'month') components.month = parseInt(part.value, 10);
                if (part.type === 'year') components.year = parseInt(part.value, 10);
            }
            return components;
        } catch (err) {
            return null;
        }
    }
}

// --- UTILS & UX ---
function getHijriDate(date) {
    const lang = localStorage.getItem('barakah_lang') || 'ru';
    const localePrefix = lang === 'en' ? 'en-US' : lang === 'ar' ? 'ar-SA' : lang === 'kk' ? 'kk-KZ' : 'ru-RU';

    let formattedDate = '';

    try {
        formattedDate = new Intl.DateTimeFormat(`${localePrefix}-u-ca-islamic-umalqura`, {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(date);
    } catch (e) {
        // Fallback
        formattedDate = new Intl.DateTimeFormat(`${localePrefix}-u-ca-islamic`, {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(date);
    }

    formattedDate = formattedDate.replace(' г.', '').replace(' AH', '').replace('ж.', '').replace(' AH', '').trim();

    // Fix for Kazakh language where Intl often falls back to standard Gregorian months
    if (lang === 'kk') {
        const gregorianEngOrKk = [
            "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December",
            "Қаңтар", "Ақпан", "Наурыз", "Сәуір", "Мамыр", "Маусым", "Шілде", "Тамыз", "Қыркүйек", "Қазан", "Қараша", "Желтоқсан"
        ];

        const isGregorianFallback = gregorianEngOrKk.some(m => formattedDate.includes(m));

        // If Intl completely failed and gave us a Gregorian month, force fetch Hijri info via Arabic/English locale
        if (isGregorianFallback) {
            try {
                formattedDate = new Intl.DateTimeFormat(`en-US-u-ca-islamic-umalqura`, {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                }).format(date);
            } catch (e) {
                formattedDate = new Intl.DateTimeFormat(`en-US-u-ca-islamic`, {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                }).format(date);
            }
            formattedDate = formattedDate.replace(' AH', '').trim();
        }

        const hijriMonthsKk = {
            "Muharram": "Мұхаррам", "Safar": "Сафар", "Rabiʻ I": "Рабиғ әл-әуәл", "Rabiʻ II": "Рабиғ әс-сәни",
            "Jumada I": "Жұмада әл-улә", "Jumada II": "Жұмада әс-сәни", "Rajab": "Ережеп", "Shaʻban": "Шағбан",
            "Ramadan": "Рамазан", "Shawwal": "Шәууәл", "Dhuʻl-Qiʻdah": "Зұлқағда", "Dhuʻl-Hijjah": "Зұлхижжа",
            // Sometime browsers output standard names instead of hijri names in fallback
            "Rabiʻ al-Awwal": "Рабиғ әл-әуәл", "Rabiʻ al-Thani": "Рабиғ әс-сәни",
            "Jumada al-Awwal": "Жұмада әл-улә", "Jumada al-Thani": "Жұмада әс-сәни",
            "Dhu al-Qiʻdah": "Зұлқағда", "Dhu al-Hijjah": "Зұлхижжа"
        };

        for (const [eng, kk] of Object.entries(hijriMonthsKk)) {
            if (formattedDate.includes(eng)) {
                formattedDate = formattedDate.replace(eng, kk);
                break;
            }
        }
    }

    return formattedDate;
}

window.showToast = function (message = 'МашаАллах, сохранено!') {
    const toast = document.getElementById('toast-message');
    if (!toast) return;

    document.getElementById('toast-text').innerText = message;

    toast.classList.remove('opacity-0', 'pointer-events-none');
    toast.classList.add('opacity-100');

    clearTimeout(toast._toastTimer);
    toast._toastTimer = setTimeout(() => {
        toast.classList.remove('opacity-100');
        toast.classList.add('opacity-0', 'pointer-events-none');
    }, 2000);
}

// --- BACKUP & RESTORE LOGIC ---
function initBackupRestore() {
    const btnExport = document.getElementById('btn-export');
    const btnImport = document.getElementById('btn-import');
    const fileImport = document.getElementById('file-import');

    if (btnExport) {
        btnExport.addEventListener('click', async () => {
            const jsonStr = await Store.exportAllData();
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `barakah_backup_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            showToast((window.t && window.t('backup_downloaded')) || 'Резервная копия скачана');
            window.ActivityLog?.log('backup_exported');
        });
    }

    if (btnImport && fileImport) {
        btnImport.addEventListener('click', () => {
            fileImport.click();
        });

        fileImport.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    await Store.importAllData(event.target.result);
                    showToast((window.t && window.t('backup_restored')) || 'Данные восстановлены! Перезагрузка...');
                    window.ActivityLog?.log('backup_imported', { filename: file.name });
                    setTimeout(() => window.location.reload(), 1500);
                } catch (err) {
                    showToast((window.t && window.t('backup_error')) || 'Ошибка при импорте данных!');
                    console.error('Import failed:', err);
                }
            };
            reader.readAsText(file);
            fileImport.value = ''; // reset file input
        });
    }
}
// --- THEME TOGGLE LOGIC ---
function initTheme() {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const htmlEl = document.documentElement;

    // Init from localStorage or OS preference
    const savedTheme = localStorage.getItem('barakah_theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        htmlEl.classList.add('dark');
        if (themeToggleBtn) themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        htmlEl.classList.remove('dark');
        if (themeToggleBtn) themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
    }

    // Toggle click handler
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            htmlEl.classList.toggle('dark');
            const isDark = htmlEl.classList.contains('dark');
            localStorage.setItem('barakah_theme', isDark ? 'dark' : 'light');
            themeToggleBtn.innerHTML = isDark ? '<i class="fas fa-sun text-amber-500"></i>' : '<i class="fas fa-moon"></i>';
        });
    }
}

window.copyToClipboard = function (text, successMsgKey) {
    navigator.clipboard.writeText(text).then(() => {
        const lang = localStorage.getItem('barakah_lang') || 'ru';
        const msg = (window.translations && window.translations[lang] && window.translations[lang][successMsgKey]) || 'Copied!';
        if (window.showToast) {
            window.showToast(msg);
        } else {
            alert(msg);
        }
    });
}

// --- EVENTS / REMINDERS LOGIC ---
let _eventEditingId = null;
let _eventEditingDate = null;
let _eventCurrentType = 'event'; // 'event' or 'reminder'

function initEvents() {
    const modal = document.getElementById('event-modal');
    const inner = document.getElementById('event-modal-inner');
    const closeBtn = document.getElementById('close-event-modal');
    const saveBtn = document.getElementById('event-save-btn');
    const deleteBtn = document.getElementById('event-delete-btn');
    const repeatChk = document.getElementById('event-repeat');
    const alldayChk = document.getElementById('event-allday');
    const repeatSettings = document.getElementById('event-repeat-settings');
    const timeWrapper = document.getElementById('event-time-wrapper');
    const alertSelect = document.getElementById('event-alert');
    const emailWrapper = document.getElementById('event-email-notify-wrapper');

    // Tab switching
    document.querySelectorAll('.event-type-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            _eventCurrentType = tab.getAttribute('data-type');
            document.querySelectorAll('.event-type-tab').forEach(t => {
                t.className = 'event-type-tab flex-1 py-2 rounded-lg text-sm font-bold transition-all text-white/80 hover:text-white hover:bg-white/10';
            });
            tab.className = 'event-type-tab flex-1 py-2 rounded-lg text-sm font-bold transition-all bg-white text-emerald-700 shadow-sm';

            // Hide location & type for reminders
            const locationRow = document.getElementById('event-location-row');
            const typeRow = document.getElementById('event-type-row');
            if (_eventCurrentType === 'reminder') {
                locationRow.classList.add('hidden');
                typeRow.classList.add('hidden');
            } else {
                locationRow.classList.remove('hidden');
                typeRow.classList.remove('hidden');
            }
        });
    });

    // Repeat toggle
    repeatChk.addEventListener('change', () => {
        if (repeatChk.checked) {
            repeatSettings.classList.remove('hidden');
            repeatSettings.classList.add('grid');
        } else {
            repeatSettings.classList.add('hidden');
            repeatSettings.classList.remove('grid');
        }
    });

    // All day toggle — hide time when all-day is on
    alldayChk.addEventListener('change', () => {
        if (alldayChk.checked) {
            timeWrapper.classList.add('hidden');
        } else {
            timeWrapper.classList.remove('hidden');
        }
    });

    // Alert toggle — show email option if alert is not none
    alertSelect.addEventListener('change', () => {
        if (alertSelect.value === 'none') {
            emailWrapper.classList.add('hidden');
            document.getElementById('event-email-notify').checked = false;
        } else {
            emailWrapper.classList.remove('hidden');
        }
    });

    // Close modal
    closeBtn.addEventListener('click', closeEventModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeEventModal();
    });

    // Save
    saveBtn.addEventListener('click', () => {
        const title = document.getElementById('event-title').value.trim();
        if (!title) {
            document.getElementById('event-title').focus();
            document.getElementById('event-title').classList.add('ring-2', 'ring-red-400');
            setTimeout(() => document.getElementById('event-title').classList.remove('ring-2', 'ring-red-400'), 1500);
            return;
        }

        const dateStr = document.getElementById('event-date').value;
        if (!dateStr) return;

        const event = {
            id: _eventEditingId || 'evt_' + Date.now(),
            type: _eventCurrentType,
            title: title,
            eventType: document.getElementById('event-type-select').value,
            date: dateStr,
            time: document.getElementById('event-time').value,
            location: document.getElementById('event-location').value,
            repeat: repeatChk.checked,
            repeatType: document.getElementById('event-repeat-type').value,
            repeatEnd: document.getElementById('event-repeat-end').value,
            allDay: alldayChk.checked,
            alert: document.getElementById('event-alert').value,
            sendEmail: document.getElementById('event-email-notify').checked,
            tag: document.getElementById('event-tag').value,
            notes: document.getElementById('event-notes').value
        };

        // Request notification permission if alert is enabled
        if (event.alert !== 'none' && typeof Notification !== 'undefined') {
            if (Notification.permission === 'denied') {
                const lang = localStorage.getItem('barakah_lang') || 'ru';
                const msg = lang === 'ru' ? '⚠️ Уведомления заблокированы браузером. Разрешите их в настройках (иконка замочка).' : '⚠️ Notifications are blocked in browser settings. Enable them manually.';
                if (typeof window.showToast === 'function') window.showToast(msg);
            } else if (Notification.permission !== 'granted') {
                // Call requestPermission directly inside the click handler to maintain user gesture trust
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        if (typeof window.recordFCMToken === 'function') window.recordFCMToken();
                    } else if (permission === 'denied') {
                        // User just clicked block
                        const lang = localStorage.getItem('barakah_lang') || 'ru';
                        const msg = lang === 'ru' ? 'Вы запретили уведомления. Вы всегда можете включить их в настройках браузера.' : 'Notifications disabled.';
                        if (typeof window.showToast === 'function') window.showToast(msg);
                    }
                });
            } else if (Notification.permission === 'granted' && typeof window.recordFCMToken === 'function') {
                // Already granted, just ensure FCM token is saved if it wasn't
                window.recordFCMToken();
            }
        }

        // Cancel old offline notification if editing
        if (_eventEditingId) {
            if (typeof window.cancelOfflineNotification === 'function') {
                window.cancelOfflineNotification(_eventEditingId);
            }
            if (_eventEditingDate && _eventEditingDate !== dateStr) {
                Store.deleteEvent(_eventEditingDate, _eventEditingId);
            }
        }

        Store.saveEvent(dateStr, event);

        // Schedule new offline notification
        if (typeof window.scheduleOfflineNotification === 'function') {
            window.scheduleOfflineNotification(event);
        }

        const lang = localStorage.getItem('barakah_lang') || 'ru';
        const msg = (window.translations && window.translations[lang] && window.translations[lang]['event_saved_toast']) || 'Event saved!';
        showToast(msg);

        closeEventModal();
        renderCalendar();
    });

    // Delete
    deleteBtn.addEventListener('click', () => {
        if (_eventEditingId && _eventEditingDate) {
            if (typeof window.cancelOfflineNotification === 'function') {
                window.cancelOfflineNotification(_eventEditingId);
            }
            Store.deleteEvent(_eventEditingDate, _eventEditingId);

            const lang = localStorage.getItem('barakah_lang') || 'ru';
            const msg = (window.translations && window.translations[lang] && window.translations[lang]['event_deleted_toast']) || 'Event deleted';
            showToast(msg);

            closeEventModal();
            renderCalendar();
        }
    });

    // Close events popup
    document.getElementById('close-events-popup').addEventListener('click', closeEventsPopup);
    document.getElementById('events-popup-add-btn').addEventListener('click', () => {
        const dateStr = document.getElementById('events-day-popup').getAttribute('data-date');
        closeEventsPopup();
        openEventModal(dateStr);
    });

    // Click outside popup to close
    document.addEventListener('click', (e) => {
        const popup = document.getElementById('events-day-popup');
        if (!popup.classList.contains('hidden') && !popup.contains(e.target)) {
            closeEventsPopup();
        }
    });
}

function initAIPanner() {
    const btnAiPlanner = document.getElementById('btn-ai-planner');
    const modal = document.getElementById('ai-planner-modal');
    const inner = document.getElementById('ai-modal-content');
    const closeBtn = document.getElementById('ai-planner-close-btn');
    const btnGenerate = document.getElementById('btn-generate-ai-plan');
    const promptInput = document.getElementById('ai-prompt-input');
    const statusMsg = document.getElementById('ai-status-msg');
    
    // API key settings inputs
    const profileKeyInput = document.getElementById('profile-gemini-key');
    const btnSaveProfileKey = document.getElementById('btn-save-profile-gemini-key');
    const profileKeyMsg = document.getElementById('profile-gemini-key-msg');
    
    const modalKeyInput = document.getElementById('ai-api-key');
    const btnSaveModalKey = document.getElementById('btn-save-ai-key');
    const modalKeySection = document.getElementById('ai-modal-key-section');

    const getMessageText = (key) => {
        const lang = localStorage.getItem('barakah_lang') || 'ru';
        const dict = {
            ru: {
                ai_key_saved: "Ключ успешно сохранен!",
                ai_no_key_error: "Пожалуйста, введите API-ключ Gemini.",
                ai_no_prompt_error: "Пожалуйста, напишите, как вы хотите распланировать день.",
                ai_generating: "ИИ составляет расписание, подождите...",
                ai_success: "МашаАллах, задачи добавлены в ваш список!",
                ai_error: "Произошла ошибка при генерации. Попробуйте еще раз."
            },
            kk: {
                ai_key_saved: "Кілт сәтті сақталды!",
                ai_no_key_error: "Gemini API кілтін енгізіңіз.",
                ai_no_prompt_error: "Күнді қалай жоспарлағыңыз келетінін жазыңыз.",
                ai_generating: "ЖИ жоспар құруда, күте тұрыңыз...",
                ai_success: "МәшАллаһ, тапсырмалар тізімге қосылды!",
                ai_error: "Жоспар құру кезінде қате кетті. Қайталап көріңіз."
            },
            ar: {
                ai_key_saved: "تم حفظ المفتاح بنجاح!",
                ai_no_key_error: "يرجى إدخال مفتاح API لـ Gemini.",
                ai_no_prompt_error: "يرجى كتابة كيف ترغب في التخطيط ليومك.",
                ai_generating: "يقوم الذكاء الاصطناعي بإنشاء الجدول، يرجى الانتظار...",
                ai_success: "ما شاء الله، تم إضافة المهام بنجاح!",
                ai_error: "حدث خطأ أثناء التوليد. يرجى المحاولة مرة أخرى."
            },
            en: {
                ai_key_saved: "API Key saved successfully!",
                ai_no_key_error: "Please enter a Gemini API Key.",
                ai_no_prompt_error: "Please write how you want to plan your day.",
                ai_generating: "AI is generating your schedule, please wait...",
                ai_success: "Mashallah, tasks successfully added to your day!",
                ai_error: "An error occurred during generation. Please try again."
            }
        };
        return dict[lang]?.[key] || dict['ru']?.[key] || '';
    };

    // Load API Key from localStorage
    const savedKey = localStorage.getItem('barakah_gemini_api_key') || '';
    if (profileKeyInput) profileKeyInput.value = savedKey;
    if (modalKeyInput) modalKeyInput.value = savedKey;
    
    const updateKeySectionVisibility = () => {
        const key = localStorage.getItem('barakah_gemini_api_key') || '';
        if (modalKeySection) {
            if (key) {
                modalKeySection.classList.add('hidden');
            } else {
                modalKeySection.classList.remove('hidden');
            }
        }
    };
    updateKeySectionVisibility();

    // Save key functions
    const saveKey = (keyVal, msgEl) => {
        const trimmed = keyVal.trim();
        localStorage.setItem('barakah_gemini_api_key', trimmed);
        if (profileKeyInput) profileKeyInput.value = trimmed;
        if (modalKeyInput) modalKeyInput.value = trimmed;
        
        if (msgEl) {
            msgEl.textContent = getMessageText('ai_key_saved');
            msgEl.className = "text-xs text-center mt-1 h-4 font-medium text-emerald-600 dark:text-emerald-400";
            setTimeout(() => {
                msgEl.textContent = '';
            }, 3000);
        }
        updateKeySectionVisibility();
    };

    if (btnSaveProfileKey) {
        btnSaveProfileKey.addEventListener('click', () => {
            saveKey(profileKeyInput.value, profileKeyMsg);
        });
    }

    if (btnSaveModalKey) {
        btnSaveModalKey.addEventListener('click', () => {
            saveKey(modalKeyInput.value, statusMsg);
        });
    }

    // Modal open/close
    const openAIModal = () => {
        if (!modal) return;
        updateKeySectionVisibility();
        if (statusMsg) statusMsg.textContent = '';
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        requestAnimationFrame(() => {
            if (inner) {
                inner.classList.remove('scale-95', 'opacity-0');
                inner.classList.add('scale-100', 'opacity-100');
            }
        });
    };

    const closeAIModal = () => {
        if (!modal) return;
        if (inner) {
            inner.classList.remove('scale-100', 'opacity-100');
            inner.classList.add('scale-95', 'opacity-0');
        }
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }, 300);
    };

    if (btnAiPlanner) {
        btnAiPlanner.addEventListener('click', openAIModal);
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', closeAIModal);
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeAIModal();
        });
    }

    // Generate Plan Handler
    if (btnGenerate) {
        btnGenerate.addEventListener('click', async () => {
            // Лимиты ИИ для бесплатного аккаунта: макс 3 в день
            if (!window.Auth?.isPremium) {
                const todayStr = new Date().toISOString().split('T')[0];
                let aiUsage = { date: todayStr, count: 0 };
                try {
                    const savedUsage = localStorage.getItem('barakah_ai_usage_today');
                    if (savedUsage) {
                        const parsed = JSON.parse(savedUsage);
                        if (parsed.date === todayStr) {
                            aiUsage = parsed;
                        }
                    }
                } catch(e) {}

                if (aiUsage.count >= 3) {
                    const msg = window.t ? window.t('premium_ai_limit_reached') : "Лимит ИИ: макс. 3 планирования в день. Активируйте Premium!";
                    if (statusMsg) {
                        statusMsg.textContent = msg;
                        statusMsg.className = "text-xs text-center font-medium text-amber-500 py-1 rounded-lg";
                    }
                    if (window.showToast) {
                        window.showToast(msg);
                    }
                    // Открываем модалку профиля/оплаты
                    const authModal = document.getElementById('auth-modal');
                    if (authModal) {
                        authModal.classList.remove('hidden');
                        authModal.classList.add('flex');
                    }
                    return;
                }
            }

            const promptVal = promptInput ? promptInput.value.trim() : '';
            if (!promptVal) {
                if (statusMsg) {
                    statusMsg.textContent = getMessageText('ai_no_prompt_error');
                    statusMsg.className = "text-xs text-center font-medium text-red-500 py-1 rounded-lg";
                }
                return;
            }

            // Set loading state
            const originalIconEl = document.getElementById('ai-btn-icon');
            const originalBtnTextEl = document.getElementById('ai-btn-text');
            const originalIconClass = originalIconEl ? originalIconEl.className : '';
            const originalBtnText = originalBtnTextEl ? originalBtnTextEl.textContent : '';

            if (originalIconEl) {
                originalIconEl.className = 'fas fa-circle-notch fa-spin';
            }
            if (originalBtnTextEl) {
                originalBtnTextEl.textContent = window.t('ai_loading_text') || 'Нейросеть думает...';
            }
            btnGenerate.disabled = true;
            btnGenerate.classList.add('opacity-70');

            if (statusMsg) {
                statusMsg.textContent = getMessageText('ai_generating');
                statusMsg.className = "text-xs text-center font-medium text-indigo-600 dark:text-indigo-400 py-1 rounded-lg";
            }

            try {
                let parsedTasks = [];
                const user = window.Auth?.user;

                if (user) {
                    // --- CASE 1: Authenticated User (Secure Proxy Call via Cloud Function) ---
                    const projectId = (window.firebaseApp && window.firebaseApp.options && window.firebaseApp.options.projectId) || 'islamic-planer';
                    const isDevMode = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                    const baseUrl = isDevMode
                        ? `http://${window.location.hostname}:5001/${projectId}/us-central1`
                        : `https://us-central1-${projectId}.cloudfunctions.net`;

                    const idToken = await user.getIdToken();
                    const response = await fetch(`${baseUrl}/generateDailyPlan`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${idToken}`
                        },
                        body: JSON.stringify({ prompt: promptVal })
                    });

                    if (!response.ok) {
                        const errData = await response.json().catch(() => ({}));
                        throw new Error(errData.message || `Server returned status ${response.status}`);
                    }

                    const textContent = await response.text();
                    const parsed = JSON.parse(textContent);
                    parsedTasks = parsed.tasks;
                } else {
                    // --- CASE 2: Guest / Offline Mode (Fallback direct call with local key) ---
                    const key = localStorage.getItem('barakah_gemini_api_key') || (modalKeyInput ? modalKeyInput.value.trim() : '');
                    if (!key) {
                        if (statusMsg) {
                            statusMsg.textContent = getMessageText('ai_no_key_error');
                            statusMsg.className = "text-xs text-center font-medium text-red-500 py-1 rounded-lg";
                        }
                        // Restore button state
                        if (originalIconEl) originalIconEl.className = originalIconClass;
                        if (originalBtnTextEl) originalBtnTextEl.textContent = originalBtnText;
                        btnGenerate.disabled = false;
                        btnGenerate.classList.remove('opacity-70');
                        return;
                    }

                    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            contents: [
                                {
                                    parts: [
                                        {
                                            text: `Plan this day as a structured list of tasks based on the following notes: "${promptVal}". Provide the list in JSON format containing an array of task objects with 'title' (string, task name, translated back to the prompt's language) and 'isImportant' (boolean, true if it seems like a priority task).`
                                        }
                                    ]
                                }
                            ],
                            systemInstruction: {
                                parts: [
                                    {
                                        text: "You are a strict time-management, productivity, and schedule-planning assistant for the Barakah Planner app. Your only job is to extract and format productivity and scheduling tasks. THEOLOGICAL FIREWALL RULES:\n1. You are strictly forbidden from answering religious or theological inquiries, explaining Quranic verses (ayahs), interpreting hadiths, or issuing fatwas.\n2. If the user's prompt contains any religious inquiries, theological questions, or requests for fatwas/rules of worship (e.g., how to perform prayer, rules of fasting, religious rulings), you MUST ignore the rest of the query and return exactly one task in the 'tasks' array:\n{\n  \"title\": \"⚠️ Обратитесь к местным имамам мечетей или на официальный сайт ДУМК (muftyat.kz) для решения религиозных вопросов\",\n  \"isImportant\": true\n}\n(If the user's input is in Kazakh, return: \"⚠️ Діни сұрақтар бойынша жергілікті мешіт имамдарына немесе ҚМДБ ресми сайтына (muftyat.kz) хабарласыңыз\". If in Arabic, return: \"⚠️ يرجى مراجعة أئمة المساجد المحليين أو الموقع الرسمي لـ ДУМК (muftyat.kz) للمسائل الدينية\". If in English or other languages, return: \"⚠️ Please consult local mosque imams or the official DUMK website (muftyat.kz) for religious matters\").\n3. Otherwise, return the daily productivity schedule based on the user's notes, in the same language as the user's input."
                                    }
                                ]
                            },
                            generationConfig: {
                                responseMimeType: "application/json",
                                responseSchema: {
                                    type: "OBJECT",
                                    properties: {
                                        tasks: {
                                            type: "ARRAY",
                                            items: {
                                                type: "OBJECT",
                                                properties: {
                                                    title: {
                                                        type: "STRING"
                                                    },
                                                    isImportant: {
                                                        type: "BOOLEAN"
                                                    }
                                                },
                                                required: ["title"]
                                            }
                                        }
                                    },
                                    required: ["tasks"]
                                }
                            }
                        })
                    });

                    if (!response.ok) {
                        throw new Error(`API returned status ${response.status}`);
                    }

                    const resData = await response.json();
                    let textContent = '';
                    if (resData.candidates && resData.candidates[0] && resData.candidates[0].content && resData.candidates[0].content.parts && resData.candidates[0].content.parts[0]) {
                        textContent = resData.candidates[0].content.parts[0].text;
                    } else {
                        throw new Error("Invalid API response structure");
                    }

                    const parsed = JSON.parse(textContent);
                    parsedTasks = parsed.tasks;
                }

                if (!parsedTasks || !Array.isArray(parsedTasks)) {
                    throw new Error("Missing tasks array in JSON response");
                }

                if (window.todoManager && typeof window.todoManager.addAITasks === 'function') {
                    await window.todoManager.addAITasks(parsedTasks);
                } else {
                    throw new Error("TodoManager is not initialized or addAITasks is missing");
                }

                // Увеличение счетчика использования ИИ для бесплатных пользователей
                // В серверном вызове лимит контролируется на сервере, но для UI обновим счетчик локально тоже
                if (!window.Auth?.isPremium) {
                    const todayStr = new Date().toISOString().split('T')[0];
                    let count = 0;
                    try {
                        const savedUsage = localStorage.getItem('barakah_ai_usage_today');
                        if (savedUsage) {
                            const parsed = JSON.parse(savedUsage);
                            if (parsed.date === todayStr) count = parsed.count;
                        }
                    } catch(e){}
                    localStorage.setItem('barakah_ai_usage_today', JSON.stringify({ date: todayStr, count: count + 1 }));
                }

                // Success
                if (statusMsg) {
                    statusMsg.textContent = getMessageText('ai_success');
                    statusMsg.className = "text-xs text-center font-medium text-emerald-600 dark:text-emerald-400 py-1 rounded-lg";
                }
                
                if (promptInput) promptInput.value = '';

                setTimeout(() => {
                    closeAIModal();
                }, 1500);

            } catch (error) {
                console.error("[Gemini AI Error]", error);
                if (statusMsg) {
                    statusMsg.textContent = getMessageText('ai_error') + ` (${error.message})`;
                    statusMsg.className = "text-xs text-center font-medium text-red-500 py-1 rounded-lg";
                }
            } finally {
                // Restore button state
                if (originalIconEl) {
                    originalIconEl.className = originalIconClass;
                }
                if (originalBtnTextEl) {
                    originalBtnTextEl.textContent = originalBtnText;
                }
                btnGenerate.disabled = false;
                btnGenerate.classList.remove('opacity-70');
            }
        });
    }
}

function openEventModal(dateStr, existingEvent = null) {
    const modal = document.getElementById('event-modal');
    const inner = document.getElementById('event-modal-inner');

    // Reset form
    document.getElementById('event-title').value = '';
    document.getElementById('event-type-select').value = '';
    document.getElementById('event-date').value = dateStr || formatDate(new Date());
    document.getElementById('event-time').value = '';
    document.getElementById('event-location').value = '';
    document.getElementById('event-repeat').checked = false;
    document.getElementById('event-allday').checked = false;
    document.getElementById('event-repeat-type').value = 'daily';
    document.getElementById('event-repeat-end').value = '';
    document.getElementById('event-alert').value = 'none';
    document.getElementById('event-email-notify').checked = false;
    document.getElementById('event-email-notify-wrapper').classList.add('hidden');
    document.getElementById('event-tag').value = '';
    document.getElementById('event-notes').value = '';
    document.getElementById('event-repeat-settings').classList.add('hidden');
    document.getElementById('event-repeat-settings').classList.remove('grid');
    document.getElementById('event-time-wrapper').classList.remove('hidden');
    document.getElementById('event-delete-btn').classList.add('hidden');
    document.getElementById('event-location-row').classList.remove('hidden');
    document.getElementById('event-type-row').classList.remove('hidden');

    _eventEditingId = null;
    _eventEditingDate = null;
    _eventCurrentType = 'event';

    // Reset tabs to 'event'
    document.getElementById('event-tab-event').className = 'event-type-tab flex-1 py-2 rounded-lg text-sm font-bold transition-all bg-white text-emerald-700 shadow-sm';
    document.getElementById('event-tab-reminder').className = 'event-type-tab flex-1 py-2 rounded-lg text-sm font-bold transition-all text-white/80 hover:text-white hover:bg-white/10';

    // If editing existing event, populate
    if (existingEvent) {
        _eventEditingId = existingEvent.id;
        _eventEditingDate = existingEvent.date;
        _eventCurrentType = existingEvent.type || 'event';

        document.getElementById('event-title').value = existingEvent.title || '';
        document.getElementById('event-type-select').value = existingEvent.eventType || '';
        document.getElementById('event-date').value = existingEvent.date || dateStr;
        document.getElementById('event-time').value = existingEvent.time || '';
        document.getElementById('event-location').value = existingEvent.location || '';
        document.getElementById('event-repeat').checked = !!existingEvent.repeat;
        document.getElementById('event-allday').checked = !!existingEvent.allDay;
        document.getElementById('event-repeat-type').value = existingEvent.repeatType || 'daily';
        document.getElementById('event-repeat-end').value = existingEvent.repeatEnd || '';
        document.getElementById('event-alert').value = existingEvent.alert || 'none';

        document.getElementById('event-email-notify').checked = !!existingEvent.sendEmail;
        if (existingEvent.alert && existingEvent.alert !== 'none') {
            document.getElementById('event-email-notify-wrapper').classList.remove('hidden');
        } else {
            document.getElementById('event-email-notify-wrapper').classList.add('hidden');
        }

        document.getElementById('event-tag').value = existingEvent.tag || '';
        document.getElementById('event-notes').value = existingEvent.notes || '';
        document.getElementById('event-delete-btn').classList.remove('hidden');

        // Apply repeat settings visibility
        if (existingEvent.repeat) {
            document.getElementById('event-repeat-settings').classList.remove('hidden');
            document.getElementById('event-repeat-settings').classList.add('grid');
        }

        // Apply all-day visibility
        if (existingEvent.allDay) {
            document.getElementById('event-time-wrapper').classList.add('hidden');
        }

        // Set correct tab
        if (_eventCurrentType === 'reminder') {
            document.getElementById('event-tab-reminder').click();
        }
    }

    // Show modal
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    requestAnimationFrame(() => {
        inner.classList.remove('scale-95', 'opacity-0');
        inner.classList.add('scale-100', 'opacity-100');
    });

    // Apply translations to newly visible elements
    if (typeof applyTranslations === 'function') {
        const lang = localStorage.getItem('barakah_lang') || 'ru';
        applyTranslations(lang);
    }
}

function closeEventModal() {
    const modal = document.getElementById('event-modal');
    const inner = document.getElementById('event-modal-inner');
    inner.classList.add('scale-95', 'opacity-0');
    inner.classList.remove('scale-100', 'opacity-100');
    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }, 300);
}

function openEventsPopup(dateStr, events) {
    const popup = document.getElementById('events-day-popup');
    const list = document.getElementById('events-day-list');
    const title = document.getElementById('events-day-popup-title');

    popup.setAttribute('data-date', dateStr);

    // Format title date
    const d = new Date(dateStr + 'T00:00:00');
    const lang = localStorage.getItem('barakah_lang') || 'ru';
    const monthFormat = new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'long' });
    title.textContent = monthFormat.format(d);

    // Build events list
    list.innerHTML = '';
    if (events.length === 0) {
        const noEvents = (window.translations && window.translations[lang] && window.translations[lang]['events_no_events']) || 'No events';
        list.innerHTML = '<p class="text-sm text-gray-400 text-center py-4"><i class="fas fa-calendar-xmark mr-1"></i> ' + noEvents + '</p>';
    } else {
        events.forEach(ev => {
            const typeColors = {
                islamic: 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20',
                work: 'border-blue-400 bg-blue-50 dark:bg-blue-900/20',
                personal: 'border-purple-400 bg-purple-50 dark:bg-purple-900/20',
                family: 'border-rose-400 bg-rose-50 dark:bg-rose-900/20',
                health: 'border-amber-400 bg-amber-50 dark:bg-amber-900/20'
            };
            const colorClass = typeColors[ev.eventType] || 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20';
            const typeIcon = ev.type === 'reminder' ? 'fa-bell' : 'fa-calendar-day';

            const item = document.createElement('div');
            item.className = 'flex items-center gap-3 p-3 rounded-xl border-l-4 cursor-pointer hover:shadow-md transition-all ' + colorClass;
            item.innerHTML = `
                <i class="fas ${typeIcon} text-gray-500 dark:text-gray-400"></i>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">${escapeHtml(ev.title)}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                        ${ev.time ? '<i class="fas fa-clock mr-1"></i>' + escapeHtml(ev.time) : ''}
                        ${ev.location ? ' <i class="fas fa-map-marker-alt ml-2 mr-1"></i>' + escapeHtml(ev.location) : ''}
                    </p>
                </div>
                <i class="fas fa-chevron-right text-gray-300 dark:text-gray-600"></i>
            `;
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                closeEventsPopup();
                openEventModal(dateStr, ev);
            });
            list.appendChild(item);
        });
    }

    popup.classList.remove('hidden');
}

function closeEventsPopup() {
    document.getElementById('events-day-popup').classList.add('hidden');
}

window.openEventModal = openEventModal;

// --- OFFLINE PUSH NOTIFICATIONS (Notification Triggers API) ---
window.scheduleOfflineNotification = async function (event) {
    if (!('serviceWorker' in navigator) || typeof Notification === 'undefined') return;
    if (event.alert === 'none') return;

    try {
        const registration = await navigator.serviceWorker.ready;
        if (!('showTrigger' in Notification.prototype)) {
            return; // Fallback to initLocalNotifications
        }

        // Calculate triggerTime
        const dateTimeStr = `${event.date}T${event.time}:00`;
        const eventDateObj = new Date(dateTimeStr);
        let triggerDate = new Date(eventDateObj.getTime());

        if (event.alert === '5min') triggerDate.setMinutes(triggerDate.getMinutes() - 5);
        else if (event.alert === '15min') triggerDate.setMinutes(triggerDate.getMinutes() - 15);
        else if (event.alert === '30min') triggerDate.setMinutes(triggerDate.getMinutes() - 30);
        else if (event.alert === '1hour') triggerDate.setHours(triggerDate.getHours() - 1);
        else if (event.alert === '1day') triggerDate.setDate(triggerDate.getDate() - 1);

        if (triggerDate.getTime() < Date.now()) return; // Already passed

        // Ensure permission
        if (Notification.permission !== 'granted') return;

        await registration.showNotification(`Напоминание: ${event.title}`, {
            body: `Запланировано на ${event.time}${event.location ? ' в ' + event.location : ''}`,
            icon: '/public/favicon.ico',
            tag: event.id,
            showTrigger: new window.TimestampTrigger(triggerDate.getTime())
        });
        console.log(`[Offline Push] Scheduled for ${triggerDate.toISOString()} locally!`);
    } catch (e) {
        console.error('Failed to schedule offline notification', e);
    }
}

window.cancelOfflineNotification = async function (eventId) {
    if (!('serviceWorker' in navigator)) return;
    try {
        const registration = await navigator.serviceWorker.ready;
        const notifications = await registration.getNotifications({ tag: eventId, includeTriggered: true });
        notifications.forEach(notification => notification.close());
        console.log(`[Offline Push] Cancelled locally: ${eventId}`);
    } catch (e) {
        console.error('Failed to cancel offline notification', e);
    }
}

// --- LOCAL BROWSER NOTIFICATIONS (FALLBACK/IN-APP) ---
function initLocalNotifications() {
    // Track fired notifications so we don't spam the user
    window._localNotifsFired = new Set();

    setInterval(() => {
        if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

        const events = Store.getEvents();
        const now = new Date();
        const todayStr = formatDate(now);

        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = formatDate(tomorrow);

        const upcomingEvents = [...(events[todayStr] || []), ...(events[tomorrowStr] || [])];

        upcomingEvents.forEach(ev => {
            if (!ev.time || ev.alert === 'none') return;

            // Calculate exactly when it should trigger
            const dateTimeStr = `${ev.date}T${ev.time}:00`;
            const eventDateObj = new Date(dateTimeStr);
            let triggerDate = new Date(eventDateObj.getTime());

            if (ev.alert === '5min') triggerDate.setMinutes(triggerDate.getMinutes() - 5);
            else if (ev.alert === '15min') triggerDate.setMinutes(triggerDate.getMinutes() - 15);
            else if (ev.alert === '30min') triggerDate.setMinutes(triggerDate.getMinutes() - 30);
            else if (ev.alert === '1hour') triggerDate.setHours(triggerDate.getHours() - 1);
            else if (ev.alert === '1day') triggerDate.setDate(triggerDate.getDate() - 1);

            // Time difference in milliseconds
            const timeDiff = now.getTime() - triggerDate.getTime();

            // If the trigger time has passed recently (within 1 minute) and hasn't fired yet
            if (timeDiff >= 0 && timeDiff < 60000 && !window._localNotifsFired.has(ev.id)) {
                window._localNotifsFired.add(ev.id);

                const title = `Напоминание: ${ev.title}`;
                const body = `Запланировано на ${ev.time}${ev.location ? ' в ' + ev.location : ''}`;

                // Show native browser notification
                if (typeof Notification !== 'undefined') {
                    new Notification(title, {
                        body: body,
                        icon: '/public/favicon.ico',
                        tag: ev.id // prevents duplicate notifications in OS tray
                    });
                }

                // Show in-app toast
                if (typeof window.showToast === 'function') {
                    window.showToast(`🔔 ${title}`);
                }
            }
        });
    }, 30000); // Check every 30 seconds
}

// Start the local notification checker
initLocalNotifications();



function initConsentBanner() {
    const modal = document.getElementById('consent-modal');
    const checkbox = document.getElementById('consent-checkbox');
    const acceptBtn = document.getElementById('consent-accept-btn');
    const langToggle = document.getElementById('consent-lang-toggle');
    const langText = document.getElementById('consent-lang-text');

    if (!modal) return;

    const isAccepted = localStorage.getItem('barakah_consent_accepted') === '1';

    if (!isAccepted) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.classList.add('overflow-hidden');

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                e.stopPropagation();
            }
        });

        const escapeBlocker = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
            }
        };
        window.addEventListener('keydown', escapeBlocker, true);

        const startLang = localStorage.getItem('barakah_lang') || 'ru';
        if (langText) langText.textContent = startLang.toUpperCase();

        if (checkbox) {
            checkbox.addEventListener('change', () => {
                acceptBtn.disabled = !checkbox.checked;
            });
        }

        if (langToggle) {
            langToggle.addEventListener('click', () => {
                let current = localStorage.getItem('barakah_lang') || 'ru';
                let nextLang = 'ru';
                if (current === 'ru') nextLang = 'kk';
                else if (current === 'kk') nextLang = 'ar';
                else if (current === 'ar') nextLang = 'en';
                else nextLang = 'ru';

                localStorage.setItem('barakah_lang', nextLang);

                const url = new URL(window.location.href);
                url.searchParams.set('lang', nextLang);
                window.history.replaceState({}, '', url);

                if (typeof window.applyTranslations === 'function') {
                    window.applyTranslations(nextLang);
                }

                if (langText) langText.textContent = nextLang.toUpperCase();

                const langIcon = document.getElementById('lang-icon');
                if (langIcon) langIcon.textContent = nextLang.toUpperCase();

                document.dispatchEvent(new CustomEvent('langChanged', { detail: nextLang }));
            });
        }

        if (acceptBtn) {
            acceptBtn.addEventListener('click', () => {
                if (checkbox && checkbox.checked) {
                    localStorage.setItem('barakah_consent_accepted', '1');
                    modal.classList.remove('flex');
                    modal.classList.add('hidden');
                    document.body.classList.remove('overflow-hidden');

                    window.removeEventListener('keydown', escapeBlocker, true);

                    if (window.showToast) {
                        const lang = localStorage.getItem('barakah_lang') || 'ru';
                        const welcomeText = lang === 'kk' ? 'Қош келдіңіз!' : lang === 'ar' ? 'أهلاً بك!' : lang === 'en' ? 'Welcome!' : 'Добро пожаловать!';
                        window.showToast(welcomeText);
                    }
                }
            });
        }
    } else {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

// --- SIDEBAR DRAWER LOGIC ---
function initSidebarDrawer() {
    const burgerToggle = document.getElementById('burger-menu-toggle');
    const closeBtn = document.getElementById('sidebar-close-btn');
    const backdrop = document.getElementById('sidebar-backdrop');
    const drawer = document.getElementById('sidebar-drawer');

    if (!burgerToggle || !closeBtn || !backdrop || !drawer) return;

    const openSidebar = () => {
        backdrop.classList.remove('hidden');
        // Force reflow
        backdrop.offsetHeight;
        backdrop.classList.add('active');
        drawer.classList.add('active');
        document.body.classList.add('overflow-hidden');
    };

    const closeSidebar = () => {
        drawer.classList.remove('active');
        backdrop.classList.remove('active');
        document.body.classList.remove('overflow-hidden');
        // Wait for slide animation to complete before hiding backdrop completely
        setTimeout(() => {
            if (!drawer.classList.contains('active')) {
                backdrop.classList.add('hidden');
            }
        }, 300);
    };

    burgerToggle.addEventListener('click', openSidebar);
    closeBtn.addEventListener('click', closeSidebar);
    backdrop.addEventListener('click', closeSidebar);

    // Auto-close sidebar on mobile when a navigation tab is clicked
    const sidebarTabs = drawer.querySelectorAll('.planner-tabs button, .planner-tabs a');
    sidebarTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                // Wait slightly for tab active state transition to begin, then slide closed
                setTimeout(closeSidebar, 150);
            }
        });
    });

    // Delegate sidebar duplicated control clicks to their primary header counterparts to avoid breaking existing event handlers
    const delegates = [
        { sidebar: 'sidebar-auth-btn', primary: 'auth-btn' },
        { sidebar: 'sidebar-theme-toggle', primary: 'theme-toggle' },
        { sidebar: 'sidebar-lang-toggle', primary: 'lang-toggle' },
        { sidebar: 'sidebar-btn-import', primary: 'btn-import' },
        { sidebar: 'sidebar-btn-export', primary: 'btn-export' }
    ];

    delegates.forEach(({ sidebar, primary }) => {
        const sidebarEl = document.getElementById(sidebar);
        const primaryEl = document.getElementById(primary);
        if (sidebarEl && primaryEl) {
            sidebarEl.addEventListener('click', (e) => {
                // Programmatically trigger the primary button click
                primaryEl.click();
            });
        }
    });

    // Sync sidebar lang badge when language changes
    document.addEventListener('langChanged', (e) => {
        const activeLang = e.detail || localStorage.getItem('barakah_lang') || 'ru';
        const sidebarLangBadge = document.querySelector('#sidebar-lang-toggle span');
        if (sidebarLangBadge) {
            sidebarLangBadge.textContent = activeLang.toUpperCase();
        }
    });
}
