# 🌙 Barakah Planner (Islamic Planner & Tafakkur Board)

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%26%20Sync-orange.svg)](https://firebase.google.com/)
[![PWA](https://img.shields.io/badge/PWA-Offline--First-blue.svg)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
[![Konva.js](https://img.shields.io/badge/Canvas-Konva.js-red.svg)](https://konvajs.org/)

**Barakah Planner** — это высокотехнологичная экосистема продуктивности для мусульман, построенная по философии **Barakah Planner**. Мы объединили духовные практики и современные методы планирования в одном защищённом, offline-первом приложении.

ИншаАллах, это поможет вам достичь бараката в делах и жизни.

🔗 **Live:** <https://islamic-planer.web.app>

---

## 🚀 Основные возможности

### 🕋 Духовный фундамент

- **Ибадат-трекер:** Отслеживание намазов (с визуальной пульсацией при 100% выполнении), азкаров и чтения Корана.
- **Хиджра Календарь:** Автоматический расчёт дат и подсветка **Сунна-постов** (понедельник и четверг) и пятниц.
- **Ният-модуль:** Начинайте каждый день с осознанного намерения.
- **Намаз-трекер:** Виджет с обратным отсчётом до следующего намаза (API muftyat.kz + оффлайн-fallback по 6000+ городам).

### 🧠 Планирование и Творчество

- **Интеллектуальный Планер:** Расписание с блоками по временам намаза (Фаджр–Зухр и т.д.).
- **Tafakkur Board (Miro-style):** Бесконечный холст с Konva.js. Несколько досок, стикеры, фигуры, стрелки, карандаш, ластик. Keyboard shortcuts (V/T/N/S/A/P/E). Смена цвета прямо в тулбаре.
- **AI Assistant (Gemini):** Личный помощник, составляющий план дня (требуется ваш API-ключ).
- **Глобальные Цели:** Разделение на Ахират и Дунья.

### ☁️ Синхронизация и Безопасность

- **Firebase Sync:** Автоматическая синхронизация данных между устройствами (Firestore).
- **Multi-Auth:** Вход через Google или Email.
- **Barakah Backup:** Экспорт всех данных в один JSON-файл за секунду.
- **Local Mode:** Работает через `file://` без Firebase с PIN-кодом.

---

## 🛠 Технический стек

| Слой | Технология |
| ---- | ---------- |
| UI | Vanilla JS, HTML5, Tailwind CSS v4 |
| Canvas | Konva.js (Tafakkur Board) |
| Хранилище | LocalStorage + IndexedDB |
| Синхронизация | Firebase Auth + Firestore |
| Сборка | Кастомный `scripts/build-monolith.js` (Node.js) |
| Hosting | Firebase Hosting (`dist/`) |
| PWA | Service Worker (`public/sw.js`) |

---

## 📦 Установка и запуск

### Для пользователя

1. Откройте <https://islamic-planer.web.app> в любом современном браузере.
2. Или установите как PWA через иконку в адресной строке.

### Для разработчика (локально)

```bash
# 1. Клонируйте репозиторий
git clone https://github.com/SalaAkh/Islamic-Planner.git
cd Islamic-Planner

# 2. Установите зависимости
npm install

# 3. Разработка (Tailwind watch)
npm run dev         # Следит за style.css и пересобирает tailwind.css

# 4. Сборка монолита
npm run build       # Tailwind → CSS → app.html + index.html → dist/

# 5. Деплой на Firebase
npx firebase-tools deploy
```

> ⚠️ **Важно:** После каждого изменения в `src/js/*.js` или `src/css/style.css` нужно запускать `npm run build`, чтобы изменения попали в `app.html`. Используйте `npm run dev` для авто-пересборки CSS.

### Переменные окружения (`.env`)

```env
FIREBASE_API_KEY=...
```

---

## 📁 Структура проекта

```text
Islamic-Planner/
├── app.html              ← 🏠 PWA (монолит с инлайн JS+CSS после npm run build)
├── index.html            ← 🛬 Лендинг (4 языка)
├── src/
│   ├── css/
│   │   ├── style.css     ← Исходник стилей (Tailwind @import + кастомный CSS)
│   │   └── tailwind.css  ← Скомпилированный CSS (генерируется)
│   └── js/
│       ├── board.js      ← Tafakkur Board (Konva.js engine)
│       ├── main.js       ← Главный контроллер / роутер вкладок
│       ├── store.js      ← Data Layer (LocalStorage/IndexedDB/Export)
│       ├── i18n.js       ← Локализация 4 языков (RU/KK/AR/EN)
│       ├── auth.js       ← Firebase Auth
│       ├── db.js         ← Firestore sync
│       ├── namaz-tracker.js   ← Намаз-виджет
│       └── muftyat-cities.js  ← База 6000+ городов (оффлайн-fallback)
├── scripts/
│   ├── build-monolith.js ← Основной сборщик
│   └── patch-tailwind-css.js
├── public/
│   ├── sw.js             ← Service Worker
│   └── manifest.json
├── guides/               ← Документация проекта
├── dist/                 ← Сборка (генерируется, деплоится на Firebase)
└── functions/            ← Firebase Cloud Functions (опционально)
```

---

## 📖 Документация (Guides)

Для глубокого погружения изучите наши гайды:

- 📖 [**Обзор проекта**](guides/01_project_overview.md) — Видение, миссия и бизнес-модель.
- 🏗️ [**Архитектура**](guides/02_architecture.md) — Как всё устроено под капотом.
- 🎨 [**Функционал**](guides/03_features.md) — Детальное описание каждой фичи.

---

## ❤️ Поддержать проект

Проект развивается Фисабилиллях. Если Barakah Planner помогает вам, вы можете стать причиной его дальнейшего роста:

- **Kaspi.kz:** `+7 700 430 32 09` (Перевод по номеру)
- [**Patreon**](https://www.patreon.com/c/Sala_ah)
- [**Boosty**](https://boosty.to/Sala_ah)

---

*«Тому, кто укажет на благое дело, полагается такая же награда, как и тому, кто его совершил».* (Муслим).

Джазакаллаху Хайран за то, что вы с нами!

## 📜 Лицензия

MIT. Используйте во благо Уммы.
