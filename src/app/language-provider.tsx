"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { Locale, LOCALE_DIR, t as translate, TranslationKey } from "@/lib/i18n";

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  dir: "ltr" | "rtl";
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const VALID: Locale[] = ["en", "fr", "ar"];

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("locale") as Locale | null;
    if (stored && VALID.includes(stored)) {
      setLocaleState(stored);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.dir = LOCALE_DIR[locale];
    document.documentElement.lang = locale;
  }, [locale, mounted]);

  function setLocale(newLocale: Locale) {
    localStorage.setItem("locale", newLocale);
    setLocaleState(newLocale);
  }

  function t(key: TranslationKey, vars?: Record<string, string | number>) {
    return translate(locale, key, vars);
  }

  return (
    <LanguageContext.Provider
      value={{ locale, setLocale, dir: LOCALE_DIR[locale], t }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}