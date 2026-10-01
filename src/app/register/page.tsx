"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/app/language-provider";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();

  const defaultRole =
    searchParams.get("role") === "teacher" ? "TEACHER" : "STUDENT";

  useEffect(() => {
    if (localStorage.getItem("accessToken")) {
      router.push("/");
    }
  }, [router]);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(defaultRole);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:4000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          password,
          role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || t("register.failed"));
        setLoading(false);
        return;
      }

      router.push("/login");
    } catch {
      setError(t("register.connectError"));
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#FFFDF7] text-[#121212] px-4 py-6 sm:px-6 lg:px-8">
      {/* Top navigation */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between">
        <a href="/" className="group inline-flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border-[3px] border-[#121212] bg-[#F5B731] shadow-[4px_4px_0_#121212] transition-transform group-hover:-translate-y-0.5">
            <span className="text-xl font-black">M</span>
          </div>

          <span className="text-lg font-black tracking-[0.12em]">
            MYNALINGO
          </span>
        </a>

        <LanguageSwitcher />
      </header>

      {/* Main */}
      <section className="mx-auto flex w-full max-w-6xl items-center justify-center py-10 sm:py-14 lg:min-h-[calc(100vh-110px)] lg:py-16">
        <div className="grid w-full overflow-hidden rounded-[28px] border-[3px] border-[#121212] bg-white shadow-[8px_8px_0_#121212] lg:grid-cols-12">

          {/* Left brand panel */}
          <div className="relative overflow-hidden bg-[#F5B731] p-8 sm:p-10 lg:col-span-5 lg:p-12">
            {/* Decorative shapes */}
            <div className="absolute -left-16 -top-16 h-40 w-40 rounded-full border-[3px] border-[#121212] bg-white/30" />

            <div className="absolute -bottom-20 -right-16 h-48 w-48 rounded-full border-[3px] border-[#121212] bg-[#C86228]/20" />

            <div className="relative z-10 flex h-full flex-col justify-between">
              <div>
                <div className="mb-8 inline-flex rounded-full border-[2px] border-[#121212] bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] shadow-[3px_3px_0_#121212]">
                  Join Mynalingo
                </div>

                <h1 className="max-w-md text-4xl font-black uppercase leading-[0.95] tracking-tight sm:text-5xl">
                  Your
                  <br />
                  language
                  <br />
                  <span className="text-white">journey.</span>
                </h1>

                <p className="mt-6 max-w-sm text-sm font-bold leading-6 text-[#121212]/75">
                  Choose how you want to use Mynalingo and start building your
                  language skills your way.
                </p>
              </div>

              {/* Role preview card */}
              <div className="mt-10 space-y-3">
                <div className="rounded-2xl border-[3px] border-[#121212] bg-[#FFFDF7] p-4 shadow-[5px_5px_0_#121212]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border-[2px] border-[#121212] bg-[#F5B731]">
                      <span className="text-sm font-black">01</span>
                    </div>

                    <div>
                      <p className="text-xs font-black uppercase">
                        Learn
                      </p>
                      <p className="text-[11px] font-semibold text-[#121212]/60">
                        Courses & practice
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border-[3px] border-[#121212] bg-[#FFFDF7] p-4 shadow-[5px_5px_0_#121212]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border-[2px] border-[#121212] bg-[#C86228] text-white">
                      <span className="text-sm font-black">02</span>
                    </div>

                    <div>
                      <p className="text-xs font-black uppercase">
                        Connect
                      </p>
                      <p className="text-[11px] font-semibold text-[#121212]/60">
                        Real teachers & conversations
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Register panel */}
          <div className="bg-[#FFFDF7] p-7 sm:p-10 lg:col-span-7 lg:p-14">
            <div className="mx-auto max-w-md">

              <div className="mb-8">
                <div className="mb-3 inline-flex rounded-md border-[2px] border-[#121212] bg-[#F5B731] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em]">
                  Get started
                </div>

                <h2 className="text-3xl font-black uppercase tracking-tight sm:text-4xl">
                  {t("register.createAccount")}
                </h2>

                <p className="mt-2 text-sm font-semibold leading-6 text-[#121212]/60">
                  Create your account and choose your Mynalingo experience.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Full name */}
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.1em]">
                    {t("register.fullName")}
                  </label>

                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full rounded-xl border-[2px] border-[#121212] bg-white px-4 py-3.5 text-sm font-semibold shadow-[3px_3px_0_#121212] outline-none transition-all placeholder:text-[#121212]/35 focus:-translate-y-0.5 focus:shadow-[5px_5px_0_#121212]"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.1em]">
                    {t("register.email")}
                  </label>

                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border-[2px] border-[#121212] bg-white px-4 py-3.5 text-sm font-semibold shadow-[3px_3px_0_#121212] outline-none transition-all placeholder:text-[#121212]/35 focus:-translate-y-0.5 focus:shadow-[5px_5px_0_#121212]"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.1em]">
                    {t("register.password")}
                  </label>

                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full rounded-xl border-[2px] border-[#121212] bg-white px-4 py-3.5 text-sm font-semibold shadow-[3px_3px_0_#121212] outline-none transition-all placeholder:text-[#121212]/35 focus:-translate-y-0.5 focus:shadow-[5px_5px_0_#121212]"
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="mb-3 block text-xs font-black uppercase tracking-[0.1em]">
                    {t("register.iAm")}
                  </label>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

                    {/* Student */}
                    <button
                      type="button"
                      onClick={() => setRole("STUDENT")}
                      className={`rounded-xl border-[2px] p-4 text-left transition-all ${
                        role === "STUDENT"
                          ? "border-[#121212] bg-[#F5B731] shadow-[4px_4px_0_#121212] -translate-y-0.5"
                          : "border-[#121212]/30 bg-white hover:border-[#121212] hover:bg-[#F5B731]/15"
                      }`}
                    >
                      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border-[2px] border-[#121212] bg-white">
                        <span className="text-xs font-black">S</span>
                      </div>

                      <p className="text-xs font-black uppercase">
                        {t("register.student")}
                      </p>

                      <p className="mt-1 text-[10px] font-semibold leading-4 text-[#121212]/60">
                        Learn & practice
                      </p>
                    </button>

                    {/* Parent */}
                    <button
                      type="button"
                      onClick={() => setRole("PARENT")}
                      className={`rounded-xl border-[2px] p-4 text-left transition-all ${
                        role === "PARENT"
                          ? "border-[#121212] bg-[#F5B731] shadow-[4px_4px_0_#121212] -translate-y-0.5"
                          : "border-[#121212]/30 bg-white hover:border-[#121212] hover:bg-[#F5B731]/15"
                      }`}
                    >
                      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border-[2px] border-[#121212] bg-white">
                        <span className="text-xs font-black">P</span>
                      </div>

                      <p className="text-xs font-black uppercase">
                        {t("register.parent")}
                      </p>

                      <p className="mt-1 text-[10px] font-semibold leading-4 text-[#121212]/60">
                        Support a learner
                      </p>
                    </button>

                    {/* Teacher */}
                    <button
                      type="button"
                      onClick={() => setRole("TEACHER")}
                      className={`rounded-xl border-[2px] p-4 text-left transition-all ${
                        role === "TEACHER"
                          ? "border-[#121212] bg-[#C86228] text-white shadow-[4px_4px_0_#121212] -translate-y-0.5"
                          : "border-[#121212]/30 bg-white hover:border-[#121212] hover:bg-[#C86228]/10"
                      }`}
                    >
                      <div
                        className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg border-[2px] border-[#121212] ${
                          role === "TEACHER"
                            ? "bg-white text-[#121212]"
                            : "bg-[#C86228] text-white"
                        }`}
                      >
                        <span className="text-xs font-black">T</span>
                      </div>

                      <p className="text-xs font-black uppercase">
                        {t("register.teacher")}
                      </p>

                      <p
                        className={`mt-1 text-[10px] font-semibold leading-4 ${
                          role === "TEACHER"
                            ? "text-white/75"
                            : "text-[#121212]/60"
                        }`}
                      >
                        Teach & connect
                      </p>
                    </button>
                  </div>
                </div>

                {/* Selected role explanation */}
                <div className="rounded-xl border-[2px] border-[#121212]/15 bg-white px-4 py-3">
                  <p className="text-[11px] font-semibold leading-5 text-[#121212]/60">
                    {role === "STUDENT" &&
                      "You'll be able to learn languages, practice skills, and connect with teachers."}

                    {role === "PARENT" &&
                      "You'll be able to manage learning experiences for your children."}

                    {role === "TEACHER" &&
                      "You'll create a teacher account and continue through the teacher application process."}
                  </p>
                </div>

                {/* Error */}
                {error && (
                  <div className="rounded-xl border-[2px] border-red-700 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl border-[3px] border-[#121212] bg-[#F5B731] py-4 text-sm font-black uppercase tracking-[0.1em] shadow-[5px_5px_0_#121212] transition-all hover:-translate-y-0.5 hover:shadow-[7px_7px_0_#121212] active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0_#121212] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? t("register.creatingAccount")
                    : `${t("register.signUp")} →`}
                </button>
              </form>

              {/* Login */}
              <p className="mt-8 text-center text-sm font-semibold text-[#121212]/60">
                {t("register.haveAccount")}{" "}
                <a
                  href="/login"
                  className="font-black text-[#121212] underline underline-offset-4"
                >
                  {t("register.logIn")}
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}