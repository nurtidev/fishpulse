"use client";

import { useLang } from "@/lib/LangContext";
import type { Lang } from "@/lib/i18n";

const LANGS: { code: Lang; label: string }[] = [
  { code: "ru", label: "РУ" },
  { code: "kz", label: "ҚАЗ" },
  { code: "en", label: "EN" },
];

export default function LanguageSwitcher() {
  const { lang, setLang } = useLang();

  return (
    <div className="flex items-center gap-0.5 bg-slate-800/60 rounded-lg p-0.5 border border-slate-700/50">
      {LANGS.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => setLang(code)}
          className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-150 ${
            lang === code
              ? "bg-slate-600 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
