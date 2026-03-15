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

import type { SolunarWindow } from "@/lib/types";

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
      onClick={() => setShow((v) => !v)}
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
        <div className="absolute bottom-full left-0 mb-2 w-56 max-w-[calc(100vw-2rem)] bg-slate-800 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-300 leading-relaxed z-50 shadow-2xl pointer-events-none">
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

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14" height="14" viewBox="0 0 14 14" fill="none"
      className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FactorsAccordion({ factors, t }: { factors: Record<string, number>; t: Translations }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl bg-slate-900 border border-slate-800/60 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-left"
      >
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t.factors}</h3>
        <span className="text-slate-500"><ChevronIcon open={open} /></span>
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-2.5 border-t border-slate-800/60 pt-2.5">
          {Object.entries(factors).map(([key, val]) => (
            <FactorBar
              key={key}
              label={t.factorNames[key] ?? key}
              value={val}
              tooltip={t.factorTips[key]}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SolunarAccordion({ windows, lang, userTz }: {
  windows: SolunarWindow[];
  lang: string;
  userTz: string;
}) {
  const [open, setOpen] = useState(false);
  const label = lang === "en" ? "Solunar Windows" : lang === "kz" ? "Солунарлық уақыт" : "Солунарные окна";
  return (
    <div className="rounded-xl bg-slate-900 border border-slate-800/60 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-left"
      >
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
        <span className="text-slate-500"><ChevronIcon open={open} /></span>
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-2 border-t border-slate-800/60 pt-2.5">
          {windows.map((w, i) => {
            const start = new Date(w.start).toLocaleTimeString(
              lang === "en" ? "en" : "ru",
              { hour: "2-digit", minute: "2-digit", timeZone: userTz }
            );
            const end = new Date(w.end).toLocaleTimeString(
              lang === "en" ? "en" : "ru",
              { hour: "2-digit", minute: "2-digit", timeZone: userTz }
            );
            const isMajor = w.type === "major";
            return (
              <div key={i} className="flex items-center gap-2">
                <span className="text-sm shrink-0">{isMajor ? "🌕" : "🌙"}</span>
                <span
                  className="text-xs font-semibold px-1.5 py-0.5 rounded-md shrink-0"
                  style={{
                    background: isMajor ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.12)",
                    color: isMajor ? "#10b981" : "#f59e0b",
                  }}
                >
                  {isMajor
                    ? (lang === "en" ? "Major" : lang === "kz" ? "Негізгі" : "Major")
                    : (lang === "en" ? "Minor" : lang === "kz" ? "Кіші" : "Minor")}
                </span>
                <span className="text-xs text-white font-mono ml-auto">{start}–{end}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function PulsePanel({
  lat, lon, locationName, selectedSpecies, onSpeciesChange,
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
    fetchBite(lat, lon, selectedSpecies, lang)
      .then(setData)
      .catch(() => setError(t.apiError))
      .finally(() => setLoading(false));
  }, [lat, lon, selectedSpecies, lang, t.apiError]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const bestTime = data
    ? new Date(data.best_window.time).toLocaleString(lang === "en" ? "en" : "ru", {
      weekday: "short", hour: "2-digit", minute: "2-digit", timeZone: userTz,
    })
    : null;

  const speciesName = (s: SpeciesItem) =>
    lang === "en" ? s.name : lang === "kz" ? s.name_kz || s.name_ru : s.name_ru;

  const currentSpeciesMeta = species.find((s) => s.key === selectedSpecies);
  const inHabitat = currentSpeciesMeta
    ? isInHabitat(lat, lon, currentSpeciesMeta.habitat_zones ?? [])
    : true;

  return (
    <aside className="w-full flex flex-col bg-slate-950 overflow-y-auto overflow-x-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-slate-800/60 shrink-0">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="min-w-0">
            {locationName ? (
              <p className="text-base font-bold text-white leading-tight truncate">
                {locationName}
              </p>
            ) : (
              <p className="text-base font-bold text-white">
                {lat.toFixed(4)}, {lon.toFixed(4)}
              </p>
            )}
            <p className="text-xs text-slate-500 mt-0.5">
              {lat.toFixed(4)}, {lon.toFixed(4)}
            </p>
          </div>

          {/* Copy link */}
          <button
            onClick={handleCopy}
            title={copied ? t.linkCopied : t.copyLink}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-all shrink-0"
          >
            {copied ? (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7l4 4 6-6" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5.5 2.5h-3a1 1 0 00-1 1v8a1 1 0 001 1h7a1 1 0 001-1v-3M8 1h5v5M12.5 1.5l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </div>

        {/* Species chips */}
        {species.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
            {species.map((s) => (
              <button
                key={s.key}
                onClick={() => onSpeciesChange(s.key)}
                className={[
                  "shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition-all whitespace-nowrap",
                  selectedSpecies === s.key
                    ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                    : "bg-slate-800/60 border-slate-700/50 text-slate-400 hover:text-white hover:border-slate-500",
                ].join(" ")}
              >
                {speciesName(s)}
              </button>
            ))}
          </div>
        )}
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

            {/* Daily rating + Moon phase — Garmin-style day overview */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-slate-900 border border-slate-800/60 p-3 text-center">
                <p className="text-xs text-slate-500 font-medium mb-1">{t.dailyRating}</p>
                <p className="text-xl font-bold"
                  style={{
                    color: data.daily_rating >= 80 ? "#10b981"
                      : data.daily_rating >= 60 ? "#22c55e"
                        : data.daily_rating >= 40 ? "#f59e0b" : "#ef4444"
                  }}
                >
                  {data.daily_rating}%
                </p>
              </div>
              <div className="rounded-xl bg-slate-900 border border-slate-800/60 p-3 text-center">
                <p className="text-xs text-slate-500 font-medium mb-1">{t.moonPhase}</p>
                <p className="text-xl font-bold text-slate-200">
                  {Math.round(data.moon_phase_pct)}%
                </p>
              </div>
            </div>

            <BiteGauge index={data.current.index} label={data.current.label} />

            {/* AI Advice */}
            {data.advice && (
              <div className="rounded-xl border border-violet-500/25 bg-violet-500/5 p-3.5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm">🤖</span>
                  <p className="text-xs font-semibold text-violet-400">
                    {lang === "en" ? "AI Fishing Tip" : lang === "kz" ? "AI кеңесі" : "Совет от ИИ"}
                  </p>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{data.advice}</p>
              </div>
            )}

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

            {/* Factors — collapsible */}
            <FactorsAccordion factors={data.current.factors as unknown as Record<string, number>} t={t} />

            {/* Solunar windows — collapsible, technical detail */}
            {data.solunar_windows?.length > 0 && (
              <SolunarAccordion
                windows={data.solunar_windows}
                lang={lang}
                userTz={userTz}
              />
            )}

            {data.forecast.length > 0 && <ForecastChart forecast={data.forecast} />}
          </div>
        )}
      </div>
    </aside>
  );
}
