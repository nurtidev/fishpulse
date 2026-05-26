package core

import (
	"fmt"
	"math"
	"strings"
	"time"
)

// Weights for each factor in the bite index formula. Sum must equal 1.0.
//
// Rebalance rationale vs. the original five-factor formula:
//   - Solunar lowered (0.25 → 0.12): empirical evidence for moon-transit periods
//     in freshwater is weak, see Reebs (2002). Kept as a tiebreaker, not a driver.
//   - Pressure lowered slightly (0.30 → 0.27): still the dominant single factor,
//     but room is needed for new meteorological inputs.
//   - Time-of-day lowered (0.15 → 0.13): now species-aware (nocturnal/diurnal/
//     crepuscular), so a smaller weight carries more signal per point.
//   - Wind lowered marginally (0.10 → 0.13): now includes direction, so the
//     factor is more informative — slight weight INCREASE despite re-budget.
//   - Clouds (new, 0.10): light regime drives ambush-predator activity (zander,
//     pike, perch) and surface-feeder activity (asp, ide).
//   - Precipitation (new, 0.07): captures the post-shower feeding burst in
//     summer and the turbidity hit on sight-feeders.
const (
	weightSolunar       = 0.12
	weightPressure      = 0.27
	weightTemperature   = 0.18
	weightTimeOfDay     = 0.13
	weightWind          = 0.13
	weightClouds        = 0.10
	weightPrecipitation = 0.07
)

