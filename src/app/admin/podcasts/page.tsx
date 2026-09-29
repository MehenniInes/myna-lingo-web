"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getUser } from "@/lib/api";

type Podcast = {
  id: string;
  title: string;
  description: string;
  priceDA: number;
  durationSec: number;
  xpReward: number;
  level: string;
  category: string;
  isActive: boolean;
  language: { name: string };
};

export default function AdminPodcastsPage() {
  const router = useRouter();
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ priceDA: 0, xpReward: 0, title: "" });

  useEffect(() => {
    const user = getUser();
    if (!user) return router.push("/login");
    if (user.role !== "ADMIN") return router.push("/");
    load();
  }, []);

  async function load() {
    try {
      const data = await api<Podcast[]>("/admin/podcasts", { auth: true });
      setPodcasts(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function save(id: string) {
    try {
      await api(`/admin/podcasts/${id}`, { method: "PATCH", auth: true, body: form });
      setMsg("✅ Podcast updated");
      setEditing(null);
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function toggle(id: string, isActive: boolean) {
    try {
      if (isActive) {
        await api(`/admin/podcasts/${id}`, { method: "DELETE", auth: true });
      } else {
        await api(`/admin/podcasts/${id}`, { method: "PATCH", auth: true, body: { isActive: true } });
      }
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  if (loading) return <main className="min-h-screen flex items-center justify-center"><p>Loading...</p></main>;

  return (
    <main className="min-h-screen bg-cream px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <a href="/admin" className="text-myna-orange font-semibold text-sm">← Back to Admin</a>
        <h1 className="font-display text-4xl font-bold text-myna-charcoal mt-4">Podcasts</h1>

        {msg && <p className="mt-4 text-green-700">{msg}</p>}
        {error && <p className="mt-4 text-red-600">{error}</p>}

        <div className="mt-8 space-y-4">
          {podcasts.map((p) => (
            <div key={p.id} className={`bg-white rounded-3xl shadow-sm p-6 ${!p.isActive ? "opacity-60" : ""}`}>
              {editing === p.id ? (
                <div className="grid gap-3 md:grid-cols-3">
                  <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="rounded-xl border px-4 py-2 md:col-span-3" placeholder="Title" />
                  <input type="number" value={form.priceDA} onChange={(e) => setForm({ ...form, priceDA: +e.target.value })} className="rounded-xl border px-4 py-2" placeholder="Price DA" />
                  <input type="number" value={form.xpReward} onChange={(e) => setForm({ ...form, xpReward: +e.target.value })} className="rounded-xl border px-4 py-2" placeholder="XP Reward" />
                  <button onClick={() => save(p.id)} className="rounded-full bg-myna-orange text-white py-2 font-semibold md:col-span-3">Save</button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-display text-xl font-bold">{p.title}</p>
                    <p className="text-sm text-myna-charcoal/60 mt-1">
                      {p.language?.name} · {p.level} · {p.priceDA} DA · {p.xpReward} XP
                      {!p.isActive && " · INACTIVE"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditing(p.id); setForm({ priceDA: p.priceDA, xpReward: p.xpReward, title: p.title }); }} className="px-4 py-2 rounded-full border font-semibold text-sm">Edit</button>
                    <button onClick={() => toggle(p.id, p.isActive)} className="px-4 py-2 rounded-full border font-semibold text-sm">{p.isActive ? "Disable" : "Enable"}</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}