"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, Loader2, Save, X, AlertCircle, Lock, Eye,
} from "lucide-react";
import { api, getUser } from "@/lib/api";

interface TeacherRate {
  id: string;
  firstName: string | null;
  lastName: string | null;
  profilePhotoUrl: string | null;
  requestedHourlyRateDA: number | null;
  internalHourlyRateDA: number | null;
  user: { email: string; fullName: string };
  _count: { calls: number };
}

export default function AdminTeacherRatesPage() {
  const router = useRouter();
  const [teachers, setTeachers] = useState<TeacherRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const [editing, setEditing] = useState<string | null>(null);
  const [rateInput, setRateInput] = useState<string>("");
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    const u = getUser();
    if (!u) { router.push("/login"); return; }
    if (u.role !== "ADMIN") { router.push("/"); return; }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await api<TeacherRate[]>("/admin/teacher-rates", { auth: true });
      setTeachers(data);
    } catch (err: any) {
      setError(err.message || "Could not load teacher rates");
    } finally {
      setLoading(false);
    }
  }

  function beginEdit(t: TeacherRate) {
    setEditing(t.id);
    setRateInput(t.internalHourlyRateDA != null ? String(t.internalHourlyRateDA) : "");
    setMsg("");
  }

  function cancelEdit() {
    setEditing(null);
    setRateInput("");
  }

  async function save(id: string) {
    const trimmed = rateInput.trim();
    const value = trimmed === "" ? null : Number(trimmed);

    if (value !== null && (!Number.isFinite(value) || value < 0)) {
      setError("Rate must be a positive number, or leave blank to clear");
      return;
    }

    setActing(id);
    setError("");
    try {
      await api(`/admin/teacher-rates/${id}`, {
        method: "PATCH",
        auth: true,
        body: { internalHourlyRateDA: value },
      });
      setMsg("✅ Rate saved");
      setEditing(null);
      await load();
    } catch (err: any) {
      setError(err.message || "Update failed");
    } finally {
      setActing(null);
    }
  }

  return (
    <main className="min-h-screen bg-cream">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 text-myna-orange font-semibold text-sm hover:underline"
        >
          <ChevronLeft size={14} /> Back to admin
        </Link>

        <div className="mt-4">
          <h1 className="font-display text-4xl font-bold text-myna-charcoal">
            Teacher internal rates
          </h1>
          <p className="text-myna-charcoal/60 mt-2 flex items-center gap-2">
            <Lock size={13} />
            Private — never shown to students. Used for payout calculations.
          </p>
        </div>

        {msg && (
          <div className="mt-6 p-3 bg-green-50 border border-green-200 rounded-2xl text-green-800 text-sm">
            {msg}
          </div>
        )}
        {error && (
          <div className="mt-6 p-3 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm flex items-start gap-2">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="mt-8 flex justify-center text-myna-charcoal/60">
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : teachers.length === 0 ? (
          <div className="mt-8 bg-white rounded-3xl shadow-sm p-12 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-myna-yellow/30 text-myna-orange flex items-center justify-center">
              <Lock size={24} />
            </div>
            <p className="font-display text-xl font-bold text-myna-charcoal mt-4">
              No approved teachers yet
            </p>
            <p className="text-myna-charcoal/60 text-sm mt-2">
              Approve teachers first, then set their internal rates here.
            </p>
          </div>
        ) : (
          <div className="mt-8 bg-white rounded-3xl shadow-sm overflow-hidden">
            {teachers.map((t, idx) => {
              const displayName =
                [t.firstName, t.lastName].filter(Boolean).join(" ") || t.user.fullName;
              const isEditing = editing === t.id;
              const isActing = acting === t.id;

              return (
                <div
                  key={t.id}
                  className={`p-5 ${idx !== teachers.length - 1 ? "border-b border-cream" : ""}`}
                >
                  {isEditing ? (
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-full bg-myna-orange text-white flex items-center justify-center font-bold shrink-0 overflow-hidden">
                          {t.profilePhotoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={t.profilePhotoUrl} alt={displayName} className="w-full h-full object-cover" />
                          ) : (
                            displayName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-myna-charcoal truncate">{displayName}</p>
                          <p className="text-xs text-myna-charcoal/60 truncate">{t.user.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          type="number"
                          min={0}
                          value={rateInput}
                          onChange={(e) => setRateInput(e.target.value)}
                          placeholder="Rate DA/hr"
                          className="w-32 rounded-xl border border-myna-charcoal/15 bg-cream px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-myna-orange"
                        />
                        <button
                          onClick={() => save(t.id)}
                          disabled={isActing}
                          className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-myna-orange text-white font-semibold text-xs disabled:opacity-50"
                        >
                          {isActing ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          disabled={isActing}
                          className="inline-flex items-center gap-1 px-3 py-2 rounded-full border border-myna-charcoal/15 font-semibold text-xs"
                        >
                          <X size={12} />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-full bg-myna-orange text-white flex items-center justify-center font-bold shrink-0 overflow-hidden">
                          {t.profilePhotoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={t.profilePhotoUrl} alt={displayName} className="w-full h-full object-cover" />
                          ) : (
                            displayName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-myna-charcoal truncate">{displayName}</p>
                          <p className="text-xs text-myna-charcoal/60 truncate">{t.user.email}</p>
                          <p className="text-xs text-myna-charcoal/40 mt-0.5">
                            {t._count.calls} call{t._count.calls !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 shrink-0">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-myna-charcoal/40 text-end">
                            Requested
                          </p>
                          <p className="font-semibold text-sm text-myna-charcoal/70 mt-0.5">
                            {t.requestedHourlyRateDA != null ? `${t.requestedHourlyRateDA} DA` : "—"}
                          </p>
                        </div>
                        <div className="text-end">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-myna-orange flex items-center gap-1 justify-end">
                            <Lock size={9} /> Internal
                          </p>
                          <p className="font-display text-xl font-bold text-myna-orange mt-0.5">
                            {t.internalHourlyRateDA != null ? `${t.internalHourlyRateDA} DA` : "Not set"}
                          </p>
                        </div>
                        <button
                          onClick={() => beginEdit(t)}
                          className="px-4 py-2 rounded-full border border-myna-charcoal/15 font-semibold text-xs hover:bg-myna-charcoal/5"
                        >
                          {t.internalHourlyRateDA != null ? "Change" : "Set rate"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}