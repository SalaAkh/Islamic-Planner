# Техническая Архитектура (Barakah Planner)

МашаАллах, наш код чист, прост и надежен. Вот как все устроено под капотом:

## 🏗️ Стек Технологий

| Слой | Технология | Назначение |
| ---- | ---------- | ---------- |
| HTML | HTML5 | `index.html` (Лендинг) и `app.html` (PWA-приложение) |
| CSS | Tailwind CSS v4 + кастомный `style.css` | Дизайн, анимации, тёмная тема |
| JS | Vanilla JavaScript (ES Modules) | Вся логика без тяжелых фреймворков |
| Canvas | **Konva.js** | Tafakkur Board и Mind Map (бесконечные холсты) |
| Хранилище | LocalStorage + IndexedDB | Локальные оффлайн-данные |
| Синхронизация | Firebase Auth + Firestore | Облачный бэкап личных данных и совместная работа групп |
| Сборка | Кастомный `scripts/build-monolith.js` | Node.js сборщик монолитных страниц |
| Мобильный рантайм | **Capacitor v8** | Сборка нативных приложений под Android и iOS |
| Безопасность | Custom Sanitizer | XSS-санитизация пользовательского ввода перед рендером |
| Хостинг | Firebase Hosting | Деплой `dist/` в веб |

---

## 📂 Структура Файлов

```text
Islamic-Planner/
├── app.html              ← PWA (источник; после build содержит инлайн JS+CSS)
├── index.html            ← Лендинг (4 языка)
├── capacitor.config.json ← Настройки нативных плагинов Capacitor
│
├── android/              ← Android-проект для сборки APK (Capacitor)
├── ios/                  ← iOS-проект для сборки приложения (Capacitor)
│
├── src/
│   ├── css/
│   │   ├── style.css         ← Исходник: @import tailwindcss + кастомные классы
│   │   └── tailwind.css      ← Скомпилированный CSS (генерируется CLI)
│   └── js/
│       ├── activity-log.js   ← Аудит действий пользователя, стрик-система
│       ├── auth.js           ← Firebase Auth (Google + Email) & Guest Mode
│       ├── board.js          ← Tafakkur Board: Konva.js движок
│       ├── daily-wisdom.js   ← Мудрость дня (случайные Аяты/Хадисы на базе даты)
│       ├── db.js             ← Firestore Sync (DbSync) для личных данных
│       ├── firebase-init.js  ← Firebase конфиг (API ключ через .env)
│       ├── gamification.js   ← Система баллов, уровней и анимаций
│       ├── groups.js         ← Совместные воркспейсы (Группы) и синхронизация
│       ├── i18n.js           ← Система локализации (RU/KK/AR/EN)
│       ├── main.js           ← Главный контроллер DOM и роутер вкладок
│       ├── mindmap.js        ← Интеллект-карты: Konva.js движок
│       ├── muftyat-cities.js ← База 6000+ городов для оффлайн-поиска намаза
│       ├── namaz-tracker.js  ← Намаз-виджет (muftyat.kz API + fallback)
│       ├── native.js         ← Интеграция с нативными плагинами Capacitor
│       ├── store.js          ← Data Layer (LocalStorage / IndexedDB / JSON export)
│       ├── tasbih.js         ← Счетчик Тасбиха (вибрация, пресеты, цели)
│       ├── todo-manager.js   ← Менеджер задач
│       └── utils/
│           └── sanitize.js   ← Утилиты безопасности и XSS-санитизации
│
├── scripts/
│   ├── build-monolith.js     ← Основной сборщик (Node.js) встраивает JS/CSS
│   └── patch-tailwind-css.js ← Патч скомпилированного CSS
│
├── public/
│   ├── sw.js                 ← Service Worker (PWA кэш)
│   ├── manifest.json         ← PWA Manifest
│   └── favicon.ico
│
├── dist/                     ← Финальная сборка (деплоится в Web/Capacitor)
└── .env                      ← FIREBASE_API_KEY (локально, не в git)
```

---

## ⚡ Процесс Сборки (Monolith & Capacitor)

Мы собираем веб-монолит, который затем упаковывается Capacitor.

### Сборка веб-монолита
```bash
npm run build
# Выполняет:
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

### Синхронизация с мобильными платформами
После успешного билда в папку `dist/` нативные платформы синхронизируются через Capacitor CLI:
```bash
npx cap sync
# Копирует веб-активы из dist/ в папки android/ и ios/, обновляет плагины
```
Запуск сборки приложения в IDE разработчика (Android Studio / Xcode):
```bash
npx cap open android
npx cap open ios
```

---

## 🔄 Архитектура Данных и Облачная Синхронизация

Мы используем гибридную систему оффлайн-хранения с облачной реактивной синхронизацией.

```text
Пользователь вводит данные
        ↓
