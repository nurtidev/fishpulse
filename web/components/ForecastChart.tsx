"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ReferenceLine, ResponsiveContainer,
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  Cell,
} from "recharts";
import type { BiteResult } from "@/lib/types";
import { useLang } from "@/lib/LangContext";

interface Props { forecast: BiteResult[]; tz: string }

function barColor(index: number) {
  if (index >= 80) return "#10b981";
  if (index >= 60) return "#22c55e";
  if (index >= 40) return "#f59e0b";
  return "#ef4444";
}

// hourInTz returns the hour-of-day (0-23) at the given timezone.
function hourInTz(iso: string, tz: string): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit", hour12: false, timeZone: tz,
  }).formatToParts(new Date(iso));
  const h = parts.find((p) => p.type === "hour")?.value ?? "0";
  return parseInt(h, 10) % 24;
}

function formatHour(iso: string, tz: string) {
  const h = hourInTz(iso, tz);
  if (h === 0) return new Date(iso).toLocaleDateString("ru", { weekday: "short", timeZone: tz });
  if (h % 6 === 0) return `${h}:00`;
  return "";
}

const CustomTooltip = ({ active, payload, tz }: any) => {
  if (!active || !payload?.length) return null;
  const d: BiteResult = payload[0].payload;
  const time = new Date(d.time).toLocaleString("ru", {
    weekday: "short", hour: "2-digit", minute: "2-digit", timeZone: tz,
  });
  const color = barColor(d.index);
  return (
    <div className="rounded-xl bg-slate-800 border border-slate-700/60 p-3 text-sm shadow-2xl">
      <div className="text-slate-400 text-xs mb-1">{time}</div>
      <div className="font-bold text-lg" style={{ color }}>{d.index}/100</div>
    </div>
  );
};

export default function ForecastChart({ forecast, tz }: Props) {
  const { t } = useLang();
  return (
    <div>
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
        {t.forecast48h}
      </h3>
      <ResponsiveContainer width="100%" height={130}>
        <BarChart data={forecast} barCategoryGap="18%">
          <XAxis
            dataKey="time"
            tickFormatter={(iso: string) => formatHour(iso, tz)}
            tick={{ fill: "#64748b", fontSize: 10 }}
            axisLine={false} tickLine={false}
          />
          <YAxis domain={[0, 100]} hide />
          <Tooltip content={<CustomTooltip tz={tz} />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
          <ReferenceLine y={60} stroke="#1e293b" strokeDasharray="3 3" />
          <Bar dataKey="index" radius={[4, 4, 0, 0]}>
            {forecast.map((entry, i) => (
              // eslint-disable-next-line @typescript-eslint/no-deprecated
              <Cell key={i} fill={barColor(entry.index)} opacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
