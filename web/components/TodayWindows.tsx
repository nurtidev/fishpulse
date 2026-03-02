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
}

function findWindows(forecast: BiteResult[]): Window[] {
  // Filter to today's hours using LOCAL date (not UTC)
  const todayStr = new Date().toLocaleDateString("sv"); // "YYYY-MM-DD" in local tz
  const todayHours = forecast.filter((h) => {
    const localDate = new Date(h.time).toLocaleDateString("sv");
    return localDate === todayStr;
  });

  if (todayHours.length === 0) return [];

  const windows: Window[] = [];
  let i = 0;

  while (i < todayHours.length) {
    const h = todayHours[i];
    if (h.index < 55) { i++; continue; }

    // Start of a window — find how far it extends
    const start = h.time;
    let peak = h.index;
    let j = i + 1;

    while (j < todayHours.length && todayHours[j].index >= 55) {
      if (todayHours[j].index > peak) peak = todayHours[j].index;
      j++;
    }

    const end = todayHours[j - 1].time;
    const tier: Window["tier"] =
      peak >= 80 ? "excellent" : peak >= 65 ? "good" : "fair";

    windows.push({ start, end, peak, tier });
    i = j;
  }

  return windows;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ru", {
    hour: "2-digit",
    minute: "2-digit",
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

              {/* Peak + label */}
              <div className="flex items-center gap-2 shrink-0">
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
