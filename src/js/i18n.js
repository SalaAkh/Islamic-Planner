// Словарь переводов
const translations = {
    ru: {
        "seo_title": "Barakah Planner — Исламский Ежедневник и Планировщик Намазов",
        "seo_desc": "Планируй свой день по Исламу: трекер намазов, цели Ахирата и Дуньи, доска идей Tafakkur. Бесплатно.",
        "seo_image": "https://islamic-planer.web.app/public/banner-ru.png",
        "tab_daily": "День", "tab_calendar": "Календарь", "tab_goals": "Цели", "tab_board": "Доска",
        "date_today": "Дата:", "date_val_today": "Сегодня",
        "title_daily": "План на день", "niyyah_label": "Ният:", "niyyah_ph": "Ради довольства Аллаха...",
        "ibadah_title": "Ибадат Трекер", "quran_title": "Чтение Корана", "quran_ph": "Сура / Аяты",
        "sadaka_title": "Садака / Благое дело", "sadaka_ph": "Кому помочь сегодня?",
        "fajr": "Фаджр", "morning_azkar": "Уттренние азкары", "zuhr": "Зухр", "asr": "Аср",
        "evening_azkar": "Вечерние азкары", "maghrib": "Магриб", "isha": "Иша", "witr": "Витр",
        "fajr_zuhr": "Фаджр — Зухр", "zuhr_asr": "Зухр — Аср", "asr_maghrib": "Аср — Магриб",
        "maghrib_isha": "Магриб — Иша", "isha_sleep": "Иша — Сон", "nav_prev_day": "Предыдущий день", "nav_next_day": "Следующий день",
        "focus_label": "Фокус", "routine_label": "Рутина", "add_task": "Добавить задачу",
        "task1_ph": "Главная задача дня...", "task5_ph": "Бытовые дела...", "task7_ph": "Семья, ужин...", "task9_ph": "Уединение, отдых...", "task10_ph": "Чтение перед сном...",
        "btn_import": "Импорт", "btn_export": "Экспорт", "btn_ai": "ИИ Ассистент",
        "auth_btn": "Войти",
        "tooltip_lang": "Смена языка",
        "tooltip_theme": "Смена темы",
        "tooltip_auth": "Войти / Профиль",
        "tooltip_donate": "Поддержать проект",
        "ai_modal_title": "ИИ Планировщик", "ai_setup_help": "Для работы требуется ваш API ключ Gemini",
        "btn_save": "Сохранить", "btn_generate": "Создать план", "ai_loading_text": "Нейросеть думает...",
        "toast_saved": "Сохранено",
        "calendar_title": "Календарь", "calendar_info": "Понедельники и четверги выделены для Сунна-постов",
        "calendar_mon": "Пн", "calendar_tue": "Вт", "calendar_wed": "Ср", "calendar_thu": "Чт", "calendar_fri": "Пт", "calendar_sat": "Сб", "calendar_sun": "Вс",
        "month_notes_title": "События месяца", "month_notes_ph": "Запланированные встречи, поездки, долги по постам...",
        "ai_prompt_label": "Как распланировать день?", "placeholder_ai": "Например: Утром тренировка, днем кодинг стартапа, Аср - чтение 10 страниц Корана...",
        "goals_title": "Глобальные Цели", "ahirat_title": "Ахират (Вечное)", "dunya_title": "Дунья (Мирское)",
        "board_title": "Tafakkur Board", "board_info": "Бесконечный холст · Pinch-to-zoom на мобильном", "center_btn": "Центр",
        "donate_title": "Поддержать проект", "donate_text": "Ваша поддержка помогает развивать проект и приносить больше пользы Умме. Джазакаллаху Хайран!",
        "section_contacts": "Контакты", "contacts_desc": "Давайте превратим вашу идею в стабильный бизнес. Пишите!", "contacts_city": "Караганда, Казахстан",
        "label_name": "Ваше имя", "placeholder_name": "Ваше имя", "label_contact": "Email", "placeholder_contact": "Email", "label_message": "Сообщение", "placeholder_message": "Расскажите о вашем проекте", "btn_send": "Отправить",
        "goal_religion_title": "Изучение Религии", "goal_religion_ph": "Выучить Джуз Амма, прочитать Сиру...",
        "goal_habits_title": "Характер и Привычки", "goal_habits_ph": "Перестать гневаться, совершать тахаджуд...",
        "goal_sadaka_title": "Садака Джария", "goal_sadaka_ph": "Поучаствовать в строительстве колодца...",
        "goal_work_title": "Работа и Финансы", "goal_work_ph": "Закрыть долги, повысить квалификацию...",
        "goal_health_title": "Здоровье и Тело", "goal_health_ph": "Спорт 3 раза в неделю, правильное питание...",
        "goal_family_title": "Семья и Отношения", "goal_family_ph": "Больше времени с родителями...",
        "goal_custom_title": "Своя цель", "goal_custom_ph": "Напишите свою цель...", "add_custom_goal": "Добавить цель",
        "tool_hand_title": "Перемещение (V)", "tool_hand_label": "Рука",
        "tool_pencil_title": "Карандаш (P)", "tool_pencil_label": "Рисунок",
        "tool_eraser_title": "Ластик (E)", "tool_eraser_label": "Ластик",
        "tool_color_label": "Цвет", "tool_size_label": "Размер",
        "tool_clear_title": "Очистить рисунок", "tool_clear_label": "Очистить",
        "ai_setup_ph": "Gemini API Key (AIzaSy...)", "ai_free_key": "Получить бесплатный ключ",
        "ph_task_main": "Главная задача дня...", "ph_task_household": "Бытовые дела...",
        "ph_task_family": "Семья, ужин...", "ph_task_rest": "Уединение, отдых...",
        "ph_task_reading": "Чтение перед сном...", "ai_modal_subtitle": "На базе Google Gemini 3",
        "donate_toast_title": "Поддержите проект", "donate_toast_text": "Ваша помощь помогает проекту расти. Джазакаллаху Хайран!",
        "kaspi_label": "Kaspi.kz (Перевод по номеру)", "kaspi_copy": "Скопировать номер", "kaspi_success": "Номер скопирован!",
        "auth_title": "Облачная синхронизация", "auth_subtitle": "Сохраните свои данные онлайн", "auth_login_btn": "Войти", "profile_title": "Ваш профиль", "auth_logout": "Выйти",
        "sync_status": "Синхронизация включена. Ваши данные в безопасности (ИншаАллах).",
        "event_modal_title": "Новое событие", "event_tab_event": "Событие", "event_tab_reminder": "Напоминание",
        "event_title_label": "Название", "event_title_ph": "Название события...",
        "event_type_label": "Тип события", "event_type_select_ph": "Выберите тип",
        "event_type_islamic": "Исламское", "event_type_personal": "Личное", "event_type_work": "Работа", "event_type_family": "Семья", "event_type_health": "Здоровье",
        "event_date_label": "Дата", "event_time_label": "Время",
        "event_location_label": "Место", "event_location_ph": "Видеоконференция / Мечеть / ...",
        "event_repeat_label": "Повтор", "event_allday_label": "Весь день",
        "event_repeat_type_label": "Частота", "event_repeat_end_label": "До даты",
        "repeat_daily": "Ежедневно", "repeat_weekly": "Еженедельно", "repeat_monthly": "Ежемесячно", "repeat_yearly": "Ежегодно",
        "event_alert_label": "Уведомление",
        "alert_none": "Без уведомления", "alert_5min": "За 5 минут", "alert_15min": "За 15 минут", "alert_30min": "За 30 минут", "alert_1hour": "За 1 час", "alert_1day": "За 1 день",
        "event_tag_label": "Тег", "event_tag_ph": "#важное #встреча",
        "event_notes_label": "Заметки", "event_notes_ph": "Дополнительные заметки...",
        "event_save_btn": "Сохранить", "event_delete_btn": "Удалить", "event_add_btn": "Добавить",
        "events_no_events": "Нет событий на этот день", "event_saved_toast": "Событие сохранено!", "event_deleted_toast": "Событие удалено",
        "log_login": "Вход в аккаунт", "log_logout": "Выход из аккаунта", "log_register": "Регистрация", "log_task_toggled": "Задача отмечена", "log_day_saved": "День сохранён", "log_goals_saved": "Цели обновлены", "log_goal_added": "Цель добавлена", "log_event_saved": "Событие сохранено", "log_event_deleted": "Событие удалено", "log_note_created": "Стикер создан", "log_note_deleted": "Стикер удалён", "log_drawing_saved": "Рисунок сохранён", "log_drawing_stroke_saved": "Штрих на доске", "log_drawing_cleared": "Рисунок очищен", "log_backup_exported": "Резервная копия создана", "log_backup_imported": "Данные восстановлены",
        "time_just_now": "только что", "time_mins_ago": "мин назад", "time_hours_ago": "ч назад", "time_today": "сегодня", "time_yesterday": "вчера",
        "state_done": "выполнено", "state_undone": "снято", "type_ahirat": "Ахират", "type_dunya": "Дунья", "log_color_yellow": "🟡 жёлтый", "log_color_green": "🟢 зелёный", "log_color_blue": "🔵 синий",
        "log_syncing": "Синхронизация...", "log_no_access_title": "Доступ ограничен", "log_no_access_desc": "Войдите в аккаунт, чтобы история действий сохранялась и была доступна на всех устройствах.", "log_empty_title": "История пока пуста", "log_empty_desc": "Начните планировать свой день, и здесь появятся ваши первые шаги 🌱", "log_error_title": "Ошибка загрузки данных", "log_error_desc": "Проверьте подключение к интернету",
        "ai_key_saved": "API ключ сохранен!", "ai_plan_generated": "План сгенерирован! МашаАллах!", "ai_error_key": "Неверный API ключ или параметры. Проверьте настройки.", "ai_error_server": "Ошибка сервера", "ai_error_format": "Непредвиденный формат ответа от Gemini.", "ai_error": "Ошибка ИИ", "ai_error_format_retry": "ИИ вернул неверный формат ответа. Попробуйте еще раз.",
        "ai_lang_name": "русском",
        "backup_downloaded": "Резервная копия скачана", "backup_restored": "Данные восстановлены! Перезагрузка...", "backup_error": "Ошибка при импорте данных!",
        "lang_changed": "Язык изменен",
        "log_user_login": "Вход в аккаунт", "log_user_logout": "Выход из аккаунта", "log_user_register": "Регистрация",
        "aria_mark_task": "Отметить задачу", "aria_new_task": "Новая задача", "ph_new_task": "Новая задача...",
        "btn_delete_goal": "Удалить"
    },
    kk: {
        "seo_title": "Barakah Planner — Исламдық Күнделік және Намаз Жоспарлаушы",
        "seo_desc": "Күніңізді Ислам бойынша жоспарлаңыз: намаз трекері, Ақырет пен Дүние мақсаттары, Tafakkur идеялар тақтасы. Тегін.",
        "seo_image": "https://islamic-planer.web.app/public/banner-kk.png",
        "tab_daily": "Күн", "tab_calendar": "Күнтізбе", "tab_goals": "Мақсаттар", "tab_board": "Тақта",
        "date_today": "Күн:", "date_val_today": "Бүгін",
        "title_daily": "Күн жоспары", "niyyah_label": "Ниет:", "niyyah_ph": "Алланың разылығы үшін...",
        "ibadah_title": "Құлшылық Трекері", "quran_title": "Құран оқу", "quran_ph": "Сүре / Аяттар",
        "sadaka_title": "Садақа / Жақсы іс", "sadaka_ph": "Бүгін кімге көмектесемін?",
        "fajr": "Бамдат", "morning_azkar": "Таңғы зікірлер", "zuhr": "Бесін", "asr": "Екінті",
        "evening_azkar": "Кешкі зікірлер", "maghrib": "Ақшам", "isha": "Құптан", "witr": "Үтір",
        "fajr_zuhr": "Бамдат — Бесін", "zuhr_asr": "Бесін — Екінті", "asr_maghrib": "Екінті — Ақшам",
        "maghrib_isha": "Ақшам — Құптан", "isha_sleep": "Құптан — Ұйқы", "nav_prev_day": "Алдыңғы күн", "nav_next_day": "Келесі күн",
        "focus_label": "Фокус", "routine_label": "Рутина", "add_task": "Тапсырма",
        "task1_ph": "Күннің басты міндеті...", "task5_ph": "Тұрмыстық істер...", "task7_ph": "Отбасы, кешкі ас...", "task9_ph": "Демалыс...", "task10_ph": "Ұйқы алдында оқу...",
        "btn_import": "Импорт", "btn_export": "Экспорт", "btn_ai": "ЖИ Көмекшісі",
        "auth_btn": "Кіру",
        "tooltip_lang": "Тілді өзгерту",
        "tooltip_theme": "Тақырыпты өзгерту",
        "tooltip_auth": "Кіру / Профиль",
        "tooltip_donate": "Жобаға қолдау көрсету",
        "ai_modal_title": "ЖИ Жоспарлаушы", "ai_setup_help": "Жұмыс істеу үшін Gemini API кілті қажет",
        "btn_save": "Сақтау", "btn_generate": "Жоспар құру", "ai_loading_text": "Жүйе ойлануда...",
        "toast_saved": "Сақталды",
        "calendar_title": "Күнтізбе", "calendar_info": "Дүйсенбі және бейсенбі Сүннет оразалары үшін белгіленген",
        "calendar_mon": "Дс", "calendar_tue": "Сс", "calendar_wed": "Ср", "calendar_thu": "Бс", "calendar_fri": "Жм", "calendar_sat": "Сн", "calendar_sun": "Жк",
        "month_notes_title": "Ай оқиғалары", "month_notes_ph": "Жоспарланған кездесулер, сапарлар, қарыз оразалар...",
        "ai_prompt_label": "Күнді қалай жоспарлаймыз?", "placeholder_ai": "Мысалы: Таңертең жаттығу, күндіз жұмыс, Аср - Құран оқу...",
        "goals_title": "Ауқымды Мақсаттар", "ahirat_title": "Ақырет (Мәңгілік)", "dunya_title": "Дүние (Өткінші)",
        "board_title": "Тафаккур Тақтасы", "board_info": "Шексіз кенеп · Мобильдік құрылғыда Pinch-to-zoom", "center_btn": "Ортасы",
        "donate_title": "Жобаға қолдау көрсету", "donate_text": "Сіздің қолдауыңыз жобаның дамуына және Үмбетке көбірек пайда әкелуіне көмектеседі. Жазакаллаһу Хайран!",
        "section_contacts": "Байланыс", "contacts_desc": "Идеяңызды тұрақты бизнеске айналдырайық. Жазыңыз!", "contacts_city": "Қарағанды, Қазақстан",
        "label_name": "Атыңыз", "placeholder_name": "Атыңыз", "label_contact": "Email", "placeholder_contact": "Email", "label_message": "Хабарлама", "placeholder_message": "Жобаңыз туралы айтып беріңіз", "btn_send": "Жіберу",
        "goal_religion_title": "Дінді Үйрену", "goal_religion_ph": "Амма парасын жаттау, Сираны оқу...",
        "goal_habits_title": "Мінез бен Әдеттер", "goal_habits_ph": "Ашуланбау, тәһәжжүд оқу...",
        "goal_sadaka_title": "Жария Садақа", "goal_sadaka_ph": "Құдық қазуға үлес қосу...",
        "goal_work_title": "Жұмыс пен Қаржы", "goal_work_ph": "Қарыздарды жабу, біліктілікті арттыру...",
        "goal_health_title": "Денсаулық пен Дене", "goal_health_ph": "Аптасына 3 рет спорт, дұрыс тамақтану...",
        "goal_family_title": "Отбасы мен Қарым-қатынас", "goal_family_ph": "Ата-анамен көбірек уақыт өткізу...",
        "goal_custom_title": "Өз мақсатым", "goal_custom_ph": "Өз мақсатыңызды жазыңыз...", "add_custom_goal": "Мақсат қосу",
        "tool_hand_title": "Жылжыту (V)", "tool_hand_label": "Қол",
        "tool_pencil_title": "Қарындаш (P)", "tool_pencil_label": "Сурет",
        "tool_eraser_title": "Өшіргіш (E)", "tool_eraser_label": "Өшіргіш",
        "tool_color_label": "Түс", "tool_size_label": "Өлшем",
        "tool_clear_title": "Суретті тазарту", "tool_clear_label": "Тазарту",
        "ai_setup_ph": "Gemini API кілті (AIzaSy...)", "ai_free_key": "Тегін кілтті алу",
        "ph_task_main": "Күннің басты міндеті...", "ph_task_household": "Тұрмыстық істер...",
        "ph_task_family": "Отбасы, кешкі ас...", "ph_task_rest": "Оңашалану, демалыс...",
        "ph_task_reading": "Ұйықтар алдында оқу...", "ai_modal_subtitle": "Google Gemini 3 негізінде",
        "donate_toast_title": "Жобаға қолдау көрсетіңіз", "donate_toast_text": "Сіздің көмегіңіз жобаның өсуіне ықпал етеді. Жазакаллаһу Хайран!",
        "kaspi_label": "Kaspi.kz (Нөмір бойынша аударым)", "kaspi_copy": "Нөмірді көшіру", "kaspi_success": "Нөмір көшірілді!",
        "auth_title": "Бұлтты синхрондау", "auth_subtitle": "Деректеріңізді онлайн сақтаңыз", "auth_login_btn": "Кіру", "profile_title": "Сіздің профиліңіз", "auth_logout": "Шығу",
        "sync_status": "Синхрондау қосулы. Сіздің деректеріңіз қауіпсіздікте (ИншаАллах).",
        "event_modal_title": "Жаңа оқиға", "event_tab_event": "Оқиға", "event_tab_reminder": "Еске салу",
        "event_title_label": "Атауы", "event_title_ph": "Оқиға атауы...",
        "event_type_label": "Оқиға түрі", "event_type_select_ph": "Түрін таңдаңыз",
        "event_type_islamic": "Ислами", "event_type_personal": "Жеке", "event_type_work": "Жұмыс", "event_type_family": "Отбасы", "event_type_health": "Денсаулық",
        "event_date_label": "Күні", "event_time_label": "Уақыты",
        "event_location_label": "Орны", "event_location_ph": "Бейнеконференция / Мешіт / ...",
        "event_repeat_label": "Қайталау", "event_allday_label": "Күні бойы",
        "event_repeat_type_label": "Жиілігі", "event_repeat_end_label": "Дейін",
        "repeat_daily": "Күн сайын", "repeat_weekly": "Апта сайын", "repeat_monthly": "Ай сайын", "repeat_yearly": "Жыл сайын",
        "event_alert_label": "Хабарлама",
        "alert_none": "Хабарламасыз", "alert_5min": "5 минут бұрын", "alert_15min": "15 минут бұрын", "alert_30min": "30 минут бұрын", "alert_1hour": "1 сағат бұрын", "alert_1day": "1 күн бұрын",
        "event_tag_label": "Тег", "event_tag_ph": "#маңызды #кездесу",
        "event_notes_label": "Жазбалар", "event_notes_ph": "Қосымша жазбалар...",
        "event_save_btn": "Сақтау", "event_delete_btn": "Жою", "event_add_btn": "Қосу",
        "events_no_events": "Бұл күнге оқиға жоқ", "event_saved_toast": "Оқиға сақталды!", "event_deleted_toast": "Оқиға жойылды",
        "log_login": "Тіркелгіге кіру", "log_logout": "Тіркелгіден шығу", "log_register": "Тіркелу", "log_task_toggled": "Тапсырма белгіленді", "log_day_saved": "Күн сақталды", "log_goals_saved": "Мақсаттар жаңартылды", "log_goal_added": "Мақсат қосылды", "log_event_saved": "Оқиға сақталды", "log_event_deleted": "Оқиға жойылды", "log_note_created": "Стикер жасалды", "log_note_deleted": "Стикер жойылды", "log_drawing_saved": "Сурет сақталды", "log_drawing_stroke_saved": "Тақтадағы сызық", "log_drawing_cleared": "Сурет тазартылды", "log_backup_exported": "Резервтік көшірме жасалды", "log_backup_imported": "Деректер қалпына келтірілді",
        "time_just_now": "жаңа ғана", "time_mins_ago": "мин бұрын", "time_hours_ago": "сағ бұрын", "time_today": "бүгін", "time_yesterday": "кеше",
        "state_done": "орындалды", "state_undone": "алынды", "type_ahirat": "Ақырет", "type_dunya": "Дүние", "log_color_yellow": "🟡 сары", "log_color_green": "🟢 жасыл", "log_color_blue": "🔵 көк",
        "log_syncing": "Синхрондау...", "log_no_access_title": "Қол жеткізу шектелген", "log_no_access_desc": "Әрекеттер тарихы сақталуы үшін тіркелгіге кіріңіз.", "log_empty_title": "Тарих әзірге бос", "log_empty_desc": "Күніңізді жоспарлауды бастаңыз, қадамдарыңыз осында пайда болады 🌱", "log_error_title": "Деректерді жүктеу қатесі", "log_error_desc": "Интернет қосылымын тексеріңіз",
        "ai_key_saved": "API кілті сақталды!", "ai_plan_generated": "Жоспар құрылды! МашаАллах!", "ai_error_key": "API кілті немесе параметрлер қате.", "ai_error_server": "Сервер қатесі", "ai_error_format": "Gemini-ден күтпеген жауап форматы.", "ai_error": "ЖИ қатесі", "ai_error_format_retry": "ЖИ қате жауап форматын қайтарды. Қайта көріңіз.",
        "ai_lang_name": "қазақ",
        "backup_downloaded": "Резервтік көшірме жүктелді", "backup_restored": "Деректер қалпына келтірілді! Қайта жүктелуде...", "backup_error": "Деректерді импорттау қатесі!",
        "lang_changed": "Тіл өзгертілді",
        "log_user_login": "Тіркелгіге кіру", "log_user_logout": "Тіркелгіден шығу", "log_user_register": "Тіркелу",
        "aria_mark_task": "Тапсырманы белгілеу", "aria_new_task": "Жаңа тапсырма", "ph_new_task": "Жаңа тапсырма...",
        "btn_delete_goal": "Жою"
    },
    ar: {
        "seo_title": "Barakah Planner — يوميات إسلامية ومخطط الصلاة",
        "seo_desc": "خطط ليومك وفقًا للإسلام: متتبع الصلاة، أهداف الآخرة والدنيا، لوحة أفكار تفكر. مجاني.",
        "seo_image": "https://islamic-planer.web.app/public/banner-ar.png",
        "tab_daily": "اليوم", "tab_calendar": "التقويم", "tab_goals": "الأهداف", "tab_board": "اللوحة",
        "date_today": "التاريخ:", "date_val_today": "اليوم",
        "title_daily": "خطة اليوم", "niyyah_label": "النية:", "niyyah_ph": "ابتغاء مرضاة الله...",
        "ibadah_title": "متتبع العبادات", "quran_title": "قراءة القرآن", "quran_ph": "سورة / آيات",
        "sadaka_title": "صدقة / عمل صالح", "sadaka_ph": "لمن سأقدم المساعدة اليوم؟",
        "fajr": "الفجر", "morning_azkar": "أذكار الصباح", "zuhr": "الظهر", "asr": "العصر",
        "evening_azkar": "أذكار المساء", "maghrib": "المغرب", "isha": "العشاء", "witr": "الوتر",
        "fajr_zuhr": "الفجر — الظهر", "zuhr_asr": "الظهر — العصر", "asr_maghrib": "العصر — المغرب",
        "maghrib_isha": "المغرب — العشاء", "isha_sleep": "العشاء — النوم", "nav_prev_day": "اليوم السابق", "nav_next_day": "اليوم التالي",
        "focus_label": "التركيز", "routine_label": "العادات", "add_task": "إضافة مهمة",
        "task1_ph": "المهمة الرئيسية اليوم...", "task5_ph": "الأعمال المنزلية...", "task7_ph": "العائلة، العشاء...", "task9_ph": "استراحة...", "task10_ph": "القراءة قبل النوم...",
        "btn_import": "استيراد", "btn_export": "تصدير", "btn_ai": "المساعد الذكي",
        "auth_btn": "تسجيل الدخول",
        "tooltip_lang": "تغيير اللغة",
        "tooltip_theme": "تغيير المظهر",
        "tooltip_auth": "تسجيل الدخول / الملف الشخصي",
        "tooltip_donate": "دعم المشروع",
        "ai_modal_title": "المخطط الذكي", "ai_setup_help": "مطلوب مفتاح Gemini API",
        "btn_save": "حفظ", "btn_generate": "إنشاء الخطة", "ai_loading_text": "جاري التفكير...",
        "toast_saved": "تم الحفظ",
        "calendar_title": "التقويم", "calendar_info": "الإثنين والخميس مخصصان لصيام السنة",
        "calendar_mon": "ن", "calendar_tue": "ث", "calendar_wed": "ر", "calendar_thu": "خ", "calendar_fri": "ج", "calendar_sat": "س", "calendar_sun": "أ",
        "month_notes_title": "أحداث الشهر", "month_notes_ph": "الاجتماعات المخطط لها، السفر...",
        "ai_prompt_label": "كيف تخطط ليومك؟", "placeholder_ai": "مثال: تدريب صباحي، برمجة ظهرا، قراءة القرآن عصرا...",
        "goals_title": "الأهداف الكبرى", "ahirat_title": "الآخرة", "dunya_title": "الدنيا",
        "board_title": "لوحة التفكر", "board_info": "مساحة غير محدودة", "center_btn": "المركز",
        "donate_title": "دعم المشروع", "donate_text": "دعمكم يساعد في تطوير المشروع وتقديم المزيد من النفع للأمة. جزاكم الله خيراً!",
        "section_contacts": "جهات الاتصال", "contacts_desc": "دعونا نحول فكرتك إلى عمل مستقر. تواصل معنا!", "contacts_city": "قراغندي، كازاخستان",
        "label_name": "اسمك", "placeholder_name": "اسمك", "label_contact": "البريد الإلكتروني", "placeholder_contact": "البريد الإلكتروني", "label_message": "رسالة", "placeholder_message": "أخبرنا عن مشروعك", "btn_send": "إرسال",
        "goal_religion_title": "دراسة الدين", "goal_religion_ph": "حفظ جزء عم، قراءة السيرة...",
        "goal_habits_title": "الشخصية والعادات", "goal_habits_ph": "تجنب الغضب، قيام الليل...",
        "goal_sadaka_title": "صدقة جارية", "goal_sadaka_ph": "المساهمة في بناء بئر...",
        "goal_work_title": "العمل والمال", "goal_work_ph": "سداد الديون، تطوير المهارات...",
        "goal_health_title": "الصحة والجسم", "goal_health_ph": "الرياضة 3 مرات أسبوعياً، الأكل الصحي...",
        "goal_family_title": "الأسرة والعلاقات", "goal_family_ph": "قضاء المزيد من الوقت مع الوالدين...",
        "goal_custom_title": "هدفي الخاص", "goal_custom_ph": "اكتب هدفك الخاص...", "add_custom_goal": "إضافة هدف",
        "tool_hand_title": "تحريك (V)", "tool_hand_label": "يد",
        "tool_pencil_title": "قلم (P)", "tool_pencil_label": "رسم",
        "tool_eraser_title": "ممحاة (E)", "tool_eraser_label": "ممحاة",
        "tool_color_label": "لون", "tool_size_label": "حجم",
        "tool_clear_title": "مسح الرسم", "tool_clear_label": "مسح",
        "ai_setup_ph": "مفتاح Gemini API (AIzaSy...)", "ai_free_key": "احصل على مفتاح مجاني",
        "ph_task_main": "المهمة الرئيسية لليوم...", "ph_task_household": "الأعمال المنزلية...",
        "ph_task_family": "العائلة، العشاء...", "ph_task_rest": "الخلوة، الراحة...",
        "ph_task_reading": "القراءة قبل النوم...", "ai_modal_subtitle": "بدعم من Google Gemini 3",
        "donate_toast_title": "ادعم المشروع", "donate_toast_text": "مساعدتك تساعد المشروع على النمو. جزاكم الله خيراً!",
        "kaspi_label": "Kaspi.kz (تحويل عن طريق الرقم)", "kaspi_copy": "نسخ الرقم", "kaspi_success": "تم نسخ الرقم!",
        "auth_title": "المزامنة السحابية", "auth_subtitle": "احفظ بياناتك عبر الإنترنت", "auth_login_btn": "تسجيل الدخول", "profile_title": "ملفك الشخصي", "auth_logout": "تسجيل الخروج",
        "sync_status": "المزامنة قيد التشغيل. بياناتك آمنة (إن شاء الله).",
        "event_modal_title": "حدث جديد", "event_tab_event": "حدث", "event_tab_reminder": "تذكير",
        "event_title_label": "العنوان", "event_title_ph": "عنوان الحدث...",
        "event_type_label": "نوع الحدث", "event_type_select_ph": "اختر النوع",
        "event_type_islamic": "إسلامي", "event_type_personal": "شخصي", "event_type_work": "عمل", "event_type_family": "عائلة", "event_type_health": "صحة",
        "event_date_label": "التاريخ", "event_time_label": "الوقت",
        "event_location_label": "المكان", "event_location_ph": "مؤتمر فيديو / مسجد / ...",
        "event_repeat_label": "تكرار", "event_allday_label": "طوال اليوم",
        "event_repeat_type_label": "التكرار", "event_repeat_end_label": "حتى",
        "repeat_daily": "يومياً", "repeat_weekly": "أسبوعياً", "repeat_monthly": "شهرياً", "repeat_yearly": "سنوياً",
        "event_alert_label": "تنبيه",
        "alert_none": "بدون تنبيه", "alert_5min": "قبل 5 دقائق", "alert_15min": "قبل 15 دقيقة", "alert_30min": "قبل 30 دقيقة", "alert_1hour": "قبل ساعة", "alert_1day": "قبل يوم",
        "event_tag_label": "وسم", "event_tag_ph": "#مهم #اجتماع",
        "event_notes_label": "ملاحظات", "event_notes_ph": "ملاحظات إضافية...",
        "event_save_btn": "حفظ", "event_delete_btn": "حذف", "event_add_btn": "إضافة",
        "events_no_events": "لا توجد أحداث في هذا اليوم", "event_saved_toast": "تم حفظ الحدث!", "event_deleted_toast": "تم حذف الحدث",
        "log_login": "تسجيل الدخول", "log_logout": "تسجيل الخروج", "log_register": "التسجيل", "log_task_toggled": "تم تحديد المهمة", "log_day_saved": "تم حفظ اليوم", "log_goals_saved": "تم تحديث الأهداف", "log_goal_added": "تمت إضافة الهدف", "log_event_saved": "تم حفظ الحدث", "log_event_deleted": "تم حذف الحدث", "log_note_created": "تم إنشاء الملصق", "log_note_deleted": "تم حذف الملصق", "log_drawing_saved": "تم حفظ الرسم", "log_drawing_stroke_saved": "خط على اللوحة", "log_drawing_cleared": "تم مسح الرسم", "log_backup_exported": "تم التصدير للنسخ الاحتياطي", "log_backup_imported": "تمت استعادة البيانات",
        "time_just_now": "الآن", "time_mins_ago": "دقائق مضت", "time_hours_ago": "ساعات مضت", "time_today": "اليوم", "time_yesterday": "أمس",
        "state_done": "منجز", "state_undone": "غير منجز", "type_ahirat": "الآخرة", "type_dunya": "الدنيا", "log_color_yellow": "🟡 أصفر", "log_color_green": "🟢 أخضر", "log_color_blue": "🔵 أزرق",
        "log_syncing": "مزامنة...", "log_no_access_title": "الوصول مقيد", "log_no_access_desc": "قم بتسجيل الدخول لحفظ سجل الأنشطة والوصول إليه عبر الأجهزة.", "log_empty_title": "السجل فارغ حاليا", "log_empty_desc": "ابدأ بتخطيط يومك، وستظهر خطواتك الأولى هنا 🌱", "log_error_title": "خطأ في تحميل البيانات", "log_error_desc": "تحقق من اتصالك بالإنترنت",
        "ai_key_saved": "تم حفظ مفتاح API!", "ai_plan_generated": "تم إنشاء الخطة! ما شاء الله!", "ai_error_key": "مفتاح API غير صالح.", "ai_error_server": "خطأ خادم", "ai_error_format": "تنسيق استجابة غير متوقع من Gemini.", "ai_error": "خطأ ذكاء اصطناعي", "ai_error_format_retry": "أرجع الذكاء الاصطناعي تنسيق استجابة غير صالح. حاول مرة أخرى.",
        "ai_lang_name": "العربية",
        "backup_downloaded": "تم تنزيل النسخة الاحتياطية", "backup_restored": "تم استرداد البيانات! إعادة التشغيل...", "backup_error": "خطأ في استيراد البيانات!",
        "lang_changed": "تم تغيير اللغة",
        "log_user_login": "تسجيل الدخول", "log_user_logout": "تسجيل الخروج", "log_user_register": "التسجيل",
        "aria_mark_task": "تحديد المهمة", "aria_new_task": "مهمة جديدة", "ph_new_task": "مهمة جديدة...",
        "btn_delete_goal": "حذف"
    },
    en: {
        "seo_title": "Barakah Planner — Islamic Daily Planner & Prayer Tracker",
        "seo_desc": "Plan your day according to Islam: prayer tracker, Akhirah & Dunya goals, Tafakkur idea board. Free.",
        "seo_image": "https://islamic-planer.web.app/public/banner-en.png",
        "tab_daily": "Daily", "tab_calendar": "Calendar", "tab_goals": "Goals", "tab_board": "Board",
        "date_today": "Date:", "date_val_today": "Today",
        "title_daily": "Daily Plan", "niyyah_label": "Niyyah:", "niyyah_ph": "For the sake of Allah...",
        "ibadah_title": "Ibadah Tracker", "quran_title": "Quran Reading", "quran_ph": "Surah / Ayahs",
        "sadaka_title": "Sadaqah / Good Deed", "sadaka_ph": "Who to help today?",
        "fajr": "Fajr", "morning_azkar": "Morning Azkar", "zuhr": "Zuhr", "asr": "Asr",
        "evening_azkar": "Evening Azkar", "maghrib": "Maghrib", "isha": "Isha", "witr": "Witr",
        "fajr_zuhr": "Fajr — Zuhr", "zuhr_asr": "Zuhr — Asr", "asr_maghrib": "Asr — Maghrib",
        "maghrib_isha": "Maghrib — Isha", "isha_sleep": "Isha — Sleep", "nav_prev_day": "Previous day", "nav_next_day": "Next day",
        "focus_label": "Focus", "routine_label": "Routine", "add_task": "Add task",
        "task1_ph": "Main task of the day...", "task5_ph": "Household chores...", "task7_ph": "Family, dinner...", "task9_ph": "Rest, me time...", "task10_ph": "Reading before sleep...",
        "btn_import": "Import", "btn_export": "Export", "btn_ai": "AI Assistant",
        "auth_btn": "Login",
        "tooltip_lang": "Change language",
        "tooltip_theme": "Change theme",
        "tooltip_auth": "Login / Profile",
        "tooltip_donate": "Support project",
        "ai_modal_title": "AI Planner", "ai_setup_help": "Gemini API key is required",
        "btn_save": "Save", "btn_generate": "Generate Plan", "ai_loading_text": "AI is thinking...",
        "toast_saved": "Saved",
        "calendar_title": "Calendar", "calendar_info": "Mondays and Thursdays are for Sunnah fasting",
        "calendar_mon": "Mo", "calendar_tue": "Tu", "calendar_wed": "We", "calendar_thu": "Th", "calendar_fri": "Fr", "calendar_sat": "Sa", "calendar_sun": "Su",
        "month_notes_title": "Month Events", "month_notes_ph": "Planned meetings, trips, missed fasts...",
        "ai_prompt_label": "How to plan the day?", "placeholder_ai": "e.g., Morning workout, coding at noon, Asr - reading Quran...",
        "goals_title": "Global Goals", "ahirat_title": "Akhirah (Eternal)", "dunya_title": "Dunya (Worldly)",
        "board_title": "Tafakkur Board", "board_info": "Infinite canvas · Pinch-to-zoom on mobile", "center_btn": "Center",
        "donate_title": "Support the Project", "donate_text": "Your support helps develop the project and bring more benefit to the Ummah. Jazakallahu Khairan!",
        "section_contacts": "Contacts", "contacts_desc": "Let's turn your idea into a stable business. Contact us!", "contacts_city": "Karaganda, Kazakhstan",
        "label_name": "Your name", "placeholder_name": "Your name", "label_contact": "Email", "placeholder_contact": "Email", "label_message": "Message", "placeholder_message": "Tell us about your project", "btn_send": "Send",
        "goal_religion_title": "Studying Religion", "goal_religion_ph": "Memorize Juz Amma, read Seerah...",
        "goal_habits_title": "Character and Habits", "goal_habits_ph": "Stop getting angry, pray Tahajjud...",
        "goal_sadaka_title": "Sadaqah Jariyah", "goal_sadaka_ph": "Participate in building a well...",
        "goal_work_title": "Work and Finances", "goal_work_ph": "Pay off debts, improve skills...",
        "goal_health_title": "Health and Body", "goal_health_ph": "Sports 3 times a week, healthy eating...",
        "goal_family_title": "Family and Relationships", "goal_family_ph": "More time with parents...",
        "goal_custom_title": "Custom Goal", "goal_custom_ph": "Write your custom goal...", "add_custom_goal": "Add Custom Goal",
        "tool_hand_title": "Pan (V)", "tool_hand_label": "Hand",
        "tool_pencil_title": "Pencil (P)", "tool_pencil_label": "Draw",
        "tool_eraser_title": "Eraser (E)", "tool_eraser_label": "Eraser",
        "tool_color_label": "Color", "tool_size_label": "Size",
        "tool_clear_title": "Clear drawing", "tool_clear_label": "Clear",
        "ai_setup_ph": "Gemini API Key (AIzaSy...)", "ai_free_key": "Get a free key",
        "ph_task_main": "Main task of the day...", "ph_task_household": "Household chores...",
        "ph_task_family": "Family, dinner...", "ph_task_rest": "Solitude, rest...",
        "ph_task_reading": "Reading before sleep...", "ai_modal_subtitle": "Powered by Google Gemini 3",
        "donate_toast_title": "Support the Project", "donate_toast_text": "Your help helps the project grow. Jazakallahu Khairan!",
        "kaspi_label": "Kaspi.kz (Transfer by number)", "kaspi_copy": "Copy number", "kaspi_success": "Number copied!",
        "auth_title": "Cloud Sync", "auth_subtitle": "Save your data online", "auth_login_btn": "Login", "profile_title": "Your Profile", "auth_logout": "Logout",
        "sync_status": "Sync is enabled. Your data is safe (InshaAllah).",
        "event_modal_title": "New Event", "event_tab_event": "Event", "event_tab_reminder": "Reminder",
        "event_title_label": "Title", "event_title_ph": "Event title...",
        "event_type_label": "Event Type", "event_type_select_ph": "Select type",
        "event_type_islamic": "Islamic", "event_type_personal": "Personal", "event_type_work": "Work", "event_type_family": "Family", "event_type_health": "Health",
        "event_date_label": "Date", "event_time_label": "Time",
        "event_location_label": "Location", "event_location_ph": "Video conference / Mosque / ...",
        "event_repeat_label": "Repeat", "event_allday_label": "All Day",
        "event_repeat_type_label": "Frequency", "event_repeat_end_label": "Until",
        "repeat_daily": "Daily", "repeat_weekly": "Weekly", "repeat_monthly": "Monthly", "repeat_yearly": "Yearly",
        "event_alert_label": "Alert",
        "alert_none": "No alert", "alert_5min": "5 minutes before", "alert_15min": "15 minutes before", "alert_30min": "30 minutes before", "alert_1hour": "1 hour before", "alert_1day": "1 day before",
        "event_tag_label": "Tag", "event_tag_ph": "#important #meeting",
        "event_notes_label": "Notes", "event_notes_ph": "Additional notes...",
        "event_save_btn": "Save", "event_delete_btn": "Delete", "event_add_btn": "Add",
        "events_no_events": "No events for this day", "event_saved_toast": "Event saved!", "event_deleted_toast": "Event deleted",
        "log_login": "Login", "log_logout": "Logout", "log_register": "Register", "log_task_toggled": "Task toggled", "log_day_saved": "Day saved", "log_goals_saved": "Goals updated", "log_goal_added": "Goal added", "log_event_saved": "Event saved", "log_event_deleted": "Event deleted", "log_note_created": "Note created", "log_note_deleted": "Note deleted", "log_drawing_saved": "Drawing saved", "log_drawing_stroke_saved": "Board stroke", "log_drawing_cleared": "Drawing cleared", "log_backup_exported": "Backup created", "log_backup_imported": "Data restored",
        "time_just_now": "just now", "time_mins_ago": "min ago", "time_hours_ago": "h ago", "time_today": "today", "time_yesterday": "yesterday",
        "state_done": "done", "state_undone": "undone", "type_ahirat": "Akhirah", "type_dunya": "Dunya", "log_color_yellow": "🟡 yellow", "log_color_green": "🟢 green", "log_color_blue": "🔵 blue",
        "log_syncing": "Syncing...", "log_no_access_title": "Access restricted", "log_no_access_desc": "Log in to save your activity history and access it on all devices.", "log_empty_title": "History is empty", "log_empty_desc": "Start planning your day, and your first steps will appear here 🌱", "log_error_title": "Data loading error", "log_error_desc": "Check your internet connection",
        "ai_key_saved": "API key saved!", "ai_plan_generated": "Plan generated! Mashallah!", "ai_error_key": "Invalid API key or parameters. Check settings.", "ai_error_server": "Server error", "ai_error_format": "Unexpected response format from Gemini.", "ai_error": "AI Error", "ai_error_format_retry": "AI returned invalid response format. Try again.",
        "ai_lang_name": "English",
        "backup_downloaded": "Backup downloaded", "backup_restored": "Data restored! Restarting...", "backup_error": "Data import error!",
        "lang_changed": "Language changed",
        "log_user_login": "Logged in", "log_user_logout": "Logged out", "log_user_register": "Registered",
        "aria_mark_task": "Mark task", "aria_new_task": "New task", "ph_new_task": "New task...",
        "btn_delete_goal": "Delete"
    }
};

