"use client";

import { useCallback, useEffect, useState } from "react";
import PulsePanel from "@/components/PulsePanel";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import LocationSearch from "@/components/LocationSearch";
import { LangProvider, useLang } from "@/lib/LangContext";

interface SelectedLocation {
  lat: number;
  lon: number;
  name?: string;
}

function AppContent() {
  const { t } = useLang();
  const [location, setLocation] = useState<SelectedLocation | null>(null);
  const [selectedSpecies, setSelectedSpecies] = useState("pike");

  // Restore state from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const lat = parseFloat(params.get("lat") ?? "");
    const lon = parseFloat(params.get("lon") ?? "");
    const name = params.get("name") ?? undefined;
    const species = params.get("species");
    if (!isNaN(lat) && !isNaN(lon)) {
      setLocation({ lat, lon, name });
    }
    if (species) setSelectedSpecies(species);
  }, []);

  // Sync URL when location or species changes
  useEffect(() => {
    if (!location) {
      window.history.replaceState({}, "", window.location.pathname);
      return;
    }
    const params = new URLSearchParams();
    params.set("lat", location.lat.toFixed(5));
    params.set("lon", location.lon.toFixed(5));
    if (location.name) params.set("name", location.name);
    params.set("species", selectedSpecies);
    window.history.replaceState({}, "", `?${params.toString()}`);
  }, [location, selectedSpecies]);

  const handleLocationSelect = useCallback(
    (lat: number, lon: number, name?: string) => {
      setLocation({ lat, lon, name });
    },
    []
  );

  const handleBack = useCallback(() => {
    setLocation(null);
    window.history.replaceState({}, "", window.location.pathname);
  }, []);

  return (
    <div className="min-h-[100dvh] w-screen flex flex-col bg-slate-950 text-white">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 bg-slate-950 border-b border-slate-800/80 shrink-0 sticky top-0 z-20">
        {location ? (
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors mr-1"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-sm">{t.back}</span>
          </button>
        ) : null}

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xl">🎣</span>
          <span className="font-bold text-white tracking-tight text-sm">FishPulse</span>
        </div>

        <div className="ml-auto flex items-center gap-3 shrink-0">
          <LanguageSwitcher />
          <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
            beta
          </span>
          <a
            href="https://github.com/nurtidev/fishpulse"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors font-medium hidden sm:block"
          >
            GitHub ↗
          </a>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col">
        {!location ? (
          /* Search screen */
          <div className="flex-1 flex flex-col justify-center py-10">
            <div className="text-center mb-8 px-4">
              <h1 className="text-2xl font-bold text-white mb-2">{t.emptyStateTitle}</h1>
              <p className="text-sm text-slate-400">{t.emptyStateDesc}</p>
            </div>
            <LocationSearch onLocationSelect={handleLocationSelect} />
          </div>
        ) : (
          /* Forecast panel — full width, mobile-first */
          <div className="flex-1 flex flex-col max-w-lg w-full mx-auto">
            <PulsePanel
              lat={location.lat}
              lon={location.lon}
              locationName={location.name}
              selectedSpecies={selectedSpecies}
              onSpeciesChange={setSelectedSpecies}
              onClose={handleBack}
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <LangProvider>
      <AppContent />
    </LangProvider>
  );
}
