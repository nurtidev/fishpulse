"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/lib/LangContext";

export default function WelcomeModal() {
  const { t } = useLang();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show every time — small delay so page-load click events don't instantly close it
    const timer = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const handleStart = () => {
    setVisible(false);
  };

  if (!visible) return null;

  const w = t.welcome;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop (не закрывает по клику — пользователь должен нажать кнопку) */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full sm:max-w-md bg-slate-900 border border-slate-700/60 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-y-auto max-h-[92dvh] sm:max-h-[90dvh]">
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 bg-slate-700 rounded-full" />
        </div>

        <div className="px-5 pt-4 pb-6 sm:px-6 sm:pt-6">
          {/* Header */}
          <div className="text-center mb-5">
            <div className="text-4xl mb-3">🎣</div>
            <h1 className="text-xl font-bold text-white mb-1">{w.title}</h1>
            <p className="text-xs text-slate-400">{w.subtitle}</p>
          </div>

          {/* Bite Index explanation */}
          <div className="rounded-xl bg-slate-800/60 border border-slate-700/40 p-4 mb-4">
            <h2 className="text-sm font-semibold text-white mb-1.5">{w.indexTitle}</h2>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">{w.indexDesc}</p>
            <div className="grid grid-cols-1 gap-1.5">
              {w.factors.map((f) => (
                <div key={f.label} className="flex items-center gap-2.5">
                  <span className="text-base w-6 text-center shrink-0">{f.icon}</span>
                  <span className="text-xs font-medium text-white w-24 shrink-0">{f.label}</span>
                  <span className="text-xs text-slate-500">{f.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Steps */}
          <div className="mb-5">
            <h2 className="text-sm font-semibold text-white mb-3">{w.stepsTitle}</h2>
            <div className="space-y-2.5">
              {w.steps.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-emerald-400">{i + 1}</span>
                  </div>
                  <div className="flex items-start gap-2 flex-1">
                    <span className="text-base shrink-0 leading-5">{step.icon}</span>
                    <p className="text-xs text-slate-300 leading-relaxed">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tip */}
          <p className="text-xs text-slate-500 bg-slate-800/40 rounded-lg px-3 py-2 mb-5 leading-relaxed">
            {w.tip}
          </p>

          {/* CTA */}
          <button
            onClick={handleStart}
            className="w-full bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-white font-semibold text-sm rounded-xl py-3.5 transition-colors"
          >
            {w.startBtn} →
          </button>
        </div>
      </div>
    </div>
  );
}
