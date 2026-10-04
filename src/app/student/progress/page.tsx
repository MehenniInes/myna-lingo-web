"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getUser } from "@/lib/api";
import { useLanguage } from "@/app/language-provider";
import { formatShortDateTime } from "@/lib/i18n";

type XPBalance = {
  totalXP: number; level: number; levelName: string;
  minXP: number; maxXP: number; progressInLevel: number; xpToNextLevel: number;
};

type XPTransaction = {
  id: string; amount: number; source: string; note: string | null; createdAt: string;
};

export default function ProgressPage() {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const [xp, setXp] = useState<XPBalance | null>(null);
  const [transactions, setTransactions] = useState<XPTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const user = getUser();
    if (!user) { router.push("/login"); return; }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData() {
    try {
      const [xpData, txData] = await Promise.all([
        api<XPBalance>("/xp/balance", { auth: true }),
        api<XPTransaction[]>("/xp/transactions", { auth: true }),
      ]);
      setXp(xpData);
      setTransactions(txData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function sourceLabel(source: string) {
    const map: Record<string, string> = {
      PODCAST_COMPLETION: t("progress.srcPodcast"),
      ACTIVITY_COMPLETION: t("progress.srcActivity"),
      LESSON_COMPLETION: t("progress.srcLesson"),
      ADMIN_ADJUSTMENT: t("progress.srcAdmin"),
      DAILY_STREAK: t("progress.srcStreak"),
    };
    return map[source] || source;
  }

  if (loading) return <main className="min-h-screen flex items-center justify-center">{t("common.loading")}</main>;

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="bg-white rounded-3xl shadow-sm p-8 max-w-md text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <a href="/student" className="text-myna-orange font-semibold">{t("common.backToDashboard")}</a>
        </div>
      </main>
    );
  }

  const progressPercent = xp ? (xp.progressInLevel / 500) * 100 : 0;

  return (
    <main className="min-h-screen bg-cream px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <a href="/student" className="text-myna-orange font-semibold text-sm">{t("common.backToDashboard")}</a>
        <h1 className="font-display text-4xl font-bold text-myna-charcoal mt-4">{t("progress.title")}</h1>
        <p className="text-myna-charcoal/60 mt-2">{t("progress.subtitle")}</p>

        <div className="mt-8 bg-white rounded-3xl shadow-sm p-8">
          <div className="flex justify-between items-end mb-4 gap-4 flex-wrap">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-myna-orange">
                {t("progress.currentLevel")}
              </p>
              <p className="font-display text-5xl font-bold text-myna-charcoal mt-2">{xp?.levelName}</p>
              <p className="text-myna-charcoal/60 mt-2">
                {t("progress.xpTotal", { n: xp?.totalXP ?? 0 })}
              </p>
            </div>
            <div className="text-end">
              <p className="text-2xl font-bold text-myna-orange">{xp?.xpToNextLevel}</p>
              <p className="text-xs text-myna-charcoal/60">{t("progress.xpToNext")}</p>
            </div>
          </div>

          <div className="h-4 bg-cream rounded-full overflow-hidden">
            <div className="h-full bg-myna-orange transition-all duration-500" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="flex justify-between text-xs text-myna-charcoal/60 mt-2">
            <span>{xp?.minXP} XP</span>
            <span>{xp?.maxXP} XP</span>
          </div>
        </div>

        <div className="mt-10">
          <h2 className="font-display text-2xl font-bold text-myna-charcoal mb-4">{t("progress.recent")}</h2>

          {transactions.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-sm p-8 text-center">
              <p className="text-myna-charcoal/60">{t("progress.noActivity")}</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
              {transactions.map((tx, idx) => (
                <div
                  key={tx.id}
                  className={`flex items-center justify-between p-5 ${idx !== transactions.length - 1 ? "border-b border-cream" : ""}`}
                >
                  <div className="flex-1">
                    <p className="font-semibold text-myna-charcoal">{sourceLabel(tx.source)}</p>
                    {tx.note && <p className="text-sm text-myna-charcoal/60 mt-1">{tx.note}</p>}
                    <p className="text-xs text-myna-charcoal/40 mt-1">{formatShortDateTime(locale, tx.createdAt)}</p>
                  </div>
                  <div className="text-end">
                    <p className="font-display text-2xl font-bold text-myna-orange">+{tx.amount}</p>
                    <p className="text-xs text-myna-charcoal/60">XP</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}