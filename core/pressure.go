package core

// pressureScore returns a score 0–100 based on current pressure, its 3-hour trend,
// and species-specific pressure preferences.
//
// Key insight: fish sense pressure through their swim bladder.
// A falling pressure front triggers aggressive feeding before the storm.
// After a rapid drop, fish go inactive until pressure stabilises.
// Different species have different optimal pressure ranges and sensitivity levels.
func pressureScore(pressureHPa, trendHPa float64, species Species) float64 {
	base := speciesPressureScore(pressureHPa, species.OptimalPressureMin, species.OptimalPressureMax)
	modifier := speciesTrendModifier(trendHPa, species.PressureSensitivity)
	score := base * modifier
	if score > 100 {
		score = 100
	}
	if score < 5 {
		score = 5
	}
	return score
}

// speciesPressureScore scores how well the current pressure suits the species.
// Inside the optimal range = high score; penalty grows with distance from range.
func speciesPressureScore(hPa, optMin, optMax float64) float64 {
	// Fallback to generic scoring when species has no pressure profile set.
	if optMin == 0 && optMax == 0 {
		return genericBasePressureScore(hPa)
	}

	if hPa >= optMin && hPa <= optMax {
		return 85
	}

	// Below optimal range (low pressure — bad for most species).
	if hPa < optMin {
		diff := optMin - hPa
		switch {
		case diff <= 5:
			return 70
		case diff <= 15:
			return 50
		case diff <= 25:
			return 30
		default:
			return 15
		}
	}

	// Above optimal range (very high pressure).
	diff := hPa - optMax
	switch {
	case diff <= 5:
		return 75
	case diff <= 15:
		return 60
	default:
		return 45
	}
}

// speciesTrendModifier adjusts the base score based on the pressure trend and
// how sensitive the species is to pressure changes.
// sensitivity > 1.0 amplifies the effect; sensitivity < 1.0 dampens it.
func speciesTrendModifier(trendHPa, sensitivity float64) float64 {
	var raw float64
	switch {
	case trendHPa < -4:
		// Rapid drop — fish feed aggressively RIGHT NOW, before the front hits.
		raw = 1.5
	case trendHPa < -2:
		// Slow falling — feeding picks up.
		raw = 1.2
	case trendHPa >= -1 && trendHPa <= 1:
		// Stable — normal feeding behaviour.
		raw = 1.0
	case trendHPa > 2:
		// Rising after storm — fish slowly returning to normal.
		raw = 0.85
	default:
		raw = 0.9
	}

	// Amplify (or dampen) the deviation from neutral based on species sensitivity.
	// sensitivity=1.0 → no change; sensitivity=1.3 → stronger effect; sensitivity=0.6 → weaker effect.
	return 1.0 + (raw-1.0)*sensitivity
}

// genericBasePressureScore is the original species-agnostic fallback.
func genericBasePressureScore(hPa float64) float64 {
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
