"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getUser } from "@/lib/api";
import { useLanguage } from "@/app/language-provider";

type Activity = {
  id: string; type: string; title: string; description: string | null;
  xpReward: number; isActive: boolean;
  questions: { id: string; question: string }[];
};

const TYPES = [
  "ICEBREAKER", "VISUAL_EXPRESSION", "DEBATE", "SHADOWING",
  "PERSONAL_TOPIC", "SHORT_STORY", "VOCABULARY_CHALLENGE",
];

export default function AdminContentPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", type: "ICEBREAKER", xpReward: 20 });

  useEffect(() => {
    const u = getUser();
    if (!u) return router.push("/login");
    if (u.role !== "ADMIN") return router.push("/");
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    try {
      const data = await api<Activity[]>("/admin/activities", { auth: true });
      setActivities(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function create() {
    try {
      await api("/admin/activities", { method: "POST", auth: true, body: { ...form, content: {}, isActive: true } });
      setMsg(t("aContent.created"));
      setShowCreate(false);
      setForm({ title: "", description: "", type: "ICEBREAKER", xpReward: 20 });
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function save(id: string) {
    try {
      await api(`/admin/activities/${id}`, { method: "PATCH", auth: true, body: form });
      setMsg(t("aContent.updated"));
      setEditing(null);
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function toggle(id: string, isActive: boolean) {
    try {
      if (isActive) await api(`/admin/activities/${id}`, { method: "DELETE", auth: true });
      else await api(`/admin/activities/${id}`, { method: "PATCH", auth: true, body: { isActive: true } });
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  function typeLabel(tp: string) {
    const map: Record<string, string> = {
      ICEBREAKER: t("aContent.typeIcebreaker"),
      VISUAL_EXPRESSION: t("aContent.typeVisual"),
      DEBATE: t("aContent.typeDebate"),
      SHADOWING: t("aContent.typeShadowing"),
      PERSONAL_TOPIC: t("aContent.typePersonal"),
      SHORT_STORY: t("aContent.typeStory"),
      VOCABULARY_CHALLENGE: t("aContent.typeVocab"),
    };
    return map[tp] || tp;
  }

  if (loading) return <main className="min-h-screen flex items-center justify-center">{t("common.loading")}</main>;

  return (
    <main className="min-h-screen bg-cream px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <a href="/admin" className="text-myna-orange font-semibold text-sm">{t("admin.backToAdmin")}</a>

        <div className="mt-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-4xl font-bold text-myna-charcoal">{t("aContent.title")}</h1>
            <p className="text-myna-charcoal/60 mt-2">{t("aContent.subtitle")}</p>
          </div>
          <button onClick={() => setShowCreate(!showCreate)} className="px-6 py-3 rounded-full bg-myna-orange text-white font-semibold text-sm">
            {showCreate ? t("aContent.cancel") : t("aContent.newBtn")}
          </button>
        </div>

        {msg && <p className="mt-4 text-green-700">{msg}</p>}
        {error && <p className="mt-4 text-red-600">{error}</p>}

        {showCreate && (
          <div className="mt-6 bg-white rounded-3xl shadow-sm p-6">
            <h2 className="font-display text-xl font-bold mb-4">{t("aContent.newTitle")}</h2>
            <div className="grid gap-3">
              <input placeholder={t("aContent.titlePh")} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="rounded-xl border px-4 py-3" />
              <input placeholder={t("aContent.descPh")} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-xl border px-4 py-3" />
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="rounded-xl border px-4 py-3">
                {TYPES.map((tp) => <option key={tp} value={tp}>{typeLabel(tp)}</option>)}
              </select>
              <input type="number" placeholder={t("aContent.xpPh")} value={form.xpReward} onChange={(e) => setForm({ ...form, xpReward: +e.target.value })} className="rounded-xl border px-4 py-3" />
              <button onClick={create} className="rounded-full bg-myna-orange text-white py-3 font-semibold">{t("aContent.create")}</button>
            </div>
          </div>
        )}

        <div className="mt-8 space-y-4">
          {activities.length === 0 ? (
            <p className="text-center text-myna-charcoal/60">{t("aContent.none")}</p>
          ) : (
            activities.map((a) => (
              <div key={a.id} className={`bg-white rounded-3xl shadow-sm p-6 ${!a.isActive ? "opacity-50" : ""}`}>
                {editing === a.id ? (
                  <div className="grid gap-3">
                    <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="rounded-xl border px-4 py-2" />
                    <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-xl border px-4 py-2" />
                    <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="rounded-xl border px-4 py-2">
                      {TYPES.map((tp) => <option key={tp} value={tp}>{typeLabel(tp)}</option>)}
                    </select>
                    <input type="number" value={form.xpReward} onChange={(e) => setForm({ ...form, xpReward: +e.target.value })} className="rounded-xl border px-4 py-2" />
                    <button onClick={() => save(a.id)} className="rounded-full bg-myna-orange text-white py-2 font-semibold">{t("aContent.save")}</button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <span className="text-xs font-bold text-myna-orange">{typeLabel(a.type)}</span>
                      <p className="font-display text-xl font-bold text-myna-charcoal mt-1">{a.title}</p>
                      <p className="text-sm text-myna-charcoal/60 mt-1">{a.description}</p>
                      <p className="text-xs text-myna-charcoal/50 mt-2">
                        ⭐ {a.xpReward} XP · {t("aContent.qCount", { n: a.questions.length })}
                        {!a.isActive && ` ${t("aContent.inactive")}`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setEditing(a.id); setForm({ title: a.title, description: a.description || "", type: a.type, xpReward: a.xpReward }); }}
                        className="px-4 py-2 rounded-full border font-semibold text-sm"
                      >
                        {t("aContent.edit")}
                      </button>
                      <button onClick={() => toggle(a.id, a.isActive)} className="px-4 py-2 rounded-full border font-semibold text-sm">
                        {a.isActive ? t("aContent.disable") : t("aContent.enable")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}