"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, Loader2, Upload, Trash2, Film, AlertCircle, CheckCircle2,
} from "lucide-react";
import { api, getToken, getUser } from "@/lib/api";

interface TeacherVideo {
  id: string;
  url: string;
  title: string | null;
  sizeBytes: number | null;
  mimeType: string | null;
  uploadedAt: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const MAX_SIZE = 100 * 1024 * 1024; // 100 MB
const ALLOWED = ["video/mp4", "video/webm"];

export default function TeacherVideosPage() {
  const router = useRouter();
  const [videos, setVideos] = useState<TeacherVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const u = getUser();
    if (!u) { router.push("/login"); return; }
    if (u.role !== "TEACHER") { router.push("/"); return; }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await api<TeacherVideo[]>("/teachers/me/videos", { auth: true });
      setVideos(data);
    } catch (err: any) {
      setError(err.message || "Could not load videos");
    } finally {
      setLoading(false);
    }
  }

  function pickFile(f: File | null) {
    setError("");
    setMsg("");
    if (!f) { setFile(null); return; }
    if (!ALLOWED.includes(f.type)) {
      setError("Only MP4 or WebM videos are allowed");
      return;
    }
    if (f.size > MAX_SIZE) {
      setError("File too large — 100 MB max");
      return;
    }
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
  }

  async function upload() {
    if (!file) return;
    setUploading(true);
    setError("");
    setMsg("");
    try {
      const fd = new FormData();
      fd.append("file", file);

      const token = getToken();
      const res = await fetch(`${API_URL}/teachers/upload/video`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const up = await res.json();
      if (!res.ok) throw new Error(up?.message || "Upload failed");

      await api("/teachers/me/videos", {
        method: "POST",
        auth: true,
        body: {
          url: up.url,
          title: title.trim() || undefined,
          sizeBytes: up.sizeBytes,
          mimeType: up.mimeType,
        },
      });

      setFile(null);
      setTitle("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setMsg("✅ Video uploaded");
      await load();
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function remove(videoId: string) {
    if (!confirm("Delete this video?")) return;
    try {
      await api(`/teachers/me/videos/${videoId}`, { method: "DELETE", auth: true });
      setVideos((v) => v.filter((x) => x.id !== videoId));
    } catch (err: any) {
      setError(err.message || "Delete failed");
    }
  }

  function fmtSize(bytes: number | null) {
    if (!bytes) return "—";
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  if (loading) {
    return <main className="min-h-screen flex items-center justify-center text-myna-charcoal/60"><Loader2 size={20} className="animate-spin" /></main>;
  }

  return (
    <main className="min-h-screen bg-cream">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <Link href="/teacher" className="inline-flex items-center gap-1 text-myna-orange font-semibold text-sm hover:underline">
          <ChevronLeft size={14} /> Back to dashboard
        </Link>

        <div className="mt-4">
          <h1 className="font-display text-4xl font-bold text-myna-charcoal">Intro videos</h1>
          <p className="text-myna-charcoal/60 mt-2">
            Upload short videos (max 10) — students see these on your public profile.
          </p>
        </div>

        {/* Upload form */}
        <div className="mt-6 bg-white rounded-3xl shadow-sm p-6">
          <h2 className="font-display font-bold text-lg text-myna-charcoal mb-4">Add a video</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-myna-charcoal/50 mb-1">
                Title (optional)
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={80}
                placeholder="e.g. Introduction"
                className="w-full rounded-xl border border-myna-charcoal/15 bg-cream px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-myna-orange"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-myna-charcoal/50 mb-1">
                Video file (MP4 or WebM, max 100 MB)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm"
                onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-myna-charcoal/70 file:me-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-myna-orange file:text-white hover:file:bg-myna-orange/90"
              />
              {file && (
                <p className="mt-2 text-xs text-myna-charcoal/60">
                  {file.name} · {fmtSize(file.size)}
                </p>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {msg && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm flex items-start gap-2">
                <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
                <span>{msg}</span>
              </div>
            )}

            <button
              onClick={upload}
              disabled={!file || uploading}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-myna-orange text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              {uploading ? "Uploading…" : "Upload video"}
            </button>
          </div>
        </div>

        {/* Gallery */}
        <h2 className="font-display text-2xl font-bold text-myna-charcoal mt-10 mb-4">
          Your videos ({videos.length}/10)
        </h2>

        {videos.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm p-12 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-myna-yellow/30 text-myna-orange flex items-center justify-center">
              <Film size={24} />
            </div>
            <p className="font-display text-xl font-bold text-myna-charcoal mt-4">No videos yet</p>
            <p className="text-myna-charcoal/60 text-sm mt-2">
              Upload a short intro to help students get to know you.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {videos.map((v) => (
              <div key={v.id} className="bg-white rounded-3xl shadow-sm overflow-hidden">
                <video src={v.url} controls preload="metadata" className="w-full aspect-video bg-black" />
                <div className="p-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-myna-charcoal truncate">
                      {v.title || "Untitled"}
                    </p>
                    <p className="text-xs text-myna-charcoal/50 mt-0.5">
                      {fmtSize(v.sizeBytes)} · {new Date(v.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => remove(v.id)}
                    className="shrink-0 w-9 h-9 rounded-full border border-red-200 text-red-600 hover:bg-red-50 flex items-center justify-center"
                    aria-label="Delete video"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}