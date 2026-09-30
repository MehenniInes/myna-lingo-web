"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getUser } from "@/lib/api";
import { useLanguage } from "@/app/language-provider";
import { formatShortDateTime } from "@/lib/i18n";

type PackagePurchase = {
  id: string; createdAt: string;
  package: { id: string; minutes: number; priceDA: number };
};

type PodcastPurchase = {
  id: string; priceDA: number; createdAt: string;
  podcast: { id: string; title: string; coverUrl: string };
};

export default function ParentPaymentsPage() {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const [packages, setPackages] = useState<PackagePurchase[]>([]);
  const [podcasts, setPodcasts] = useState<PodcastPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const u = getUser();
    if (!u) return router.push("/login");
    if (u.role !== "PARENT") return router.push("/student");
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    try {
      const [pk, po] = await Promise.all([
        api<PackagePurchase[]>("/packages/my-purchases", { auth: true }).catch(() => []),
        api<PodcastPurchase[]>("/podcasts/my-purchases", { auth: true }).catch(() => []),
      ]);
      setPackages(pk);
      setPodcasts(po);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <main className="min-h-screen flex items-center justify-center">{t("common.loading")}</main>;

  const totalSpent =
    packages.reduce((s, p) => s + p.package.priceDA, 0) +
    podcasts.reduce((s, p) => s + p.priceDA, 0);

  return (
    <main className="min-h-screen bg-cream px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <a href="/parent" className="text-myna-orange font-semibold text-sm">{t("ppay.backToDashboard")}</a>
        <h1 className="font-display text-4xl font-bold text-myna-charcoal mt-4">{t("ppay.title")}</h1>
        <p className="text-myna-charcoal/60 mt-2">{t("ppay.subtitle")}</p>

        <div className="mt-6 bg-white rounded-3xl shadow-sm p-8">
          <p className="text-xs font-bold uppercase tracking-wider text-myna-orange mb-2">{t("ppay.totalSpent")}</p>
          <p className="font-display text-5xl font-bold text-myna-charcoal">
            {totalSpent} <span className="text-2xl text-myna-charcoal/60">{t("packages.da")}</span>
          </p>
        </div>

        {error && <p className="mt-6 text-red-600">{error}</p>}

        <h2 className="font-display text-2xl font-bold text-myna-charcoal mt-10 mb-4">{t("ppay.packagesTitle")}</h2>
        {packages.length === 0 ? (
          <p className="text-myna-charcoal/60">{t("ppay.noPackages")}</p>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
            {packages.map((p, i) => (
              <div key={p.id} className={`flex items-center justify-between p-5 ${i !== packages.length - 1 ? "border-b border-cream" : ""}`}>
                <div>
                  <p className="font-semibold text-myna-charcoal">
                    {t("ppay.minutesPkg", { n: p.package.minutes })}
                  </p>
                  <p className="text-xs text-myna-charcoal/60 mt-1">{formatShortDateTime(locale, p.createdAt)}</p>
                </div>
                <p className="font-display text-xl font-bold text-myna-orange">
                  {p.package.priceDA} {t("packages.da")}
                </p>
              </div>
            ))}
          </div>
        )}

        <h2 className="font-display text-2xl font-bold text-myna-charcoal mt-10 mb-4">{t("ppay.podcastsTitle")}</h2>
        {podcasts.length === 0 ? (
          <p className="text-myna-charcoal/60">{t("ppay.noPodcasts")}</p>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
            {podcasts.map((p, i) => (
              <div key={p.id} className={`flex items-center justify-between p-5 ${i !== podcasts.length - 1 ? "border-b border-cream" : ""}`}>
                <div className="flex items-center gap-4">
                  <img src={p.podcast.coverUrl} alt={p.podcast.title} className="w-12 h-12 rounded-xl object-cover" />
                  <div>
                    <p className="font-semibold text-myna-charcoal">{p.podcast.title}</p>
                    <p className="text-xs text-myna-charcoal/60 mt-1">{formatShortDateTime(locale, p.createdAt)}</p>
                  </div>
                </div>
                <p className="font-display text-xl font-bold text-myna-orange">
                  {p.priceDA} {t("packages.da")}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}