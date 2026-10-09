"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search, Loader2, ChevronLeft, UserX, UserCheck, Mail, Globe2, ExternalLink,
} from "lucide-react";
import { api, getUser } from "@/lib/api";

interface AdminTeacher {
  id: string;
  firstName: string | null;
  lastName: string | null;
  countryOfBirth: string | null;
  profilePhotoUrl: string | null;
  isOnline: boolean;
  experienceYears: number | null;
  applicationStatus: string;
  requestedHourlyRateDA: number | null;
  createdAt: string;
  user: { email: string; fullName: string; isActive: boolean };
  _count: { teacherLanguages: number; calls: number };
}

const STATUS_OPTIONS = [
  { value: "ALL", label: "All statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "PENDING_REVIEW", label: "Pending review" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "SUSPENDED", label: "Suspended" },
];

function statusBadge(status: string) {
  switch (status) {
    case "APPROVED":
      return "bg-green-50 text-green-700 border-green-200";
    case "PENDING_REVIEW":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "REJECTED":
      return "bg-red-50 text-red-700 border-red-200";
    case "SUSPENDED":
      return "bg-myna-charcoal/10 text-myna-charcoal/70 border-myna-charcoal/20";
    case "DRAFT":
      return "bg-blue-50 text-blue-700 border-blue-200";
    default:
      return "bg-myna-charcoal/5 text-myna-charcoal/60 border-myna-charcoal/10";
  }
}

export default function AdminTeachersPage() {
  const router = useRouter();
  const [teachers, setTeachers] = useState<AdminTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    const u = getUser();
    if (!u) { router.push("/login"); return; }
    if (u.role !== "ADMIN") { router.push("/"); return; }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams();
      if (status && status !== "ALL") qs.set("status", status);
      const url = qs.toString() ? `/admin/teachers?${qs}` : "/admin/teachers";
      const data = await api<AdminTeacher[]>(url, { auth: true });
      setTeachers(data);
    } catch (err: any) {
      setError(err.message || "Could not load teachers");
    } finally {
      setLoading(false);
    }
  }

  async function suspend(id: string) {
    if (!confirm("Suspend this teacher? They won't be able to accept calls or bookings.")) return;
    setActing(id);
    try {
      await api(`/admin/teachers/${id}/suspend`, { method: "PATCH", auth: true });
      await load();
    } catch (err: any) {
      setError(err.message || "Action failed");
    } finally {
      setActing(null);
    }
  }

  async function reactivate(id: string) {
    if (!confirm("Reactivate this teacher?")) return;
    setActing(id);
    try {
      await api(`/admin/teachers/${id}/reactivate`, { method: "PATCH", auth: true });
      await load();
    } catch (err: any) {
      setError(err.message || "Action failed");
    } finally {
      setActing(null);
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return teachers;
    return teachers.filter((t) => {
      const name = [t.firstName, t.lastName].filter(Boolean).join(" ") || t.user.fullName;
      return (
        name.toLowerCase().includes(q) ||
        t.user.email.toLowerCase().includes(q)
      );
    });
  }, [teachers, search]);

  return (
    <main className="min-h-screen bg-cream">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 text-myna-orange font-semibold text-sm hover:underline"
        >
          <ChevronLeft size={14} /> Back to admin
        </Link>

        <div className="mt-4">
          <h1 className="font-display text-4xl font-bold text-myna-charcoal">Teachers</h1>
          <p className="text-myna-charcoal/60 mt-2">All teacher accounts and their statuses</p>
        </div>

        {/* Filters */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm p-5 grid gap-3 md:grid-cols-12">
          <div className="md:col-span-8 relative">
            <Search size={16} className="absolute start-4 top-1/2 -translate-y-1/2 text-myna-charcoal/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email"
              className="w-full rounded-xl border border-myna-charcoal/15 bg-cream ps-10 pe-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-myna-orange"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="md:col-span-4 rounded-xl border border-myna-charcoal/15 bg-cream px-4 py-3 text-sm"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">{error}</div>
        )}

        {/* List */}
        {loading ? (
          <div className="mt-8 flex items-center justify-center text-myna-charcoal/60">
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-8 bg-white rounded-3xl shadow-sm p-12 text-center">
            <p className="font-display text-xl font-bold text-myna-charcoal">No teachers found</p>
            <p className="text-myna-charcoal/60 text-sm mt-2">
              Try a different search or status filter.
            </p>
          </div>
        ) : (
          <div className="mt-6 bg-white rounded-3xl shadow-sm overflow-hidden">
            {filtered.map((t, idx) => {
              const displayName =
                [t.firstName, t.lastName].filter(Boolean).join(" ") || t.user.fullName;
              const isActing = acting === t.id;

              return (
                <div
                  key={t.id}
                  className={`flex flex-col md:flex-row md:items-center gap-4 p-5 ${
                    idx !== filtered.length - 1 ? "border-b border-cream" : ""
                  }`}
                >
                  {/* Left: avatar + info */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-full bg-myna-orange text-white flex items-center justify-center font-bold shrink-0 overflow-hidden">
                      {t.profilePhotoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={t.profilePhotoUrl} alt={displayName} className="w-full h-full object-cover" />
                      ) : (
                        displayName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-myna-charcoal truncate">{displayName}</p>
                        {t.isOnline && <span className="w-2 h-2 rounded-full bg-green-500" />}
                        <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${statusBadge(t.applicationStatus)}`}>
                          {t.applicationStatus.replace("_", " ")}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-myna-charcoal/60 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Mail size={11} /> {t.user.email}
                        </span>
                        {t.countryOfBirth && (
                          <span className="flex items-center gap-1">
                            <Globe2 size={11} /> {t.countryOfBirth}
                          </span>
                        )}
                        <span>{t._count.teacherLanguages} lang{t._count.teacherLanguages !== 1 ? "s" : ""}</span>
                        <span>{t._count.calls} call{t._count.calls !== 1 ? "s" : ""}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/teachers/${t.id}`}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-myna-charcoal/15 text-xs font-semibold text-myna-charcoal hover:bg-myna-charcoal/5"
                    >
                      View <ExternalLink size={11} />
                    </Link>
                    {t.applicationStatus === "SUSPENDED" ? (
                      <button
                        onClick={() => reactivate(t.id)}
                        disabled={isActing}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-green-50 text-green-700 border border-green-200 text-xs font-semibold hover:bg-green-100 disabled:opacity-50"
                      >
                        {isActing ? <Loader2 size={11} className="animate-spin" /> : <UserCheck size={11} />}
                        Reactivate
                      </button>
                    ) : (
                      <button
                        onClick={() => suspend(t.id)}
                        disabled={isActing}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-red-50 text-red-700 border border-red-200 text-xs font-semibold hover:bg-red-100 disabled:opacity-50"
                      >
                        {isActing ? <Loader2 size={11} className="animate-spin" /> : <UserX size={11} />}
                        Suspend
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}