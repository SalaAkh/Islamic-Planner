// ═══════════════════════════════════════════════════════════════
// DAILY WISDOM — Ежедневные аяты Корана и хадисы из Сахихов
// Seeded by date so each day shows the same content consistently
// ═══════════════════════════════════════════════════════════════

const QURAN_AYATS = [
    {
        ar: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ﴿١﴾ الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ ﴿٢﴾ الرَّحْمَٰنِ الرَّحِيمِ ﴿٣﴾",
        ru: "Во имя Аллаха, Милостивого, Милосердного. Хвала Аллаху, Господу миров. Милостивому, Милосердному.",
        en: "In the name of Allah, the Most Gracious, the Most Merciful. All praise is due to Allah, Lord of the worlds. The Most Gracious, the Most Merciful.",
        kk: "Аса қайырымды, ерекше мейірімді Алланың атымен! Барлық мақтау — әлемдердің Раббысы Аллаһқа тән. Аса қайырымды, ерекше мейірімді.",
        ref: "Сура Аль-Фатиха (1:1-3)"
    },
    {
        ar: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ",
        ru: "Аллах — нет божества, кроме Него, Живого, Вседержителя. Им не овладевают ни дремота, ни сон.",
        en: "Allah — there is no deity except Him, the Ever-Living, the Sustainer. Neither drowsiness overtakes Him nor sleep.",
        kk: "Алла — Одан басқа құдай жоқ, тірі, мәңгі тұрақты. Оны мүлгу де, ұйқы да алмайды.",
        ref: "Сура Аль-Бакара (2:255) — Аят аль-Курси"
    },
    {
        ar: "إِنَّ مَعَ الْعُسْرِ يُسْرًا",
        ru: "Поистине, за трудностью следует облегчение.",
        en: "Indeed, with hardship comes ease.",
        kk: "Шынында, қиындықпен бірге жеңілдік бар.",
        ref: "Сура Аш-Шарх (94:6)"
    },
    {
        ar: "وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ",
        ru: "А тому, кто уповает на Аллаха, достаточно Его.",
        en: "And whoever relies upon Allah — then He is sufficient for him.",
        kk: "Кім Аллаһқа тәуекел етсе, Ол оған жеткілікті.",
        ref: "Сура Ат-Таляк (65:3)"
    },
    {
        ar: "وَلَا تَيْأَسُوا مِن رَّوْحِ اللَّهِ ۖ إِنَّهُ لَا يَيْأَسُ مِن رَّوْحِ اللَّهِ إِلَّا الْقَوْمُ الْكَافِرُونَ",
        ru: "Не теряйте надежды на милость Аллаха, ибо лишь неверующие теряют надежду на милость Аллаха.",
        en: "Do not despair of the mercy of Allah. Indeed, no one despairs of the mercy of Allah except the disbelieving people.",
        kk: "Алланың мейіріміне үміт үзбеңіздер. Расында, Алланың мейіріміне кәпірлер ғана үміт үзеді.",
        ref: "Сура Юсуф (12:87)"
    },
    {
        ar: "وَاذْكُرُوا اللَّهَ كَثِيرًا لَّعَلَّكُمْ تُفْلِحُونَ",
        ru: "Поминайте Аллаха многократно, чтобы вы преуспели.",
        en: "And remember Allah often that you may succeed.",
        kk: "Алланы көп еске алыңдар, сонда табысқа жетесіңдер.",
        ref: "Сура Аль-Джума (62:10)"
    },
    {
        ar: "وَقُل رَّبِّ زِدْنِي عِلْمًا",
        ru: "И скажи: «Господи, приумножь мои знания!»",
        en: "And say, 'My Lord, increase me in knowledge.'",
        kk: "Және де: «Раббым, маған білімді арттыр!» — де.",
        ref: "Сура Та-Ха (20:114)"
    },
    {
        ar: "فَاصْبِرْ إِنَّ وَعْدَ اللَّهِ حَقٌّ",
        ru: "Терпи, ибо обещание Аллаха — истина.",
        en: "So be patient. Indeed, the promise of Allah is truth.",
        kk: "Сабыр ет, расында Алланың уәдесі — ақиқат.",
        ref: "Сура Гафир (40:77)"
    },
    {
        ar: "ادْعُونِي أَسْتَجِبْ لَكُمْ",
        ru: "Взывайте ко Мне, и Я отвечу вам.",
        en: "Call upon Me; I will respond to you.",
        kk: "Маған дұға етіңдер, Мен қабыл етемін.",
        ref: "Сура Гафир (40:60)"
    },
    {
        ar: "يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ ۚ إِنَّ اللَّهَ مَعَ الصَّابِرِينَ",
        ru: "О те, которые уверовали! Обращайтесь за помощью к терпению и намазу. Поистине, Аллах — с терпеливыми.",
        en: "O you who believe! Seek help through patience and prayer. Indeed, Allah is with the patient.",
        kk: "Иман келтіргендер! Сабыр мен намаздан көмек сұраңдар. Расында Алла сабырлылармен бірге.",
        ref: "Сура Аль-Бакара (2:153)"
    },
    {
        ar: "وَمَنْ يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ",
        ru: "Тому, кто боится Аллаха, Он создает выход и наделяет его уделом оттуда, откуда тот даже не предполагает.",
        en: "And whoever fears Allah — He will make for him a way out and will provide for him from where he does not expect.",
        kk: "Кім Аллаһтан қорықса, Ол оған шығар жол жасайды, және оны ойламаған жерінен ризықтандырады.",
        ref: "Сура Ат-Таляк (65:2-3)"
    },
    {
        ar: "وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِن مُّدَّكِرٍ",
        ru: "Мы облегчили Коран для поминания. Но есть ли тот, кто помянет?",
        en: "And We have certainly made the Quran easy to remember. So is there anyone who will remember?",
        kk: "Біз Құранды еске алу үшін жеңілдеттік. Ендеше еске алушы бар ма?",
        ref: "Сура Аль-Камар (54:17)"
    },
    {
        ar: "إِنَّ اللَّهَ لَا يُضِيعُ أَجْرَ الْمُحْسِنِينَ",
        ru: "Поистине, Аллах не губит награду тех, кто творит добро.",
        en: "Indeed, Allah does not allow to be lost the reward of those who do good.",
        kk: "Расында, Алла жақсылық жасаушылардың сыйлығын жоғалтпайды.",
        ref: "Сура Ат-Тауба (9:120)"
    },
    {
        ar: "وَاصْبِرْ وَمَا صَبْرُكَ إِلَّا بِاللَّهِ",
        ru: "Терпи, ибо твое терпение — только от Аллаха.",
        en: "And be patient, for your patience is not but through Allah.",
        kk: "Сабыр ет, сенің сабырың тек Алланың көмегімен.",
        ref: "Сура Ан-Нахль (16:127)"
    },
    {
        ar: "وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ",
        ru: "Когда Мои рабы спрашивают тебя обо Мне, то ведь Я близок.",
        en: "And when My servants ask you about Me — indeed I am near.",
        kk: "Құлдарым сенен Мені сұрағанда, Мен жақынмын.",
        ref: "Сура Аль-Бакара (2:186)"
    },
    {
        ar: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
        ru: "Господь наш! Одари нас добром в этом мире и добром в Последней жизни и защити нас от мучений в Огне.",
        en: "Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire.",
        kk: "Раббымыз! Бізге дүниеде де, ақыретте де жақсылық бер, бізді от азабынан қорға.",
        ref: "Сура Аль-Бакара (2:201)"
    },
    {
        ar: "وَلَا تَحْزَنْ إِنَّ اللَّهَ مَعَنَا",
        ru: "Не печалься, ведь Аллах — с нами.",
        en: "Do not grieve; indeed Allah is with us.",
        kk: "Қайғырма, расында Алла бізбен бірге.",
        ref: "Сура Ат-Тауба (9:40)"
    },
    {
        ar: "وَنُنَزِّلُ مِنَ الْقُرْآنِ مَا هُوَ شِفَاءٌ وَرَحْمَةٌ لِّلْمُؤْمِنِينَ",
        ru: "Мы ниспосылаем в Коране то, что является исцелением и милостью для верующих.",
        en: "And We send down of the Quran that which is healing and mercy for the believers.",
        kk: "Біз Құраннан мұсылмандарға шипа және мейірім болатын нәрсені түсіреміз.",
        ref: "Сура Аль-Исра (17:82)"
    },
    {
        ar: "فَبِأَيِّ آلَاءِ رَبِّكُمَا تُكَذِّبَانِ",
        ru: "Какую же из милостей вашего Господа вы станете отрицать?",
        en: "So which of the favors of your Lord would you deny?",
        kk: "Раббыларыңның қай нығметін жалғанға шығарасыңдар?",
        ref: "Сура Ар-Рахман (55:13)"
    },
    {
        ar: "إِنَّ اللَّهَ مَعَ الَّذِينَ اتَّقَوا وَّالَّذِينَ هُم مُّحْسِنُونَ",
        ru: "Поистине, Аллах — с теми, кто богобоязнен и кто творит добро.",
        en: "Indeed, Allah is with those who fear Him and those who are doers of good.",
        kk: "Расында, Алла тақуалармен және жақсылық жасаушылармен бірге.",
        ref: "Сура Ан-Нахль (16:128)"
    },
    {
        ar: "قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ",
        ru: "Скажи: «О рабы Мои, которые излишествовали во вред себе, не теряйте надежды на милость Аллаха.»",
        en: "Say, 'O My servants who have transgressed against themselves, do not despair of the mercy of Allah.'",
        kk: "Айт: «Әй, өздеріне зиян жасаған құлдарым, Алланың мейіріміне үміт үзбеңдер.»",
        ref: "Сура Аз-Зумар (39:53)"
    },
    {
        ar: "وَلَنَبْلُوَنَّكُم بِشَيْءٍ مِّنَ الْخَوْفِ وَالْجُوعِ وَنَقْصٍ مِّنَ الْأَمْوَالِ وَالْأَنفُسِ وَالثَّمَرَاتِ ۗ وَبَشِّرِ الصَّابِرِينَ",
        ru: "Мы непременно испытаем вас кое-чем из страха, голода, потери имущества, людей и плодов. Обрадуй же терпеливых.",
        en: "And We will surely test you with something of fear and hunger and loss of wealth and lives and fruits, but give good tidings to the patient.",
        kk: "Біз сендерді қорқыныш, аштық, мал, жан, жеміс тапшылығымен сынаймыз. Сабырлыларды қуантшылықпен сүйінші.",
        ref: "Сура Аль-Бакара (2:155)"
    },
    {
        ar: "وَمَا خَلَقْتُ الْجِنَّ وَالْإِنسَ إِلَّا لِيَعْبُدُونِ",
        ru: "Я сотворил джиннов и людей только для того, чтобы они поклонялись Мне.",
        en: "And I did not create the jinn and mankind except to worship Me.",
        kk: "Мен жындар мен адамдарды тек Маған ғибадат қылу үшін жараттым.",
        ref: "Сура Аз-Зарият (51:56)"
    },
    {
        ar: "وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَىٰ",
        ru: "И Господь твой непременно даст тебе, и ты будешь доволен.",
        en: "And your Lord is going to give you, and you will be satisfied.",
        kk: "Раббың саған міндетті түрде береді, сен разы боласың.",
        ref: "Сура Ад-Духа (93:5)"
    },
    {
        ar: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ",
        ru: "Разве не поминанием Аллаха обретают покой сердца?",
        en: "Unquestionably, by the remembrance of Allah hearts are assured.",
        kk: "Шынында, Алланы еске алумен жүректер тыныштық табады.",
        ref: "Сура Ар-Раад (13:28)"
    },
    {
        ar: "وَاعْتَصِمُوا بِحَبْلِ اللَّهِ جَمِيعًا وَلَا تَفَرَّقُوا",
        ru: "Крепко держитесь за вервь Аллаха все вместе и не разделяйтесь.",
        en: "And hold firmly to the rope of Allah all together and do not become divided.",
        kk: "Барлығыңыз Алланың арқанына мықтап жабысыңдар, бөлінбеңдер.",
        ref: "Сура Аль-Имран (3:103)"
    },
    {
        ar: "إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ",
        ru: "Поистине, деяния оцениваются по намерениям.",
        en: "Indeed, actions are judged by intentions.",
        kk: "Шынында, амалдар ниеттерге қарай бағаланады.",
        ref: "Сура Аль-Бакара — Принцип из Хадиса, подтвержденный аятами"
    },
    {
        ar: "وَمَن يُوقَ شُحَّ نَفْسِهِ فَأُولَٰئِكَ هُمُ الْمُفْلِحُونَ",
        ru: "А те, которые уберегутся от собственной скупости, — они и есть преуспевшие.",
        en: "And whoever is protected from the stinginess of his soul — it is those who will be the successful.",
        kk: "Кім жанының сараңдығынан сақталса, олар — табысқа жеткендер.",
        ref: "Сура Аль-Хашр (59:9)"
    },
    {
        ar: "وَتَعَاوَنُوا عَلَى الْبِرِّ وَالتَّقْوَىٰ ۖ وَلَا تَعَاوَنُوا عَلَى الْإِثْمِ وَالْعُدْوَانِ",
        ru: "Помогайте друг другу в благочестии и богобоязненности, но не помогайте друг другу во грехе и вражде.",
        en: "And cooperate in righteousness and piety, but do not cooperate in sin and aggression.",
        kk: "Жақсылық пен тақуалыққа көмектесіңдер, күнә мен дұшпандыққа көмектеспеңдер.",
        ref: "Сура Аль-Маида (5:2)"
    },
    {
        ar: "كُنتُمْ خَيْرَ أُمَّةٍ أُخْرِجَتْ لِلنَّاسِ تَأْمُرُونَ بِالْمَعْرُوفِ وَتَنْهَوْنَ عَنِ الْمُنكَرِ",
        ru: "Вы — лучшая из общин, выведенная для людей: вы повелеваете одобряемое и запрещаете порицаемое.",
        en: "You are the best nation produced for mankind. You enjoin what is right and forbid what is wrong.",
        kk: "Сіздер адамдар үшін шығарылған ең жақсы үмметсіздер: жақсылыққа бұйырасыздар, жамандықтан тыйасыздар.",
        ref: "Сура Аль-Имран (3:110)"
    }
];

