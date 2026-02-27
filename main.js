import { Store } from './store.js';

// State
let currentDate = new Date(); // День, который открыт в планировщике
let calendarDate = new Date(); // Месяц, который открыт в календаре

const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initDailyPlanner();
    initCalendar();
    initGoals();
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

    // Event listeners to save data on input change
    const inputs = document.querySelectorAll('.day-input');
    const checkboxes = document.querySelectorAll('.day-checkbox');
    const tasks = document.querySelectorAll('.task-toggle');

    inputs.forEach(input => {
        input.addEventListener('input', saveDailyData);
    });
    checkboxes.forEach(chk => {
        chk.addEventListener('change', saveDailyData);
    });
    tasks.forEach(btn => {
        btn.addEventListener('click', function () {
            toggleTask(this);
            saveDailyData();
        });
    });

    renderDailyPlanner();
}

function renderDailyPlanner() {
    const dateStr = formatDate(currentDate);
    const data = Store.getDayData(dateStr);

    // Update header
    const todayStr = formatDate(new Date());
    let displayStr = `${currentDate.getDate()} ${monthNames[currentDate.getMonth()]}`;
    if (dateStr === todayStr) displayStr += " (Сегодня)";
    document.getElementById('date-display').value = displayStr;

    // Load inputs
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

    // Load checkboxes
    document.querySelectorAll('.day-checkbox').forEach(chk => {
        const id = chk.getAttribute('data-id');
        chk.checked = data.checkboxes && data.checkboxes[id] ? !!data.checkboxes[id] : false;
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

    title.innerText = monthNames[month] + ' ' + year;

    // Restore monthly notes
    const goals = Store.getGoals();
    const monthStr = `${year}-${month}`;
    notesInput.value = (goals.months && goals.months[monthStr]) ? goals.months[monthStr] : "";

    // Math for days
    const firstDay = new Date(year, month, 1).getDay();
    let shift = firstDay === 0 ? 6 : firstDay - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Empties
    for (let i = 0; i < shift; i++) {
        body.innerHTML += `<div class="calendar-cell empty"></div>`;
    }

    // Days
    for (let i = 1; i <= daysInMonth; i++) {
        let loopDate = new Date(year, month, i);
        let dayOfWeek = loopDate.getDay();

        let isSunnahFast = (dayOfWeek === 1 || dayOfWeek === 4);
        let classes = 'calendar-cell group';
        let badge = '';

        if (isSunnahFast) {
            classes += ' sunnah-fast';
            badge = '<span class="sunnah-badge">Сунна</span>';
        }

        if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            classes += ' ring-2 ring-green-500';
        }

        // We can jump to this date when clicking the cell
        const cell = document.createElement('div');
        cell.className = classes;
        cell.innerHTML = `
            <div class="calendar-date pointer-events-none">${i}</div>
            ${badge}
            <div class="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-2 right-2 text-xs text-green-700 font-bold"><i class="fas fa-edit"></i> План</div>
        `;

        cell.addEventListener('click', () => {
            currentDate = new Date(year, month, i);
            renderDailyPlanner();
            switchToTab('daily');
        });

        body.appendChild(cell);
    }
}

// --- GOALS LOGIC ---
function initGoals() {
    const goalsInputs = document.querySelectorAll('.goal-input');

    // Load
    const data = Store.getGoals();
    goalsInputs.forEach(input => {
        const id = input.getAttribute('data-goal');
        if (data[id]) {
            input.value = data[id];
        }

        // Save on change
        input.addEventListener('input', () => {
            const currentData = Store.getGoals();
            currentData[id] = input.value;
            Store.saveGoals(currentData);
        });
    });
}
