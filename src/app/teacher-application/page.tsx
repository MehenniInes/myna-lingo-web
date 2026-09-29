"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Language {
  id: string;
  name: string;
  code: string;
}

interface LanguageRow {
  languageId: string;
  serviceType: "CONVERSATION_PARTNER" | "PROFESSIONAL_TEACHER";
  certificateFile: File | null;
}

export default function TeacherApplicationPage() {
  const router = useRouter();
  const [bio, setBio] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [languages, setLanguages] = useState<Language[]>([]);
  const [rows, setRows] = useState<LanguageRow[]>([
    { languageId: "", serviceType: "PROFESSIONAL_TEACHER", certificateFile: null },
  ]);
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

  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraActive]);

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

  function addRow() {
    setRows([...rows, { languageId: "", serviceType: "PROFESSIONAL_TEACHER", certificateFile: null }]);
  }

  function removeRow(index: number) {
    setRows(rows.filter((_, i) => i !== index));
  }

  function updateRow(index: number, updates: Partial<LanguageRow>) {
    setRows(rows.map((row, i) => (i === index ? { ...row, ...updates } : row)));
  }

  async function uploadFile(file: File, endpoint: string): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    const token = localStorage.getItem("accessToken");
    const res = await fetch(`http://localhost:4000/teachers/upload/${endpoint}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json();
    return data.url;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!idFile) {
      setError("Please upload or take a photo of your ID document.");
      return;
    }
    if (rows.some((r) => !r.languageId || !r.certificateFile)) {
      setError("Each language must have a language selected and a certificate uploaded.");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const idDocumentUrl = await uploadFile(idFile, "id-document");

      const languagesPayload = await Promise.all(
        rows.map(async (row) => ({
          languageId: row.languageId,
          serviceType: row.serviceType,
          certificateUrls: [await uploadFile(row.certificateFile as File, "certificate")],
        }))
      );

      const res = await fetch("http://localhost:4000/teachers/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bio,
          experienceYears: Number(experienceYears),
          idDocumentUrl,
          languages: languagesPayload,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Submission failed");
        setLoading(false);
        return;
      }

      router.push("/");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
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

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-6">
          <div>
            <label className="block text-sm font-medium text-myna-charcoal mb-1">Bio</label>
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
            <label className="block text-sm font-medium text-myna-charcoal mb-1">Years of Experience</label>
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
            <label className="block text-sm font-medium text-myna-charcoal mb-1">ID Document</label>
            {idPreviewUrl ? (
              <div className="flex flex-col items-center gap-3">
                <Image src={idPreviewUrl} alt="ID preview" width={640} height={400} unoptimized className="max-h-64 w-auto rounded-xl border border-myna-charcoal/20" />
                <button type="button" onClick={() => { setIdFile(null); setIdPreviewUrl(null); }} className="text-sm text-myna-orange font-medium">
                  Remove and choose again
                </button>
              </div>
            ) : cameraActive ? (
              <div className="flex flex-col items-center gap-3">
                <video ref={videoRef} autoPlay playsInline muted className="max-h-64 rounded-xl border border-myna-charcoal/20" />
                <div className="flex gap-3">
                  <button type="button" onClick={capturePhoto} className="px-5 py-2 rounded-full font-medium bg-myna-orange text-white">Capture</button>
                  <button type="button" onClick={stopCamera} className="px-5 py-2 rounded-full font-medium border border-myna-charcoal/20 text-myna-charcoal">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3">
                <label className="flex-1 text-center px-5 py-3 rounded-xl border-2 border-dashed border-myna-charcoal/20 cursor-pointer hover:bg-myna-yellow/10 transition">
                  Upload File
                  <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                </label>
                <button type="button" onClick={startCamera} className="flex-1 px-5 py-3 rounded-xl border-2 border-dashed border-myna-charcoal/20 hover:bg-myna-yellow/10 transition">
                  Take Photo
                </button>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          <div className="flex flex-col gap-4">
            <label className="block text-sm font-medium text-myna-charcoal">Languages You Teach</label>
            {rows.map((row, index) => (
              <div key={index} className="border border-myna-charcoal/20 rounded-xl p-4 flex flex-col gap-3">
                <div className="flex gap-3">
                  <select
                    value={row.languageId}
                    onChange={(e) => updateRow(index, { languageId: e.target.value })}
                    className="flex-1 rounded-xl border border-myna-charcoal/20 px-3 py-2"
                  >
                    <option value="">Select language</option>
                    {languages.map((lang) => (
                      <option key={lang.id} value={lang.id}>{lang.name}</option>
                    ))}
                  </select>
                  <select
                    value={row.serviceType}
                    onChange={(e) => updateRow(index, { serviceType: e.target.value as LanguageRow["serviceType"] })}
                    className="flex-1 rounded-xl border border-myna-charcoal/20 px-3 py-2"
                  >
                    <option value="PROFESSIONAL_TEACHER">Professional Teacher</option>
                    <option value="CONVERSATION_PARTNER">Conversation Partner</option>
                  </select>
                </div>

                <label className="text-center px-4 py-2 rounded-xl border-2 border-dashed border-myna-charcoal/20 cursor-pointer hover:bg-myna-yellow/10 transition text-sm">
                  {row.certificateFile ? row.certificateFile.name : "Upload Certificate (PDF)"}
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => updateRow(index, { certificateFile: e.target.files?.[0] || null })}
                    className="hidden"
                  />
                </label>

                {rows.length > 1 && (
                  <button type="button" onClick={() => removeRow(index)} className="text-sm text-red-600 self-start">
                    Remove this language
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={addRow} className="text-myna-orange font-medium text-sm self-start">
              + Add another language
            </button>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-full font-semibold bg-myna-orange text-white hover:bg-myna-orange/90 transition disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Application"}
          </button>
        </form>
      </div>
    </main>
  );
}