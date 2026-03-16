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

const PRAYER_I18N_KEYS = {
    'fajr': 'fajr',
    'sunrise': 'namaz_prayer_sunrise',
    'dhuhr': 'zuhr',
    'asr': 'asr',
    'maghrib': 'maghrib',
    'isha': 'isha'
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
let normalizedCitiesCache = null;
let normalizedCitiesSource = null;
let namazHeaderStateKey = 'namaz_widget_default_title';
let namazStatusStateKey = 'namaz_loading';
let citySearchStateKey = 'city_search_empty';
let citySearchStateTone = 'neutral';

const FIXED_ABAY_CITY_TITLE = '\u0410\u0431\u0430\u0439 \u049b\u0430\u043b\u0430\u0441\u044b';
const FIXED_ABAY_SHORT_TITLE = '\u0410\u0431\u0430\u0439';
const FIXED_KARAGANDA_REGION = '\u049a\u0430\u0440\u0430\u0493\u0430\u043d\u0434\u044b \u043e\u0431\u043b\u044b\u0441\u044b';
const FIXED_KARAGANDA_CITY_TITLE = '\u049a\u0430\u0440\u0430\u0493\u0430\u043d\u0434\u044b \u049b\u0430\u043b\u0430\u0441\u044b';
const BROKEN_KARAGANDA_REGION = '\u049a\u0430\u0440\u0430\u0493\u0430\u043d\u0434\u044b \u043e\u0431\u043b\u044b\ufffd\ufffd\u044b';
const ABAY_CITY_COORDS = '49.631899,72.859245';
const KARAGANDA_SCHEDULE_FALLBACK = {
    id: '39',
    title: FIXED_KARAGANDA_CITY_TITLE,
    lat: '49.806406',
    lng: '73.085485'
};

const CITY_TEXT_FIXES = {
    [BROKEN_KARAGANDA_REGION]: FIXED_KARAGANDA_REGION
};

const SCHEDULE_CITY_OVERRIDES = {
    '164': KARAGANDA_SCHEDULE_FALLBACK,
    [ABAY_CITY_COORDS]: KARAGANDA_SCHEDULE_FALLBACK
};

function tNamaz(key, fallback = '') {
    if (typeof window.t === 'function') {
        const translated = window.t(key);
        if (translated && translated !== key) return translated;
    }
    return fallback || key;
}

function getPrayerDisplayName(prayerKey) {
    return tNamaz(PRAYER_I18N_KEYS[prayerKey], PRAYER_NAMES[prayerKey] || prayerKey);
}

function setNamazHeaderText(text) {
    const titleEl = document.getElementById('namaz-current-time');
    if (titleEl) titleEl.textContent = text;
}

function setNamazHeaderByKey(key, fallback) {
    namazHeaderStateKey = key;
    setNamazHeaderText(tNamaz(key, fallback));
}

function setNamazCountdownHtml(html) {
    namazStatusStateKey = null;
    const countdownEl = document.getElementById('namaz-countdown');
    if (countdownEl) countdownEl.innerHTML = html;
}

function setNamazCountdownByKey(key, fallback) {
    namazStatusStateKey = key;
    const countdownEl = document.getElementById('namaz-countdown');
    if (!countdownEl) return;
    countdownEl.innerHTML = `<span>${tNamaz(key, fallback)}</span>`;
}

function renderCityEmptyState() {
    citySearchStateKey = 'city_search_empty';
    citySearchStateTone = 'neutral';

    const container = document.getElementById('city-search-results');
    if (!container) return;

    container.innerHTML = `<div class="text-center text-sm text-gray-400 py-4" id="city-search-empty" data-i18n="city_search_empty">${tNamaz('city_search_empty', 'Начните вводить название...')}</div>`;
}

function renderCityStatusMessage(key, fallback, tone = 'neutral') {
    citySearchStateKey = key;
    citySearchStateTone = tone;

    const container = document.getElementById('city-search-results');
    if (!container) return;

    let toneClasses = 'text-gray-400';
    let prefix = '';
    if (tone === 'loading') {
        toneClasses = 'text-emerald-500';
        prefix = '<i class="fas fa-spinner fa-spin mr-2"></i>';
    } else if (tone === 'error') {
        toneClasses = 'text-red-400';
    }

    container.innerHTML = `<div class="text-center text-sm ${toneClasses} py-4">${prefix}${tNamaz(key, fallback)}</div>`;
}

function clearCitySearchState() {
    citySearchStateKey = null;
    citySearchStateTone = null;
}

function refreshCityResultsForCurrentQuery() {
    const modal = document.getElementById('city-selection-modal');
    const searchInput = document.getElementById('city-search-input');
    if (!modal || modal.classList.contains('hidden') || !searchInput) return;

    const q = searchInput.value.trim().toLowerCase();
    const cities = getAvailableCities();

    if (q.length < 2) {
        if (cities.length > 0) renderCityResults(cities.slice(0, 50));
        else renderCityEmptyState();
        return;
    }

    if (cities.length > 0) {
        const results = cities.filter(c => (c.t || '').toLowerCase().includes(q)).slice(0, 50);
        renderCityResults(results);
    }
}

function handleNamazLanguageChange() {
    if (!currentCityPref) {
        updateHeaderCityName(tNamaz('namaz_city_select', 'Выбрать город...'));
    }

    if (namazHeaderStateKey) {
        setNamazHeaderByKey(namazHeaderStateKey);
    }

    if (namazStatusStateKey) {
        setNamazCountdownByKey(namazStatusStateKey);
    }

    if (!namazHeaderStateKey || !namazStatusStateKey) {
        if (currentSchedule) updateNamazUI();
        startTimer();
    }

    if (citySearchStateKey) {
        if (citySearchStateKey === 'city_search_empty') {
            renderCityEmptyState();
        } else {
            renderCityStatusMessage(citySearchStateKey, '', citySearchStateTone || 'neutral');
        }
    } else {
        refreshCityResultsForCurrentQuery();
    }
}

function normalizeCityText(value) {
    if (typeof value !== 'string') return value || '';
    const trimmed = value.trim();
    return CITY_TEXT_FIXES[trimmed] || trimmed.replace(/\uFFFD+/g, 'с');
}

function isKaragandaAbayCity(city) {
    if (!city) return false;

    const title = normalizeCityText(city.title ?? city.t ?? '');
    const region = normalizeCityText(city.r);
    const coordsKey = `${String(city.lat ?? city.la ?? '')},${String(city.lng ?? city.lo ?? '')}`;
    const cityId = String(city.id ?? city.i ?? '');

    return cityId === '164'
        || coordsKey === ABAY_CITY_COORDS
        || title === FIXED_ABAY_CITY_TITLE
        || (title === FIXED_ABAY_SHORT_TITLE && region === FIXED_KARAGANDA_REGION);
}

function normalizeCityEntry(city) {
    if (!city) return null;
    const rawId = city.id ?? city.i ?? '';
    const rawTitle = city.title ?? city.t ?? '';
    const rawLat = city.lat ?? city.la ?? '';
    const rawLng = city.lng ?? city.lo ?? '';

    const normalized = {
        ...city,
        id: String(rawId),
        i: String(rawId),
        title: normalizeCityText(rawTitle),
        t: normalizeCityText(rawTitle),
        lat: String(rawLat),
        la: String(rawLat),
        lng: String(rawLng),
        lo: String(rawLng),
        r: normalizeCityText(city.r)
    };

    if (isKaragandaAbayCity(normalized)) {
        normalized.id = '164';
        normalized.i = '164';
        normalized.title = FIXED_ABAY_CITY_TITLE;
        normalized.t = FIXED_ABAY_CITY_TITLE;
        normalized.r = FIXED_KARAGANDA_REGION;
    }

    return normalized;
}

function getAvailableCities() {
    if (!Array.isArray(window.MUFTYAT_CITIES)) return [];
    if (normalizedCitiesSource === window.MUFTYAT_CITIES && normalizedCitiesCache) {
        return normalizedCitiesCache;
    }

    normalizedCitiesSource = window.MUFTYAT_CITIES;
    normalizedCitiesCache = window.MUFTYAT_CITIES
        .map(normalizeCityEntry)
        .filter(Boolean);

    return normalizedCitiesCache;
}

function resolveScheduleCity(targetCity) {
    const normalized = normalizeCityEntry(targetCity);
    const byId = SCHEDULE_CITY_OVERRIDES[normalized.id];
    const byCoords = SCHEDULE_CITY_OVERRIDES[`${normalized.lat},${normalized.lng}`];
    if (isKaragandaAbayCity(normalized)) {
        return { ...KARAGANDA_SCHEDULE_FALLBACK };
    }
    return byId || byCoords || normalized;
}

async function initNamazTracker() {
    setupModalEvents();

    const saved = localStorage.getItem(PREF_CITY_KEY);
    if (saved) {
        currentCityPref = normalizeCityEntry(JSON.parse(saved));
        localStorage.setItem(PREF_CITY_KEY, JSON.stringify(currentCityPref));
        updateHeaderCityName(currentCityPref.title);
        await loadScheduleForYear(new Date().getFullYear());
    } else {
        updateHeaderCityName(tNamaz('namaz_city_select', 'Выбрать город...'));
        setNamazHeaderByKey('namaz_widget_default_title', 'Трекер намазов');
        setNamazCountdownByKey('namaz_city_not_selected', 'Город не выбран');
    }

    startTimer();

    window.addEventListener('dateChanged', () => {
        updateNamazUI();
    });
    document.addEventListener('langChanged', handleNamazLanguageChange);
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
        const cities = getAvailableCities();
        if (cities.length > 0) {
            renderCityResults(cities.slice(0, 50));
        } else {
            renderCityEmptyState();
        }
    });

    const closeModal = () => {
        modalContent.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            modal.classList.add('hidden');
            searchInput.value = '';
            renderCityEmptyState();
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
                const cities = getAvailableCities();
                if (cities.length > 0) {
                    renderCityResults(cities.slice(0, 50));
                } else {
                    renderCityEmptyState();
                }
                return;
            }

            const cities = getAvailableCities();
            if (cities.length > 0) {
                const results = cities.filter(c => (c.t || '').toLowerCase().includes(q)).slice(0, 50);
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
                    })).map(normalizeCityEntry);
                    renderCityResults(mapped);
                } catch (e) {
                    console.error("City search failed:", e);
                    renderCityStatusMessage('city_search_error', 'Ошибка сети', 'error');
                }
            }
        }, 300);
    });

    window.selectNamazCity = async (id, title, lat, lng) => {
        currentCityPref = normalizeCityEntry({ id, i: id, title, t: title, lat, la: lat, lng, lo: lng, r: '' });
        localStorage.setItem(PREF_CITY_KEY, JSON.stringify(currentCityPref));
        updateHeaderCityName(currentCityPref.title);
        closeModal();

        setNamazHeaderByKey('namaz_loading', 'Загрузка...');
        setNamazCountdownByKey('namaz_schedule_loading', 'Получение расписания');

        await loadScheduleForYear(new Date().getFullYear(), true);
        updateNamazUI();
    };
}

