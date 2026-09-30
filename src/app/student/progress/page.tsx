"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getUser } from "@/lib/api";

type XPBalance = {
  totalXP: number;
  level: number;
  levelName: string;
  minXP: number;
  maxXP: number;
  progressInLevel: number;
  xpToNextLevel: number;
};

type XPTransaction = {
  id: string;
  amount: number;
  source: string;
  note: string | null;
  createdAt: string;
};

export default function ProgressPage() {
  const router = useRouter();
  const [xp, setXp] = useState<XPBalance | null>(null);
  const [transactions, setTransactions] = useState<XPTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const user = getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    loadData();
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

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function sourceLabel(source: string) {
    const map: Record<string, string> = {
      PODCAST_COMPLETION: "🎧 Podcast",
      ACTIVITY_COMPLETION: "🎯 Activity",
      LESSON_COMPLETION: "📚 Lesson",
      ADMIN_ADJUSTMENT: "⚙️ Admin",
      DAILY_STREAK: "🔥 Streak",
    };
    return map[source] || source;
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="bg-white rounded-3xl shadow-sm p-8 max-w-md text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <a href="/student" className="text-myna-orange font-semibold">
            ← Back to Dashboard
          </a>
        </div>
      </main>
    );
  }

  const progressPercent = xp ? (xp.progressInLevel / 500) * 100 : 0;

  return (
    <main className="min-h-screen bg-cream px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <a href="/student" className="text-myna-orange font-semibold text-sm">
          ← Back to Dashboard
        </a>

        <h1 className="font-display text-4xl font-bold text-myna-charcoal mt-4">
          My Progress
        </h1>
        <p className="text-myna-charcoal/60 mt-2">
          Track your XP and level up
        </p>

        {/* XP Card */}
        <div className="mt-8 bg-white rounded-3xl shadow-sm p-8">
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-myna-orange">
                Current Level
              </p>
              <p className="font-display text-5xl font-bold text-myna-charcoal mt-2">
                {xp?.levelName}
              </p>
              <p className="text-myna-charcoal/60 mt-2">
                {xp?.totalXP} XP total
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-myna-orange">
                {xp?.xpToNextLevel}
              </p>
              <p className="text-xs text-myna-charcoal/60">
                XP to next level
              </p>
            </div>
          </div>

          <div className="h-4 bg-cream rounded-full overflow-hidden">
            <div
              className="h-full bg-myna-orange transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-myna-charcoal/60 mt-2">
            <span>{xp?.minXP} XP</span>
            <span>{xp?.maxXP} XP</span>
          </div>
        </div>

        {/* Transactions */}
        <div className="mt-10">
          <h2 className="font-display text-2xl font-bold text-myna-charcoal mb-4">
            Recent Activity
          </h2>

          {transactions.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-sm p-8 text-center">
              <p className="text-myna-charcoal/60">
                No activity yet. Start a podcast or complete an activity!
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
              {transactions.map((tx, idx) => (
                <div
                  key={tx.id}
                  className={`flex items-center justify-between p-5 ${
                    idx !== transactions.length - 1
                      ? "border-b border-cream"
                      : ""
                  }`}
                >
                  <div className="flex-1">
                    <p className="font-semibold text-myna-charcoal">
                      {sourceLabel(tx.source)}
                    </p>
                    {tx.note && (
                      <p className="text-sm text-myna-charcoal/60 mt-1">
                        {tx.note}
                      </p>
                    )}
                    <p className="text-xs text-myna-charcoal/40 mt-1">
                      {formatDate(tx.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-2xl font-bold text-myna-orange">
                      +{tx.amount}
                    </p>
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