// Get language from URL first (for SEO indexing), then fallback to localStorage or 'ru'
function getInitialLanguage() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const langParam = urlParams.get('lang');
        if (langParam && ['ru', 'kk', 'en', 'ar'].includes(langParam)) {
            // Optional: Store it so next visits remember this URL lang
            localStorage.setItem('barakah_lang', langParam);
            return langParam;
        }
    } catch (e) {
        console.error("URL parsing error for lang", e);
    }
    return localStorage.getItem('barakah_lang') || 'ru';
}

let currentLang = getInitialLanguage();

function applyTranslations(lang) {
    const dict = translations[lang] || translations['ru'];

    // Update Language and SEO Metadata
    document.documentElement.lang = lang;
    if (dict['seo_title']) {
        document.title = dict['seo_title'];
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) ogTitle.content = dict['seo_title'];
        const twTitle = document.querySelector('meta[name="twitter:title"]');
        if (twTitle) twTitle.content = dict['seo_title'];
    }
    if (dict['seo_desc']) {
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.content = dict['seo_desc'];
        const ogDesc = document.querySelector('meta[property="og:description"]');
        if (ogDesc) ogDesc.content = dict['seo_desc'];
        const twDesc = document.querySelector('meta[name="twitter:description"]');
        if (twDesc) twDesc.content = dict['seo_desc'];
    }

    if (dict['seo_image']) {
        const ogImage = document.querySelector('meta[property="og:image"]');
        if (ogImage) ogImage.content = dict['seo_image'];
        const twImage = document.querySelector('meta[name="twitter:image"]');
        if (twImage) twImage.content = dict['seo_image'];
    }

    // Перевод текстовых элементов
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) {
            const target = el.getAttribute('data-i18n-target');
            if (target) {
                if (target === 'placeholder') el.placeholder = dict[key];
                else if (target === 'value') el.value = dict[key];
                else if (target === 'title') el.title = dict[key];
                else el[target] = dict[key];
            } else {
                // Если это инпут или текстарея с data-i18n-target="placeholder"
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    if (el.type === 'text' || el.tagName === 'TEXTAREA') {
                        el.placeholder = dict[key];
                    } else {
                        el.value = dict[key];
                    }
                } else {
                    // Если внутри кнопки есть иконка, надо найти текстовую ноду или span, но для простоты
                    // мы обернем текст кнопок в <span data-i18n="...">
                    el.textContent = dict[key];
                }
            }
        }
    });

    // Направление текста для Арабского
    if (lang === 'ar') {
        document.documentElement.setAttribute('dir', 'rtl');
        document.body.classList.add('font-arabic'); // Добавляем особый шрифт при необходимости
    } else {
        document.documentElement.setAttribute('dir', 'ltr');
        document.body.classList.remove('font-arabic');
    }
}

