"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ReferenceLine, ResponsiveContainer,
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  Cell,
} from "recharts";
import type { BiteResult } from "@/lib/types";
import { useLang } from "@/lib/LangContext";

interface Props { forecast: BiteResult[] }

function barColor(index: number) {
  if (index >= 80) return "#10b981";
  if (index >= 60) return "#22c55e";
  if (index >= 40) return "#f59e0b";
  return "#ef4444";
}

function formatHour(iso: string) {
  const d = new Date(iso);
  const h = d.getHours(); // local hours
  if (h === 0) return d.toLocaleDateString("ru", { weekday: "short" });
  if (h % 6 === 0) return `${h}:00`;
  return "";
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d: BiteResult = payload[0].payload;
  const time = new Date(d.time).toLocaleString("ru", {
    weekday: "short", hour: "2-digit", minute: "2-digit", timeZone: "UTC",
  });
  const color = barColor(d.index);
  return (
    <div className="rounded-xl bg-slate-800 border border-slate-700/60 p-3 text-sm shadow-2xl">
      <div className="text-slate-400 text-xs mb-1">{time}</div>
      <div className="font-bold text-lg" style={{ color }}>{d.index}/100</div>
    </div>
  );
};

export default function ForecastChart({ forecast }: Props) {
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
            tickFormatter={formatHour}
            tick={{ fill: "#64748b", fontSize: 10 }}
            axisLine={false} tickLine={false}
          />
          <YAxis domain={[0, 100]} hide />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
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
