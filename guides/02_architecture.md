# Техническая Архитектура (SurviveKit)

МашаАллах, наш код чист, прост и надежен как автомат Калашникова. Вот как все устроено под капотом:

## 🏗️ Стек Технологий

- **HTML5:** Две основные статические страницы: `index.html` (Лендинг) и `app.html` (Главное PWA-приложение).
- **CSS3 / TailwindCSS:** Дизайн через классы Tailwind, кастомные анимации и `style.css`.
- **Vanilla JavaScript:** Строгий ES Modules подход для ясности и отсутствия "магии" фреймворков.
- **Тройное хранилище (Triple Storage) & Sync:**
  - `LocalStorage`: для быстрых данных (текст задач, настройки, язык).
  - `IndexedDB`: для тяжелых данных (холст Tafakkur Board, base64 линии).
  - `Firebase Firestore`: для синхронизации в реальном времени при входе по почте (Google/Email).

## 📂 Структура Исходников (`src/`)

- `index.html` — Полноценный 4-язычный Landing Page с 3D-анимациями Tailwind, SEO-метатегами, кнопкой запуска приложения.
- `app.html` — PWA. Сам планер со всеми инструментами.
- `src/css/style.css` — Главный файл стилей (шрифты рукописные, фоны "binder-holes", цвета табов, свитч).
- `src/js/store.js` — Data Layer (LocalStorage / IndexedDB / Export-Import JSON).
- `src/js/i18n.js` — Система локализации. Массивы RU/KK/AR/EN. Переключение на лету (`?lang=`).
- `src/js/board.js` — Движок бесконечного холста (Zoom, Pan, Sticky Notes 4-х цветов, рисование).
- `src/js/activity-log.js` — История действий юзера (Audit Trail) с поддержкой Firestore.
- `src/js/auth.js`, `db.js`, `firebase-init.js` — Авторизация и синхронизация профиля в Google Firebase.
- `src/js/namaz-tracker.js` — Виджет расписания намазов (таймер, интеграция с Муфтиятом, graceful fallback).
- `src/js/muftyat-cities.js` — Огромная база координат 6000+ городов для вычисления ближайшего города без API.
- `src/js/main.js` — Главный контроллер DOM и роутер вкладок.
- `build-monolith.js` — Наш собственный Node.js-сборщик.

## ⚡ Оффлайн-First & Сборка (Monolith Builder)

Мы используем кастомный скрипт `build-monolith.js`.
**Зачем?**

1. Скрипт берёт `index.html` и `app.html`, встраивает (`inline`) весь JS и минифицированный через Tailwind CLI CSS.
2. Итог кладётся в папку `dist/`. `firebase.json` настроен так, чтобы хостить всё из `dist/`.
3. Для Landing Page (`index.html`) скрипт генерирует физические копии в папках `dist/kk/index.html`, `dist/ar/index.html` и т.д., чтобы боты (Google) и ссылки работали по правильному SEO (например `islamic-planer.web.app/ar`).
4. **PWA (Service Worker - `sw.js`):** Кэширует оба монолита, шрифты и картинки. Юзер в пустыне без интернета? Планер работает безупречно.

## 🏠 Локальный Режим и Роутинг (Firebase.json)

- **Firebase Hosting Rewrites:** `firebase.json` перехватывает пути `/ar`, `/en`, `/kk` и проксирует их на физические index.html внутри `dist`. А запрос к `/app` возвращает `/app.html`.
- **Автодетекция `file://`:** `auth.js` понимает, если юзер открыл скачанный `app.html` прямо с диска, пропуская Firebase, и включает "Local Mode" с PIN-кодом, локальным бэкапом и обходом CORS.

## 🔐 Безопасность (Security)

- **Firestore Rules:** Только авторизованный юзер `request.auth.uid == userId` может читать/писать в свои локации (например, `/users/{userId}/reminders/{reminderId}`). Ограничены названия коллекций.
- **Headers:** Паттерн HTTP-брони (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`).
- Контент пользователей защищён (disable pull-to-refresh iOS, pointer-events none).
