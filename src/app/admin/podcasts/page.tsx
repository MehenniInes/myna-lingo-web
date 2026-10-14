"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getUser } from "@/lib/api";
import { useLanguage } from "@/app/language-provider";

type Podcast = {
  id: string; title: string; description: string; priceDA: number;
  durationSec: number; xpReward: number; level: string; category: string;
  isActive: boolean; language: { name: string };
};

type Language = { id: string; name: string; code: string };

const emptyNewForm = {
  title: "",
  description: "",
  priceDA: 0,
  durationSec: 0,
  xpReward: 0,
  level: "A1",
  category: "GENERAL",
  languageId: "",
  coverUrl: "",
  audioUrl: "",
  videoUrl: "",
};

// 🆕 Upload helper with progress (using XMLHttpRequest)
async function uploadFileWithProgress(
  file: File,
  type: "video" | "audio" | "cover",
  onProgress: (percent: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("file", file);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const token = localStorage.getItem("accessToken");

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve(data.url);
        } catch {
          reject(new Error("Invalid server response"));
        }
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          reject(new Error(err.message || `Upload failed (${xhr.status})`));
        } catch {
          reject(new Error(`Upload failed (${xhr.status})`));
        }
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Network error")));
    xhr.addEventListener("abort", () => reject(new Error("Upload cancelled")));

    xhr.open("POST", `${API_URL}/admin/upload?type=${type}`);
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.send(formData);
  });
}

