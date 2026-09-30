"use client";

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
}