"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getUser } from "@/lib/api";

type Stats = { students: number; parents: number; teachers: number; packages: number; podcasts: number };

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const user = getUser();
    if (!user) return router.push("/login");
    if (user.role !== "ADMIN") return router.push("/");
    loadStats();
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

  if (loading) return <main className="min-h-screen flex items-center justify-center"><p>Loading...</p></main>;

  return (
    <main className="min-h-screen bg-cream px-6 py-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="font-display text-4xl font-bold text-myna-charcoal">Admin Panel</h1>
        <p className="text-myna-charcoal/60 mt-2">Manage your platform</p>

        {error && <p className="mt-6 text-red-600">{error}</p>}

        {stats && (
          <div className="mt-8 grid gap-4 md:grid-cols-3 lg:grid-cols-5">
            {[
              ["Students", stats.students, "🎓"],
              ["Parents", stats.parents, "👨‍👩‍👧"],
              ["Teachers", stats.teachers, "👨‍🏫"],
              ["Packages", stats.packages, "📦"],
              ["Podcasts", stats.podcasts, "🎧"],
            ].map(([label, value, icon]) => (
              <div key={label as string} className="bg-white rounded-3xl shadow-sm p-6 text-center">
                <p className="text-3xl">{icon}</p>
                <p className="font-display text-3xl font-bold text-myna-charcoal mt-2">{value}</p>
                <p className="text-xs text-myna-charcoal/60 mt-1">{label}</p>
              </div>
            ))}
          </div>
        )}

        <h2 className="font-display text-2xl font-bold text-myna-charcoal mt-12 mb-4">Manage</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <a href="/admin/packages" className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md">
            <p className="font-bold">📦 Packages</p>
            <p className="text-xs text-myna-charcoal/60 mt-1">Edit prices and minutes</p>
          </a>
          <a href="/admin/podcasts" className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md">
  <p className="font-bold">🎧 Podcasts</p>
  <p className="text-xs text-myna-charcoal/60 mt-1">Manage podcast library</p>
</a>
<a href="/admin/users" className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md">
  <p className="font-bold">👥 Users</p>
  <p className="text-xs text-myna-charcoal/60 mt-1">Manage students, parents, teachers</p>
</a>
<a href="/admin/analytics" className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md">
  <p className="font-bold">📊 Analytics</p>
  <p className="text-xs text-myna-charcoal/60 mt-1">Revenue and stats</p>
</a>
<a href="/admin/content" className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md">
  <p className="font-bold">📚 Content</p>
  <p className="text-xs text-myna-charcoal/60 mt-1">Manage learning activities</p>
</a>
        </div>
      </div>
    </main>
  );
}