const HADITHS = [
    {
        ar: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى",
        ru: "Поистине, деяния оцениваются только по намерениям, и каждому человеку достанется лишь то, что он намеревался обрести.",
        en: "The reward of deeds depends upon the intentions, and every person will get the reward according to what he has intended.",
        kk: "Шынында, амалдар тек ниеттер бойынша бағаланады, және әр адам тек ниет еткенін алады.",
        source: "Сахих аль-Бухари, 1",
        narrator: "Умар ибн аль-Хаттаб (р.а.)"
    },
    {
        ar: "الْمُسْلِمُ مَنْ سَلِمَ الْمُسْلِمُونَ مِنْ لِسَانِهِ وَيَدِهِ",
        ru: "Мусульманин — тот, от языка и руки которого мусульмане находятся в безопасности.",
        en: "A Muslim is the one from whose tongue and hands the Muslims are safe.",
        kk: "Мұсылман — тілі мен қолынан басқа мұсылмандар аман болатын адам.",
        source: "Сахих аль-Бухари, 10",
        narrator: "Абдуллах ибн Амр (р.а.)"
    },
    {
        ar: "لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ",
        ru: "Не уверует никто из вас, пока не полюбит для брата своего то, что любит для себя самого.",
        en: "None of you truly believes until he loves for his brother what he loves for himself.",
        kk: "Сендердің ешқайсыларың бауыры үшін өзіне тілегенін тілемейінше иман келтірген болмайды.",
        source: "Сахих аль-Бухари, 13; Сахих Муслим, 45",
        narrator: "Анас ибн Малик (р.а.)"
    },
    {
        ar: "مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ",
        ru: "Кто верит в Аллаха и в Последний день, пусть говорит благое или молчит.",
        en: "Whoever believes in Allah and the Last Day, let him speak good or remain silent.",
        kk: "Кім Аллаһқа және соңғы күнге сенсе, жақсылық сөйлесін немесе үндемесін.",
        source: "Сахих аль-Бухари, 6018; Сахих Муслим, 47",
        narrator: "Абу Хурайра (р.а.)"
    },
    {
        ar: "مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ طَرِيقًا إِلَى الْجَنَّةِ",
        ru: "Кто встал на путь в поисках знания, тому Аллах облегчит путь в Рай.",
        en: "Whoever takes a path in search of knowledge, Allah will make easy for him a path to Paradise.",
        kk: "Кім білім іздеу жолына түссе, Алла оған Жәннатқа жол жеңілдетеді.",
        source: "Сахих Муслим, 2699",
        narrator: "Абу Хурайра (р.а.)"
    },
    {
        ar: "الطُّهُورُ شَطْرُ الْإِيمَانِ، وَالْحَمْدُ لِلَّهِ تَمْلأُ الْمِيزَانَ",
        ru: "Чистота — половина веры, а слова «Хвала Аллаху» заполнят Весы.",
        en: "Cleanliness is half of faith, and 'Alhamdulillah' fills the scales.",
        kk: "Тазалық — иманның жартысы, ал «Альхамдулиллях» Таразыны толтырады.",
        source: "Сахих Муслим, 223",
        narrator: "Абу Малик аль-Ашари (р.а.)"
    },
    {
        ar: "خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ",
        ru: "Лучший из вас тот, кто изучил Коран и обучает ему других.",
        en: "The best of you are those who learn the Quran and teach it to others.",
        kk: "Сендердің ең жақсыларың Құранды үйреніп, оны басқаларға үйрететіндер.",
        source: "Сахих аль-Бухари, 5027",
        narrator: "Усман ибн Аффан (р.а.)"
    },
    {
        ar: "الدُّنْيَا سِجْنُ الْمُؤْمِنِ وَجَنَّةُ الْكَافِرِ",
        ru: "Этот мир — тюрьма для верующего и рай для неверующего.",
        en: "This world is a prison for the believer and a paradise for the disbeliever.",
        kk: "Бұл дүние — мүмін үшін түрме, кәпір үшін жәннат.",
        source: "Сахих Муслим, 2956",
        narrator: "Абу Хурайра (р.а.)"
    },
    {
        ar: "تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ لَكَ صَدَقَةٌ",
        ru: "Твоя улыбка брату — это садака.",
        en: "Your smile in the face of your brother is an act of charity.",
        kk: "Бауырыңа күлімсіреуің — садақа.",
        source: "Сунан ат-Тирмизи, 1956",
        narrator: "Абу Зарр (р.а.)"
    },
    {
        ar: "الْمُؤْمِنُ الْقَوِيُّ خَيْرٌ وَأَحَبُّ إِلَى اللَّهِ مِنَ الْمُؤْمِنِ الضَّعِيفِ، وَفِي كُلٍّ خَيْرٌ",
        ru: "Сильный верующий лучше и любимее для Аллаха, чем слабый верующий, хотя в каждом из них — благо.",
        en: "The strong believer is better and more beloved to Allah than the weak believer, but there is good in both.",
        kk: "Күшті мүмін Аллаһқа әлсіз мүміннен жақсырақ және сүйіктірек, бірақ екеуінде де жақсылық бар.",
        source: "Сахих Муслим, 2664",
        narrator: "Абу Хурайра (р.а.)"
    },
    {
        ar: "اتَّقِ اللَّهِ حَيْثُمَا كُنْتَ، وَأَتْبِعِ السَّيِّئَةَ الْحَسَنَةَ تَمْحُهَا، وَخَالِقِ النَّاسَ بِخُلُقٍ حَسَنٍ",
        ru: "Бойся Аллаха, где бы ты ни был. Вслед за дурным поступком соверши хороший — он сотрет его. И обращайся к людям с хорошим нравом.",
        en: "Fear Allah wherever you are, and follow a bad deed with a good deed, it will erase it. And treat people with good character.",
        kk: "Қай жерде болсаңда Алладан қорық. Жаман іске жақсы іс жаса — ол оны өшіреді. Адамдармен жақсы мінезбен қатынас жаса.",
        source: "Сунан ат-Тирмизи, 1987",
        narrator: "Абу Зарр и Муаз ибн Джабаль (р.а.)"
    },
    {
        ar: "لَا تَغْضَبْ",
        ru: "Не гневайся!",
        en: "Do not get angry!",
        kk: "Ашуланба!",
        source: "Сахих аль-Бухари, 6116",
        narrator: "Абу Хурайра (р.а.)"
    },
    {
        ar: "مَا مَلَأَ آدَمِيٌّ وِعَاءً شَرًّا مِنْ بَطْنٍ",
        ru: "Не наполнял человек сосуда хуже, чем собственный желудок.",
        en: "A human being fills no worse vessel than his stomach.",
        kk: "Адам баласы асқазанынан жаман ыдыс толтырмады.",
        source: "Сунан ат-Тирмизи, 2380; Сунан Ибн Маджа, 3349",
        narrator: "Аль-Миқдам ибн Мадикариб (р.а.)"
    },
    {
        ar: "إِنَّ اللَّهَ لَا يَنْظُرُ إِلَى صُوَرِكُمْ وَأَمْوَالِكُمْ وَلَكِنْ يَنْظُرُ إِلَى قُلُوبِكُمْ وَأَعْمَالِكُمْ",
        ru: "Поистине, Аллах не смотрит на вашу внешность и имущество, но смотрит на ваши сердца и деяния.",
        en: "Indeed, Allah does not look at your appearance and wealth, but looks at your hearts and deeds.",
        kk: "Шынында, Алла сыртқы кейіптеріңізге және байлығыңызға қарамайды, жүректеріңізге және амалдарыңызға қарайды.",
        source: "Сахих Муслим, 2564",
        narrator: "Абу Хурайра (р.а.)"
    },
    {
        ar: "أَحَبُّ الْأَعْمَالِ إِلَى اللَّهِ أَدْوَمُهَا وَإِنْ قَلَّ",
        ru: "Самые любимые деяния для Аллаха — те, что постоянны, пусть даже незначительны.",
        en: "The most beloved of deeds to Allah are the most consistent, even if small.",
        kk: "Аллаһқа ең сүйікті амалдар — аз болса да тұрақты жасалатындар.",
        source: "Сахих аль-Бухари, 6464; Сахих Муслим, 783",
        narrator: "Аиша (р.а.)"
    },
    {
        ar: "الْكَلِمَةُ الطَّيِّبَةُ صَدَقَةٌ",
        ru: "Доброе слово — это садака.",
        en: "A good word is charity.",
        kk: "Жақсы сөз — садақа.",
        source: "Сахих аль-Бухари, 2989; Сахих Муслим, 1009",
        narrator: "Абу Хурайра (р.а.)"
    },
    {
        ar: "مَا نَقَصَتْ صَدَقَةٌ مِنْ مَالٍ",
        ru: "Милостыня не уменьшает имущества.",
        en: "Charity does not decrease wealth.",
        kk: "Садақа малды азайтпайды.",
        source: "Сахих Муслим, 2588",
        narrator: "Абу Хурайра (р.а.)"
    },
    {
        ar: "إِنَّ اللَّهَ رَفِيقٌ يُحِبُّ الرِّفْقَ فِي الأَمْرِ كُلِّهِ",
        ru: "Поистине, Аллах — Мягкий и любит мягкость во всех делах.",
        en: "Indeed, Allah is Gentle and loves gentleness in all affairs.",
        kk: "Шынында, Алла — Жұмсақ және барлық істерде жұмсақтықты сүйеді.",
        source: "Сахих аль-Бухари, 6927; Сахих Муслим, 2593",
        narrator: "Аиша (р.а.)"
    },
    {
        ar: "الدَّالُّ عَلَى الْخَيْرِ كَفَاعِلِهِ",
        ru: "Указавший на благое дело подобен совершившему его.",
        en: "The one who guides others to goodness is like the one who does it.",
        kk: "Жақсылыққа жол көрсеткен — оны жасағанмен тең.",
        source: "Сунан ат-Тирмизи, 2670",
        narrator: "Анас ибн Малик (р.а.)"
    },
    {
        ar: "مَنْ صَلَّى عَلَيَّ صَلَاةً وَاحِدَةً، صَلَّى اللَّهُ عَلَيْهِ عَشْرَ صَلَوَاتٍ",
        ru: "Кто один раз помолится за меня, Аллах помолится за него десять раз.",
        en: "Whoever sends one blessing upon me, Allah will send ten blessings upon him.",
        kk: "Кім маған бір рет салауат айтса, Алла оған он рет рахмет жаудырады.",
        source: "Сахих Муслим, 408",
        narrator: "Абу Хурайра (р.а.)"
    },
    {
        ar: "خَيْرُكُمْ أَحْسَنُكُمْ خُلُقًا",
        ru: "Лучшие из вас — обладающие лучшим нравом.",
        en: "The best among you are those who have the best character.",
        kk: "Сендердің ең жақсыларың — мінезі ең жақсылар.",
        source: "Сахих аль-Бухари, 3559; Сахих Муслим, 2321",
        narrator: "Абдуллах ибн Амр (р.а.)"
    },
    {
        ar: "لا ضَرَرَ وَلا ضِرَارَ",
        ru: "Не причиняй вреда и не отвечай вредом на вред.",
        en: "Do not cause harm and do not reciprocate harm.",
        kk: "Зиян келтірме және зиянға зиянмен жауап берме.",
        source: "Сунан Ибн Маджа, 2340; Муснад Ахмад",
        narrator: "Абу Саид аль-Худри (р.а.)"
    },
    {
        ar: "الْيَدُ الْعُلْيَا خَيْرٌ مِنَ الْيَدِ السُّفْلَى",
        ru: "Верхняя рука (дающая) лучше нижней руки (берущей).",
        en: "The upper hand (the giving one) is better than the lower hand (the receiving one).",
        kk: "Жоғарғы қол (беруші) төменгі қолдан (алушыдан) жақсырақ.",
        source: "Сахих аль-Бухари, 1427; Сахих Муслим, 1033",
        narrator: "Абдуллах ибн Умар (р.а.)"
    },
    {
        ar: "مَنْ لَا يَرْحَمُ لَا يُرْحَمُ",
        ru: "Кто не проявляет милосердия, к тому не будет проявлено милосердие.",
        en: "He who does not show mercy will not be shown mercy.",
        kk: "Кім мейірімділік көрсетпесе, оған да мейірімділік көрсетілмейді.",
        source: "Сахих аль-Бухари, 5997; Сахих Муслим, 2318",
        narrator: "Джарир ибн Абдуллах (р.а.)"
    },
    {
        ar: "إِذَا مَاتَ ابْنُ آدَمَ انْقَطَعَ عَمَلُهُ إِلَّا مِنْ ثَلَاثٍ: صَدَقَةٍ جَارِيَةٍ، أَوْ عِلْمٍ يُنْتَفَعُ بِهِ، أَوْ وَلَدٍ صَالِحٍ يَدْعُو لَهُ",
        ru: "Когда сын Адама умирает, его деяния прекращаются, кроме трёх: непрерывная милостыня, полезное знание, и праведный ребенок, который молится за него.",
        en: "When a person dies, his deeds come to an end except for three: ongoing charity, beneficial knowledge, or a righteous child who prays for him.",
        kk: "Адам баласы қайтыс болғанда, амалдары тоқталады, үшеуінен басқа: үздіксіз садақа, пайдалы білім, немесе ол үшін дұға ететін ізгі бала.",
        source: "Сахих Муслим, 1631",
        narrator: "Абу Хурайра (р.а.)"
    },
    {
        ar: "الْمُؤْمِنُ لِلْمُؤْمِنِ كَالْبُنْيَانِ يَشُدُّ بَعْضُهُ بَعْضًا",
        ru: "Верующий для верующего — как здание, части которого поддерживают друг друга.",
        en: "A believer to another believer is like a building whose parts reinforce each other.",
        kk: "Мүмін мүмін үшін — бір-бірін ұстап тұратын ғимарат сияқты.",
        source: "Сахих аль-Бухари, 2446; Сахих Муслим, 2585",
        narrator: "Абу Муса аль-Ашари (р.а.)"
    },
    {
        ar: "اسْتَفْتِ قَلْبَكَ، الْبِرُّ مَا اطْمَأَنَّتْ إِلَيْهِ النَّفْسُ وَاطْمَأَنَّ إِلَيْهِ الْقَلْبُ",
        ru: "Спроси своё сердце. Благочестие — то, от чего душа и сердце приходят в покой.",
        en: "Consult your heart. Righteousness is what brings tranquility to the soul and the heart.",
        kk: "Жүрегіңнен сұра. Ізгілік — жан мен жүрек тыныштық табатын нәрсе.",
        source: "Муснад Ахмад, 17545; Сунан ад-Дарими",
        narrator: "Вабиса ибн Мабад (р.а.)"
    },
    {
        ar: "مَنْ غَشَّنَا فَلَيْسَ مِنَّا",
        ru: "Кто обманывает нас — тот не из нас.",
        en: "Whoever cheats us is not one of us.",
        kk: "Кім бізді алдаса — ол біздің қатарымыздан емес.",
        source: "Сахих Муслим, 101",
        narrator: "Абу Хурайра (р.а.)"
    },
    {
        ar: "خَيْرُكُمْ خَيْرُكُمْ لِأَهْلِهِ",
        ru: "Лучший из вас — тот, кто лучше всех относится к своей семье.",
        en: "The best of you is the one who is best to his family.",
        kk: "Сендердің ең жақсыларың — отбасына ең жақсы қатынас жасайтындар.",
        source: "Сунан ат-Тирмизи, 3895; Сунан Ибн Маджа, 1977",
        narrator: "Аиша (р.а.)"
    }
];

