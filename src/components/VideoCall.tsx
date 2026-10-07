"use client";

import { useEffect, useRef, useState } from "react";
import { api, getToken } from "@/lib/api";
import { Loader2, Mic, MicOff, Video, VideoOff } from "lucide-react";
type Props = {
  channelName: string;
  onLeave?: () => void;
};

type JoinResponse = {
  token: string;
  channel: string;
  appId?: string;
  uid?: number;
};

export default function VideoCall({ channelName, onLeave }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState<any[]>([]);
  const [uid, setUid] = useState<number | null>(null);

  const clientRef = useRef<any>(null);
  const audioRef = useRef<any>(null);
  const videoRef = useRef<any>(null);
  const localDivRef = useRef<HTMLDivElement>(null);
  const remoteDivRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;

    async function init() {
      if (!getToken()) {
        if (!cancelled) {
          setError("Not logged in");
          setLoading(false);
        }
        return;
      }

      try {
        const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;

        // Random UID per mount — React StrictMode generates a new one each time
        const myUid = Math.floor(Math.random() * 60000) + 1;
        console.log("[Agora] Joining", { channelName, myUid });

        const data = await api<JoinResponse>(
          `/agora/token?channel=${encodeURIComponent(channelName)}&uid=${myUid}`,
          { auth: true },
        );

        // Bail if this effect got cancelled while fetching
        if (cancelled) return;

        const appId = data.appId || process.env.NEXT_PUBLIC_AGORA_APP_ID;
        if (!appId) throw new Error("AGORA_APP_ID not configured");

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
          setRemoteUsers((prev) => {
            if (prev.find((u) => u.uid === user.uid)) return prev;
            return [...prev, user];
          });
        });

        client.on("user-unpublished", (user: any) => {
          user.videoTrack?.stop();
          user.audioTrack?.stop();
        });

        client.on("user-left", (user: any) => {
          setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
        });

        await client.join(appId, channelName, data.token, myUid);

        // After join, check cancellation again
        if (cancelled) {
          try { await client.leave(); } catch {}
          return;
        }

        const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
        audioRef.current = audioTrack;
        videoRef.current = videoTrack;

        if (cancelled) {
          audioTrack.close();
          videoTrack.close();
          try { await client.leave(); } catch {}
          return;
        }

        if (localDivRef.current) videoTrack.play(localDivRef.current);
        await client.publish([audioTrack, videoTrack]);

        if (!cancelled) {
          setUid(myUid);
          setLoading(false);
        }
      } catch (err: any) {
        console.error("[Agora] Init error:", err);
        if (!cancelled) {
          setError(err.message || "Could not join the call");
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
      mountedRef.current = false;
      // Clean up on unmount
      (async () => {
        try {
          audioRef.current?.close();
          videoRef.current?.close();
          audioRef.current = null;
          videoRef.current = null;
          await clientRef.current?.leave();
          clientRef.current = null;
        } catch {
          /* silent */
        }
      })();
    };
  }, [channelName]);

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


  if (loading) {
    return (
      <div className="bg-black rounded-3xl aspect-video flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={24} className="animate-spin text-white/40 mx-auto" />
          <p className="text-white/60 mt-2">Connecting to video...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/5 rounded-3xl p-8 text-center border border-white/10">
        <p className="text-red-400">⚠️ {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Local video */}
        <div className="relative aspect-video bg-black rounded-2xl overflow-hidden">
          <div ref={localDivRef} className="w-full h-full" />
          {cameraOff && (
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto rounded-full bg-myna-orange flex items-center justify-center text-2xl font-bold text-white">
                  {uid}
                </div>
                <p className="text-white/60 text-sm mt-3">Camera off</p>
              </div>
            </div>
          )}
          <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
            You #{uid}
          </div>
        </div>

        {/* Remote users */}
        {remoteUsers.length === 0 ? (
          <div className="aspect-video bg-white/5 rounded-2xl flex items-center justify-center text-white/40 border border-white/10">
            <p className="text-sm">Waiting for others to join...</p>
          </div>
        ) : (
          remoteUsers.map((user) => (
            <div
              key={user.uid}
              className="relative aspect-video bg-black rounded-2xl overflow-hidden"
            >
              <div
                ref={(el) => {
                  if (el && user.videoTrack) user.videoTrack.play(el);
                }}
                className="w-full h-full"
              />
              <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                User #{user.uid}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex items-center justify-center gap-3 mt-4">
  <button
    onClick={toggleMic}
    className={`w-14 h-14 rounded-2xl flex items-center justify-center transition ${
      muted ? "bg-red-500 hover:bg-red-600" : "bg-white/10 hover:bg-white/20"
    } text-white`}
    title={muted ? "Unmute" : "Mute"}
  >
    {muted ? <MicOff size={20} /> : <Mic size={20} />}
  </button>
  <button
    onClick={toggleCamera}
    className={`w-14 h-14 rounded-2xl flex items-center justify-center transition ${
      cameraOff ? "bg-red-500 hover:bg-red-600" : "bg-white/10 hover:bg-white/20"
    } text-white`}
    title={cameraOff ? "Camera on" : "Camera off"}
  >
    {cameraOff ? <VideoOff size={20} /> : <Video size={20} />}
  </button>
</div>
    </div>
  );
}