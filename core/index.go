package core

import (
	"fmt"
	"math"
	"strings"
	"time"
)

// Weights for each factor in the bite index formula.
const (
	weightSolunar     = 0.25
	weightPressure    = 0.30
	weightTemperature = 0.20
	weightTimeOfDay   = 0.15
	weightWind        = 0.10
)

// Calculate computes the Bite Index for a given location, time, weather snapshot, and species.
func Calculate(t time.Time, lat, lon float64, weather WeatherSnapshot, species Species) BiteResult {
	factors := BiteFactors{
		Solunar:     solunarScore(t, lat, lon),
		Pressure:    pressureScore(weather.PressureHPa, weather.PressureTrend),
		Temperature: temperatureScore(
			waterTempEstimate(weather.AirTempC),
			species.OptimalTempMin,
			species.OptimalTempMax,
		),
		TimeOfDay: timeOfDayScore(t, lat),
		Wind:      windScore(weather.WindSpeedMs),
	}

	raw := factors.Solunar*weightSolunar +
		factors.Pressure*weightPressure +
		factors.Temperature*weightTemperature +
		factors.TimeOfDay*weightTimeOfDay +
		factors.Wind*weightWind

	// Apply seasonal multiplier from species config
	multiplier := seasonalMultiplier(t, species)
	index := int(math.Round(math.Min(raw*multiplier, 100)))

	return BiteResult{
		Time:    t,
		Index:   index,
		Label:   indexLabel(index),
		Factors: factors,
		Reason:  buildReason(factors, weather),
	}
}

// timeOfDayScore returns a score based on proximity to sunrise/sunset.
func timeOfDayScore(t time.Time, lat float64) float64 {
	sunrise, sunset := sunriseSunset(t, lat)
	hour := float64(t.Hour()) + float64(t.Minute())/60.0

	distSunrise := math.Abs(hour - sunrise)
	distSunset := math.Abs(hour - sunset)
	dist := math.Min(distSunrise, distSunset)

	switch {
	case dist <= 0.5:
		return 100 // within 30 min of sunrise/sunset
	case dist <= 1.5:
		return 85
	case dist <= 3.0:
		return 65
	case dist <= 5.0:
		return 45
	default:
		return 25
	}
}

// windScore returns a score based on wind speed in m/s.
func windScore(ms float64) float64 {
	switch {
	case ms >= 3 && ms <= 7:
		return 90 // ideal: wind moves baitfish, predators follow
	case ms >= 1 && ms < 3:
		return 70
	case ms < 1:
		return 50 // dead calm: fish cautious, can still feed
	case ms > 7 && ms <= 12:
		return 45
	default:
		return 15 // storm conditions
	}
}

// seasonalMultiplier returns a species-specific seasonal adjustment.
func seasonalMultiplier(t time.Time, species Species) float64 {
	month := strings.ToLower(t.Month().String()[:3]) // "jan", "feb", etc.
	if m, ok := species.SeasonMultipliers[month]; ok {
		return m
	}
	return 1.0
}

// indexLabel converts a numeric index to a human-readable label.
func indexLabel(index int) string {
	switch {
	case index >= 80:
		return "Excellent"
	case index >= 60:
		return "Good"
	case index >= 40:
		return "Fair"
	default:
		return "Poor"
	}
}

// buildReason generates a plain-language explanation of the dominant factors.
func buildReason(f BiteFactors, w WeatherSnapshot) string {
	var parts []string

	if w.PressureTrend < -3 {
		parts = append(parts, "pressure dropping fast — fish feeding aggressively before the front")
	} else if w.PressureTrend < -1 {
		parts = append(parts, "pressure slowly falling — feeding picking up")
	} else if w.PressureTrend > 2 {
		parts = append(parts, "pressure rising after storm — fish recovering")
	} else {
		parts = append(parts, fmt.Sprintf("pressure stable at %.0f hPa", w.PressureHPa))
	}

	if f.Solunar >= 80 {
		parts = append(parts, "solunar major period active")
	} else if f.Solunar >= 60 {
		parts = append(parts, "solunar minor period")
	}

	if f.TimeOfDay >= 85 {
		parts = append(parts, "golden hour (sunrise/sunset)")
	}

	if f.Temperature < 40 {
		parts = append(parts, "water temperature outside optimal range")
	}

	if len(parts) == 0 {
		return "Average conditions"
	}
	return strings.Join(parts, "; ")
}
