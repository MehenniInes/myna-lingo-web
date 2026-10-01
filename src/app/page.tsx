"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Menu, X, ArrowRight, ChevronRight, CheckCircle2,
  Phone, PhoneOff, Mic, Video, MonitorUp,
  Play, Pause, Podcast, Headphones,
  BookOpen, Trophy, Zap, MessageCircle, Wand2, GraduationCap,
} from "lucide-react";
import { useLanguage } from "./language-provider";
import LanguageSwitcher from "@/components/LanguageSwitcher";

interface User { fullName: string; role: string; }
type FeatureTab = "learn" | "listen" | "practice" | "improve";
type MethodStage = 1 | 2 | 3 | 4;

export default function Home() {
  const { t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tab, setTab] = useState<FeatureTab>("learn");
  const [teacherFilter, setTeacherFilter] = useState<string>("all");
  const [methodStage, setMethodStage] = useState<MethodStage>(1);
  const [playingAudio, setPlayingAudio] = useState(false);
  const [logoSpinning, setLogoSpinning] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const [callTeacher, setCallTeacher] = useState<{ name: string; lang: string; flag: string; img: string } | null>(null);
  const [callConnected, setCallConnected] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) { try { setUser(JSON.parse(stored)); } catch {} }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!callOpen) return;
    setCallConnected(false);
    const to = setTimeout(() => setCallConnected(true), 1800);
    return () => clearTimeout(to);
  }, [callOpen]);

  function handleLogout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    setUser(null);
  }

  function spinLogo() {
    setLogoSpinning(true);
    setTimeout(() => setLogoSpinning(false), 800);
  }

  function openCall(name: string, lang: string, flag: string, img: string) {
    setCallTeacher({ name, lang, flag, img });
    setCallOpen(true);
  }

  const year = new Date().getFullYear();

  return (
    <main className="min-h-screen flex flex-col relative">
      <div className="fixed inset-0 bg-pattern pointer-events-none z-0" />

      {/* NAV */}
      <nav className="sticky top-0 z-40 bg-myna-cream/90 backdrop-blur-md border-b-2 border-myna-brown/10 px-4 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <a href="/" className="flex items-center gap-3 group" onClick={spinLogo}>
            <div className={`w-11 h-11 bg-myna-yellow rounded-xl border-2 border-myna-brown flex items-center justify-center overflow-hidden shadow-myna-bold transition-transform ${logoSpinning ? "logo-spin" : "group-hover:rotate-6"}`}>
              <Image src="/myna-logo.png" alt="Myna Lingo" width={44} height={44} className="object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-extrabold text-xl lg:text-2xl tracking-wider text-myna-brown leading-none">
                MYNA<span className="text-myna-terracotta">LINGO</span>
              </span>
              <span className="text-[10px] font-bold text-myna-brown/60 uppercase tracking-widest leading-tight">
                Learn • Speak • Connect
              </span>
            </div>
          </a>

          <div className="hidden md:flex items-center gap-8 font-semibold text-sm text-myna-brown">
            <a href="#how-it-works" className="hover:text-myna-terracotta transition-colors">How It Works</a>
            <a href="#features" className="hover:text-myna-terracotta transition-colors">Features</a>
            <a href="/find-teacher" className="hover:text-myna-terracotta transition-colors flex items-center gap-1.5">
              <span>Teachers</span>
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            </a>
            <a href="#conversation" className="hover:text-myna-terracotta transition-colors">4-Level Method</a>
            <a href="#for-teachers" className="hover:text-myna-terracotta transition-colors">Teach With Us</a>
          </div>

          <div className="hidden sm:flex items-center gap-3">
            <LanguageSwitcher />
            {mounted && user ? (
              <>
                <span className="font-bold text-sm text-myna-brown hidden lg:inline">
                  {t("home.hi")}, {user.fullName.split(" ")[0]}
                </span>
                {user.role === "TEACHER" && (
                  <a href="/teacher" className="px-4 py-2 font-bold text-sm text-myna-brown hover:text-myna-terracotta transition-colors">
                    Dashboard
                  </a>
                )}
                <a href="/become-a-teacher" className="px-4 py-2 font-bold text-sm text-myna-brown hover:text-myna-terracotta transition-colors">
                  {t("home.becomeTeacher")}
                </a>
                <button onClick={handleLogout} className="px-5 py-2.5 bg-myna-brown text-myna-cream hover:bg-myna-terracotta rounded-xl font-bold text-sm border-2 border-myna-brown shadow-myna-bold active:translate-x-0.5 active:translate-y-0.5 transition-all">
                  {t("home.logOut")}
                </button>
              </>
            ) : mounted ? (
              <>
                <a href="/login" className="px-4 py-2 font-bold text-sm text-myna-brown hover:text-myna-terracotta transition-colors">
                  {t("home.logIn")}
                </a>
                <a href="/register" className="px-5 py-2.5 bg-myna-brown text-myna-cream hover:bg-myna-terracotta rounded-xl font-bold text-sm border-2 border-myna-brown shadow-myna-bold active:translate-x-0.5 active:translate-y-0.5 transition-all">
                  {t("home.signUp")}
                </a>
              </>
            ) : null}
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-myna-brown hover:bg-myna-yellow/20"
            aria-label="Menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden pt-4 pb-3 px-4 border-t border-myna-brown/10 mt-3 space-y-3">
            <a href="#how-it-works" className="block font-semibold text-myna-brown py-1" onClick={() => setMobileOpen(false)}>How It Works</a>
            <a href="#features" className="block font-semibold text-myna-brown py-1" onClick={() => setMobileOpen(false)}>Features</a>
            <a href="/find-teacher" className="block font-semibold text-myna-brown py-1" onClick={() => setMobileOpen(false)}>Find a Teacher</a>
            <a href="#conversation" className="block font-semibold text-myna-brown py-1" onClick={() => setMobileOpen(false)}>4-Level Method</a>
            <a href="#for-teachers" className="block font-semibold text-myna-brown py-1" onClick={() => setMobileOpen(false)}>Become a Teacher</a>
            <div className="pt-2 flex flex-col gap-2">
              <a href="/login" className="w-full py-2 font-bold text-center border-2 border-myna-brown rounded-xl">{t("home.logIn")}</a>
              <a href="/register" className="w-full py-2.5 bg-myna-yellow text-myna-brown text-center font-bold rounded-xl border-2 border-myna-brown shadow-myna-bold">Start Learning</a>
            </div>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section className="relative pt-8 pb-16 lg:pt-16 lg:pb-24 px-4 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-myna-yellow/40 border border-myna-yellow text-myna-brown font-semibold text-xs uppercase tracking-wider shadow-sm">
              <span className="w-2 h-2 rounded-full bg-myna-terracotta animate-pulse" />
              Designed for Algerian Language Learners
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-myna-brown leading-[1.1] tracking-tight">
              Learn a language.<br />
              <span className="relative inline-block text-myna-terracotta">
                Speak it with confidence.
                <svg className="absolute -bottom-2 left-0 w-full h-3 text-myna-yellow" viewBox="0 0 200 8" fill="none" preserveAspectRatio="none">
                  <path d="M0 5 Q 50 0, 100 5 T 200 5" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </span>
            </h1>

            <p className="text-base sm:text-lg text-myna-brown/80 max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed">
              Learn at your own pace with structured courses, podcasts, and activities — then practice directly with real teachers through live video, voice, or chat whenever you need.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <a href="/register?role=student" className="w-full sm:w-auto px-8 py-4 bg-myna-yellow hover:bg-myna-yellow-light text-myna-brown font-extrabold text-base rounded-2xl border-2 border-myna-brown shadow-myna-lg hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-3 group">
                <span>Start Learning</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="/become-a-teacher" className="w-full sm:w-auto px-8 py-4 bg-myna-cream hover:bg-white text-myna-brown font-extrabold text-base rounded-2xl border-2 border-myna-brown shadow-myna-bold hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2">
                <GraduationCap size={20} className="text-myna-terracotta" />
                <span>Become a Teacher</span>
              </a>
            </div>

            <div className="pt-6 border-t border-myna-brown/10 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs sm:text-sm font-semibold text-myna-brown/70">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-green-600" />
                <span>Recorded Courses & Quizzes</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-green-600" />
                <span>On-Demand Teacher Calls</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-green-600" />
                <span>Pay-Per-Call Credits</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 relative">
            <div className="absolute -inset-2 bg-myna-yellow rounded-3xl border-2 border-myna-brown rotate-2 shadow-myna-lg" />

            <div className="relative bg-myna-brown rounded-2xl border-2 border-myna-brown overflow-hidden text-myna-cream shadow-2xl">
              <div className="bg-[#1C0F0A] px-4 py-3 flex items-center justify-between border-b border-myna-cream/10">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-yellow-500 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
                  <span className="text-xs font-mono font-bold text-myna-yellow/90 ml-2">Mynalingo Live Room</span>
                </div>
                <div className="flex items-center gap-2 bg-green-500/20 text-green-400 px-2.5 py-1 rounded-full text-xs font-bold border border-green-500/30">
                  <span className="w-2 h-2 rounded-full bg-green-400 pulse-ring" />
                  <span>00:14:22</span>
                </div>
              </div>

              <div className="relative p-4 bg-gradient-to-b from-[#2B1810] to-[#1C0F0A] min-h-[360px] flex flex-col justify-between">
                <div className="relative w-full h-56 rounded-xl overflow-hidden border border-myna-cream/20 bg-stone-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800" alt="Teacher" className="w-full h-full object-cover" />
                  <div className="absolute top-3 left-3 bg-myna-brown/80 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-semibold text-white flex items-center gap-2 border border-white/10">
                    <span>🇬🇧 Sarah Jenkins</span>
                    <span className="bg-myna-yellow text-myna-brown text-[10px] px-1.5 py-0.5 rounded font-bold">Native</span>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 bg-myna-brown/90 backdrop-blur-md p-3 rounded-xl border border-myna-yellow/30 text-xs text-white space-y-1 shadow-lg">
                    <p className="text-myna-yellow font-bold text-[11px] flex items-center gap-1">
                      <Wand2 size={12} /> Teacher Prompt:
                    </p>
                    <p className="font-medium text-slate-100">
                      "Great pronunciation! Now try describing what you see using past simple tense."
                    </p>
                  </div>
                </div>

                <div className="absolute top-8 right-8 w-24 h-28 sm:w-28 sm:h-32 rounded-xl overflow-hidden border-2 border-myna-yellow shadow-xl bg-stone-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=300" alt="Student" className="w-full h-full object-cover" />
                  <div className="absolute bottom-1 right-1 bg-black/60 px-1.5 py-0.5 rounded text-[9px] font-bold">You</div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-2 bg-[#140A07] p-3 rounded-xl border border-white/10">
                  <div className="flex items-center gap-2">
                    <button title="Microphone" className="w-9 h-9 rounded-lg bg-myna-cream/10 hover:bg-myna-cream/20 flex items-center justify-center text-white">
                      <Mic size={14} className="text-green-400" />
                    </button>
                    <button title="Camera" className="w-9 h-9 rounded-lg bg-myna-cream/10 hover:bg-myna-cream/20 flex items-center justify-center text-white">
                      <Video size={14} className="text-green-400" />
                    </button>
                    <button title="Share" className="w-9 h-9 rounded-lg bg-myna-cream/10 hover:bg-myna-cream/20 flex items-center justify-center text-white">
                      <MonitorUp size={14} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-myna-yellow font-bold hidden sm:inline">Level 2</span>
                    <button
                      onClick={() => openCall("Sarah Jenkins", "English", "🇬🇧", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300")}
                      className="px-3.5 py-1.5 bg-myna-rose hover:bg-red-600 text-white rounded-lg font-bold text-xs flex items-center gap-1.5"
                    >
                      <PhoneOff size={12} />
                      <span>Demo Call</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-5 -left-4 bg-myna-cream border-2 border-myna-brown p-3 rounded-2xl shadow-myna-bold hidden sm:flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 border border-green-500 flex items-center justify-center text-green-600">
                <Zap size={18} />
              </div>
              <div>
                <div className="text-[10px] text-myna-brown/60 font-bold uppercase">Average Connection Time</div>
                <div className="text-sm font-extrabold text-myna-brown">&lt; 30 Seconds to Real Teacher</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STRIP */}
      <section className="bg-myna-yellow border-y-2 border-myna-brown py-6 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-myna-brown font-display font-extrabold">
          {[
            [<BookOpen key="i" size={20} />, "Structured Courses", "Self-paced modules & quizzes"],
            [<MessageCircle key="i" size={20} />, "Real Teacher Calls", "On-demand video & audio"],
            [<Podcast key="i" size={20} />, "Podcasts & Stories", "Native listening practice"],
            [<Trophy key="i" size={20} />, "XP & Progress", "Gamified vocabulary growth"],
          ].map(([icon, title, sub], i) => (
            <div key={i} className="flex items-center justify-center sm:justify-start gap-3 p-2">
              <div className="w-10 h-10 rounded-xl bg-myna-cream border border-myna-brown flex items-center justify-center shrink-0 shadow-sm">
                {icon}
              </div>
              <div>
                <div className="text-base sm:text-lg leading-tight">{title}</div>
                <div className="text-xs font-sans font-medium text-myna-brown/70">{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-20 px-4 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
          <span className="inline-block text-myna-terracotta font-extrabold text-sm uppercase tracking-wider bg-myna-terracotta/10 px-3 py-1 rounded-full border border-myna-terracotta/20">
            Simple & Effective
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-myna-brown">How Mynalingo Works</h2>
          <p className="text-myna-brown/80 font-medium">
            The fastest way to bridge the gap between studying a language and speaking it in real life.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { n: "01", title: "Choose Your Goal", body: "Pick your language and select your starting level from beginner to advanced.", foot: "Personalized Diagnostic Quiz" },
            { n: "02", title: "Learn On Your Own", body: "Follow bite-sized modules, listen to podcasts on the go, and build active vocabulary.", foot: "Unlimited Course Access" },
            { n: "03", title: "Practice with Teachers", body: "Stuck or ready to speak? Tap \"Talk to Teacher\" and start an instant video or voice session.", foot: "Pay-As-You-Go Credits" },
          ].map((s, i) => (
            <div key={s.n} className="bg-myna-cream rounded-2xl border-2 border-myna-brown p-8 shadow-myna-bold hover:-translate-y-1 transition-transform relative flex flex-col items-center text-center">
              <div className={`w-14 h-14 rounded-2xl border-2 border-myna-brown font-display font-extrabold text-xl flex items-center justify-center shadow-sm mb-6 ${i === 0 ? "bg-myna-yellow text-myna-brown" : i === 1 ? "bg-myna-terracotta text-myna-cream" : "bg-green-400 text-myna-brown"}`}>
                {s.n}
              </div>
              <h3 className="font-display text-xl font-bold text-myna-brown mb-2">{s.title}</h3>
              <p className="text-sm text-myna-brown/75 leading-relaxed">{s.body}</p>
              <div className={`mt-6 pt-4 border-t border-myna-brown/10 w-full text-xs font-bold flex items-center justify-center gap-1 ${i === 2 ? "text-green-700" : "text-myna-terracotta"}`}>
                <span>{s.foot}</span>
                <ChevronRight size={12} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES TABS */}
      <section id="features" className="py-16 px-4 lg:px-8 bg-myna-yellow/15 border-y-2 border-myna-brown/10">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-myna-brown">Everything You Need to Learn</h2>
            <p className="text-myna-brown/80 font-medium">Mynalingo isn't just another video library. It's a complete ecosystem built for real fluency.</p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {([
              ["learn", <BookOpen key="i" size={16} />, "01. Learn"],
              ["listen", <Headphones key="i" size={16} />, "02. Listen"],
              ["practice", <MessageCircle key="i" size={16} />, "03. Practice"],
              ["improve", <Trophy key="i" size={16} />, "04. Improve"],
            ] as const).map(([key, icon, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-6 py-3 rounded-xl font-extrabold text-sm border-2 border-myna-brown flex items-center gap-2 transition-all ${tab === key ? "bg-myna-yellow text-myna-brown shadow-myna-bold" : "bg-myna-cream text-myna-brown hover:bg-myna-yellow/30"}`}
              >
                {icon}
                <span>{label}</span>
              </button>
            ))}
          </div>

          <div className="bg-myna-cream rounded-3xl border-2 border-myna-brown p-6 lg:p-10 shadow-myna-lg min-h-[380px]">
            {tab === "learn" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6 space-y-4">
                  <div className="inline-block px-3 py-1 bg-myna-yellow/50 text-myna-brown rounded-lg text-xs font-bold">Structured Curriculum</div>
                  <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-myna-brown">Self-Paced Courses Designed for Algerian Context</h3>
                  <p className="text-myna-brown/80 leading-relaxed text-sm sm:text-base">
                    Every course is broken into digestible 5-minute lessons, interactive grammar slides, and practical vocabulary notes tailored to overcome common Arabic and French language interference.
                  </p>
                  <ul className="space-y-2 text-sm font-semibold text-myna-brown">
                    {["Level A1 to C1 aligned with CEFR standards", "Downloadable PDF cheat sheets and summary notes", "End-of-unit tests with immediate automated feedback"].map((b) => (
                      <li key={b} className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-myna-terracotta shrink-0" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="lg:col-span-6 bg-myna-yellow/20 rounded-2xl border-2 border-myna-brown p-6 space-y-3">
                  {[
                    { code: "B1", title: "Business English Essentials", mod: "Module 4: Email Writing", status: "75% Done", tone: "green" },
                    { code: "A2", title: "French Fluency for Beginners", mod: "Module 2: Daily Life", status: "In Progress", tone: "yellow" },
                  ].map((c) => (
                    <div key={c.code} className="flex items-center justify-between bg-white p-3 rounded-xl border border-myna-brown/10 gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-lg font-bold flex items-center justify-center shrink-0 ${c.tone === "green" ? "bg-myna-terracotta text-white" : "bg-myna-yellow text-myna-brown"}`}>
                          {c.code}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-sm text-myna-brown truncate">{c.title}</div>
                          <div className="text-xs text-myna-brown/60 truncate">{c.mod}</div>
                        </div>
                      </div>
                      <span className={`text-xs font-extrabold px-2 py-1 rounded whitespace-nowrap ${c.tone === "green" ? "text-green-700 bg-green-100" : "text-myna-terracotta bg-myna-yellow/40"}`}>
                        {c.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === "listen" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6 space-y-4">
                  <div className="inline-block px-3 py-1 bg-purple-100 text-purple-800 rounded-lg text-xs font-bold">Audio & Immersion</div>
                  <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-myna-brown">Bilingual Podcasts & Cultural Audio Stories</h3>
                  <p className="text-myna-brown/80 leading-relaxed text-sm sm:text-base">
                    Train your ear to natural native speeds with audio stories recorded by real speakers. Includes synchronized transcripts, clickable vocabulary, and audio speed controls.
                  </p>
                  <div className="p-4 bg-white rounded-2xl border-2 border-myna-brown flex items-center gap-4 shadow-sm">
                    <button
                      onClick={() => setPlayingAudio(!playingAudio)}
                      className="w-12 h-12 rounded-full bg-myna-terracotta text-white flex items-center justify-center hover:scale-105 transition-transform shrink-0"
                    >
                      {playingAudio ? <Pause size={18} /> : <Play size={18} />}
                    </button>
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="text-xs font-bold text-myna-terracotta uppercase">Now Playing • Episode #12</div>
                      <div className="text-sm font-bold text-myna-brown truncate">Exploring Algiers in English</div>
                      <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-myna-terracotta h-full transition-all" style={{ width: playingAudio ? "70%" : "33%" }} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-6 space-y-3">
                  {[
                    ["Everyday Conversations", "12 min • Dual subtitles"],
                    ["Pronunciation Masterclass", "8 min • Shadowing Exercises"],
                  ].map(([title, sub]) => (
                    <div key={title} className="p-4 bg-white rounded-xl border border-myna-brown/10 flex justify-between items-center gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Podcast size={24} className="text-myna-terracotta shrink-0" />
                        <div className="min-w-0">
                          <div className="font-bold text-sm truncate">{title}</div>
                          <div className="text-xs text-myna-brown/60 truncate">{sub}</div>
                        </div>
                      </div>
                      <Play size={18} className="text-myna-brown shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === "practice" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6 space-y-4">
                  <div className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-lg text-xs font-bold">Direct Human Connection</div>
                  <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-myna-brown">Live Voice, Video & Text Practice</h3>
                  <p className="text-myna-brown/80 leading-relaxed text-sm sm:text-base">
                    Never worry about getting stuck. Connect directly with available certified tutors for 1-on-1 feedback, accent reduction, or conversation practice.
                  </p>
                  <a href="/find-teacher" className="inline-flex items-center gap-2 font-bold text-sm text-myna-terracotta hover:underline">
                    <span>Browse available online teachers</span>
                    <ArrowRight size={14} />
                  </a>
                </div>
                <div className="lg:col-span-6 bg-myna-yellow/20 p-6 rounded-2xl border-2 border-myna-brown text-center space-y-4">
                  <div className="flex justify-center gap-4 text-myna-terracotta">
                    <MessageCircle size={32} />
                    <Mic size={32} />
                    <Video size={32} />
                  </div>
                  <h4 className="font-bold text-myna-brown">3 Ways to Connect</h4>
                  <p className="text-xs text-myna-brown/70">Choose low-pressure text chat, flexible voice notes, or face-to-face video calling.</p>
                </div>
              </div>
            )}

            {tab === "improve" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6 space-y-4">
                  <div className="inline-block px-3 py-1 bg-orange-100 text-orange-800 rounded-lg text-xs font-bold">Gamified Motivation</div>
                  <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-myna-brown">Build Daily Streaks & Earn XP</h3>
                  <p className="text-myna-brown/80 leading-relaxed text-sm sm:text-base">
                    Stay consistent with daily micro-challenges, vocabulary review games, and community leaderboards. Earn extra credits as you level up.
                  </p>
                </div>
                <div className="lg:col-span-6 grid grid-cols-2 gap-4">
                  <div className="bg-white p-5 rounded-2xl border-2 border-myna-brown text-center space-y-2 shadow-sm">
                    <div className="flex justify-center text-myna-rose"><Trophy size={28} /></div>
                    <div className="font-display font-extrabold text-lg text-myna-brown">Daily Streak</div>
                    <div className="text-[11px] text-myna-brown/60">Keep learning daily</div>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border-2 border-myna-brown text-center space-y-2 shadow-sm">
                    <div className="flex justify-center text-myna-yellow"><Zap size={28} /></div>
                    <div className="font-display font-extrabold text-lg text-myna-brown">XP Earned</div>
                    <div className="text-[11px] text-myna-brown/60">Climb the leaderboard</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* TEACHERS */}
      <section id="teachers" className="py-20 px-4 lg:px-8 max-w-7xl mx-auto space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <span className="inline-block text-myna-terracotta font-extrabold text-sm uppercase tracking-wider bg-myna-terracotta/10 px-3 py-1 rounded-full border border-myna-terracotta/20">
              The Unique Differentiator
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-myna-brown">"Need help? Talk to a teacher."</h2>
            <p className="text-myna-brown/80 font-medium">
              Don't stay stuck on a lesson. Connect with live tutors instantly using your credit balance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[
              ["all", "All"],
              ["English", "🇬🇧 English"],
              ["French", "🇫🇷 French"],
              ["Spanish", "🇪🇸 Spanish"],
              ["German", "🇩🇪 German"],
            ].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setTeacherFilter(val)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border border-myna-brown transition-colors ${teacherFilter === val ? "bg-myna-brown text-white" : "bg-myna-cream text-myna-brown hover:bg-myna-yellow/30"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {TEACHERS.filter((tc) => teacherFilter === "all" || tc.lang === teacherFilter).map((tc) => (
            <div key={tc.name} className="bg-myna-cream rounded-2xl border-2 border-myna-brown p-5 shadow-myna-bold flex flex-col justify-between hover:-translate-y-1 transition-transform">
              <div>
                <div className="relative mb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={tc.img} alt={tc.name} className="w-full h-44 object-cover rounded-xl border border-myna-brown/20" />
                  <div className={`absolute top-3 left-3 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 border border-black/20 ${tc.status === "online" ? "bg-green-500" : "bg-amber-500"}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    <span>{tc.status === "online" ? "ONLINE" : "IN CLASS"}</span>
                  </div>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-display font-extrabold text-lg text-myna-brown truncate">{tc.name}</h3>
                    <p className="text-xs text-myna-brown/60 font-medium truncate">{tc.flag} {tc.location}</p>
                  </div>
                </div>

                <p className="text-xs text-myna-brown/75 mt-3 line-clamp-2">{tc.bio}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-myna-brown/10 flex items-center justify-between gap-2">
                <span className="font-extrabold text-sm text-myna-brown">{tc.rate}</span>
                <button
                  onClick={() => openCall(tc.name, tc.lang, tc.flag, tc.img)}
                  className="px-4 py-2 bg-myna-yellow hover:bg-myna-yellow-light text-myna-brown font-extrabold text-xs rounded-xl border-2 border-myna-brown shadow-sm flex items-center gap-1.5"
                >
                  <Phone size={12} />
                  <span>Start Call</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <a href="/find-teacher" className="inline-flex items-center gap-2 px-6 py-3 bg-myna-brown text-myna-cream hover:bg-myna-terracotta font-extrabold text-sm rounded-2xl border-2 border-myna-brown shadow-myna-bold">
            Browse all teachers
            <ArrowRight size={14} />
          </a>
        </div>
      </section>

      {/* 4-STAGE METHOD */}
      <section id="conversation" className="py-20 px-4 lg:px-8 bg-myna-brown text-myna-cream">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="inline-block text-myna-yellow font-extrabold text-sm uppercase tracking-wider bg-myna-yellow/10 px-3 py-1 rounded-full border border-myna-yellow/20">
              The Mynalingo Method
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white">Turn Every Conversation Into Practice</h2>
            <p className="text-myna-cream/70 font-medium">
              Our structured 4-stage speaking blueprint guarantees you never run out of things to say in a live session.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {([
              [1, "Stage 01", "Break the Ice"],
              [2, "Stage 02", "Express Yourself"],
              [3, "Stage 03", "Debate & Argue"],
              [4, "Stage 04", "Shadowing"],
            ] as const).map(([n, s, title]) => (
              <button
                key={n}
                onClick={() => setMethodStage(n as MethodStage)}
                className={`p-4 rounded-2xl border-2 font-extrabold text-left transition-all ${methodStage === n ? "border-myna-yellow bg-myna-yellow text-myna-brown shadow-md" : "border-myna-cream/20 bg-myna-cream/10 text-myna-cream hover:bg-myna-cream/20"}`}
              >
                <div className="text-xs uppercase opacity-80 mb-1">{s}</div>
                <div className="text-base sm:text-lg">{title}</div>
              </button>
            ))}
          </div>

          <div className="bg-[#1F100A] rounded-3xl border-2 border-myna-cream/20 p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-[320px]">
            <div className="lg:col-span-7 space-y-4">
              <span className="inline-block px-3 py-1 bg-myna-yellow/20 text-myna-yellow border border-myna-yellow/30 text-xs font-bold rounded-full">
                {METHOD[methodStage].badge}
              </span>
              <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-white">{METHOD[methodStage].title}</h3>
              <p className="text-myna-cream/80 text-sm sm:text-base leading-relaxed">{METHOD[methodStage].desc}</p>
              <div className="p-4 bg-myna-cream/5 rounded-2xl border border-myna-cream/10 space-y-1">
                <span className="text-xs text-myna-yellow font-bold uppercase">Sample Prompt:</span>
                <p className="text-sm font-semibold text-white italic">{METHOD[methodStage].samplePrompt}</p>
              </div>
            </div>
            <div className="lg:col-span-5 flex flex-col items-center justify-center p-8 bg-myna-cream/5 rounded-2xl border border-myna-cream/10 text-center space-y-3">
              <div className="text-myna-yellow">{METHOD[methodStage].icon}</div>
              <div className="font-extrabold text-lg text-myna-yellow">{METHOD[methodStage].subtitle}</div>
            </div>
          </div>
        </div>
      </section>

      {/* FOR TEACHERS */}
      <section id="for-teachers" className="py-20 px-4 lg:px-8 max-w-7xl mx-auto space-y-16">
        <div className="bg-gradient-to-br from-myna-yellow to-myna-yellow-light rounded-3xl border-2 border-myna-brown p-8 lg:p-12 shadow-myna-lg grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <span className="bg-myna-brown text-myna-cream text-xs font-bold px-3 py-1 rounded-full uppercase">
              For Language Educators
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-myna-brown">Are you a language teacher? Turn your knowledge into income.</h2>
            <p className="text-myna-brown/80 font-medium text-sm sm:text-base">
              Join Algeria's growing network of online language instructors. Set your own availability, run live sessions, and earn directly.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs font-bold text-myna-brown">
              {["Set your hourly rate", "Flexible schedule", "Instant payouts"].map((b) => (
                <div key={b} className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-myna-terracotta shrink-0" />
                  <span>{b}</span>
                </div>
              ))}
            </div>
            <div className="pt-4">
              <a href="/become-a-teacher" className="px-6 py-3.5 bg-myna-brown hover:bg-myna-terracotta text-white font-extrabold text-sm rounded-xl border-2 border-myna-brown shadow-myna-bold inline-flex items-center gap-2">
                <span>Apply to Become a Teacher</span>
                <ArrowRight size={14} />
              </a>
            </div>
          </div>
          <div className="lg:col-span-5 bg-myna-cream rounded-2xl border-2 border-myna-brown p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-myna-yellow border border-myna-brown flex items-center justify-center shrink-0">
                <GraduationCap size={22} className="text-myna-brown" />
              </div>
              <div>
                <div className="font-bold text-sm text-myna-brown">Reviewed in 48 hours</div>
                <div className="text-xs text-myna-brown/60">One-time application, no fees</div>
              </div>
            </div>
            <div className="bg-myna-yellow/20 p-4 rounded-xl border border-myna-brown/10 space-y-2">
              {["Upload your certificate & ID", "Set your availability and rate", "Get matched with learners"].map((b, i) => (
                <div key={b} className="flex items-center gap-2 text-xs font-semibold text-myna-brown">
                  <span className="w-6 h-6 rounded-full bg-myna-brown text-myna-cream flex items-center justify-center text-[11px] font-bold shrink-0">
                    {i + 1}
                  </span>
                  <span>{b}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 px-4 lg:px-8 bg-myna-yellow border-y-2 border-myna-brown text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="w-16 h-16 bg-myna-cream rounded-2xl border-2 border-myna-brown mx-auto flex items-center justify-center shadow-myna-bold rotate-3 overflow-hidden">
            <Image src="/myna-logo.png" alt="" width={64} height={64} className="object-cover" />
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-myna-brown leading-tight">
            Your Language Journey Starts Here.
          </h2>
          <p className="text-myna-brown/80 font-medium text-base sm:text-lg max-w-xl mx-auto">
            Learn at your own pace. Practice with real people. Become fluent with confidence.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="/register?role=student" className="w-full sm:w-auto px-8 py-4 bg-myna-brown hover:bg-myna-terracotta text-myna-cream font-extrabold text-base rounded-2xl border-2 border-myna-brown shadow-myna-bold">
              Start Learning Now
            </a>
            <a href="#how-it-works" className="w-full sm:w-auto px-8 py-4 bg-myna-cream hover:bg-white text-myna-brown font-extrabold text-base rounded-2xl border-2 border-myna-brown shadow-myna-bold">
              Explore How It Works
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-myna-brown text-myna-cream py-12 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-myna-cream/10">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-myna-yellow flex items-center justify-center overflow-hidden">
                <Image src="/myna-logo.png" alt="" width={36} height={36} className="object-cover" />
              </div>
              <span className="font-display font-extrabold text-xl text-myna-yellow">MYNA LINGO</span>
            </div>
            <p className="text-xs text-myna-cream/60 leading-relaxed">
              Algeria's premier hybrid language learning platform combining structured courses with on-demand teacher interactions.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-sm text-myna-yellow mb-3">Platform</h4>
            <ul className="space-y-2 text-xs text-myna-cream/70">
              <li><a href="#how-it-works" className="hover:text-white">How It Works</a></li>
              <li><a href="#features" className="hover:text-white">Features</a></li>
              <li><a href="/find-teacher" className="hover:text-white">Live Tutors</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-sm text-myna-yellow mb-3">Learn</h4>
            <ul className="space-y-2 text-xs text-myna-cream/70">
              <li><a href="/register?role=student" className="hover:text-white">English</a></li>
              <li><a href="/register?role=student" className="hover:text-white">French</a></li>
              <li><a href="/register?role=student" className="hover:text-white">Arabic / Darija</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-sm text-myna-yellow mb-3">Community</h4>
            <ul className="space-y-2 text-xs text-myna-cream/70">
              <li><a href="/become-a-teacher" className="hover:text-white">Become a Teacher</a></li>
              <li><a href="/login" className="hover:text-white">Sign In</a></li>
              <li><a href="/register" className="hover:text-white">Create Account</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-myna-cream/50 gap-4">
          <div>© {year} Myna Lingo. All rights reserved.</div>
          <div className="flex gap-4">
            <a href="#" className="hover:underline">Privacy</a>
            <a href="#" className="hover:underline">Terms</a>
          </div>
        </div>
      </footer>

      {/* CALL MODAL */}
      {callOpen && callTeacher && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setCallOpen(false)}>
          <div className="bg-myna-brown rounded-3xl border-2 border-myna-yellow w-full max-w-2xl overflow-hidden shadow-2xl text-myna-cream" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 bg-[#1C0F0A] flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
                <span className="font-bold text-sm text-myna-yellow">Live Practice Session</span>
              </div>
              <button onClick={() => setCallOpen(false)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-6 text-center">
              <div className="relative w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-myna-yellow">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={callTeacher.img} alt={callTeacher.name} className="w-full h-full object-cover" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-2xl font-extrabold text-white">{callTeacher.name}</h3>
                <p className="text-xs font-semibold text-myna-yellow">
                  {callTeacher.flag} {callTeacher.lang} Practice Session
                </p>
              </div>
              <div className="bg-myna-cream/10 p-4 rounded-2xl border border-white/10 max-w-md mx-auto space-y-2">
                {callConnected ? (
                  <div className="flex items-center justify-center gap-2 text-green-400 font-bold text-sm">
                    <CheckCircle2 size={16} />
                    <span>Connected! Call active</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-green-400 font-bold text-sm">
                    <span className="w-4 h-4 rounded-full border-2 border-green-400 border-t-transparent animate-spin" />
                    <span>Connecting...</span>
                  </div>
                )}
                <p className="text-xs text-myna-cream/60">
                  Design demo. Live WebRTC calls are not yet wired.
                </p>
              </div>
              <div className="flex items-center justify-center gap-4 pt-2">
                <button className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white">
                  <Mic size={18} />
                </button>
                <button onClick={() => setCallOpen(false)} className="px-6 py-3 bg-myna-rose hover:bg-red-600 text-white font-extrabold rounded-2xl flex items-center gap-2 text-sm shadow-lg">
                  <PhoneOff size={16} />
                  <span>End Session</span>
                </button>
                <button className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white">
                  <Video size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

const TEACHERS = [
  {
    name: "Sarah Jenkins", lang: "English", flag: "🇬🇧", location: "London, UK",
    img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300",
    rate: "20 Credits / 15m",
    bio: "Specialized in helping Algerian professionals master conversational fluency & interview prep.",
    status: "online",
  },
  {
    name: "Karim Benali", lang: "French", flag: "🇫🇷", location: "Paris / Algiers",
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300",
    rate: "18 Credits / 15m",
    bio: "TCF / DELF examination specialist with 6 years experience guiding university students.",
    status: "online",
  },
  {
    name: "Elena Rodriguez", lang: "Spanish", flag: "🇪🇸", location: "Madrid, Spain",
    img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300",
    rate: "15 Credits / 15m",
    bio: "Fun, high-energy conversation sessions focusing on daily travel and real-world expression.",
    status: "class",
  },
  {
    name: "Yassine Mansouri", lang: "German", flag: "🇩🇪", location: "Berlin / Oran",
    img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300",
    rate: "22 Credits / 15m",
    bio: "Guided Goethe B1/B2 exam prep & university application interview practice.",
    status: "online",
  },
];

const METHOD: Record<MethodStage, { title: string; subtitle: string; desc: string; samplePrompt: string; badge: string; icon: React.ReactNode }> = {
  1: {
    title: "01 — Break the Ice",
    subtitle: "Casual Questions & Warm-up Stories",
    desc: "Start your live call with low-pressure questions designed to build initial confidence.",
    samplePrompt: "What did you eat for breakfast today? Describe your commute in 3 sentences.",
    badge: "Low Anxiety Warm-up",
    icon: <MessageCircle size={48} />,
  },
  2: {
    title: "02 — Express Yourself",
    subtitle: "Visual Descriptions & Situational Scenarios",
    desc: "Your tutor will share an image or roleplay on screen. Practice active vocabulary and descriptive adjectives.",
    samplePrompt: "Roleplay: Order a meal at a restaurant and ask for custom modifications.",
    badge: "Active Vocabulary Building",
    icon: <BookOpen size={48} />,
  },
  3: {
    title: "03 — Debate & Argue",
    subtitle: "Opinion Defense & Persuasive Speaking",
    desc: "Challenge your fluency by expressing opinions on current topics and using complex connective phrases.",
    samplePrompt: "Do you prefer working remotely or in an office? Give 2 compelling reasons.",
    badge: "Fluency & Complex Structure",
    icon: <Mic size={48} />,
  },
  4: {
    title: "04 — Shadowing Practice",
    subtitle: "Listen, Repeat & Accent Refinement",
    desc: "Listen to a native audio clip, repeat sentence by sentence, and receive immediate phonetics feedback.",
    samplePrompt: "Repeat after me: 'It's essential to practice consistently every single day.'",
    badge: "Native Accent & Pronunciation",
    icon: <Headphones size={48} />,
  },
};