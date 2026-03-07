const NAMAZ_STORAGE_KEY_PREFIX = 'planer_namaz_schedule_';
const PREF_CITY_KEY = 'planer_city_pref';

const PRAYER_NAMES = {
    'fajr': 'Фаджр',
    'sunrise': 'Восход',
    'dhuhr': 'Зухр',
    'asr': 'Аср',
    'maghrib': 'Магриб',
    'isha': 'Иша'
};

const PRAYER_CHECKBOХES = {
    'fajr': 'chk-fajr',
    'dhuhr': 'chk-zuhr',
    'asr': 'chk-asr',
    'maghrib': 'chk-maghrib',
    'isha': 'chk-isha'
};

const ORDERED_PRAYERS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

let currentCityPref = null;
let currentSchedule = null;
let timerInterval = null;

async function initNamazTracker() {
    setupModalEvents();

    const saved = localStorage.getItem(PREF_CITY_KEY);
    if (saved) {
        currentCityPref = JSON.parse(saved);
        updateHeaderCityName(currentCityPref.title);
        await loadScheduleForYear(new Date().getFullYear());
    } else {
        updateHeaderCityName("Выбрать город...");
        document.getElementById('namaz-current-time').textContent = "---";
        const subtitle = document.querySelector('#namaz-countdown span');
        if (subtitle) subtitle.textContent = "Город не выбран";
    }

    startTimer();

    window.addEventListener('dateChanged', () => {
        updateNamazUI();
    });
}

function setupModalEvents() {
    const headerBtn = document.getElementById('namaz-widget-header');
    const modal = document.getElementById('city-selection-modal');
    const modalContent = document.getElementById('city-modal-content');
    const closeBtn = document.getElementById('close-city-modal');
    const searchInput = document.getElementById('city-search-input');

    if (!headerBtn || !modal) return;

    headerBtn.addEventListener('click', () => {
        modal.classList.remove('hidden');
        setTimeout(() => {
            modalContent.classList.remove('scale-95', 'opacity-0');
            searchInput.focus();
        }, 10);
        if (window.MUFTYAT_CITIES && window.MUFTYAT_CITIES.length > 0) {
            renderCityResults(window.MUFTYAT_CITIES.slice(0, 50));
        } else {
            document.getElementById('city-search-empty').classList.remove('hidden');
        }
    });

    const closeModal = () => {
        modalContent.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            modal.classList.add('hidden');
            searchInput.value = '';
            document.getElementById('city-search-results').innerHTML = '<div class="text-center text-sm text-gray-400 py-4" id="city-search-empty" data-i18n="city_search_empty">Начните вводить название...</div>';
            if (window.updateTranslations) window.updateTranslations();
        }, 300);
    };

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modalContent || modalContent.contains(e.target)) return;
        closeModal();
    });

    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        const q = e.target.value.trim().toLowerCase();

        debounceTimer = setTimeout(async () => {
            if (q.length < 2) {
                if (window.MUFTYAT_CITIES) {
                    renderCityResults(window.MUFTYAT_CITIES.slice(0, 50));
                }
                return;
            }

            if (window.MUFTYAT_CITIES && window.MUFTYAT_CITIES.length > 0) {
                const results = window.MUFTYAT_CITIES.filter(c => c.t.toLowerCase().includes(q)).slice(0, 50);
                renderCityResults(results);
            } else {
                renderCityResults([], true);
                try {
                    const res = await fetch(`https://api.muftyat.kz/cities/?format=json&search=${encodeURIComponent(q)}`);
                    const data = await res.json();
                    const mapped = (data.results || []).map(c => ({
                        i: c.id,
                        t: c.title,
                        la: c.lat,
                        lo: c.lng,
                        r: c.region || ''
                    }));
                    renderCityResults(mapped);
                } catch (e) {
                    console.error("City search failed:", e);
                    document.getElementById('city-search-results').innerHTML = '<div class="text-center text-sm text-red-400 py-4">Ошибка сети</div>';
                }
            }
        }, 300);
    });

    window.selectNamazCity = async (id, title, lat, lng) => {
        currentCityPref = { id, title, lat, lng };
        localStorage.setItem(PREF_CITY_KEY, JSON.stringify(currentCityPref));
        updateHeaderCityName(title);
        closeModal();

        document.getElementById('namaz-current-time').textContent = "Загрузка...";
        const subtitle = document.querySelector('#namaz-countdown span');
        if (subtitle) subtitle.textContent = "Получение расписания";

        await loadScheduleForYear(new Date().getFullYear(), true);
        updateNamazUI();
    };
}

