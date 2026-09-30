"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getUser } from "@/lib/api";
import { useLanguage } from "@/app/language-provider";
import { formatDateTime } from "@/lib/i18n";

type Booking = {
  id: string; scheduledAt: string; durationMin: number; status: string;
  serviceType: string; notes: string | null;
  teacher: { user: { fullName: string } };
};

export default function BookingsPage() {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"upcoming" | "completed" | "cancelled">("upcoming");
  const [error, setError] = useState("");

  useEffect(() => {
    const u = getUser();
    if (!u) return router.push("/login");
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    try {
      const data = await api<Booking[]>("/bookings/my", { auth: true });
      setBookings(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function cancel(id: string) {
    if (!confirm(t("bookings.cancelConfirm"))) return;
    try {
      await api(`/bookings/${id}`, { method: "DELETE", auth: true });
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  const now = new Date();
  const filtered = bookings.filter((b) => {
    if (tab === "upcoming") return (b.status === "PENDING" || b.status === "CONFIRMED") && new Date(b.scheduledAt) > now;
    if (tab === "completed") return b.status === "COMPLETED";
    return b.status === "CANCELLED";
  });

  function statusLabel(s: string) {
    if (s === "PENDING") return t("bookings.statusPending");
    if (s === "CONFIRMED") return t("bookings.statusConfirmed");
    if (s === "CANCELLED") return t("bookings.statusCancelled");
    return t("bookings.statusCompleted");
  }

  if (loading) return <main className="min-h-screen flex items-center justify-center">{t("common.loading")}</main>;

  return (
    <main className="min-h-screen bg-cream px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <a href="/student" className="text-myna-orange font-semibold text-sm">
          {t("common.backToDashboard")}
        </a>
        <h1 className="font-display text-4xl font-bold text-myna-charcoal mt-4">{t("bookings.title")}</h1>

        <div className="mt-6 flex gap-2 flex-wrap">
          {([
            ["upcoming", t("bookings.upcoming")],
            ["completed", t("bookings.completed")],
            ["cancelled", t("bookings.cancelled")],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setTab(value as any)}
              className={`px-5 py-2 rounded-full text-sm font-semibold ${
                tab === value ? "bg-myna-orange text-white" : "bg-white border"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {error && <p className="mt-6 text-red-600">{error}</p>}

        {filtered.length === 0 ? (
          <div className="mt-8 bg-white rounded-3xl shadow-sm p-12 text-center">
            <p className="text-5xl mb-4">📅</p>
            <p className="font-display text-2xl font-bold text-myna-charcoal">
              {t("bookings.noTab", { tab: statusLabel(tab === "upcoming" ? "CONFIRMED" : tab === "completed" ? "COMPLETED" : "CANCELLED").toLowerCase() })}
            </p>
            <a href="/student/call" className="mt-6 inline-block px-6 py-3 rounded-full bg-myna-orange text-white font-semibold">
              {t("bookings.findTeacher")}
            </a>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {filtered.map((b) => (
              <div key={b.id} className="bg-white rounded-3xl shadow-sm p-6">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-semibold text-myna-charcoal">
                      {t("bookings.lessonWith", { name: b.teacher.user.fullName })}
                    </p>
                    <p className="text-sm text-myna-charcoal/60 mt-1">📅 {formatDateTime(locale, b.scheduledAt)}</p>
                    <p className="text-xs text-myna-charcoal/50 mt-1">
                      {t("bookings.duration", { n: b.durationMin })} · {b.serviceType.replace("_", " ")}
                    </p>
                    {b.notes && <p className="text-xs text-myna-charcoal/60 mt-2 italic">"{b.notes}"</p>}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    b.status === "CONFIRMED" ? "bg-green-100 text-green-700" :
                    b.status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
                    b.status === "CANCELLED" ? "bg-red-100 text-red-700" :
                    "bg-blue-100 text-blue-700"
                  }`}>
                    {statusLabel(b.status)}
                  </span>
                </div>
                {(b.status === "PENDING" || b.status === "CONFIRMED") && (
                  <button onClick={() => cancel(b.id)} className="mt-4 text-sm text-red-600 font-semibold hover:underline">
                    {t("bookings.cancel")}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}