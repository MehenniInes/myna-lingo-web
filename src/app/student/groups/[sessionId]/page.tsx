"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, getUser } from "@/lib/api";

import dynamic from "next/dynamic";

const VideoCall = dynamic(() => import("@/components/VideoCall"), {
  ssr: false,
  loading: () => (
    <div className="bg-white/5 rounded-3xl p-12 text-center border border-white/10">
      <p className="text-white/40">Loading video...</p>
    </div>
  ),
});


type Session = {
  id: string;
  roomId: string;
  status: string;
  startedAt: string;
  groupClass: {
    id: string;
    title: string;
    language: { name: string };
    teacher: { user: { fullName: string } };
  };
  participants: {
    id: string;
    status: string;
    user: { id: string; fullName: string };
  }[];
};

export default function GroupSessionRoomPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [connectionLost, setConnectionLost] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const user = getUser();
    if (!user) return router.push("/login");
    joinAndStart();
    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionId]);

  async function joinAndStart() {
    try {
      await api(`/group-sessions/${sessionId}/join`, { method: "POST", auth: true });
      const data = await api<Session>(`/group-sessions/${sessionId}`, { auth: true });
      setSession(data);

      const start = new Date(data.startedAt).getTime();
      setElapsed(Math.floor((Date.now() - start) / 1000));
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);

      heartbeatRef.current = setInterval(async () => {
        try {
          await api(`/group-sessions/${sessionId}/heartbeat`, { method: "POST", auth: true });
          setConnectionLost(false);
        } catch {
          setConnectionLost(true);
        }
      }, 10000);

      pollRef.current = setInterval(async () => {
        try {
          const updated = await api<Session>(`/group-sessions/${sessionId}`, { auth: true });
          setSession(updated);
        } catch {
          /* silent */
        }
      }, 15000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function leaveRoom() {
    setLeaving(true);
    try {
      await api(`/group-sessions/${sessionId}/leave`, { method: "POST", auth: true });
      router.push("/student/groups");
    } catch (err: any) {
      setError(err.message);
      setLeaving(false);
    }
  }

  async function reconnect() {
    setConnectionLost(false);
    try {
      await api(`/group-sessions/${sessionId}/reconnect`, { method: "POST", auth: true });
      await api(`/group-sessions/${sessionId}/heartbeat`, { method: "POST", auth: true });
    } catch (err: any) {
      setError(err.message);
    }
  }

  function formatSec(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  }

  if (loading)
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>Joining room...</p>
      </main>
    );

  if (error)
    return (
      <main className="min-h-screen bg-cream flex items-center justify-center px-6">
        <div className="bg-white rounded-3xl shadow-sm p-8 max-w-md text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <a href="/student/groups" className="text-myna-orange font-semibold">
            ← Back to Groups
          </a>
        </div>
      </main>
    );

  if (!session) return null;

  return (
    <main className="min-h-screen bg-[#1a1a1a] text-white px-6 py-8">
      {connectionLost && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-yellow-500 text-black rounded-full px-6 py-3 font-bold shadow-lg flex items-center gap-3">
          <span>⚠️ Reconnecting...</span>
          <button onClick={reconnect} className="underline">
            Retry now
          </button>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-xs text-white/60 uppercase tracking-wider">Room</p>
            <h1 className="font-display text-3xl font-bold">
              {session.groupClass.title}
            </h1>
            <p className="text-sm text-white/60 mt-1">
              {session.groupClass.language.name} ·{" "}
              {session.groupClass.teacher.user.fullName}
            </p>
            <p className="text-xs text-white/40 mt-1 font-mono">{session.roomId}</p>
          </div>
          <div className="text-right">
            <p className="font-display text-4xl tabular-nums">{formatSec(elapsed)}</p>
            <p className="text-xs text-white/60">Session time</p>
          </div>
        </div>

        {/* Participants */}
        <div className="bg-white/10 rounded-3xl p-6">
          <p className="text-xs uppercase tracking-wider text-white/60 mb-4">
            In the room ({session.participants.length})
          </p>
          {session.participants.length === 0 ? (
            <p className="text-white/40 text-sm">No one yet</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {session.participants.map((p) => (
                <div key={p.id} className="text-center">
                  <div
                    className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center text-3xl font-bold ${
                      p.status === "IN_CALL" ? "bg-myna-orange" : "bg-white/20"
                    }`}
                  >
                    {p.user.fullName.charAt(0).toUpperCase()}
                  </div>
                  <p className="text-sm mt-2">{p.user.fullName}</p>
                  <p
                    className={`text-xs ${
                      p.status === "IN_CALL" ? "text-green-400" : "text-yellow-400"
                    }`}
                  >
                    {p.status === "IN_CALL" ? "🟢 In call" : "🟡 Reconnecting"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

       {/* Agora Video */}
<div className="mt-6">
  <VideoCall channelName={session.roomId} />
</div>

        {/* Leave button */}
        <button
          onClick={leaveRoom}
          disabled={leaving}
          className="mt-8 w-full py-4 rounded-full bg-red-500 text-white font-bold hover:bg-red-600 transition disabled:opacity-50"
        >
          {leaving ? "Leaving..." : "🔴 Leave Room"}
        </button>
      </div>
    </main>
  );
}