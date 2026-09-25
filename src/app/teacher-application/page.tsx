"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface Language {
  id: string;
  name: string;
  code: string;
}

export default function TeacherApplicationPage() {
  const router = useRouter();
  const [bio, setBio] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [languages, setLanguages] = useState<Language[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [idFile, setIdFile] = useState<File | null>(null);
  const [idPreviewUrl, setIdPreviewUrl] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/login");
      return;
    }
    fetch("http://localhost:4000/languages")
      .then((res) => res.json())
      .then(setLanguages)
      .catch(() => setError("Could not load languages"));
  }, [router]);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setIdFile(file);
      setIdPreviewUrl(URL.createObjectURL(file));
    }
  }

    async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      setCameraActive(true);
    } catch {
      setError("Could not access camera. Please check permissions or use file upload instead.");
    }
  }

  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraActive]);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraActive(false);
  }

  function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], "id-photo.jpg", { type: "image/jpeg" });
        setIdFile(file);
        setIdPreviewUrl(URL.createObjectURL(blob));
      }
    }, "image/jpeg");
    stopCamera();
  }

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="max-w-2xl mx-auto bg-myna-white rounded-3xl shadow-sm p-8">
        <h1 className="font-display text-3xl font-bold text-myna-charcoal text-center">
          Apply to Teach
        </h1>
        <p className="text-center text-myna-charcoal/70 mt-2">
          Tell us about yourself and the languages you&apos;d like to teach.
        </p>

        <form className="mt-8 flex flex-col gap-6">
          <div>
            <label className="block text-sm font-medium text-myna-charcoal mb-1">
              Bio
            </label>
            <textarea
              required
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full rounded-xl border border-myna-charcoal/20 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-myna-orange"
              placeholder="Tell students about your teaching experience..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-myna-charcoal mb-1">
              Years of Experience
            </label>
            <input
              type="number"
              required
              min={0}
              value={experienceYears}
              onChange={(e) => setExperienceYears(e.target.value)}
              className="w-full rounded-xl border border-myna-charcoal/20 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-myna-orange"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-myna-charcoal mb-1">
              ID Document
            </label>

            {idPreviewUrl ? (
              <div className="flex flex-col items-center gap-3">
                <img src={idPreviewUrl} alt="ID preview" className="max-h-64 rounded-xl border border-myna-charcoal/20" />
                <button
                  type="button"
                  onClick={() => { setIdFile(null); setIdPreviewUrl(null); }}
                  className="text-sm text-myna-orange font-medium"
                >
                  Remove and choose again
                </button>
              </div>
            ) : cameraActive ? (
              <div className="flex flex-col items-center gap-3">
                <video ref={videoRef} autoPlay playsInline muted className="max-h-64 rounded-xl border border-myna-charcoal/20" />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="px-5 py-2 rounded-full font-medium bg-myna-orange text-white"
                  >
                    Capture
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-5 py-2 rounded-full font-medium border border-myna-charcoal/20 text-myna-charcoal"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3">
                <label className="flex-1 text-center px-5 py-3 rounded-xl border-2 border-dashed border-myna-charcoal/20 cursor-pointer hover:bg-myna-yellow/10 transition">
                  Upload File
                  <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                </label>
                <button
                  type="button"
                  onClick={startCamera}
                  className="flex-1 px-5 py-3 rounded-xl border-2 border-dashed border-myna-charcoal/20 hover:bg-myna-yellow/10 transition"
                >
                  Take Photo
                </button>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}
        </form>
      </div>
    </main>
  );
}