/**
 * Seeded pseudo-random number generator (Mulberry32)
 * Generates same sequence for same seed — ensures one ayat+hadith per day
 */
function seededRandom(seed) {
    let t = seed + 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
}

/**
 * Get a date-based seed: YYYYMMDD as integer
 */
function getDateSeed(dateStr) {
    const d = dateStr || new Date().toISOString().slice(0, 10);
    return parseInt(d.replace(/-/g, ''), 10);
}

/**
 * Get today's wisdom — one Quran ayat + one Hadith
 * Both are deterministic per day (same content for same date)
 */
function getDailyWisdom(dateStr) {
    const seed = getDateSeed(dateStr);
    const r1 = seededRandom(seed);
    const r2 = seededRandom(seed + 7919); // different prime offset for hadith

    const ayatIndex = Math.floor(r1 * QURAN_AYATS.length);
    const hadithIndex = Math.floor(r2 * HADITHS.length);

    return {
        ayat: QURAN_AYATS[ayatIndex],
        hadith: HADITHS[hadithIndex]
    };
}

// ═══════════════════════════════════════════════════════════════
// СЛОВАРИ И ФУНКЦИИ ЛОКАЛИЗАЦИИ МЕТАДАННЫХ МУДРОСТИ ДНЯ
// ═══════════════════════════════════════════════════════════════

