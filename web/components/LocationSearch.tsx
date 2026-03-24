"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "@/lib/LangContext";

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
  name?: string;
  address?: { water?: string; lake?: string; river?: string; city?: string };
}

interface PresetSpot {
  nameRu: string;
  nameKz: string;
  nameEn: string;
  lat: number;
  lon: number;
  icon: string;
}

const PRESET_SPOTS: PresetSpot[] = [
  { nameRu: "Капчагай", nameKz: "Қапшағай", nameEn: "Kapchagay", lat: 43.857, lon: 77.103, icon: "🎣" },
  { nameRu: "Балхаш", nameKz: "Балқаш", nameEn: "Balkhash", lat: 46.834, lon: 74.974, icon: "🎣" },
  { nameRu: "Бухтарма", nameKz: "Бұқтырма", nameEn: "Bukhtarma", lat: 49.500, lon: 84.000, icon: "🎣" },
  { nameRu: "р. Или", nameKz: "Іле өзені", nameEn: "Ili River", lat: 44.010, lon: 77.350, icon: "🎣" },
  { nameRu: "р. Иртыш", nameKz: "Ертіс өзені", nameEn: "Irtysh River", lat: 50.430, lon: 80.260, icon: "🎣" },
  { nameRu: "Зайсан", nameKz: "Зайсан", nameEn: "Zaisan", lat: 47.900, lon: 84.000, icon: "🎣" },
];

interface Props {
  onLocationSelect: (lat: number, lon: number, name: string) => void;
}

export default function LocationSearch({ onLocationSelect }: Props) {
  const { t, lang } = useLang();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&accept-language=${lang}`,
          { headers: { "Accept-Language": lang, "User-Agent": "FishPulse/1.0 (https://github.com/nurtidev/fishpulse)" } }
        );
        const data: SearchResult[] = await res.json();
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 450);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, lang]);

  const handleGeolocate = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    setLocError(false);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        onLocationSelect(pos.coords.latitude, pos.coords.longitude, "");
      },
      () => {
        setLocating(false);
        setLocError(true);
      },
      { timeout: 8000 }
    );
  };

  const handleResultClick = (r: SearchResult) => {
    const name =
      r.name ||
      r.address?.water ||
      r.address?.lake ||
      r.address?.river ||
      r.address?.city ||
      r.display_name.split(",")[0];
    onLocationSelect(parseFloat(r.lat), parseFloat(r.lon), name);
    setQuery("");
    setResults([]);
  };

  const handlePreset = (spot: PresetSpot) => {
    const name = lang === "kz" ? spot.nameKz : lang === "en" ? spot.nameEn : spot.nameRu;
    onLocationSelect(spot.lat, spot.lon, name);
  };

  const spotName = (spot: PresetSpot) =>
    lang === "kz" ? spot.nameKz : lang === "en" ? spot.nameEn : spot.nameRu;

  return (
    <div className="w-full max-w-md mx-auto px-4 flex flex-col gap-5">
      {/* Search input */}
      <div className="relative">
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-700/60 rounded-2xl px-4 py-3.5 focus-within:border-slate-500 transition-colors">
          {searching ? (
            <svg className="w-4 h-4 text-slate-400 animate-spin shrink-0" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-slate-400 shrink-0" viewBox="0 0 20 20" fill="none">
              <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="2" />
              <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="flex-1 bg-transparent text-white placeholder-slate-500 text-sm outline-none"
            autoComplete="off"
            autoCorrect="off"
          />
          {query && (
            <button onClick={() => { setQuery(""); setResults([]); }} className="text-slate-500 hover:text-slate-300 transition-colors">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>

        {/* Dropdown results */}
        {results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700/60 rounded-2xl overflow-hidden shadow-2xl z-50">
            {results.map((r, i) => {
              const parts = r.display_name.split(", ");
              const name = parts[0];
              const sub = parts.slice(1, 3).join(", ");
              return (
                <button
                  key={i}
                  onClick={() => handleResultClick(r)}
                  className="w-full text-left px-4 py-3 hover:bg-slate-800 transition-colors flex items-center gap-3 border-b border-slate-800/60 last:border-0"
                >
                  <span className="text-slate-400 shrink-0">📍</span>
                  <div className="min-w-0">
                    <p className="text-sm text-white font-medium truncate">{name}</p>
                    <p className="text-xs text-slate-500 truncate">{sub}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* No results */}
        {!searching && query.trim().length >= 2 && results.length === 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700/60 rounded-2xl px-4 py-3 text-center z-50">
            <p className="text-sm text-slate-500">{t.noResults}</p>
          </div>
        )}
      </div>

      {/* Geolocation button */}
      <button
        onClick={handleGeolocate}
        disabled={locating}
        className="flex items-center gap-3 w-full bg-slate-900 border border-slate-700/60 rounded-2xl px-4 py-3.5 hover:border-slate-500 hover:bg-slate-800 transition-all text-left disabled:opacity-60"
      >
        {locating ? (
          <svg className="w-4 h-4 text-emerald-400 animate-spin shrink-0" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-emerald-400 shrink-0" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="3" fill="currentColor" />
            <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="M10 1v2M10 17v2M1 10h2M17 10h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
        <span className="text-sm text-white">{t.useMyLocation}</span>
      </button>

      {locError && (
        <p className="text-xs text-red-400 text-center -mt-2">{t.locationError}</p>
      )}

      {/* Preset spots */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">{t.popularSpots}</p>
        <div className="grid grid-cols-2 gap-2">
          {PRESET_SPOTS.map((spot) => (
            <button
              key={spot.nameEn}
              onClick={() => handlePreset(spot)}
              className="flex items-center gap-2.5 bg-slate-900 border border-slate-800/60 rounded-xl px-3 py-2.5 hover:border-slate-600 hover:bg-slate-800 transition-all text-left"
            >
              <span className="text-base shrink-0">{spot.icon}</span>
              <span className="text-sm text-white font-medium truncate">{spotName(spot)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