// Calculate computes the Bite Index for a given location, time, weather snapshot, and species.
func Calculate(t time.Time, lat, lon float64, weather WeatherSnapshot, species Species) BiteResult {
	waterTemp := waterTempEstimate(weather, species)

	factors := BiteFactors{
		Solunar:       solunarScore(t, lat, lon),
		Pressure:      pressureScore(weather.PressureHPa, weather.PressureTrend, species),
		Temperature:   temperatureScore(waterTemp, species.OptimalTempMin, species.OptimalTempMax),
		TimeOfDay:     timeOfDayScore(t, lat, lon, species),
		Wind:          windScore(weather.WindSpeedMs, weather.WindDirectionDeg),
		Clouds:        cloudScore(weather.CloudCoverPct, species),
		Precipitation: precipitationScore(weather.PrecipitationMM, weather.RecentPrecipMM, waterTemp, species),
	}

	raw := factors.Solunar*weightSolunar +
		factors.Pressure*weightPressure +
		factors.Temperature*weightTemperature +
		factors.TimeOfDay*weightTimeOfDay +
		factors.Wind*weightWind +
		factors.Clouds*weightClouds +
		factors.Precipitation*weightPrecipitation

	multiplier := seasonalMultiplier(t, lat, species)
	index := int(math.Round(math.Min(raw*multiplier, 100)))

	period := SolunarPeriodType(t, lat, lon)
	codes := buildReasonCodes(factors, weather, waterTemp, period, t, species)

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

// timeOfDayScore returns a score 0-100 based on local solar time, modulated by
// the species' diel preference.
//   - "crepuscular" (pike, zander, carp, tench, crucian): sharp peak near
//     sunrise/sunset, the original behavior.
//   - "diurnal" (perch, asp, ide, roach): broader plateau through daylight,
//     drop-off at night.
//   - "nocturnal" (catfish, burbot, bream): inverted — night high, day low.
//   - Default (unset): same as crepuscular for backward compatibility.
func timeOfDayScore(t time.Time, lat, lon float64, species Species) float64 {
	lt := solarLocalTime(t, lon)
	sunrise, sunset := sunriseSunset(lt, lat)
	hour := float64(lt.Hour()) + float64(lt.Minute())/60.0

	distSunrise := math.Abs(hour - sunrise)
	distSunset := math.Abs(hour - sunset)
	distGolden := math.Min(distSunrise, distSunset)
	isDay := hour >= sunrise && hour <= sunset

	switch species.TimeOfDayPreference {
	case "nocturnal":
		switch {
		case !isDay && distGolden > 1.5:
			return 90 // deep night
		case distGolden <= 1.5:
			return 70 // dawn/dusk transition
		case isDay && distGolden > 4:
			return 25 // bright midday
		default:
			return 45
		}
	case "diurnal":
		switch {
		case distGolden <= 1.0:
			return 90 // golden hour, still excellent
		case isDay:
			return 75 // any time during the day
		case distGolden <= 2.0:
			return 55 // shoulder
		default:
			return 25 // night
		}
	default: // "crepuscular" or unset
		switch {
		case distGolden <= 0.5:
			return 100
		case distGolden <= 1.5:
			return 85
		case distGolden <= 3.0:
			return 65
		case distGolden <= 5.0:
			return 45
		default:
			return 25
		}
	}
}

// seasonalMultiplier returns a species-specific seasonal adjustment, with a
// latitude-aware phase shift for southern Kazakhstan: spring activity starts
// roughly 2-3 weeks earlier in Almaty/Shymkent than in Astana/Petropavlovsk,
// and autumn extends correspondingly later.
//
// Each month's value is anchored at day 15 of that month; values between
// anchors are linearly interpolated. The latitude shift slides the calendar
// pointer forward (south = earlier in the season for the same date), then the
// same interpolation runs against the species' canonical (northern KZ) curve.
func seasonalMultiplier(t time.Time, lat float64, species Species) float64 {
	base := interpolatedSeasonValue(t, latShiftDays(lat), species)
	bio := biologicalSpawnAdjustment(t, species)
	return base * bio
}

// latShiftDays returns the number of calendar days to slide forward when reading
// the seasonal curve, based on latitude. The canonical curves in species JSON
// are calibrated for ~51°N (Northern Kazakhstan, Astana belt).
func latShiftDays(lat float64) float64 {
	switch {
	case lat >= 50:
		return 0
	case lat >= 47:
		return 7
	case lat >= 43:
		return 14
	default:
		return 21
	}
}

// interpolatedSeasonValue reads the species' seasonal multiplier with a forward
// day shift. shiftDays > 0 means "treat this date as if it were N days later in
// the season" — used to compress the northern-KZ calibration onto southern
// latitudes where spring starts earlier and winter releases sooner.
func interpolatedSeasonValue(t time.Time, shiftDays float64, species Species) float64 {
	if len(species.SeasonMultipliers) == 0 {
		return 1.0
	}
	shifted := t.Add(time.Duration(shiftDays) * 24 * time.Hour)
	months := [12]string{"jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"}
	get := func(idx int) float64 {
		idx = ((idx % 12) + 12) % 12
		if v, ok := species.SeasonMultipliers[months[idx]]; ok {
			return v
		}
		return 1.0
	}

	monthIdx := int(shifted.Month()) - 1
	day := shifted.Day()
	daysInMonth := time.Date(shifted.Year(), shifted.Month()+1, 0, 0, 0, 0, 0, shifted.Location()).Day()

	if day == 15 {
		return get(monthIdx)
	}

	var leftIdx int
	var w float64
	if day < 15 {
		// Between mid of previous month and mid of current month (≈30 days apart).
		leftIdx = monthIdx - 1
		w = (float64(day) + 15.0) / 30.0
	} else {
		// Between mid of current month and mid of next month.
		leftIdx = monthIdx
		span := float64(daysInMonth) - 15.0 + 15.0
		w = (float64(day) - 15.0) / span
	}
	return get(leftIdx)*(1.0-w) + get(leftIdx+1)*w
}

// biologicalSpawnAdjustment returns a multiplier modeling the biological
// spawning behavior:
//   - During the spawn window: activity drops to ~0.4 (fish on the spawn, not
//     feeding). This is BIOLOGICAL — independent of regulatory closures.
//   - For PostSpawnBonusDays after the window: 1.35 bump for the post-nerestovy
//     zhor (recovery feeding burst).
//   - Otherwise: 1.0 (no adjustment).
func biologicalSpawnAdjustment(t time.Time, species Species) float64 {
	sb := species.SpawnBiological
	if sb == nil || sb.Start == "" || sb.End == "" {
		return 1.0
	}
	year := t.Year()
	start, err1 := parseMonthDay(sb.Start, year)
	end, err2 := parseMonthDay(sb.End, year)
	if err1 != nil || err2 != nil {
		return 1.0
	}
	if t.Before(start) || t.After(end.Add(time.Duration(sb.PostSpawnBonusDays)*24*time.Hour)) {
		return 1.0
	}
	if !t.Before(start) && !t.After(end) {
		return 0.4 // during the spawn itself
	}
	// Post-spawn bonus window.
	if sb.PostSpawnBonusDays > 0 {
		return 1.35
	}
	return 1.0
}

// parseMonthDay parses a "MM-DD" string into a UTC time at midnight of the given year.
func parseMonthDay(md string, year int) (time.Time, error) {
	parts := strings.Split(md, "-")
	if len(parts) != 2 {
		return time.Time{}, fmt.Errorf("invalid MM-DD: %q", md)
	}
	var m, d int
	if _, err := fmt.Sscanf(parts[0], "%d", &m); err != nil {
		return time.Time{}, err
	}
	if _, err := fmt.Sscanf(parts[1], "%d", &d); err != nil {
		return time.Time{}, err
	}
	return time.Date(year, time.Month(m), d, 0, 0, 0, 0, time.UTC), nil
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
func buildReasonCodes(f BiteFactors, w WeatherSnapshot, waterTempC float64, period string, t time.Time, species Species) []ReasonCode {
	var codes []ReasonCode

	if isSpawnClosure(t, species) {
		codes = append(codes, ReasonCode{Code: "spawn_closure"})
	}

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

	// Cloud cover — only emit if it materially helps or hurts this species.
	switch {
	case species.PrefersOvercast && w.CloudCoverPct >= 60:
		codes = append(codes, ReasonCode{Code: "overcast_favorable"})
	case species.PrefersSun && w.CloudCoverPct <= 25:
		codes = append(codes, ReasonCode{Code: "clear_sky_favorable"})
	case species.PrefersOvercast && w.CloudCoverPct <= 20:
		codes = append(codes, ReasonCode{Code: "bright_sun_unfavorable"})
	}

	// Precipitation reason codes.
	switch {
	case w.PrecipitationMM >= 5 || w.RecentPrecipMM >= 15:
		codes = append(codes, ReasonCode{Code: "heavy_rain_turbidity"})
	case w.RecentPrecipMM >= 0.5 && w.PrecipitationMM < 0.5 && waterTempC >= 12:
		codes = append(codes, ReasonCode{Code: "post_shower_window"})
	}

	// Wind direction reason codes — only when it's a notable signal.
	if w.WindSpeedMs >= 2 {
		switch {
		case w.WindDirectionDeg >= 90 && w.WindDirectionDeg <= 180:
			codes = append(codes, ReasonCode{Code: "warm_wind"})
		case w.WindDirectionDeg >= 315 || w.WindDirectionDeg <= 45:
			codes = append(codes, ReasonCode{Code: "cold_wind"})
		}
	}

	if len(codes) == 0 {
		codes = append(codes, ReasonCode{Code: "average_conditions"})
	}

	return codes
}

// isSpawnClosure returns true if t falls in a month where the species is under
// regulatory spawning closure (no-fishing period).
func isSpawnClosure(t time.Time, species Species) bool {
	if len(species.SpawnClosureMonths) == 0 {
		return false
	}
	month := strings.ToLower(t.Month().String()[:3])
	for _, m := range species.SpawnClosureMonths {
		if strings.ToLower(m) == month {
			return true
		}
	}
	return false
}

// reasonCodesToEnglish builds an English fallback string from reason codes.
func reasonCodesToEnglish(codes []ReasonCode, pressureHPa float64) string {
	msgs := map[string]string{
		"pressure_drop_fast":     "pressure dropping fast — fish feeding aggressively before the front",
		"pressure_drop_slow":     "pressure slowly falling — feeding picking up",
		"pressure_rising":        "pressure rising after storm — fish recovering",
		"solunar_major":          "solunar major period active",
		"solunar_minor":          "solunar minor period",
		"golden_hour":            "golden hour (sunrise/sunset)",
		"temp_suboptimal":        "water temperature outside optimal range",
		"average_conditions":     "average conditions",
		"spawn_closure":          "spawning closure period — fishing for this species is restricted",
		"overcast_favorable":     "overcast sky — favorable for ambush predators",
		"clear_sky_favorable":    "clear sky — favorable for sight predators",
		"bright_sun_unfavorable": "bright sun — fish hold deep, midday is slow",
		"heavy_rain_turbidity":   "heavy rain — water turning muddy, sight feeders shut down",
		"post_shower_window":     "post-shower window — washed-in food triggers feeding",
		"warm_wind":              "warm S/E wind — classic bite weather",
		"cold_wind":              "cold N/NW wind — bite suppressed",
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
