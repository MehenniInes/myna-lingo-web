"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, getUser } from "@/lib/api";
import dynamic from "next/dynamic";
import {
  Loader2, AlertTriangle, Users, Clock, PhoneOff,
  MessageCircle, Sparkles, X, ChevronRight,
} from "lucide-react";
import UserTierBadge from "@/components/UserTierBadge";

const VideoCall = dynamic(() => import("@/components/VideoCall"), {
  ssr: false,
  loading: () => (
    <div className="bg-white/5 rounded-3xl p-12 text-center border border-white/10">
      <Loader2 size={24} className="animate-spin text-white/40 mx-auto" />
      <p className="text-white/40 mt-2">Loading video...</p>
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
    teacher: { user: { fullName: string; tier?: string } };
  };
  participants: {
    id: string;
    status: string;
    user: { id: string; fullName: string; tier?: string };
  }[];
};

type Activity = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  xpReward: number;
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
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activities, setActivities] = useState<Activity[]>([]);

  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const user = getUser();
    if (!user) { router.push("/login"); return; }
    init();
    loadActivities();
    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  async function init() {
    await joinAndStart();
  }

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

  async function loadActivities() {
    try {
      const data = await api<Activity[]>("/activities");
      setActivities(data.slice(0, 5));
    } catch {
      /* silent */
    }
  }

  async function leaveRoom() {
    setLeaving(true);
    setConfirmLeave(false);
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

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0d0d0d]">
        <div className="text-center">
          <Loader2 size={24} className="animate-spin text-white/40 mx-auto" />
          <p className="text-white/60 mt-3">Joining room...</p>
        </div>
      </main>
    );
  }

  if (error) {
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
  }

  if (!session) return null;

  const inCallCount = session.participants.filter((p) => p.status === "IN_CALL").length;

  return (
    <main className="min-h-screen bg-[#0d0d0d] text-white flex flex-col">
      {/* Reconnect banner */}
      {connectionLost && (
        <div className="bg-yellow-500 text-black px-6 py-3 font-bold flex items-center justify-center gap-3">
          <AlertTriangle size={18} />
          <span>Connection lost — reconnecting...</span>
          <button onClick={reconnect} className="underline">
            Retry now
          </button>
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Main area */}
        <div className="flex-1 p-4 lg:p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4 gap-4 flex-wrap">
            <div>
              <p className="text-xs text-white/50 uppercase tracking-wider">Group Room</p>
              <h1 className="font-display text-2xl lg:text-3xl font-bold mt-1">
                {session.groupClass.title}
              </h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <p className="text-sm text-white/60">
                  {session.groupClass.language.name} · {session.groupClass.teacher.user.fullName}
                </p>
                {session.groupClass.teacher.user.tier && (
                  <UserTierBadge tier={session.groupClass.teacher.user.tier} size="sm" />
                )}
              </div>
              <p className="text-xs text-white/40 mt-1 font-mono">{session.roomId}</p>
            </div>
            <div className="text-end">
              <p className="font-display text-3xl lg:text-4xl tabular-nums font-bold">
                {formatSec(elapsed)}
              </p>
              <p className="text-xs text-white/60">Session time</p>
            </div>
          </div>

          {/* Video */}
          <div className="bg-black rounded-3xl overflow-hidden shadow-2xl">
            <VideoCall channelName={session.roomId} />
          </div>

          {/* Participants */}
          <div className="mt-4 bg-white/5 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users size={16} className="text-myna-yellow" />
              <p className="text-sm font-bold text-white/90">
                In the room ({inCallCount})
              </p>
            </div>
            {session.participants.length === 0 ? (
              <p className="text-white/40 text-sm">No one yet</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {session.participants.map((p) => (
                  <div
                    key={p.id}
                    className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs ${
                      p.status === "IN_CALL"
                        ? "bg-green-500/20 border border-green-500/30"
                        : "bg-yellow-500/20 border border-yellow-500/30"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        p.status === "IN_CALL" ? "bg-green-400" : "bg-yellow-400"
                      }`}
                    />
                    <span className="font-semibold">{p.user.fullName}</span>
                    {p.user.tier && <UserTierBadge tier={p.user.tier} size="sm" />}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Leave button */}
          <button
            onClick={() => setConfirmLeave(true)}
            disabled={leaving}
            className="mt-6 w-full py-4 rounded-full bg-red-500 hover:bg-red-600 text-white font-bold flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {leaving ? <Loader2 size={18} className="animate-spin" /> : <PhoneOff size={18} />}
            Leave Room
          </button>
        </div>

        {/* Sidebar — Activities */}
        {sidebarOpen && (
          <aside className="w-full lg:w-80 bg-white/5 border-t lg:border-t-0 lg:border-s border-white/10 p-4 max-h-[40vh] lg:max-h-none overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold flex items-center gap-2">
                <Sparkles size={16} className="text-myna-yellow" />
                Lesson Activities
              </h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            {activities.length === 0 ? (
              <p className="text-white/40 text-sm text-center py-8">
                No activities available
              </p>
            ) : (
              <div className="space-y-3">
                {activities.map((a) => (
                  <div
                    key={a.id}
                    className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-myna-yellow font-bold uppercase tracking-wider">
                          {a.type.replace("_", " ")}
                        </p>
                        <p className="font-semibold text-sm mt-1 truncate">{a.title}</p>
                        {a.description && (
                          <p className="text-xs text-white/60 mt-1 line-clamp-2">
                            {a.description}
                          </p>
                        )}
                        <p className="text-xs text-white/40 mt-2">⭐ {a.xpReward} XP</p>
                      </div>
                      <ChevronRight size={16} className="text-white/40 shrink-0 mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 p-4 bg-myna-yellow/10 border border-myna-yellow/30 rounded-xl">
              <p className="text-xs text-myna-yellow font-bold flex items-center gap-2">
                <MessageCircle size={14} />
                Tip
              </p>
              <p className="text-xs text-white/70 mt-2">
                The teacher can start any activity from the list above during the session.
              </p>
            </div>
          </aside>
        )}
      </div>

      {/* Confirm leave modal */}
      {confirmLeave && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setConfirmLeave(false)}
        >
          <div
            className="bg-[#1a1a1a] border border-white/10 rounded-3xl p-8 max-w-sm w-full text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 flex items-center justify-center mb-4">
              <PhoneOff size={28} className="text-red-400" />
            </div>
            <h3 className="font-display text-2xl font-bold text-white">Leave this room?</h3>
            <p className="text-white/60 text-sm mt-2">
              You can rejoin later from "My Groups" while the session is still active.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setConfirmLeave(false)}
                className="flex-1 py-3 rounded-full bg-white/10 hover:bg-white/20 font-semibold"
              >
                Stay
              </button>
              <button
                onClick={leaveRoom}
                disabled={leaving}
                className="flex-1 py-3 rounded-full bg-red-500 hover:bg-red-600 font-bold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {leaving ? <Loader2 size={16} className="animate-spin" /> : <PhoneOff size={16} />}
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}