const WISDOM_SURAH_MAP = {
    "Аль-Фатиха": { kk: "Әл-Фатиха", en: "Al-Fatihah", ar: "الفاتحة" },
    "Аль-Бакара": { kk: "Әл-Бақара", en: "Al-Baqarah", ar: "البقرة" },
    "Аш-Шарх": { kk: "Әш-Шарх", en: "Ash-Sharh", ar: "الشرح" },
    "Ат-Таляк": { kk: "Әт-Талақ", en: "At-Talaq", ar: "الطلاق" },
    "Юсуф": { kk: "Юсуф", en: "Yusuf", ar: "يوسف" },
    "Аль-Джума": { kk: "Әл-Жұма", en: "Al-Jumu'ah", ar: "الجمعة" },
    "Та-Ха": { kk: "Та-Ха", en: "Ta-Ha", ar: "طه" },
    "Гафир": { kk: "Ғафир", en: "Ghafir", ar: "غافر" },
    "Аль-Камар": { kk: "Әл-Қамар", en: "Al-Qamar", ar: "القمر" },
    "Ат-Тауба": { kk: "Әт-Тәубе", en: "At-Tawbah", ar: "التوبة" },
    "Ан-Нахль": { kk: "Ән-Нахл", en: "An-Nahl", ar: "النحل" },
    "Аль-Исра": { kk: "Әл-Исра", en: "Al-Isra", ar: "الإسراء" },
    "Ар-Рахман": { kk: "Әр-Рахман", en: "Ar-Rahman", ar: "الرحمن" },
    "Аз-Зумар": { kk: "Әз-Зүмер", en: "Az-Zumar", ar: "الزمر" },
    "Аз-Зарият": { kk: "Әз-Зәрият", en: "Adh-Dhariyat", ar: "الذاريات" },
    "Ад-Духа": { kk: "Әд-Духа", en: "Ad-Duha", ar: "الضحы" },
    "Ар-Раад": { kk: "Әр-Рағыд", en: "Ar-Ra'd", ar: "الرعد" },
    "Аль-Имран": { kk: "Әли Имран", en: "Ali 'Imran", ar: "آل عمران" },
    "Аль-Хашр": { kk: "Әл-Хашр", en: "Al-Hashr", ar: "الحشر" },
    "Аль-Маида": { kk: "Әл-Мәида", en: "Al-Ma'idah", ar: "المائدة" }
};

