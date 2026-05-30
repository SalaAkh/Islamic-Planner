/**
 * Barakah Tasbih / Dhikr Widget Counter
 */
(function() {
    const PRESETS = {
        subhanallah: 33,
        alhamdulillah: 33,
        allahuakbar: 34,
        astagfirullah: 100,
        lailahaillallah: 100,
        free: Infinity
    };

    let currentDateStr = '';
    
    // SVG ring circumference (2 * PI * r) where r = 44
    const RING_CIRCUMFERENCE = 276.46;

    // Helper to get formatted date string matching main.js
    function getActiveDateStr() {
        if (window.formatDate && window.currentDate) {
            return window.formatDate(window.currentDate);
        }
        // Fallback to today
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    // Retrieve Tasbih data for the current date
    function getTasbihData(dateStr) {
        if (!window.Store) {
            return {
                presets: { subhanallah: 0, alhamdulillah: 0, allahuakbar: 0, astagfirullah: 0, lailahaillallah: 0, free: 0 },
                selectedPreset: 'subhanallah',
                totalToday: 0
            };
        }
        const dayData = window.Store.getDayData(dateStr);
        if (!dayData.tasbih) {
            dayData.tasbih = {
                presets: { subhanallah: 0, alhamdulillah: 0, allahuakbar: 0, astagfirullah: 0, lailahaillallah: 0, free: 0 },
                selectedPreset: 'subhanallah',
                totalToday: 0
            };
        }
        // Migration safeguard in case older schema exists
        if (!dayData.tasbih.presets) {
            dayData.tasbih.presets = { subhanallah: 0, alhamdulillah: 0, allahuakbar: 0, astagfirullah: 0, lailahaillallah: 0, free: 0 };
        }
        return dayData.tasbih;
    }

    // Save Tasbih data for the current date
    function saveTasbihData(dateStr, tasbihData) {
        if (!window.Store) return;
        const dayData = window.Store.getDayData(dateStr);
        dayData.tasbih = tasbihData;
        window.Store.saveDayData(dateStr, dayData);
    }

    // Update UI elements based on state
    function updateTasbihUI() {
        const dateStr = getActiveDateStr();
        const data = getTasbihData(dateStr);

        const selectEl = document.getElementById('tasbih-preset');
        if (selectEl && selectEl.value !== data.selectedPreset) {
            selectEl.value = data.selectedPreset;
        }

        const preset = data.selectedPreset;
        const currentCount = data.presets[preset] || 0;
        const target = PRESETS[preset];

        // Update Count and Target labels
        const countEl = document.getElementById('tasbih-count');
        const targetEl = document.getElementById('tasbih-target');
        const doneMsgEl = document.getElementById('tasbih-done-msg');

        if (countEl) countEl.textContent = currentCount;
        if (targetEl) {
            if (target === Infinity) {
                targetEl.textContent = '';
            } else {
                targetEl.textContent = ` / ${target}`;
            }
        }

        // Show/hide completed message
        if (doneMsgEl) {
            if (target !== Infinity && currentCount >= target) {
                doneMsgEl.classList.remove('hidden');
            } else {
                doneMsgEl.classList.add('hidden');
            }
        }

        // Update Progress SVG ring
        const ringEl = document.getElementById('tasbih-ring');
        if (ringEl) {
            if (target === Infinity) {
                ringEl.style.strokeDashoffset = RING_CIRCUMFERENCE;
            } else {
                const percentage = Math.min(currentCount / target, 1);
                const offset = RING_CIRCUMFERENCE - (percentage * RING_CIRCUMFERENCE);
                ringEl.style.strokeDashoffset = offset;
            }
        }

        // Update Total Today label
        const totalEl = document.getElementById('tasbih-total-today');
        if (totalEl) totalEl.textContent = data.totalToday || 0;
    }

    // Handle Dhikr Counter Increment
    function incrementTasbih() {
        const dateStr = getActiveDateStr();
        const data = getTasbihData(dateStr);
        const preset = data.selectedPreset;
        const target = PRESETS[preset];
        let current = data.presets[preset] || 0;

        // If preset target was reached, start a new round on next click
        if (target !== Infinity && current >= target) {
            current = 0;
        }

        current++;
        data.presets[preset] = current;
        data.totalToday = (data.totalToday || 0) + 1;

        saveTasbihData(dateStr, data);
        updateTasbihUI();

        // Vibration Feedback
        const vibrateCheckbox = document.getElementById('tasbih-vibrate');
        const isVibrateEnabled = vibrateCheckbox ? vibrateCheckbox.checked : true;
        
        if (isVibrateEnabled && navigator.vibrate) {
            if (target !== Infinity && current === target) {
                // Double vibration on target reached
                navigator.vibrate([100, 50, 100]);
            } else {
                // Short single vibration on regular click
                navigator.vibrate(60);
            }
        }
        
        if (target !== Infinity && current === target) {
            if (window.Gamification) {
                const clickerBtn = document.getElementById('tasbih-clicker');
                const rect = clickerBtn ? clickerBtn.getBoundingClientRect() : null;
                const pos = rect ? { clientX: rect.left + rect.width / 2, clientY: rect.top } : null;
                const event = new CustomEvent('barakah:addPoints', {
                    detail: { amount: 20, reason: 'tasbih_completed', eventObj: pos }
                });
                window.dispatchEvent(event);
            }
        }
    }

    // Reset current preset counter
    function resetTasbih() {
        const dateStr = getActiveDateStr();
        const data = getTasbihData(dateStr);
        const preset = data.selectedPreset;

        data.presets[preset] = 0;
        saveTasbihData(dateStr, data);
        updateTasbihUI();
    }

    // Change selected preset
    function handlePresetChange(e) {
        const dateStr = getActiveDateStr();
        const data = getTasbihData(dateStr);
        data.selectedPreset = e.target.value;
        saveTasbihData(dateStr, data);
        updateTasbihUI();
    }

    // Bind event listeners
    function initTasbih() {
        const clicker = document.getElementById('tasbih-clicker');
        const resetBtn = document.getElementById('tasbih-reset-btn');
        const presetSelect = document.getElementById('tasbih-preset');

        if (clicker) {
            clicker.addEventListener('click', (e) => {
                e.preventDefault();
                incrementTasbih();
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', (e) => {
                e.preventDefault();
                resetTasbih();
            });
        }

        if (presetSelect) {
            presetSelect.addEventListener('change', handlePresetChange);
        }

        // Listen for date change event dispatched from main.js
        document.addEventListener('dateChanged', (e) => {
            currentDateStr = e.detail;
            updateTasbihUI();
        });

        // Space key shortcut support for desktop
        window.addEventListener('keydown', (e) => {
            if (e.key === ' ' || e.code === 'Space') {
                // Only trigger if active view is daily and user is not typing in a text field
                const activeTab = document.querySelector('.tab-btn.active');
                const isDailyTab = activeTab && activeTab.getAttribute('data-tab') === 'daily';
                
                const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
                const isTyping = activeTag === 'textarea' || activeTag === 'input' || document.activeElement.getAttribute('contenteditable') === 'true';

                if (isDailyTab && !isTyping) {
                    e.preventDefault(); // Stop page scrolling
                    // Trigger click visual effect
                    const clickerBtn = document.getElementById('tasbih-clicker');
                    if (clickerBtn) {
                        clickerBtn.classList.add('scale-95');
                        setTimeout(() => clickerBtn.classList.remove('scale-95'), 100);
                    }
                    incrementTasbih();
                }
            }
        });

        // Initial UI Render
        updateTasbihUI();
    }

    // Start on DOMContentLoaded or immediately if loaded defer
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTasbih);
    } else {
        initTasbih();
    }
})();
