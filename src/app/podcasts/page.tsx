"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getUser } from "@/lib/api";

type Podcast = {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  level: string;
  category: string;
  durationSec: number;
  priceDA: number;
  xpReward: number;
  language: { name: string; code: string };
};

export default function PodcastsPage() {
  const router = useRouter();
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [myPodcasts, setMyPodcasts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const user = getUser();
    setLoggedIn(!!user);
    loadPodcasts();
    if (user) loadMyPodcasts();
  }, []);

  async function loadPodcasts() {
    try {
      const data = await api<Podcast[]>("/podcasts");
      setPodcasts(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadMyPodcasts() {
    try {
      const data = await api<{ podcast: { id: string } }[]>("/podcasts/my", { auth: true });
      setMyPodcasts(data.map((p) => p.podcast.id));
    } catch {
      // silent
    }
  }

  async function buyPodcast(podcastId: string) {
    if (!loggedIn) {
      router.push("/login");
      return;
    }
    setBuying(podcastId);
    setMessage("");
    setError("");

    try {
      await api(`/podcasts/${podcastId}/purchase`, {
        method: "POST",
        auth: true,
      });
      setMessage("✅ Podcast purchased!");
      await loadMyPodcasts();
    } catch (err: any) {
      setError(err.message || "Purchase failed");
    } finally {
      setBuying(null);
    }
  }

  function formatDuration(sec: number) {
    const min = Math.floor(sec / 60);
    const s = sec % 60;
    return `${min}:${s.toString().padStart(2, "0")}`;
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream px-6 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold text-myna-charcoal">
            Podcasts
          </h1>
          <p className="text-myna-charcoal/60 mt-2">
            Listen, learn, and earn XP
          </p>
        </div>

        {message && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl text-green-800 text-sm">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {podcasts.map((pod) => {
            const owned = myPodcasts.includes(pod.id);
            return (
              <div
                key={pod.id}
                className="bg-white rounded-3xl shadow-sm overflow-hidden hover:shadow-md transition"
              >
                <img
                  src={pod.coverUrl}
                  alt={pod.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-myna-orange">
                      {pod.language?.name} · {pod.level}
                    </span>
                  </div>
                  <h3 className="font-display text-xl font-bold text-myna-charcoal">
                    {pod.title}
                  </h3>
                  <p className="text-sm text-myna-charcoal/60 mt-2 line-clamp-2">
                    {pod.description}
                  </p>

                  <div className="flex items-center justify-between mt-4 text-sm">
                    <span className="text-myna-charcoal/60">
                      ⏱ {formatDuration(pod.durationSec)}
                    </span>
                    <span className="text-myna-charcoal/60">
                      ⭐ {pod.xpReward} XP
                    </span>
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    {owned ? (
                      <a
                        href={`/podcasts/${pod.id}`}
                        className="w-full text-center py-3 rounded-full bg-myna-charcoal text-white font-semibold"
                      >
                        ▶ Listen Now
                      </a>
                    ) : (
                      <>
                        <span className="font-display text-2xl font-bold text-myna-charcoal">
                          {pod.priceDA} <span className="text-base text-myna-charcoal/60">DA</span>
                        </span>
                        <button
                          onClick={() => buyPodcast(pod.id)}
                          disabled={buying === pod.id}
                          className="px-6 py-3 rounded-full bg-myna-orange text-white font-semibold text-sm hover:bg-myna-orange/90 transition disabled:opacity-50"
                        >
                          {buying === pod.id ? "Buying..." : "Buy"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {podcasts.length === 0 && (
          <p className="text-center text-myna-charcoal/60">
            No podcasts available yet
          </p>
        )}
      </div>
    </main>
  );
}