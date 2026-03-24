package core

import (
	"context"
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"sync"
	"time"
)

const openMeteoURL = "https://api.open-meteo.com/v1/forecast"

// openMeteoResponse mirrors the relevant fields from the Open-Meteo API.
type openMeteoResponse struct {
	Hourly struct {
		Time          []string  `json:"time"`
		Temperature2m []float64 `json:"temperature_2m"`
		PressureMSL   []float64 `json:"pressure_msl"`
		WindSpeed10m  []float64 `json:"windspeed_10m"`
	} `json:"hourly"`
}

var weatherClient = &http.Client{Timeout: 10 * time.Second}

// weatherCacheEntry holds a cached weather response.
type weatherCacheEntry struct {
	snapshots []WeatherSnapshot
	fetchedAt time.Time
}

const (
	weatherCacheTTL     = 60 * time.Minute
	weatherCacheMaxSize = 500 // max unique location cells to keep in memory
)

var (
	weatherCache   = make(map[string]weatherCacheEntry)
	weatherCacheMu sync.Mutex
)

// cacheKey rounds lat/lon to 0.1° (~11 km) so nearby locations share cached data.
func cacheKey(lat, lon float64) string {
	return fmt.Sprintf("%.1f,%.1f", math.Round(lat*10)/10, math.Round(lon*10)/10)
}

// FetchWeather calls the Open-Meteo API and returns hourly WeatherSnapshot slices
// for the next 48 hours. Responses are cached for 1 hour per location cell.
// No API key required.
func FetchWeather(ctx context.Context, lat, lon float64) ([]WeatherSnapshot, error) {
	key := cacheKey(lat, lon)

	weatherCacheMu.Lock()
	if entry, ok := weatherCache[key]; ok && time.Since(entry.fetchedAt) < weatherCacheTTL {
		weatherCacheMu.Unlock()
		return entry.snapshots, nil
	}
	weatherCacheMu.Unlock()

	url := fmt.Sprintf(
		"%s?latitude=%.4f&longitude=%.4f&hourly=temperature_2m,pressure_msl,windspeed_10m&forecast_days=3&wind_speed_unit=ms",
		openMeteoURL, lat, lon,
	)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("weather request build failed: %w", err)
	}

	resp, err := weatherClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("weather fetch failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("weather API returned status %d", resp.StatusCode)
	}

	var data openMeteoResponse
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, fmt.Errorf("weather decode failed: %w", err)
	}

	snapshots, err := buildSnapshots(data)
	if err != nil {
		return nil, err
	}

	weatherCacheMu.Lock()
	// Evict expired entries before adding a new one to keep memory bounded.
	if len(weatherCache) >= weatherCacheMaxSize {
		now := time.Now()
		for k, v := range weatherCache {
			if now.Sub(v.fetchedAt) >= weatherCacheTTL {
				delete(weatherCache, k)
			}
		}
	}
	weatherCache[key] = weatherCacheEntry{snapshots: snapshots, fetchedAt: time.Now()}
	weatherCacheMu.Unlock()

	return snapshots, nil
}

// buildSnapshots converts raw API data into WeatherSnapshot slices with pressure trend.
func buildSnapshots(data openMeteoResponse) ([]WeatherSnapshot, error) {
	n := len(data.Hourly.Time)
	if n == 0 {
		return nil, fmt.Errorf("no hourly data in response")
	}
	// Guard against inconsistent array lengths from the API.
	n = min(n, len(data.Hourly.Temperature2m), len(data.Hourly.PressureMSL), len(data.Hourly.WindSpeed10m))
	if n == 0 {
		return nil, fmt.Errorf("hourly arrays are empty after length check")
	}

	snapshots := make([]WeatherSnapshot, 0, n)
	for i := 0; i < n; i++ {
		t, err := time.Parse("2006-01-02T15:04", data.Hourly.Time[i])
		if err != nil {
			continue
		}

		// Pressure trend = change vs 3 hours ago (index i-3).
		trend := 0.0
		if i >= 3 {
			trend = data.Hourly.PressureMSL[i] - data.Hourly.PressureMSL[i-3]
		}

		snapshots = append(snapshots, WeatherSnapshot{
			Time:          t,
			PressureHPa:   data.Hourly.PressureMSL[i],
			PressureTrend: trend,
			AirTempC:      data.Hourly.Temperature2m[i],
			WindSpeedMs:   data.Hourly.WindSpeed10m[i],
		})
	}
	return snapshots, nil
}
