package core

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

// speciesFile mirrors the JSON structure in algorithms/species/*.json
type speciesFile struct {
	Name                string             `json:"name"`
	NameRU              string             `json:"name_ru"`
	NameKZ              string             `json:"name_kz"`
	OptimalTempMin      float64            `json:"optimal_temp_min"`
	OptimalTempMax      float64            `json:"optimal_temp_max"`
	OptimalPressureMin  float64            `json:"optimal_pressure_min"`
	OptimalPressureMax  float64            `json:"optimal_pressure_max"`
	PressureSensitivity float64            `json:"pressure_sensitivity"`
	SeasonMultipliers   map[string]float64 `json:"season_multipliers"`
	Notes               string             `json:"notes"`
	HabitatZones        []HabitatZone      `json:"habitat_zones"`
}

// SpeciesMeta extends Species with display names for the API.
type SpeciesMeta struct {
	Species
	NameRU       string        `json:"name_ru"`
	NameKZ       string        `json:"name_kz"`
	Notes        string        `json:"notes"`
	HabitatZones []HabitatZone `json:"habitat_zones"`
}

// LoadAllSpecies reads all JSON files from dir and returns a map keyed by file stem.
// Example: "pike.json" → key "pike".
func LoadAllSpecies(dir string) (map[string]SpeciesMeta, error) {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil, fmt.Errorf("reading species dir %q: %w", dir, err)
	}

	result := make(map[string]SpeciesMeta, len(entries))
	for _, e := range entries {
		if e.IsDir() || !strings.HasSuffix(e.Name(), ".json") {
			continue
		}

		path := filepath.Join(dir, e.Name())
		meta, err := loadSpeciesFile(path)
		if err != nil {
			return nil, fmt.Errorf("loading %q: %w", e.Name(), err)
		}

		key := strings.TrimSuffix(e.Name(), ".json")
		result[key] = meta
	}
	return result, nil
}

func loadSpeciesFile(path string) (SpeciesMeta, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return SpeciesMeta{}, err
	}

	var f speciesFile
	if err := json.Unmarshal(data, &f); err != nil {
		return SpeciesMeta{}, err
	}

	sensitivity := f.PressureSensitivity
	if sensitivity == 0 {
		sensitivity = 1.0
	}

	return SpeciesMeta{
		Species: Species{
			Name:                f.Name,
			OptimalTempMin:      f.OptimalTempMin,
			OptimalTempMax:      f.OptimalTempMax,
			OptimalPressureMin:  f.OptimalPressureMin,
			OptimalPressureMax:  f.OptimalPressureMax,
			PressureSensitivity: sensitivity,
			SeasonMultipliers:   f.SeasonMultipliers,
		},
		NameRU:       f.NameRU,
		NameKZ:       f.NameKZ,
		Notes:        f.Notes,
		HabitatZones: f.HabitatZones,
	}, nil
}
