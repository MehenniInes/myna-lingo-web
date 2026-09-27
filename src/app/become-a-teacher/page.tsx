"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const STEPS = ["About", "Photo", "Certification"] as const;
type Step = typeof STEPS[number];

interface Language {
  id: string;
  name: string;
}

export default function BecomeATeacherPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("About");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [languages, setLanguages] = useState<Language[]>([]);

  // About step fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [countryOfBirth, setCountryOfBirth] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [confirmedOver18, setConfirmedOver18] = useState(false);
  const [subjectLanguageId, setSubjectLanguageId] = useState("");
  const [subjectServiceType, setSubjectServiceType] = useState<"CONVERSATION_PARTNER" | "PROFESSIONAL_TEACHER">("PROFESSIONAL_TEACHER");

  // Photo step fields
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  function authHeaders() {
    const token = localStorage.getItem("accessToken");
    return { Authorization: `Bearer ${token}` };
  }

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/login");
      return;
    }

    async function init() {
      try {
        await fetch("http://localhost:4000/teachers/become", {
          method: "POST",
          headers: authHeaders(),
        });

        const [draftRes, langsRes] = await Promise.all([
          fetch("http://localhost:4000/teachers/draft", { headers: authHeaders() }),
          fetch("http://localhost:4000/languages"),
        ]);

        const draft = await draftRes.json();
        const langs = await langsRes.json();
        setLanguages(langs);

        if (draft.firstName) setFirstName(draft.firstName);
        if (draft.lastName) setLastName(draft.lastName);
        if (draft.countryOfBirth) setCountryOfBirth(draft.countryOfBirth);
        if (draft.phoneNumber) setPhoneNumber(draft.phoneNumber);
        if (draft.confirmedOver18) setConfirmedOver18(draft.confirmedOver18);
        if (draft.profilePhotoUrl) setPhotoPreviewUrl(draft.profilePhotoUrl);
        if (draft.teacherLanguages?.[0]) {
          setSubjectLanguageId(draft.teacherLanguages[0].languageId);
          setSubjectServiceType(draft.teacherLanguages[0].serviceType);
        }
      } catch {
        setError("Could not load your application. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [router]);

  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraActive]);

  async function saveAboutStep() {
    setSaving(true);
    setError("");
    try {
      await fetch("http://localhost:4000/teachers/draft/about", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ firstName, lastName, countryOfBirth, phoneNumber, confirmedOver18 }),
      });

      await fetch("http://localhost:4000/teachers/draft/teaching-languages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ languages: [{ languageId: subjectLanguageId, serviceType: subjectServiceType }] }),
      });

      setStep("Photo");
    } catch {
      setError("Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreviewUrl(URL.createObjectURL(file));
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
        const file = new File([blob], "profile-photo.jpg", { type: "image/jpeg" });
        setPhotoFile(file);
        setPhotoPreviewUrl(URL.createObjectURL(blob));
      }
    }, "image/jpeg");
    stopCamera();
  }

  async function savePhotoStep() {
    if (!photoFile && !photoPreviewUrl) {
      setError("Please upload or take a profile photo.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      let photoUrl = photoPreviewUrl;

      if (photoFile) {
        const formData = new FormData();
        formData.append("file", photoFile);
        const uploadRes = await fetch("http://localhost:4000/teachers/upload/profile-photo", {
          method: "POST",
          headers: authHeaders(),
          body: formData,
        });
        const uploadData = await uploadRes.json();
        photoUrl = uploadData.url;

        await fetch("http://localhost:4000/teachers/draft/profile-photo", {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify({ profilePhotoUrl: photoUrl }),
        });
      }

      setStep("Certification");
    } catch {
      setError("Could not save photo. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <main className="min-h-screen flex items-center justify-center">Loading...</main>;
  }

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-center gap-2 mb-8">
          {STEPS.map((s) => (
            <div
              key={s}
              className={`px-4 py-1 rounded-full text-sm font-medium ${
                s === step ? "bg-myna-orange text-white" : "bg-myna-charcoal/10 text-myna-charcoal/60"
              }`}
            >
              {s}
            </div>
          ))}
        </div>

        <div className="bg-myna-white rounded-3xl shadow-sm p-8">
          {step === "About" && (
            <>
              <h1 className="font-display text-3xl font-bold text-myna-charcoal">About</h1>
              <p className="text-myna-charcoal/70 mt-2">
                Start creating your public tutor profile. Your progress is saved automatically.
              </p>

              <div className="mt-8 flex flex-col gap-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-myna-charcoal mb-1">First name</label>
                    <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full rounded-xl border border-myna-charcoal/20 px-4 py-3" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-myna-charcoal mb-1">Last name</label>
                    <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full rounded-xl border border-myna-charcoal/20 px-4 py-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-myna-charcoal mb-1">Country of birth</label>
                  <input value={countryOfBirth} onChange={(e) => setCountryOfBirth(e.target.value)} className="w-full rounded-xl border border-myna-charcoal/20 px-4 py-3" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-myna-charcoal mb-1">Subject you teach</label>
                  <div className="flex gap-3">
                    <select value={subjectLanguageId} onChange={(e) => setSubjectLanguageId(e.target.value)} className="flex-1 rounded-xl border border-myna-charcoal/20 px-4 py-3">
                      <option value="">Select language</option>
                      {languages.map((l) => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                      ))}
                    </select>
                    <select value={subjectServiceType} onChange={(e) => setSubjectServiceType(e.target.value as "PROFESSIONAL_TEACHER" | "CONVERSATION_PARTNER")} className="flex-1 rounded-xl border border-myna-charcoal/20 px-4 py-3">
                      <option value="PROFESSIONAL_TEACHER">Professional Teacher</option>
                      <option value="CONVERSATION_PARTNER">Conversation Partner</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-myna-charcoal mb-1">Phone number (optional)</label>
                  <input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full rounded-xl border border-myna-charcoal/20 px-4 py-3" />
                </div>

                <label className="flex items-center gap-2 text-sm text-myna-charcoal">
                  <input type="checkbox" checked={confirmedOver18} onChange={(e) => setConfirmedOver18(e.target.checked)} />
                  I confirm I&apos;m over 18
                </label>

                {error && <p className="text-red-600 text-sm">{error}</p>}

                <button
                  onClick={saveAboutStep}
                  disabled={saving || !firstName || !lastName || !countryOfBirth || !confirmedOver18 || !subjectLanguageId}
                  className="mt-2 w-full py-3 rounded-full font-semibold bg-myna-orange text-white hover:bg-myna-orange/90 transition disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Continue"}
                </button>
              </div>
            </>
          )}

          {step === "Photo" && (
            <>
              <h1 className="font-display text-3xl font-bold text-myna-charcoal">Profile Photo</h1>
              <p className="text-myna-charcoal/70 mt-2">Choose a photo that will help learners get to know you.</p>

              <div className="mt-8 flex flex-col gap-4">
                {photoPreviewUrl ? (
                  <div className="flex flex-col items-center gap-3">
                    <img src={photoPreviewUrl} alt="Profile preview" className="w-40 h-40 object-cover rounded-full border border-myna-charcoal/20" />
                    <button type="button" onClick={() => { setPhotoFile(null); setPhotoPreviewUrl(null); }} className="text-sm text-myna-orange font-medium">
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
                      <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
                    </label>
                    <button type="button" onClick={startCamera} className="flex-1 px-5 py-3 rounded-xl border-2 border-dashed border-myna-charcoal/20 hover:bg-myna-yellow/10 transition">
                      Take Photo
                    </button>
                  </div>
                )}
                <canvas ref={canvasRef} className="hidden" />

                {error && <p className="text-red-600 text-sm">{error}</p>}

                <div className="flex gap-3 mt-2">
                  <button onClick={() => setStep("About")} className="px-5 py-3 rounded-full font-medium border border-myna-charcoal/20 text-myna-charcoal">
                    Back
                  </button>
                  <button
                    onClick={savePhotoStep}
                    disabled={saving}
                    className="flex-1 py-3 rounded-full font-semibold bg-myna-orange text-white hover:bg-myna-orange/90 transition disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Continue"}
                  </button>
                </div>
              </div>
            </>
          )}

          {step === "Certification" && (
            <div>
              <h1 className="font-display text-3xl font-bold text-myna-charcoal">Certification</h1>
              <p className="text-myna-charcoal/70 mt-2">Coming next.</p>
              <button onClick={() => setStep("Photo")} className="mt-6 text-myna-orange font-medium">← Back</button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}