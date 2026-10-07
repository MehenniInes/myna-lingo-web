"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "./language-provider";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface Language {
  id: string;
  name: string;
  code: string;
}

export default function Home() {
  const { locale, setLocale, t } = useLanguage();
  const [user, setUser] = useState<{ fullName: string; role: string } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [languages, setLanguages] = useState<Language[]>([]);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("user");
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/languages`)
      .then((r) => r.json())
      .then((data) => setLanguages(Array.isArray(data) ? data : []))
      .catch(() => setLanguages([]));
  }, []);

  function handleLogout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    setUser(null);
  }

  return (
    <main className="min-h-screen flex flex-col">
      {/* NAVBAR */}
      <nav className="flex items-center justify-between px-8 py-6">
        <div className="text-2xl font-display font-bold text-myna-charcoal">Myna Lingo</div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setLocale(locale === "en" ? "ar" : locale === "ar" ? "fr" : "en")}
            className="px-4 py-2 rounded-full font-medium text-myna-charcoal border border-myna-charcoal/20 hover:bg-myna-yellow/20 transition"
          >
            {locale === "en" ? "AR" : locale === "ar" ? "FR" : "EN"}
          </button>

          {!mounted ? (
            <div className="w-40 h-8" />
          ) : user ? (
            <>
              <a href="/become-a-teacher" className="px-5 py-2 rounded-full font-medium text-myna-charcoal hover:bg-myna-yellow/20 transition">{t("home.becomeTeacher")}</a>
              <span className="text-myna-charcoal font-medium">{t("home.hi")}, {user.fullName}</span>
              <button onClick={handleLogout} className="px-5 py-2 rounded-full font-medium text-myna-charcoal hover:bg-myna-yellow/20 transition">{t("home.logOut")}</button>
            </>
          ) : (
            <>
              <a href="/login" className="px-5 py-2 rounded-full font-medium text-myna-charcoal hover:bg-myna-yellow/20 transition">{t("home.logIn")}</a>
              <a href="/register" className="px-5 py-2 rounded-full font-medium bg-myna-orange text-white hover:bg-myna-orange/90 transition">{t("home.signUp")}</a>
            </>
          )}
        </div>
      </nav>

      {/* HERO */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-20">
        <h1 className="font-display text-5xl md:text-6xl font-bold text-myna-charcoal max-w-3xl leading-tight">{t("home.heroTitle")}</h1>
        <p className="mt-6 text-lg text-myna-charcoal/70 max-w-xl">{t("home.heroSubtitle")}</p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <a href="/register?role=student" className="px-8 py-4 rounded-full font-semibold bg-myna-orange text-white text-lg hover:bg-myna-orange/90 transition">{t("home.registerStudent")}</a>
          <a href="/register?role=teacher" className="px-8 py-4 rounded-full font-semibold bg-myna-yellow text-myna-charcoal text-lg hover:bg-myna-yellow/90 transition">{t("home.registerTeacher")}</a>
        </div>
      </section>

      {/* POPULAR LANGUAGES */}
      {languages.length > 0 && (
        <section className="px-6 py-16 bg-myna-white">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="font-display text-3xl font-bold text-myna-charcoal">{t("home.popularLangTitle")}</h2>
            <p className="text-myna-charcoal/70 mt-2">{t("home.popularLangSubtitle")}</p>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              {languages.map((lang) => (
                <a
                  key={lang.id}
                  href={`/find-teacher?languageId=${lang.id}`}
                  className="px-6 py-3 rounded-full bg-myna-cream text-myna-charcoal font-medium hover:bg-myna-yellow/30 transition border border-myna-charcoal/10"
                >
                  {lang.name}
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* HOW IT WORKS */}
      <section className="px-6 py-16">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="font-display text-3xl font-bold text-myna-charcoal">{t("home.howItWorksTitle")}</h2>
          <div className="mt-10 grid md:grid-cols-3 gap-6">
            <div className="bg-myna-white rounded-3xl shadow-sm p-8">
              <div className="w-10 h-10 rounded-full bg-myna-orange text-white flex items-center justify-center font-bold mx-auto mb-4">1</div>
              <h3 className="font-display text-xl font-bold text-myna-charcoal">{t("home.step1Title")}</h3>
              <p className="text-myna-charcoal/70 mt-2 text-sm">{t("home.step1Desc")}</p>
            </div>
            <div className="bg-myna-white rounded-3xl shadow-sm p-8">
              <div className="w-10 h-10 rounded-full bg-myna-orange text-white flex items-center justify-center font-bold mx-auto mb-4">2</div>
              <h3 className="font-display text-xl font-bold text-myna-charcoal">{t("home.step2Title")}</h3>
              <p className="text-myna-charcoal/70 mt-2 text-sm">{t("home.step2Desc")}</p>
            </div>
            <div className="bg-myna-white rounded-3xl shadow-sm p-8">
              <div className="w-10 h-10 rounded-full bg-myna-orange text-white flex items-center justify-center font-bold mx-auto mb-4">3</div>
              <h3 className="font-display text-xl font-bold text-myna-charcoal">{t("home.step3Title")}</h3>
              <p className="text-myna-charcoal/70 mt-2 text-sm">{t("home.step3Desc")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* FOR TEACHERS */}
      <section className="px-6 py-16 bg-myna-charcoal">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-3xl font-bold text-myna-cream">{t("home.teachersTitle")}</h2>
          <p className="text-myna-cream/70 mt-3">{t("home.teachersSubtitle")}</p>
          <a
            href={user ? "/become-a-teacher" : "/register?role=teacher"}
            className="mt-8 inline-block px-8 py-4 rounded-full font-semibold bg-myna-yellow text-myna-charcoal text-lg hover:bg-myna-yellow/90 transition"
          >
            {t("home.teachersCta")}
          </a>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-6 py-20 text-center">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-myna-charcoal max-w-2xl mx-auto">{t("home.ctaTitle")}</h2>
        <p className="text-myna-charcoal/70 mt-3">{t("home.ctaSubtitle")}</p>
        <a
          href={user ? "/find-teacher" : "/register"}
          className="mt-8 inline-block px-8 py-4 rounded-full font-semibold bg-myna-orange text-white text-lg hover:bg-myna-orange/90 transition"
        >
          {t("home.ctaButton")}
        </a>
      </section>

      {/* FOOTER */}
      <footer className="px-8 py-10 border-t border-myna-charcoal/10 mt-auto">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <div className="text-xl font-display font-bold text-myna-charcoal">Myna Lingo</div>
            <p className="text-sm text-myna-charcoal/60">{t("home.footerTagline")}</p>
          </div>
          <p className="text-sm text-myna-charcoal/50">© {new Date().getFullYear()} Myna Lingo. {t("home.footerRights")}</p>
        </div>
      </footer>
    </main>
  );
}