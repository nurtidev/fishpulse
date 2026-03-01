package core

// pressureScore returns a score 0–100 based on current pressure and its 3-hour trend.
//
// Key insight: fish sense pressure through their swim bladder.
// A falling pressure front triggers aggressive feeding before the storm.
// After a rapid drop, fish go inactive until pressure stabilizes.
func pressureScore(pressureHPa, trendHPa float64) float64 {
	base := basePressureScore(pressureHPa)
	modifier := trendModifier(trendHPa)
	score := base * modifier
	if score > 100 {
		score = 100
	}
	if score < 5 {
		score = 5
	}
	return score
}

// basePressureScore scores the absolute pressure value.
// High stable pressure = good. Very low pressure = poor.
func basePressureScore(hPa float64) float64 {
	switch {
	case hPa >= 1025:
		return 80
	case hPa >= 1015:
		return 75
	case hPa >= 1005:
		return 55
	case hPa >= 995:
		return 35
	default:
		return 20
	}
}

// trendModifier adjusts the base score based on how pressure is changing.
// trendHPa = change over the last 3 hours (negative = falling).
func trendModifier(trendHPa float64) float64 {
	switch {
	case trendHPa < -4:
		// Rapid drop — fish feed aggressively RIGHT NOW, before the front hits.
		return 1.5
	case trendHPa < -2:
		// Slow falling — feeding picks up.
		return 1.2
	case trendHPa >= -1 && trendHPa <= 1:
		// Stable — normal feeding behaviour.
		return 1.0
	case trendHPa > 2:
		// Rising after storm — fish slowly returning to normal.
		return 0.85
	default:
		return 0.9
	}
}
