# Техническая Архитектура (Barakah Planner)

МашаАллах, наш код чист, прост и надёжен как автомат Калашникова. Вот как всё устроено под капотом:

## 🏗️ Стек Технологий

| Слой | Технология | Назначение |
| ---- | ---------- | ---------- |
| HTML | HTML5 | `index.html` (Лендинг) и `app.html` (PWA-приложение) |
| CSS | Tailwind CSS v4 + кастомный `style.css` | Дизайн, анимации, тёмная тема |
| JS | Vanilla JavaScript (ES Modules) | Вся логика без фреймворков |
| Canvas | **Konva.js** | Tafakkur Board (infinite canvas) |
| Хранилище | LocalStorage + IndexedDB | Оффлайн-данные |
| Синхронизация | Firebase Auth + Firestore | Облачный бэкап при входе |
| Сборка | Кастомный `scripts/build-monolith.js` | Node.js сборщик |
| Хостинг | Firebase Hosting | `dist/` → продакшн |

---

## 📂 Структура Файлов

```text
Islamic-Planner/
├── app.html              ← PWA (источник; после build содержит инлайн JS+CSS)
├── index.html            ← Лендинг (4 языка)
│
├── src/
│   ├── css/
│   │   ├── style.css         ← Исходник: @import tailwindcss + кастомные классы
│   │   └── tailwind.css      ← Скомпилированный CSS (генерируется CLI)
│   └── js/
│       ├── board.js          ← Tafakkur Board: Konva.js движок
│       ├── main.js           ← Главный контроллер DOM и роутер вкладок
│       ├── store.js          ← Data Layer (LocalStorage / IndexedDB / JSON export)
│       ├── i18n.js           ← Система локализации (RU/KK/AR/EN)
│       ├── auth.js           ← Firebase Auth (Google + Email) & Guest Mode
│       ├── db.js             ← Firestore Sync (DbSync)
│       ├── firebase-init.js  ← Firebase конфиг (API ключ через .env)
│       ├── namaz-tracker.js  ← Намаз-виджет (muftyat.kz API + fallback)
│       ├── muftyat-cities.js ← База 6000+ городов для оффлайн-поиска
│       ├── activity-log.js   ← Аudит действий пользователя
│       └── todo-manager.js   ← Менеджер задач
│
├── scripts/
│   ├── build-monolith.js     ← Основной сборщик (Node.js)
│   └── patch-tailwind-css.js ← Патч скомпилированного CSS
│
├── public/
│   ├── sw.js                 ← Service Worker (PWA кэш)
│   ├── manifest.json         ← PWA Manifest
│   └── favicon.ico
│
├── functions/                ← Firebase Cloud Functions (опционально)
├── guides/                   ← Документация
├── dist/                     ← Финальная сборка (деплоится на Firebase)
└── .env                      ← FIREBASE_API_KEY (локально, не в git)
```

---

## ⚡ Процесс Сборки (Monolith Builder)

Мы используем кастомный скрипт `scripts/build-monolith.js`.

### Почему монолит?

1. **Один HTML = мгновенная загрузка.** Никаких дополнительных HTTP-запросов за JS и CSS.
2. **Работает оффлайн как нативное приложение.** Service Worker кэширует один файл.
3. **Без webpack/vite** — меньше зависимостей, меньше проблем.

## Что делает build

```bash
npm run build
# ↕
# 1. npx @tailwindcss/cli → компилирует style.css → tailwind.css (минифицирует)
# 2. scripts/patch-tailwind-css.js → исправляет известные конфликты в CSS
# 3. scripts/build-monolith.js:
#    - Читает app.html (исходник)
#    - Встраивает (inline) tailwind.css → <style>
#    - Встраивает (inline) все src/js/*.js → <script>
#    - Генерирует dist/app.html (PWA монолит)
#    - Генерирует dist/index.html (Лендинг)
#    - Генерирует dist/kk|en|ar/index.html (SEO страницы)
```

> ⚠️ **Важно для разработки:** Корневой `app.html` — это **источник** (HTML-структура + ссылки на `src/js/*.js`). Для локальной разработки открывайте его через Live Server VS Code. После каждого изменения JS/CSS запускайте `npm run build` → результат в `dist/app.html` автоматически копируется в корень.

---

## 🔄 Архитектура Данных (Triple Storage)

```text
Пользователь вводит данные
        ↓
[LocalStorage]          ← Быстрые данные: задачи, настройки, язык, намерение
[IndexedDB]             ← Тяжёлые данные: холст Konva (JSON), рисунки (path)
[Firebase Firestore]    ← Синхронизация при наличии интернета и авторизации
        ↓
JSON Export/Import      ← Универсальный бэкап всего
```

## Ключевые ключи LocalStorage

- `barakah_tasks_{date}` — задачи дня
- `barakah_board_state_{boardId}` — состояние доски (ноды Konva)
- `barakah_boards_meta` — список всех досок (id, name, thumbnail)
- `barakah_lang` — выбранный язык

## IndexedDB (через `store.js`)

- `drawing_{boardId}` — JSON-слой рисования Konva (PathLayer)

---

## 🗺️ Tafakkur Board — Архитектура Konva.js

```text
#board-container (HTML div)
    └── Konva.Stage
        ├── noteLayer       ← Стикеры (Konva.Group), текстовые блоки, фигуры, стрелки
        └── pathLayer       ← Рисование (Konva.Line paths)
```

**Компоненты board.js:**

- `initBoard()` — инициализация Stage, слоёв, трансформера, событий мыши
- `setMode(mode)` — переключает режим тулбара (pan/text/sticky/shape/arrow/pencil/eraser)
- `bindTextArea()` — overlay-textarea для редактирования текста на canvas
- `selectNode()` — выбор объекта + показ context menu с цветами
- `saveBoardState()` / `loadBoardState()` — сохранение/загрузка из LocalStorage + IndexedDB
- `openBoard(boardId)` / `deleteBoard()` — управление несколькими досками

---

## 🏠 Локальный Режим и Роутинг

- **Firebase Hosting Rewrites:** `firebase.json` перехватывает пути `/ar`, `/en`, `/kk` и проксирует их на физические index.html внутри `dist`. Запрос к `/app` возвращает `/app.html`.
- **Автодетекция `file://` / Local Mode:** `auth.js` понимает запуск с диска и предлагает оффлайн "Local Mode" с PIN-кодом.
- **Guest Mode:** Также в модалке аутентификации присутствует кнопка «Продолжить без авторизации», которая устанавливает флаг `barakah_guest` в LocalStorage, позволяя использовать приложение полностью оффлайн без облачной синхронизации.

---

## 🔐 Безопасность (Security)

- **Firestore Rules:** Только авторизованный юзер `request.auth.uid == userId` может читать/писать в свои локации (например, `/users/{userId}/reminders/{reminderId}`). Ограничены названия коллекций.
- **Headers:** Паттерн HTTP-брони (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`).
- Контент пользователей защищён (disable pull-to-refresh iOS, pointer-events none).