[LocalStorage]          ← Быстрые данные: задачи, настройки, язык, оффлайн группы
[IndexedDB]             ← Тяжёлые данные: холст Konva (JSON), рисунки (path)
[Firebase Firestore]    ← Облачный бэкап (Личный профиль + Группы)
        ↓
JSON Export/Import      ← Универсальный бэкап в один клик
```

### 👥 Синхронизация Групповых Пространств (groups.js)

При активации группы через Workspace Switcher приложение переключается с личного пространства на групповое:
1. Ключи LocalStorage получают префикс `barakah_group_{groupId}_` (например, `barakah_group_{groupId}_tasks_...`).
2. Изменения реактивно синхронизируются с Firestore по пути:
   - Состояние доски: `/groups/{groupId}/data/board_state`
   - Рисование на доске: `/groups/{groupId}/data/board_drawing`
   - Напоминания и события: `/groups/{groupId}/data/events`
   - Списки дел: `/groups/{groupId}/data/todo_lists`
   - Данные конкретного дня (задачи, ният): `/groups/{groupId}/data/day_{date}`
3. Firestore-слушатели (`onSnapshot`) мгновенно обновляют локальный интерфейс у всех подключенных участников группы при изменениях.

---

## 🗺️ Архитектура Графических Движков (Konva.js)

В проекте используются два независимых холста на базе `Konva.js`.

### 1. Tafakkur Board (board.js)
```text
#board-container (HTML div)
    └── Konva.Stage
        ├── noteLayer       ← Стикеры (Konva.Group), текстовые блоки, фигуры, стрелки
        └── pathLayer       ← Свободное рисование (Konva.Line paths)
```
*   **Функции:** Тулбар инструментов (выделение, текст, стикеры, фигуры, стрелки, карандаш, ластик), context-menu для быстрого редактирования объектов, масштабирование (Zoom) и перемещение (Pan).
*   **Undo/Redo:** Снапшоты состояния сохраняются в историю. При откате Transformer временно отцепляется, чтобы избежать сбоев Konva.

### 2. Mind Map (mindmap.js)
```text
#mindmap-container (HTML div)
    └── Konva.Stage
        ├── gridLayer       ← Сетка из точек (визуальный ориентир при панорамировании)
        ├── linkLayer       ← Связи между узлами (Konva.Arrow / Konva.Line)
        └── nodeLayer       ← Иерархические узлы (Konva.Group с текстом и иконками управления)
```
*   **Связи:** Линии связи строятся автоматически от центра родительского узла к границам дочерних.
*   **Иерархия:** Каждая нода хранит ссылку на `parentId` и массив `children`. Перемещение родительской ноды автоматически перерисовывает все дочерние связи.

---

## 📱 Мобильная Интеграция (native.js)

Для полноценной работы в режиме нативного мобильного приложения используется `native.js`:
1.  **Детекция окружения:** Скрипт проверяет `Capacitor.isNativePlatform()`. На десктопе в браузере плагины не инициализируются.
2.  **StatusBar:** Устанавливает темный стиль текста (`Style.Dark`) и темно-синий цвет фона статус-бара (`#0f172a`) под дизайн приложения.
3.  **SplashScreen:** Скрывает загрузочный экран (`SplashScreen.hide()`) с задержкой 500мс после полной загрузки веб-интерфейса.
4.  **Android Back Button:** Перехватывает системное нажатие кнопки «Назад»:
    *   Если открыто диалоговое окно (`dialog[open]`), закрывает его.
    *   Если нет истории переходов, вызывает `App.exitApp()` для выхода из приложения.
    *   В остальных случаях переходит назад по истории браузера (`window.history.back()`).

---

## 🔐 Безопасность (Security)

*   **XSS Protection (`sanitize.js`):** Все текстовые данные, вводимые пользователями (задачи, стикеры, нияты, названия групп/нод), проходят обработку через `escapeHtml()` перед вставкой в DOM через `innerHTML`.
*   **Firestore Rules:** Доступ к личным данным изолирован по `request.auth.uid`. Доступ к групповым данным разрешен только участникам, чьи e-mail адреса прописаны в массиве `members` документа группы в коллекции `/groups`.
*   **HTTP-защита:** Заголовки безопасности HSTS, CSP и защита от кликджекинга на уровне хостинга Firebase.
