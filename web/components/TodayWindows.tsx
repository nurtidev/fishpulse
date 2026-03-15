"use client";

import type { BiteResult } from "@/lib/types";
import { useLang } from "@/lib/LangContext";

interface Props {
  forecast: BiteResult[];
}

interface Window {
  start: string;
  end: string;
  peak: number;
  tier: "excellent" | "good" | "fair";
  period: "major" | "minor" | "";
}

function findWindows(forecast: BiteResult[]): Window[] {
  const todayStr = new Date().toLocaleDateString("sv");
  const todayHours = forecast.filter((h) => {
    const localDate = new Date(h.time).toLocaleDateString("sv");
    return localDate === todayStr;
  });

  if (todayHours.length === 0) return [];

  const windows: Window[] = [];
  let i = 0;

  while (i < todayHours.length) {
    const h = todayHours[i];
    if (h.index < 65) { i++; continue; }

    const start = h.time;
    let peak = h.index;
    let topPeriod: "major" | "minor" | "" = h.solunar_period;
    let j = i + 1;

    while (j < todayHours.length && todayHours[j].index >= 65) {
      if (todayHours[j].index > peak) peak = todayHours[j].index;
      // Prefer major > minor > ""
      if (topPeriod !== "major") {
        if (todayHours[j].solunar_period === "major") topPeriod = "major";
        else if (todayHours[j].solunar_period === "minor" && topPeriod === "") topPeriod = "minor";
      }
      j++;
    }

    const end = todayHours[j - 1].time;
    const tier: Window["tier"] =
      peak >= 80 ? "excellent" : peak >= 65 ? "good" : "fair";

    windows.push({ start, end, peak, tier, period: topPeriod });
    i = j;
  }

  return windows;
}

const USER_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ru", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: USER_TZ,
  });
}

const TIER_STYLES = {
  excellent: {
    dot: "bg-emerald-500",
    badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
    bar: "bg-emerald-500",
  },
  good: {
    dot: "bg-green-500",
    badge: "bg-green-500/15 text-green-400 border-green-500/25",
    bar: "bg-green-500",
  },
  fair: {
    dot: "bg-amber-500",
    badge: "bg-amber-500/15 text-amber-400 border-amber-500/25",
    bar: "bg-amber-500",
  },
};

export default function TodayWindows({ forecast }: Props) {
  const { t } = useLang();
  const windows = findWindows(forecast);

  if (windows.length === 0) return null;

  return (
    <div>
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
        🕐 {t.todayWindows}
      </h3>
      <div className="space-y-2">
        {windows.map((w, i) => {
          const s = TIER_STYLES[w.tier];
          return (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl bg-slate-900 border border-slate-800/60 px-3 py-2.5"
            >
              {/* Dot */}
              <div className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`} />

              {/* Time range */}
              <div className="flex-1 min-w-0">
                <span className="text-sm font-semibold text-white tabular-nums">
                  {formatTime(w.start)}
                  <span className="text-slate-500 mx-1.5">—</span>
                  {formatTime(w.end)}
                </span>
              </div>

              {/* Period + peak + label */}
              <div className="flex items-center gap-1.5 shrink-0">
                {w.period === "major" && (
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-yellow-400/15 text-yellow-400 border border-yellow-400/25 uppercase tracking-wide">
                    {t.solunarMajor}
                  </span>
                )}
                {w.period === "minor" && (
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-blue-400/15 text-blue-400 border border-blue-400/25 uppercase tracking-wide">
                    {t.solunarMinor}
                  </span>
                )}
                <span className="text-xs font-bold text-slate-300">{w.peak}</span>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full border ${s.badge}`}
                >
                  {t.windowLabels[w.tier]}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
