package core

import (
	"math"
	"time"
)

const synodicPeriodDays = 29.530588853

// refNewMoon is the reference new moon: 2000-01-06 18:14 UTC.
var refNewMoon = time.Date(2000, 1, 6, 18, 14, 0, 0, time.UTC)

// solarLocalTime returns t adjusted to local solar time using longitude.
// Solar time = UTC + lon/15 hours. This is approximate (ignores equation of time)
// but accurate enough for sunrise/sunset and time-of-day scoring.
func solarLocalTime(t time.Time, lon float64) time.Time {
	offsetSecs := int64(lon / 15.0 * 3600)
	return t.UTC().Add(time.Duration(offsetSecs) * time.Second)
}

// solunarScore returns a score 0–100 based on moon position, phase, and sun position.
// Major periods (moon overhead/underfoot) score highest; moon phase amplifies the signal.
func solunarScore(t time.Time, lat, lon float64) float64 {
	moonAngle := moonTransitProximity(t, lat, lon)

	// Moon transit contribution (major/minor periods)
	moonScore := transitScore(moonAngle)

	// Moon phase contribution: full/new moon = 100, quarter moon = ~20
	phaseScore := moonPhaseScore(t)

	// Blend: 75% transit position, 25% phase quality
	blended := 0.75*moonScore + 0.25*phaseScore

	// Sun contribution (sunrise/sunset minor periods)
	sunScore := sunriseScore(t, lat, lon) * 0.8

	best := math.Max(blended, sunScore)
	if best < 30 {
		best = 30
	}
	return best
}

// transitScore converts moon angle (0–2π) to a 0–100 score.
// Two peaks per day: moon overhead (0) and moon underfoot (π).
func transitScore(angle float64) float64 {
	dist := angle
	if dist > math.Pi {
		dist = 2*math.Pi - dist
	}
	score := 100 * math.Exp(-3.0*(dist/math.Pi))
	if score < 20 {
		score = 20
	}
	return score
}

// SolunarPeriodType returns "major", "minor", or "" based on moon position relative to the observer.
//
//	Major: moon overhead or underfoot (within ±1 lunar hour ≈ 2-hour window)
//	Minor: moonrise or moonset (within ±30 lunar minutes ≈ 1-hour window)
func SolunarPeriodType(t time.Time, lat, lon float64) string {
	angle := moonTransitProximity(t, lat, lon)
	lunarHourAngle := 2 * math.Pi / 24.84 // radians per lunar hour

	// Distance from nearest major transit: overhead (0/2π) or underfoot (π)
	d0 := angle                  // distance from 0 (overhead)
	dpi := math.Abs(angle - math.Pi) // distance from π (underfoot)
	d2pi := 2*math.Pi - angle   // distance from 2π (same as overhead)
	majorDist := math.Min(d0, math.Min(dpi, d2pi))

	if majorDist <= lunarHourAngle {
		return "major"
	}

	// Distance from nearest minor: moonset (π/2) or moonrise (3π/2)
	dpi2 := math.Abs(angle - math.Pi/2)
	d3pi2 := math.Abs(angle - 3*math.Pi/2)
	minorDist := math.Min(dpi2, d3pi2)

	if minorDist <= lunarHourAngle/2 {
		return "minor"
	}

	return ""
}

// moonPhaseFraction returns the current lunar phase as a fraction 0–1.
// 0 = new moon, 0.25 = first quarter, 0.5 = full moon, 0.75 = last quarter.
func moonPhaseFraction(t time.Time) float64 {
	elapsedDays := t.Sub(refNewMoon).Hours() / 24.0
	frac := math.Mod(elapsedDays/synodicPeriodDays, 1.0)
	if frac < 0 {
		frac += 1.0
	}
	return frac
}

// moonPhaseScore returns 0–100 fishing quality score based on moon phase.
// Peaks at new moon (0) and full moon (0.5); minimum at quarter moons.
func moonPhaseScore(t time.Time) float64 {
	frac := moonPhaseFraction(t)
	// cos(frac*4π) = 1 at 0 and 0.5, = -1 at 0.25 and 0.75
	score := 50 + 50*math.Cos(frac*4*math.Pi)
	if score < 20 {
		score = 20
	}
	return score
}

// MoonPhaseScore is the exported version of moonPhaseScore.
func MoonPhaseScore(t time.Time) float64 {
	return moonPhaseScore(t)
}

// moonTransitProximity returns the angular position of the moon (0–2π)
// where 0 = overhead, π/2 = moonset, π = underfoot, 3π/2 = moonrise.
func moonTransitProximity(t time.Time, lat, lon float64) float64 {
	moonPeriodHours := 24.8412
	elapsed := t.UTC().Sub(refNewMoon).Hours()

	fraction := math.Mod(elapsed/moonPeriodHours, 1.0)
	if fraction < 0 {
		fraction += 1.0
	}

	// Adjust for longitude (each degree = 1/360 of a lunar day)
	lonOffset := lon / 360.0
	fraction = math.Mod(fraction+lonOffset, 1.0)

	return fraction * 2 * math.Pi
}

// sunriseScore returns a 0–100 score based on proximity to sunrise or sunset,
// using longitude-corrected solar local time.
func sunriseScore(t time.Time, lat, lon float64) float64 {
	lt := solarLocalTime(t, lon)
	sunrise, sunset := sunriseSunset(lt, lat)

	hourOfDay := float64(lt.Hour()) + float64(lt.Minute())/60.0

	distSunrise := math.Abs(hourOfDay - sunrise)
	distSunset := math.Abs(hourOfDay - sunset)
	dist := math.Min(distSunrise, distSunset)

	if dist > 3 {
		return 0
	}
	return 100 * (1 - dist/3.0)
}

// sunriseSunset returns approximate sunrise and sunset hours in local solar time
// using a simplified formula based on latitude and day of year.
// t must already be in local solar time (use solarLocalTime before calling).
func sunriseSunset(t time.Time, lat float64) (sunrise, sunset float64) {
	dayOfYear := float64(t.YearDay())
	latRad := lat * math.Pi / 180.0

	declination := 23.45 * math.Sin(2*math.Pi*(284+dayOfYear)/365) * math.Pi / 180.0

	cosHourAngle := -math.Tan(latRad) * math.Tan(declination)
	cosHourAngle = math.Max(-1, math.Min(1, cosHourAngle))
	hourAngle := math.Acos(cosHourAngle) * 180 / math.Pi / 15.0

	sunrise = 12.0 - hourAngle
	sunset = 12.0 + hourAngle
	return
}
