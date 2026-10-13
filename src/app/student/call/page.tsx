"use client";

export const dynamic = "force-dynamic";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Loader2,
} from "lucide-react";
import { api, getUser } from "@/lib/api";
import { getCallSocket } from "@/lib/callSocket";

interface Teacher {
  id: string;
  isOnline: boolean;
  user: { fullName: string };
}

interface StartCallResponse {
  callId: string;
  channelName: string;
  appId: string;
  studentUid: number;
  teacherUid: number;
  studentToken: string;
  teacherToken: string;
  startTime: string;
  balanceSeconds: number;
}

interface EndSummary {
  callId: string;
  durationSec: number;
  studentBalanceAfter: number;
  teacherEarnedSec: number;
  auto?: boolean;
  reason?: string;
}

export default function CallPage() {
  return (
    <Suspense fallback={null}>
      <CallPageContent />
    </Suspense>
  );
}

function CallPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ---- Dynamic Agora SDK (loaded client-side only) ----
  const [agoraSdk, setAgoraSdk] = useState<typeof import("agora-rtc-sdk-ng") | null>(null);
  useEffect(() => {
    let alive = true;
    import("agora-rtc-sdk-ng").then((mod) => {
      if (alive) setAgoraSdk(mod);
    });
    return () => { alive = false; };
  }, []);

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [active, setActive] = useState<StartCallResponse | null>(null);
  const [balance, setBalance] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [ending, setEnding] = useState(false);
  const [summary, setSummary] = useState<EndSummary | null>(null);

  // ---- Socket / server-authoritative timer state ----
  const socketRef = useRef<any>(null);
  const [serverState, setServerState] = useState<{
    isPaused: boolean;
    elapsedSeconds: number;
    remainingSeconds: number;
    initialBalanceSeconds: number;
  } | null>(null);
  const [confirmEndOpen, setConfirmEndOpen] = useState(false);
  const lastSyncRef = useRef<{ t: number; remaining: number } | null>(null);
  const [pausedByOther, setPausedByOther] = useState(false);

  // ---- Agora refs (typed as any because SDK is loaded dynamically) ----
  const clientRef = useRef<any>(null);
  const audioRef = useRef<any>(null);
  const videoRef = useRef<any>(null);
  const localDivRef = useRef<HTMLDivElement>(null);
  const remoteDivRef = useRef<HTMLDivElement>(null);
  const tickRef = useRef<NodeJS.Timeout | null>(null);
  const cleanupRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    const user = getUser();
    if (!user) { router.push("/login"); return; }
    if (user.role !== "STUDENT") { router.push("/"); return; }
    (window as any).__currentUserId = user.id;
    loadTeachers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => { void cleanupRef.current(); };
  }, []);

  async function loadTeachers() {
    setLoading(true);
    try {
      const data = await api<Teacher[]>("/teachers/online");
      setTeachers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function startCall(teacherId: string) {
    setError("");
    setSummary(null);
    setServerState(null);
    setPausedByOther(false);
    try {
      const data = await api<StartCallResponse>("/calls/start", {
        method: "POST",
        auth: true,
        body: { teacherId, serviceType: "PROFESSIONAL_TEACHER" },
      });
      setActive(data);
      setBalance(data.balanceSeconds);
      setElapsed(0);
      await joinAgora(data);
    } catch (err: any) {
      setError(err.message || "Could not start the call");
      setActive(null);
    }
  }

  async function joinAgora(data: StartCallResponse) {
    if (!agoraSdk) {
      setError("Video SDK is still loading — try again in a moment");
      return;
    }
    const AgoraRTC = agoraSdk.default;

    const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    clientRef.current = client;

    client.on("user-published", async (user: any, mediaType: any) => {
      await client.subscribe(user, mediaType);
      if (mediaType === "video" && remoteDivRef.current) {
        user.videoTrack?.play(remoteDivRef.current);
      }
      if (mediaType === "audio") {
        user.audioTrack?.play();
      }
    });

    client.on("user-unpublished", (user: any) => {
      user.videoTrack?.stop();
      user.audioTrack?.stop();
    });

    try {
      await client.join(data.appId, data.channelName, data.studentToken, data.studentUid);

      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
      audioRef.current = audioTrack;
      videoRef.current = videoTrack;

      if (localDivRef.current) videoTrack.play(localDivRef.current);
      await client.publish([audioTrack, videoTrack]);

      // Local UI ticker: interpolate between server syncs
      tickRef.current = setInterval(() => {
        setElapsed((e) => e + 1);
        const sync = lastSyncRef.current;
        if (sync && !serverState?.isPaused) {
          const drift = Math.floor((Date.now() - sync.t) / 1000);
          setBalance(Math.max(0, sync.remaining - drift));
        }
      }, 1000);

      // WebSocket: join server-authoritative timer
      const sock = getCallSocket();
      socketRef.current = sock;

      const emitJoin = () => sock.emit("join_room", { callId: data.callId });

      sock.on("connect", emitJoin);
      sock.on("connect_error", (err: any) => {
        setError(`Socket connection error: ${err.message}`);
      });

      sock.on("timer_sync", (s: any) => {
        setServerState(s);
        lastSyncRef.current = { t: Date.now(), remaining: s.remainingSeconds };
        setBalance(s.remainingSeconds);
        setElapsed(s.elapsedSeconds);
      });

      sock.on("time_added", (p: any) => {
        setBalance((b) => b + p.seconds);
        lastSyncRef.current = lastSyncRef.current
          ? { t: Date.now(), remaining: lastSyncRef.current.remaining + p.seconds }
          : null;
      });

      sock.on("paused_by", () => setPausedByOther(true));
      sock.on("resumed_by", () => setPausedByOther(false));
      sock.on("student_timer_paused", () => setPausedByOther(true));
      sock.on("student_timer_resumed", () => setPausedByOther(false));

      sock.on("student_mute", (p: any) => {
        if (p.targetUserId !== (window as any).__currentUserId) return;
        audioRef.current?.setEnabled(!p.muted);
        setMuted(!!p.muted);
      });

      sock.on("session_ended", async (p: any) => {
        await cleanup();
        setActive(null);
        setSummary({
          callId: data.callId,
          durationSec: p.effectiveDurationSec,
          studentBalanceAfter: Math.max(0, balance - p.effectiveDurationSec),
          teacherEarnedSec: p.effectiveDurationSec,
          auto: p.reason === "balance_zero",
          reason: p.reason,
        });
      });

      if (sock.connected) emitJoin();
    } catch (err: any) {
      setError(err.message || "Could not join the call");
      await cleanup();
      setActive(null);
    }
  }

  async function cleanup() {
    if (socketRef.current) {
      try {
        const callId = active?.callId;
        if (callId) socketRef.current.emit("leave_room", { callId });
      } catch { /* silent */ }
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect?.();
      socketRef.current = null;
    }

    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }

    audioRef.current?.close();
    videoRef.current?.close();
    audioRef.current = null;
    videoRef.current = null;

    try { await clientRef.current?.leave(); } catch { /* silent */ }
    clientRef.current = null;

    lastSyncRef.current = null;
    setPausedByOther(false);
  }
  cleanupRef.current = cleanup;

  async function endCall(auto = false) {
    if (!active) return;
    setEnding(true);
    if (socketRef.current) {
      socketRef.current.emit("end_session", { callId: active.callId });
    }
    setTimeout(async () => {
      if (active) {
        await cleanup();
        setActive(null);
        setEnding(false);
      }
    }, 3000);
  }

  function toggleMic() {
    if (!audioRef.current) return;
    audioRef.current.setEnabled(muted);
    setMuted(!muted);
  }

  function toggleCamera() {
    if (!videoRef.current) return;
    videoRef.current.setEnabled(cameraOff);
    setCameraOff(!cameraOff);
  }

  function fmt(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }

  // ---------- Summary ----------
  if (summary) {
    return (
      <main className="min-h-screen bg-cream px-6 py-12 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-sm p-8 text-center">
          <p className="text-5xl mb-4">{summary.auto ? "⏱" : "✅"}</p>
          <h1 className="font-display text-3xl font-bold text-myna-charcoal">
            {summary.auto ? "Call ended — out of minutes" : "Call ended"}
          </h1>
          <div className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between p-3 bg-cream rounded-xl">
              <span className="text-myna-charcoal/60">Duration billed</span>
              <span className="font-bold tabular-nums">{fmt(summary.durationSec)}</span>
            </div>
            <div className="flex justify-between p-3 bg-cream rounded-xl">
              <span className="text-myna-charcoal/60">New balance</span>
              <span className="font-bold tabular-nums">{fmt(summary.studentBalanceAfter)}</span>
            </div>
          </div>
          <button
            onClick={() => { setSummary(null); loadTeachers(); }}
            className="mt-6 w-full py-3 rounded-full bg-myna-orange text-white font-semibold"
          >
            Back to teachers
          </button>
        </div>
      </main>
    );
  }

  // ---------- In call ----------
  if (active) {
    const isPaused = !!serverState?.isPaused || pausedByOther;
    return (
      <main className="min-h-screen bg-[#0d0d0d] text-white px-6 py-8 flex items-center justify-center">
        <div className="max-w-3xl w-full">
          <div className="relative bg-black rounded-3xl overflow-hidden aspect-video">
            <div ref={remoteDivRef} className="w-full h-full" />
            <div
              ref={localDivRef}
              className="absolute bottom-4 end-4 w-40 h-28 rounded-xl overflow-hidden border-2 border-myna-yellow bg-stone-800"
            />
            {isPaused && (
              <div className="absolute top-4 start-4 bg-amber-500/90 text-black font-bold text-xs px-3 py-1.5 rounded-full">
                ⏸ Paused {pausedByOther ? "by teacher" : ""}
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between text-sm">
            <div>
              <p className="text-white/60 text-xs uppercase tracking-wider">Elapsed</p>
              <p className="font-display text-2xl font-bold tabular-nums">{fmt(elapsed)}</p>
            </div>
            <div className="text-end">
              <p className="text-white/60 text-xs uppercase tracking-wider">Balance remaining</p>
              <p className={`font-display text-2xl font-bold tabular-nums ${balance < 60 ? "text-myna-rose" : ""}`}>
                {fmt(balance)}
              </p>
            </div>
          </div>

          {error && <p className="mt-4 text-red-400 text-sm text-center">{error}</p>}

          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              onClick={toggleMic}
              className="w-14 h-14 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
              aria-label={muted ? "Unmute" : "Mute"}
            >
              {muted ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            <button
              onClick={() => setConfirmEndOpen(true)}
              disabled={ending}
              className="px-8 py-4 rounded-full bg-red-500 hover:bg-red-600 font-bold flex items-center gap-2 disabled:opacity-50"
            >
              {ending ? <Loader2 size={18} className="animate-spin" /> : <PhoneOff size={18} />}
              End call
            </button>
            <button
              onClick={toggleCamera}
              className="w-14 h-14 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
              aria-label={cameraOff ? "Turn camera on" : "Turn camera off"}
            >
              {cameraOff ? <VideoOff size={20} /> : <Video size={20} />}
            </button>
          </div>
        </div>

        {confirmEndOpen && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center text-myna-charcoal">
              <h2 className="font-display text-xl font-bold">End this call?</h2>
              <p className="text-sm text-myna-charcoal/60 mt-2">
                Your remaining minutes will stop being billed.
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setConfirmEndOpen(false)}
                  className="flex-1 py-2.5 rounded-full border border-myna-charcoal/15 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { setConfirmEndOpen(false); endCall(false); }}
                  className="flex-1 py-2.5 rounded-full bg-red-500 text-white font-semibold"
                >
                  End call
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    );
  }

  // ---------- Loading ----------
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center text-myna-charcoal/60">
        <Loader2 size={20} className="animate-spin" />
      </main>
    );
  }

  // ---------- Teacher picker ----------
  return (
    <main className="min-h-screen bg-cream px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <a href="/student" className="text-myna-orange font-semibold text-sm">← Back to dashboard</a>
        <h1 className="font-display text-4xl font-bold text-myna-charcoal mt-4">Call a teacher</h1>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
            {error}
          </div>
        )}

        {teachers.length === 0 ? (
          <div className="mt-8 bg-white rounded-3xl shadow-sm p-12 text-center">
            <p className="text-5xl mb-4">😴</p>
            <p className="font-display text-2xl font-bold text-myna-charcoal">No teachers online</p>
            <p className="text-myna-charcoal/60 mt-2">Check back later.</p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {teachers.map((tc) => (
              <div key={tc.id} className="bg-white rounded-3xl shadow-sm p-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-myna-orange text-white flex items-center justify-center text-2xl font-bold">
                    {tc.user.fullName.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-myna-charcoal">{tc.user.fullName}</p>
                    <p className="text-xs text-green-600 font-semibold">🟢 Online</p>
                  </div>
                </div>
                <button
                  onClick={() => startCall(tc.id)}
                  className="mt-5 w-full py-3 rounded-full bg-myna-orange text-white font-semibold flex items-center justify-center gap-2 hover:bg-myna-orange/90 transition"
                >
                  <Phone size={16} />
                  Call now
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}