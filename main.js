// State
let currentDate = new Date(); // День, который открыт в планировщике
let calendarDate = new Date(); // Месяц, который открыт в календаре

const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

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
function initTabs() {
    const tabs = document.querySelectorAll('.planner-tabs button');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Hide all pages
            document.querySelectorAll('.page-view').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

            // Show target
            const viewName = tab.getAttribute('data-tab');
            document.getElementById('view-' + viewName).classList.add('active');
            tab.classList.add('active');

            if (viewName === 'calendar' && document.getElementById('calendar-body').innerHTML.trim() === '') {
                renderCalendar();
            }

            // Initialize board if first time — pass showToast so board doesn't need global
            if (viewName === 'board' && !window._boardInitialized) {
                initBoard(showToast);
                window._boardInitialized = true;
            }
        });
    });
}

function switchToTab(viewName) {
    document.querySelector(`button[data-tab="${viewName}"]`).click();
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

function initDailyPlanner() {
    document.getElementById('prev-day').addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() - 1);
        renderDailyPlanner();
    });

    document.getElementById('next-day').addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() + 1);
        renderDailyPlanner();
    });

    // Event Delegation for dynamic elements
    const plannerContainer = document.querySelector('.md\\:col-span-8');

    plannerContainer.addEventListener('input', (e) => {
        if (e.target.classList.contains('day-input') || e.target.classList.contains('day-checkbox')) {
            saveDailyData();
        }
    });

    plannerContainer.addEventListener('change', (e) => {
        if (e.target.classList.contains('day-checkbox')) {
            saveDailyData();
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

        // Handle Add Task button
        const addBtn = e.target.closest('.add-task-btn');
        if (addBtn) {
            const listContainer = addBtn.parentElement.previousElementSibling;
            const blockIndex = addBtn.getAttribute('data-block-index');
            const newIndex = Date.now(); // Unique ID

            const newRow = document.createElement('div');
            newRow.className = 'flex items-center';
            newRow.innerHTML = `
                <button data-task-id="t_dyn_${newIndex}" class="task-toggle w-4 h-4 rounded border border-gray-400 mr-3 hover:bg-green-100 flex justify-center items-center text-[10px] text-transparent transition-colors"></button>
                <input data-id="task_dyn_${newIndex}" id="task_dyn_${newIndex}" name="task_dyn_${newIndex}" type="text" placeholder="Новая задача..." autocomplete="off" aria-label="Новая задача" class="ruled-input handwriting day-input">
            `;

            if (listContainer) {
                listContainer.appendChild(newRow);
                newRow.querySelector('input').focus();
            }
        }
    });

    renderDailyPlanner();
}

function renderDailyPlanner() {
    const dateStr = formatDate(currentDate);
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
    document.querySelectorAll('input[data-id^="task_dyn_"]').forEach(el => el.parentElement.remove());

    // Reconstruct dynamic inputs from saved data
    if (data.texts) {
        // Group dynamic tasks by guessing their block based on order, 
        // For simplicity, we just inject them into the last block if we don't have block tracking.
        // Actually, to make it robust for MVP, we just append them to the first block.
        // Better solution: Save HTML structure or block mapping. 
        // We will append all dynamic tasks to Block 1 for now if they are found.
        const block1Container = document.querySelector('.space-y-1.pl-6');

        Object.keys(data.texts).forEach(key => {
            if (key.startsWith('task_dyn_') && !document.querySelector(`[data-id="${key}"]`)) {
                const newRow = document.createElement('div');
                newRow.className = 'flex items-center';
                const dynId = key.replace('task_dyn_', '');
                newRow.innerHTML = `
                    <button data-task-id="t_dyn_${dynId}" class="task-toggle w-4 h-4 rounded border border-gray-400 mr-3 hover:bg-green-100 flex justify-center items-center text-[10px] text-transparent transition-colors"></button>
                    <input data-id="${key}" id="${key}" name="${key}" type="text" autocomplete="off" aria-label="Задача" class="ruled-input handwriting day-input">
                `;
                block1Container.appendChild(newRow);
            }
        });
    }

    // Now populate all values
    document.querySelectorAll('.day-input').forEach(input => {
        const id = input.getAttribute('data-id');
        input.value = data.texts && data.texts[id] ? data.texts[id] : '';

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
            btn.classList.add('task-done', 'text-green-700', 'border-green-700');
            btn.innerHTML = '<i class="fas fa-check"></i>';
        } else {
            btn.classList.remove('task-done', 'text-green-700', 'border-green-700');
            btn.innerHTML = '';
        }
    });

    // Load checkboxes (if any remain)
    document.querySelectorAll('.day-checkbox').forEach(chk => {
        const id = chk.getAttribute('data-id');
        chk.checked = data.checkboxes && data.checkboxes[id] ? !!data.checkboxes[id] : false;
    });

    updateIbadahProgress();
}

