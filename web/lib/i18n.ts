export type Lang = "ru" | "kz" | "en";

export const translations = {
  ru: {
    subtitle: "Открытая платформа клёва · Бесплатно",
    clickHint: "👆 Найдите водоём чтобы узнать индекс клёва",
    emptyStateTitle: "Найдите место для рыбалки",
    emptyStateDesc: "Введите название водоёма или используйте геолокацию",
    searchPlaceholder: "Поиск водоёма, реки, города...",
    useMyLocation: "Использовать моё местоположение",
    popularSpots: "Популярные места",
    searching: "Поиск...",
    noResults: "Ничего не найдено",
    locationError: "Не удалось определить местоположение",
    back: "Назад",
    speciesLabel: "Вид рыбы",
    forecast48h: "Прогноз на 48 часов",
    bestWindow: "Лучшее время в 48ч",
    todayWindows: "Окна клёва сегодня",
    dailyRating: "Рейтинг дня",
    moonPhase: "Фаза луны",
    solunarMajor: "Мажор",
    solunarMinor: "Минор",
    factors: "Факторы",
    reason: "Причина",
    loading: "Загрузка...",
    closePanel: "Закрыть",
    copyLink: "Скопировать ссылку",
    linkCopied: "Скопировано!",
    errorTitle: "Не удалось загрузить прогноз",
    apiError: "Проверьте подключение к интернету и попробуйте снова.",
    regionWarning: "Редко встречается в этом регионе",
    windowLabels: { excellent: "Отлично", good: "Хорошо", fair: "Умеренно" },
    factorNames: {
      solunar: "Солунар",
      pressure: "Давление",
      temperature: "Температура",
      time_of_day: "Время суток",
      wind: "Ветер",
    },
    factorTips: {
      solunar: "Положение луны и солнца. Рыба наиболее активна когда луна в зените или надире — эти 1-2 часа дают пик клёва. Восход/закат солнца тоже создаёт малые периоды.",
      pressure: "Рыба чувствует давление через плавательный пузырь. Резкое падение перед грозовым фронтом — самый мощный сигнал к кормёжке. Стабильное давление = обычная активность.",
      temperature: "У каждого вида есть оптимальный диапазон температуры воды. Вне диапазона метаболизм замедляется и рыба кормится реже.",
      time_of_day: "Рассвет и закат — пиковое время кормёжки хищников. В сумерках легче маскироваться при засаде. Полдень летом — самое тихое время.",
      wind: "Умеренный ветер (3-7 м/с) гонит мальков к берегу — хищник идёт следом. Штиль делает рыбу осторожной. Шторм > 10 м/с — рыба уходит на глубину.",
    },
    labels: {
      Poor: "Плохо",
      Fair: "Умеренно",
      Good: "Хорошо",
      Excellent: "Отлично",
    },
    reasonCodes: {
      pressure_drop_fast: "Давление резко падает — рыба жадно кормится перед фронтом",
      pressure_drop_slow: "Давление медленно падает — клёв усиливается",
      pressure_rising: "Давление растёт после шторма — рыба восстанавливается",
      pressure_stable: "Давление стабильно — {value} гПа",
      solunar_major: "Активный солунарный период (луна в зените)",
      solunar_minor: "Малый солунарный период",
      golden_hour: "Золотой час (рассвет / закат)",
      temp_suboptimal: "Температура воды вне оптимального диапазона",
      average_conditions: "Средние условия",
    },
    welcome: {
      title: "Добро пожаловать в FishPulse",
      subtitle: "Открытая карта клёва · Бесплатно для каждого рыбака",
      indexTitle: "Что такое Индекс Клёва?",
      indexDesc: "Число от 0 до 100, которое показывает насколько хорошо клюёт рыба прямо сейчас. Рассчитывается из 5 факторов:",
      factors: [
        { icon: "🌙", label: "Солунар", desc: "Положение луны и солнца · 25%" },
        { icon: "🌡️", label: "Давление", desc: "Тренд атмосферного давления · 30%" },
        { icon: "🌊", label: "Температура", desc: "Температура воды · 20%" },
        { icon: "🌅", label: "Время суток", desc: "Рассвет, закат, полдень · 15%" },
        { icon: "💨", label: "Ветер", desc: "Скорость и направление · 10%" },
      ],
      stepsTitle: "Как пользоваться",
      steps: [
        { icon: "🗺️", text: "Нажми на любую точку карты — реку, озеро или море" },
        { icon: "🐟", text: "Выбери вид рыбы, на которую собираешься" },
        { icon: "📊", text: "Смотри Индекс Клёва, прогноз на 48 часов и лучшее время" },
      ],
      startBtn: "Начать рыбалку",
      tip: "💡 Нажми на любой фактор в панели чтобы узнать подробнее",
    },
  },
  kz: {
    subtitle: "Ашық балық аулау платформасы · Тегін",
    clickHint: "👆 Шабу индексін білу үшін су қоймасын табыңыз",
    emptyStateTitle: "Балық аулайтын жерді табыңыз",
    emptyStateDesc: "Су қоймасының атауын енгізіңіз немесе геолокацияны пайдаланыңыз",
    searchPlaceholder: "Су қоймасы, өзен, қала іздеу...",
    useMyLocation: "Менің орналасқан жерімді пайдалану",
    popularSpots: "Танымал орындар",
    searching: "Іздеу...",
    noResults: "Ештеңе табылмады",
    locationError: "Орналасқан жерді анықтау мүмкін болмады",
    back: "Артқа",
    speciesLabel: "Балық түрі",
    forecast48h: "48 сағаттық болжам",
    bestWindow: "48 сағ. ең жақсы уақыт",
    todayWindows: "Бүгінгі шабу терезелері",
    dailyRating: "Күн рейтингі",
    moonPhase: "Ай фазасы",
    solunarMajor: "Мажор",
    solunarMinor: "Минор",
    factors: "Факторлар",
    reason: "Себеп",
    loading: "Жүктелуде...",
    closePanel: "Жабу",
    copyLink: "Сілтемені көшіру",
    linkCopied: "Көшірілді!",
    errorTitle: "Болжамды жүктеу мүмкін болмады",
    apiError: "Интернет байланысын тексеріп, қайталап көріңіз.",
    regionWarning: "Бұл аймақта сирек кездеседі",
    windowLabels: { excellent: "Тамаша", good: "Жақсы", fair: "Орташа" },
    factorNames: {
      solunar: "Солунар",
      pressure: "Қысым",
      temperature: "Температура",
      time_of_day: "Тәулік уақыты",
      wind: "Жел",
    },
    factorTips: {
      solunar: "Ай мен күннің орны. Ай шыңда немесе аяқ астында тұрғанда балық ең белсенді болады — бұл 1-2 сағаттық шабу шыңы. Таң мен кештің шығуы кіші кезеңдер жасайды.",
      pressure: "Балық жүзу қабы арқылы қысымды сезеді. Дауылдан бұрын күрт түсу — ең күшті тамақтану сигналы. Тұрақты қысым = қалыпты белсенділік.",
      temperature: "Әр түрдің оңтайлы су температурасы диапазоны бар. Диапазоннан тыс болса, метаболизм баяулайды және балық сирек тамақтанады.",
      time_of_day: "Таң мен кеш — жыртқыштардың шабу шыңы. Ымыртта бұғып аулау оңай. Жазғы түстен кейін — ең тыныш уақыт.",
      wind: "Орташа жел (3-7 м/с) балықтарды жағаға қарай айдайды — жыртқыш соңынан ереді. Штиль балықты сақ етеді. Дауыл > 10 м/с — балық тереңге кетеді.",
    },
    labels: {
      Poor: "Нашар",
      Fair: "Орташа",
      Good: "Жақсы",
      Excellent: "Тамаша",
    },
    reasonCodes: {
      pressure_drop_fast: "Қысым күрт түсуде — балық фронтқа дейін жадырап тамақтанады",
      pressure_drop_slow: "Қысым баяу түсуде — шабу күшейеді",
      pressure_rising: "Дауылдан кейін қысым өседі — балық қалпына келеді",
      pressure_stable: "Қысым тұрақты — {value} гПа",
      solunar_major: "Белсенді солунарлық кезең (ай шыңында)",
      solunar_minor: "Кіші солунарлық кезең",
      golden_hour: "Алтын сағат (таң / кеш)",
      temp_suboptimal: "Су температурасы оңтайлы диапазоннан тыс",
      average_conditions: "Орташа жағдайлар",
    },
    welcome: {
      title: "FishPulse-қа қош келдіңіз",
      subtitle: "Ашық балық аулау картасы · Әр балықшыға тегін",
      indexTitle: "Шабу индексі дегеніміз не?",
      indexDesc: "0-ден 100-ге дейінгі сан, қазір балықтың қаншалықты жақсы шабатынын көрсетеді. 5 фактордан есептеледі:",
      factors: [
        { icon: "🌙", label: "Солунар", desc: "Ай мен күннің орны · 25%" },
        { icon: "🌡️", label: "Қысым", desc: "Атмосфералық қысым тренді · 30%" },
        { icon: "🌊", label: "Температура", desc: "Су температурасы · 20%" },
        { icon: "🌅", label: "Тәулік уақыты", desc: "Таң, кеш, түс · 15%" },
        { icon: "💨", label: "Жел", desc: "Жылдамдық және бағыт · 10%" },
      ],
      stepsTitle: "Қалай пайдалану",
      steps: [
        { icon: "🗺️", text: "Картадағы кез келген нүктені басыңыз — өзен, көл немесе теңіз" },
        { icon: "🐟", text: "Аулайтын балық түрін таңдаңыз" },
        { icon: "📊", text: "Шабу индексін, 48 сағаттық болжамды және ең жақсы уақытты қараңыз" },
      ],
      startBtn: "Балық аулауды бастау",
      tip: "💡 Қосымша ақпарат алу үшін панельдегі кез келген факторды басыңыз",
    },
  },
  en: {
    subtitle: "Open fishing intelligence · Free",
    clickHint: "👆 Find a water body to get the bite index",
    emptyStateTitle: "Find a fishing spot",
    emptyStateDesc: "Search for a lake, river or use your location",
    searchPlaceholder: "Search lake, river, city...",
    useMyLocation: "Use my location",
    popularSpots: "Popular spots",
    searching: "Searching...",
    noResults: "Nothing found",
    locationError: "Could not determine your location",
    back: "Back",
    speciesLabel: "Fish species",
    forecast48h: "48-hour forecast",
    bestWindow: "Best window in 48h",
    todayWindows: "Today's bite windows",
    dailyRating: "Day rating",
    moonPhase: "Moon phase",
    solunarMajor: "Major",
    solunarMinor: "Minor",
    factors: "Factors",
    reason: "Why",
    loading: "Loading...",
    closePanel: "Close",
    copyLink: "Copy link",
    linkCopied: "Copied!",
    errorTitle: "Failed to load forecast",
    apiError: "Check your internet connection and try again.",
    regionWarning: "Rarely found in this region",
    windowLabels: { excellent: "Excellent", good: "Good", fair: "Fair" },
    factorNames: {
      solunar: "Solunar",
      pressure: "Pressure",
      temperature: "Temperature",
      time_of_day: "Time of day",
      wind: "Wind",
    },
    factorTips: {
      solunar: "Moon and sun position. Fish are most active when the moon is directly overhead or underfoot — these 1-2 hour windows are peak bite time. Sunrise/sunset create minor periods.",
      pressure: "Fish sense pressure through their swim bladder. A rapid drop before a storm front is the strongest feeding trigger. Stable pressure = normal activity.",
      temperature: "Each species has an optimal water temperature range. Outside that range, metabolism slows and fish feed less frequently.",
      time_of_day: "Dawn and dusk are peak feeding times for predators. Low light makes ambush easier. Summer midday is the quietest period.",
      wind: "Moderate wind (3-7 m/s) pushes baitfish toward shore — predators follow. Dead calm makes fish wary. Storm > 10 m/s — fish go deep.",
    },
    labels: {
      Poor: "Poor",
      Fair: "Fair",
      Good: "Good",
      Excellent: "Excellent",
    },
    reasonCodes: {
      pressure_drop_fast: "Pressure dropping fast — fish feeding aggressively before the front",
      pressure_drop_slow: "Pressure slowly falling — feeding picking up",
      pressure_rising: "Pressure rising after storm — fish recovering",
      pressure_stable: "Pressure stable at {value} hPa",
      solunar_major: "Solunar major period active",
      solunar_minor: "Solunar minor period",
      golden_hour: "Golden hour (sunrise / sunset)",
      temp_suboptimal: "Water temperature outside optimal range",
      average_conditions: "Average conditions",
    },
    welcome: {
      title: "Welcome to FishPulse",
      subtitle: "Open fishing intelligence · Free for every angler",
      indexTitle: "What is the Bite Index?",
      indexDesc: "A score from 0 to 100 showing how well fish are biting right now. Calculated from 5 factors:",
      factors: [
        { icon: "🌙", label: "Solunar", desc: "Moon & sun position · 25%" },
        { icon: "🌡️", label: "Pressure", desc: "Atmospheric pressure trend · 30%" },
        { icon: "🌊", label: "Temperature", desc: "Water temperature · 20%" },
        { icon: "🌅", label: "Time of day", desc: "Dawn, dusk, midday · 15%" },
        { icon: "💨", label: "Wind", desc: "Speed and direction · 10%" },
      ],
      stepsTitle: "How to use",
      steps: [
        { icon: "🗺️", text: "Tap anywhere on the map — river, lake or sea" },
        { icon: "🐟", text: "Choose the fish species you're targeting" },
        { icon: "📊", text: "See the Bite Index, 48-hour forecast and best time window" },
      ],
      startBtn: "Start fishing",
      tip: "💡 Tap any factor in the panel to learn what drives it",
    },
  },
} as const;

export type Translations = {
  subtitle: string;
  clickHint: string;
  emptyStateTitle: string;
  emptyStateDesc: string;
  searchPlaceholder: string;
  useMyLocation: string;
  popularSpots: string;
  searching: string;
  noResults: string;
  locationError: string;
  back: string;
  speciesLabel: string;
  forecast48h: string;
  bestWindow: string;
  todayWindows: string;
  dailyRating: string;
  moonPhase: string;
  solunarMajor: string;
  solunarMinor: string;
  factors: string;
  reason: string;
  loading: string;
  closePanel: string;
  copyLink: string;
  linkCopied: string;
  errorTitle: string;
  apiError: string;
  regionWarning: string;
  windowLabels: Record<string, string>;
  factorNames: Record<string, string>;
  factorTips: Record<string, string>;
  labels: Record<string, string>;
  reasonCodes: Record<string, string>;
  welcome: {
    title: string;
    subtitle: string;
    indexTitle: string;
    indexDesc: string;
    factors: readonly { icon: string; label: string; desc: string }[];
    stepsTitle: string;
    steps: readonly { icon: string; text: string }[];
    startBtn: string;
    tip: string;
  };
};
