package core

import "time"

// Species represents a fish species configuration.
type Species struct {
	Name              string             `json:"name"`
	OptimalTempMin    float64            `json:"optimal_temp_min"`
	OptimalTempMax    float64            `json:"optimal_temp_max"`
	SeasonMultipliers map[string]float64 `json:"season_multipliers"` // "jan".."dec"
}

// WeatherSnapshot holds the meteorological data for a single point in time.
type WeatherSnapshot struct {
	Time            time.Time
	PressureHPa     float64 // current pressure in hPa
	PressureTrend   float64 // change in hPa over last 3 hours (negative = falling)
	AirTempC        float64 // air temperature in Celsius
	WindSpeedMs     float64 // wind speed in m/s
}

// BiteFactors holds the individual scores (0–100) for each factor.
type BiteFactors struct {
	Solunar     float64 `json:"solunar"`
	Pressure    float64 `json:"pressure"`
	Temperature float64 `json:"temperature"`
	TimeOfDay   float64 `json:"time_of_day"`
	Wind        float64 `json:"wind"`
}

// BiteResult is the output of a single bite index calculation.
type BiteResult struct {
	Time    time.Time   `json:"time"`
	Index   int         `json:"index"` // 0–100
	Label   string      `json:"label"` // "Poor", "Fair", "Good", "Excellent"
	Factors BiteFactors `json:"factors"`
	Reason  string      `json:"reason"`
}

// ForecastResult holds a full forecast for a location and species.
type ForecastResult struct {
	Lat        float64      `json:"lat"`
	Lon        float64      `json:"lon"`
	Species    string       `json:"species"`
	Current    BiteResult   `json:"current"`
	Forecast   []BiteResult `json:"forecast"`    // hourly for 48h
	BestWindow BiteResult   `json:"best_window"` // peak in the next 48h
}
