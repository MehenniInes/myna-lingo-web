"use client";

import { useEffect, useState } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import {
  AgoraRTCProvider,
  useJoin,
  useLocalCameraTrack,
  useLocalMicrophoneTrack,
  usePublish,
  useRemoteUsers,
  RemoteUser,
  LocalUser,
  useRTCClient,
} from "agora-rtc-react";
import { api, getToken } from "@/lib/api";

const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID;

type Props = {
  channelName: string;
  onLeave?: () => void;
};

function VideoCallInner({ channelName, onLeave }: Props) {
  const client = useRTCClient();
  const [token, setToken] = useState<string | null>(null);
  const [uid, setUid] = useState<number | null>(null);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function fetchToken() {
      if (!getToken()) {
        setError("Not logged in");
        return;
      }
      try {
        const data = await api<{ token: string; uid: number }>(
          `/agora/token?channel=${channelName}`,
          { auth: true },
        );
        if (!cancelled) {
          setToken(data.token);
          setUid(data.uid);
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Failed to get Agora token");
      }
    }
    fetchToken();
    return () => {
      cancelled = true;
    };
  }, [channelName]);

  useJoin(
    {
      appid: APP_ID!,
      channel: channelName,
      token: token!,
      uid: uid!,
    },
    Boolean(token && uid !== null && APP_ID),
  );

  // Tracks are created/destroyed based on state
  const { localMicrophoneTrack } = useLocalMicrophoneTrack(micOn);
  const { localCameraTrack } = useLocalCameraTrack(cameraOn);

  // Publish only what exists
  usePublish([localMicrophoneTrack, localCameraTrack].filter(Boolean) as any);

  const remoteUsers = useRemoteUsers();

  async function handleLeave() {
    await client.leave();
    onLeave?.();
  }

  if (!APP_ID) {
    return (
      <div className="bg-white/5 rounded-3xl p-8 text-center border border-white/10">
        <p className="text-red-400">⚠️ NEXT_PUBLIC_AGORA_APP_ID missing in .env.local</p>
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

  if (!token) {
    return (
      <div className="bg-white/5 rounded-3xl p-8 text-center border border-white/10">
        <p className="text-white/60">Connecting to video...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Local video */}
        <div className="relative aspect-video bg-black rounded-2xl overflow-hidden">
          {cameraOn && localCameraTrack ? (
            <LocalUser
              audioTrack={micOn ? localMicrophoneTrack : undefined}
              cameraOn={cameraOn}
              micOn={micOn}
              videoTrack={localCameraTrack}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-black">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto rounded-full bg-myna-orange flex items-center justify-center text-4xl font-bold text-white">
                  {uid ?? "?"}
                </div>
                <p className="text-white/60 text-sm mt-3">Camera off</p>
              </div>
            </div>
          )}
          <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
            You {uid}
          </div>
        </div>

        {/* Remote users */}
        {remoteUsers.length === 0 ? (
          <div className="aspect-video bg-white/5 rounded-2xl flex items-center justify-center text-white/40">
            <p className="text-sm">Waiting for others to join...</p>
          </div>
        ) : (
          remoteUsers.map((user) => (
            <div
              key={user.uid}
              className="relative aspect-video bg-black rounded-2xl overflow-hidden"
            >
              <RemoteUser user={user} className="w-full h-full object-cover" />
              <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                User {user.uid}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 mt-4">
        <button
          onClick={() => setMicOn(!micOn)}
          className={`w-14 h-14 rounded-full font-bold text-xl transition ${
            micOn
              ? "bg-white/10 hover:bg-white/20"
              : "bg-red-500 hover:bg-red-600"
          } text-white`}
          title={micOn ? "Mute microphone" : "Unmute microphone"}
        >
          {micOn ? "🎙" : "🔇"}
        </button>
        <button
          onClick={() => setCameraOn(!cameraOn)}
          className={`w-14 h-14 rounded-full font-bold text-xl transition ${
            cameraOn
              ? "bg-white/10 hover:bg-white/20"
              : "bg-red-500 hover:bg-red-600"
          } text-white`}
          title={cameraOn ? "Turn camera off" : "Turn camera on"}
        >
          {cameraOn ? "📹" : "🚫"}
        </button>
        <button
          onClick={handleLeave}
          className="px-6 py-3 rounded-full bg-red-500 text-white font-bold hover:bg-red-600 transition"
        >
          Leave Video
        </button>
      </div>
    </div>
  );
}

export default function VideoCall(props: Props) {
  const [client] = useState<any>(() =>
    AgoraRTC.createClient({ mode: "rtc", codec: "vp8" }),
  );

  return (
    <AgoraRTCProvider client={client as any}>
      <VideoCallInner {...props} />
    </AgoraRTCProvider>
  );
}