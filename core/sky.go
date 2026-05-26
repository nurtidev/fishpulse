package core

// cloudScore returns a 0-100 score based on cloud cover and species preference.
//
// Most freshwater predators (pike, zander, perch) feed more actively on overcast
// days: scattered light reduces their visibility-shy behavior and lets them
// hunt openly. Visual surface predators (asp, ide) prefer bright sun for
// spotting baitfish. Carp/crucian don't care strongly about light, just temp.
func cloudScore(cloudPct float64, species Species) float64 {
	switch {
	case species.PrefersOvercast:
		switch {
		case cloudPct >= 70:
			return 95
		case cloudPct >= 40:
			return 80
		case cloudPct >= 20:
			return 55
		default:
			return 35 // clear sky = bad for ambush predators
		}
	case species.PrefersSun:
		switch {
		case cloudPct <= 20:
			return 95
		case cloudPct <= 50:
			return 80
		case cloudPct <= 80:
			return 55
		default:
			return 40
		}
	default:
		// Neutral: light-to-moderate cloud cover is usually best.
		switch {
		case cloudPct >= 40 && cloudPct <= 80:
			return 80
		case cloudPct < 40:
			return 65
		default:
			return 60 // very overcast — slight bias but neutral
		}
	}
}

// precipitationScore returns a 0-100 score based on current rainfall and the
// 6-hour rolling sum.
//
// Behavior modeled:
//   - Dry: neutral baseline.
//   - Light recent rain on warm water: positive — washes terrestrial food in,
//     oxygenates the surface layer, breaks light penetration. Big win for
//     cyprinids and the after-shower predator burst.
//   - Active light rain: slight positive (surface broken, fish less wary).
//   - Heavy rain or strong 6h accumulation: negative, scaled by species
//     turbidity sensitivity. Sight-feeders (zander, bream, asp) suffer most;
//     catfish, burbot and crucian are tolerant.
func precipitationScore(currentMM, recent6hMM, waterTempC float64, species Species) float64 {
	turb := species.TurbiditySensitivity
	if turb == 0 {
		turb = 1.0
	}

	// Dry: neutral.
	if recent6hMM < 0.5 && currentMM < 0.2 {
		return 65
	}

	// Recent light rain in warm water is a known feeding trigger.
	if recent6hMM >= 0.5 && recent6hMM < 5 && currentMM < 0.5 && waterTempC >= 12 {
		return 85
	}

	// Active light rain — slight bonus.
	if currentMM > 0 && currentMM < 1.5 {
		return 75
	}

	// Moderate rain.
	if currentMM >= 1.5 && currentMM < 5 {
		base := 55.0
		return base - 10*(turb-1.0)
	}

	// Heavy rain or strong recent accumulation: turbidity hits.
	if currentMM >= 5 || recent6hMM >= 15 {
		base := 35.0
		score := base - 15*(turb-1.0)
		if score < 10 {
			score = 10
		}
		return score
	}

	return 60
}
