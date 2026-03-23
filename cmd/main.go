package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/nurtidev/fishpulse/core"
)

func main() {
	// Example: Astana (Ishim River), Pike, right now
	lat, lon := 51.1801, 71.4460

	pike := core.Species{
		Name:           "Pike",
		OptimalTempMin: 12,
		OptimalTempMax: 16,
		SeasonMultipliers: map[string]float64{
			"jan": 0.50, "feb": 0.55, "mar": 1.30,
			"apr": 1.20, "may": 0.65, "jun": 0.70,
			"jul": 0.75, "aug": 0.80, "sep": 1.10,
			"oct": 1.20, "nov": 0.90, "dec": 0.55,
		},
	}

	fmt.Printf("FishPulse — fetching weather for (%.4f, %.4f)...\n", lat, lon)

	snapshots, err := core.FetchWeather(context.Background(), lat, lon)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}

	now := time.Now().UTC()

	// Find closest snapshot to now
	current := snapshots[0]
	for _, s := range snapshots {
		if s.Time.After(now) {
			break
		}
		current = s
	}

	result := core.Calculate(now, lat, lon, current, pike)

	// Print current bite index
	fmt.Printf("\n=== Current Bite Index ===\n")
	fmt.Printf("Time:    %s\n", result.Time.Format("2006-01-02 15:04 UTC"))
	fmt.Printf("Index:   %d/100 (%s)\n", result.Index, result.Label)
	fmt.Printf("Reason:  %s\n", result.Reason)
	fmt.Printf("\nFactors:\n")
	fmt.Printf("  Solunar:     %.0f\n", result.Factors.Solunar)
	fmt.Printf("  Pressure:    %.0f\n", result.Factors.Pressure)
	fmt.Printf("  Temperature: %.0f\n", result.Factors.Temperature)
	fmt.Printf("  Time of day: %.0f\n", result.Factors.TimeOfDay)
	fmt.Printf("  Wind:        %.0f\n", result.Factors.Wind)

	// Build 48h forecast
	var forecast []core.BiteResult
	var best core.BiteResult
	for _, snap := range snapshots {
		if snap.Time.Before(now) {
			continue
		}
		if snap.Time.After(now.Add(48 * time.Hour)) {
			break
		}
		r := core.Calculate(snap.Time, lat, lon, snap, pike)
		forecast = append(forecast, r)
		if r.Index > best.Index {
			best = r
		}
	}

	fmt.Printf("\n=== 48h Forecast ===\n")
	for _, r := range forecast {
		bar := progressBar(r.Index)
		fmt.Printf("%s  %s %3d  %s\n",
			r.Time.Format("Mon 15:04"),
			bar,
			r.Index,
			r.Label,
		)
	}

	fmt.Printf("\n=== Best Window in 48h ===\n")
	fmt.Printf("Time:   %s\n", best.Time.Format("2006-01-02 15:04 UTC"))
	fmt.Printf("Index:  %d/100 (%s)\n", best.Index, best.Label)
	fmt.Printf("Reason: %s\n", best.Reason)

	// Also dump JSON for API use
	out, _ := json.MarshalIndent(core.ForecastResult{
		Lat:        lat,
		Lon:        lon,
		Species:    pike.Name,
		Current:    result,
		Forecast:   forecast,
		BestWindow: best,
	}, "", "  ")
	_ = os.WriteFile("forecast.json", out, 0644)
	fmt.Println("\nFull forecast saved to forecast.json")
}

func progressBar(value int) string {
	filled := value / 10
	var bar strings.Builder
	for i := range 10 {
		if i < filled {
			bar.WriteString("█")
		} else {
			bar.WriteString("░")
		}
	}
	return bar.String()
}
