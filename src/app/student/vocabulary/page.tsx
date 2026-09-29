"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getUser } from "@/lib/api";

type Vocab = {
  id: string;
  word: string;
  meaning: string;
  translation: string;
  example: string;
  pronunciation: string | null;
  podcast: { id: string; title: string; coverUrl: string };
};

export default function VocabularyPage() {
  const router = useRouter();
  const [vocab, setVocab] = useState<Vocab[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const user = getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    loadVocab();
  }, []);

  async function loadVocab() {
    try {
      const data = await api<Vocab[]>("/podcasts/my-vocabulary", { auth: true });
      setVocab(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const filtered = vocab.filter(
    (v) =>
      v.word.toLowerCase().includes(search.toLowerCase()) ||
      v.translation.includes(search) ||
      v.meaning.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <a href="/student" className="text-myna-orange font-semibold text-sm">
          ← Back to Dashboard
        </a>

        <h1 className="font-display text-4xl font-bold text-myna-charcoal mt-4">
          My Vocabulary
        </h1>
        <p className="text-myna-charcoal/60 mt-2">
          Words you've learned from podcasts
        </p>

        <input
          type="text"
          placeholder="Search words..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mt-6 w-full rounded-xl border border-myna-charcoal/20 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-myna-orange"
        />

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
            {error}
          </div>
        )}

        {vocab.length === 0 ? (
          <div className="mt-8 bg-white rounded-3xl shadow-sm p-12 text-center">
            <p className="text-5xl mb-4">📖</p>
            <p className="font-display text-2xl font-bold text-myna-charcoal">
              No words yet
            </p>
            <p className="text-myna-charcoal/60 mt-2 mb-6">
              Listen to a podcast to build your vocabulary
            </p>
            <a
              href="/podcasts"
              className="inline-block px-6 py-3 rounded-full bg-myna-orange text-white font-semibold"
            >
              Browse Podcasts
            </a>
          </div>
        ) : filtered.length === 0 ? (
          <p className="mt-8 text-center text-myna-charcoal/60">
            No words match "{search}"
          </p>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {filtered.map((v) => (
              <div key={v.id} className="bg-white rounded-3xl shadow-sm p-6">
                <p className="font-display text-2xl font-bold text-myna-charcoal">
                  {v.word}
                </p>
                {v.pronunciation && (
                  <p className="text-sm text-myna-charcoal/50 italic">
                    /{v.pronunciation}/
                  </p>
                )}
                <p className="text-myna-orange font-semibold mt-2">
                  {v.translation}
                </p>
                <p className="text-sm text-myna-charcoal/70 mt-2">
                  {v.meaning}
                </p>
                <p className="text-xs text-myna-charcoal/60 mt-3 italic">
                  "{v.example}"
                </p>
                <p className="text-xs text-myna-charcoal/40 mt-3">
                  From: {v.podcast.title}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}