package core

// Hint provides a short, template-based lure/tactic suggestion for a species
// in the user's language. Unlike GenerateAdvice, this does not call an LLM —
// it's cheap enough to compute for all species in one request.

type hintTemplate struct {
	base map[string]string // lang -> base tip ("what & how")
}

var speciesHints = map[string]hintTemplate{
	"pike": {
		base: map[string]string{
			"ru": "Джеркбейт или крупная колебалка по бровке у камыша.",
			"kz": "Қамыс жанындағы шетте джеркбейт немесе ірі қалақша.",
			"en": "Jerkbait or large spoon along weed edges.",
		},
	},
	"perch": {
		base: map[string]string{
			"ru": "Вертикальная джига 5–7 г или микро-силикон у бровки.",
			"kz": "Шетте 5–7 г тік джиг немесе микро-силикон.",
			"en": "Vertical 5–7 g jig or micro-soft-plastics on the drop-off.",
		},
	},
	"zander": {
		base: map[string]string{
			"ru": "Джиг 14–20 г ступенькой по руслу, в сумерках — поролон.",
			"kz": "Арнамен 14–20 г сатылы джиг, ымыртта — поролон.",
			"en": "14–20 g jig hopping along the channel; poro foam at dusk.",
		},
	},
	"bream": {
		base: map[string]string{
			"ru": "Фидер с мотылём/опарышем, прикормка с кориандром на яме.",
			"kz": "Фидер мотыль/опарышпен, шұңқырда кориандрлы жем.",
			"en": "Feeder with bloodworm/maggot; sweet groundbait on a hole.",
		},
	},
	"carp": {
		base: map[string]string{
			"ru": "Бойлы или кукуруза на волосяной оснастке, прикормка с мелассой.",
			"kz": "Бойлы немесе жүгері шаш такелажында, меласса жемі.",
			"en": "Boilies or sweetcorn on a hair rig; molasses groundbait.",
		},
	},
	"sazan": {
		base: map[string]string{
			"ru": "Донка с кукурузой или горохом на струе у ям, прикормка с жмыхом.",
			"kz": "Шұңқыр маңындағы ағыста жүгері/бұршақпен донка, жмыхты жем.",
			"en": "Bottom rig with corn or pea on the current near deep holes; oilcake bait.",
		},
	},
	"crucian_carp": {
		base: map[string]string{
			"ru": "Поплавок, мотыль или тесто, прикормка с жмыхом у травы.",
			"kz": "Қалтқы, мотыль немесе қамыр, шөп жанындағы жем.",
			"en": "Float rig with bloodworm or dough; oilcake bait near weeds.",
		},
	},
	"roach": {
		base: map[string]string{
			"ru": "Поплавок 1–2 г, опарыш или перловка, лёгкая прикормка.",
			"kz": "1–2 г қалтқы, опарыш немесе перловка, жеңіл жем.",
			"en": "1–2 g float rig with maggot or pearl barley; light groundbait.",
		},
	},
	"tench": {
		base: map[string]string{
			"ru": "Донка с червём или кукурузой у кувшинок на рассвете.",
			"kz": "Таңертең құрбақа өсімдігі жанында құрт немесе жүгерімен донка.",
			"en": "Bottom rig with worm or corn near lily pads at dawn.",
		},
	},
	"catfish": {
		base: map[string]string{
			"ru": "Квок или донка с живцом/лягушкой на яме, после заката.",
			"kz": "Күн батқан соң шұңқырда квок немесе тірі жем/бақамен донка.",
			"en": "Clonk or bottom rig with livebait/frog on a deep hole after sunset.",
		},
	},
	"burbot": {
		base: map[string]string{
			"ru": "Донка с пучком червей или живцом, ночью на галечном дне.",
			"kz": "Түнде малтатасты түпте құрт байламы немесе тірі жеммен донка.",
			"en": "Bottom rig with worm bunch or livebait on gravel — night only.",
		},
	},
	"asp": {
		base: map[string]string{
			"ru": "Кастмастер или попер по бою, дальний заброс на струе.",
			"kz": "Ағыста алыс лақтыру: кастмастер немесе поппер.",
			"en": "Kastmaster or popper into surface boils; long casts on the current.",
		},
	},
	"ide": {
		base: map[string]string{
			"ru": "Лёгкий спиннинг с вертушкой №1–2 или нахлыст у переката.",
			"kz": "Жеңіл спиннинг №1–2 айналмалысымен немесе ағыстағы нахлыст.",
			"en": "Light spinning with #1–2 inline spinner or fly near a riffle.",
		},
	},
}

// BuildHint returns a short, localized hint for a species. If condition flags
// suggest a strong feeding trigger (pressure drop, solunar major, golden hour),
// a short prefix is added to the base tip.
func BuildHint(speciesKey string, lang string, result BiteResult) string {
	tpl, ok := speciesHints[speciesKey]
	if !ok {
		return ""
	}
	base := tpl.base[lang]
	if base == "" {
		base = tpl.base["en"]
	}
	prefix := conditionPrefix(lang, result)
	if prefix != "" {
		return prefix + " " + base
	}
	return base
}

// conditionPrefix returns a short situational prefix derived from reason codes
// and solunar period. Returns "" if no strong signal.
func conditionPrefix(lang string, r BiteResult) string {
	// priority: major > pressure drop fast > golden hour > minor
	if r.SolunarPeriod == "major" {
		return prefixByLang(lang, "major")
	}
	for _, c := range r.ReasonCodes {
		if c.Code == "pressure_drop_fast" {
			return prefixByLang(lang, "pressure_drop_fast")
		}
	}
	if r.Factors.TimeOfDay >= 85 {
		return prefixByLang(lang, "golden_hour")
	}
	if r.SolunarPeriod == "minor" {
		return prefixByLang(lang, "minor")
	}
	return ""
}

func prefixByLang(lang, key string) string {
	prefixes := map[string]map[string]string{
		"major": {
			"ru": "🌕 Активный солунарный пик —",
			"kz": "🌕 Белсенді солунар шыңы —",
			"en": "🌕 Active solunar major —",
		},
		"minor": {
			"ru": "🌙 Малый солунар —",
			"kz": "🌙 Кіші солунар —",
			"en": "🌙 Solunar minor —",
		},
		"pressure_drop_fast": {
			"ru": "⛈️ Давление падает —",
			"kz": "⛈️ Қысым түсуде —",
			"en": "⛈️ Pressure dropping —",
		},
		"golden_hour": {
			"ru": "🌅 Золотой час —",
			"kz": "🌅 Алтын сағат —",
			"en": "🌅 Golden hour —",
		},
	}
	if p, ok := prefixes[key]; ok {
		if s := p[lang]; s != "" {
			return s
		}
		return p["en"]
	}
	return ""
}
