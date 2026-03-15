"use client";

import { useLang } from "@/lib/LangContext";

interface Props {
  index: number;
  label: "Poor" | "Fair" | "Good" | "Excellent";
}

function indexTheme(index: number) {
  if (index >= 80) return { ring: "#10b981", glow: "rgba(16,185,129,0.35)", text: "#10b981" };
  if (index >= 60) return { ring: "#22c55e", glow: "rgba(34,197,94,0.25)", text: "#22c55e" };
  if (index >= 40) return { ring: "#f59e0b", glow: "rgba(245,158,11,0.25)", text: "#f59e0b" };
  return { ring: "#ef4444", glow: "rgba(239,68,68,0.25)", text: "#ef4444" };
}

export default function BiteGauge({ index, label }: Props) {
  const { t } = useLang();
  const { ring, glow, text } = indexTheme(index);
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (circumference * index) / 100;
  const localLabel = t.labels[label];

  return (
    <div className="flex flex-col items-center py-4">
      <div
        className="relative w-32 h-32 md:w-40 md:h-40 rounded-full"
        style={{ filter: `drop-shadow(0 0 18px ${glow})` }}
      >
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="#1e293b" strokeWidth="8" />
          <circle
            cx="60" cy="60" r={radius}
            fill="none"
            stroke={ring}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 0.7s cubic-bezier(0.4,0,0.2,1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl md:text-5xl font-bold tabular-nums" style={{ color: text }}>
            {index}
          </span>
          <span className="text-xs text-slate-500 mt-0.5 font-medium">/ 100</span>
        </div>
      </div>
      <span
        className="mt-3 text-base font-bold tracking-wide uppercase"
        style={{ color: text, letterSpacing: "0.08em" }}
      >
        {localLabel}
      </span>
    </div>
  );
}
