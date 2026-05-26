package core

import (
	"sync"

	"github.com/ringsaturn/tzf"
)

var (
	tzFinder     tzf.F
	tzFinderOnce sync.Once
	tzFinderErr  error
)

// initTzFinder lazily initializes the timezone finder. The default finder embeds
// a precompressed timezone polygon dataset and resolves a (lat, lon) to an IANA
// timezone name (e.g. "Asia/Almaty") in O(log n).
func initTzFinder() (tzf.F, error) {
	tzFinderOnce.Do(func() {
		tzFinder, tzFinderErr = tzf.NewDefaultFinder()
	})
	return tzFinder, tzFinderErr
}

// LocalTimezone returns the IANA timezone name for the given coordinates,
// e.g. "Asia/Almaty" for Astana. Falls back to "UTC" if the finder fails or
// the point falls in an oceanic gap.
func LocalTimezone(lat, lon float64) string {
	finder, err := initTzFinder()
	if err != nil {
		return "UTC"
	}
	name := finder.GetTimezoneName(lon, lat)
	if name == "" {
		return "UTC"
	}
	return name
}
