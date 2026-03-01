# 🎣 FishPulse

**Open-source fishing intelligence. Free for every angler.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Go Version](https://img.shields.io/badge/Go-1.22+-00ADD8?logo=go)](https://golang.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

FishPulse calculates a real-time **Bite Index (0–100)** for any location on Earth by combining solunar theory with live meteorological data. No paywalls, no proprietary hardware required.

> Inspired by Garmin's fishing forecast — built to be free and open for everyone.

---

## Why FishPulse?

| | Garmin / Paid Apps | FishPulse |
|---|---|---|
| Solunar theory | ✅ | ✅ |
| Live barometric pressure | ❌ | ✅ |
| Water temperature | ❌ | ✅ (derived) |
| 7-day forecast | ✅ | ✅ |
| Works without special hardware | ❌ | ✅ |
| Free | ❌ | ✅ |
| Open source | ❌ | ✅ |

---

## How the Bite Index Works

The index is calculated from 5 weighted factors:

```
BiteIndex = (Solunar × 0.25) + (Pressure × 0.30) + (Temperature × 0.20)
          + (TimeOfDay × 0.15) + (Wind × 0.10)
```

Then adjusted by a seasonal multiplier per species.

| Factor | Weight | Source |
|--------|--------|--------|
| Solunar (moon/sun position) | 25% | Astronomical calculation |
| Barometric pressure trend | 30% | Open-Meteo API (free) |
| Water temperature | 20% | Derived from air temp |
| Time of day | 15% | Sunrise/sunset calculation |
| Wind speed | 10% | Open-Meteo API (free) |

**Key insight:** Fish sense pressure changes through their swim bladder. A falling pressure front = aggressive feeding. This is the signal most apps miss.

---

## Features

- **Point & Click map** — click any river, lake, or sea to get its Bite Index
- **48-hour timeline** — hourly bite forecast chart
- **7-day calendar** — best days of the week at a glance
- **Species profiles** — Pike, Perch, Carp, Trout (more via community)
- **Regional calibration** — local coefficients for different water bodies
- **Open API** — integrate with Garmin, Apple Watch, WearOS, or any app

---

## Architecture

```
fishpulse/
├── core/               # Go engine: bite index calculation
│   ├── index.go        # Main BiteIndex formula
│   ├── solunar.go      # Moon/sun position calculator
│   ├── pressure.go     # Pressure trend scoring
│   └── temperature.go  # Water temp derivation
├── api/                # REST API server (Go)
│   ├── handlers/
│   └── openapi.yaml    # API specification
├── web/                # Next.js frontend + Leaflet map
│   ├── app/
│   └── components/
└── algorithms/         # Species & region configurations
    ├── species/
    │   ├── pike.json
    │   ├── perch.json
    │   └── carp.json
    └── regions/
        ├── volga.json
        └── norway.json
```

---

## Quick Start

### Prerequisites
- Go 1.22+
- Node.js 20+

### Run the API locally

```bash
git clone git@github.com:nurtidev/fishpulse.git
cd fishpulse

# Start the backend
cd core
go run main.go

# Query the API
curl "http://localhost:8080/api/bite?lat=55.7558&lon=37.6176&species=pike"
```

### Example Response

```json
{
  "location": { "lat": 55.7558, "lon": 37.6176 },
  "species": "pike",
  "current": {
    "index": 78,
    "label": "Good",
    "factors": {
      "solunar": 80,
      "pressure": 95,
      "temperature": 70,
      "time_of_day": 60,
      "wind": 85
    },
    "reason": "Pressure dropping before rain front — pike feeding aggressively"
  },
  "forecast": [
    { "hour": "2026-03-02T06:00:00Z", "index": 91 },
    { "hour": "2026-03-02T07:00:00Z", "index": 87 },
    ...
  ],
  "best_window": {
    "start": "2026-03-02T06:00:00Z",
    "end": "2026-03-02T08:00:00Z",
    "index": 91
  }
}
```

---

## Data Sources

All data sources are **free and open**:

- **[Open-Meteo](https://open-meteo.com/)** — weather & pressure forecasts (no API key required)
- **[Astronomy Engine](https://github.com/cosinekitty/astronomy)** — moon/sun calculations
- **[OpenStreetMap](https://www.openstreetmap.org/)** / **Leaflet** — maps

---

## Contributing

FishPulse is community-driven. Here's where your help matters most:

### Add a fish species
Create `algorithms/species/yourfish.json` with seasonal and temperature coefficients.

### Add a region
Create `algorithms/regions/yourregion.json` with local calibration data for rivers and lakes in your area.

### Improve the algorithm
The bite formula is in [core/index.go](core/index.go). If you have data that shows better weights, open a PR with your reasoning.

### Fix a bug or add a feature
See [Issues](../../issues) for open tasks. All levels welcome.

**Read [CONTRIBUTING.md](CONTRIBUTING.md) to get started.**

---

## Roadmap

- [ ] MVP: Pike index for Russia/CIS region
- [ ] Open-Meteo integration
- [ ] Web map with Leaflet
- [ ] REST API with OpenAPI spec
- [ ] 5 species profiles (pike, perch, carp, trout, bream)
- [ ] Community regional calibration system
- [ ] Garmin Connect IQ app
- [ ] Mobile PWA

---

## License

[MIT](LICENSE) — free to use, modify, and distribute.

---

<div align="center">
  <b>Built by anglers, for anglers.</b><br>
  If FishPulse helped you catch something — star the repo ⭐
</div>
