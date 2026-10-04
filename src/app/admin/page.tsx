"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getUser } from "@/lib/api";
import { useLanguage } from "@/app/language-provider";
import LanguageSwitcher from "@/components/LanguageSwitcher";

type Stats = { students: number; parents: number; teachers: number; packages: number; podcasts: number };

export default function AdminDashboard() {
  const router = useRouter();
  const { t } = useLanguage();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const user = getUser();
    if (!user) return router.push("/login");
    if (user.role !== "ADMIN") return router.push("/");
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadStats() {
    try {
      const data = await api<Stats>("/admin/stats", { auth: true });
      setStats(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <main className="min-h-screen flex items-center justify-center">{t("common.loading")}</main>;

  return (
    <main className="min-h-screen bg-cream px-6 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-4xl font-bold text-myna-charcoal">{t("admin.title")}</h1>
            <p className="text-myna-charcoal/60 mt-2">{t("admin.subtitle")}</p>
          </div>
          <LanguageSwitcher />
        </div>

        {error && <p className="mt-6 text-red-600">{error}</p>}

        {stats && (
          <div className="mt-8 grid gap-4 md:grid-cols-3 lg:grid-cols-5">
            {[
              [t("admin.students"), stats.students, "🎓"],
              [t("admin.parents"), stats.parents, "👨‍👩‍👧"],
              [t("admin.teachers"), stats.teachers, "👨‍🏫"],
              [t("admin.packages"), stats.packages, "📦"],
              [t("admin.podcasts"), stats.podcasts, "🎧"],
            ].map(([label, value, icon]) => (
              <div key={label as string} className="bg-white rounded-3xl shadow-sm p-6 text-center">
                <p className="text-3xl">{icon}</p>
                <p className="font-display text-3xl font-bold text-myna-charcoal mt-2">{value}</p>
                <p className="text-xs text-myna-charcoal/60 mt-1">{label}</p>
              </div>
            ))}
          </div>
        )}

        <h2 className="font-display text-2xl font-bold text-myna-charcoal mt-12 mb-4">{t("admin.manage")}</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <a href="/admin/packages" className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md">
            <p className="font-bold">📦 {t("admin.packages")}</p>
            <p className="text-xs text-myna-charcoal/60 mt-1">{t("admin.editPrices")}</p>
          </a>
          <a href="/admin/podcasts" className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md">
            <p className="font-bold">🎧 {t("admin.podcasts")}</p>
            <p className="text-xs text-myna-charcoal/60 mt-1">{t("admin.managePodcasts")}</p>
          </a>
          <a href="/admin/users" className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md">
            <p className="font-bold">👥 {t("admin.users")}</p>
            <p className="text-xs text-myna-charcoal/60 mt-1">{t("admin.manageUsers")}</p>
          </a>
          <a href="/admin/analytics" className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md">
            <p className="font-bold">📊 {t("admin.analytics")}</p>
            <p className="text-xs text-myna-charcoal/60 mt-1">{t("admin.revenueStats")}</p>
          </a>
          <a href="/admin/content" className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md">
            <p className="font-bold">📚 {t("admin.content")}</p>
            <p className="text-xs text-myna-charcoal/60 mt-1">{t("admin.manageActivities")}</p>
          </a>
           <a href="/admin/applications" className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md">
            <p className="font-bold">📝 Teacher Applications</p>
            <p className="text-xs text-myna-charcoal/60 mt-1">Approve or reject new teachers</p>
          </a>
        </div>
      </div>
    </main>
  );
}