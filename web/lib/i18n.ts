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
    nowBiting: "Клюёт сейчас",
    nowBitingEmpty: "Сейчас активного клёва нет",
    nextWindows: "Ближайшие окна",
    nextWindowsEmpty: "В ближайшие 36ч активных окон не найдено",
    inHours: "через {h}ч",
    inHoursMinutes: "через {h}ч {m}м",
    inMinutes: "через {m}м",
    tapToSelect: "Нажми, чтобы посмотреть детали",
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
      clouds: "Облачность",
      precipitation: "Осадки",
    },
    factorTips: {
      solunar: "Положение луны и солнца. Рыба наиболее активна когда луна в зените или надире — эти 1-2 часа дают пик клёва. Восход/закат солнца тоже создаёт малые периоды.",
      pressure: "Рыба чувствует давление через плавательный пузырь. Резкое падение перед грозовым фронтом — самый мощный сигнал к кормёжке. Стабильное давление = обычная активность.",
      temperature: "У каждого вида есть оптимальный диапазон температуры воды. Вне диапазона метаболизм замедляется и рыба кормится реже.",
      time_of_day: "У каждого вида свой режим: щука и судак — сумеречники, окунь и жерех — дневные, сом и налим — ночные. Скоринг учитывает это.",
      wind: "Умеренный ветер 3–7 м/с и южное/восточное направление — лучшие условия. Северный ветер из степи приносит холод и угнетает клёв.",
      clouds: "Пасмурно — хищник-засадник (щука, судак, окунь) выходит охотиться днём. Яркое солнце — время визуальных охотников (жерех, язь).",
      precipitation: "Тёплый летний дождик после паузы — мощный спусковой крючок клёва. Сильный ливень с мутью наоборот глушит судака и леща.",
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
      spawn_closure: "Нерестовый запрет — ловля этого вида ограничена",
      overcast_favorable: "Пасмурно — хищник выходит охотиться днём",
      clear_sky_favorable: "Ясное небо — время визуальных охотников",
      bright_sun_unfavorable: "Яркое солнце — рыба ушла на глубину",
      heavy_rain_turbidity: "Сильный дождь — вода мутнеет, судак и лещ затихают",
      post_shower_window: "После дождя — смытый корм провоцирует кормёжку",
      warm_wind: "Тёплый Ю/В ветер — классическая клёвая погода",
      cold_wind: "Холодный С/СЗ ветер — клёв подавлен",
    },
    welcome: {
      title: "Добро пожаловать в FishPulse",
      subtitle: "Открытая карта клёва · Бесплатно для каждого рыбака",
      indexTitle: "Что такое Индекс Клёва?",
      indexDesc: "Число от 0 до 100, которое показывает насколько хорошо клюёт рыба прямо сейчас. Рассчитывается из 7 факторов:",
      factors: [
        { icon: "🌡️", label: "Давление", desc: "Тренд атмосферного давления · 27%" },
        { icon: "🌊", label: "Температура", desc: "Температура воды · 18%" },
        { icon: "💨", label: "Ветер", desc: "Скорость и направление · 13%" },
        { icon: "🌅", label: "Время суток", desc: "Видо-зависимый режим · 13%" },
        { icon: "🌙", label: "Солунар", desc: "Положение луны и солнца · 12%" },
        { icon: "☁️", label: "Облачность", desc: "Свет влияет на охоту · 10%" },
        { icon: "🌧️", label: "Осадки", desc: "Дождь / мутность · 7%" },
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
    nowBiting: "Қазір шауып жатыр",
    nowBitingEmpty: "Қазір белсенді шабу жоқ",
    nextWindows: "Жақын терезелер",
    nextWindowsEmpty: "Жақын 36 сағатта белсенді терезе табылмады",
    inHours: "{h} сағ. кейін",
    inHoursMinutes: "{h} сағ. {m} мин. кейін",
    inMinutes: "{m} мин. кейін",
    tapToSelect: "Толығырақ көру үшін басыңыз",
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
      clouds: "Бұлттылық",
      precipitation: "Жауын-шашын",
    },
    factorTips: {
      solunar: "Ай мен күннің орны. Ай шыңда немесе аяқ астында тұрғанда балық ең белсенді болады — бұл 1-2 сағаттық шабу шыңы. Таң мен кештің шығуы кіші кезеңдер жасайды.",
      pressure: "Балық жүзу қабы арқылы қысымды сезеді. Дауылдан бұрын күрт түсу — ең күшті тамақтану сигналы. Тұрақты қысым = қалыпты белсенділік.",
      temperature: "Әр түрдің оңтайлы су температурасы диапазоны бар. Диапазоннан тыс болса, метаболизм баяулайды және балық сирек тамақтанады.",
      time_of_day: "Әр түрдің өз режимі: шортан мен судак — ымыртшыл, алабұға мен ақмарқа — күндізгі, жайын мен сүйрік — түнгі. Скоринг оны ескереді.",
      wind: "3–7 м/с орташа жел және оңтүстік/шығыс бағыт — ең жақсы жағдай. Дала жақтан соққан солтүстік жел суықты әкеліп шабуды басады.",
      clouds: "Бұлтты ауа-райы — жасырын аң аулайтын жыртқыштар (шортан, судак, алабұға) күндіз шығады. Күн жарық — көру жыртқыштарының уақыты (ақмарқа, көксерке).",
      precipitation: "Үзілістен кейінгі жылы жазғы жаңбыр — шабудың қуатты қозғаушысы. Қатты жаңбыр лай тудырып судак пен дөңмаңдайды басады.",
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
      spawn_closure: "Уылдырық шашу тыйымы — бұл түрді аулауға шектеу қойылған",
      overcast_favorable: "Бұлтты ауа-райы — жыртқыш күндіз аң аулайды",
      clear_sky_favorable: "Ашық аспан — көру жыртқыштарының уақыты",
      bright_sun_unfavorable: "Күн ашық — балық тереңге кетті",
      heavy_rain_turbidity: "Қатты жаңбыр — су лайланып судак пен дөңмаңдай тыныстайды",
      post_shower_window: "Жаңбырдан кейін — шайылған жем шабуды қоздырады",
      warm_wind: "Жылы О/Ш жел — классикалық шабу ауа-райы",
      cold_wind: "Суық С/СЗ жел — шабу басылған",
    },
    welcome: {
      title: "FishPulse-қа қош келдіңіз",
      subtitle: "Ашық балық аулау картасы · Әр балықшыға тегін",
      indexTitle: "Шабу индексі дегеніміз не?",
      indexDesc: "0-ден 100-ге дейінгі сан, қазір балықтың қаншалықты жақсы шабатынын көрсетеді. 7 фактордан есептеледі:",
      factors: [
        { icon: "🌡️", label: "Қысым", desc: "Атмосфералық қысым тренді · 27%" },
        { icon: "🌊", label: "Температура", desc: "Су температурасы · 18%" },
        { icon: "💨", label: "Жел", desc: "Жылдамдық және бағыт · 13%" },
        { icon: "🌅", label: "Тәулік уақыты", desc: "Түрге тәуелді режим · 13%" },
        { icon: "🌙", label: "Солунар", desc: "Ай мен күннің орны · 12%" },
        { icon: "☁️", label: "Бұлттылық", desc: "Жарық аң аулауға әсер етеді · 10%" },
        { icon: "🌧️", label: "Жауын", desc: "Жаңбыр / лай · 7%" },
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
    nowBiting: "Biting now",
    nowBitingEmpty: "Nothing actively biting right now",
    nextWindows: "Next windows",
    nextWindowsEmpty: "No active windows in the next 36h",
    inHours: "in {h}h",
    inHoursMinutes: "in {h}h {m}m",
    inMinutes: "in {m}m",
    tapToSelect: "Tap to see details",
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
      clouds: "Clouds",
      precipitation: "Precipitation",
    },
    factorTips: {
      solunar: "Moon and sun position. Fish are most active when the moon is directly overhead or underfoot — these 1-2 hour windows are peak bite time. Sunrise/sunset create minor periods.",
      pressure: "Fish sense pressure through their swim bladder. A rapid drop before a storm front is the strongest feeding trigger. Stable pressure = normal activity.",
      temperature: "Each species has an optimal water temperature range. Outside that range, metabolism slows and fish feed less frequently.",
      time_of_day: "Each species has its own diel rhythm: pike and zander are crepuscular, perch and asp are diurnal, catfish and burbot are nocturnal. The score reflects that.",
      wind: "Moderate wind 3–7 m/s with a southerly/easterly direction is best. A northerly wind off the cold steppe suppresses the bite.",
      clouds: "Overcast — ambush predators (pike, zander, perch) hunt openly through the day. Clear sun — time for sight predators (asp, ide).",
      precipitation: "A warm summer shower after a dry stretch is a powerful feeding trigger. Heavy rain stirs up sediment and shuts down zander and bream.",
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
      spawn_closure: "Spawning closure — fishing for this species is restricted",
      overcast_favorable: "Overcast — ambush predators hunt openly during the day",
      clear_sky_favorable: "Clear sky — prime time for sight predators",
      bright_sun_unfavorable: "Bright sun — fish are holding deep",
      heavy_rain_turbidity: "Heavy rain — water turning muddy, zander and bream shut down",
      post_shower_window: "Post-shower window — washed-in food triggers feeding",
      warm_wind: "Warm S/E wind — classic bite weather",
      cold_wind: "Cold N/NW wind — bite suppressed",
    },
    welcome: {
      title: "Welcome to FishPulse",
      subtitle: "Open fishing intelligence · Free for every angler",
      indexTitle: "What is the Bite Index?",
      indexDesc: "A score from 0 to 100 showing how well fish are biting right now. Calculated from 7 factors:",
      factors: [
        { icon: "🌡️", label: "Pressure", desc: "Atmospheric pressure trend · 27%" },
        { icon: "🌊", label: "Temperature", desc: "Water temperature · 18%" },
        { icon: "💨", label: "Wind", desc: "Speed and direction · 13%" },
        { icon: "🌅", label: "Time of day", desc: "Species-aware diel rhythm · 13%" },
        { icon: "🌙", label: "Solunar", desc: "Moon & sun position · 12%" },
        { icon: "☁️", label: "Clouds", desc: "Light regime drives hunting · 10%" },
        { icon: "🌧️", label: "Precip.", desc: "Rain trigger / turbidity · 7%" },
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
  nowBiting: string;
  nowBitingEmpty: string;
  nextWindows: string;
  nextWindowsEmpty: string;
  inHours: string;
  inHoursMinutes: string;
  inMinutes: string;
  tapToSelect: string;
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
