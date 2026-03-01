// Словарь переводов
const translations = {
    ru: {
        "tab_daily": "День", "tab_calendar": "Календарь", "tab_goals": "Цели", "tab_board": "Доска",
        "date_today": "Дата:", "date_val_today": "Сегодня",
        "title_daily": "План на день", "niyyah_label": "Ният:", "niyyah_ph": "Ради довольства Аллаха...",
        "ibadah_title": "Ибадат Трекер", "quran_title": "Чтение Корана", "quran_ph": "Сура / Аяты",
        "sadaka_title": "Садака / Благое дело", "sadaka_ph": "Кому помочь сегодня?",
        "fajr": "Фаджр", "morning_azkar": "Уттренние азкары", "zuhr": "Зухр", "asr": "Аср",
        "evening_azkar": "Вечерние азкары", "maghrib": "Магриб", "isha": "Иша", "witr": "Витр",
        "fajr_zuhr": "Фаджр — Зухр", "zuhr_asr": "Зухр — Аср", "asr_maghrib": "Аср — Магриб",
        "maghrib_isha": "Магриб — Иша", "isha_sleep": "Иша — Сон", "nav_prev_day": "Предыдущий день", "nav_next_day": "Следующий день",
        "focus_label": "Фокус", "routine_label": "Рутина", "add_task": "+ Добавить задачу",
        "task1_ph": "Главная задача дня...", "task5_ph": "Бытовые дела...", "task7_ph": "Семья, ужин...", "task9_ph": "Уединение, отдых...", "task10_ph": "Чтение перед сном...",
        "btn_import": "Импорт", "btn_export": "Экспорт", "btn_ai": "ИИ Ассистент",
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
        "kaspi_label": "Kaspi.kz (Перевод по номеру)", "kaspi_copy": "Скопировать номер", "kaspi_success": "Номер скопирован!"
    },
    kk: {
        "tab_daily": "Күн", "tab_calendar": "Күнтізбе", "tab_goals": "Мақсаттар", "tab_board": "Тақта",
        "date_today": "Күн:", "date_val_today": "Бүгін",
        "title_daily": "Күн жоспары", "niyyah_label": "Ниет:", "niyyah_ph": "Алланың разылығы үшін...",
        "ibadah_title": "Құлшылық Трекері", "quran_title": "Құран оқу", "quran_ph": "Сүре / Аяттар",
        "sadaka_title": "Садақа / Жақсы іс", "sadaka_ph": "Бүгін кімге көмектесемін?",
        "fajr": "Бамдат", "morning_azkar": "Таңғы зікірлер", "zuhr": "Бесін", "asr": "Екінті",
        "evening_azkar": "Кешкі зікірлер", "maghrib": "Ақшам", "isha": "Құптан", "witr": "Үтір",
        "fajr_zuhr": "Бамдат — Бесін", "zuhr_asr": "Бесін — Екінті", "asr_maghrib": "Екінті — Ақшам",
        "maghrib_isha": "Ақшам — Құптан", "isha_sleep": "Құптан — Ұйқы", "nav_prev_day": "Алдыңғы күн", "nav_next_day": "Келесі күн",
        "focus_label": "Фокус", "routine_label": "Рутина", "add_task": "+ Тапсырма",
        "task1_ph": "Күннің басты міндеті...", "task5_ph": "Тұрмыстық істер...", "task7_ph": "Отбасы, кешкі ас...", "task9_ph": "Демалыс...", "task10_ph": "Ұйқы алдында оқу...",
        "btn_import": "Импорт", "btn_export": "Экспорт", "btn_ai": "ЖИ Көмекшісі",
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
        "kaspi_label": "Kaspi.kz (Нөмір бойынша аударым)", "kaspi_copy": "Нөмірді көшіру", "kaspi_success": "Нөмір көшірілді!"
    },
    ar: {
        "tab_daily": "اليوم", "tab_calendar": "التقويم", "tab_goals": "الأهداف", "tab_board": "اللوحة",
        "date_today": "التاريخ:", "date_val_today": "اليوم",
        "title_daily": "خطة اليوم", "niyyah_label": "النية:", "niyyah_ph": "ابتغاء مرضاة الله...",
        "ibadah_title": "متتبع العبادات", "quran_title": "قراءة القرآن", "quran_ph": "سورة / آيات",
        "sadaka_title": "صدقة / عمل صالح", "sadaka_ph": "لمن سأقدم المساعدة اليوم؟",
        "fajr": "الفجر", "morning_azkar": "أذكار الصباح", "zuhr": "الظهر", "asr": "العصر",
        "evening_azkar": "أذكار المساء", "maghrib": "المغرب", "isha": "العشاء", "witr": "الوتر",
        "fajr_zuhr": "الفجر — الظهر", "zuhr_asr": "الظهر — العصر", "asr_maghrib": "العصر — المغرب",
        "maghrib_isha": "المغرب — العشاء", "isha_sleep": "العشاء — النوم", "nav_prev_day": "اليوم السابق", "nav_next_day": "اليوم التالي",
        "focus_label": "التركيز", "routine_label": "العادات", "add_task": "+ إضافة مهمة",
        "task1_ph": "المهمة الرئيسية اليوم...", "task5_ph": "الأعمال المنزلية...", "task7_ph": "العائلة، العشاء...", "task9_ph": "استراحة...", "task10_ph": "القراءة قبل النوم...",
        "btn_import": "استيراد", "btn_export": "تصدير", "btn_ai": "المساعد الذكي",
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
        "kaspi_label": "Kaspi.kz (تحويل عن طريق الرقم)", "kaspi_copy": "نسخ الرقم", "kaspi_success": "تم نسخ الرقم!"
    },
    en: {
        "tab_daily": "Daily", "tab_calendar": "Calendar", "tab_goals": "Goals", "tab_board": "Board",
        "date_today": "Date:", "date_val_today": "Today",
        "title_daily": "Daily Plan", "niyyah_label": "Niyyah:", "niyyah_ph": "For the sake of Allah...",
        "ibadah_title": "Ibadah Tracker", "quran_title": "Quran Reading", "quran_ph": "Surah / Ayahs",
        "sadaka_title": "Sadaqah / Good Deed", "sadaka_ph": "Who to help today?",
        "fajr": "Fajr", "morning_azkar": "Morning Azkar", "zuhr": "Zuhr", "asr": "Asr",
        "evening_azkar": "Evening Azkar", "maghrib": "Maghrib", "isha": "Isha", "witr": "Witr",
        "fajr_zuhr": "Fajr — Zuhr", "zuhr_asr": "Zuhr — Asr", "asr_maghrib": "Asr — Maghrib",
        "maghrib_isha": "Maghrib — Isha", "isha_sleep": "Isha — Sleep", "nav_prev_day": "Previous day", "nav_next_day": "Next day",
        "focus_label": "Focus", "routine_label": "Routine", "add_task": "+ Add task",
        "task1_ph": "Main task of the day...", "task5_ph": "Household chores...", "task7_ph": "Family, dinner...", "task9_ph": "Rest, me time...", "task10_ph": "Reading before sleep...",
        "btn_import": "Import", "btn_export": "Export", "btn_ai": "AI Assistant",
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
        "kaspi_label": "Kaspi.kz (Transfer by number)", "kaspi_copy": "Copy number", "kaspi_success": "Number copied!"
    }
};

let currentLang = localStorage.getItem('barakah_lang') || 'ru';

function applyTranslations(lang) {
    const dict = translations[lang] || translations['ru'];

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
            applyTranslations(currentLang);
            updateLangIcon(currentLang);

            // Отправляем событие о смене языка
            document.dispatchEvent(new CustomEvent('langChanged', { detail: currentLang }));

            showToast('Язык изменен / Тіл өзгертілді / تم تغيير اللغة');
        });
    }
}

window.initI18n = initI18n;
window.translations = translations;
