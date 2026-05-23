package core

// waterTempEstimate derives an approximate water surface temperature from
// recent air temperature. Water temperature lags air temperature by several
// days, so we blend the 7-day rolling mean (which captures the lag) with the
// current air temperature (which captures short-term swings). The +2°C offset
// accounts for solar gain that warms water above the cool-air mean in summer
// and the freezing-point floor in winter.
func waterTempEstimate(w WeatherSnapshot) float64 {
	avg := w.RecentAvgAirTempC
	if avg == 0 && w.AirTempC != 0 {
		// Fallback when the rolling mean hasn't been populated.
		avg = w.AirTempC
	}
	return avg*0.75 + w.AirTempC*0.15 + 2.0
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
