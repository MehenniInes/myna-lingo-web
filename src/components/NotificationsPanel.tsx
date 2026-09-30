"use client";

import { useEffect, useState, useRef } from "react";
import { api, getToken } from "@/lib/api";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export default function NotificationsPanel() {
  const [mounted, setMounted] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const token = getToken();
    setHasToken(!!token);
    if (!token) return;
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function loadUnreadCount() {
    try {
      const data = await api<{ unreadCount: number }>("/notifications/unread-count", { auth: true });
      setUnreadCount(data.unreadCount);
    } catch {
      // silent
    }
  }

  async function openPanel() {
    setOpen(!open);
    if (!open) {
      try {
        const data = await api<Notification[]>("/notifications", { auth: true });
        setNotifications(data);
      } catch {
        // silent
      }
    }
  }

  async function markAllRead() {
    try {
      await api("/notifications/read-all", { method: "POST", auth: true });
      setUnreadCount(0);
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
    } catch {
      // silent
    }
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

   // فـ الـ Server render، كنعرضو placeholder فارغ باش ما يصيرش Hydration Error
  if (!mounted) {
    return <div className="w-10 h-10" />;
  }

  // إلا ما كانش Token، ما كنعرضوش شي حاجة
  if (!hasToken) {
    return null;
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={openPanel}
        className="relative w-10 h-10 rounded-full flex items-center justify-center hover:bg-myna-orange/10 transition"
        aria-label="Notifications"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-lg border border-myna-charcoal/10 overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-cream">
            <p className="font-display font-bold text-myna-charcoal">Notifications</p>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-myna-orange font-semibold hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-center text-sm text-myna-charcoal/50 py-8">
                No notifications yet
              </p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 border-b border-cream last:border-0 ${
                    !n.isRead ? "bg-myna-orange/5" : ""
                  }`}
                >
                  <p className="text-sm font-semibold text-myna-charcoal">
                    {n.title}
                  </p>
                  <p className="text-xs text-myna-charcoal/70 mt-1">
                    {n.message}
                  </p>
                  <p className="text-[10px] text-myna-charcoal/40 mt-1">
                    {timeAgo(n.createdAt)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}