const WISDOM_BOOK_MAP = {
    "Сахих аль-Бухари": { kk: "Сахих әл-Бұхари", en: "Sahih al-Bukhari", ar: "صحيح البخاري" },
    "Сахих Муслим": { kk: "Сахих Муслим", en: "Sahih Muslim", ar: "صحيح مسلم" },
    "Сунан ат-Тирмизи": { kk: "Сунан әт-Тирмизи", en: "Sunan at-Tirmidhi", ar: "سنن الترمذي" },
    "Сунан Ибн Маджа": { kk: "Сунан Ибн Маджа", en: "Sunan Ibn Majah", ar: "سنن ابن ماجه" },
    "Муснад Ахмад": { kk: "Муснад Ахмад", en: "Musnad Ahmad", ar: "مسند أحمد" },
    "Сунан ад-Дарими": { kk: "Сунан ад-Дарими", en: "Sunan ad-Darimi", ar: "سنن الدارمي" }
};

const WISDOM_NARRATOR_MAP = {
    "Умар ибн аль-Хаттаб": { kk: "Омар ибн әл-Хаттаб", en: "Umar ibn al-Khattab", ar: "عمر بن الخطاب", gender: "m" },
    "Абдуллах ибн Амр": { kk: "Абдуллах ибн Амр", en: "Abdullah ibn Amr", ar: "عبد الله بن عمرو", gender: "m" },
    "Анас ибн Малик": { kk: "Әнас ибн Мәлік", en: "Anas ibn Malik", ar: "أنس بن مالك", gender: "m" },
    "Абу Хурайра": { kk: "Әбу Хурайра", en: "Abu Hurairah", ar: "أبو هريرة", gender: "m" },
    "Абу Малик аль-Ашари": { kk: "Әбу Мәлік әл-Ашари", en: "Abu Malik al-Ash'ari", ar: "أبو مالك الأشعري", gender: "m" },
    "Усман ибн Аффан": { kk: "Осман ибн Аффан", en: "Uthman ibn Affan", ar: "عثمان بن عفان", gender: "m" },
    "Абу Зарр": { kk: "Әбу Зәр", en: "Abu Dharr", ar: "أبو ذر", gender: "m" },
    "Аиша": { kk: "Айша", en: "Aisha", ar: "عائشة", gender: "f" },
    "Аль-Миқдам ибн Мадикариб": { kk: "Әл-Миқдам ибн Мәдикариб", en: "Al-Miqdam ibn Ma'dikarib", ar: "المقدام بن معديكرب", gender: "m" },
    "Абу Саид аль-Худри": { kk: "Әбу Саид әл-Худри", en: "Abu Sa'id al-Khudri", ar: "أبو سعيد الخدري", gender: "m" },
    "Абдуллах ибн Умар": { kk: "Абдуллах ибн Омар", en: "Abdullah ibn Umar", ar: "عبد الله بن عمر", gender: "m" },
    "Джарир ибн Абдуллах": { kk: "Жарир ибн Абдуллах", en: "Jarir ibn Abdullah", ar: "جرير بن عبد الله", gender: "m" },
    "Абу Муса аль-Ашари": { kk: "Әбу Мұса әл-Ашари", en: "Abu Musa al-Ash'ari", ar: "أبو موسى الأشعري", gender: "m" },
    "Вабиса ибн Мабад": { kk: "Уабиса ибн Мағбад", en: "Wabisah ibn Ma'bad", ar: "وابصة بن معبد", gender: "m" },
    "Абу Зарр и Муаз ибн Джабаль": { kk: "Әбу Зәр және Муаз ибн Жәбәл", en: "Abu Dharr and Mu'adh ibn Jabal", ar: "أبو ذر ومعاذ بن جبل", gender: "dual" }
};

