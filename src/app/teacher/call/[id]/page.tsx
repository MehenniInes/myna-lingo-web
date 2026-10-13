"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  PhoneOff, Mic, MicOff, Video, VideoOff, Loader2,
  Pause, Play, Plus, VolumeX, AlertCircle,
} from "lucide-react";
import { api, getUser } from "@/lib/api";
import { getCallSocket } from "@/lib/callSocket";

interface TeacherCallInfo {
  callId: string;
  status: string;
  channelName: string;
  appId: string;
  teacherUid: number;
  teacherToken: string;
  studentName: string;
  startTime: string;
}

export default function TeacherCallPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  // ---- Dynamic Agora SDK ----
  const [agoraSdk, setAgoraSdk] = useState<typeof import("agora-rtc-sdk-ng") | null>(null);
  useEffect(() => {
    let alive = true;
    import("agora-rtc-sdk-ng").then((mod) => {
      if (alive) setAgoraSdk(mod);
    });
    return () => { alive = false; };
  }, []);

  const [info, setInfo] = useState<TeacherCallInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [joined, setJoined] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [ending, setEnding] = useState(false);

  const [serverState, setServerState] = useState<{
    isPaused: boolean;
    elapsedSeconds: number;
    remainingSeconds: number;
    initialBalanceSeconds: number;
  } | null>(null);
  const [pausedByOther, setPausedByOther] = useState(false);
  const [timeAddedToast, setTimeAddedToast] = useState<string | null>(null);

  const socketRef = useRef<any>(null);
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
    if (user.role !== "TEACHER" && user.role !== "ADMIN") { router.push("/"); return; }
    (window as any).__currentUserId = user.id;
    if (!params?.id) return;
    load(params.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.id]);

  useEffect(() => {
    return () => { void cleanupRef.current(); };
  }, []);

  async function load(callId: string) {
    setLoading(true);
    setError("");
    try {
      const data = await api<TeacherCallInfo>(`/calls/${callId}/teacher-token`, { auth: true });
      setInfo(data);
    } catch (err: any) {
      setError(err.message || "Could not load this call");
    } finally {
      setLoading(false);
    }
  }

  async function join() {
    if (!info) return;
    if (!agoraSdk) {
      setError("Video SDK is still loading — try again in a moment");
      return;
    }
    const AgoraRTC = agoraSdk.default;
    setError("");

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
      await client.join(info.appId, info.channelName, info.teacherToken, info.teacherUid);

      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
      audioRef.current = audioTrack;
      videoRef.current = videoTrack;

      if (localDivRef.current) videoTrack.play(localDivRef.current);
      await client.publish([audioTrack, videoTrack]);

      setJoined(true);
      tickRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);

      // WebSocket: join server-authoritative timer
      const sock = getCallSocket();
      socketRef.current = sock;

      const emitJoin = () => sock.emit("join_room", { callId: info.callId });

      sock.on("connect", emitJoin);
      sock.on("connect_error", (err: any) => {
        setError(`Socket connection error: ${err.message}`);
      });

      sock.on("timer_sync", (s: any) => {
        setServerState(s);
        setElapsed(s.elapsedSeconds);
      });

      sock.on("paused_by", (p: any) => {
        if (p.byUserId !== (window as any).__currentUserId) setPausedByOther(true);
      });
      sock.on("resumed_by", (p: any) => {
        if (p.byUserId !== (window as any).__currentUserId) setPausedByOther(false);
      });

      sock.on("time_added", (p: any) => {
        setTimeAddedToast(`+${p.seconds}s added`);
        setTimeout(() => setTimeAddedToast(null), 2500);
      });

      sock.on("session_ended", async () => {
        await cleanup();
        router.push("/teacher");
      });

      sock.on("participant_left", () => {
        // Student disconnected — server settles if both sides leave
      });

      if (sock.connected) emitJoin();
    } catch (err: any) {
      setError(err.message || "Could not join the call");
      await cleanup();
    }
  }

  async function cleanup() {
    if (socketRef.current) {
      try {
        socketRef.current.emit("leave_room", { callId: info?.callId });
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
    setJoined(false);
  }
  cleanupRef.current = cleanup;

  async function endCall() {
    if (!info) return;
    setEnding(true);
    if (socketRef.current) {
      socketRef.current.emit("end_session", { callId: info.callId });
    }
    setTimeout(async () => {
      await cleanup();
      setEnding(false);
      router.push("/teacher");
    }, 3000);
  }

  function pauseAll() {
    if (!info || !socketRef.current) return;
    socketRef.current.emit("pause_all", { callId: info.callId });
  }

  function resumeAll() {
    if (!info || !socketRef.current) return;
    socketRef.current.emit("resume_all", { callId: info.callId });
  }

  function addTime() {
    if (!info || !socketRef.current) return;
    socketRef.current.emit("add_time", { callId: info.callId, seconds: 60 });
  }

  function muteStudent() {
    if (!info || !socketRef.current) return;
    socketRef.current.emit("mute_student", { callId: info.callId, muted: true });
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

  if (loading) {
    return <main className="min-h-screen flex items-center justify-center text-myna-charcoal/60"><Loader2 size={20} className="animate-spin" /></main>;
  }

  if (error && !info) {
    return (
      <main className="min-h-screen bg-cream flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-3xl p-8 text-center">
          <AlertCircle size={24} className="mx-auto text-red-600" />
          <p className="text-red-700 text-sm mt-3">{error}</p>
          <Link href="/teacher" className="inline-block mt-4 px-5 py-2.5 rounded-full bg-myna-orange text-white font-semibold text-sm">
            Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  if (!info) return null;

  if (info.status !== "ACTIVE") {
    return (
      <main className="min-h-screen bg-cream flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-sm p-8 text-center">
          <p className="font-display text-2xl font-bold text-myna-charcoal">This call is not active</p>
          <p className="text-myna-charcoal/60 text-sm mt-2">
            The student may have already ended it or the call hasn&apos;t been accepted.
          </p>
          <Link href="/teacher" className="inline-block mt-6 px-5 py-3 rounded-full bg-myna-orange text-white font-semibold text-sm">
            Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  if (!joined) {
    return (
      <main className="min-h-screen bg-cream flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-sm p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-myna-orange text-white flex items-center justify-center text-3xl font-bold mx-auto">
            {info.studentName.charAt(0)}
          </div>
          <h1 className="font-display text-2xl font-bold text-myna-charcoal mt-4">{info.studentName}</h1>
          <p className="text-myna-charcoal/60 text-sm mt-1">is waiting in a live call</p>

          {error && <p className="mt-4 text-red-600 text-sm">{error}</p>}

          <button
            onClick={join}
            className="mt-6 w-full py-3 rounded-full bg-myna-orange text-white font-semibold"
          >
            Join the call
          </button>
          <Link href="/teacher" className="mt-3 inline-block text-sm text-myna-charcoal/60 hover:underline">
            Not now
          </Link>
        </div>
      </main>
    );
  }

  const isPaused = !!serverState?.isPaused;

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
              ⏸ Paused {pausedByOther ? "by admin" : "by you"}
            </div>
          )}
          {timeAddedToast && (
            <div className="absolute top-4 end-4 bg-green-500/90 text-white font-bold text-xs px-3 py-1.5 rounded-full">
              {timeAddedToast}
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between text-sm">
          <div>
            <p className="text-white/60 text-xs uppercase tracking-wider">In call with</p>
            <p className="font-display text-2xl font-bold">{info.studentName}</p>
          </div>
          <div className="text-end">
            <p className="text-white/60 text-xs uppercase tracking-wider">Remaining</p>
            <p className={`font-display text-2xl font-bold tabular-nums ${isPaused ? "text-amber-400" : ""}`}>
              {serverState ? fmt(serverState.remainingSeconds) : "00:00"}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {isPaused ? (
            <button
              onClick={resumeAll}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500 hover:bg-amber-600 text-black font-semibold text-sm"
            >
              <Play size={14} /> Resume
            </button>
          ) : (
            <button
              onClick={pauseAll}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-sm"
            >
              <Pause size={14} /> Pause
            </button>
          )}
          <button
            onClick={addTime}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-sm"
          >
            <Plus size={14} /> +60s
          </button>
          <button
            onClick={muteStudent}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-sm"
          >
            <VolumeX size={14} /> Mute student
          </button>
          <button
            onClick={endCall}
            disabled={ending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500 hover:bg-red-600 font-bold text-sm disabled:opacity-50"
          >
            {ending ? <Loader2 size={14} className="animate-spin" /> : <PhoneOff size={14} />}
            End session
          </button>
        </div>

        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            onClick={toggleMic}
            className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center"
            aria-label={muted ? "Unmute" : "Mute"}
          >
            {muted ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          <button
            onClick={toggleCamera}
            className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center"
            aria-label={cameraOff ? "Turn camera on" : "Turn camera off"}
          >
            {cameraOff ? <VideoOff size={18} /> : <Video size={18} />}
          </button>
        </div>

        <p className="text-center text-xs text-white/40 mt-6">
          Billing is tracked server-side. The call ends automatically when the student&apos;s balance reaches zero.
        </p>
      </div>
    </main>
  );
}