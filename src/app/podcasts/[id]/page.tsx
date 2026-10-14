"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, getUser } from "@/lib/api";
import { PodcastCover } from "@/components/PodcastCover";

// 🆕 API URL للفيديو والصوت
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type Podcast = {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  audioUrl: string;
  videoUrl?: string | null;   // 🆕
  level: string;
  category: string;
  durationSec: number;
  priceDA: number;
  xpReward: number;
  language: { name: string };
  transcripts: { id: string; startSec: number; endSec: number; text: string; order: number }[];
  vocabulary: { id: string; word: string; meaning: string; translation: string; example: string }[];
  questions: { id: string; question: string; options: string[]; correctIdx: number; order: number }[];
};

export default function PodcastDetailPage() {
  const params = useParams();
  const router = useRouter();
  const podcastId = params.id as string;

  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);
  const [podcast, setPodcast] = useState<Podcast | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [completed, setCompleted] = useState(false);
  const [xpMessage, setXpMessage] = useState("");

  useEffect(() => {
    const user = getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    loadPodcast();
  }, [podcastId]);

  async function loadPodcast() {
    try {
      const data = await api<Podcast>(`/podcasts/${podcastId}`);
      setPodcast(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function togglePlay() {
    if (!mediaRef.current) return;
    if (isPlaying) {
      mediaRef.current.pause();
    } else {
      mediaRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }

  function skip(seconds: number) {
    if (!mediaRef.current) return;
    mediaRef.current.currentTime += seconds;
  }

  function changeSpeed(newSpeed: number) {
    if (!mediaRef.current) return;
    mediaRef.current.playbackRate = newSpeed;
    setSpeed(newSpeed);
  }

  async function markComplete() {
    try {
      await api(`/podcasts/${podcastId}/progress`, {
        method: "POST",
        auth: true,
        body: { lastPositionSec: Math.floor(currentTime) },
      });

      if (!completed) {
        await api("/activities/complete", {
          method: "POST",
          auth: true,
        }).catch(() => null);
      }

      setCompleted(true);
      setXpMessage(`✅ Progress saved! You earned XP.`);
    } catch (err: any) {
      setError(err.message);
    }
  }

  function formatTime(sec: number) {
    const min = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${min}:${s.toString().padStart(2, "0")}`;
  }

  // 🆕 Helper: يبني URL كامل للملف (audio ولا video)
  function buildMediaUrl(url: string | null | undefined): string {
    if (!url) return "";
    // إلا كان URL خارجي (http:// ولا https://) خليه كيفما هو
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    // وإلا، زيد API_URL قبل المسار النسبي
    return `${API_URL}${url}`;
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </main>
    );
  }

  if (error || !podcast) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="bg-white rounded-3xl shadow-sm p-8 max-w-md text-center">
          <p className="text-red-600 mb-4">{error || "Podcast not found"}</p>
          <a href="/podcasts" className="text-myna-orange font-semibold">
            ← Back to Podcasts
          </a>
        </div>
      </main>
    );
  }

  const hasVideo = !!podcast.videoUrl;
  const mediaUrl = hasVideo
    ? buildMediaUrl(podcast.videoUrl)
    : buildMediaUrl(podcast.audioUrl);

  return (
    <main className="min-h-screen bg-cream px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <a href="/podcasts" className="text-myna-orange font-semibold text-sm">
          ← Back to Podcasts
        </a>

        {/* Header */}
        <div className="mt-6 flex flex-col md:flex-row gap-6 items-start">
          <PodcastCover
            coverUrl={podcast.coverUrl}
            title={podcast.title}
            className="w-full md:w-48 h-48 object-cover rounded-3xl shadow-sm"
          />
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-wider text-myna-orange">
              {podcast.language?.name} · {podcast.level} · {podcast.category}
            </p>
            <h1 className="font-display text-4xl font-bold text-myna-charcoal mt-2">
              {podcast.title}
            </h1>
            <p className="text-myna-charcoal/70 mt-3">{podcast.description}</p>
            <p className="text-sm text-myna-charcoal/60 mt-4">
              ⏱ {formatTime(podcast.durationSec)} · ⭐ {podcast.xpReward} XP
            </p>
          </div>
        </div>

        {/* 🆕 Media Player: Video أو Audio */}
        <div className="mt-8 bg-white rounded-3xl shadow-sm p-6">
          {hasVideo ? (
            // 🎥 Video Player
            <video
              ref={mediaRef as React.RefObject<HTMLVideoElement>}
              src={mediaUrl}
              poster={podcast.coverUrl || undefined}
              className="w-full rounded-2xl mb-4 bg-black"
              controls
              onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
              onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
              onEnded={() => setIsPlaying(false)}
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            // 🎵 Audio Player (بحال قبل)
            <audio
              ref={mediaRef as React.RefObject<HTMLAudioElement>}
              src={mediaUrl}
              onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
              onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
              onEnded={() => setIsPlaying(false)}
            />
          )}

          {/* Progress Bar */}
          <div className="mb-4">
            <input
              type="range"
              min={0}
              max={duration || 0}
              value={currentTime}
              onChange={(e) => {
                if (mediaRef.current) {
                  mediaRef.current.currentTime = Number(e.target.value);
                }
              }}
              className="w-full accent-myna-orange"
            />
            <div className="flex justify-between text-xs text-myna-charcoal/60 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration || podcast.durationSec)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => skip(-10)}
              className="w-12 h-12 rounded-full bg-cream text-myna-charcoal font-bold hover:bg-myna-orange/20"
            >
              −10
            </button>
            <button
              onClick={togglePlay}
              className="w-16 h-16 rounded-full bg-myna-orange text-white text-2xl font-bold hover:bg-myna-orange/90"
            >
              {isPlaying ? "⏸" : "▶"}
            </button>
            <button
              onClick={() => skip(10)}
              className="w-12 h-12 rounded-full bg-cream text-myna-charcoal font-bold hover:bg-myna-orange/20"
            >
              +10
            </button>
          </div>

          {/* Speed */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className="text-xs text-myna-charcoal/60">Speed:</span>
            {[0.75, 1, 1.25, 1.5].map((s) => (
              <button
                key={s}
                onClick={() => changeSpeed(s)}
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  speed === s
                    ? "bg-myna-orange text-white"
                    : "bg-cream text-myna-charcoal/60"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Mark Complete */}
        <div className="mt-6">
          {xpMessage && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-2xl text-green-800 text-sm">
              {xpMessage}
            </div>
          )}
          <button
            onClick={markComplete}
            disabled={completed}
            className="w-full py-4 rounded-full bg-myna-charcoal text-white font-bold hover:bg-myna-charcoal/90 disabled:opacity-50"
          >
            {completed ? "✅ Completed" : "Mark as Complete"}
          </button>
        </div>

        {/* Transcript */}
        {podcast.transcripts.length > 0 && (
          <div className="mt-10">
            <h2 className="font-display text-2xl font-bold text-myna-charcoal mb-4">
              Transcript
            </h2>
            <div className="bg-white rounded-3xl shadow-sm p-6 space-y-3">
              {podcast.transcripts.map((t) => (
                <p key={t.id} className="text-myna-charcoal/80 text-sm">
                  <span className="text-myna-orange font-mono mr-3">
                    {formatTime(t.startSec)}
                  </span>
                  {t.text}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Vocabulary */}
        {podcast.vocabulary.length > 0 && (
          <div className="mt-10">
            <h2 className="font-display text-2xl font-bold text-myna-charcoal mb-4">
              Vocabulary
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {podcast.vocabulary.map((v) => (
                <div key={v.id} className="bg-white rounded-2xl shadow-sm p-5">
                  <p className="font-bold text-myna-charcoal">{v.word}</p>
                  <p className="text-sm text-myna-charcoal/60 mt-1">{v.meaning}</p>
                  <p className="text-sm text-myna-orange mt-2">{v.translation}</p>
                  <p className="text-xs text-myna-charcoal/60 mt-2 italic">
                    "{v.example}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Questions */}
        {podcast.questions.length > 0 && (
          <div className="mt-10">
            <h2 className="font-display text-2xl font-bold text-myna-charcoal mb-4">
              Questions
            </h2>
            <div className="space-y-4">
              {podcast.questions.map((q, i) => (
                <div key={q.id} className="bg-white rounded-2xl shadow-sm p-5">
                  <p className="font-semibold text-myna-charcoal">
                    {i + 1}. {q.question}
                  </p>
                  <div className="mt-3 space-y-2">
                    {q.options.map((opt, idx) => (
                      <div
                        key={idx}
                        className="px-4 py-2 rounded-xl bg-cream text-sm text-myna-charcoal/80"
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}