function renderCityResults(cities, isLoading = false) {
    if (isLoading) {
        renderCityStatusMessage('city_search_loading', 'Поиск...', 'loading');
        return;
    }

    if (!cities || cities.length === 0) {
        renderCityStatusMessage('city_search_no_results', 'Ничего не найдено');
        return;
    }

    clearCitySearchState();
    const container = document.getElementById('city-search-results');
    if (!container) return;

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

async function loadScheduleForYear(year, forceFetch = false, fallbackCity = null, ignoreSet = new Set()) {
    if (!currentCityPref && !fallbackCity) return;

    const targetCity = normalizeCityEntry(fallbackCity || currentCityPref);
    const apiCity = resolveScheduleCity(targetCity);
    const cityId = parseInt(targetCity.id || targetCity.i, 10);
    const storeKey = `${NAMAZ_STORAGE_KEY_PREFIX}${cityId}_${year}`;

    // Add current target to ignore set so we don't pick it as fallback
    ignoreSet.add(cityId);

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
        const lat = apiCity.lat || apiCity.la;
        const lng = apiCity.lng || apiCity.lo;
        let res = await fetch(`https://api.muftyat.kz/prayer-times/${year}/${lat}/${lng}`);

        // If current year fails, try year - 1
        if (!res.ok) {
            console.warn(`[NamazTracker] ${year} API error (${res.status}) for ${targetCity.title}, trying ${year - 1}...`);
            res = await fetch(`https://api.muftyat.kz/prayer-times/${year - 1}/${lat}/${lng}`);

            // IF BOTH FAIL, we throw an error to trigger the fallback city logic in the catch block
            if (!res.ok) {
                throw new Error(`API error ${res.status} for both ${year} and ${year - 1}`);
            }
        }

        const data = await res.json();
        if (data && data.result) {
            const scheduleMap = {};
            data.result.forEach(day => {
                let dateStr = day.Date;
                // Important: if we're using data from previous year, we need to correct the year string
                if (!dateStr.startsWith(year.toString())) {
                    dateStr = year.toString() + dateStr.substring(4);
                }
                scheduleMap[dateStr] = day;
            });
            currentSchedule = scheduleMap;
            // Cache the result for the specific city and year
            const prefStoreKey = `${NAMAZ_STORAGE_KEY_PREFIX}${cityId}_${year}`;
            localStorage.setItem(prefStoreKey, JSON.stringify(scheduleMap));
            updateNamazUI();
        }
    } catch (e) {
        console.warn(`[NamazTracker] Load failed for ${targetCity.title}: ${e.message}`);

        // Limit fallback depth by checking ignoreSet size (max 5 fallbacks)
        if (ignoreSet.size < 5) {
            console.warn("[NamazTracker] Searching for nearest city as fallback...");

            // Wait up to 2 seconds for MUFTYAT_CITIES to load if it's external
            if (!Array.isArray(window.MUFTYAT_CITIES)) {
                console.log("Waiting for cities JS to load...");
                await new Promise(resolve => {
                    let checks = 0;
                    const interval = setInterval(() => {
                        if (Array.isArray(window.MUFTYAT_CITIES) || checks > 20) {
                            clearInterval(interval);
                            resolve();
                        }
                        checks++;
                    }, 100);
                });
            }

            if (getAvailableCities().length > 0) {
                const nearest = getNearestCity(lat, lng, ignoreSet);
                if (nearest) {
                    console.warn(`[NamazTracker] Fallback found: ${nearest.t}`);
                    const fallbackObj = { id: nearest.i, title: nearest.t, lat: nearest.la, lng: nearest.lo, r: nearest.r };
                    await loadScheduleForYear(year, true, fallbackObj, ignoreSet);
                    return;
                }
            } else {
                console.warn("MUFTYAT_CITIES still undefined after waiting.");
            }
        }

        if (!currentSchedule) {
            setNamazHeaderByKey('namaz_error', 'Ошибка');
            setNamazCountdownByKey('namaz_server_unavailable', 'Сервер недоступен');
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

function getNearestCity(originLat, originLng, ignoreSet = new Set()) {
    const cities = getAvailableCities();
    if (cities.length === 0) return null;
    originLat = parseFloat(originLat);
    originLng = parseFloat(originLng);

    let closest = null;
    let minDistance = Infinity;

    for (const city of cities) {
        const cityLat = parseFloat(city.la);
        const cityLng = parseFloat(city.lo);
        const cityId = parseInt(city.i, 10);

        // Skip exact same location (within ~100 meters) to avoid infinite loop
        const dist = getDistance(originLat, originLng, cityLat, cityLng);
        if (dist < 0.1) continue;

        // Skip cities we've already tried (robust ID check)
        if (ignoreSet.has(cityId)) continue;

        if (dist < minDistance) {
            minDistance = dist;
            closest = { ...city, dist };
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

    if (currentPrayerName && currentPrayerName !== 'sunrise') {
        namazHeaderStateKey = null;
        setNamazHeaderText(`${tNamaz('namaz_current_prefix', 'Сейчас:')} ${getPrayerDisplayName(currentPrayerName)}`);
    } else if (currentPrayerName === 'sunrise') {
        setNamazHeaderByKey('namaz_duha_time', 'Время духа (до Зухра)');
    } else {
        setNamazHeaderByKey('namaz_widget_default_title', 'Трекер намазов');
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
        const nName = getPrayerDisplayName(window._nextNamazInfo.name);

        const countSpan = document.getElementById('namaz-countdown');
        if (countSpan && currentCityPref) {
            const cityName = currentCityPref.title;
            setNamazCountdownHtml(`
                ${tNamaz('namaz_until_prefix', 'До')} ${nName} <b>${diffStr}</b> 
                <span class="mx-1 text-slate-300 dark:text-slate-600">|</span> 
                <i class="fas fa-map-marker-alt text-rose-500 mr-0.5"></i> 
                <span id="namaz-city-name" class="underline decoration-dotted decoration-slate-300 dark:decoration-slate-500 cursor-pointer">${cityName}</span>
            `);
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
