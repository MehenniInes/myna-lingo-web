"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getUser } from "@/lib/api";
import { useLanguage } from "@/app/language-provider";

type MyPodcast = {
  id: string; podcastId: string; priceDA: number; createdAt: string;
  podcast: {
    id: string; title: string; description: string; coverUrl: string;
    level: string; category: string; durationSec: number; xpReward: number;
    language: { name: string };
  };
};

export default function MyPodcastsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [myPodcasts, setMyPodcasts] = useState<MyPodcast[]>([]);
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
      const data = await api<MyPodcast[]>("/podcasts/my", { auth: true });
      setMyPodcasts(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function formatDuration(sec: number) {
    const min = Math.floor(sec / 60);
    const s = sec % 60;
    return `${min}:${s.toString().padStart(2, "0")}`;
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

  return (
    <main className="min-h-screen bg-cream px-6 py-12">
      <div className="max-w-6xl mx-auto">
        <a href="/student" className="text-myna-orange font-semibold text-sm">{t("common.backToDashboard")}</a>
        <h1 className="font-display text-4xl font-bold text-myna-charcoal mt-4">{t("mypod.title")}</h1>
        <p className="text-myna-charcoal/60 mt-2">{t("mypod.subtitle")}</p>

        {myPodcasts.length === 0 ? (
          <div className="mt-8 bg-white rounded-3xl shadow-sm p-12 text-center">
            <p className="text-5xl mb-4">🎧</p>
            <p className="font-display text-2xl font-bold text-myna-charcoal">{t("mypod.empty")}</p>
            <p className="text-myna-charcoal/60 mt-2 mb-6">{t("mypod.emptySub")}</p>
            <a href="/podcasts" className="inline-block px-6 py-3 rounded-full bg-myna-orange text-white font-semibold">
              {t("mypod.browse")}
            </a>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {myPodcasts.map((item) => (
              <div key={item.id} className="bg-white rounded-3xl shadow-sm overflow-hidden hover:shadow-md transition">
                <img src={item.podcast.coverUrl} alt={item.podcast.title} className="w-full h-48 object-cover" />
                <div className="p-6">
                  <p className="text-xs font-bold uppercase tracking-wider text-myna-orange">
                    {item.podcast.language?.name} · {item.podcast.level}
                  </p>
                  <h3 className="font-display text-xl font-bold text-myna-charcoal mt-2">{item.podcast.title}</h3>
                  <p className="text-sm text-myna-charcoal/60 mt-2 line-clamp-2">{item.podcast.description}</p>
                  <div className="flex items-center justify-between mt-4 text-sm">
                    <span className="text-myna-charcoal/60">⏱ {formatDuration(item.podcast.durationSec)}</span>
                    <span className="text-myna-charcoal/60">⭐ {item.podcast.xpReward} XP</span>
                  </div>
                  <a
                    href={`/podcasts/${item.podcastId}`}
                    className="mt-6 block text-center py-3 rounded-full bg-myna-charcoal text-white font-semibold hover:bg-myna-charcoal/90 transition"
                  >
                    {t("mypod.listen")}
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}