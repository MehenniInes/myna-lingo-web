"use client";

import { useLanguage } from "@/app/language-provider";
import { Locale, LOCALE_LABELS } from "@/lib/i18n";

const ORDER: Locale[] = ["en", "fr", "ar"];

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();

  return (
    <div className="flex items-center rounded-full border border-myna-charcoal/20 overflow-hidden">
      {ORDER.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l)}
          className={`px-3 py-1 text-sm font-medium transition ${
            l === locale
              ? "bg-myna-orange text-white"
              : "text-myna-charcoal hover:bg-myna-yellow/20"
          }`}
        >
          {LOCALE_LABELS[l]}
        </button>
      ))}
    </div>
  );
}