function saveDailyData() {
    const dateStr = formatDate(currentDate);
    const data = { texts: {}, checkboxes: {}, tasks: {} };

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
    const checkboxes = document.querySelectorAll('.day-checkbox');
    const total = checkboxes.length;
    let checked = 0;

    checkboxes.forEach(chk => {
        if (chk.checked) checked++;
    });

    const percentage = total > 0 ? Math.round((checked / total) * 100) : 0;
    const bar = document.getElementById('ibadah-progress-bar');

    document.getElementById('ibadah-progress-text').innerText = percentage;
    bar.style.width = percentage + '%';

    if (percentage === 100 && total > 0) {
        bar.classList.remove('bg-green-700');
        bar.classList.add('bg-amber-500', 'shadow-[0_0_15px_rgba(245,158,11,0.5)]');
    } else {
        bar.classList.add('bg-green-700');
        bar.classList.remove('bg-amber-500', 'shadow-[0_0_15px_rgba(245,158,11,0.5)]');
    }
}

function toggleTask(btn) {
    const input = btn.nextElementSibling;
    if (!btn.classList.contains('task-done')) {
        btn.classList.add('task-done', 'text-green-700', 'border-green-700');
        btn.innerHTML = '<i class="fas fa-check"></i>';
        input.classList.add('line-through', 'text-gray-400', 'opacity-60');
        window.ActivityLog?.log('task_toggled', { state: 'done', task: input.value?.slice(0, 60) });
    } else {
        btn.classList.remove('task-done', 'text-green-700', 'border-green-700');
        btn.innerHTML = '';
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

    // Day cells
    const allEvents = Store.getEvents();
    for (let i = 1; i <= daysInMonth; i++) {
        const dayOfWeek = new Date(year, month, i).getDay();
        const isSunnahFast = (dayOfWeek === 1 || dayOfWeek === 4);
        const isJumuah = (dayOfWeek === 5);
        const isToday = i === today.getDate() && month === today.getMonth() && year === today.getFullYear();
        const dayDateStr = formatDate(new Date(year, month, i));
        const dayEvents = allEvents[dayDateStr] || [];
        const hasEvents = dayEvents.length > 0;

        let classes = 'calendar-cell group';
        if (isSunnahFast) classes += ' sunnah-fast';
        if (isJumuah) classes += ' jumuah-day';
        if (isToday) classes += ' ring-2 ring-green-500';

        const cell = document.createElement('div');
        cell.className = classes;

        const sunnahText = lang === 'en' ? 'Sunnah' : lang === 'kk' ? 'Сүннет' : lang === 'ar' ? 'سنة' : 'Сунна';
        const jumuahText = lang === 'en' ? "Jumu'ah" : lang === 'kk' ? 'Жұма' : lang === 'ar' ? 'جمعة' : 'Джума';
        const planText = lang === 'en' ? 'Plan' : lang === 'kk' ? 'Жоспар' : lang === 'ar' ? 'خطة' : 'План';

        cell.innerHTML = `
            <div class="calendar-date pointer-events-none">${i}</div>
            ${isSunnahFast ? '<span class="sunnah-badge">' + sunnahText + '</span>' : ''}
            ${isJumuah ? '<span class="jumuah-badge">' + jumuahText + '</span>' : ''}
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

        div.innerHTML = `
            <div class="flex items-center justify-between mb-2">
                <input type="text" data-i18n="goal_custom_title" data-i18n-target="placeholder" class="dyn-goal-title bg-transparent border-none p-0 focus:ring-0 text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide w-[85%] placeholder-slate-400" placeholder="Своя цель" value="${goal.title || ''}">
                <button class="delete-dyn-goal text-red-300 hover:text-red-500 opacity-0 md:group-hover:opacity-100 transition-opacity p-1" title="Удалить"><i class="fas fa-trash"></i></button>
            </div>
            <textarea data-i18n="goal_custom_ph" data-i18n-target="placeholder" class="dyn-goal-content ruled-textarea handwriting h-24 placeholder-slate-400 dark:placeholder-slate-500 w-full" placeholder="Напишите свою цель...">${goal.content || ''}</textarea>
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
            showToast('Резервная копия скачана');
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
                    showToast('Данные восстановлены! Перезагрузка...');
                    window.ActivityLog?.log('backup_imported', { filename: file.name });
                    setTimeout(() => window.location.reload(), 1500);
                } catch (err) {
                    showToast('Ошибка при импорте данных!');
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
            tag: document.getElementById('event-tag').value,
            notes: document.getElementById('event-notes').value
        };

        // If we were editing and the date changed, delete from old date first
        if (_eventEditingId && _eventEditingDate && _eventEditingDate !== dateStr) {
            Store.deleteEvent(_eventEditingDate, _eventEditingId);
        }

        Store.saveEvent(dateStr, event);

        const lang = localStorage.getItem('barakah_lang') || 'ru';
        const msg = (window.translations && window.translations[lang] && window.translations[lang]['event_saved_toast']) || 'Event saved!';
        showToast(msg);

        closeEventModal();
        renderCalendar();
    });

    // Delete
    deleteBtn.addEventListener('click', () => {
        if (_eventEditingId && _eventEditingDate) {
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
                    <p class="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">${ev.title}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                        ${ev.time ? '<i class="fas fa-clock mr-1"></i>' + ev.time : ''}
                        ${ev.location ? ' <i class="fas fa-map-marker-alt ml-2 mr-1"></i>' + ev.location : ''}
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
