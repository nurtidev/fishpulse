package core

import (
	"math"
	"time"
)

// solunarScore returns a score 0–100 based on moon and sun position at the given time/location.
// Major periods (moon overhead/underfoot) score highest.
// Minor periods (moonrise/moonset, sunrise/sunset) score next.
func solunarScore(t time.Time, lat, lon float64) float64 {
	moonAngle := moonTransitProximity(t, lat, lon)

	// Moon contribution: major period within ±1h of transit = 100, fades to 30 at 6h
	moonScore := transitScore(moonAngle)

	// Sun contribution: sunrise/sunset within ±1h = 80, fades
	sunScore := sunriseScore(t, lat) * 0.8

	// Take the best of the two, with a floor of 30
	best := math.Max(moonScore, sunScore)
	if best < 30 {
		best = 30
	}
	return best
}

// transitScore converts proximity (0 = exact transit, Pi = opposite) to a 0–100 score.
// Two peaks per day: moon overhead (0) and moon underfoot (Pi).
func transitScore(angle float64) float64 {
	// Normalize to distance from nearest transit (overhead or underfoot)
	dist := angle
	if dist > math.Pi {
		dist = 2*math.Pi - dist
	}
	// dist is now 0 (at transit) to Pi (halfway between transits)
	// Score 100 at 0, decays to 20 at Pi
	score := 100 * math.Exp(-3.0*(dist/math.Pi))
	if score < 20 {
		score = 20
	}
	return score
}

// moonTransitProximity returns the angular distance (radians) of the moon
// from its nearest transit (overhead or underfoot) using a simple approximation.
func moonTransitProximity(t time.Time, lat, lon float64) float64 {
	// Moon completes one sidereal cycle in ~24.84 hours.
	// We use a simple model: moon transit repeats every 24h 50m.
	moonPeriodHours := 24.8412 // hours per lunar day
	// Reference new moon transit at Greenwich: 2000-01-06 18:14 UTC
	refTime := time.Date(2000, 1, 6, 18, 14, 0, 0, time.UTC)
	elapsed := t.Sub(refTime).Hours()

	// Fraction through current lunar day (0–1)
	fraction := math.Mod(elapsed/moonPeriodHours, 1.0)
	if fraction < 0 {
		fraction += 1.0
	}

	// Adjust for longitude (each degree = 1/360 of a day)
	lonOffset := lon / 360.0
	fraction = math.Mod(fraction+lonOffset, 1.0)

	// Convert to angle 0–2Pi
	angle := fraction * 2 * math.Pi
	return angle
}

// sunriseScore returns a 0–100 score based on proximity to sunrise or sunset.
func sunriseScore(t time.Time, lat float64) float64 {
	sunrise, sunset := sunriseSunset(t, lat)

	hourOfDay := float64(t.Hour()) + float64(t.Minute())/60.0

	distSunrise := math.Abs(hourOfDay - sunrise)
	distSunset := math.Abs(hourOfDay - sunset)
	dist := math.Min(distSunrise, distSunset)

	// Score 100 within 30 min, fades to 0 at 3 hours
	if dist > 3 {
		return 0
	}
	return 100 * (1 - dist/3.0)
}

// sunriseSunset returns approximate sunrise and sunset hours (local solar time)
// using a simplified formula based on latitude and day of year.
func sunriseSunset(t time.Time, lat float64) (sunrise, sunset float64) {
	dayOfYear := float64(t.YearDay())
	latRad := lat * math.Pi / 180.0

	// Solar declination
	declination := 23.45 * math.Sin(2*math.Pi*(284+dayOfYear)/365) * math.Pi / 180.0

	// Hour angle
	cosHourAngle := -math.Tan(latRad) * math.Tan(declination)
	cosHourAngle = math.Max(-1, math.Min(1, cosHourAngle)) // clamp
	hourAngle := math.Acos(cosHourAngle) * 180 / math.Pi / 15.0

	sunrise = 12.0 - hourAngle
	sunset = 12.0 + hourAngle
	return
}
