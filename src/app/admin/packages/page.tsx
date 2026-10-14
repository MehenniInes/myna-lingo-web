/*"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getUser } from "@/lib/api";
import { useLanguage } from "@/app/language-provider";

type Package = { id: string; priceDA: number; minutes: number; sortOrder: number; isActive: boolean };

export default function AdminPackagesPage() {
  const router = useRouter();
  const { t } = useLanguage();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setMsg(t("aPkg.updated"));
      setEditing(null);
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function toggle(id: string, isActive: boolean) {
    try {
      if (isActive) await api(`/admin/packages/${id}`, { method: "DELETE", auth: true });
      else await api(`/admin/packages/${id}`, { method: "PATCH", auth: true, body: { isActive: true } });
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  if (loading) return <main className="min-h-screen flex items-center justify-center">{t("common.loading")}</main>;

  return (
    <main className="min-h-screen bg-cream px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <a href="/admin" className="text-myna-orange font-semibold text-sm">{t("admin.backToAdmin")}</a>
        <h1 className="font-display text-4xl font-bold text-myna-charcoal mt-4">{t("aPkg.title")}</h1>

        {msg && <p className="mt-4 text-green-700">{msg}</p>}
        {error && <p className="mt-4 text-red-600">{error}</p>}

        <div className="mt-8 space-y-4">
          {packages.map((p) => (
            <div key={p.id} className={`bg-white rounded-3xl shadow-sm p-6 ${!p.isActive ? "opacity-60" : ""}`}>
              {editing === p.id ? (
                <div className="grid gap-3 md:grid-cols-3">
                  <input type="number" value={form.priceDA} onChange={(e) => setForm({ ...form, priceDA: +e.target.value })} className="rounded-xl border px-4 py-2" placeholder={t("aPkg.pricePh")} />
                  <input type="number" value={form.minutes} onChange={(e) => setForm({ ...form, minutes: +e.target.value })} className="rounded-xl border px-4 py-2" placeholder={t("aPkg.minutesPh")} />
                  <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: +e.target.value })} className="rounded-xl border px-4 py-2" placeholder={t("aPkg.sortPh")} />
                  <button onClick={() => save(p.id)} className="rounded-full bg-myna-orange text-white py-2 font-semibold md:col-span-3">{t("aPkg.save")}</button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-display text-2xl font-bold">{t("aPkg.minutes", { n: p.minutes })}</p>
                    <p className="text-myna-charcoal/60">
                      {t("aPkg.meta", { price: p.priceDA, order: p.sortOrder })}{" "}
                      {!p.isActive && t("aPkg.inactive")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditing(p.id); setForm({ priceDA: p.priceDA, minutes: p.minutes, sortOrder: p.sortOrder }); }} className="px-4 py-2 rounded-full border font-semibold text-sm">{t("aPkg.edit")}</button>
                    <button onClick={() => toggle(p.id, p.isActive)} className="px-4 py-2 rounded-full border font-semibold text-sm">{p.isActive ? t("aPkg.disable") : t("aPkg.enable")}</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}*/


"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getUser } from "@/lib/api";
import { useLanguage } from "@/app/language-provider";

type Package = { id: string; priceDA: number; minutes: number; sortOrder: number; isActive: boolean };

const emptyNewForm = { priceDA: 0, minutes: 0, sortOrder: 0 };

