package core

// windScore returns a 0-100 score combining wind speed and direction.
//
// Speed: moderate (3-7 m/s) is optimal — pushes baitfish toward shore,
// breaks surface for cover; dead calm makes fish wary; gale (>12 m/s) blows
// them deep. Direction: in the Central Asian / Kazakhstan steppe, southern
// and easterly winds bring warm moist air and consistently coincide with
// active feeding. Northerly winds bring cold dry air and depress the bite —
// this is a strong empirical pattern in regional angling lore (e.g. the
// proverb "ветер с востока — клёв жестокий, ветер с севера — рыба не клюёт"),
// supported by frontal-passage thermal dynamics over open basins.
func windScore(speedMs, dirDegFrom float64) float64 {
	base := windSpeedBase(speedMs)
	score := base * windDirectionMultiplier(dirDegFrom)
	if score > 100 {
		score = 100
	}
	if score < 5 {
		score = 5
	}
	return score
}

// windSpeedBase returns the speed component (0-100) before directional adjustment.
func windSpeedBase(ms float64) float64 {
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

// windDirectionMultiplier returns a 0.8–1.15 multiplier applied to the speed
// component. dirDegFrom is the direction the wind is coming FROM
// (Open-Meteo convention): 0=N, 90=E, 180=S, 270=W.
func windDirectionMultiplier(degFrom float64) float64 {
	// Normalize into [0, 360).
	for degFrom < 0 {
		degFrom += 360
	}
	for degFrom >= 360 {
		degFrom -= 360
	}

	switch {
	case degFrom >= 90 && degFrom <= 180:
		// E → S: warm sector wind, the strongest "клёвный" range.
		return 1.15
	case degFrom > 180 && degFrom <= 225:
		// S → SW: still favorable.
		return 1.05
	case degFrom > 45 && degFrom < 90:
		// NE → E: neutral.
		return 1.00
	case degFrom > 225 && degFrom < 315:
		// SW → NW: slight cold-edge penalty.
		return 0.90
	default:
		// N sector (315–360 and 0–45): cold dry continental wind, bite drops.
		return 0.80
	}
}
