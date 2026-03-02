"use client";

import { useEffect, useState } from "react";
import { fetchBite, fetchSpecies } from "@/lib/api";
import type { ForecastResult, HabitatZone, ReasonCode, SpeciesItem } from "@/lib/types";

function isInHabitat(lat: number, lon: number, zones: HabitatZone[]): boolean {
  if (!zones?.length) return true; // no data = assume present everywhere
  return zones.some(
    (z) => lat >= z.lat_min && lat <= z.lat_max && lon >= z.lon_min && lon <= z.lon_max
  );
}
import { useLang } from "@/lib/LangContext";
import type { Translations } from "@/lib/i18n";
import BiteGauge from "./BiteGauge";
import ForecastChart from "./ForecastChart";
import TodayWindows from "./TodayWindows";

function localizeReasons(codes: ReasonCode[], t: Translations): string {
  if (!codes?.length) return "";
  return codes
    .map((rc) => {
      const template = t.reasonCodes[rc.code] ?? rc.code;
      return rc.value
        ? template.replace("{value}", Math.round(rc.value).toString())
        : template;
    })
    .join("; ");
}

interface Props {
  lat: number;
  lon: number;
  locationName?: string;
  selectedSpecies: string;
  onSpeciesChange: (species: string) => void;
  onClose: () => void;
}

