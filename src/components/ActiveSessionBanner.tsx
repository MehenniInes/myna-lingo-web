"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api, getToken } from "@/lib/api";

type ActivePresence = {
  id: string;
  status: string;
  session: {
    id: string;
    roomId: string;
    groupClass: { title: string };
  };
};

export default function ActiveSessionBanner() {
  const router = useRouter();
  const pathname = usePathname();
  const [presence, setPresence] = useState<ActivePresence | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const token = getToken();
    if (!token) return;

    // Don't poll if we're already inside the session room
    const isInsideRoom = pathname?.startsWith("/student/groups/");
    if (isInsideRoom) {
      setPresence(null);
      return;
    }

    let active = true;

    async function check() {
      try {
        const data = await api<ActivePresence | null>("/group-sessions/active", { auth: true });
        if (active) setPresence(data);
      } catch {
        if (active) setPresence(null);
      }
    }

    check();
    const interval = setInterval(check, 15000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [mounted, pathname]);

  if (!mounted || !presence) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-myna-charcoal text-white rounded-full shadow-2xl px-5 py-3 flex items-center gap-4">
      <span className="text-2xl">🟢</span>
      <div className="text-sm">
        <p className="font-semibold">
          You're still in "{presence.session.groupClass.title}"
        </p>
        <p className="text-white/60 text-xs font-mono">{presence.session.roomId}</p>
      </div>
      <button
        onClick={() => router.push(`/student/groups/${presence.session.id}`)}
        className="ml-2 px-4 py-2 rounded-full bg-myna-orange text-white font-semibold text-sm hover:bg-myna-orange/90 transition"
      >
        Rejoin
      </button>
    </div>
  );
}