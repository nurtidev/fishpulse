package api

import (
	"log/slog"
	"net/http"
	"sort"
	"strconv"
	"time"

	"github.com/nurtidev/fishpulse/core"
)

// nowItem describes a species currently biting at the requested location.
type nowItem struct {
	Species     string             `json:"species"`
	Name        string             `json:"name"`
	NameRU      string             `json:"name_ru"`
	NameKZ      string             `json:"name_kz"`
	Index       int                `json:"index"`
	Label       string             `json:"label"`
	Solunar     string             `json:"solunar_period"`
	ReasonCodes []core.ReasonCode  `json:"reason_codes"`
	Hint        string             `json:"hint"`
}

// nextItem describes the nearest upcoming bite window for a species.
type nextItem struct {
	Species      string    `json:"species"`
	Name         string    `json:"name"`
	NameRU       string    `json:"name_ru"`
	NameKZ       string    `json:"name_kz"`
	Start        time.Time `json:"window_start"`
	End          time.Time `json:"window_end"`
	Peak         int       `json:"peak_index"`
	PeakAt       time.Time `json:"peak_at"`
	HoursUntil   float64   `json:"hours_until"`
	Solunar      string    `json:"solunar_period"`
	Hint         string    `json:"hint"`
}

// nowAndNextResponse is the response body of GET /api/v1/now-and-next.
type nowAndNextResponse struct {
	Lat       float64    `json:"lat"`
	Lon       float64    `json:"lon"`
	LocalTZ   string     `json:"local_tz"`
	Threshold int        `json:"threshold"`
	Now       []nowItem  `json:"now"`
	Next      []nextItem `json:"next"`
}

const (
	defaultNowThreshold  = 55 // bite index treated as "actively biting"
	defaultNextThreshold = 60 // a future window has to be at least Fair-plus to be worth notifying
	maxNowItems          = 3
	maxNextItems         = 5
	nextLookaheadHours   = 36
)

