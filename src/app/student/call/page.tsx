"use client";
export const dynamic = "force-dynamic";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Loader2,
  Volume2, VolumeX, Maximize, MessageCircle, Sparkles,
  AlertTriangle, X, ChevronRight,
} from "lucide-react";
import UserTierBadge from "@/components/UserTierBadge";

import { api, getUser } from "@/lib/api";

interface Teacher {
  id: string;
  isOnline: boolean;
  user: { fullName: string; tier?: string };
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

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string | null;
  xpReward: number;
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
  const [speakerOff, setSpeakerOff] = useState(false);
  const [ending, setEnding] = useState(false);
  const [summary, setSummary] = useState<EndSummary | null>(null);

  const [confirmEnd, setConfirmEnd] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [teacherInfo, setTeacherInfo] = useState<Teacher | null>(null);

  const clientRef = useRef<any>(null);
  const audioRef = useRef<any>(null);
  const videoRef = useRef<any>(null);
  const localDivRef = useRef<HTMLDivElement>(null);
  const remoteDivRef = useRef<HTMLDivElement>(null);
  const remoteAudioTrackRef = useRef<any>(null);
  const tickRef = useRef<NodeJS.Timeout | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const cleanupRef = useRef<() => Promise<void>>(async () => {});

  // ============ On mount ============
  useEffect(() => {
    const user = getUser();
    if (!user) { router.push("/login"); return; }
    if (user.role !== "STUDENT") { router.push("/"); return; }
    initPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function initPage() {
    // 1. End any stuck call from a previous session (refresh, crash, etc.)
    await cleanupStuckCall();
    // 2. Then load teachers and activities
    await loadTeachers();
    await loadActivities();
  }

  async function cleanupStuckCall() {
    try {
      const activeCall = await api<{ id: string } | null>("/calls/active", {
  auth: true,
  silent: true,
});
      if (activeCall?.id) {
        await api(`/calls/${activeCall.id}/end`, { method: "POST", auth: true });
      }
    } catch {
      /* silent — no stuck call */
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => { void cleanupRef.current(); };
  }, []);

  // End call if user closes the tab mid-call
  useEffect(() => {
    if (!active) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const token = localStorage.getItem("accessToken");

    function handleUnload() {
      if (!token) return;
      try {
        fetch(`${apiUrl}/calls/${active!.callId}/end`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          keepalive: true,
        }).catch(() => {});
      } catch { /* silent */ }
    }

    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [active]);

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

  async function loadActivities() {
    try {
      const data = await api<Activity[]>("/activities");
      setActivities(data.slice(0, 5));
    } catch {
      /* silent */
    }
  }

  async function startCall(teacherId: string) {
    setError("");
    setSummary(null);
    setConfirmEnd(false);
    try {
      // Safety: end any leftover call before starting new one
      await cleanupStuckCall();

      const data = await api<StartCallResponse>("/calls/start", {
        method: "POST",
        auth: true,
        body: { teacherId, serviceType: "PROFESSIONAL_TEACHER" },
      });
      setActive(data);
      setBalance(data.balanceSeconds);
      setElapsed(0);
      setTeacherInfo(teachers.find((t) => t.id === teacherId) || null);
      await joinAgora(data);
    } catch (err: any) {
      setError(err.message || "Could not start the call");
      setActive(null);
    }
  }

  async function joinAgora(data: StartCallResponse) {
    if (!agoraSdk) {
      setError("Video SDK is still loading — please try again in a second");
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
        remoteAudioTrackRef.current = user.audioTrack;
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

      tickRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);

      pollRef.current = setInterval(async () => {
        try {
          const b = await api<{ balanceSeconds: number }>("/minutes/balance", {
  auth: true,
  silent: true,
});
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
    remoteAudioTrackRef.current = null;

    try { await clientRef.current?.leave(); } catch { /* silent */ }
    clientRef.current = null;
  }
  cleanupRef.current = cleanup;

  async function endCall(auto = false) {
    if (!active) return;
    setEnding(true);
    setConfirmEnd(false);
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

  function toggleSpeaker() {
    if (!remoteAudioTrackRef.current) return;
    remoteAudioTrackRef.current.setVolume(speakerOff ? 100 : 0);
    setSpeakerOff(!speakerOff);
  }

  function toggleFullscreen() {
    const el = remoteDivRef.current?.parentElement;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
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
    const lowBalance = balance < 120;

    return (
      <main className="min-h-screen bg-[#0d0d0d] text-white flex flex-col">
        {lowBalance && (
          <div className="bg-red-500 text-white text-center py-2 px-4 text-sm font-bold flex items-center justify-center gap-2">
            <AlertTriangle size={16} />
            Only {fmt(balance)} left — call will end automatically
          </div>
        )}

        <div className="flex-1 flex flex-col lg:flex-row">
          <div className="flex-1 relative p-4 lg:p-6">
            <div className="relative bg-black rounded-3xl overflow-hidden aspect-video shadow-2xl">
              <div ref={remoteDivRef} className="w-full h-full" />

              {teacherInfo && (
                <div className="absolute top-3 start-3 bg-black/60 backdrop-blur-md rounded-full px-3 py-1.5 flex items-center gap-2">
                  <span className="text-xs font-semibold text-white">{teacherInfo.user.fullName}</span>
                  <UserTierBadge tier={teacherInfo.user.tier || "NORMAL"} size="sm" />
                </div>
              )}

              <div
                ref={localDivRef}
                className="absolute bottom-4 end-4 w-40 h-28 rounded-xl overflow-hidden border-2 border-myna-yellow bg-stone-800 shadow-lg"
              />

              <button
                onClick={toggleFullscreen}
                className="absolute top-3 end-3 w-9 h-9 rounded-lg bg-black/60 backdrop-blur-md hover:bg-black/80 flex items-center justify-center"
                title="Fullscreen"
              >
                <Maximize size={16} />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 text-center">
              <div className="bg-white/5 rounded-2xl p-4">
                <p className="text-white/50 text-xs uppercase tracking-wider">In call</p>
                <p className="font-display text-3xl font-bold tabular-nums mt-1">{fmt(elapsed)}</p>
              </div>
              <div className={`bg-white/5 rounded-2xl p-4 ${lowBalance ? "ring-2 ring-red-500" : ""}`}>
                <p className="text-white/50 text-xs uppercase tracking-wider">Balance</p>
                <p className={`font-display text-3xl font-bold tabular-nums mt-1 ${lowBalance ? "text-red-400" : ""}`}>
                  {fmt(balance)}
                </p>
              </div>
            </div>

            {error && (
              <p className="mt-4 text-red-400 text-sm text-center bg-red-500/10 py-2 rounded-xl">
                {error}
              </p>
            )}

            <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
              <button
                onClick={toggleMic}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition ${
                  muted ? "bg-red-500 hover:bg-red-600" : "bg-white/10 hover:bg-white/20"
                }`}
                title={muted ? "Unmute" : "Mute"}
              >
                {muted ? <MicOff size={20} /> : <Mic size={20} />}
              </button>

              <button
                onClick={toggleCamera}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition ${
                  cameraOff ? "bg-red-500 hover:bg-red-600" : "bg-white/10 hover:bg-white/20"
                }`}
                title={cameraOff ? "Camera on" : "Camera off"}
              >
                {cameraOff ? <VideoOff size={20} /> : <Video size={20} />}
              </button>

              <button
                onClick={() => setConfirmEnd(true)}
                disabled={ending}
                className="px-8 py-4 rounded-full bg-red-500 hover:bg-red-600 font-bold flex items-center gap-2 disabled:opacity-50 shadow-lg"
              >
                {ending ? <Loader2 size={18} className="animate-spin" /> : <PhoneOff size={18} />}
                End Call
              </button>

              <button
                onClick={toggleSpeaker}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition ${
                  speakerOff ? "bg-red-500 hover:bg-red-600" : "bg-white/10 hover:bg-white/20"
                }`}
                title={speakerOff ? "Speaker on" : "Speaker off"}
              >
                {speakerOff ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>

              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="w-14 h-14 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center lg:hidden"
                title="Activities"
              >
                <Sparkles size={20} />
              </button>
            </div>
          </div>

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
                  Ask your teacher to start an activity from the list above.
                </p>
              </div>
            </aside>
          )}
        </div>

        {confirmEnd && (
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setConfirmEnd(false)}
          >
            <div
              className="bg-[#1a1a1a] border border-white/10 rounded-3xl p-8 max-w-sm w-full text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                <PhoneOff size={28} className="text-red-400" />
              </div>
              <h3 className="font-display text-2xl font-bold text-white">End this call?</h3>
              <p className="text-white/60 text-sm mt-2">
                Your minutes will be deducted for the time used so far.
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setConfirmEnd(false)}
                  className="flex-1 py-3 rounded-full bg-white/10 hover:bg-white/20 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => endCall(false)}
                  disabled={ending}
                  className="flex-1 py-3 rounded-full bg-red-500 hover:bg-red-600 font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {ending ? <Loader2 size={16} className="animate-spin" /> : <PhoneOff size={16} />}
                  End
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
        <p className="text-myna-charcoal/60 mt-2">
          Choose an online teacher to start a live lesson
        </p>

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
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-myna-charcoal">{tc.user.fullName}</p>
                      {tc.user.tier && (
                        <UserTierBadge tier={tc.user.tier} size="sm" />
                      )}
                    </div>
                    <p className="text-xs text-green-600 font-semibold mt-0.5">🟢 Online</p>
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