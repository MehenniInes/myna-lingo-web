"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getUser, logout } from "@/lib/api";

type Balance = {
  balanceSeconds: number;
  formatted: string;
};

type XPBalance = {
  totalXP: number;
  level: number;
  levelName: string;
  minXP: number;
  maxXP: number;
  progressInLevel: number;
  xpToNextLevel: number;
};

export default function StudentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [xp, setXp] = useState<XPBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser) {
      router.push("/login");
      return;
    }
    setUser(currentUser);
    loadData();
  }, []);

  async function loadData() {
    try {
      const [balanceData, xpData] = await Promise.all([
        api<Balance>("/minutes/balance", { auth: true }),
        api<XPBalance>("/xp/balance", { auth: true }),
      ]);
      setBalance(balanceData);
      setXp(xpData);
    } catch (err: any) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-myna-charcoal">Loading...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="bg-white rounded-3xl shadow-sm p-8 max-w-md w-full text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-6 py-3 rounded-full bg-myna-orange text-white font-semibold"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream px-6 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-myna-charcoal">
              Welcome, {user?.fullName}
            </h1>
            <p className="text-myna-charcoal/60 text-sm mt-1">
              Your learning dashboard
            </p>
          </div>
          <button
            onClick={logout}
            className="px-5 py-2 rounded-full border border-myna-charcoal/20 text-sm font-semibold hover:bg-white"
          >
            Logout
          </button>
        </div>

        {/* Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Minutes Card */}
          <div className="bg-white rounded-3xl shadow-sm p-8">
            <p className="text-xs font-bold uppercase tracking-wider text-myna-orange mb-2">
              Minutes Balance
            </p>
            <p className="font-display text-5xl font-bold text-myna-charcoal">
              {balance?.formatted}
            </p>
            <p className="text-sm text-myna-charcoal/60 mt-2">
              {balance?.balanceSeconds} seconds
            </p>
            <a
              href="/student/packages"
              className="mt-6 inline-block px-6 py-3 rounded-full bg-myna-orange text-white font-semibold text-sm"
            >
              Buy More Minutes
            </a>
          </div>

          {/* XP Card */}
          <div className="bg-white rounded-3xl shadow-sm p-8">
            <p className="text-xs font-bold uppercase tracking-wider text-myna-orange mb-2">
              Level Progress
            </p>
            <p className="font-display text-5xl font-bold text-myna-charcoal">
              {xp?.levelName}
            </p>
            <p className="text-sm text-myna-charcoal/60 mt-2">
              {xp?.totalXP} XP total
            </p>
            <div className="mt-4 h-3 bg-cream rounded-full overflow-hidden">
              <div
                className="h-full bg-myna-orange transition-all"
                style={{
                  width: `${((xp?.progressInLevel || 0) / 500) * 100}%`,
                }}
              />
            </div>
            <p className="text-xs text-myna-charcoal/60 mt-2">
              {xp?.xpToNextLevel} XP to next level
            </p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <a href="/podcasts" className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition">
            <p className="font-bold text-myna-charcoal">🎧 Podcasts</p>
            <p className="text-xs text-myna-charcoal/60 mt-1">Listen and learn</p>
          </a>
          <a href="/student/packages" className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition">
            <p className="font-bold text-myna-charcoal">📦 Packages</p>
            <p className="text-xs text-myna-charcoal/60 mt-1">Buy minutes</p>
          </a>
          <a href="/student/progress" className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition">
            <p className="font-bold text-myna-charcoal">⭐ Progress</p>
            <p className="text-xs text-myna-charcoal/60 mt-1">See your XP</p>
          </a>
          <a href="/student/groups" className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition">
  <p className="font-bold text-myna-charcoal">👥 Group Classes</p>
  <p className="text-xs text-myna-charcoal/60 mt-1">Join a class</p>
</a>
<a href="/student/vocabulary" className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition">
  <p className="font-bold text-myna-charcoal">📖 Vocabulary</p>
  <p className="text-xs text-myna-charcoal/60 mt-1">Words you learned</p>
</a>
<a href="/student/call" className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition">
  <p className="font-bold text-myna-charcoal">📞 Call a Teacher</p>
  <p className="text-xs text-myna-charcoal/60 mt-1">Start a live lesson</p>
</a>
<a href="/student/bookings" className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition">
  <p className="font-bold text-myna-charcoal">📅 My Bookings</p>
  <p className="text-xs text-myna-charcoal/60 mt-1">Scheduled lessons</p>
</a>
        </div>
      </div>
    </main>
  );
}