function renderCityResults(cities, isLoading = false) {
    const container = document.getElementById('city-search-results');
    if (isLoading) {
        container.innerHTML = '<div class="text-center text-sm text-emerald-500 py-4"><i class="fas fa-spinner fa-spin mr-2"></i>Поиск...</div>';
        return;
    }

    if (!cities || cities.length === 0) {
        container.innerHTML = '<div class="text-center text-sm text-gray-400 py-4">Ничего не найдено</div>';
        return;
    }

    let html = '';
    cities.forEach(c => {
        const title = c.t || '';
        const region = c.r || '';
        const lat = c.la || '';
        const lng = c.lo || '';

        html += `
            <div onclick="selectNamazCity('${c.i}', '${title.replace(/'/g, "\\'")}', '${lat}', '${lng}')" 
                class="p-3 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700/50 rounded-xl hover:bg-emerald-50 dark:hover:bg-slate-700 cursor-pointer transition-colors flex flex-col mb-2">
                <span class="font-bold text-slate-800 dark:text-slate-200">${title}</span>
                <span class="text-xs text-slate-500 mt-1"><i class="fas fa-map mr-1"></i>${region}</span>
            </div>
        `;
    });
    container.innerHTML = html;
}

function updateHeaderCityName(name) {
    const el = document.getElementById('namaz-city-name');
    if (el) el.textContent = name;
}

async function loadScheduleForYear(year, forceFetch = false, fallbackCity = null) {
    if (!currentCityPref && !fallbackCity) return;

    const targetCity = fallbackCity || currentCityPref;
    const storeKey = `${NAMAZ_STORAGE_KEY_PREFIX}${targetCity.id}_${year}`;

    if (!forceFetch) {
        const cached = localStorage.getItem(storeKey);
        if (cached) {
            try {
                currentSchedule = JSON.parse(cached);
                updateNamazUI();
                return;
            } catch (e) {
                console.warn("Corrupted schedule cache, re-fetching...");
            }
        }
    }

    try {
        const { lat, lng } = targetCity;
        const res = await fetch(`https://api.muftyat.kz/prayer-times/${year}/${lat}/${lng}`);
        if (!res.ok) throw new Error("API status " + res.status);
        const data = await res.json();

        if (data && data.result) {
            const scheduleMap = {};
            data.result.forEach(day => {
                scheduleMap[day.Date] = day;
            });
            currentSchedule = scheduleMap;
            // Always save under the original user preference ID so they don't know it fell back
            const prefStoreKey = `${NAMAZ_STORAGE_KEY_PREFIX}${currentCityPref.id}_${year}`;
            localStorage.setItem(prefStoreKey, JSON.stringify(scheduleMap));
            updateNamazUI();
        }
    } catch (e) {
        console.error("Failed to fetch schedule for " + targetCity.title, e);

        // If it's a server error and we haven't fallen back too deeply
        if (!fallbackCity) {
            console.log("Attempting to find nearest working city as fallback...");

            // Wait up to 2 seconds for MUFTYAT_CITIES to load if it's external
            if (!window.MUFTYAT_CITIES) {
                console.log("Waiting for cities JS to load...");
                await new Promise(resolve => {
                    let checks = 0;
                    const interval = setInterval(() => {
                        if (window.MUFTYAT_CITIES || checks > 20) {
                            clearInterval(interval);
                            resolve();
                        }
                        checks++;
                    }, 100);
                });
            }

            if (window.MUFTYAT_CITIES) {
                const nearest = getNearestCity(targetCity.lat, targetCity.lng);
                if (nearest) {
                    console.log(`Fallback city found: ${nearest.t}`);
                    const fallbackObj = { id: nearest.i, title: nearest.t, lat: nearest.la, lng: nearest.lo };
                    await loadScheduleForYear(year, true, fallbackObj);
                    return;
                }
            } else {
                console.warn("MUFTYAT_CITIES still undefined after waiting.");
            }
        }

        if (!currentSchedule) {
            document.getElementById('namaz-current-time').textContent = "Ошибка";
            const subtitle = document.querySelector('#namaz-countdown span');
            if (subtitle) subtitle.textContent = "Сервер недоступен";
        }
    }
}

// Haversine distance
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}

function getNearestCity(latStr, lngStr) {
    if (!window.MUFTYAT_CITIES) return null;
    const originLat = parseFloat(latStr);
    const originLng = parseFloat(lngStr);

    let closest = null;
    let minDistance = Infinity;

    for (const city of window.MUFTYAT_CITIES) {
        // Skip exact same city strings to avoid infinite loop
        if (city.la === latStr && city.lo === lngStr) continue;

        const d = getDistance(originLat, originLng, parseFloat(city.la), parseFloat(city.lo));
        // Find nearest city (hopefully valid in api)
        if (d < minDistance) {
            minDistance = d;
            closest = city;
        }
    }
    return closest;
}

