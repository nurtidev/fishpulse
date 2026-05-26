package core

// waterTempEstimate derives an approximate water surface temperature from
// recent air temperature. Water temperature lags air temperature by several
// days; the lag is shorter on rivers (high flow → low thermal inertia) and
// longer on large reservoirs and deep lakes.
//
// The species' WaterBodyAffinity is used as a proxy for the type of water the
// user is most likely fishing — rivers respond fastest to current air temp,
// reservoirs respond slowest. For "any" or unset affinity, a balanced blend
// is used.
//
// Weights sum to 1.0 (the previous formula summed to 0.9 with a +2°C offset,
// which under-represented current air temp and biased the estimate upward).
// A floor at 1°C reflects the fact that we model open water — true winter
// freeze-over fishing should be handled by a separate ice-fishing branch.
func waterTempEstimate(w WeatherSnapshot, species Species) float64 {
	avg := w.RecentAvgAirTempC
	if avg == 0 && w.AirTempC != 0 {
		// Fallback when the rolling mean hasn't been populated.
		avg = w.AirTempC
	}

	// Default balanced blend.
	avgW, curW := 0.70, 0.30

	switch species.WaterBodyAffinity {
	case "river":
		// Rivers have low thermal inertia — surface temp tracks current air temp closely.
		avgW, curW = 0.55, 0.45
	case "lake":
		// Lakes (especially shallow steppe lakes) have moderate inertia but a strong
		// solar gain in summer; rely more on the rolling mean.
		avgW, curW = 0.78, 0.22
	case "reservoir":
		// Large reservoirs (Kapchagai, Bukhtarma, Balkhash) have multi-week inertia.
		avgW, curW = 0.82, 0.18
	}

	est := avg*avgW + w.AirTempC*curW
	if est < 1.0 {
		return 1.0
	}
	return est
}

// temperatureScore returns a score 0–100 for a given water temperature and species.
// Each species has an optimal temperature range defined in its config.
func temperatureScore(waterTempC, optimalMin, optimalMax float64) float64 {
	switch {
	case waterTempC >= optimalMin && waterTempC <= optimalMax:
		// Inside optimal range — full score.
		return 100

	case waterTempC >= optimalMin-4 && waterTempC < optimalMin:
		// Just below optimal — linear decay to 40.
		ratio := (waterTempC - (optimalMin - 4)) / 4.0
		return 40 + ratio*60

	case waterTempC > optimalMax && waterTempC <= optimalMax+4:
		// Just above optimal — linear decay to 40.
		ratio := (optimalMax + 4 - waterTempC) / 4.0
		return 40 + ratio*60

	case waterTempC < optimalMin-4 && waterTempC >= optimalMin-8:
		// Cold — score 15–40.
		ratio := (waterTempC - (optimalMin - 8)) / 4.0
		return 15 + ratio*25

	case waterTempC > optimalMax+4 && waterTempC <= optimalMax+8:
		// Hot — score 15–40.
		ratio := (optimalMax + 8 - waterTempC) / 4.0
		return 15 + ratio*25

	default:
		// Extreme cold or heat — minimal activity.
		return 10
	}
}
