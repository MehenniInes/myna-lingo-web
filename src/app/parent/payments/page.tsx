"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getUser } from "@/lib/api";

type PackagePurchase = {
  id: string;
  createdAt: string;
  package: { id: string; minutes: number; priceDA: number };
};

type PodcastPurchase = {
  id: string;
  priceDA: number;
  createdAt: string;
  podcast: { id: string; title: string; coverUrl: string };
};

export default function ParentPaymentsPage() {
  const router = useRouter();
  const [packages, setPackages] = useState<PackagePurchase[]>([]);
  const [podcasts, setPodcasts] = useState<PodcastPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const u = getUser();
    if (!u) return router.push("/login");
    if (u.role !== "PARENT") return router.push("/student");
    load();
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

  const totalSpent =
    packages.reduce((s, p) => s + p.package.priceDA, 0) +
    podcasts.reduce((s, p) => s + p.priceDA, 0);

  return (
    <main className="min-h-screen bg-cream px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <a href="/parent" className="text-myna-orange font-semibold text-sm">← Back to Dashboard</a>
        <h1 className="font-display text-4xl font-bold text-myna-charcoal mt-4">Payments</h1>
        <p className="text-myna-charcoal/60 mt-2">Your payment history</p>

        {/* Total spent card */}
        <div className="mt-6 bg-white rounded-3xl shadow-sm p-8">
          <p className="text-xs font-bold uppercase tracking-wider text-myna-orange mb-2">Total Spent</p>
          <p className="font-display text-5xl font-bold text-myna-charcoal">
            {totalSpent} <span className="text-2xl text-myna-charcoal/60">DA</span>
          </p>
        </div>

        {error && <p className="mt-6 text-red-600">{error}</p>}

        {/* Packages */}
        <h2 className="font-display text-2xl font-bold text-myna-charcoal mt-10 mb-4">
          Minutes Packages
        </h2>
        {packages.length === 0 ? (
          <p className="text-myna-charcoal/60">No package purchases yet</p>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
            {packages.map((p, i) => (
              <div
                key={p.id}
                className={`flex items-center justify-between p-5 ${
                  i !== packages.length - 1 ? "border-b border-cream" : ""
                }`}
              >
                <div>
                  <p className="font-semibold text-myna-charcoal">
                    {p.package.minutes} minutes package
                  </p>
                  <p className="text-xs text-myna-charcoal/60 mt-1">{formatDate(p.createdAt)}</p>
                </div>
                <p className="font-display text-xl font-bold text-myna-orange">
                  {p.package.priceDA} DA
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Podcasts */}
        <h2 className="font-display text-2xl font-bold text-myna-charcoal mt-10 mb-4">
          Podcasts
        </h2>
        {podcasts.length === 0 ? (
          <p className="text-myna-charcoal/60">No podcast purchases yet</p>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
            {podcasts.map((p, i) => (
              <div
                key={p.id}
                className={`flex items-center justify-between p-5 ${
                  i !== podcasts.length - 1 ? "border-b border-cream" : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  <img
                    src={p.podcast.coverUrl}
                    alt={p.podcast.title}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                  <div>
                    <p className="font-semibold text-myna-charcoal">{p.podcast.title}</p>
                    <p className="text-xs text-myna-charcoal/60 mt-1">{formatDate(p.createdAt)}</p>
                  </div>
                </div>
                <p className="font-display text-xl font-bold text-myna-orange">
                  {p.priceDA} DA
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}