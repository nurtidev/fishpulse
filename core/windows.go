package core

import "time"

// NextWindow describes the next contiguous run of hours where the bite index
// stays at or above a threshold. PeakAt is the timestamp inside the run with
// the highest index.
type NextWindow struct {
	Start    time.Time `json:"start"`
	End      time.Time `json:"end"`
	Peak     int       `json:"peak"`
	PeakAt   time.Time `json:"peak_at"`
	Solunar  string    `json:"solunar"` // dominant solunar period in the window: "major", "minor", or ""
}

// FindNextWindow scans forecast hours strictly after `from` and returns the
// first contiguous run where Index >= threshold. Returns nil if none found.
func FindNextWindow(forecast []BiteResult, from time.Time, threshold int) *NextWindow {
	i := 0
	for i < len(forecast) && !forecast[i].Time.After(from) {
		i++
	}

	for i < len(forecast) {
		if forecast[i].Index < threshold {
			i++
			continue
		}

		w := NextWindow{
			Start:   forecast[i].Time,
			End:     forecast[i].Time,
			Peak:    forecast[i].Index,
			PeakAt:  forecast[i].Time,
			Solunar: forecast[i].SolunarPeriod,
		}

		j := i + 1
		for j < len(forecast) && forecast[j].Index >= threshold {
			if forecast[j].Index > w.Peak {
				w.Peak = forecast[j].Index
				w.PeakAt = forecast[j].Time
			}
			if w.Solunar != "major" {
				if forecast[j].SolunarPeriod == "major" {
					w.Solunar = "major"
				} else if forecast[j].SolunarPeriod == "minor" && w.Solunar == "" {
					w.Solunar = "minor"
				}
			}
			w.End = forecast[j].Time
			j++
		}
		return &w
	}
	return nil
}
