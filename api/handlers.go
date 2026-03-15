package api

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/nurtidev/fishpulse/core"
)

// errorResponse writes a JSON error with the given status code.
func errorResponse(w http.ResponseWriter, status int, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": msg})
}

// jsonResponse writes v as JSON with status 200.
func jsonResponse(w http.ResponseWriter, v any) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(v)
}

// handleBite handles GET /api/v1/bite
// Query params: lat, lon, species (default: pike)
//
// Returns the current bite index + 48-hour forecast + best window.
func (s *Server) handleBite(w http.ResponseWriter, r *http.Request) {
	lat, lon, err := parseCoords(r)
	if err != nil {
		errorResponse(w, http.StatusBadRequest, err.Error())
		return
	}

	speciesKey := r.URL.Query().Get("species")
	if speciesKey == "" {
		speciesKey = "pike"
	}
	if len(speciesKey) > 50 {
		errorResponse(w, http.StatusBadRequest, "invalid species parameter")
		return
	}

	lang := r.URL.Query().Get("lang")
	if lang != "ru" && lang != "kz" && lang != "en" {
		lang = "ru"
	}

	meta, ok := s.species[speciesKey]
	if !ok {
		errorResponse(w, http.StatusBadRequest, "invalid species parameter")
		return
	}

	snapshots, err := core.FetchWeather(lat, lon)
	if err != nil {
		errorResponse(w, http.StatusBadGateway, "weather service unavailable")
		return
	}

	now := time.Now().UTC()

	current := snapshots[0]
	for _, s := range snapshots {
		if s.Time.After(now) {
			break
		}
		current = s
	}

	currentResult := core.Calculate(now, lat, lon, current, meta.Species)

	// Local solar date at the location (for daily rating computation)
	localOffset := time.Duration(float64(time.Hour) * lon / 15.0)
	localNow := now.Add(localOffset)
	todayStr := localNow.Format("2006-01-02")

	var forecast []core.BiteResult
	var best core.BiteResult
	dailyRating := 0
	for _, snap := range snapshots {
		if snap.Time.Before(now) {
			continue
		}
		if snap.Time.After(now.Add(48 * time.Hour)) {
			break
		}
		result := core.Calculate(snap.Time, lat, lon, snap, meta.Species)
		forecast = append(forecast, result)
		if result.Index > best.Index {
			best = result
		}
		// Track max index for today in local solar time
		localSnapTime := snap.Time.Add(localOffset)
		if localSnapTime.Format("2006-01-02") == todayStr && result.Index > dailyRating {
			dailyRating = result.Index
		}
	}

	solunarWindows := core.DaySolunarWindows(now, lat, lon)

	result := core.ForecastResult{
		Lat:            lat,
		Lon:            lon,
		Species:        speciesKey,
		Current:        currentResult,
		Forecast:       forecast,
		BestWindow:     best,
		DailyRating:    dailyRating,
		MoonPhasePct:   core.MoonPhaseScore(now),
		SolunarWindows: solunarWindows,
	}

	// Localized species name for the AI prompt
	speciesDisplayName := meta.Name
	if lang == "ru" {
		speciesDisplayName = meta.NameRU
	} else if lang == "kz" {
		speciesDisplayName = meta.NameKZ
	}
	result.Advice = core.GenerateAdvice(result, meta, speciesDisplayName, lang)

	jsonResponse(w, result)
}

// handleSpecies handles GET /api/v1/species
// Returns the list of all available species with metadata.
func (s *Server) handleSpecies(w http.ResponseWriter, r *http.Request) {
	type speciesItem struct {
		Key          string             `json:"key"`
		Name         string             `json:"name"`
		NameRU       string             `json:"name_ru"`
		NameKZ       string             `json:"name_kz"`
		Notes        string             `json:"notes"`
		HabitatZones []core.HabitatZone `json:"habitat_zones,omitempty"`
	}

	items := make([]speciesItem, 0, len(s.species))
	for key, meta := range s.species {
		items = append(items, speciesItem{
			Key:          key,
			Name:         meta.Name,
			NameRU:       meta.NameRU,
			NameKZ:       meta.NameKZ,
			Notes:        meta.Notes,
			HabitatZones: meta.HabitatZones,
		})
	}
	jsonResponse(w, items)
}

// handleHealth handles GET /health — used by load balancers and uptime monitors.
func handleHealth(w http.ResponseWriter, r *http.Request) {
	jsonResponse(w, map[string]string{"status": "ok"})
}

// parseCoords extracts and validates lat/lon query parameters.
func parseCoords(r *http.Request) (lat, lon float64, err error) {
	latStr := r.URL.Query().Get("lat")
	lonStr := r.URL.Query().Get("lon")

	if latStr == "" || lonStr == "" {
		return 0, 0, errorf("lat and lon query parameters are required")
	}

	lat, err = strconv.ParseFloat(latStr, 64)
	if err != nil || lat < -90 || lat > 90 {
		return 0, 0, errorf("invalid lat: must be a number between -90 and 90")
	}

	lon, err = strconv.ParseFloat(lonStr, 64)
	if err != nil || lon < -180 || lon > 180 {
		return 0, 0, errorf("invalid lon: must be a number between -180 and 180")
	}

	return lat, lon, nil
}

func errorf(msg string) error {
	return &apiError{msg}
}

type apiError struct{ msg string }

func (e *apiError) Error() string { return e.msg }
