/*"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const STEPS = ["About", "Photo", "ID", "Certification"] as const;
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

  // Certification step fields
  const [teacherLanguageId, setTeacherLanguageId] = useState<string | null>(null);
  const [certDescription, setCertDescription] = useState("");
  const [certIssuedBy, setCertIssuedBy] = useState("");
  const [certYearFrom, setCertYearFrom] = useState("");
  const [certYearTo, setCertYearTo] = useState("");
  const [certFile, setCertFile] = useState<File | null>(null);
  const [certSubmitted, setCertSubmitted] = useState(false);

  // Photo step fields
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [photoCameraActive, setPhotoCameraActive] = useState(false);
  const photoVideoRef = useRef<HTMLVideoElement>(null);
  const photoCanvasRef = useRef<HTMLCanvasElement>(null);
  const photoStreamRef = useRef<MediaStream | null>(null);

  // ID document step fields
  const [idFile, setIdFile] = useState<File | null>(null);
  const [idPreviewUrl, setIdPreviewUrl] = useState<string | null>(null);
  const [idCameraActive, setIdCameraActive] = useState(false);
  const idVideoRef = useRef<HTMLVideoElement>(null);
  const idCanvasRef = useRef<HTMLCanvasElement>(null);
  const idStreamRef = useRef<MediaStream | null>(null);

  // Final submit
  const [finished, setFinished] = useState(false);

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
        if (draft.idDocumentUrl) setIdPreviewUrl(draft.idDocumentUrl);
        if (draft.applicationStatus && draft.applicationStatus !== "DRAFT") setFinished(true);
        if (draft.teacherLanguages?.[0]) {
          setSubjectLanguageId(draft.teacherLanguages[0].languageId);
          setSubjectServiceType(draft.teacherLanguages[0].serviceType);
          setTeacherLanguageId(draft.teacherLanguages[0].id);
          if (draft.teacherLanguages[0].certificates?.length > 0) {
            setCertSubmitted(true);
          }
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
    if (photoCameraActive && photoVideoRef.current && photoStreamRef.current) {
      photoVideoRef.current.srcObject = photoStreamRef.current;
    }
  }, [photoCameraActive]);

  useEffect(() => {
    if (idCameraActive && idVideoRef.current && idStreamRef.current) {
      idVideoRef.current.srcObject = idStreamRef.current;
    }
  }, [idCameraActive]);

  async function saveAboutStep() {
    setSaving(true);
    setError("");
    try {
      await fetch("http://localhost:4000/teachers/draft/about", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ firstName, lastName, countryOfBirth, phoneNumber, confirmedOver18 }),
      });

      const langRes = await fetch("http://localhost:4000/teachers/draft/teaching-languages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ languages: [{ languageId: subjectLanguageId, serviceType: subjectServiceType }] }),
      });
      const langData = await langRes.json();
      if (langData.teacherLanguages?.[0]) {
        setTeacherLanguageId(langData.teacherLanguages[0].id);
      }

      setStep("Photo");
    } catch {
      setError("Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // Photo step handlers
  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreviewUrl(URL.createObjectURL(file));
    }
  }

  async function startPhotoCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      photoStreamRef.current = stream;
      setPhotoCameraActive(true);
    } catch {
      setError("Could not access camera. Please check permissions or use file upload instead.");
    }
  }

  function stopPhotoCamera() {
    photoStreamRef.current?.getTracks().forEach((track) => track.stop());
    photoStreamRef.current = null;
    setPhotoCameraActive(false);
  }

  function capturePhotoPic() {
    if (!photoVideoRef.current || !photoCanvasRef.current) return;
    const video = photoVideoRef.current;
    const canvas = photoCanvasRef.current;
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
    stopPhotoCamera();
  }

  async function savePhotoStep() {
    if (!photoFile && !photoPreviewUrl) {
      setError("Please upload or take a profile photo.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (photoFile) {
        const formData = new FormData();
        formData.append("file", photoFile);
        const uploadRes = await fetch("http://localhost:4000/teachers/upload/profile-photo", {
          method: "POST",
          headers: authHeaders(),
          body: formData,
        });
        const uploadData = await uploadRes.json();

        await fetch("http://localhost:4000/teachers/draft/profile-photo", {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify({ profilePhotoUrl: uploadData.url }),
        });
      }

      setStep("ID");
    } catch {
      setError("Could not save photo. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // ID step handlers
  function handleIdSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setIdFile(file);
      setIdPreviewUrl(URL.createObjectURL(file));
    }
  }

  async function startIdCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      idStreamRef.current = stream;
      setIdCameraActive(true);
    } catch {
      setError("Could not access camera. Please check permissions or use file upload instead.");
    }
  }

  function stopIdCamera() {
    idStreamRef.current?.getTracks().forEach((track) => track.stop());
    idStreamRef.current = null;
    setIdCameraActive(false);
  }

  function captureIdPic() {
    if (!idVideoRef.current || !idCanvasRef.current) return;
    const video = idVideoRef.current;
    const canvas = idCanvasRef.current;
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
    stopIdCamera();
  }

  async function saveIdStep() {
    if (!idFile && !idPreviewUrl) {
      setError("Please upload or take a photo of your ID document.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (idFile) {
        const formData = new FormData();
        formData.append("file", idFile);
        const uploadRes = await fetch("http://localhost:4000/teachers/upload/id-document", {
          method: "POST",
          headers: authHeaders(),
          body: formData,
        });
        const uploadData = await uploadRes.json();

        await fetch("http://localhost:4000/teachers/draft/id-document", {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify({ idDocumentUrl: uploadData.url }),
        });
      }

      setStep("Certification");
    } catch {
      setError("Could not save ID document. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function submitCertificate() {
    if (!teacherLanguageId) {
      setError("Something went wrong — please go back to the About step.");
      return;
    }
    if (!certIssuedBy || !certYearFrom || !certYearTo || !certFile) {
      setError("Please fill in all fields and upload your certificate.");
      return;
    }
    if (Number(certYearTo) < Number(certYearFrom)) {
      setError("End year cannot be before start year.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", certFile);
      const uploadRes = await fetch("http://localhost:4000/teachers/upload/certificate", {
        method: "POST",
        headers: authHeaders(),
        body: formData,
      });
      const uploadData = await uploadRes.json();

      await fetch("http://localhost:4000/teachers/draft/certificate", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          teacherLanguageId,
          description: certDescription,
          issuedBy: certIssuedBy,
          yearFrom: Number(certYearFrom),
          yearTo: Number(certYearTo),
          fileUrl: uploadData.url,
        }),
      });

      setCertSubmitted(true);
    } catch {
      setError("Could not save certificate. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function finishApplication() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("http://localhost:4000/teachers/draft/submit", {
        method: "POST",
        headers: authHeaders(),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Could not submit application.");
        setSaving(false);
        return;
      }
      setFinished(true);
    } catch {
      setError("Could not submit application. Please try again.");
      setSaving(false);
    }
  }

  if (loading) {
    return <main className="min-h-screen flex items-center justify-center">Loading...</main>;
  }

  if (finished) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md bg-myna-white rounded-3xl shadow-sm p-8 text-center">
          <h1 className="font-display text-3xl font-bold text-myna-charcoal">Application Submitted</h1>
          <p className="text-myna-charcoal/70 mt-4">
            Thank you! Your application is now under review. We'll notify you once it's been processed.
          </p>
          <a href="/" className="mt-6 inline-block px-8 py-3 rounded-full font-semibold bg-myna-orange text-white">
            Back to Home
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-center gap-2 mb-8 flex-wrap">
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
                    <select value={subjectServiceType} onChange={(e) => setSubjectServiceType(e.target.value as any)} className="flex-1 rounded-xl border border-myna-charcoal/20 px-4 py-3">
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
                ) : photoCameraActive ? (
                  <div className="flex flex-col items-center gap-3">
                    <video ref={photoVideoRef} autoPlay playsInline muted className="max-h-64 rounded-xl border border-myna-charcoal/20" />
                    <div className="flex gap-3">
                      <button type="button" onClick={capturePhotoPic} className="px-5 py-2 rounded-full font-medium bg-myna-orange text-white">Capture</button>
                      <button type="button" onClick={stopPhotoCamera} className="px-5 py-2 rounded-full font-medium border border-myna-charcoal/20 text-myna-charcoal">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <label className="flex-1 text-center px-5 py-3 rounded-xl border-2 border-dashed border-myna-charcoal/20 cursor-pointer hover:bg-myna-yellow/10 transition">
                      Upload File
                      <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
                    </label>
                    <button type="button" onClick={startPhotoCamera} className="flex-1 px-5 py-3 rounded-xl border-2 border-dashed border-myna-charcoal/20 hover:bg-myna-yellow/10 transition">
                      Take Photo
                    </button>
                  </div>
                )}
                <canvas ref={photoCanvasRef} className="hidden" />

                {error && <p className="text-red-600 text-sm">{error}</p>}

                <div className="flex gap-3 mt-2">
                  <button onClick={() => { setError(""); setStep("About"); }} className="px-5 py-3 rounded-full font-medium border border-myna-charcoal/20 text-myna-charcoal">
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

          {step === "ID" && (
            <>
              <h1 className="font-display text-3xl font-bold text-myna-charcoal">ID Document</h1>
              <p className="text-myna-charcoal/70 mt-2">We need this to verify your identity. It's kept private and never shown publicly.</p>

              <div className="mt-8 flex flex-col gap-4">
                {idPreviewUrl ? (
                  <div className="flex flex-col items-center gap-3">
                    <img src={idPreviewUrl} alt="ID preview" className="max-h-64 rounded-xl border border-myna-charcoal/20" />
                    <button type="button" onClick={() => { setIdFile(null); setIdPreviewUrl(null); }} className="text-sm text-myna-orange font-medium">
                      Remove and choose again
                    </button>
                  </div>
                ) : idCameraActive ? (
                  <div className="flex flex-col items-center gap-3">
                    <video ref={idVideoRef} autoPlay playsInline muted className="max-h-64 rounded-xl border border-myna-charcoal/20" />
                    <div className="flex gap-3">
                      <button type="button" onClick={captureIdPic} className="px-5 py-2 rounded-full font-medium bg-myna-orange text-white">Capture</button>
                      <button type="button" onClick={stopIdCamera} className="px-5 py-2 rounded-full font-medium border border-myna-charcoal/20 text-myna-charcoal">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <label className="flex-1 text-center px-5 py-3 rounded-xl border-2 border-dashed border-myna-charcoal/20 cursor-pointer hover:bg-myna-yellow/10 transition">
                      Upload File
                      <input type="file" accept="image/*" onChange={handleIdSelect} className="hidden" />
                    </label>
                    <button type="button" onClick={startIdCamera} className="flex-1 px-5 py-3 rounded-xl border-2 border-dashed border-myna-charcoal/20 hover:bg-myna-yellow/10 transition">
                      Take Photo
                    </button>
                  </div>
                )}
                <canvas ref={idCanvasRef} className="hidden" />

                {error && <p className="text-red-600 text-sm">{error}</p>}

                <div className="flex gap-3 mt-2">
                  <button onClick={() => { setError(""); setStep("Photo"); }} className="px-5 py-3 rounded-full font-medium border border-myna-charcoal/20 text-myna-charcoal">
                    Back
                  </button>
                  <button
                    onClick={saveIdStep}
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
            <>
              <h1 className="font-display text-3xl font-bold text-myna-charcoal">Teaching Certification</h1>
              <p className="text-myna-charcoal/70 mt-2">
                Add a certificate for the language you teach. This is required before you can submit your application.
              </p>

              {certSubmitted ? (
                <div className="mt-8 flex flex-col gap-4">
                  <p className="text-green-700 bg-green-50 rounded-xl p-4 text-sm">
                    Certificate submitted. Our team will review it.
                  </p>
                  {error && <p className="text-red-600 text-sm">{error}</p>}
                  <button
                    onClick={finishApplication}
                    disabled={saving}
                    className="w-full py-3 rounded-full font-semibold bg-myna-orange text-white hover:bg-myna-orange/90 transition disabled:opacity-50"
                  >
                    {saving ? "Submitting..." : "Finish Application"}
                  </button>
                </div>
              ) : (
                <div className="mt-8 flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-medium text-myna-charcoal mb-1">Description</label>
                    <input value={certDescription} onChange={(e) => setCertDescription(e.target.value)} className="w-full rounded-xl border border-myna-charcoal/20 px-4 py-3" placeholder="e.g. TEFL Certificate, CELTA..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-myna-charcoal mb-1">Issued by</label>
                    <input value={certIssuedBy} onChange={(e) => setCertIssuedBy(e.target.value)} className="w-full rounded-xl border border-myna-charcoal/20 px-4 py-3" placeholder="e.g. Cambridge, British Council..." />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-myna-charcoal mb-1">Year from</label>
                      <select value={certYearFrom} onChange={(e) => setCertYearFrom(e.target.value)} className="w-full rounded-xl border border-myna-charcoal/20 px-4 py-3">
                        <option value="">Select</option>
                        {Array.from({ length: 60 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-myna-charcoal mb-1">Year to</label>
                      <select value={certYearTo} onChange={(e) => setCertYearTo(e.target.value)} className="w-full rounded-xl border border-myna-charcoal/20 px-4 py-3">
                        <option value="">Select</option>
                        {Array.from({ length: 60 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <label className="text-center px-4 py-3 rounded-xl border-2 border-dashed border-myna-charcoal/20 cursor-pointer hover:bg-myna-yellow/10 transition text-sm">
                    {certFile ? certFile.name : "Upload your certificate (JPG or PNG, max 20MB)"}
                    <input type="file" accept="image/jpeg,image/png" onChange={(e) => setCertFile(e.target.files?.[0] || null)} className="hidden" />
                  </label>

                  {error && <p className="text-red-600 text-sm">{error}</p>}

                  <div className="flex gap-3 mt-2">
                    <button onClick={() => { setError(""); setStep("ID"); }} className="px-5 py-3 rounded-full font-medium border border-myna-charcoal/20 text-myna-charcoal">
                      Back
                    </button>
                    <button
                      onClick={submitCertificate}
                      disabled={saving}
                      className="flex-1 py-3 rounded-full font-semibold bg-myna-orange text-white hover:bg-myna-orange/90 transition disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Submit Certificate"}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}*/
