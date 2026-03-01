package core

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

const openMeteoURL = "https://api.open-meteo.com/v1/forecast"

// openMeteoResponse mirrors the relevant fields from the Open-Meteo API.
type openMeteoResponse struct {
	Hourly struct {
		Time            []string  `json:"time"`
		Temperature2m   []float64 `json:"temperature_2m"`
		PressureMSL     []float64 `json:"pressure_msl"`
		WindSpeed10m    []float64 `json:"windspeed_10m"`
	} `json:"hourly"`
}

// FetchWeather calls the Open-Meteo API and returns hourly WeatherSnapshot slices
// for the next 48 hours. No API key required.
func FetchWeather(lat, lon float64) ([]WeatherSnapshot, error) {
	url := fmt.Sprintf(
		"%s?latitude=%.4f&longitude=%.4f&hourly=temperature_2m,pressure_msl,windspeed_10m&forecast_days=3&wind_speed_unit=ms",
		openMeteoURL, lat, lon,
	)

	resp, err := http.Get(url) //nolint:gosec // URL is constructed from validated coords
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

	return buildSnapshots(data)
}

// buildSnapshots converts raw API data into WeatherSnapshot slices with pressure trend.
func buildSnapshots(data openMeteoResponse) ([]WeatherSnapshot, error) {
	n := len(data.Hourly.Time)
	if n == 0 {
		return nil, fmt.Errorf("no hourly data in response")
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
