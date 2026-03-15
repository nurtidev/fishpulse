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
		TimeOfDay: timeOfDayScore(t, lat, lon),
		Wind:      windScore(weather.WindSpeedMs),
	}

	raw := factors.Solunar*weightSolunar +
		factors.Pressure*weightPressure +
		factors.Temperature*weightTemperature +
		factors.TimeOfDay*weightTimeOfDay +
		factors.Wind*weightWind

	multiplier := seasonalMultiplier(t, species)
	index := int(math.Round(math.Min(raw*multiplier, 100)))

	period := SolunarPeriodType(t, lat, lon)
	codes := buildReasonCodes(factors, weather, period)

	return BiteResult{
		Time:          t,
		Index:         index,
		Label:         indexLabel(index),
		Factors:       factors,
		Reason:        reasonCodesToEnglish(codes, weather.PressureHPa),
		ReasonCodes:   codes,
		SolunarPeriod: period,
	}
}

// timeOfDayScore returns a score based on proximity to sunrise/sunset,
// corrected to local solar time using longitude.
func timeOfDayScore(t time.Time, lat, lon float64) float64 {
	lt := solarLocalTime(t, lon)
	sunrise, sunset := sunriseSunset(lt, lat)
	hour := float64(lt.Hour()) + float64(lt.Minute())/60.0

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
		return 90
	case ms >= 1 && ms < 3:
		return 70
	case ms < 1:
		return 50
	case ms > 7 && ms <= 12:
		return 45
	default:
		return 15
	}
}

// seasonalMultiplier returns a species-specific seasonal adjustment.
func seasonalMultiplier(t time.Time, species Species) float64 {
	month := strings.ToLower(t.Month().String()[:3])
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

// buildReasonCodes returns structured reason codes for i18n on the frontend.
func buildReasonCodes(f BiteFactors, w WeatherSnapshot, period string) []ReasonCode {
	var codes []ReasonCode

	switch {
	case w.PressureTrend < -3:
		codes = append(codes, ReasonCode{Code: "pressure_drop_fast"})
	case w.PressureTrend < -1:
		codes = append(codes, ReasonCode{Code: "pressure_drop_slow"})
	case w.PressureTrend > 2:
		codes = append(codes, ReasonCode{Code: "pressure_rising"})
	default:
		codes = append(codes, ReasonCode{Code: "pressure_stable", Value: w.PressureHPa})
	}

	switch period {
	case "major":
		codes = append(codes, ReasonCode{Code: "solunar_major"})
	case "minor":
		codes = append(codes, ReasonCode{Code: "solunar_minor"})
	default:
		if f.Solunar >= 70 {
			codes = append(codes, ReasonCode{Code: "solunar_minor"})
		}
	}

	if f.TimeOfDay >= 85 {
		codes = append(codes, ReasonCode{Code: "golden_hour"})
	}

	if f.Temperature < 40 {
		codes = append(codes, ReasonCode{Code: "temp_suboptimal"})
	}

	if len(codes) == 0 {
		codes = append(codes, ReasonCode{Code: "average_conditions"})
	}

	return codes
}

// reasonCodesToEnglish builds an English fallback string from reason codes.
func reasonCodesToEnglish(codes []ReasonCode, pressureHPa float64) string {
	msgs := map[string]string{
		"pressure_drop_fast": "pressure dropping fast — fish feeding aggressively before the front",
		"pressure_drop_slow": "pressure slowly falling — feeding picking up",
		"pressure_rising":    "pressure rising after storm — fish recovering",
		"solunar_major":      "solunar major period active",
		"solunar_minor":      "solunar minor period",
		"golden_hour":        "golden hour (sunrise/sunset)",
		"temp_suboptimal":    "water temperature outside optimal range",
		"average_conditions": "average conditions",
	}

	var parts []string
	for _, c := range codes {
		if c.Code == "pressure_stable" {
			parts = append(parts, fmt.Sprintf("pressure stable at %.0f hPa", pressureHPa))
			continue
		}
		if msg, ok := msgs[c.Code]; ok {
			parts = append(parts, msg)
		}
	}
	return strings.Join(parts, "; ")
}