"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { api, getToken } from "@/lib/api";
import { useLanguage } from "@/app/language-provider";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const STEP_KEYS = [
  "about", "photo", "id", "certification",
  "education", "description", "availability", "pricing",
] as const;
type StepKey = (typeof STEP_KEYS)[number];

interface Language { id: string; name: string; }

const COUNTRY_CODES = [
  { code: "+213", label: "Algeria" },
  { code: "+1", label: "USA / Canada" },
  { code: "+44", label: "UK" },
  { code: "+33", label: "France" },
  { code: "+49", label: "Germany" },
  { code: "+34", label: "Spain" },
  { code: "+39", label: "Italy" },
  { code: "+212", label: "Morocco" },
  { code: "+216", label: "Tunisia" },
  { code: "+20", label: "Egypt" },
  { code: "+966", label: "Saudi Arabia" },
  { code: "+971", label: "UAE" },
  { code: "+90", label: "Turkey" },
  { code: "+86", label: "China" },
  { code: "+91", label: "India" },
  { code: "+81", label: "Japan" },
];

const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Argentina","Armenia","Australia",
  "Austria","Azerbaijan","Bahrain","Bangladesh","Belarus","Belgium","Benin","Bolivia",
  "Bosnia and Herzegovina","Brazil","Bulgaria","Burkina Faso","Cambodia","Cameroon","Canada",
  "Chad","Chile","China","Colombia","Comoros","Congo","Costa Rica","Croatia","Cuba","Cyprus",
  "Czechia","Denmark","Djibouti","Dominican Republic","Ecuador","Egypt","El Salvador",
  "Estonia","Ethiopia","Finland","France","Gabon","Georgia","Germany","Ghana","Greece",
  "Guatemala","Guinea","Haiti","Honduras","Hungary","Iceland","India","Indonesia","Iran",
  "Iraq","Ireland","Israel","Italy","Ivory Coast","Jamaica","Japan","Jordan","Kazakhstan",
  "Kenya","Kuwait","Kyrgyzstan","Laos","Latvia","Lebanon","Libya","Lithuania","Luxembourg",
  "Madagascar","Malaysia","Maldives","Mali","Malta","Mauritania","Mauritius","Mexico",
  "Moldova","Monaco","Mongolia","Montenegro","Morocco","Mozambique","Myanmar","Namibia",
  "Nepal","Netherlands","New Zealand","Nicaragua","Niger","Nigeria","North Macedonia","Norway",
  "Oman","Pakistan","Palestine","Panama","Paraguay","Peru","Philippines","Poland","Portugal",
  "Qatar","Romania","Russia","Rwanda","Saudi Arabia","Senegal","Serbia","Singapore","Slovakia",
  "Slovenia","Somalia","South Africa","South Korea","South Sudan","Spain","Sri Lanka","Sudan",
  "Sweden","Switzerland","Syria","Taiwan","Tajikistan","Tanzania","Thailand","Togo","Tunisia",
  "Turkey","Turkmenistan","Uganda","Ukraine","United Arab Emirates","United Kingdom",
  "United States","Uruguay","Uzbekistan","Venezuela","Vietnam","Yemen","Zambia","Zimbabwe",
];

