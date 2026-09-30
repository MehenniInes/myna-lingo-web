"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getUser } from "@/lib/api";
import { useLanguage } from "@/app/language-provider";
import { formatShortDateTime } from "@/lib/i18n";

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
  const { t, locale } = useLanguage();
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const u = getUser();
    if (!u) return router.push("/login");
    if (u.role !== "ADMIN") return router.push("/");
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  if (loading) return <main className="min-h-screen flex items-center justify-center">{t("common.loading")}</main>;
  if (!data) return <main className="min-h-screen flex items-center justify-center"><p className="text-red-600">{error}</p></main>;

  return (
    <main className="min-h-screen bg-cream px-6 py-12">
      <div className="max-w-6xl mx-auto">
        <a href="/admin" className="text-myna-orange font-semibold text-sm">{t("admin.backToAdmin")}</a>
        <h1 className="font-display text-4xl font-bold text-myna-charcoal mt-4">{t("aAnalytics.title")}</h1>
        <p className="text-myna-charcoal/60 mt-2">{t("aAnalytics.subtitle")}</p>

        <div className="mt-8 bg-white rounded-3xl shadow-sm p-8">
          <p className="text-xs font-bold uppercase tracking-wider text-myna-orange mb-2">{t("aAnalytics.totalRevenue")}</p>
          <p className="font-display text-5xl font-bold text-myna-charcoal">
            {data.revenue.total.toLocaleString()} <span className="text-2xl text-myna-charcoal/60">{t("packages.da")}</span>
          </p>
          <div className="flex gap-8 mt-4 text-sm text-myna-charcoal/60 flex-wrap">
            <span>{t("aAnalytics.pkgRev", { v: data.revenue.packages.toLocaleString() })}</span>
            <span>{t("aAnalytics.podRev", { v: data.revenue.podcasts.toLocaleString() })}</span>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3 lg:grid-cols-4">
          {([
            [t("aAnalytics.totalUsers"), data.users.total, "👥"],
            [t("aAnalytics.students"), data.users.students, "🎓"],
            [t("aAnalytics.parents"), data.users.parents, "👨‍👩‍👧"],
            [t("aAnalytics.teachers"), data.users.teachers, "👨‍🏫"],
            [t("aAnalytics.onlineTeachers"), data.users.activeTeachers, "🟢"],
            [t("aAnalytics.pkgSold"), data.purchases.packagesSold, "📦"],
            [t("aAnalytics.podSold"), data.purchases.podcastsSold, "🎧"],
            [t("aAnalytics.xpGiven"), data.xp.totalAwarded.toLocaleString(), "⭐"],
          ] as const).map(([label, value, icon]) => (
            <div key={label} className="bg-white rounded-3xl shadow-sm p-6 text-center">
              <p className="text-3xl">{icon}</p>
              <p className="font-display text-3xl font-bold text-myna-charcoal mt-2">{value}</p>
              <p className="text-xs text-myna-charcoal/60 mt-1">{label}</p>
            </div>
          ))}
        </div>

        <h2 className="font-display text-2xl font-bold text-myna-charcoal mt-12 mb-4">{t("aAnalytics.topPkgs")}</h2>
        {data.topPackages.length === 0 ? (
          <p className="text-myna-charcoal/60">{t("aAnalytics.noSales")}</p>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
            {data.topPackages.map((p, i) => (
              <div key={i} className={`flex items-center justify-between p-5 ${i !== data.topPackages.length - 1 ? "border-b border-cream" : ""}`}>
                <div className="flex items-center gap-4">
                  <span className="w-8 h-8 rounded-full bg-myna-orange text-white flex items-center justify-center text-sm font-bold">{i + 1}</span>
                  <p className="font-semibold text-myna-charcoal">
                    {t("aAnalytics.pkgLine", { minutes: p.minutes, price: p.priceDA })}
                  </p>
                </div>
                <p className="text-sm text-myna-charcoal/60">{t("aAnalytics.sales", { n: p.sales })}</p>
              </div>
            ))}
          </div>
        )}

        <h2 className="font-display text-2xl font-bold text-myna-charcoal mt-12 mb-4">{t("aAnalytics.recent")}</h2>
        {data.recentPurchases.length === 0 ? (
          <p className="text-myna-charcoal/60">{t("aAnalytics.noRecent")}</p>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
            {data.recentPurchases.map((p, i) => (
              <div key={p.id} className={`flex items-center justify-between p-5 ${i !== data.recentPurchases.length - 1 ? "border-b border-cream" : ""}`}>
                <div>
                  <p className="font-semibold text-myna-charcoal">{p.student}</p>
                  <p className="text-xs text-myna-charcoal/60 mt-1">
                    {t("aAnalytics.minLine", { minutes: p.minutes, date: formatShortDateTime(locale, p.createdAt) })}
                  </p>
                </div>
                <p className="font-display text-xl font-bold text-myna-orange">{p.priceDA} {t("packages.da")}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}