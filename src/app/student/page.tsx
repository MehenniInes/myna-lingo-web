"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getUser, logout } from "@/lib/api";
import { useLanguage } from "@/app/language-provider";
import LanguageSwitcher from "@/components/LanguageSwitcher";

type Balance = { balanceSeconds: number; formatted: string };
type XPBalance = {
  totalXP: number; level: number; levelName: string;
  minXP: number; maxXP: number; progressInLevel: number; xpToNextLevel: number;
};

export default function StudentDashboard() {
  const router = useRouter();
  const { t } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [xp, setXp] = useState<XPBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser) { router.push("/login"); return; }
    setUser(currentUser);
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData() {
    setLoading(true); setError("");
    try {
      const [balanceData, xpData] = await Promise.all([
        api<Balance>("/minutes/balance", { auth: true }),
        api<XPBalance>("/xp/balance", { auth: true }),
      ]);
      setBalance(balanceData);
      setXp(xpData);
    } catch (err: any) {
      setError(err.message || t("common.failedToLoad"));
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <main className="min-h-screen flex items-center justify-center">{t("common.loading")}</main>;
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="bg-white rounded-3xl shadow-sm p-8 max-w-md w-full text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={loadData} className="px-6 py-3 rounded-full bg-myna-orange text-white font-semibold">
            {t("common.tryAgain")}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8 gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-3xl font-bold text-myna-charcoal">
              {t("student.welcome")}, {user?.fullName}
            </h1>
            <p className="text-myna-charcoal/60 text-sm mt-1">{t("student.subtitle")}</p>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <button
              onClick={logout}
              className="px-5 py-2 rounded-full border border-myna-charcoal/20 text-sm font-semibold hover:bg-white"
            >
              {t("student.logout")}
            </button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-white rounded-3xl shadow-sm p-8">
            <p className="text-xs font-bold uppercase tracking-wider text-myna-orange mb-2">
              {t("student.minutesBalance")}
            </p>
            <p className="font-display text-5xl font-bold text-myna-charcoal">{balance?.formatted}</p>
            <p className="text-sm text-myna-charcoal/60 mt-2">
              {t("student.seconds", { n: balance?.balanceSeconds ?? 0 })}
            </p>
            <a href="/student/packages" className="mt-6 inline-block px-6 py-3 rounded-full bg-myna-orange text-white font-semibold text-sm">
              {t("student.buyMoreMinutes")}
            </a>
          </div>

          <div className="bg-white rounded-3xl shadow-sm p-8">
            <p className="text-xs font-bold uppercase tracking-wider text-myna-orange mb-2">
              {t("student.levelProgress")}
            </p>
            <p className="font-display text-5xl font-bold text-myna-charcoal">{xp?.levelName}</p>
            <p className="text-sm text-myna-charcoal/60 mt-2">
              {t("student.xpTotal", { n: xp?.totalXP ?? 0 })}
            </p>
            <div className="mt-4 h-3 bg-cream rounded-full overflow-hidden">
              <div
                className="h-full bg-myna-orange transition-all"
                style={{ width: `${((xp?.progressInLevel || 0) / 500) * 100}%` }}
              />
            </div>
            <p className="text-xs text-myna-charcoal/60 mt-2">
              {t("student.xpToNext", { n: xp?.xpToNextLevel ?? 0 })}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <a href="/podcasts" className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition">
            <p className="font-bold text-myna-charcoal">🎧 {t("student.podcasts")}</p>
            <p className="text-xs text-myna-charcoal/60 mt-1">{t("student.podcastsSub")}</p>
          </a>
          <a href="/student/packages" className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition">
            <p className="font-bold text-myna-charcoal">📦 {t("student.packages")}</p>
            <p className="text-xs text-myna-charcoal/60 mt-1">{t("student.packagesSub")}</p>
          </a>
          <a href="/student/progress" className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition">
            <p className="font-bold text-myna-charcoal">⭐ {t("student.progress")}</p>
            <p className="text-xs text-myna-charcoal/60 mt-1">{t("student.progressSub")}</p>
          </a>
          <a href="/student/groups" className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition">
            <p className="font-bold text-myna-charcoal">👥 {t("student.groups")}</p>
            <p className="text-xs text-myna-charcoal/60 mt-1">{t("student.groupsSub")}</p>
          </a>
          <a href="/student/vocabulary" className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition">
            <p className="font-bold text-myna-charcoal">📖 {t("student.vocabulary")}</p>
            <p className="text-xs text-myna-charcoal/60 mt-1">{t("student.vocabularySub")}</p>
          </a>
          <a href="/student/call" className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition">
            <p className="font-bold text-myna-charcoal">📞 {t("student.call")}</p>
            <p className="text-xs text-myna-charcoal/60 mt-1">{t("student.callSub")}</p>
          </a>
          <a href="/student/bookings" className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition">
            <p className="font-bold text-myna-charcoal">📅 {t("student.bookings")}</p>
            <p className="text-xs text-myna-charcoal/60 mt-1">{t("student.bookingsSub")}</p>
          </a>
        </div>
      </div>
    </main>
  );
}