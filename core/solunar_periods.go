package core

import (
	"math"
	"time"
)

// DaySolunarWindows computes all solunar windows (major and minor) for the 24-hour
// day that contains t, at the given location. Returns windows sorted by start time.
//
// Major periods: moon overhead (transit) or underfoot (anti-transit) +/- 1 hour = 2h window.
// Minor periods: moonrise or moonset +/- 30 min = 1h window.
func DaySolunarWindows(t time.Time, lat, lon float64) []SolunarWindow {
	// Use local solar day (approximate from longitude) so windows
	// align with the user's calendar day, not the UTC day.
	localOffset := time.Duration(lon / 15.0 * float64(time.Hour))
	localNow := t.Add(localOffset)
	midnight := time.Date(localNow.Year(), localNow.Month(), localNow.Day(), 0, 0, 0, 0, time.UTC).Add(-localOffset)

	step := 5 * time.Minute
	totalDuration := 26 * time.Hour

	type peak struct {
		center time.Time
		kind   string
	}

	var peaks []peak

	prevAngle := moonTransitProximity(midnight, lat, lon)

	for d := step; d <= totalDuration; d += step {
		current := midnight.Add(d)
		angle := moonTransitProximity(current, lat, lon)

		// Overhead: angle wraps around 0/2pi
		if prevAngle > 5.5 && angle < 0.8 {
			c := interpCross(midnight.Add(d-step), midnight.Add(d), prevAngle, angle, 0)
			peaks = append(peaks, peak{c, "major"})
		}

		// Underfoot: angle crosses pi
		if prevAngle < math.Pi && angle >= math.Pi {
			c := interpCross(midnight.Add(d-step), midnight.Add(d), prevAngle, angle, math.Pi)
			peaks = append(peaks, peak{c, "major"})
		}

		// Moonset: angle crosses pi/2
		if prevAngle < math.Pi/2 && angle >= math.Pi/2 {
			c := interpCross(midnight.Add(d-step), midnight.Add(d), prevAngle, angle, math.Pi/2)
			peaks = append(peaks, peak{c, "minor"})
		}

		// Moonrise: angle crosses 3*pi/2
		if prevAngle < 3*math.Pi/2 && angle >= 3*math.Pi/2 {
			c := interpCross(midnight.Add(d-step), midnight.Add(d), prevAngle, angle, 3*math.Pi/2)
			peaks = append(peaks, peak{c, "minor"})
		}

		prevAngle = angle
	}

	dayStart := midnight
	dayEnd := midnight.Add(24 * time.Hour)

	var windows []SolunarWindow
	for _, p := range peaks {
		var halfDur time.Duration
		if p.kind == "major" {
			halfDur = 60 * time.Minute
		} else {
			halfDur = 30 * time.Minute
		}

		wStart := p.center.Add(-halfDur)
		wEnd := p.center.Add(halfDur)

		if wEnd.After(dayStart) && wStart.Before(dayEnd) {
			if wStart.Before(dayStart) {
				wStart = dayStart
			}
			if wEnd.After(dayEnd) {
				wEnd = dayEnd
			}
			windows = append(windows, SolunarWindow{
				Type:  p.kind,
				Start: wStart,
				End:   wEnd,
			})
		}
	}

	// Sort by start time
	for i := 1; i < len(windows); i++ {
		for j := i; j > 0 && windows[j].Start.Before(windows[j-1].Start); j-- {
			windows[j], windows[j-1] = windows[j-1], windows[j]
		}
	}

	return windows
}

// interpCross linearly interpolates the exact time when moon angle reaches target.
func interpCross(t0, t1 time.Time, a0, a1, target float64) time.Time {
	if a0 > 5.5 && a1 < 0.8 {
		a1 += 2 * math.Pi
		target += 2 * math.Pi
	}
	if a1 == a0 {
		return t0
	}
	frac := (target - a0) / (a1 - a0)
	dur := t1.Sub(t0)
	return t0.Add(time.Duration(float64(dur) * frac))
}
