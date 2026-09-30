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
  const defaultRole = searchParams.get("role") === "teacher" ? "TEACHER" : "STUDENT";

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
        body: JSON.stringify({ fullName, email, password, role }),
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
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="absolute top-6 end-8">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-md bg-myna-white rounded-3xl shadow-sm p-8">
        <h1 className="font-display text-3xl font-bold text-myna-charcoal text-center">
          {t("register.createAccount")}
        </h1>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
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
            />
          </div>

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
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-myna-charcoal mb-1">
              {t("register.password")}
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-myna-charcoal/20 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-myna-orange"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-myna-charcoal mb-1">
              {t("register.iAm")}
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-xl border border-myna-charcoal/20 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-myna-orange"
            >
              <option value="STUDENT">{t("register.student")}</option>
              <option value="PARENT">{t("register.parent")}</option>
              <option value="TEACHER">{t("register.teacher")}</option>
            </select>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full py-3 rounded-full font-semibold bg-myna-orange text-white hover:bg-myna-orange/90 transition disabled:opacity-50"
          >
            {loading ? t("register.creatingAccount") : t("register.signUp")}
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