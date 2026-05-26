"use client";

import { useEffect, useState } from "react";
import { fetchNowAndNext } from "@/lib/api";
import { useLang } from "@/lib/LangContext";
import type { NextItem, NowAndNextResult, NowItem } from "@/lib/types";

interface Props {
  lat: number;
  lon: number;
  onSelectSpecies: (key: string) => void;
}

function speciesDisplay(
  item: { name: string; name_ru: string; name_kz: string },
  lang: string
) {
  if (lang === "en") return item.name;
  if (lang === "kz") return item.name_kz || item.name_ru;
  return item.name_ru;
}

const USER_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

function formatClock(iso: string, lang: string) {
  return new Date(iso).toLocaleTimeString(lang === "en" ? "en" : "ru", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: USER_TZ,
  });
}

function formatRelative(hoursUntil: number, t: {
  inHours: string;
  inHoursMinutes: string;
  inMinutes: string;
}) {
  const totalMin = Math.max(0, Math.round(hoursUntil * 60));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return t.inMinutes.replace("{m}", m.toString());
  if (m === 0) return t.inHours.replace("{h}", h.toString());
  return t.inHoursMinutes.replace("{h}", h.toString()).replace("{m}", m.toString());
}

function indexColor(idx: number) {
  if (idx >= 80) return "#10b981";
  if (idx >= 60) return "#22c55e";
  if (idx >= 40) return "#f59e0b";
  return "#ef4444";
}

function NowCard({ item, lang, onClick }: { item: NowItem; lang: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl bg-slate-900 border border-emerald-500/20 hover:border-emerald-500/40 transition-all p-3 flex items-center gap-3"
    >
      <div className="shrink-0 w-12 h-12 rounded-full flex flex-col items-center justify-center"
        style={{ background: `${indexColor(item.index)}1A`, border: `1px solid ${indexColor(item.index)}40` }}
      >
        <span className="text-base font-bold leading-none" style={{ color: indexColor(item.index) }}>
          {item.index}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-white truncate">{speciesDisplay(item, lang)}</p>
          {item.solunar_period === "major" && (
            <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-yellow-400/15 text-yellow-400 border border-yellow-400/25 uppercase tracking-wide shrink-0">
              Major
            </span>
          )}
          {item.solunar_period === "minor" && (
            <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-blue-400/15 text-blue-400 border border-blue-400/25 uppercase tracking-wide shrink-0">
              Minor
            </span>
          )}
        </div>
        {item.hint && (
          <p className="text-xs text-slate-400 leading-snug mt-0.5 line-clamp-2">{item.hint}</p>
        )}
      </div>
    </button>
  );
}

function NextCard({ item, lang, t, onClick }: {
  item: NextItem;
  lang: string;
  t: { inHours: string; inHoursMinutes: string; inMinutes: string };
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl bg-slate-900 border border-slate-800/60 hover:border-slate-600 transition-all p-3 flex items-center gap-3"
    >
      <div className="shrink-0 w-12 h-12 rounded-xl bg-slate-800/60 flex flex-col items-center justify-center">
        <span className="text-[10px] font-medium text-slate-500 leading-none">peak</span>
        <span className="text-base font-bold leading-none mt-1" style={{ color: indexColor(item.peak_index) }}>
          {item.peak_index}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-bold text-white truncate">{speciesDisplay(item, lang)}</p>
          {item.solunar_period === "major" && (
            <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-yellow-400/15 text-yellow-400 border border-yellow-400/25 uppercase tracking-wide">
              Major
            </span>
          )}
          {item.solunar_period === "minor" && (
            <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-blue-400/15 text-blue-400 border border-blue-400/25 uppercase tracking-wide">
              Minor
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-0.5 tabular-nums">
          <span className="text-emerald-400 font-semibold">{formatRelative(item.hours_until, t)}</span>
          <span className="text-slate-600 mx-1.5">·</span>
          {formatClock(item.window_start, lang)}–{formatClock(item.window_end, lang)}
        </p>
      </div>
    </button>
  );
}

export default function NowAndNext({ lat, lon, onSelectSpecies }: Props) {
  const { t, lang } = useLang();
  const [data, setData] = useState<NowAndNextResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchNowAndNext(lat, lon, lang)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [lat, lon, lang]);

  if (loading) {
    return (
      <div className="rounded-xl bg-slate-900 border border-slate-800/60 p-3">
        <div className="h-3 w-24 bg-slate-800 rounded-full animate-pulse mb-3" />
        <div className="space-y-2">
          <div className="h-16 bg-slate-800/50 rounded-xl animate-pulse" />
          <div className="h-16 bg-slate-800/50 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const hasNow = data.now.length > 0;
  const hasNext = data.next.length > 0;

  if (!hasNow && !hasNext) return null;

  return (
    <div className="space-y-3">
      {/* Now biting */}
      <div>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <span>🎯</span>
          <span>{t.nowBiting}</span>
        </h3>
        {hasNow ? (
          <div className="space-y-2">
            {data.now.map((item) => (
              <NowCard
                key={item.species}
                item={item}
                lang={lang}
                onClick={() => onSelectSpecies(item.species)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-slate-900 border border-slate-800/60 px-3 py-2.5">
            <p className="text-xs text-slate-500 leading-relaxed">{t.nowBitingEmpty}</p>
          </div>
        )}
      </div>

      {/* Next windows */}
      {hasNext && (
        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <span>⏭️</span>
            <span>{t.nextWindows}</span>
          </h3>
          <div className="space-y-2">
            {data.next.map((item) => (
              <NextCard
                key={item.species + item.window_start}
                item={item}
                lang={lang}
                t={t}
                onClick={() => onSelectSpecies(item.species)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