// handleNowAndNext handles GET /api/v1/now-and-next.
// Query params: lat, lon, optional threshold (50-90), optional lang.
//
// For each loaded species, computes the current bite index and (if low) finds
// the nearest upcoming window. Filters out species whose habitat zones don't
// cover the location and species under regulatory spawn closure.
func (s *Server) handleNowAndNext(w http.ResponseWriter, r *http.Request) {
	lat, lon, err := parseCoords(r)
	if err != nil {
		errorResponse(w, http.StatusBadRequest, err.Error())
		return
	}

	lang := r.URL.Query().Get("lang")
	if lang != "ru" && lang != "kz" && lang != "en" {
		lang = "ru"
	}

	threshold := defaultNowThreshold
	if t := r.URL.Query().Get("threshold"); t != "" {
		if v, err := strconv.Atoi(t); err == nil && v >= 30 && v <= 90 {
			threshold = v
		}
	}

	snapshots, err := core.FetchWeather(r.Context(), lat, lon)
	if err != nil {
		slog.Error("weather fetch failed", "req_id", reqID(r.Context()), "lat", lat, "lon", lon, "err", err)
		errorResponse(w, http.StatusBadGateway, "weather service unavailable")
		return
	}

	now := time.Now().UTC()

	// Pick the snapshot for "current" — last one not in the future.
	current := snapshots[0]
	for _, snap := range snapshots {
		if snap.Time.After(now) {
			break
		}
		current = snap
	}

	cutoff := now.Add(nextLookaheadHours * time.Hour)

	var nowList []nowItem
	var nextList []nextItem

	for key, meta := range s.species {
		// Skip species whose habitat zones don't cover this location.
		if !isInHabitatZones(lat, lon, meta.HabitatZones) {
			continue
		}
		// Skip species under regulatory spawn closure this month.
		if isSpawnClosureNow(now, meta.SpawnClosureMonths) {
			continue
		}

		currentResult := core.Calculate(now, lat, lon, current, meta.Species)

		if currentResult.Index >= threshold {
			nowList = append(nowList, nowItem{
				Species:     key,
				Name:        meta.Name,
				NameRU:      meta.NameRU,
				NameKZ:      meta.NameKZ,
				Index:       currentResult.Index,
				Label:       currentResult.Label,
				Solunar:     currentResult.SolunarPeriod,
				ReasonCodes: currentResult.ReasonCodes,
				Hint:        core.BuildHint(key, lang, currentResult),
			})
			continue
		}

		// Not biting now — look for the next window.
		var forecast []core.BiteResult
		for _, snap := range snapshots {
			if snap.Time.Before(now) || !snap.Time.Before(cutoff) {
				continue
			}
			forecast = append(forecast, core.Calculate(snap.Time, lat, lon, snap, meta.Species))
		}

		window := core.FindNextWindow(forecast, now, defaultNextThreshold)
		if window == nil {
			continue
		}

		hoursUntil := window.Start.Sub(now).Hours()
		nextList = append(nextList, nextItem{
			Species:    key,
			Name:       meta.Name,
			NameRU:     meta.NameRU,
			NameKZ:     meta.NameKZ,
			Start:      window.Start,
			End:        window.End,
			Peak:       window.Peak,
			PeakAt:     window.PeakAt,
			HoursUntil: hoursUntil,
			Solunar:    window.Solunar,
			Hint:       core.BuildHint(key, lang, peakSyntheticResult(window)),
		})
	}

	sort.Slice(nowList, func(i, j int) bool { return nowList[i].Index > nowList[j].Index })
	if len(nowList) > maxNowItems {
		nowList = nowList[:maxNowItems]
	}

	sort.Slice(nextList, func(i, j int) bool { return nextList[i].Start.Before(nextList[j].Start) })
	if len(nextList) > maxNextItems {
		nextList = nextList[:maxNextItems]
	}

	if nowList == nil {
		nowList = []nowItem{}
	}
	if nextList == nil {
		nextList = []nextItem{}
	}

	slog.Info("now_and_next",
		"req_id", reqID(r.Context()),
		"lat", lat, "lon", lon, "lang", lang,
		"threshold", threshold,
		"now_count", len(nowList), "next_count", len(nextList),
	)

	jsonResponse(w, nowAndNextResponse{
		Lat:       lat,
		Lon:       lon,
		LocalTZ:   core.LocalTimezone(lat, lon),
		Threshold: threshold,
		Now:       nowList,
		Next:      nextList,
	})
}

// isInHabitatZones returns true if no zones are defined or the point falls in
// at least one zone. Mirrors core.isInHabitatZones (which is unexported).
func isInHabitatZones(lat, lon float64, zones []core.HabitatZone) bool {
	if len(zones) == 0 {
		return true
	}
	for _, z := range zones {
		if lat >= z.LatMin && lat <= z.LatMax && lon >= z.LonMin && lon <= z.LonMax {
			return true
		}
	}
	return false
}

// isSpawnClosureNow returns true if the current month is listed in the species'
// regulatory spawn closure months.
func isSpawnClosureNow(now time.Time, months []string) bool {
	if len(months) == 0 {
		return false
	}
	cur := now.Month().String()[:3]
	curLower := []byte(cur)
	for i := range curLower {
		if curLower[i] >= 'A' && curLower[i] <= 'Z' {
			curLower[i] += 'a' - 'A'
		}
	}
	target := string(curLower)
	for _, m := range months {
		if m == target {
			return true
		}
	}
	return false
}

// peakSyntheticResult builds a minimal BiteResult representing the window's
// peak so BuildHint can still apply solunar/golden-hour prefixes for the
// "next" suggestion.
func peakSyntheticResult(w *core.NextWindow) core.BiteResult {
	return core.BiteResult{
		Time:          w.PeakAt,
		Index:         w.Peak,
		SolunarPeriod: w.Solunar,
	}
}
