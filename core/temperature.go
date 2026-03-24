package core

// waterTempEstimate derives an approximate water surface temperature from current air temperature.
// Water temperature lags air temperature by several days; the 0.7 factor and +4°C offset
// model this lag as a first-order approximation.
// airTempC = current air temperature (2 m above ground) from the weather API.
// NOTE: a 7-day rolling average would improve accuracy — community can improve with local sensors.
func waterTempEstimate(airTempC float64) float64 {
	return airTempC*0.7 + 4.0
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
