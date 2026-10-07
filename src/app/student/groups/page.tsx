"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getUser } from "@/lib/api";
import { useLanguage } from "@/app/language-provider";
import { formatShortDateTime } from "@/lib/i18n";

type GroupClass = {
  id: string; title: string; description: string; languageId: string;
  teacherId: string; ageCategory: string; capacity: number; priceDA: number;
  startTime: string; endTime: string; isActive: boolean;
  language: { name: string };
  teacher: { user: { fullName: string } };
  participants: { id: string }[];
};

export default function GroupsPage() {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const [groups, setGroups] = useState<GroupClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [joining, setJoining] = useState<string | null>(null);
  const [starting, setStarting] = useState<string | null>(null);
  const [expandedSessions, setExpandedSessions] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Record<string, any[]>>({});
  const [userRole, setUserRole] = useState<string>("");

useEffect(() => {
  const user = getUser();
  if (user) setUserRole(user.role);
}, []);

  useEffect(() => {
    const user = getUser();
    if (!user) { router.push("/login"); return; }
    loadGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadGroups() {
    try {
      const data = await api<GroupClass[]>("/group-classes");
      setGroups(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function joinGroup(id: string) {
    setJoining(id); setMessage(""); setError("");
    try {
      await api(`/group-classes/${id}/join`, { method: "POST", auth: true });
      setMessage(t("groups.joined"));
      await loadGroups();
    } catch (err: any) {
      setError(err.message || t("groups.failed"));
    } finally {
      setJoining(null);
    }
  }

  
  function ageLabel(cat: string) {
    if (cat === "AGE_6_11") return t("groups.age6_11");
    if (cat === "AGE_12_14") return t("groups.age12_14");
    return cat;
  }

  async function loadSessions(groupClassId: string) {
    if (expandedSessions === groupClassId) {
      setExpandedSessions(null);
      return;
    }
    setExpandedSessions(groupClassId);
    if (sessions[groupClassId]) return;

    try {
      const data = await api<any[]>(`/group-classes/${groupClassId}/sessions`);
      setSessions((prev) => ({ ...prev, [groupClassId]: data }));
    } catch (err: any) {
      setError(err.message);
    }
  }

  function formatSessionTime(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function sessionDuration(start: string, end: string | null) {
    if (!end) return "—";
    const sec = Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 1000);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  }

  if (loading) {
    return <main className="min-h-screen flex items-center justify-center">{t("common.loading")}</main>;
  }

  return (
    <main className="min-h-screen bg-cream px-6 py-12">
      <div className="max-w-6xl mx-auto">
        <a href="/student" className="text-myna-orange font-semibold text-sm">{t("common.backToDashboard")}</a>
        <h1 className="font-display text-4xl font-bold text-myna-charcoal mt-4">{t("groups.title")}</h1>
        <p className="text-myna-charcoal/60 mt-2">{t("groups.subtitle")}</p>

        {message && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-2xl text-green-800 text-sm">{message}</div>
        )}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">{error}</div>
        )}

        {groups.length === 0 ? (
          <div className="mt-8 bg-white rounded-3xl shadow-sm p-12 text-center">
            <p className="text-5xl mb-4">👥</p>
            <p className="font-display text-2xl font-bold text-myna-charcoal">{t("groups.empty")}</p>
            <p className="text-myna-charcoal/60 mt-2">{t("groups.emptySub")}</p>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((g) => {
              const spotsLeft = g.capacity - g.participants.length;
              return (
                <div
                  key={g.id}
                  className="bg-white rounded-3xl shadow-sm p-6 hover:shadow-md transition flex flex-col"
                >
                  <span className="inline-block px-3 py-1 rounded-full bg-myna-orange/10 text-myna-orange text-xs font-bold self-start">
                    {g.language.name} · {ageLabel(g.ageCategory)}
                  </span>
                  <h3 className="font-display text-xl font-bold text-myna-charcoal mt-3">{g.title}</h3>
                  <p className="text-sm text-myna-charcoal/60 mt-2">{g.description}</p>
                  <div className="mt-4 space-y-1 text-xs text-myna-charcoal/70">
                    <p>👨‍🏫 {g.teacher.user.fullName}</p>
                    <p>📅 {formatShortDateTime(locale, g.startTime)}</p>
                    <p>👥 {t("groups.spots", { n: spotsLeft, cap: g.capacity })}</p>
                  </div>
                  <div className="mt-6 space-y-2 mt-auto pt-4">
                    <div className="flex items-center justify-between">
                      <span className="font-display text-2xl font-bold text-myna-charcoal">
                        {g.priceDA}
                        <span className="text-base text-myna-charcoal/60 ms-1">{t("packages.da")}</span>
                      </span>
                      <button
                        onClick={() => joinGroup(g.id)}
                        disabled={joining === g.id || spotsLeft <= 0}
                        className="px-5 py-2.5 rounded-full bg-myna-orange text-white font-semibold text-sm hover:bg-myna-orange/90 transition disabled:opacity-50"
                      >
                        {joining === g.id
                          ? t("groups.joining")
                          : spotsLeft <= 0
                            ? t("groups.full")
                            : t("groups.join")}
                      </button>
                    </div>

                    <button
                      onClick={() => loadSessions(g.id)}
                      className="w-full py-2 text-myna-charcoal/70 text-xs font-semibold hover:text-myna-orange transition"
                    >
                      {expandedSessions === g.id ? "▲ Hide previous sessions" : "▼ Show previous sessions"}
                    </button>

                    {expandedSessions === g.id && (
                      <div className="mt-3 pt-3 border-t border-cream">
                        {!sessions[g.id] ? (
                          <p className="text-xs text-myna-charcoal/50 text-center py-2">Loading...</p>
                        ) : sessions[g.id].length === 0 ? (
                          <p className="text-xs text-myna-charcoal/50 text-center py-2">
                            No previous sessions yet
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {sessions[g.id].map((s: any) => (
                              <div
                                key={s.id}
                                className="flex items-center justify-between text-xs bg-cream rounded-xl p-3"
                              >
                                <div>
                                  <p className="font-semibold text-myna-charcoal">
                                    {formatSessionTime(s.startedAt)}
                                  </p>
                                  <p className="text-myna-charcoal/50 mt-0.5">
                                    {s.status === "ACTIVE" ? "🟢 Live" : "✅ Completed"} · {s.participants.length} participants · {sessionDuration(s.startedAt, s.endedAt)}
                                  </p>
                                </div>
                                {s.status === "ACTIVE" ? (
                                  <button
                                    onClick={() => router.push(`/student/groups/${s.id}`)}
                                    className="px-3 py-1.5 rounded-full bg-green-600 text-white font-semibold"
                                  >
                                    Rejoin
                                  </button>
                                ) : (
                                  <span className="text-myna-charcoal/40 text-[10px] uppercase tracking-wide">
                                    Completed
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}