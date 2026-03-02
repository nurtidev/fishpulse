"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import PulsePanel from "@/components/PulsePanel";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { LangProvider, useLang } from "@/lib/LangContext";

const Map = dynamic(() => import("@/components/Map"), { ssr: false });

interface SelectedLocation {
  lat: number;
  lon: number;
  name?: string;
}

function AppContent() {
  const { t } = useLang();
  const [location, setLocation] = useState<SelectedLocation | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
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
      setPanelOpen(true);
    }
    if (species) setSelectedSpecies(species);
  }, []);

  // Sync URL when location or species changes
  useEffect(() => {
    if (!location) return;
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
      setPanelOpen(true);
    },
    []
  );

  const handleClose = useCallback(() => {
    setPanelOpen(false);
    window.history.replaceState({}, "", window.location.pathname);
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-white overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-2.5 bg-slate-950 border-b border-slate-800/80 shrink-0 z-10">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xl">🎣</span>
          <span className="font-bold text-white tracking-tight text-sm">FishPulse</span>
        </div>

        <div className="h-4 w-px bg-slate-700 shrink-0" />

        <span className="text-slate-500 text-xs hidden md:block truncate">
          {t.subtitle}
        </span>

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
      <main className="flex-1 flex overflow-hidden relative">
        {/* Map */}
        <div className="flex-1 relative">
          <Map onLocationSelect={handleLocationSelect} />

          {/* Empty state */}
          {!panelOpen && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none z-10">
              <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700/60 rounded-2xl px-5 py-4 shadow-2xl text-center min-w-[220px]">
                <p className="text-lg mb-1">🎣</p>
                <p className="text-sm font-semibold text-white mb-0.5">{t.emptyStateTitle}</p>
                <p className="text-xs text-slate-400 leading-relaxed">{t.emptyStateDesc}</p>
              </div>
            </div>
          )}
        </div>

        {/* Mobile backdrop */}
        {panelOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={handleClose}
          />
        )}

        {/* Panel — right sidebar on desktop, bottom sheet on mobile */}
        <div
          className={[
            "bg-slate-950 overflow-hidden",
            // Mobile: fixed bottom sheet
            "fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl",
            "border-t border-slate-800/80",
            // Desktop: static side panel
            "md:static md:z-auto md:rounded-none md:border-t-0 md:border-l",
            // Height
            "h-[72vh] md:h-auto md:self-stretch",
            // Animation: transform on mobile, width on desktop
            "transition-transform md:transition-[width]",
            "duration-300 ease-in-out",
            panelOpen
              ? "translate-y-0 md:w-72"
              : "translate-y-full md:w-0 md:translate-y-0",
          ].join(" ")}
        >
          {location && (
            <PulsePanel
              lat={location.lat}
              lon={location.lon}
              locationName={location.name}
              selectedSpecies={selectedSpecies}
              onSpeciesChange={setSelectedSpecies}
              onClose={handleClose}
            />
          )}
        </div>
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