export default function AdminPackagesPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ priceDA: 0, minutes: 0, sortOrder: 0 });

  const [showAddForm, setShowAddForm] = useState(false);
  const [newForm, setNewForm] = useState(emptyNewForm);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const user = getUser();
    if (!user) return router.push("/login");
    if (user.role !== "ADMIN") return router.push("/");
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setMsg(t("aPkg.updated"));
      setEditing(null);
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function toggle(id: string, isActive: boolean) {
    try {
      if (isActive) await api(`/admin/packages/${id}`, { method: "DELETE", auth: true });
      else await api(`/admin/packages/${id}`, { method: "PATCH", auth: true, body: { isActive: true } });
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function createPackage(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setMsg("");

    if (newForm.minutes <= 0 || newForm.priceDA < 0) {
      setError("Minutes must be > 0 and Price must be >= 0");
      return;
    }

    setCreating(true);
    try {
      await api("/admin/packages", {
        method: "POST",
        auth: true,
        body: {
          minutes: Number(newForm.minutes),
          priceDA: Number(newForm.priceDA),
          sortOrder: Number(newForm.sortOrder),
        },
      });
      setMsg("Package created successfully");
      setNewForm(emptyNewForm);
      setShowAddForm(false);
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  if (loading) return <main className="min-h-screen flex items-center justify-center">{t("common.loading")}</main>;

  return (
    <main className="min-h-screen bg-cream px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <a href="/admin" className="text-myna-orange font-semibold text-sm">{t("admin.backToAdmin")}</a>

        <div className="flex justify-between items-center mt-4 gap-4 flex-wrap">
          <h1 className="font-display text-4xl font-bold text-myna-charcoal">{t("aPkg.title")}</h1>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-6 py-3 rounded-full bg-myna-orange text-white font-semibold text-sm hover:bg-myna-orange/90 transition"
          >
            {showAddForm ? "Cancel" : "+ Add New Package"}
          </button>
        </div>

        {msg && <p className="mt-4 text-green-700">{msg}</p>}
        {error && <p className="mt-4 text-red-600">{error}</p>}

        {showAddForm && (
          <div className="mt-8 bg-white rounded-3xl shadow-sm p-8">
            <h2 className="font-display text-2xl font-bold mb-6">New Package</h2>
            <form onSubmit={createPackage} className="space-y-4">
  <div>
    <label className="block text-sm font-bold text-myna-charcoal mb-1">
      📊 عدد الدقائق (Minutes)
    </label>
    <input
      type="number" min="1" required
      placeholder="مثال: 56"
      value={newForm.minutes}
      onChange={(e) => setNewForm({ ...newForm, minutes: +e.target.value })}
      className="w-full rounded-xl border px-4 py-2"
    />
    <p className="text-xs text-myna-charcoal/60 mt-1">عدد الدقائق اللي كيشريها الطالب</p>
  </div>

  <div>
    <label className="block text-sm font-bold text-myna-charcoal mb-1">
      💰 السعر بالدينار (Price in DA)
    </label>
    <input
      type="number" min="0" required
      placeholder="مثال: 100"
      value={newForm.priceDA}
      onChange={(e) => setNewForm({ ...newForm, priceDA: +e.target.value })}
      className="w-full rounded-xl border px-4 py-2"
    />
    <p className="text-xs text-myna-charcoal/60 mt-1">الثمن اللي كيدفعه الطالب</p>
  </div>

  <div>
    <label className="block text-sm font-bold text-myna-charcoal mb-1">
      🔢 ترتيب العرض (Sort Order)
    </label>
    <input
      type="number" min="0"
      placeholder="مثال: 1"
      value={newForm.sortOrder}
      onChange={(e) => setNewForm({ ...newForm, sortOrder: +e.target.value })}
      className="w-full rounded-xl border px-4 py-2"
    />
    <p className="text-xs text-myna-charcoal/60 mt-1">الترتيب اللي كيبان بيه فـ القائمة (1، 2، 3...)</p>
  </div>

  <button
    type="submit" disabled={creating}
    className="w-full rounded-full bg-myna-orange text-white py-3 font-semibold disabled:opacity-50"
  >
    {creating ? "Creating..." : "Create Package"}
  </button>
</form>
          </div>
        )}

        <div className="mt-8 space-y-4">
          {packages.map((p) => (
            <div key={p.id} className={`bg-white rounded-3xl shadow-sm p-6 ${!p.isActive ? "opacity-60" : ""}`}>
              {editing === p.id ? (
                <div className="grid gap-3 md:grid-cols-3">
                  <input type="number" value={form.priceDA} onChange={(e) => setForm({ ...form, priceDA: +e.target.value })} className="rounded-xl border px-4 py-2" placeholder={t("aPkg.pricePh")} />
                  <input type="number" value={form.minutes} onChange={(e) => setForm({ ...form, minutes: +e.target.value })} className="rounded-xl border px-4 py-2" placeholder={t("aPkg.minutesPh")} />
                  <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: +e.target.value })} className="rounded-xl border px-4 py-2" placeholder={t("aPkg.sortPh")} />
                  <button onClick={() => save(p.id)} className="rounded-full bg-myna-orange text-white py-2 font-semibold md:col-span-3">{t("aPkg.save")}</button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-display text-2xl font-bold">{t("aPkg.minutes", { n: p.minutes })}</p>
                    <p className="text-myna-charcoal/60">
                      {t("aPkg.meta", { price: p.priceDA, order: p.sortOrder })}{" "}
                      {!p.isActive && t("aPkg.inactive")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditing(p.id); setForm({ priceDA: p.priceDA, minutes: p.minutes, sortOrder: p.sortOrder }); }} className="px-4 py-2 rounded-full border font-semibold text-sm">{t("aPkg.edit")}</button>
                    <button onClick={() => toggle(p.id, p.isActive)} className="px-4 py-2 rounded-full border font-semibold text-sm">{p.isActive ? t("aPkg.disable") : t("aPkg.enable")}</button>
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