/**
 * Локализация ссылок на Коран (например: "Сура Аль-Фатиха (1:1-3)" -> "Surah Al-Fatihah (1:1-3)")
 */
function translateQuranRef(ref, lang) {
    if (lang === 'ru') return ref;

    if (ref.includes('Принцип из Хадиса')) {
        if (lang === 'kk') return 'Әл-Бақара сүресі — Аяттармен расталған хадистен алынған принцип';
        if (lang === 'en') return 'Surah Al-Baqarah — Hadith principle confirmed by verses';
        if (lang === 'ar') return 'سورة البقرة — مبدأ من الحديث تؤكده الآيات';
        return ref;
    }

    let matchedName = null;
    for (const ruName of Object.keys(WISDOM_SURAH_MAP)) {
        if (ref.includes(ruName)) {
            matchedName = ruName;
            break;
        }
    }

    if (!matchedName) return ref;

    const translation = WISDOM_SURAH_MAP[matchedName][lang] || matchedName;
    const verses = (ref.match(/\([^)]+\)/) || [''])[0];

    let suffix = '';
    if (ref.includes('Аят аль-Курси')) {
        if (lang === 'kk') suffix = ' — Аят әл-Күрси';
        else if (lang === 'en') suffix = ' — Ayat al-Kursi';
        else if (lang === 'ar') suffix = ' — آية الكرسي';
        else suffix = ' — Аят аль-Курси';
    }

    if (lang === 'ar') {
        return `سورة ${translation} ${verses}${suffix}`;
    } else if (lang === 'en') {
        return `Surah ${translation} ${verses}${suffix}`;
    } else if (lang === 'kk') {
        return `${translation} сүресі ${verses}${suffix}`;
    }

    return ref;
}