export default function AdminPodcastsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ priceDA: 0, xpReward: 0, title: "" });

  // Add New states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newForm, setNewForm] = useState(emptyNewForm);
  const [creating, setCreating] = useState(false);

  // 🆕 Upload states
  const [uploading, setUploading] = useState({
    video: false,
    audio: false,
    cover: false,
  });
  const [uploadProgress, setUploadProgress] = useState({
    video: 0,
    audio: 0,
    cover: 0,
  });

  useEffect(() => {
    const user = getUser();
    if (!user) return router.push("/login");
    if (user.role !== "ADMIN") return router.push("/");
    load();
    loadLanguages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    try {
      const data = await api<Podcast[]>("/admin/podcasts", { auth: true });
      setPodcasts(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadLanguages() {
    try {
      const data = await api<Language[]>("/languages", { auth: true });
      setLanguages(data);
    } catch {
      /* silent */
    }
  }

  async function save(id: string) {
    try {
      await api(`/admin/podcasts/${id}`, { method: "PATCH", auth: true, body: form });
      setMsg(t("aPod.updated"));
      setEditing(null);
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function toggle(id: string, isActive: boolean) {
    try {
      if (isActive) await api(`/admin/podcasts/${id}`, { method: "DELETE", auth: true });
      else await api(`/admin/podcasts/${id}`, { method: "PATCH", auth: true, body: { isActive: true } });
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  // 🆕 Handle file upload
  async function handleFileUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    type: "video" | "audio" | "cover"
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setMsg("");
    setUploading((prev) => ({ ...prev, [type]: true }));
    setUploadProgress((prev) => ({ ...prev, [type]: 0 }));

    try {
      const url = await uploadFileWithProgress(file, type, (p) => {
        setUploadProgress((prev) => ({ ...prev, [type]: p }));
      });
      const field = type === "video" ? "videoUrl" : type === "audio" ? "audioUrl" : "coverUrl";
      setNewForm((prev) => ({ ...prev, [field]: url }));
    } catch (err: any) {
      setError(`Upload ${type} failed: ${err.message}`);
    } finally {
      setUploading((prev) => ({ ...prev, [type]: false }));
    }
  }

  async function createPodcast(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMsg("");

    if (!newForm.title || !newForm.languageId) {
      setError("Title and Language are required");
      return;
    }
    // خاص على الأقل فيديو ولا صوت
    if (!newForm.videoUrl && !newForm.audioUrl) {
      setError("Please upload a video or audio file");
      return;
    }

    setCreating(true);
    try {
      await api("/admin/podcasts", {
        method: "POST",
        auth: true,
        body: {
          title: newForm.title,
          description: newForm.description,
          priceDA: Number(newForm.priceDA),
          durationSec: Number(newForm.durationSec),
          xpReward: Number(newForm.xpReward),
          level: newForm.level,
          category: newForm.category,
          languageId: newForm.languageId,
          coverUrl: newForm.coverUrl || "",
          audioUrl: newForm.audioUrl || "",
          videoUrl: newForm.videoUrl || null,
        },
      });
      setMsg("Podcast created successfully");
      setNewForm(emptyNewForm);
      setUploadProgress({ video: 0, audio: 0, cover: 0 });
      setShowAddForm(false);
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  if (loading)
    return (
      <main className="min-h-screen flex items-center justify-center">
        {t("common.loading")}
      </main>
    );

  return (
    <main className="min-h-screen bg-cream px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <a href="/admin" className="text-myna-orange font-semibold text-sm">
          {t("admin.backToAdmin")}
        </a>

        <div className="flex justify-between items-center mt-4 gap-4 flex-wrap">
          <h1 className="font-display text-4xl font-bold text-myna-charcoal">
            {t("aPod.title")}
          </h1>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-6 py-3 rounded-full bg-myna-orange text-white font-semibold text-sm hover:bg-myna-orange/90 transition"
          >
            {showAddForm ? "Cancel" : "+ Add New Podcast"}
          </button>
        </div>

        {msg && <p className="mt-4 text-green-700">{msg}</p>}
        {error && <p className="mt-4 text-red-600">{error}</p>}

        {showAddForm && (
          <div className="mt-8 bg-white rounded-3xl shadow-sm p-8">
            <h2 className="font-display text-2xl font-bold mb-6">New Podcast</h2>
            <form onSubmit={createPodcast} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-bold text-myna-charcoal mb-1">
                  📝 العنوان (Title) *
                </label>
                <input
                  required
                  placeholder="مثال: First Podcast"
                  value={newForm.title}
                  onChange={(e) => setNewForm({ ...newForm, title: e.target.value })}
                  className="w-full rounded-xl border px-4 py-2"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-myna-charcoal mb-1">
                  📄 الوصف (Description)
                </label>
                <textarea
                  placeholder="Test podcast for learning"
                  value={newForm.description}
                  onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
                  className="w-full rounded-xl border px-4 py-2"
                  rows={2}
                />
              </div>

              {/* Language + Level */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-bold text-myna-charcoal mb-1">
                    🌍 اللغة (Language) *
                  </label>
                  <select
                    required
                    value={newForm.languageId}
                    onChange={(e) => setNewForm({ ...newForm, languageId: e.target.value })}
                    className="w-full rounded-xl border px-4 py-2"
                  >
                    <option value="">-- Select Language --</option>
                    {languages.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-myna-charcoal mb-1">
                    📈 المستوى (Level)
                  </label>
                  <select
                    value={newForm.level}
                    onChange={(e) => setNewForm({ ...newForm, level: e.target.value })}
                    className="w-full rounded-xl border px-4 py-2"
                  >
                    <option value="A1">A1 - Beginner</option>
                    <option value="A2">A2 - Elementary</option>
                    <option value="B1">B1 - Intermediate</option>
                    <option value="B2">B2 - Upper Intermediate</option>
                    <option value="C1">C1 - Advanced</option>
                    <option value="C2">C2 - Mastery</option>
                  </select>
                </div>
              </div>

              {/* Category + Duration */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-bold text-myna-charcoal mb-1">
                    🏷️ الفئة (Category)
                  </label>
                  <input
                    placeholder="GENERAL"
                    value={newForm.category}
                    onChange={(e) => setNewForm({ ...newForm, category: e.target.value })}
                    className="w-full rounded-xl border px-4 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-myna-charcoal mb-1">
                    ⏱️ المدة بالثواني (Duration)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="300"
                    value={newForm.durationSec}
                    onChange={(e) => setNewForm({ ...newForm, durationSec: +e.target.value })}
                    className="w-full rounded-xl border px-4 py-2"
                  />
                </div>
              </div>

              {/* Price + XP */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-bold text-myna-charcoal mb-1">
                    💰 السعر (Price in DA)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="100"
                    value={newForm.priceDA}
                    onChange={(e) => setNewForm({ ...newForm, priceDA: +e.target.value })}
                    className="w-full rounded-xl border px-4 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-myna-charcoal mb-1">
                    ⭐ نقاط الخبرة (XP Reward)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="50"
                    value={newForm.xpReward}
                    onChange={(e) => setNewForm({ ...newForm, xpReward: +e.target.value })}
                    className="w-full rounded-xl border px-4 py-2"
                  />
                </div>
              </div>

              {/* 🎥 VIDEO UPLOAD */}
              <div className="border-2 border-dashed border-myna-orange/30 rounded-xl p-4">
                <label className="block text-sm font-bold text-myna-charcoal mb-2">
                  🎥 فيديو الدرس (MP4/WebM، أقصى 1 GB)
                </label>
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  onChange={(e) => handleFileUpload(e, "video")}
                  disabled={uploading.video}
                  className="block w-full text-sm"
                />
                {uploading.video && (
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-myna-orange h-3 rounded-full transition-all"
                        style={{ width: `${uploadProgress.video}%` }}
                      />
                    </div>
                    <p className="text-xs mt-1 text-myna-charcoal/60">
                      📤 جاري الرفع... {uploadProgress.video}%
                    </p>
                  </div>
                )}
                {newForm.videoUrl && !uploading.video && (
                  <p className="text-xs mt-2 text-green-700">
                    ✅ تم رفع الفيديو: {newForm.videoUrl}
                  </p>
                )}
              </div>

              {/* 🎵 AUDIO UPLOAD */}
              <div className="border-2 border-dashed border-myna-orange/30 rounded-xl p-4">
                <label className="block text-sm font-bold text-myna-charcoal mb-2">
                  🎵 ملف صوتي (اختياري)
                </label>
                <input
                  type="file"
                  accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg"
                  onChange={(e) => handleFileUpload(e, "audio")}
                  disabled={uploading.audio}
                  className="block w-full text-sm"
                />
                {uploading.audio && (
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-myna-orange h-3 rounded-full transition-all"
                        style={{ width: `${uploadProgress.audio}%` }}
                      />
                    </div>
                    <p className="text-xs mt-1 text-myna-charcoal/60">
                      📤 جاري الرفع... {uploadProgress.audio}%
                    </p>
                  </div>
                )}
                {newForm.audioUrl && !uploading.audio && (
                  <p className="text-xs mt-2 text-green-700">✅ تم رفع الصوت</p>
                )}
              </div>

              {/* 🖼️ COVER UPLOAD */}
              <div className="border-2 border-dashed border-myna-orange/30 rounded-xl p-4">
                <label className="block text-sm font-bold text-myna-charcoal mb-2">
                  🖼️ صورة الغلاف
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => handleFileUpload(e, "cover")}
                  disabled={uploading.cover}
                  className="block w-full text-sm"
                />
                {uploading.cover && (
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-myna-orange h-3 rounded-full transition-all"
                        style={{ width: `${uploadProgress.cover}%` }}
                      />
                    </div>
                    <p className="text-xs mt-1 text-myna-charcoal/60">
                      📤 جاري الرفع... {uploadProgress.cover}%
                    </p>
                  </div>
                )}
                {newForm.coverUrl && !uploading.cover && (
                  <p className="text-xs mt-2 text-green-700">✅ تم رفع الصورة</p>
                )}
              </div>

              <button
                type="submit"
                disabled={creating || uploading.video || uploading.audio || uploading.cover}
                className="w-full rounded-full bg-myna-orange text-white py-3 font-semibold disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create Podcast"}
              </button>
            </form>
          </div>
        )}

        <div className="mt-8 space-y-4">
          {podcasts.map((p) => (
            <div
              key={p.id}
              className={`bg-white rounded-3xl shadow-sm p-6 ${!p.isActive ? "opacity-60" : ""}`}
            >
              {editing === p.id ? (
                <div className="grid gap-3 md:grid-cols-3">
                  <input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="rounded-xl border px-4 py-2 md:col-span-3"
                    placeholder={t("aPod.titlePh")}
                  />
                  <input
                    type="number"
                    value={form.priceDA}
                    onChange={(e) => setForm({ ...form, priceDA: +e.target.value })}
                    className="rounded-xl border px-4 py-2"
                    placeholder={t("aPod.pricePh")}
                  />
                  <input
                    type="number"
                    value={form.xpReward}
                    onChange={(e) => setForm({ ...form, xpReward: +e.target.value })}
                    className="rounded-xl border px-4 py-2"
                    placeholder={t("aPod.xpPh")}
                  />
                  <button
                    onClick={() => save(p.id)}
                    className="rounded-full bg-myna-orange text-white py-2 font-semibold md:col-span-3"
                  >
                    {t("aPod.save")}
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-display text-xl font-bold">{p.title}</p>
                    <p className="text-sm text-myna-charcoal/60 mt-1">
                      {t("aPod.meta", {
                        lang: p.language?.name ?? "",
                        level: p.level,
                        price: p.priceDA,
                        xp: p.xpReward,
                      })}
                      {!p.isActive && t("aPod.inactive")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditing(p.id);
                        setForm({ priceDA: p.priceDA, xpReward: p.xpReward, title: p.title });
                      }}
                      className="px-4 py-2 rounded-full border font-semibold text-sm"
                    >
                      {t("aPod.edit")}
                    </button>
                    <button
                      onClick={() => toggle(p.id, p.isActive)}
                      className="px-4 py-2 rounded-full border font-semibold text-sm"
                    >
                      {p.isActive ? t("aPod.disable") : t("aPod.enable")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}