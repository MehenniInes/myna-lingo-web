"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getUser } from "@/lib/api";

type Analytics = {
  users: { total: number; students: number; parents: number; teachers: number; activeTeachers: number };
  purchases: { packagesSold: number; podcastsSold: number };
  revenue: { packages: number; podcasts: number; total: number };
  xp: { totalAwarded: number };
  topPackages: { minutes: number; priceDA: number; sales: number }[];
  recentPurchases: { id: string; student: string; minutes: number; priceDA: number; createdAt: string }[];
};

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const u = getUser();
    if (!u) return router.push("/login");
    if (u.role !== "ADMIN") return router.push("/");
    load();
  }, []);

  async function load() {
    try {
      const d = await api<Analytics>("/admin/analytics", { auth: true });
      setData(d);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(s: string) {
    return new Date(s).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (loading) return <main className="min-h-screen flex items-center justify-center"><p>Loading...</p></main>;
  if (!data) return <main className="min-h-screen flex items-center justify-center"><p className="text-red-600">{error}</p></main>;

  return (
    <main className="min-h-screen bg-cream px-6 py-12">
      <div className="max-w-6xl mx-auto">
        <a href="/admin" className="text-myna-orange font-semibold text-sm">← Back to Admin</a>
        <h1 className="font-display text-4xl font-bold text-myna-charcoal mt-4">Analytics</h1>
        <p className="text-myna-charcoal/60 mt-2">Platform overview</p>

        {/* Revenue card */}
        <div className="mt-8 bg-white rounded-3xl shadow-sm p-8">
          <p className="text-xs font-bold uppercase tracking-wider text-myna-orange mb-2">Total Revenue</p>
          <p className="font-display text-5xl font-bold text-myna-charcoal">
            {data.revenue.total.toLocaleString()} <span className="text-2xl text-myna-charcoal/60">DA</span>
          </p>
          <div className="flex gap-8 mt-4 text-sm text-myna-charcoal/60">
            <span>📦 Packages: {data.revenue.packages.toLocaleString()} DA</span>
            <span>🎧 Podcasts: {data.revenue.podcasts.toLocaleString()} DA</span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="mt-6 grid gap-4 md:grid-cols-3 lg:grid-cols-4">
          {[
            ["Total Users", data.users.total, "👥"],
            ["Students", data.users.students, "🎓"],
            ["Parents", data.users.parents, "👨‍👩‍👧"],
            ["Teachers", data.users.teachers, "👨‍🏫"],
            ["Online Teachers", data.users.activeTeachers, "🟢"],
            ["Packages Sold", data.purchases.packagesSold, "📦"],
            ["Podcasts Sold", data.purchases.podcastsSold, "🎧"],
            ["Total XP Given", data.xp.totalAwarded.toLocaleString(), "⭐"],
          ].map(([label, value, icon]) => (
            <div key={label as string} className="bg-white rounded-3xl shadow-sm p-6 text-center">
              <p className="text-3xl">{icon}</p>
              <p className="font-display text-3xl font-bold text-myna-charcoal mt-2">{value}</p>
              <p className="text-xs text-myna-charcoal/60 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Top Packages */}
        <h2 className="font-display text-2xl font-bold text-myna-charcoal mt-12 mb-4">Top Packages</h2>
        {data.topPackages.length === 0 ? (
          <p className="text-myna-charcoal/60">No sales yet</p>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
            {data.topPackages.map((p, i) => (
              <div
                key={i}
                className={`flex items-center justify-between p-5 ${i !== data.topPackages.length - 1 ? "border-b border-cream" : ""}`}
              >
                <div className="flex items-center gap-4">
                  <span className="w-8 h-8 rounded-full bg-myna-orange text-white flex items-center justify-center text-sm font-bold">
                    {i + 1}
                  </span>
                  <p className="font-semibold text-myna-charcoal">
                    {p.minutes} minutes · {p.priceDA} DA
                  </p>
                </div>
                <p className="text-sm text-myna-charcoal/60">{p.sales} sales</p>
              </div>
            ))}
          </div>
        )}

        {/* Recent Purchases */}
        <h2 className="font-display text-2xl font-bold text-myna-charcoal mt-12 mb-4">Recent Package Purchases</h2>
        {data.recentPurchases.length === 0 ? (
          <p className="text-myna-charcoal/60">No recent purchases</p>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
            {data.recentPurchases.map((p, i) => (
              <div
                key={p.id}
                className={`flex items-center justify-between p-5 ${i !== data.recentPurchases.length - 1 ? "border-b border-cream" : ""}`}
              >
                <div>
                  <p className="font-semibold text-myna-charcoal">{p.student}</p>
                  <p className="text-xs text-myna-charcoal/60 mt-1">
                    {p.minutes} minutes · {formatDate(p.createdAt)}
                  </p>
                </div>
                <p className="font-display text-xl font-bold text-myna-orange">{p.priceDA} DA</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}