/**
 * Локализация источников хадисов (например: "Сахих аль-Бухари, 13; Сахих Муслим, 45")
 */
function translateHadithSource(source, lang) {
    if (lang === 'ru') return source;

    return source.split(';').map(part => {
        let trimmed = part.trim();
        let matchedBook = null;
        for (const ruBook of Object.keys(WISDOM_BOOK_MAP)) {
            if (trimmed.startsWith(ruBook)) {
                matchedBook = ruBook;
                break;
            }
        }

        if (!matchedBook) return trimmed;

        const translatedBook = WISDOM_BOOK_MAP[matchedBook][lang] || matchedBook;
        const rest = trimmed.slice(matchedBook.length);
        return translatedBook + rest;
    }).join(lang === 'ar' ? '؛ ' : '; ');
}

/**
 * Локализация имен передатчиков хадисов (с учетом арабского этикета/окончаний)
 */
function translateNarrator(narrator, lang) {
    if (lang === 'ru') return narrator;

    let cleanName = narrator.replace(/\s*\(р\.а\.\)/g, '').trim();

    const matched = WISDOM_NARRATOR_MAP[cleanName];
    if (!matched) return narrator;

    const translatedName = matched[lang] || cleanName;

    if (lang === 'ar') {
        let suffix = 'رضي الله عنه';
        if (matched.gender === 'f') suffix = 'رضي الله عنها';
        else if (matched.gender === 'dual') suffix = 'رضي الله عنهما';
        return `${translatedName} ${suffix}`;
    } else if (lang === 'en') {
        return `${translatedName} (ra)`;
    } else if (lang === 'kk') {
        return `${translatedName} (р.а.)`;
    }

    return narrator;
}

/**
 * Render the Daily Wisdom tab content
 */
