"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Loader2,
} from "lucide-react";
import AgoraRTC, {
  IAgoraRTCClient, ICameraVideoTrack, IMicrophoneAudioTrack, IAgoraRTCRemoteUser,
} from "agora-rtc-sdk-ng";
import { api, getUser } from "@/lib/api";

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

  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const audioRef = useRef<IMicrophoneAudioTrack | null>(null);
  const videoRef = useRef<ICameraVideoTrack | null>(null);
  const localDivRef = useRef<HTMLDivElement>(null);
  const remoteDivRef = useRef<HTMLDivElement>(null);
  const tickRef = useRef<NodeJS.Timeout | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const cleanupRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    const user = getUser();
    if (!user) { router.push("/login"); return; }
    if (user.role !== "STUDENT") { router.push("/"); return; }
    loadTeachers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Real clean-up on unmount
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
    const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    clientRef.current = client;

    client.on("user-published", async (user: IAgoraRTCRemoteUser, mediaType) => {
      await client.subscribe(user, mediaType);
      if (mediaType === "video" && remoteDivRef.current) {
        user.videoTrack?.play(remoteDivRef.current);
      }
      if (mediaType === "audio") {
        user.audioTrack?.play();
      }
    });

    client.on("user-unpublished", (user) => {
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

      tickRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);

      pollRef.current = setInterval(async () => {
        try {
          const b = await api<{ balanceSeconds: number }>("/calls/balance", { auth: true });
          setBalance(b.balanceSeconds);
          if (b.balanceSeconds <= 0) {
            await endCall(true);
          }
        } catch { /* silent */ }
      }, 5000);
    } catch (err: any) {
      setError(err.message || "Could not join the call");
      await cleanup();
      setActive(null);
    }
  }

  async function cleanup() {
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }

    audioRef.current?.close();
    videoRef.current?.close();
    audioRef.current = null;
    videoRef.current = null;

    try { await clientRef.current?.leave(); } catch { /* silent */ }
    clientRef.current = null;
  }
  cleanupRef.current = cleanup;

  async function endCall(auto = false) {
    if (!active) return;
    setEnding(true);
    try {
      const result = await api<EndSummary>(`/calls/${active.callId}/end`, {
        method: "POST",
        auth: true,
      });
      setSummary({ ...result, auto });
    } catch (err: any) {
      setError(err.message || "Could not end the call");
    } finally {
      await cleanup();
      setActive(null);
      setElapsed(0);
      setEnding(false);
    }
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
    return (
      <main className="min-h-screen bg-[#0d0d0d] text-white px-6 py-8 flex items-center justify-center">
        <div className="max-w-3xl w-full">
          <div className="relative bg-black rounded-3xl overflow-hidden aspect-video">
            <div ref={remoteDivRef} className="w-full h-full" />
            <div
              ref={localDivRef}
              className="absolute bottom-4 end-4 w-40 h-28 rounded-xl overflow-hidden border-2 border-myna-yellow bg-stone-800"
            />
          </div>

          <div className="mt-6 flex items-center justify-between text-sm">
            <div>
              <p className="text-white/60 text-xs uppercase tracking-wider">In call</p>
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
              onClick={() => endCall(false)}
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