"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getUser } from "@/lib/api";
import { useLanguage } from "@/app/language-provider";
import { timeAgoShort } from "@/lib/i18n";

type Notification = {
  id: string; type: string; title: string; message: string;
  isRead: boolean; createdAt: string;
};

export default function NotificationsPage() {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const user = getUser();
    if (!user) { router.push("/login"); return; }
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadNotifications() {
    try {
      const data = await api<Notification[]>("/notifications", { auth: true });
      setNotifications(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(id: string) {
    try {
      await api(`/notifications/${id}/read`, { method: "POST", auth: true });
      setNotifications(notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch { /* silent */ }
  }

  async function markAllRead() {
    try {
      await api("/notifications/read-all", { method: "POST", auth: true });
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
    } catch { /* silent */ }
  }

  function icon(type: string) {
    const map: Record<string, string> = {
      MINUTES_ADDED: "⏱", PAYMENT_SUCCESS: "💳", PODCAST_PURCHASED: "🎧",
      XP_EARNED: "⭐", BOOKING_CONFIRMED: "📅", BOOKING_CANCELLED: "❌",
      CHILD_BOOKING: "👶", CHILD_PROGRESS: "📈", ANNOUNCEMENT: "📢",
      ADMIN_MESSAGE: "🛡",
    };
    return map[type] || "🔔";
  }

  if (loading) return <main className="min-h-screen flex items-center justify-center">{t("common.loading")}</main>;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <main className="min-h-screen bg-cream px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <a href="/student" className="text-myna-orange font-semibold text-sm">{t("common.backToDashboard")}</a>

        <div className="mt-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-4xl font-bold text-myna-charcoal">{t("notif.title")}</h1>
            <p className="text-myna-charcoal/60 mt-2">
              {unreadCount > 0
                ? unreadCount === 1
                  ? t("notif.unreadOne", { n: unreadCount })
                  : t("notif.unreadMany", { n: unreadCount })
                : t("notif.allRead")}
            </p>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="px-5 py-2.5 rounded-full border border-myna-charcoal/20 text-sm font-semibold hover:bg-white">
              {t("notif.markAll")}
            </button>
          )}
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">{error}</div>
        )}

        {notifications.length === 0 ? (
          <div className="mt-8 bg-white rounded-3xl shadow-sm p-12 text-center">
            <p className="text-5xl mb-4">🔔</p>
            <p className="font-display text-2xl font-bold text-myna-charcoal">{t("notif.empty")}</p>
            <p className="text-myna-charcoal/60 mt-2">{t("notif.emptySub")}</p>
          </div>
        ) : (
          <div className="mt-8 bg-white rounded-3xl shadow-sm overflow-hidden">
            {notifications.map((n, idx) => (
              <div
                key={n.id}
                onClick={() => !n.isRead && markAsRead(n.id)}
                className={`flex gap-4 p-5 transition ${
                  idx !== notifications.length - 1 ? "border-b border-cream" : ""
                } ${!n.isRead ? "bg-myna-orange/5 cursor-pointer hover:bg-myna-orange/10" : ""}`}
              >
                <div className="text-2xl flex-shrink-0">{icon(n.type)}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-myna-charcoal">{n.title}</p>
                    {!n.isRead && <span className="w-2 h-2 rounded-full bg-myna-orange" />}
                  </div>
                  <p className="text-sm text-myna-charcoal/70 mt-1">{n.message}</p>
                  <p className="text-xs text-myna-charcoal/40 mt-2">{timeAgoShort(locale, n.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}