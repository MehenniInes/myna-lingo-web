"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "./language-provider";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import {
  MessageCircle, Video, Star, ArrowRight, Sparkles, CheckCircle2, Wifi,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface RealTeacher {
  id: string;
  firstName: string | null;
  lastName: string | null;
  bio: string | null;
  profilePhotoUrl: string | null;
  experienceYears: number | null;
  isOnline: boolean;
  requestedHourlyRateDA: number | null;
  user: { fullName: string };
  teacherLanguages: {
    id: string;
    serviceType: string;
    language: { id: string; name: string };
  }[];
}

export default function Home() {
  const { t } = useLanguage();
  const [user, setUser] = useState<{ fullName: string; role: string } | null>(null);
  const [teachers, setTeachers] = useState<RealTeacher[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/teachers`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setTeachers(data.slice(0, 4));
      })
      .catch(() => {});
  }, []);

  function handleLogout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    setUser(null);
  }

  const year = new Date().getFullYear();

  return (
    <main className="min-h-screen bg-cream">
      {/* NAV */}
      <nav className="sticky top-0 z-40 bg-cream/95 backdrop-blur border-b border-myna-charcoal/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <a href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-myna-yellow flex items-center justify-center overflow-hidden border border-myna-charcoal/20">
              <img src="/myna-logo.png" alt="Myna Lingo" className="w-full h-full object-cover" />
            </div>
            <span className="font-display font-bold text-lg text-myna-charcoal hidden sm:inline">
              MYNA LINGO
            </span>
          </a>

          <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-myna-charcoal/70">
            <a href="#how-it-works" className="hover:text-myna-charcoal transition">
              {t("home.navHow")}
            </a>
            <a href="#teachers" className="hover:text-myna-charcoal transition">
              {t("home.navTeachers")}
            </a>
                          <a href="/privacy" className="hover:text-white transition">
                {t("legal.privacyTitle")}
              </a>
              <a href="/terms" className="hover:text-white transition">
                {t("legal.termsTitle")}
              </a>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            {mounted ? (
              user ? (
                <>
                  <a href="/student" className="hidden sm:inline px-4 py-2 rounded-full text-sm font-medium text-myna-charcoal hover:bg-myna-yellow/30 transition">
                    {t("home.hi")}, {user.fullName.split(" ")[0]}
                  </a>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 rounded-full text-sm font-medium text-myna-charcoal hover:bg-myna-yellow/30 transition"
                  >
                    {t("home.logOut")}
                  </button>
                </>
              ) : (
                <>
                  <a href="/login" className="hidden sm:inline px-4 py-2 rounded-full text-sm font-medium text-myna-charcoal hover:bg-myna-yellow/30 transition">
                    {t("home.logIn")}
                  </a>
                  <a href="/register" className="px-5 py-2 rounded-full text-sm font-semibold bg-myna-orange text-white hover:bg-myna-orange/90 transition">
                    {t("home.signUp")}
                  </a>
                </>
              )
            ) : null}
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="px-6 pt-12 pb-16 md:pt-20 md:pb-24">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-myna-yellow/40 text-myna-charcoal text-xs font-bold uppercase tracking-wider">
              <Sparkles size={12} /> {t("home.heroBadge")}
            </span>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-myna-charcoal mt-4 leading-tight">
              {t("home.heroTitle")}
            </h1>
            <p className="text-lg text-myna-charcoal/70 mt-4 max-w-lg">
              {t("home.heroSubtitle")}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <a href="/register?role=student" className="px-7 py-3.5 rounded-full font-semibold bg-myna-orange text-white hover:bg-myna-orange/90 transition flex items-center justify-center gap-2">
                {t("home.registerStudent")}
                <ArrowRight size={16} />
              </a>
              <a href="/become-a-teacher" className="px-7 py-3.5 rounded-full font-semibold bg-white text-myna-charcoal border border-myna-charcoal/15 hover:bg-myna-yellow/20 transition">
                {t("home.registerTeacher")}
              </a>
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="absolute w-72 h-72 md:w-96 md:h-96 rounded-full bg-myna-yellow/40 blur-3xl" />
            <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-full bg-myna-yellow flex items-center justify-center shadow-xl overflow-hidden border-4 border-white">
              <img src="/myna-logo.png" alt="Myna Lingo mascot" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BAR — real facts only */}
      <section className="px-6 pb-16">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: <Video size={18} />, label: t("home.fact1") },
            { icon: <MessageCircle size={18} />, label: t("home.fact2") },
            { icon: <CheckCircle2 size={18} />, label: t("home.fact3") },
            { icon: <Star size={18} />, label: t("home.fact4") },
          ].map((f, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-myna-orange/10 text-myna-orange flex items-center justify-center shrink-0">
                {f.icon}
              </div>
              <p className="text-sm font-medium text-myna-charcoal leading-tight">{f.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="px-6 py-16 bg-white/60">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-xl mx-auto">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-myna-charcoal">
              {t("home.howTitle")}
            </h2>
            <p className="text-myna-charcoal/60 mt-3">
              {t("home.howSubtitle")}
            </p>
          </div>

          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {[
              { n: "01", title: t("home.step1Title"), body: t("home.step1Body") },
              { n: "02", title: t("home.step2Title"), body: t("home.step2Body") },
              { n: "03", title: t("home.step3Title"), body: t("home.step3Body") },
            ].map((s) => (
              <div key={s.n} className="bg-white rounded-3xl shadow-sm p-6">
                <span className="font-display font-bold text-3xl text-myna-orange">
                  {s.n}
                </span>
                <h3 className="font-display font-bold text-lg text-myna-charcoal mt-3">
                  {s.title}
                </h3>
                <p className="text-sm text-myna-charcoal/60 mt-2 leading-relaxed">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REAL TEACHERS */}
      <section id="teachers" className="px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-xl mx-auto">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-myna-charcoal">
              {t("home.teachersTitle")}
            </h2>
            <p className="text-myna-charcoal/60 mt-3">
              {t("home.teachersSubtitle")}
            </p>
          </div>

          {teachers.length === 0 ? (
            <p className="text-center text-myna-charcoal/50 mt-10 text-sm">
              {t("home.teachersEmpty")}
            </p>
          ) : (
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {teachers.map((tc) => {
                const displayName =
                  [tc.firstName, tc.lastName].filter(Boolean).join(" ") || tc.user.fullName;
                const langs = tc.teacherLanguages.map((tl) => tl.language.name);
                return (
                  <a
                    key={tc.id}
                    href={`/teachers/${tc.id}`}
                    className="bg-white rounded-3xl shadow-sm hover:shadow-md transition overflow-hidden group"
                  >
                    <div className="relative aspect-square bg-myna-yellow/30 flex items-center justify-center">
                      {tc.profilePhotoUrl ? (
                        <img
                          src={tc.profilePhotoUrl}
                          alt={displayName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="font-display font-bold text-5xl text-myna-orange">
                          {displayName.charAt(0).toUpperCase()}
                        </span>
                      )}
                      {tc.isOnline && (
                        <span className="absolute top-3 start-3 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                          <Wifi size={10} /> {t("home.online")}
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="font-semibold text-myna-charcoal truncate">
                        {displayName}
                      </p>
                      <p className="text-xs text-myna-charcoal/50 truncate mt-0.5">
                        {langs.join(" · ")}
                      </p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-sm font-bold text-myna-orange">
                          {tc.requestedHourlyRateDA
                            ? `${tc.requestedHourlyRateDA} ${t("home.perHour")}`
                            : "—"}
                        </span>
                        <span className="text-xs font-semibold text-myna-charcoal/60 group-hover:text-myna-orange transition">
                          {t("home.viewProfile")} →
                        </span>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          )}

          <div className="text-center mt-10">
            <a href="/find-teacher" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-myna-charcoal text-white font-semibold text-sm hover:bg-myna-charcoal/90 transition">
              {t("home.ctaBrowse")}
              <ArrowRight size={14} />
            </a>
          </div>
        </div>
      </section>

      {/* TEACHER CTA */}
      <section className="px-6 py-16">
        <div className="max-w-6xl mx-auto bg-gradient-to-br from-myna-orange to-myna-orange/80 rounded-3xl p-8 md:p-12 text-white">
          <div className="grid md:grid-cols-[1fr_auto] gap-8 items-center">
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-bold">
                {t("home.teacherCtaTitle")}
              </h2>
              <p className="text-white/90 mt-2 max-w-xl">
                {t("home.teacherCtaBody")}
              </p>
            </div>
            <a href="/become-a-teacher" className="inline-block px-7 py-3.5 rounded-full bg-white text-myna-orange font-semibold hover:bg-myna-yellow transition whitespace-nowrap">
              {t("home.teacherCtaButton")}
            </a>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-6 py-16 bg-myna-yellow">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-myna-charcoal">
            {t("home.finalCtaTitle")}
          </h2>
          <p className="text-myna-charcoal/70 mt-3">
            {t("home.finalCtaBody")}
          </p>
          <div className="mt-8">
            <a href="/register?role=student" className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-myna-charcoal text-white font-bold hover:bg-myna-charcoal/90 transition">
              {t("home.registerStudent")}
              <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-myna-charcoal text-myna-cream px-6 py-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-myna-yellow flex items-center justify-center overflow-hidden">
                <img src="/myna-logo.png" alt="" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="font-display font-bold">MYNA LINGO</p>
                <p className="text-xs text-myna-cream/60">{t("home.footerTagline")}</p>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-sm text-myna-cream/70">
              <a href="/find-teacher" className="hover:text-white transition">{t("home.navTeachers")}</a>
              <a href="/become-a-teacher" className="hover:text-white transition">{t("home.becomeTeacher")}</a>
              <a href="/login" className="hover:text-white transition">{t("home.logIn")}</a>
              <a href="/register" className="hover:text-white transition">{t("home.signUp")}</a>
            </div>

            <p className="text-xs text-myna-cream/40 text-center md:text-end">
              {t("home.footerRights", { year })}
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}