const DAYS = ["MON","TUE","WED","THU","FRI","SAT","SUN"] as const;
type Day = (typeof DAYS)[number];
const HOURS = Array.from({ length: 16 }, (_, i) => `${String(i + 7).padStart(2, "0")}:00`);

interface TimeSlot { day: Day; startTime: string; endTime: string; }

function CountrySelect({
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  noMatches,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  searchPlaceholder: string;
  noMatches: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter((c) => c.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="relative" ref={boxRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full text-start rounded-xl border border-myna-charcoal/20 px-4 py-3 bg-white flex items-center justify-between"
      >
        <span className={value ? "text-myna-charcoal" : "text-myna-charcoal/40"}>
          {value || placeholder}
        </span>
        <span className="text-myna-charcoal/40">▾</span>
      </button>
      {open && (
        <div className="absolute z-20 mt-2 w-full bg-white rounded-xl border border-myna-charcoal/20 shadow-lg max-h-72 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-myna-charcoal/10">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-lg border border-myna-charcoal/20 px-3 py-2 text-sm"
            />
          </div>
          <div className="overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-sm text-myna-charcoal/60">{noMatches}</p>
            ) : (
              filtered.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => { onChange(c); setOpen(false); setQuery(""); }}
                  className={`w-full text-start px-4 py-2 text-sm hover:bg-myna-yellow/20 ${
                    c === value ? "bg-myna-yellow/30 font-medium" : ""
                  }`}
                >
                  {c}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function isValidPhone(code: string, number: string) {
  const digits = number.replace(/\D/g, "");
  if (code === "+213") return /^[5-7]\d{8}$/.test(digits);
  return digits.length >= 6 && digits.length <= 15;
}

export default function BecomeATeacherPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [step, setStep] = useState<StepKey>("about");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [languages, setLanguages] = useState<Language[]>([]);

  // About
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [countryOfBirth, setCountryOfBirth] = useState("");
  const [phoneCode, setPhoneCode] = useState("+213");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [confirmedOver18, setConfirmedOver18] = useState(false);
  const [subjectLanguageId, setSubjectLanguageId] = useState("");
  const [subjectServiceType, setSubjectServiceType] =
    useState<"CONVERSATION_PARTNER" | "PROFESSIONAL_TEACHER">("PROFESSIONAL_TEACHER");

  // Certification
  const [teacherLanguageId, setTeacherLanguageId] = useState<string | null>(null);
  const [certDescription, setCertDescription] = useState("");
  const [certIssuedBy, setCertIssuedBy] = useState("");
  const [certYearFrom, setCertYearFrom] = useState("");
  const [certYearTo, setCertYearTo] = useState("");
  const [certFile, setCertFile] = useState<File | null>(null);
  const [certSubmitted, setCertSubmitted] = useState(false);

  // Photo
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [photoCameraActive, setPhotoCameraActive] = useState(false);
  const photoVideoRef = useRef<HTMLVideoElement>(null);
  const photoCanvasRef = useRef<HTMLCanvasElement>(null);
  const photoStreamRef = useRef<MediaStream | null>(null);

  // ID
  const [idFile, setIdFile] = useState<File | null>(null);
  const [idPreviewUrl, setIdPreviewUrl] = useState<string | null>(null);
  const [idCameraActive, setIdCameraActive] = useState(false);
  const idVideoRef = useRef<HTMLVideoElement>(null);
  const idCanvasRef = useRef<HTMLCanvasElement>(null);
  const idStreamRef = useRef<MediaStream | null>(null);

  // Education
  const [eduUniversity, setEduUniversity] = useState("");
  const [eduDegree, setEduDegree] = useState("");
  const [eduDegreeType, setEduDegreeType] = useState("");
  const [eduSpecialization, setEduSpecialization] = useState("");
  const [eduYearFrom, setEduYearFrom] = useState("");
  const [eduYearTo, setEduYearTo] = useState("");
  const [eduDiplomaFile, setEduDiplomaFile] = useState<File | null>(null);
  const [eduSaved, setEduSaved] = useState(false);

  // Description
  const [description, setDescription] = useState("");
  const [descSaved, setDescSaved] = useState(false);

  // Availability
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [availSaved, setAvailSaved] = useState(false);

  // Pricing
  const [hourlyRate, setHourlyRate] = useState("");

  const [finished, setFinished] = useState(false);

  function authHeaders() {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    return { Authorization: `Bearer ${token}` };
  }

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }

    async function init() {
      try {
        await fetch(`${API_URL}/teachers/become`, { method: "POST", headers: authHeaders() });

        const [draft, langsRaw] = await Promise.all([
          fetch(`${API_URL}/teachers/draft`, { headers: authHeaders() }).then((r) => r.json()),
          fetch(`${API_URL}/languages`).then((r) => r.json()),
        ]);

        const langs: Language[] = Array.isArray(langsRaw)
          ? langsRaw
          : Array.isArray(langsRaw?.languages)
          ? langsRaw.languages
          : Array.isArray(langsRaw?.data)
          ? langsRaw.data
          : [];
        setLanguages(langs);

        if (draft.firstName) setFirstName(draft.firstName);
        if (draft.lastName) setLastName(draft.lastName);
        if (draft.countryOfBirth) setCountryOfBirth(draft.countryOfBirth);
        if (draft.phoneNumber) {
          const m = String(draft.phoneNumber).match(/^(\+\d+)\s*(.*)$/);
          if (m) { setPhoneCode(m[1]); setPhoneNumber(m[2]); }
          else setPhoneNumber(draft.phoneNumber);
        }
        if (draft.confirmedOver18) setConfirmedOver18(draft.confirmedOver18);
        if (draft.profilePhotoUrl) setPhotoPreviewUrl(draft.profilePhotoUrl);
        if (draft.idDocumentUrl) setIdPreviewUrl(draft.idDocumentUrl);
        if (draft.bio) { setDescription(draft.bio); setDescSaved(true); }
        if (Array.isArray(draft.availability)) {
          setSlots(draft.availability);
          setAvailSaved(draft.availability.length > 0);
        }
        if (draft.requestedHourlyRateDA) setHourlyRate(String(draft.requestedHourlyRateDA));
        if (draft.education?.length > 0) {
          const e = draft.education[0];
          setEduUniversity(e.university || "");
          setEduDegree(e.degree || "");
          setEduDegreeType(e.degreeType || "");
          setEduSpecialization(e.specialization || "");
          setEduYearFrom(e.yearFrom ? String(e.yearFrom) : "");
          setEduYearTo(e.yearTo ? String(e.yearTo) : "");
          setEduSaved(true);
        }
        if (draft.applicationStatus && draft.applicationStatus !== "DRAFT") setFinished(true);
        if (draft.teacherLanguages?.[0]) {
          setSubjectLanguageId(draft.teacherLanguages[0].languageId);
          setSubjectServiceType(draft.teacherLanguages[0].serviceType);
          setTeacherLanguageId(draft.teacherLanguages[0].id);
          if (draft.teacherLanguages[0].certificates?.length > 0) setCertSubmitted(true);
        }
      } catch {
        setError(t("wizard.errLoad"));
      } finally { setLoading(false); }
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    if (photoCameraActive && photoVideoRef.current && photoStreamRef.current)
      photoVideoRef.current.srcObject = photoStreamRef.current;
  }, [photoCameraActive]);

  useEffect(() => {
    if (idCameraActive && idVideoRef.current && idStreamRef.current)
      idVideoRef.current.srcObject = idStreamRef.current;
  }, [idCameraActive]);

  function goToStep(target: StepKey) { setError(""); setStep(target); }

  async function saveAboutStep() {
    if (!firstName || !lastName || !countryOfBirth || !subjectLanguageId)
      return setError(t("wizard.about.errRequired"));
    if (!confirmedOver18) return setError(t("wizard.about.errOver18"));
    if (phoneNumber && !isValidPhone(phoneCode, phoneNumber))
      return setError(phoneCode === "+213"
        ? t("wizard.about.errPhoneDz")
        : t("wizard.about.errPhoneGeneric"));

    setSaving(true); setError("");
    try {
      const fullPhone = phoneNumber ? `${phoneCode} ${phoneNumber.replace(/\D/g, "")}` : "";
      await fetch(`${API_URL}/teachers/draft/about`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ firstName, lastName, countryOfBirth, phoneNumber: fullPhone, confirmedOver18 }),
      });
      const langData = await fetch(`${API_URL}/teachers/draft/teaching-languages`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ languages: [{ languageId: subjectLanguageId, serviceType: subjectServiceType }] }),
      }).then((r) => r.json());
      if (langData.teacherLanguages?.[0]) setTeacherLanguageId(langData.teacherLanguages[0].id);
      goToStep("photo");
    } catch {
      setError(t("wizard.errGenericSave"));
    } finally { setSaving(false); }
  }

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) { setPhotoFile(f); setPhotoPreviewUrl(URL.createObjectURL(f)); }
  }
  async function startPhotoCamera() {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true });
      photoStreamRef.current = s;
      setPhotoCameraActive(true);
    } catch { setError(t("wizard.photo.errCamera")); }
  }
  function stopPhotoCamera() {
    photoStreamRef.current?.getTracks().forEach((t) => t.stop());
    photoStreamRef.current = null;
    setPhotoCameraActive(false);
  }
  function capturePhotoPic() {
    if (!photoVideoRef.current || !photoCanvasRef.current) return;
    const v = photoVideoRef.current, c = photoCanvasRef.current;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d")?.drawImage(v, 0, 0);
    c.toBlob((b) => {
      if (b) {
        setPhotoFile(new File([b], "profile-photo.jpg", { type: "image/jpeg" }));
        setPhotoPreviewUrl(URL.createObjectURL(b));
      }
    }, "image/jpeg");
    stopPhotoCamera();
  }
  async function savePhotoStep() {
    if (!photoFile && !photoPreviewUrl) return setError(t("wizard.photo.errNoPhoto"));
    setSaving(true); setError("");
    try {
      if (photoFile) {
        const fd = new FormData();
        fd.append("file", photoFile);
        const up = await fetch(`${API_URL}/teachers/upload/profile-photo`, {
          method: "POST", headers: authHeaders(), body: fd,
        }).then((r) => r.json());
        await fetch(`${API_URL}/teachers/draft/profile-photo`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify({ profilePhotoUrl: up.url }),
        });
      }
      goToStep("id");
    } catch { setError(t("wizard.photo.errSave")); }
    finally { setSaving(false); }
  }

  function handleIdSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) { setIdFile(f); setIdPreviewUrl(URL.createObjectURL(f)); }
  }
  async function startIdCamera() {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true });
      idStreamRef.current = s;
      setIdCameraActive(true);
    } catch { setError(t("wizard.id.errCamera")); }
  }
  function stopIdCamera() {
    idStreamRef.current?.getTracks().forEach((t) => t.stop());
    idStreamRef.current = null;
    setIdCameraActive(false);
  }
  function captureIdPic() {
    if (!idVideoRef.current || !idCanvasRef.current) return;
    const v = idVideoRef.current, c = idCanvasRef.current;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d")?.drawImage(v, 0, 0);
    c.toBlob((b) => {
      if (b) {
        setIdFile(new File([b], "id-photo.jpg", { type: "image/jpeg" }));
        setIdPreviewUrl(URL.createObjectURL(b));
      }
    }, "image/jpeg");
    stopIdCamera();
  }
  async function saveIdStep() {
    if (!idFile && !idPreviewUrl) return setError(t("wizard.id.errNoFile"));
    setSaving(true); setError("");
    try {
      if (idFile) {
        const fd = new FormData();
        fd.append("file", idFile);
        const up = await fetch(`${API_URL}/teachers/upload/id-document`, {
          method: "POST", headers: authHeaders(), body: fd,
        }).then((r) => r.json());
        await fetch(`${API_URL}/teachers/draft/id-document`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify({ idDocumentUrl: up.url }),
        });
      }
      goToStep("certification");
    } catch { setError(t("wizard.id.errSave")); }
    finally { setSaving(false); }
  }

  async function submitCertificate() {
    if (!teacherLanguageId) return setError(t("wizard.cert.errMissingLang"));
    if (!certIssuedBy || !certYearFrom || !certYearTo || !certFile)
      return setError(t("wizard.cert.errRequired"));
    if (Number(certYearTo) < Number(certYearFrom)) return setError(t("wizard.cert.errYearOrder"));
    setSaving(true); setError("");
    try {
      const fd = new FormData();
      fd.append("file", certFile);
      const up = await fetch(`${API_URL}/teachers/upload/certificate`, {
        method: "POST", headers: authHeaders(), body: fd,
      }).then((r) => r.json());
      await fetch(`${API_URL}/teachers/draft/certificate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          teacherLanguageId,
          description: certDescription,
          issuedBy: certIssuedBy,
          yearFrom: Number(certYearFrom),
          yearTo: Number(certYearTo),
          fileUrl: up.url,
        }),
      });
      setCertSubmitted(true);
      goToStep("education");
    } catch { setError(t("wizard.cert.errSave")); }
    finally { setSaving(false); }
  }

  async function saveEducationStep() {
    if (!eduUniversity || !eduDegree || !eduYearFrom || !eduYearTo)
      return setError(t("wizard.edu.errRequired"));
    if (Number(eduYearTo) < Number(eduYearFrom)) return setError(t("wizard.edu.errYearOrder"));
    setSaving(true); setError("");
    try {
      let diplomaUrl: string | undefined;
      if (eduDiplomaFile) {
        const fd = new FormData();
        fd.append("file", eduDiplomaFile);
        const up = await fetch(`${API_URL}/teachers/upload/diploma`, {
          method: "POST", headers: authHeaders(), body: fd,
        }).then((r) => r.json());
        diplomaUrl = up.url;
      }
      await fetch(`${API_URL}/teachers/draft/education`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          university: eduUniversity,
          degree: eduDegree,
          degreeType: eduDegreeType || undefined,
          specialization: eduSpecialization || undefined,
          yearFrom: Number(eduYearFrom),
          yearTo: Number(eduYearTo),
          diplomaUrl,
        }),
      });
      setEduSaved(true);
      goToStep("description");
    } catch { setError(t("wizard.edu.errSave")); }
    finally { setSaving(false); }
  }

  async function saveDescriptionStep() {
    if (description.trim().length < 20) return setError(t("wizard.desc.errShort"));
    setSaving(true); setError("");
    try {
      await api("/teachers/draft/description", {
        method: "PATCH", auth: true, body: { description: description.trim() },
      });
      setDescSaved(true);
      goToStep("availability");
    } catch (e: any) { setError(e.message || t("wizard.desc.errSave")); }
    finally { setSaving(false); }
  }

  function addSlot() { setSlots((s) => [...s, { day: "MON", startTime: "09:00", endTime: "10:00" }]); }
  function updateSlot(i: number, patch: Partial<TimeSlot>) {
    setSlots((s) => s.map((sl, idx) => (idx === i ? { ...sl, ...patch } : sl)));
  }
  function removeSlot(i: number) { setSlots((s) => s.filter((_, idx) => idx !== i)); }

  async function saveAvailabilityStep() {
    if (slots.length === 0) return setError(t("wizard.avail.errEmpty"));
    for (const s of slots) if (s.endTime <= s.startTime) return setError(t("wizard.avail.errOrder"));
    setSaving(true); setError("");
    try {
      await api("/teachers/draft/availability", { method: "PATCH", auth: true, body: { slots } });
      setAvailSaved(true);
      goToStep("pricing");
    } catch (e: any) { setError(e.message || t("wizard.avail.errSave")); }
    finally { setSaving(false); }
  }

  async function savePricingStep() {
    const rate = Number(hourlyRate);
    if (!rate || rate < 1) return setError(t("wizard.pricing.errRate"));
    setSaving(true); setError("");
    try {
      await api("/teachers/draft/pricing", {
        method: "PATCH", auth: true, body: { requestedHourlyRateDA: rate },
      });
      await finishApplication();
    } catch (e: any) {
      setError(e.message || t("wizard.pricing.errSave"));
      setSaving(false);
    }
  }

  async function finishApplication() {
    setSaving(true); setError("");
    try {
      const res = await fetch(`${API_URL}/teachers/draft/submit`, {
        method: "POST", headers: authHeaders(),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.message || t("wizard.errSubmit"));
        setSaving(false);
        return;
      }
      setFinished(true);
    } catch { setError(t("wizard.errSubmit")); setSaving(false); }
  }

  if (loading) {
    return <main className="min-h-screen flex items-center justify-center">{t("common.loading")}</main>;
  }

  if (finished) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md bg-myna-white rounded-3xl shadow-sm p-8 text-center">
          <h1 className="font-display text-3xl font-bold text-myna-charcoal">
            {t("wizard.submitted.title")}
          </h1>
          <p className="text-myna-charcoal/70 mt-4">{t("wizard.submitted.body")}</p>
          <a href="/" className="mt-6 inline-block px-8 py-3 rounded-full font-semibold bg-myna-orange text-white">
            {t("wizard.submitted.backHome")}
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-center gap-2 mb-8 flex-wrap">
          {STEP_KEYS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => goToStep(k)}
              className={`px-4 py-1 rounded-full text-sm font-medium transition ${
                k === step
                  ? "bg-myna-orange text-white"
                  : "bg-myna-charcoal/10 text-myna-charcoal/60 hover:bg-myna-charcoal/20"
              }`}
            >
              {t(`wizard.steps.${k}` as any)}
            </button>
          ))}
        </div>

        <div className="bg-myna-white rounded-3xl shadow-sm p-8">
          {/* ABOUT */}
          {step === "about" && (
            <>
              <h1 className="font-display text-3xl font-bold text-myna-charcoal">{t("wizard.about.title")}</h1>
              <p className="text-myna-charcoal/70 mt-2">{t("wizard.about.subtitle")}</p>

              <div className="mt-8 flex flex-col gap-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-myna-charcoal mb-1">{t("wizard.about.firstName")}</label>
                    <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full rounded-xl border border-myna-charcoal/20 px-4 py-3" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-myna-charcoal mb-1">{t("wizard.about.lastName")}</label>
                    <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full rounded-xl border border-myna-charcoal/20 px-4 py-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-myna-charcoal mb-1">{t("wizard.about.country")}</label>
                  <CountrySelect
                    value={countryOfBirth}
                    onChange={setCountryOfBirth}
                    placeholder={t("wizard.about.countryPlaceholder")}
                    searchPlaceholder={t("wizard.about.searchPlaceholder")}
                    noMatches={t("wizard.about.noMatches")}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-myna-charcoal mb-1">{t("wizard.about.subject")}</label>
                  <div className="flex gap-3">
                    <select value={subjectLanguageId} onChange={(e) => setSubjectLanguageId(e.target.value)} className="flex-1 rounded-xl border border-myna-charcoal/20 px-4 py-3">
                      <option value="">{t("wizard.about.selectLanguage")}</option>
                      {languages.map((l) => (<option key={l.id} value={l.id}>{l.name}</option>))}
                    </select>
                    <select value={subjectServiceType} onChange={(e) => setSubjectServiceType(e.target.value as any)} className="flex-1 rounded-xl border border-myna-charcoal/20 px-4 py-3">
                      <option value="PROFESSIONAL_TEACHER">{t("wizard.about.professional")}</option>
                      <option value="CONVERSATION_PARTNER">{t("wizard.about.conversation")}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-myna-charcoal mb-1">{t("wizard.about.phone")}</label>
                  <div className="flex gap-2">
                    <select value={phoneCode} onChange={(e) => setPhoneCode(e.target.value)} className="rounded-xl border border-myna-charcoal/20 px-3 py-3">
                      {COUNTRY_CODES.map((c) => (<option key={c.code} value={c.code}>{c.code} {c.label}</option>))}
                    </select>
                    <input
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder={phoneCode === "+213"
                        ? t("wizard.about.phonePlaceholder")
                        : t("wizard.about.phonePlaceholderGeneric")}
                      className="flex-1 rounded-xl border border-myna-charcoal/20 px-4 py-3"
                    />
                  </div>
                  {phoneNumber && !isValidPhone(phoneCode, phoneNumber) && (
                    <p className="text-xs text-red-600 mt-1">
                      {phoneCode === "+213"
                        ? t("wizard.about.errPhoneDzHint")
                        : t("wizard.about.errPhoneHint")}
                    </p>
                  )}
                </div>

                <label className="flex items-center gap-2 text-sm text-myna-charcoal">
                  <input type="checkbox" checked={confirmedOver18} onChange={(e) => setConfirmedOver18(e.target.checked)} />
                  {t("wizard.about.confirmOver18")}
                </label>

                {error && <p className="text-red-600 text-sm">{error}</p>}

                <button
                  onClick={saveAboutStep}
                  disabled={saving}
                  className="mt-2 w-full py-3 rounded-full font-semibold bg-myna-orange text-white hover:bg-myna-orange/90 transition disabled:opacity-50"
                >
                  {saving ? t("common.saving") : t("common.continue")}
                </button>
              </div>
            </>
          )}

          {/* PHOTO */}
          {step === "photo" && (
            <>
              <h1 className="font-display text-3xl font-bold text-myna-charcoal">{t("wizard.photo.title")}</h1>
              <p className="text-myna-charcoal/70 mt-2">{t("wizard.photo.subtitle")}</p>

              <div className="mt-6 bg-myna-yellow/15 border border-myna-yellow/40 rounded-2xl p-4 text-sm text-myna-charcoal/80">
                <p className="font-semibold text-myna-charcoal mb-2">{t("wizard.photo.rulesTitle")}</p>
                <ul className="list-disc ps-5 space-y-1">
                  <li>{t("wizard.photo.rule1")}</li>
                  <li>{t("wizard.photo.rule2")}</li>
                  <li>{t("wizard.photo.rule3")}</li>
                  <li>{t("wizard.photo.rule4")}</li>
                  <li>{t("wizard.photo.rule5")}</li>
                </ul>
              </div>

              <div className="mt-6 flex flex-col gap-4">
                {photoPreviewUrl ? (
                  <div className="flex flex-col items-center gap-3">
                    <img src={photoPreviewUrl} alt="" className="w-40 h-40 object-cover rounded-full border border-myna-charcoal/20" />
                    <button type="button" onClick={() => { setPhotoFile(null); setPhotoPreviewUrl(null); }} className="text-sm text-myna-orange font-medium">
                      {t("wizard.photo.remove")}
                    </button>
                  </div>
                ) : photoCameraActive ? (
                  <div className="flex flex-col items-center gap-3">
                    <video ref={photoVideoRef} autoPlay playsInline muted className="max-h-64 rounded-xl border border-myna-charcoal/20" />
                    <div className="flex gap-3">
                      <button type="button" onClick={capturePhotoPic} className="px-5 py-2 rounded-full font-medium bg-myna-orange text-white">{t("wizard.photo.capture")}</button>
                      <button type="button" onClick={stopPhotoCamera} className="px-5 py-2 rounded-full font-medium border border-myna-charcoal/20 text-myna-charcoal">{t("wizard.photo.cancel")}</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <label className="flex-1 text-center px-5 py-3 rounded-xl border-2 border-dashed border-myna-charcoal/20 cursor-pointer hover:bg-myna-yellow/10 transition">
                      {t("wizard.photo.upload")}
                      <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
                    </label>
                    <button type="button" onClick={startPhotoCamera} className="flex-1 px-5 py-3 rounded-xl border-2 border-dashed border-myna-charcoal/20 hover:bg-myna-yellow/10 transition">
                      {t("wizard.photo.take")}
                    </button>
                  </div>
                )}
                <canvas ref={photoCanvasRef} className="hidden" />

                {error && <p className="text-red-600 text-sm">{error}</p>}

                <div className="flex gap-3 mt-2">
                  <button onClick={() => goToStep("about")} className="px-5 py-3 rounded-full font-medium border border-myna-charcoal/20 text-myna-charcoal">
                    {t("common.back")}
                  </button>
                  <button
                    onClick={savePhotoStep}
                    disabled={saving}
                    className="flex-1 py-3 rounded-full font-semibold bg-myna-orange text-white hover:bg-myna-orange/90 transition disabled:opacity-50"
                  >
                    {saving ? t("common.saving") : t("common.continue")}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ID */}
          {step === "id" && (
            <>
              <h1 className="font-display text-3xl font-bold text-myna-charcoal">{t("wizard.id.title")}</h1>
              <p className="text-myna-charcoal/70 mt-2">{t("wizard.id.subtitle")}</p>

              <div className="mt-8 flex flex-col gap-4">
                {idPreviewUrl ? (
                  <div className="flex flex-col items-center gap-3">
                    <img src={idPreviewUrl} alt="" className="max-h-64 rounded-xl border border-myna-charcoal/20" />
                    <button type="button" onClick={() => { setIdFile(null); setIdPreviewUrl(null); }} className="text-sm text-myna-orange font-medium">
                      {t("wizard.photo.remove")}
                    </button>
                  </div>
                ) : idCameraActive ? (
                  <div className="flex flex-col items-center gap-3">
                    <video ref={idVideoRef} autoPlay playsInline muted className="max-h-64 rounded-xl border border-myna-charcoal/20" />
                    <div className="flex gap-3">
                      <button type="button" onClick={captureIdPic} className="px-5 py-2 rounded-full font-medium bg-myna-orange text-white">{t("wizard.photo.capture")}</button>
                      <button type="button" onClick={stopIdCamera} className="px-5 py-2 rounded-full font-medium border border-myna-charcoal/20 text-myna-charcoal">{t("wizard.photo.cancel")}</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <label className="flex-1 text-center px-5 py-3 rounded-xl border-2 border-dashed border-myna-charcoal/20 cursor-pointer hover:bg-myna-yellow/10 transition">
                      {t("wizard.photo.upload")}
                      <input type="file" accept="image/*" onChange={handleIdSelect} className="hidden" />
                    </label>
                    <button type="button" onClick={startIdCamera} className="flex-1 px-5 py-3 rounded-xl border-2 border-dashed border-myna-charcoal/20 hover:bg-myna-yellow/10 transition">
                      {t("wizard.photo.take")}
                    </button>
                  </div>
                )}
                <canvas ref={idCanvasRef} className="hidden" />

                {error && <p className="text-red-600 text-sm">{error}</p>}

                <div className="flex gap-3 mt-2">
                  <button onClick={() => goToStep("photo")} className="px-5 py-3 rounded-full font-medium border border-myna-charcoal/20 text-myna-charcoal">
                    {t("common.back")}
                  </button>
                  <button
                    onClick={saveIdStep}
                    disabled={saving}
                    className="flex-1 py-3 rounded-full font-semibold bg-myna-orange text-white hover:bg-myna-orange/90 transition disabled:opacity-50"
                  >
                    {saving ? t("common.saving") : t("common.continue")}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* CERTIFICATION */}
          {step === "certification" && (
            <>
              <h1 className="font-display text-3xl font-bold text-myna-charcoal">{t("wizard.cert.title")}</h1>
              <p className="text-myna-charcoal/70 mt-2">{t("wizard.cert.subtitle")}</p>

              {certSubmitted ? (
                <div className="mt-8 flex flex-col gap-4">
                  <p className="text-green-700 bg-green-50 rounded-xl p-4 text-sm">
                    {t("wizard.cert.submitted")}
                  </p>
                  {error && <p className="text-red-600 text-sm">{error}</p>}
                  <div className="flex gap-3">
                    <button onClick={() => goToStep("id")} className="px-5 py-3 rounded-full font-medium border border-myna-charcoal/20 text-myna-charcoal">
                      {t("common.back")}
                    </button>
                    <button onClick={() => goToStep("education")} className="flex-1 py-3 rounded-full font-semibold bg-myna-orange text-white">
                      {t("common.continue")}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-8 flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-medium text-myna-charcoal mb-1">{t("wizard.cert.description")}</label>
                    <input value={certDescription} onChange={(e) => setCertDescription(e.target.value)} className="w-full rounded-xl border border-myna-charcoal/20 px-4 py-3" placeholder={t("wizard.cert.descriptionPlaceholder")} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-myna-charcoal mb-1">{t("wizard.cert.issuedBy")}</label>
                    <input value={certIssuedBy} onChange={(e) => setCertIssuedBy(e.target.value)} className="w-full rounded-xl border border-myna-charcoal/20 px-4 py-3" placeholder={t("wizard.cert.issuedByPlaceholder")} />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-myna-charcoal mb-1">{t("wizard.cert.yearFrom")}</label>
                      <select value={certYearFrom} onChange={(e) => setCertYearFrom(e.target.value)} className="w-full rounded-xl border border-myna-charcoal/20 px-4 py-3">
                        <option value="">{t("common.select")}</option>
                        {Array.from({ length: 60 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-myna-charcoal mb-1">{t("wizard.cert.yearTo")}</label>
                      <select value={certYearTo} onChange={(e) => setCertYearTo(e.target.value)} className="w-full rounded-xl border border-myna-charcoal/20 px-4 py-3">
                        <option value="">{t("common.select")}</option>
                        {Array.from({ length: 60 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <label className="text-center px-4 py-3 rounded-xl border-2 border-dashed border-myna-charcoal/20 cursor-pointer hover:bg-myna-yellow/10 transition text-sm">
                    {certFile ? certFile.name : t("wizard.cert.upload")}
                    <input type="file" accept="image/jpeg,image/png" onChange={(e) => setCertFile(e.target.files?.[0] || null)} className="hidden" />
                  </label>

                  {error && <p className="text-red-600 text-sm">{error}</p>}

                  <div className="flex gap-3 mt-2">
                    <button onClick={() => goToStep("id")} className="px-5 py-3 rounded-full font-medium border border-myna-charcoal/20 text-myna-charcoal">
                      {t("common.back")}
                    </button>
                    <button
                      onClick={submitCertificate}
                      disabled={saving}
                      className="flex-1 py-3 rounded-full font-semibold bg-myna-orange text-white hover:bg-myna-orange/90 transition disabled:opacity-50"
                    >
                      {saving ? t("common.saving") : t("wizard.cert.submit")}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* EDUCATION */}
          {step === "education" && (
            <>
              <h1 className="font-display text-3xl font-bold text-myna-charcoal">{t("wizard.edu.title")}</h1>
              <p className="text-myna-charcoal/70 mt-2">{t("wizard.edu.subtitle")}</p>

              <div className="mt-8 flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-myna-charcoal mb-1">{t("wizard.edu.university")}</label>
                  <input value={eduUniversity} onChange={(e) => setEduUniversity(e.target.value)} className="w-full rounded-xl border border-myna-charcoal/20 px-4 py-3" placeholder={t("wizard.edu.universityPlaceholder")} />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-myna-charcoal mb-1">{t("wizard.edu.degree")}</label>
                    <input value={eduDegree} onChange={(e) => setEduDegree(e.target.value)} className="w-full rounded-xl border border-myna-charcoal/20 px-4 py-3" placeholder={t("wizard.edu.degreePlaceholder")} />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-myna-charcoal mb-1">{t("wizard.edu.degreeType")}</label>
                    <input value={eduDegreeType} onChange={(e) => setEduDegreeType(e.target.value)} className="w-full rounded-xl border border-myna-charcoal/20 px-4 py-3" placeholder={t("wizard.edu.degreeTypePlaceholder")} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-myna-charcoal mb-1">{t("wizard.edu.specialization")}</label>
                  <input value={eduSpecialization} onChange={(e) => setEduSpecialization(e.target.value)} className="w-full rounded-xl border border-myna-charcoal/20 px-4 py-3" placeholder={t("wizard.edu.specializationPlaceholder")} />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-myna-charcoal mb-1">{t("wizard.edu.yearFrom")}</label>
                    <select value={eduYearFrom} onChange={(e) => setEduYearFrom(e.target.value)} className="w-full rounded-xl border border-myna-charcoal/20 px-4 py-3">
                      <option value="">{t("common.select")}</option>
                      {Array.from({ length: 60 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-myna-charcoal mb-1">{t("wizard.edu.yearTo")}</label>
                    <select value={eduYearTo} onChange={(e) => setEduYearTo(e.target.value)} className="w-full rounded-xl border border-myna-charcoal/20 px-4 py-3">
                      <option value="">{t("common.select")}</option>
                      {Array.from({ length: 60 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <label className="text-center px-4 py-3 rounded-xl border-2 border-dashed border-myna-charcoal/20 cursor-pointer hover:bg-myna-yellow/10 transition text-sm">
                  {eduDiplomaFile ? eduDiplomaFile.name : t("wizard.edu.uploadDiploma")}
                  <input type="file" accept="image/jpeg,image/png" onChange={(e) => setEduDiplomaFile(e.target.files?.[0] || null)} className="hidden" />
                </label>

                {error && <p className="text-red-600 text-sm">{error}</p>}

                <div className="flex gap-3 mt-2">
                  <button onClick={() => goToStep("certification")} className="px-5 py-3 rounded-full font-medium border border-myna-charcoal/20 text-myna-charcoal">
                    {t("common.back")}
                  </button>
                  <button
                    onClick={saveEducationStep}
                    disabled={saving}
                    className="flex-1 py-3 rounded-full font-semibold bg-myna-orange text-white hover:bg-myna-orange/90 transition disabled:opacity-50"
                  >
                    {saving
                      ? t("common.saving")
                      : eduSaved
                      ? t("common.updateAndContinue")
                      : t("common.continue")}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* DESCRIPTION */}
          {step === "description" && (
            <>
              <h1 className="font-display text-3xl font-bold text-myna-charcoal">{t("wizard.desc.title")}</h1>
              <p className="text-myna-charcoal/70 mt-2">{t("wizard.desc.subtitle")}</p>

              <div className="mt-8 flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-myna-charcoal mb-1">
                    {t("wizard.desc.label", { count: description.length })}
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={7}
                    className="w-full rounded-xl border border-myna-charcoal/20 px-4 py-3"
                    placeholder={t("wizard.desc.placeholder")}
                  />
                </div>

                {error && <p className="text-red-600 text-sm">{error}</p>}

                <div className="flex gap-3 mt-2">
                  <button onClick={() => goToStep("education")} className="px-5 py-3 rounded-full font-medium border border-myna-charcoal/20 text-myna-charcoal">
                    {t("common.back")}
                  </button>
                  <button
                    onClick={saveDescriptionStep}
                    disabled={saving}
                    className="flex-1 py-3 rounded-full font-semibold bg-myna-orange text-white hover:bg-myna-orange/90 transition disabled:opacity-50"
                  >
                    {saving
                      ? t("common.saving")
                      : descSaved
                      ? t("common.updateAndContinue")
                      : t("common.continue")}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* AVAILABILITY */}
          {step === "availability" && (
            <>
              <h1 className="font-display text-3xl font-bold text-myna-charcoal">{t("wizard.avail.title")}</h1>
              <p className="text-myna-charcoal/70 mt-2">{t("wizard.avail.subtitle")}</p>

              <div className="mt-8 flex flex-col gap-3">
                {slots.length === 0 && (
                  <p className="text-sm text-myna-charcoal/60">{t("wizard.avail.empty")}</p>
                )}

                {slots.map((slot, i) => (
                  <div key={i} className="flex flex-wrap gap-2 items-center bg-myna-charcoal/5 rounded-xl p-3">
                    <select
                      value={slot.day}
                      onChange={(e) => updateSlot(i, { day: e.target.value as Day })}
                      className="rounded-lg border border-myna-charcoal/20 px-3 py-2"
                    >
                      {DAYS.map((d) => (<option key={d} value={d}>{d}</option>))}
                    </select>
                    <select
                      value={slot.startTime}
                      onChange={(e) => updateSlot(i, { startTime: e.target.value })}
                      className="rounded-lg border border-myna-charcoal/20 px-3 py-2"
                    >
                      {HOURS.map((h) => (<option key={h} value={h}>{h}</option>))}
                    </select>
                    <span className="text-myna-charcoal/50">→</span>
                    <select
                      value={slot.endTime}
                      onChange={(e) => updateSlot(i, { endTime: e.target.value })}
                      className="rounded-lg border border-myna-charcoal/20 px-3 py-2"
                    >
                      {HOURS.map((h) => (<option key={h} value={h}>{h}</option>))}
                    </select>
                    <button
                      type="button"
                      onClick={() => removeSlot(i)}
                      className="ms-auto text-sm text-red-600 font-medium px-2"
                    >
                      {t("common.remove")}
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addSlot}
                  className="self-start px-5 py-2 rounded-full font-medium border border-myna-charcoal/20 text-myna-charcoal hover:bg-myna-yellow/10"
                >
                  {t("wizard.avail.addSlot")}
                </button>

                {error && <p className="text-red-600 text-sm">{error}</p>}

                <div className="flex gap-3 mt-2">
                  <button onClick={() => goToStep("description")} className="px-5 py-3 rounded-full font-medium border border-myna-charcoal/20 text-myna-charcoal">
                    {t("common.back")}
                  </button>
                  <button
                    onClick={saveAvailabilityStep}
                    disabled={saving}
                    className="flex-1 py-3 rounded-full font-semibold bg-myna-orange text-white hover:bg-myna-orange/90 transition disabled:opacity-50"
                  >
                    {saving
                      ? t("common.saving")
                      : availSaved
                      ? t("common.updateAndContinue")
                      : t("common.continue")}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* PRICING */}
          {step === "pricing" && (
            <>
              <h1 className="font-display text-3xl font-bold text-myna-charcoal">{t("wizard.pricing.title")}</h1>
              <p className="text-myna-charcoal/70 mt-2">{t("wizard.pricing.subtitle")}</p>

              <div className="mt-8 flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-myna-charcoal mb-1">{t("wizard.pricing.rate")}</label>
                  <input
                    type="number"
                    min={1}
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    className="w-full rounded-xl border border-myna-charcoal/20 px-4 py-3"
                    placeholder={t("wizard.pricing.ratePlaceholder")}
                  />
                </div>

                {error && <p className="text-red-600 text-sm">{error}</p>}

                <div className="flex gap-3 mt-2">
                  <button onClick={() => goToStep("availability")} className="px-5 py-3 rounded-full font-medium border border-myna-charcoal/20 text-myna-charcoal">
                    {t("common.back")}
                  </button>
                  <button
                    onClick={savePricingStep}
                    disabled={saving}
                    className="flex-1 py-3 rounded-full font-semibold bg-myna-orange text-white hover:bg-myna-orange/90 transition disabled:opacity-50"
                  >
                    {saving ? t("common.submitting") : t("wizard.pricing.finish")}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}