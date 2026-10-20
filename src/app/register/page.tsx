"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GraduationCap, Users, BookOpen, Eye, EyeOff, Loader2, Check } from "lucide-react";
import { useLanguage } from "@/app/language-provider";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type Role = "STUDENT" | "PARENT" | "TEACHER";

interface RoleCard {
  id: Role;
  icon: React.ReactNode;
  titleKey: string;
  descKey: string;
}

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

  const roleFromUrl = searchParams.get("role");
  const initialRole: Role =
    roleFromUrl === "teacher" ? "TEACHER"
    : roleFromUrl === "parent" ? "PARENT"
    : "STUDENT";

  useEffect(() => {
    if (localStorage.getItem("accessToken")) {
      router.push("/");
    }
  }, [router]);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<Role>(initialRole);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError(t("register.errShortPassword"));
      return;
    }

    setLoading(true);

    try {
      // 1) Create the account
      const regRes = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password, role }),
      });
      const regData = await regRes.json();

      if (!regRes.ok) {
        setError(regData.message || t("register.failed"));
        setLoading(false);
        return;
      }

      // 2) Auto-login with the same credentials
      const loginRes = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const loginData = await loginRes.json();

      if (!loginRes.ok || !loginData.accessToken) {
        // Fallback: registration worked, auto-login failed
        router.push("/login");
        return;
      }

      localStorage.setItem("accessToken", loginData.accessToken);
      localStorage.setItem("user", JSON.stringify(loginData.user));

      // 3) Redirect by role
      if (loginData.user.role === "TEACHER") {
        router.push("/become-a-teacher");
      } else if (loginData.user.role === "PARENT") {
        router.push("/parent");
      } else {
        router.push("/student");
      }
    } catch {
      setError(t("register.connectError"));
      setLoading(false);
    }
  }

  const roleCards: RoleCard[] = [
    {
      id: "STUDENT",
      icon: <GraduationCap size={22} />,
      titleKey: "register.student",
      descKey: "register.studentDesc",
    },
    {
      id: "PARENT",
      icon: <Users size={22} />,
      titleKey: "register.parent",
      descKey: "register.parentDesc",
    },
    {
      id: "TEACHER",
      icon: <BookOpen size={22} />,
      titleKey: "register.teacher",
      descKey: "register.teacherDesc",
    },
  ];

  return (
    <main className="min-h-screen bg-cream flex items-center justify-center px-6 py-12">
      <div className="absolute top-6 end-8">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-lg bg-myna-white rounded-3xl shadow-sm p-8">
        <h1 className="font-display text-3xl font-bold text-myna-charcoal text-center">
          {t("register.createAccount")}
        </h1>
        <p className="text-myna-charcoal/60 text-sm text-center mt-2">
          {t("register.subtitle")}
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
          {/* Role cards */}
          <div>
            <label className="block text-sm font-medium text-myna-charcoal mb-2">
              {t("register.iAm")}
            </label>
            <div className="grid grid-cols-3 gap-3">
              {roleCards.map((card) => {
                const active = role === card.id;
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => setRole(card.id)}
                    className={`relative flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition text-center ${
                      active
                        ? "border-myna-orange bg-myna-orange/5"
                        : "border-myna-charcoal/15 bg-white hover:border-myna-charcoal/30"
                    }`}
                  >
                    {active && (
                      <span className="absolute top-2 end-2 w-5 h-5 rounded-full bg-myna-orange text-white flex items-center justify-center">
                        <Check size={12} />
                      </span>
                    )}
                    <span className={active ? "text-myna-orange" : "text-myna-charcoal/60"}>
                      {card.icon}
                    </span>
                    <span className={`text-sm font-semibold ${active ? "text-myna-orange" : "text-myna-charcoal"}`}>
                      {t(card.titleKey as any)}
                    </span>
                    <span className="text-[10px] text-myna-charcoal/50 leading-tight">
                      {t(card.descKey as any)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Full name */}
          <div>
            <label className="block text-sm font-medium text-myna-charcoal mb-1">
              {t("register.fullName")}
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl border border-myna-charcoal/20 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-myna-orange"
              placeholder="Sarah Benali"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-myna-charcoal mb-1">
              {t("register.email")}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-myna-charcoal/20 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-myna-orange"
              placeholder="you@example.com"
            />
          </div>

          {/* Password with show/hide */}
          <div>
            <label className="block text-sm font-medium text-myna-charcoal mb-1">
              {t("register.password")}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-myna-charcoal/20 px-4 py-3 pe-12 focus:outline-none focus:ring-2 focus:ring-myna-orange"
                placeholder="At least 6 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 -translate-y-1/2 end-3 text-myna-charcoal/40 hover:text-myna-charcoal"
                tabIndex={-1}
                aria-label={t("register.showPassword")}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full py-3 rounded-full font-semibold bg-myna-orange text-white hover:bg-myna-orange/90 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {t("register.creatingAccount")}
              </>
            ) : (
              t("register.signUp")
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-myna-charcoal/70">
          {t("register.haveAccount")}{" "}
          <a href="/login" className="text-myna-orange font-medium">
            {t("register.logIn")}
          </a>
        </p>
      </div>
    </main>
  );
}