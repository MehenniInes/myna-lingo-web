
  "use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/app/language-provider";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    if (localStorage.getItem("accessToken")) {
      router.push("/");
    }
  }, [router]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:4000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || t("login.failed"));
        setLoading(false);
        return;
      }

      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("user", JSON.stringify(data.user));

      router.push("/");
    } catch {
      setError(t("login.connectError"));
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#FFFDF7] text-[#121212] px-4 py-6 sm:px-6 lg:px-8">
      {/* Top navigation */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between">
        <a
          href="/"
          className="group inline-flex items-center gap-3"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border-[3px] border-[#121212] bg-[#F5B731] shadow-[4px_4px_0_#121212] transition-transform group-hover:-translate-y-0.5">
            <span className="text-xl font-black">M</span>
          </div>

          <span className="text-lg font-black tracking-[0.12em]">
            MYNALINGO
          </span>
        </a>

        <LanguageSwitcher />
      </header>

      {/* Main content */}
      <section className="mx-auto flex w-full max-w-6xl items-center justify-center py-10 sm:py-14 lg:min-h-[calc(100vh-110px)] lg:py-16">
        <div className="grid w-full overflow-hidden rounded-[28px] border-[3px] border-[#121212] bg-white shadow-[8px_8px_0_#121212] lg:grid-cols-12">

          {/* Left brand panel */}
          <div className="relative overflow-hidden bg-[#F5B731] p-8 sm:p-10 lg:col-span-5 lg:p-12">
            {/* Decorative shapes */}
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full border-[3px] border-[#121212] bg-white/30" />

            <div className="absolute -bottom-20 -left-16 h-48 w-48 rounded-full border-[3px] border-[#121212] bg-[#C86228]/20" />

            <div className="relative z-10 flex h-full flex-col justify-between">
              <div>
                <div className="mb-8 inline-flex rounded-full border-[2px] border-[#121212] bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] shadow-[3px_3px_0_#121212]">
                  Language learning
                </div>

                <h1 className="max-w-md text-4xl font-black uppercase leading-[0.95] tracking-tight sm:text-5xl">
                  Learn it.
                  <br />
                  Practice it.
                  <br />
                  <span className="text-white">Speak it.</span>
                </h1>

                <p className="mt-6 max-w-sm text-sm font-bold leading-6 text-[#121212]/75">
                  Learn at your own pace, build real confidence, and practice
                  with teachers when you need them.
                </p>
              </div>

              {/* Feature card */}
              <div className="mt-10 rounded-2xl border-[3px] border-[#121212] bg-[#FFFDF7] p-5 shadow-[5px_5px_0_#121212]">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-[2px] border-[#121212] bg-[#C86228] text-white">
                    <span className="text-lg font-black">01</span>
                  </div>

                  <div>
                    <p className="text-sm font-black uppercase">
                      Learn your way
                    </p>

                    <p className="mt-1 text-xs font-semibold leading-5 text-[#121212]/65">
                      Courses, practice activities, and real conversations
                      designed around your goals.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Login panel */}
          <div className="bg-[#FFFDF7] p-7 sm:p-10 lg:col-span-7 lg:p-14">
            <div className="mx-auto max-w-md">

              <div className="mb-8">
                <div className="mb-3 inline-flex rounded-md border-[2px] border-[#121212] bg-[#F5B731] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em]">
                  Welcome back
                </div>

                <h2 className="text-3xl font-black uppercase tracking-tight sm:text-4xl">
                  {t("login.welcomeBack")}
                </h2>

                <p className="mt-2 text-sm font-semibold leading-6 text-[#121212]/60">
                  Continue your language-learning journey.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Email */}
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.1em]">
                    {t("login.email")}
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
                    {t("login.password")}
                  </label>

                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full rounded-xl border-[2px] border-[#121212] bg-white px-4 py-3.5 pr-20 text-sm font-semibold shadow-[3px_3px_0_#121212] outline-none transition-all placeholder:text-[#121212]/35 focus:-translate-y-0.5 focus:shadow-[5px_5px_0_#121212]"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-wider hover:bg-[#F5B731]/30"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="rounded-xl border-[2px] border-red-700 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                    {error}
                  </div>
                )}

                {/* Forgot password */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="text-xs font-black uppercase tracking-wider underline underline-offset-4"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl border-[3px] border-[#121212] bg-[#F5B731] py-4 text-sm font-black uppercase tracking-[0.1em] shadow-[5px_5px_0_#121212] transition-all hover:-translate-y-0.5 hover:shadow-[7px_7px_0_#121212] active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0_#121212] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? t("login.loggingIn") : `${t("login.logIn")} →`}
                </button>
              </form>

              {/* Divider */}
              <div className="my-7 flex items-center gap-4">
                <div className="h-[2px] flex-1 bg-[#121212]/15" />

                <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[#121212]/45">
                  or
                </span>

                <div className="h-[2px] flex-1 bg-[#121212]/15" />
              </div>

              {/* Google placeholder */}
              <button
                type="button"
                className="flex w-full items-center justify-center gap-3 rounded-xl border-[2px] border-[#121212] bg-white py-3.5 text-sm font-black shadow-[3px_3px_0_#121212] transition-all hover:-translate-y-0.5 hover:bg-[#F5B731]/10 hover:shadow-[5px_5px_0_#121212]"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[#121212]/20 text-xs font-black">
                  G
                </span>

                Continue with Google
              </button>

              {/* Register */}
              <p className="mt-8 text-center text-sm font-semibold text-[#121212]/60">
                {t("login.noAccount")}{" "}
                <a
                  href="/register"
                  className="font-black text-[#121212] underline underline-offset-4"
                >
                  {t("login.signUp")}
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}