function initI18n() {
    applyTranslations(currentLang);

    const langToggleBtn = document.getElementById('lang-toggle');
    const langIcon = document.getElementById('lang-icon');

    const updateLangIcon = (lang) => {
        if (!langIcon) return;
        if (lang === 'ru') langIcon.textContent = 'RU';
        else if (lang === 'kk') langIcon.textContent = 'KK';
        else if (lang === 'ar') langIcon.textContent = 'AR';
        else if (lang === 'en') langIcon.textContent = 'EN';
    };

    updateLangIcon(currentLang);

    if (langToggleBtn) {
        langToggleBtn.addEventListener('click', () => {
            if (currentLang === 'ru') currentLang = 'kk';
            else if (currentLang === 'kk') currentLang = 'ar';
            else if (currentLang === 'ar') currentLang = 'en';
            else currentLang = 'ru';

            localStorage.setItem('barakah_lang', currentLang);

            // Update URL with ?lang=XX without page reload (no redirect to /kk/ path)
            const url = new URL(window.location.href);
            url.searchParams.set('lang', currentLang);
            window.history.replaceState({}, '', url);

            // Apply translations and notify
            applyTranslations(currentLang);
            updateLangIcon(currentLang);
            document.dispatchEvent(new CustomEvent('langChanged', { detail: currentLang }));
            if (window.showToast) window.showToast(window.t('lang_changed'));
        });
    }
}

window.initI18n = initI18n;
window.translations = translations;
window.getCurrentLang = () => currentLang;
window.t = (key) => window.translations[currentLang]?.[key] || window.translations['ru']?.[key] || key;