function renderDailyWisdom() {
    const container = document.getElementById('wisdom-content');
    if (!container) return;

    const lang = localStorage.getItem('barakah_lang') || 'ru';
    const wisdom = getDailyWisdom();

    const ayat = wisdom.ayat;
    const hadith = wisdom.hadith;

    // Get translated text (fallback to ru)
    const getT = (obj, key) => obj[key] || obj['ru'] || '';

    // Date display
    const today = new Date();
    const dateOpts = { year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = today.toLocaleDateString(lang === 'ar' ? 'ar-SA' : lang === 'kk' ? 'kk-KZ' : lang === 'en' ? 'en-US' : 'ru-RU', dateOpts);

    const labels = {
        ru: {
            dateLabel: 'Мудрость дня',
            quranSection: 'Аят из Корана',
            hadithSection: 'Хадис',
            source: 'Источник',
            narrator: 'Передал',
            newWisdom: 'Обновляется ежедневно',
            shareBtn: 'Поделиться'
        },
        kk: {
            dateLabel: 'Күннің даналығы',
            quranSection: 'Құраннан аят',
            hadithSection: 'Хадис',
            source: 'Дереккөз',
            narrator: 'Жеткізуші',
            newWisdom: 'Күнделікті жаңарады',
            shareBtn: 'Бөлісу'
        },
        en: {
            dateLabel: 'Daily Wisdom',
            quranSection: 'Quran Verse',
            hadithSection: 'Hadith',
            source: 'Source',
            narrator: 'Narrated by',
            newWisdom: 'Refreshes daily',
            shareBtn: 'Share'
        },
        ar: {
            dateLabel: 'حكمة اليوم',
            quranSection: 'آية من القرآن',
            hadithSection: 'حديث',
            source: 'المصدر',
            narrator: 'رواه',
            newWisdom: 'يتجدد يومياً',
            shareBtn: 'مشاركة'
        }
    };

    const L = labels[lang] || labels['ru'];

    const translatedQuranRef = translateQuranRef(ayat.ref, lang);
    const translatedHadithSource = translateHadithSource(hadith.source, lang);
    const translatedNarrator = translateNarrator(hadith.narrator, lang);

    container.innerHTML = `
        <!-- Date badge -->
        <div class="flex items-center justify-center gap-2 mb-6">
            <span class="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">${L.dateLabel}</span>
            <span class="text-xs text-gray-400 dark:text-gray-500">·</span>
            <span class="text-xs text-gray-500 dark:text-gray-400">${dateStr}</span>
        </div>

        <!-- Quran Ayat Card -->
        <div class="wisdom-card quran-card bg-gradient-to-br from-emerald-50/80 to-teal-50/80 dark:from-slate-900/90 dark:to-emerald-950/80 rounded-[1.5rem] p-6 md:p-8 border border-emerald-200/60 dark:border-emerald-800/60 shadow-sm mb-6 relative overflow-hidden">
            <div class="absolute top-3 end-4 text-emerald-200 dark:text-emerald-900/40 text-5xl opacity-50 pointer-events-none" style="font-family: 'Amiri', serif;">﴿﴾</div>
            <div class="flex items-center gap-2 mb-4">
                <div class="w-8 h-8 rounded-full bg-emerald-500/10 dark:bg-emerald-400/10 flex items-center justify-center">
                    <i class="fas fa-quran text-emerald-600 dark:text-emerald-400 text-sm"></i>
                </div>
                <h3 class="text-sm font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">${L.quranSection}</h3>
            </div>
            <p class="arabic text-[1.5rem] md:text-[1.75rem] leading-[2.2] text-gray-800 dark:text-gray-100 text-center mb-5 font-bold" dir="rtl" style="font-family: 'Amiri', serif; text-shadow: 0 1px 3px rgba(0,0,0,0.05);">${ayat.ar}</p>
            <p class="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed text-center italic mb-4">${getT(ayat, lang)}</p>
            <p class="text-xs text-emerald-600 dark:text-emerald-400 font-semibold text-center">📖 ${translatedQuranRef}</p>
        </div>

        <!-- Hadith Card -->
        <div class="wisdom-card hadith-card bg-gradient-to-br from-amber-50/80 to-yellow-50/80 dark:from-slate-900/90 dark:to-amber-950/80 rounded-[1.5rem] p-6 md:p-8 border border-amber-200/60 dark:border-amber-800/60 shadow-sm mb-6 relative overflow-hidden">
            <div class="absolute top-3 end-4 text-amber-200 dark:text-amber-900/40 text-4xl opacity-40 pointer-events-none"><i class="fas fa-star-and-crescent"></i></div>
            <div class="flex items-center gap-2 mb-4">
                <div class="w-8 h-8 rounded-full bg-amber-500/10 dark:bg-amber-400/10 flex items-center justify-center">
                    <i class="fas fa-book-open text-amber-600 dark:text-amber-400 text-sm"></i>
                </div>
                <h3 class="text-sm font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">${L.hadithSection}</h3>
            </div>
            <p class="arabic text-[1.3rem] md:text-[1.5rem] leading-[2.2] text-gray-800 dark:text-gray-100 text-center mb-5 font-bold" dir="rtl" style="font-family: 'Amiri', serif; text-shadow: 0 1px 3px rgba(0,0,0,0.05);">${hadith.ar}</p>
            <p class="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed text-center italic mb-4">${getT(hadith, lang)}</p>
            <div class="flex flex-col items-center gap-1">
                <p class="text-xs text-amber-700 dark:text-amber-400 font-semibold">📚 ${L.source}: ${translatedHadithSource}</p>
                <p class="text-[11px] text-gray-500 dark:text-gray-400">${L.narrator}: ${translatedNarrator}</p>
            </div>
        </div>

        <!-- Share button -->
        <div class="flex items-center justify-center gap-3 mt-2 mb-4">
            <button id="btn-share-wisdom" class="flex items-center gap-2 px-5 py-2.5 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-sm font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all hover:shadow-sm border border-indigo-100 dark:border-indigo-800/50">
                <i class="fas fa-share-alt text-xs"></i>
                ${L.shareBtn}
            </button>
        </div>

        <!-- Footer hint -->
        <p class="text-center text-[10px] text-gray-400 dark:text-gray-500 italic mt-2">
            🔄 ${L.newWisdom}
        </p>
    `;

    // Share functionality
    const shareBtn = document.getElementById('btn-share-wisdom');
    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            const shareText = `📖 ${translatedQuranRef}\n${ayat.ar}\n${getT(ayat, lang)}\n\n📚 ${translatedHadithSource}\n${hadith.ar}\n${getT(hadith, lang)}\n\n— Barakah Planner`;

            if (navigator.share) {
                navigator.share({ title: L.dateLabel, text: shareText }).catch(() => {});
            } else if (navigator.clipboard) {
                navigator.clipboard.writeText(shareText).then(() => {
                    const toast = document.getElementById('toast-message');
                    const toastText = document.getElementById('toast-text');
                    if (toast && toastText) {
                        toastText.textContent = lang === 'ru' ? 'Скопировано!' : lang === 'kk' ? 'Көшірілді!' : lang === 'ar' ? 'تم النسخ!' : 'Copied!';
                        toast.classList.remove('opacity-0', 'pointer-events-none');
                        toast.classList.add('opacity-100');
                        setTimeout(() => {
                            toast.classList.add('opacity-0', 'pointer-events-none');
                            toast.classList.remove('opacity-100');
                        }, 2000);
                    }
                });
            }
        });
    }
}

// Слушатель события смены языка для мгновенной перерисовки без перезагрузки страницы
document.addEventListener('langChanged', () => {
    if (document.getElementById('wisdom-content')) {
        renderDailyWisdom();
    }
});

// Export for use in main.js
window.renderDailyWisdom = renderDailyWisdom;
