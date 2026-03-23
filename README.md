# 🎣 FishPulse

**Open-source fishing intelligence. Free for every angler on Earth.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Go Version](https://img.shields.io/badge/Go-1.25+-00ADD8?logo=go)](https://golang.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/nurtidev/fishpulse/issues)

> [English](README.md) · [Русский](README_RU.md) · [Қазақша](README_KZ.md)

FishPulse calculates a real-time **Bite Index (0–100)** for any location on Earth by combining solunar theory with live meteorological data. No paywalls, no subscriptions, no proprietary hardware required.

> Inspired by Garmin's fishing forecast — built to be free and open for everyone.

**[→ Try it live](https://fishpulse-production.up.railway.app)**

---

## Why FishPulse?

| | Garmin / Paid Apps | FishPulse |
|---|---|---|
| Solunar theory | ✅ | ✅ |
| Live barometric pressure | ❌ | ✅ |
| Water temperature | ❌ | ✅ (derived) |
| 48-hour forecast | ✅ | ✅ |
| AI fishing advice | ❌ | ✅ |
| Works without special hardware | ❌ | ✅ |
| Free | ❌ | ✅ |
| Open source | ❌ | ✅ |

---

## How the Bite Index Works

```
BiteIndex = (Solunar × 0.25) + (Pressure × 0.30) + (Temperature × 0.20)
          + (TimeOfDay × 0.15) + (Wind × 0.10)
          × SeasonalMultiplier
```

| Factor | Weight | Source |
|--------|--------|--------|
| Solunar (moon/sun position) | 25% | Astronomical calculation |
| Barometric pressure trend | 30% | Open-Meteo API (free) |
| Water temperature | 20% | Derived from air temp |
| Time of day | 15% | Sunrise/sunset calculation |
| Wind speed | 10% | Open-Meteo API (free) |

**Key insight:** Fish sense pressure changes through their swim bladder. A falling pressure front = aggressive feeding before the storm. This is the signal most apps miss.

Final score: **Poor** (0–39) · **Fair** (40–59) · **Good** (60–79) · **Excellent** (80–100)

---

## Features

- **Point & Click map** — click any river, lake, or sea to get its Bite Index
- **48-hour timeline** — hourly bite forecast chart
- **Solunar windows** — major and minor periods with exact start/end times
- **Species profiles** — Pike, Perch, Carp, Bream, Catfish, Zander
- **Habitat warnings** — alerts when a species is rarely found in the selected region
- **AI fishing advice** — Claude-powered tips in Russian, Kazakh, or English
- **Multilingual** — Russian 🇷🇺 · Kazakh 🇰🇿 · English 🇬🇧
- **Mobile-first UI** — works on any phone without an app

---

## Quick Start

### Prerequisites
- Go 1.25+
- Node.js 20+

### Run locally

```bash
git clone https://github.com/nurtidev/fishpulse.git
cd fishpulse

# 1. Start the backend (port 8080)
go run ./cmd/server/

# 2. In another terminal — start the frontend (port 3000)
cd web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Run with Docker

```bash
# Backend
docker build -t fishpulse-api .
docker run -p 8080:8080 \
  -e ALLOWED_ORIGIN=http://localhost:3000 \
  fishpulse-api

# Frontend
cd web
docker build -t fishpulse-web .
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=http://localhost:8080 \
  fishpulse-web
```

### API Example

```bash
curl "http://localhost:8080/api/v1/bite?lat=51.18&lon=71.45&species=pike&lang=en"
```

```json
{
  "lat": 51.18,
  "lon": 71.45,
  "species": "pike",
  "current": {
    "time": "2026-03-23T10:00:00Z",
    "index": 78,
    "label": "Good",
    "factors": {
      "solunar": 80,
      "pressure": 95,
      "temperature": 70,
      "time_of_day": 60,
      "wind": 85
    },
    "reason": "pressure dropping fast — fish feeding aggressively before the front",
    "solunar_period": "minor"
  },
  "best_window": {
    "time": "2026-03-23T06:00:00Z",
    "index": 91,
    "label": "Excellent"
  },
  "daily_rating": 91,
  "moon_phase_pct": 74.2,
  "solunar_windows": [
    { "type": "major", "start": "2026-03-23T05:30:00Z", "end": "2026-03-23T07:30:00Z" },
    { "type": "minor", "start": "2026-03-23T11:45:00Z", "end": "2026-03-23T12:45:00Z" }
  ],
  "advice": "Pressure dropping fast — pike will be feeding aggressively near the surface. Use fast-moving lures."
}
```

---

## Architecture

```
fishpulse/
├── cmd/server/        # Entry point
├── core/              # Go calculation engine
│   ├── index.go       # Bite Index formula
│   ├── solunar.go     # Moon/sun position & phase
│   ├── solunar_periods.go  # Major/minor window computation
│   ├── pressure.go    # Barometric pressure scoring
│   ├── temperature.go # Water temp estimation
│   ├── weather.go     # Open-Meteo API client (cached)
│   ├── advice.go      # Claude AI integration
│   └── loader.go      # Species config loader
├── api/               # REST API server
│   ├── server.go      # HTTP server setup
│   ├── handlers.go    # Endpoints
│   └── middleware.go  # CORS, rate limiting, logging
├── web/               # Next.js 16 frontend
│   ├── app/           # App Router pages
│   └── components/    # React components
└── algorithms/
    ├── species/        # Fish species configs (JSON)
    └── regions/        # Regional calibration (JSON)
```

---

## Environment Variables

### Backend

| Variable | Default | Description |
|---|---|---|
| `PORT` | `:8080` | Server listen address |
| `FISHPULSE_DATA_DIR` | `./algorithms` | Path to species/region configs |
| `APP_ENV` | — | `production` or `development` |
| `ALLOWED_ORIGIN` | `http://localhost:3000` | CORS allowed origins (comma-separated) |
| `ANTHROPIC_API_KEY` | — | Optional — enables AI fishing advice |

### Frontend

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | — | Backend API URL |

---

## Data Sources

All data sources are **free and open**:

- **[Open-Meteo](https://open-meteo.com/)** — weather & pressure forecasts (no API key required)
- **[Nominatim / OpenStreetMap](https://nominatim.org/)** — geocoding for location search
- **[Anthropic Claude](https://anthropic.com/)** — AI fishing advice (optional, requires API key)

---

## Contributing

FishPulse is community-driven. Here's where your help matters most:

**Add a fish species** — create `algorithms/species/yourfish.json` with seasonal and temperature coefficients.

**Add a region** — create `algorithms/regions/yourregion.json` with local calibration for rivers and lakes.

**Improve the algorithm** — the bite formula is in [core/index.go](core/index.go). Open a PR with data and reasoning.

**Fix a bug or add a feature** — see [Issues](https://github.com/nurtidev/fishpulse/issues).

---

## Roadmap

- [x] Bite Index formula (solunar + pressure + temp + wind)
- [x] Open-Meteo integration (no API key)
- [x] Web map with Leaflet
- [x] REST API
- [x] 48-hour forecast chart
- [x] Solunar windows (major/minor periods)
- [x] Species profiles: pike, perch, carp, bream, catfish, zander
- [x] AI fishing advice via Claude
- [x] Multilingual: Russian, Kazakh, English
- [x] Docker support
- [ ] More species (trout, salmon, tench…)
- [ ] More regions beyond Kazakhstan
- [ ] Unit tests for core algorithms
- [ ] PWA / offline support

---

## License

[MIT](LICENSE) — free to use, modify, and distribute.

---

<div align="center">
  <b>Built by anglers, for anglers.</b><br>
  If FishPulse helped you catch something — star the repo ⭐
</div>
