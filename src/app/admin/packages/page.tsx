"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getUser } from "@/lib/api";

type Package = {
  id: string;
  priceDA: number;
  minutes: number;
  sortOrder: number;
  isActive: boolean;
};

export default function AdminPackagesPage() {
  const router = useRouter();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ priceDA: 0, minutes: 0, sortOrder: 0 });

  useEffect(() => {
    const user = getUser();
    if (!user) return router.push("/login");
    if (user.role !== "ADMIN") return router.push("/");
    load();
  }, []);

  async function load() {
    try {
      const data = await api<Package[]>("/admin/packages", { auth: true });
      setPackages(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function save(id: string) {
    try {
      await api(`/admin/packages/${id}`, { method: "PATCH", auth: true, body: form });
      setMsg("✅ Package updated");
      setEditing(null);
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function toggle(id: string, isActive: boolean) {
    try {
      if (isActive) {
        await api(`/admin/packages/${id}`, { method: "DELETE", auth: true });
      } else {
        await api(`/admin/packages/${id}`, { method: "PATCH", auth: true, body: { isActive: true } });
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
        <h1 className="font-display text-4xl font-bold text-myna-charcoal mt-4">Packages</h1>

        {msg && <p className="mt-4 text-green-700">{msg}</p>}
        {error && <p className="mt-4 text-red-600">{error}</p>}

        <div className="mt-8 space-y-4">
          {packages.map((p) => (
            <div key={p.id} className={`bg-white rounded-3xl shadow-sm p-6 ${!p.isActive ? "opacity-60" : ""}`}>
              {editing === p.id ? (
                <div className="grid gap-3 md:grid-cols-3">
                  <input type="number" value={form.priceDA} onChange={(e) => setForm({ ...form, priceDA: +e.target.value })} className="rounded-xl border px-4 py-2" placeholder="Price DA" />
                  <input type="number" value={form.minutes} onChange={(e) => setForm({ ...form, minutes: +e.target.value })} className="rounded-xl border px-4 py-2" placeholder="Minutes" />
                  <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: +e.target.value })} className="rounded-xl border px-4 py-2" placeholder="Sort order" />
                  <button onClick={() => save(p.id)} className="rounded-full bg-myna-orange text-white py-2 font-semibold md:col-span-3">Save</button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-display text-2xl font-bold">{p.minutes} minutes</p>
                    <p className="text-myna-charcoal/60">{p.priceDA} DA · order {p.sortOrder} {!p.isActive && "· INACTIVE"}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditing(p.id); setForm({ priceDA: p.priceDA, minutes: p.minutes, sortOrder: p.sortOrder }); }} className="px-4 py-2 rounded-full border font-semibold text-sm">Edit</button>
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