function FactorBar({
  label, value, tooltip,
}: {
  label: string;
  value: number;
  tooltip?: string;
}) {
  const [show, setShow] = useState(false);
  const color =
    value >= 80 ? "#10b981" : value >= 60 ? "#22c55e" : value >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div
      className="relative flex items-center gap-3 cursor-help"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span className="text-xs text-slate-500 w-24 shrink-0 select-none">{label}</span>
      <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
      <span className="text-xs font-medium w-6 text-right" style={{ color }}>
        {Math.round(value)}
      </span>

      {show && tooltip && (
        <div className="absolute bottom-full left-0 mb-2 w-60 bg-slate-800 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-300 leading-relaxed z-50 shadow-2xl pointer-events-none">
          <div className="font-semibold text-white mb-1">{label}</div>
          {tooltip}
          <div className="absolute top-full left-6 w-2 h-2 bg-slate-800 border-b border-r border-slate-700/80 rotate-45 -mt-1" />
        </div>
      )}
    </div>
  );
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-800/50 ${className ?? ""}`} />;
}

function PanelSkeleton() {
  return (
    <div className="space-y-4 px-4 py-3">
      <div className="flex flex-col items-center py-4 gap-3">
        <Skeleton className="w-40 h-40 rounded-full" />
        <Skeleton className="w-20 h-4 rounded-full" />
      </div>
      <Skeleton className="h-16 rounded-xl" />
      <Skeleton className="h-14 rounded-xl" />
      <div className="space-y-3 pt-2">
        <Skeleton className="w-20 h-3 rounded-full" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="w-24 h-3 rounded-full" />
            <Skeleton className="flex-1 h-1 rounded-full" />
            <Skeleton className="w-6 h-3 rounded-full" />
          </div>
        ))}
      </div>
      <Skeleton className="h-32 rounded-xl" />
    </div>
  );
}

export default function PulsePanel({
  lat, lon, locationName, selectedSpecies, onSpeciesChange, onClose,
}: Props) {
  const { t, lang } = useLang();
  const [species, setSpecies] = useState<SpeciesItem[]>([]);
  const [data, setData] = useState<ForecastResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchSpecies().then(setSpecies).catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setData(null);
    fetchBite(lat, lon, selectedSpecies)
      .then(setData)
      .catch(() => setError(t.apiError))
      .finally(() => setLoading(false));
  }, [lat, lon, selectedSpecies, t.apiError]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const bestTime = data
    ? new Date(data.best_window.time).toLocaleString(lang === "en" ? "en" : "ru", {
        weekday: "short", hour: "2-digit", minute: "2-digit",
      })
    : null;

  const speciesName = (s: SpeciesItem) =>
    lang === "en" ? s.name : lang === "kz" ? s.name_kz || s.name_ru : s.name_ru;

  const currentSpeciesMeta = species.find((s) => s.key === selectedSpecies);
  const inHabitat = currentSpeciesMeta
    ? isInHabitat(lat, lon, currentSpeciesMeta.habitat_zones ?? [])
    : true;

  return (
    <aside className="w-full h-full flex flex-col bg-slate-950 border-l border-slate-800/80 overflow-y-auto overflow-x-hidden">
      {/* Mobile drag handle */}
      <div className="flex justify-center pt-3 pb-1 md:hidden shrink-0">
        <div className="w-10 h-1 bg-slate-700 rounded-full" />
      </div>

      {/* Header */}
      <div className="px-4 pt-3 pb-3 border-b border-slate-800/60 shrink-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {locationName ? (
              <p className="text-sm font-semibold text-white leading-tight truncate">
                {locationName}
              </p>
            ) : (
              <p className="text-sm font-semibold text-white">
                {lat.toFixed(4)}, {lon.toFixed(4)}
              </p>
            )}
            {locationName && (
              <p className="text-xs text-slate-500 mt-0.5">
                {lat.toFixed(4)}, {lon.toFixed(4)}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Copy link */}
            <button
              onClick={handleCopy}
              title={copied ? t.linkCopied : t.copyLink}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-all text-sm"
            >
              {copied ? (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7l4 4 6-6" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M5.5 2.5h-3a1 1 0 00-1 1v8a1 1 0 001 1h7a1 1 0 001-1v-3M8 1h5v5M12.5 1.5l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              title={t.closePanel}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-all"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Species selector */}
        <div className="mt-3">
          <label className="text-xs text-slate-500 font-medium block mb-1.5">
            {t.speciesLabel}
          </label>
          <select
            value={selectedSpecies}
            onChange={(e) => onSpeciesChange(e.target.value)}
            className="w-full bg-slate-800/80 text-white text-sm rounded-lg px-3 py-2 border border-slate-700/60 focus:outline-none focus:border-slate-500 appearance-none cursor-pointer"
          >
            {species.map((s) => (
              <option key={s.key} value={s.key}>
                {speciesName(s)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 py-3">
        {loading && <PanelSkeleton />}

        {error && !loading && (
          <div className="mx-4 rounded-xl bg-red-500/8 border border-red-500/20 p-5 text-center">
            <p className="text-2xl mb-2">🌧️</p>
            <p className="text-sm font-semibold text-red-400 mb-1">{t.errorTitle}</p>
            <p className="text-xs text-slate-500 leading-relaxed">{error}</p>
          </div>
        )}

        {data && !loading && (
          <div className="px-4 space-y-4">
            {!inHabitat && (
              <div className="rounded-xl bg-amber-500/8 border border-amber-500/25 px-3 py-2.5 flex items-center gap-2">
                <span className="text-base shrink-0">⚠️</span>
                <p className="text-xs text-amber-400 leading-snug">{t.regionWarning}</p>
              </div>
            )}
            <BiteGauge index={data.current.index} label={data.current.label} />

            {/* Reason */}
            <div className="rounded-xl bg-slate-900 border border-slate-800/60 p-3">
              <p className="text-xs text-slate-500 font-medium mb-1">{t.reason}</p>
              <p className="text-xs text-slate-300 leading-relaxed">
                {localizeReasons(data.current.reason_codes, t)}
              </p>
            </div>

            {/* Best window */}
            <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-3 flex items-center gap-3">
              <span className="text-xl shrink-0">🏆</span>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 font-medium">{t.bestWindow}</p>
                <p className="text-sm font-bold text-white mt-0.5">
                  {bestTime}
                  <span className="ml-2 text-emerald-400">{data.best_window.index}/100</span>
                </p>
              </div>
            </div>

            {data.forecast.length > 0 && <TodayWindows forecast={data.forecast} />}

            {/* Factors */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {t.factors}
              </h3>
              {Object.entries(data.current.factors).map(([key, val]) => (
                <FactorBar
                  key={key}
                  label={t.factorNames[key] ?? key}
                  value={val}
                  tooltip={t.factorTips[key]}
                />
              ))}
            </div>

            {data.forecast.length > 0 && <ForecastChart forecast={data.forecast} />}
          </div>
        )}
      </div>
    </aside>
  );
}