function parseTimeStr(timeStr, dateObj) {
    const [h, m] = timeStr.split(':').map(Number);
    const d = new Date(dateObj);
    d.setHours(h, m, 0, 0);
    return d;
}

function getTodayString() {
    const d = window.currentSelectedDate || new Date();
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().split('T')[0];
}

function updateNamazUI() {
    if (!currentSchedule) return;

    const todayStr = getTodayString();
    let todayData = currentSchedule[todayStr];

    const now = new Date();

    if (!todayData) {
        // If data is unavailable, it could be a different year
        if (window.currentSelectedDate && window.currentSelectedDate.getFullYear() !== now.getFullYear()) {
            loadScheduleForYear(window.currentSelectedDate.getFullYear());
        }
        return;
    }

    let nextPrayerName = null;
    let nextPrayerTime = null;
    let currentPrayerName = null;

    for (let i = 0; i < ORDERED_PRAYERS.length; i++) {
        const key = ORDERED_PRAYERS[i];
        if (!todayData[key]) continue;
        const pDate = parseTimeStr(todayData[key], now);

        if (now < pDate) {
            nextPrayerName = key;
            nextPrayerTime = pDate;
            currentPrayerName = i > 0 ? ORDERED_PRAYERS[i - 1] : 'isha';
            break;
        }
    }

    if (!nextPrayerName) {
        currentPrayerName = 'isha';
        const dTomorrow = new Date(now);
        dTomorrow.setDate(now.getDate() + 1);
        const tzOffset = dTomorrow.getTimezoneOffset() * 60000;
        const tomorrowStr = new Date(dTomorrow.getTime() - tzOffset).toISOString().split('T')[0];

        const tomData = currentSchedule[tomorrowStr];
        if (tomData && tomData.fajr) {
            nextPrayerName = 'fajr';
            nextPrayerTime = parseTimeStr(tomData.fajr, dTomorrow);
        } else {
            if (dTomorrow.getFullYear() !== now.getFullYear()) {
                loadScheduleForYear(dTomorrow.getFullYear());
            }
        }
    }

    const titleEl = document.getElementById('namaz-current-time');
    if (currentPrayerName && currentPrayerName !== 'sunrise') {
        titleEl.textContent = `Сейчас: ${PRAYER_NAMES[currentPrayerName] || currentPrayerName}`;
    } else if (currentPrayerName === 'sunrise') {
        titleEl.textContent = `Время духа (до Зухра)`;
    } else {
        titleEl.textContent = `Трекер намазов`;
    }

    window._nextNamazInfo = { name: nextPrayerName, time: nextPrayerTime };

    highlightActivePrayer(currentPrayerName);
}

function highlightActivePrayer(prayerKey) {
    Object.values(PRAYER_CHECKBOХES).forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            const container = el.closest('label');
            if (container) {
                container.classList.remove('bg-emerald-50', 'dark:bg-emerald-900/20', 'border-l-4', 'border-emerald-500');
            }
        }
    });

    if (prayerKey && PRAYER_CHECKBOХES[prayerKey]) {
        const activeId = PRAYER_CHECKBOХES[prayerKey];
        const el = document.getElementById(activeId);
        if (el) {
            const container = el.closest('label');
            if (container) {
                container.classList.add('bg-emerald-50', 'dark:bg-emerald-900/20', 'border-l-4', 'border-emerald-500');
            }
        }
    }
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);

    const tick = () => {
        if (!window._nextNamazInfo || !window._nextNamazInfo.time) return;

        const now = new Date().getTime();
        const diff = window._nextNamazInfo.time.getTime() - now;

        if (diff <= 0) {
            updateNamazUI();
            return;
        }

        const diffStr = getCountdownString(diff);
        const nName = PRAYER_NAMES[window._nextNamazInfo.name] || window._nextNamazInfo.name;

        const countSpan = document.getElementById('namaz-countdown');
        if (countSpan && currentCityPref) {
            const cityName = currentCityPref.title;
            countSpan.innerHTML = `
                До ${nName} <b>${diffStr}</b> 
                <span class="mx-1 text-slate-300 dark:text-slate-600">|</span> 
                <i class="fas fa-map-marker-alt text-rose-500 mr-0.5"></i> 
                <span id="namaz-city-name" class="underline decoration-dotted decoration-slate-300 dark:decoration-slate-500 cursor-pointer">${cityName}</span>
            `;
        }
    };

    tick();
    timerInterval = setInterval(tick, 1000);
}

function getCountdownString(ms) {
    if (ms < 0) return "00:00:00";
    let secs = Math.floor(ms / 1000);
    let h = Math.floor(secs / 3600);
    let m = Math.floor((secs % 3600) / 60);
    let s = secs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

document.addEventListener('DOMContentLoaded', () => {
    initNamazTracker();
});
