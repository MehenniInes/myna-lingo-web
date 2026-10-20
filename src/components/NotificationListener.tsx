"use client";

import { useEffect, useState } from "react";
import { getChatSocket } from "@/lib/chatSocket";

export default function NotificationListener() {
  const [toast, setToast] = useState<{ title: string; message: string } | null>(null);

  useEffect(() => {
    const socket = getChatSocket();

    socket.on("new_notification", (data: { title: string; message: string }) => {
      setToast(data);
      // الكارطة غادي تطيح بوحدها من بعد 5 ثواني
      setTimeout(() => setToast(null), 5000);
    });

    return () => {
      socket.off("new_notification");
    };
  }, []);

  if (!toast) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-white border-l-4 border-myna-orange shadow-xl rounded-xl p-4 max-w-sm animate-bounce">
      <p className="font-bold text-myna-charcoal">{toast.title}</p>
      <p className="text-sm text-gray-600 mt-1">{toast.message}</p>
    </div>
  );
}