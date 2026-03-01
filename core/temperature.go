package core

// waterTempEstimate derives an approximate water surface temperature from air temperature.
// Water temperature lags air temperature by several days, so we use a smoothed estimate.
// avgAirTemp7d = average air temperature over the last 7 days.
func waterTempEstimate(avgAirTemp7d float64) float64 {
	// Simple linear model: water temp ≈ air temp with a lag damping factor.
	// In spring/summer water is cooler than air; in autumn it's warmer.
	// This is a first-order approximation — community can improve with local sensors.
	return avgAirTemp7d*0.7 + 4.0
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
