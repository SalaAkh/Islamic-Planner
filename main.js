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
});

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
    const plannerContainer = document.querySelector('.md\\:col-span-8.space-y-8');

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
                <input data-id="task_dyn_${newIndex}" type="text" placeholder="Новая задача..." class="ruled-input handwriting day-input">
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
        const todayWord = lang === 'kk' ? 'Бүгін' : lang === 'ar' ? 'اليوم' : 'Сегодня';
        displayStr += ` (${todayWord})`;
    }
    document.getElementById('date-display').value = displayStr;
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
                    <input data-id="${key}" type="text" class="ruled-input handwriting day-input">
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
    } else {
        btn.classList.remove('task-done', 'text-green-700', 'border-green-700');
        btn.innerHTML = '';
        input.classList.remove('line-through', 'text-gray-400', 'opacity-60');
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
    for (let i = 1; i <= daysInMonth; i++) {
        const dayOfWeek = new Date(year, month, i).getDay();
        const isSunnahFast = (dayOfWeek === 1 || dayOfWeek === 4);
        const isToday = i === today.getDate() && month === today.getMonth() && year === today.getFullYear();

        let classes = 'calendar-cell group';
        if (isSunnahFast) classes += ' sunnah-fast';
        if (isToday) classes += ' ring-2 ring-green-500';

        const cell = document.createElement('div');
        cell.className = classes;

        const sunnahText = lang === 'en' ? 'Sunnah' : lang === 'kk' ? 'Сүннет' : lang === 'ar' ? 'سنة' : 'Сунна';
        const planText = lang === 'en' ? 'Plan' : lang === 'kk' ? 'Жоспар' : lang === 'ar' ? 'خطة' : 'План';

        cell.innerHTML = `
            <div class="calendar-date pointer-events-none">${i}</div>
            ${isSunnahFast ? '<span class="sunnah-badge">' + sunnahText + '</span>' : ''}
            <div class="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-2 right-2 text-xs text-green-700 font-bold"><i class="fas fa-edit"></i> ${planText}</div>
        `;
        cell.addEventListener('click', () => {
            currentDate = new Date(year, month, i);
            renderDailyPlanner();
            switchToTab('daily');
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
}

// --- UTILS & UX ---
function getHijriDate(date) {
    try {
        return new Intl.DateTimeFormat('ru-RU-u-ca-islamic-umalqura', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(date).replace(' г.', '');
    } catch (e) {
        // Fallback
        return new Intl.DateTimeFormat('ru-RU-u-ca-islamic', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(date).replace(' г.', '');
    }
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
