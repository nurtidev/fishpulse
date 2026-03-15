package core

import (
	"context"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/anthropics/anthropic-sdk-go"
)

// GenerateAdvice calls Claude Haiku to produce practical fishing advice with
// geography/habitat awareness, seasonality context, and condition-based tips.
// Returns empty string if ANTHROPIC_API_KEY is not set or the call fails.
func GenerateAdvice(result ForecastResult, meta SpeciesMeta, speciesName string, lang string) string {
	apiKey := os.Getenv("ANTHROPIC_API_KEY")
	if apiKey == "" {
		return ""
	}

	client := anthropic.NewClient()

	langName := map[string]string{
		"ru": "Russian",
		"kz": "Kazakh",
		"en": "English",
	}[lang]
	if langName == "" {
		langName = "Russian"
	}

	prompt := buildAdvicePrompt(result, meta, speciesName)

	ctx, cancel := context.WithTimeout(context.Background(), 12*time.Second)
	defer cancel()

	systemPrompt := fmt.Sprintf(`You are an expert fishing advisor with deep knowledge of fish biology, seasonal behaviour, and regional habitats across Central Asia and Kazakhstan.

Given the structured forecast data below, write 2-4 sentences of practical advice. Follow this priority order:

1. GEOGRAPHY: If the species is marked as OUTSIDE its known habitat, open with a clear warning, e.g. "⚠️ Щука редко встречается в данном регионе." Then still give general advice.
2. SEASON: If the season multiplier is below 0.7 (deep off-season), briefly mention reduced activity.
3. CONDITIONS: Give specific, actionable advice based on current bite index, pressure trend, solunar windows, and time of day. Mention bait type, retrieve speed, or depth.
4. TIMING: If there is a solunar major/minor window coming up today, mention it as the best moment.

Respond in %s only. Be direct and concise — no greetings, no filler.`, langName)

	resp, err := client.Messages.New(ctx, anthropic.MessageNewParams{
		Model:     anthropic.ModelClaudeHaiku4_5,
		MaxTokens: 400,
		System: []anthropic.TextBlockParam{
			{Text: systemPrompt},
		},
		Messages: []anthropic.MessageParam{
			anthropic.NewUserMessage(anthropic.NewTextBlock(prompt)),
		},
	})
	if err != nil {
		return ""
	}

	for _, block := range resp.Content {
		if tb, ok := block.AsAny().(anthropic.TextBlock); ok {
			return strings.TrimSpace(tb.Text)
		}
	}
	return ""
}

// buildAdvicePrompt constructs a rich structured prompt with geography, season, and condition data.
func buildAdvicePrompt(r ForecastResult, meta SpeciesMeta, speciesName string) string {
	// Approximate local time using longitude (15° per hour)
	localOffset := time.Duration(r.Lon / 15.0 * float64(time.Hour))
	localNow := r.Current.Time.Add(localOffset)

	now := localNow
	monthKey := strings.ToLower(now.Month().String()[:3])

	// --- GEOGRAPHY ---
	inHabitat := isInHabitatZones(r.Lat, r.Lon, meta.HabitatZones)
	habitatStatus := "within known habitat"
	if !inHabitat {
		habitatStatus = "OUTSIDE known habitat zones for this species"
	}
	habitatNames := make([]string, 0, len(meta.HabitatZones))
	for _, z := range meta.HabitatZones {
		habitatNames = append(habitatNames, z.Name)
	}
	habitatList := strings.Join(habitatNames, "; ")
	if habitatList == "" {
		habitatList = "not specified"
	}

	// --- SEASON ---
	seasonMult := 1.0
	if m, ok := meta.SeasonMultipliers[monthKey]; ok {
		seasonMult = m
	}
	seasonCtx := seasonContext(seasonMult)

	// --- PRESSURE ---
	pressureCtx := describePressure(r.Current.ReasonCodes)

	// --- SOLUNAR WINDOWS ---
	var windows []string
	for _, w := range r.SolunarWindows {
		// Convert window times to approximate local time
		wStart := w.Start.Add(localOffset)
		wEnd := w.End.Add(localOffset)
		windows = append(windows, fmt.Sprintf("%s %s–%s (local)",
			w.Type, wStart.Format("15:04"), wEnd.Format("15:04")))
	}
	solunarStr := "none today"
	if len(windows) > 0 {
		solunarStr = strings.Join(windows, ", ")
	}

	return fmt.Sprintf(`SPECIES: %s
LOCATION: %.4f, %.4f
GEOGRAPHY:
  Habitat status: %s
  Known regions for this species: %s
  Species biology notes: %s

SEASON (%s):
  Season status: %s
  Optimal water temp: %.0f–%.0f°C
  Temperature score: %d/100 (low = water outside optimal range)

CURRENT CONDITIONS (%s %s UTC, Bite Index %d/100 — %s):
  Pressure: %d/100 — %s
  Solunar:  %d/100 — %s
  Time of day: %d/100
  Wind:     %d/100
  Daily rating (max today): %d%%

UPCOMING:
  Best window in 48h: %s (index %d/100)
  Solunar periods today: %s`,
		speciesName,
		r.Lat, r.Lon,
		habitatStatus,
		habitatList,
		meta.Notes,
		now.Month().String(),
		seasonCtx,
		meta.OptimalTempMin, meta.OptimalTempMax,
		int(r.Current.Factors.Temperature),
		now.Weekday().String(), now.Format("15:04"),
		r.Current.Index, r.Current.Label,
		int(r.Current.Factors.Pressure), pressureCtx,
		int(r.Current.Factors.Solunar), solunarPeriodLabel(r.Current.SolunarPeriod),
		int(r.Current.Factors.TimeOfDay),
		int(r.Current.Factors.Wind),
		r.DailyRating,
		r.BestWindow.Time.Add(localOffset).Format("Mon 15:04"), r.BestWindow.Index,
		solunarStr,
	)
}

// isInHabitatZones returns false if the location is outside all known habitat zones.
// Returns true if no zones are defined (assume species present everywhere).
func isInHabitatZones(lat, lon float64, zones []HabitatZone) bool {
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

// seasonContext converts a season multiplier to a human-readable label for Claude.
func seasonContext(mult float64) string {
	switch {
	case mult >= 1.2:
		return fmt.Sprintf("PEAK season (×%.1f — fish very active, highest catch rates)", mult)
	case mult >= 1.0:
		return fmt.Sprintf("good season (×%.1f — above-average activity)", mult)
	case mult >= 0.8:
		return fmt.Sprintf("normal season (×%.1f)", mult)
	case mult >= 0.65:
		return fmt.Sprintf("off-season (×%.1f — reduced activity, fish sluggish)", mult)
	default:
		return fmt.Sprintf("deep off-season (×%.1f — minimal activity, fish near bottom)", mult)
	}
}

func solunarPeriodLabel(period string) string {
	switch period {
	case "major":
		return "major period ACTIVE NOW"
	case "minor":
		return "minor period ACTIVE NOW"
	default:
		return "no active period"
	}
}

// describePressure extracts a human-readable pressure context from reason codes.
func describePressure(codes []ReasonCode) string {
	for _, rc := range codes {
		switch rc.Code {
		case "pressure_drop_fast":
			return "dropping fast — fish feeding aggressively before the front"
		case "pressure_drop_slow":
			return "slowly falling — feeding picking up"
		case "pressure_rising":
			return "rising after storm — fish recovering, cautious"
		case "pressure_stable":
			return fmt.Sprintf("stable at %.0f hPa — normal behaviour", rc.Value)
		}
	}
	return "unknown"
}
