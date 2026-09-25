"use client";

import { useState } from "react";
import { useLanguage } from "./language-provider";

const content = {
  en: {
    logIn: "Log In",
    signUp: "Sign Up",
    logOut: "Log Out",
    hi: "Hi",
    heroTitle: "Start Your Language Learning Journey Today",
    heroSubtitle: "Learn languages by actually speaking, with real teachers, real conversations, real progress.",
    registerStudent: "Register as a Student",
    registerTeacher: "Register as a Teacher",
  },
  ar: {
    logIn: "تسجيل الدخول",
    signUp: "إنشاء حساب",
    logOut: "تسجيل الخروج",
    hi: "أهلاً",
    heroTitle: "ابدأ رحلة تعلم اللغات اليوم",
    heroSubtitle: "تعلّم اللغات من خلال التحدث الفعلي، مع أساتذة حقيقيين ومحادثات حقيقية وتقدّم حقيقي.",
    registerStudent: "التسجيل كطالب",
    registerTeacher: "التسجيل كأستاذ",
  },
};

export default function Home() {
  const { locale, setLocale } = useLanguage();
  const t = content[locale];
  const [user, setUser] = useState<{ fullName: string; role: string } | null>(() => {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  function handleLogout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    setUser(null);
  }

  return (
    <main className="min-h-screen flex flex-col">
      <nav className="flex items-center justify-between px-8 py-6">
        <div className="text-2xl font-display font-bold text-myna-charcoal">Myna Lingo</div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setLocale(locale === "en" ? "ar" : "en")}
            className="px-4 py-2 rounded-full font-medium text-myna-charcoal border border-myna-charcoal/20 hover:bg-myna-yellow/20 transition"
          >
            {locale === "en" ? "AR" : "EN"}
          </button>
          {user ? (
            <>
              <span className="text-myna-charcoal font-medium">{t.hi}, {user.fullName}</span>
              <button onClick={handleLogout} className="px-5 py-2 rounded-full font-medium text-myna-charcoal hover:bg-myna-yellow/20 transition">{t.logOut}</button>
            </>
          ) : (
            <>
              <a href="/login" className="px-5 py-2 rounded-full font-medium text-myna-charcoal hover:bg-myna-yellow/20 transition">{t.logIn}</a>
              <a href="/register" className="px-5 py-2 rounded-full font-medium bg-myna-orange text-white hover:bg-myna-orange/90 transition">{t.signUp}</a>
            </>
          )}
        </div>
      </nav>

      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
        <h1 className="font-display text-5xl md:text-6xl font-bold text-myna-charcoal max-w-3xl leading-tight">{t.heroTitle}</h1>
        <p className="mt-6 text-lg text-myna-charcoal/70 max-w-xl">{t.heroSubtitle}</p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <a href="/register?role=student" className="px-8 py-4 rounded-full font-semibold bg-myna-orange text-white text-lg hover:bg-myna-orange/90 transition">{t.registerStudent}</a>
          <a href="/register?role=teacher" className="px-8 py-4 rounded-full font-semibold bg-myna-yellow text-myna-charcoal text-lg hover:bg-myna-yellow/90 transition">{t.registerTeacher}</a>
        </div>
      </section>
    </main>
  );
}