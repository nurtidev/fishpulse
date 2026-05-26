package core

import "time"

// HabitatZone is a named bounding box where a species is commonly found.
type HabitatZone struct {
	Name   string  `json:"name"`
	NameRU string  `json:"name_ru"`
	LatMin float64 `json:"lat_min"`
	LatMax float64 `json:"lat_max"`
	LonMin float64 `json:"lon_min"`
	LonMax float64 `json:"lon_max"`
}

// SpawnBiological describes the species' biological spawning window — used to
// produce an activity dip during the spawn itself and a post-spawn feeding burst
// after it. Dates are "MM-DD" so they apply regardless of year.
type SpawnBiological struct {
	Start              string `json:"start"`                 // "04-05"
	End                string `json:"end"`                   // "04-25"
	PostSpawnBonusDays int    `json:"post_spawn_bonus_days"` // length of the post-nerestovy zhor window
}

// Species represents a fish species configuration.
type Species struct {
	Name                string             `json:"name"`
	OptimalTempMin      float64            `json:"optimal_temp_min"`
	OptimalTempMax      float64            `json:"optimal_temp_max"`
	OptimalPressureMin  float64            `json:"optimal_pressure_min"`
	OptimalPressureMax  float64            `json:"optimal_pressure_max"`
	PressureSensitivity float64            `json:"pressure_sensitivity"` // 0.5=low, 1.0=normal, 1.5=high
	PrefersLowPressure  bool               `json:"prefers_low_pressure"` // zander, catfish, burbot: high stable pressure is bad
	SeasonMultipliers   map[string]float64 `json:"season_multipliers"`   // "jan".."dec"
	SpawnClosureMonths  []string           `json:"spawn_closure_months"` // regulatory closure — species filtered out of "now" listing this month
	SpawnBiological     *SpawnBiological   `json:"spawn_biological"`     // biological spawning window for activity modeling (separate from regulatory)

	// Behavioral preferences used by per-factor scorers.
	TimeOfDayPreference  string  `json:"time_of_day_preference"` // "diurnal" | "crepuscular" | "nocturnal"
	PrefersOvercast      bool    `json:"prefers_overcast"`       // zander, perch, pike: cloudy day = bonus
	PrefersSun           bool    `json:"prefers_sun"`            // asp, ide: visual surface predators
	TurbiditySensitivity float64 `json:"turbidity_sensitivity"`  // 0.5=tolerates mud (catfish), 1.0=neutral, 1.4=mud-averse (zander, bream)
	WaterBodyAffinity    string  `json:"water_body_affinity"`    // "river" | "lake" | "reservoir" | "any"
}

// WeatherSnapshot holds the meteorological data for a single point in time.
type WeatherSnapshot struct {
	Time              time.Time
	PressureHPa       float64 // current pressure in hPa (MSL)
	PressureTrend     float64 // change in hPa over last 3 hours (negative = falling)
	AirTempC          float64 // air temperature in Celsius
	RecentAvgAirTempC float64 // rolling mean of air temp over the previous 7 days (proxy for water temp lag)
	WindSpeedMs       float64 // wind speed in m/s
	WindDirectionDeg  float64 // direction wind is FROM, 0=N, 90=E, 180=S, 270=W
	CloudCoverPct     float64 // 0-100
	PrecipitationMM   float64 // precipitation in the current hour, mm
	RecentPrecipMM    float64 // sum of precipitation over the previous 6 hours, mm
}

// BiteFactors holds the individual scores (0–100) for each factor.
type BiteFactors struct {
	Solunar       float64 `json:"solunar"`
	Pressure      float64 `json:"pressure"`
	Temperature   float64 `json:"temperature"`
	TimeOfDay     float64 `json:"time_of_day"`
	Wind          float64 `json:"wind"`
	Clouds        float64 `json:"clouds"`
	Precipitation float64 `json:"precipitation"`
}

// ReasonCode is a single structured reason with an optional numeric value.
// The frontend uses the Code for translation; Value is embedded into the message when needed.
type ReasonCode struct {
	Code  string  `json:"code"`
	Value float64 `json:"value,omitempty"`
}

// BiteResult is the output of a single bite index calculation.
type BiteResult struct {
	Time          time.Time    `json:"time"`
	Index         int          `json:"index"` // 0–100
	Label         string       `json:"label"` // "Poor", "Fair", "Good", "Excellent"
	Factors       BiteFactors  `json:"factors"`
	Reason        string       `json:"reason"`       // English fallback
	ReasonCodes   []ReasonCode `json:"reason_codes"` // structured codes for i18n
	SolunarPeriod string       `json:"solunar_period"` // "major", "minor", or ""
}

// SolunarWindow represents a single solunar activity period with start/end times.
type SolunarWindow struct {
	Type  string    `json:"type"`  // "major" or "minor"
	Start time.Time `json:"start"` // window start (UTC)
	End   time.Time `json:"end"`   // window end (UTC)
}

// ForecastResult holds a full forecast for a location and species.
type ForecastResult struct {
	Lat            float64         `json:"lat"`
	Lon            float64         `json:"lon"`
	LocalTZ        string          `json:"local_tz"`         // IANA timezone of the fishing spot, e.g. "Asia/Almaty"
	Species        string          `json:"species"`
	Current        BiteResult      `json:"current"`
	Forecast       []BiteResult    `json:"forecast"`         // hourly for 48h
	BestWindow     BiteResult      `json:"best_window"`      // peak in the next 48h
	DailyRating    int             `json:"daily_rating"`     // max index for today (like Garmin's day %)
	MoonPhasePct   float64         `json:"moon_phase_pct"`   // 0–100 moon phase quality score
	SolunarWindows []SolunarWindow `json:"solunar_windows"`  // today's major/minor periods with start/end times
	Advice         string          `json:"advice,omitempty"` // AI-generated fishing tip (empty if no API key)
}
