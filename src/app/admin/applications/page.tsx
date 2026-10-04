"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User, Mail, Globe2, Award, GraduationCap, FileText,
  Clock, CheckCircle2, XCircle, ChevronLeft, Briefcase, Loader2, ExternalLink,
} from "lucide-react";
import { api, getUser } from "@/lib/api";

interface PendingApplication {
  id: string;
  firstName: string | null;
  lastName: string | null;
  countryOfBirth: string | null;
  bio: string | null;
  experienceYears: number | null;
  profilePhotoUrl: string | null;
  idDocumentUrl: string | null;
  phoneNumber: string | null;
  requestedHourlyRateDA: number | null;
  availability: { day: string; startTime: string; endTime: string }[] | null;
  createdAt: string;
  user: { email: string; fullName: string };
  teacherLanguages: {
    id: string;
    serviceType: string;
    language: { id: string; name: string; code: string };
    certificates: {
      id: string;
      description: string | null;
      issuedBy: string | null;
      yearFrom: number | null;
      yearTo: number | null;
      fileUrl: string;
    }[];
  }[];
  educations: {
    id: string;
    university: string;
    degree: string;
    degreeType: string | null;
    specialization: string | null;
    yearFrom: number;
    yearTo: number;
  }[];
}

export default function AdminApplicationsPage() {
  const router = useRouter();
  const [apps, setApps] = useState<PendingApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
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
      const data = await api<PendingApplication[]>("/teachers/applications/pending", { auth: true });
      setApps(data);
    } catch (err: any) {
      setError(err.message || "Could not load applications");
    } finally {
      setLoading(false);
    }
  }

  async function review(id: string, decision: "APPROVED" | "REJECTED") {
    setActing(id);
    setError("");
    try {
      await api(`/teachers/applications/${id}/review`, {
        method: "PATCH",
        auth: true,
        body: { decision, note: notes[id]?.trim() || undefined },
      });
      setApps((prev) => prev.filter((a) => a.id !== id));
      setExpanded((prev) => (prev === id ? null : prev));
    } catch (err: any) {
      setError(err.message || "Action failed");
    } finally {
      setActing(null);
    }
  }

  function displayName(a: PendingApplication) {
    return [a.firstName, a.lastName].filter(Boolean).join(" ") || a.user.fullName;
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center text-myna-charcoal/60">
        <Loader2 size={20} className="animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <Link href="/admin" className="inline-flex items-center gap-1 text-myna-orange font-semibold text-sm hover:underline">
          <ChevronLeft size={14} /> Back to Admin
        </Link>

        <div className="mt-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-4xl font-bold text-myna-charcoal">Teacher Applications</h1>
            <p className="text-myna-charcoal/60 mt-2">
              {apps.length} {apps.length === 1 ? "application" : "applications"} pending review
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
            {error}
          </div>
        )}

        {apps.length === 0 ? (
          <div className="mt-8 bg-white rounded-3xl shadow-sm p-12 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-100 text-green-600 flex items-center justify-center">
              <CheckCircle2 size={28} />
            </div>
            <p className="font-display text-xl font-bold text-myna-charcoal mt-4">
              All caught up
            </p>
            <p className="text-myna-charcoal/60 text-sm mt-2">
              No pending teacher applications right now.
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-5">
            {apps.map((a) => {
              const isOpen = expanded === a.id;
              const isActing = acting === a.id;

              return (
                <div key={a.id} className="bg-white rounded-3xl shadow-sm overflow-hidden">
                  {/* Header row */}
                  <div className="p-6 flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full bg-myna-orange text-white flex items-center justify-center text-xl font-bold shrink-0 overflow-hidden">
                      {a.profilePhotoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={a.profilePhotoUrl} alt={displayName(a)} className="w-full h-full object-cover" />
                      ) : (
                        displayName(a).charAt(0).toUpperCase()
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-display text-xl font-bold text-myna-charcoal">
                          {displayName(a)}
                        </h2>
                        <span className="text-[11px] font-bold uppercase tracking-wider bg-myna-yellow/40 text-myna-brown px-2 py-0.5 rounded-full">
                          Pending
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-myna-charcoal/60">
                        <span className="flex items-center gap-1.5">
                          <Mail size={13} /> {a.user.email}
                        </span>
                        {a.countryOfBirth && (
                          <span className="flex items-center gap-1.5">
                            <Globe2 size={13} /> {a.countryOfBirth}
                          </span>
                        )}
                        {a.experienceYears != null && a.experienceYears > 0 && (
                          <span className="flex items-center gap-1.5">
                            <Briefcase size={13} /> {a.experienceYears} yrs exp
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 mt-3">
                        {a.teacherLanguages.map((tl) => (
                          <span
                            key={tl.id}
                            className="text-xs font-bold bg-myna-orange/10 text-myna-orange px-2.5 py-1 rounded-full"
                          >
                            {tl.language.name}
                            {tl.serviceType === "CONVERSATION_PARTNER" ? " · Conversation" : " · Professional"}
                          </span>
                        ))}
                      </div>

                      <p className="text-xs text-myna-charcoal/40 mt-3">
                        Applied {formatDate(a.createdAt)}
                      </p>
                    </div>

                    <button
                      onClick={() => setExpanded(isOpen ? null : a.id)}
                      className="text-xs font-semibold text-myna-orange hover:underline shrink-0"
                    >
                      {isOpen ? "Hide details" : "Review"}
                    </button>
                  </div>

                  {/* Expanded review panel */}
                  {isOpen && (
                    <div className="border-t border-myna-charcoal/10 bg-cream/50 p-6 space-y-5">
                      {/* Bio */}
                      {a.bio && (
                        <Section title="Bio" icon={<FileText size={14} />}>
                          <p className="text-sm text-myna-charcoal/75 whitespace-pre-line">{a.bio}</p>
                        </Section>
                      )}

                      {/* Availability summary */}
                      {a.availability && a.availability.length > 0 && (
                        <Section title="Availability" icon={<Clock size={14} />}>
                          <div className="flex flex-wrap gap-2">
                            {a.availability.map((s, i) => (
                              <span key={i} className="text-xs font-semibold bg-white px-2.5 py-1 rounded-full border border-myna-charcoal/10">
                                {s.day} · {s.startTime}–{s.endTime}
                              </span>
                            ))}
                          </div>
                        </Section>
                      )}

                      {/* Education */}
                     {(a.educations?.length ?? 0) > 0 && (
                        <Section title="Education" icon={<GraduationCap size={14} />}>
                          <ul className="space-y-2">
                            {(a.educations ?? []).map((e) => (
                              <li key={e.id} className="text-sm">
                                <span className="font-semibold text-myna-charcoal">
                                  {e.degree}{e.specialization ? ` · ${e.specialization}` : ""}
                                </span>
                                <span className="text-myna-charcoal/60"> — {e.university}, {e.yearFrom}–{e.yearTo}</span>
                              </li>
                            ))}
                          </ul>
                        </Section>
                      )}

                      {/* Certificates */}
                      {a.teacherLanguages.some((tl) => tl.certificates.length > 0) && (
                        <Section title="Certificates" icon={<Award size={14} />}>
                          <ul className="space-y-2">
                            {a.teacherLanguages.flatMap((tl) =>
                              tl.certificates.map((c) => (
                                <li key={c.id} className="flex items-center gap-2 text-sm">
                                  <Award size={14} className="text-myna-orange shrink-0" />
                                  <span className="font-semibold text-myna-charcoal">
                                    {c.description || `${tl.language.name} cert`}
                                  </span>
                                  {c.issuedBy && <span className="text-myna-charcoal/60">— {c.issuedBy}</span>}
                                  <a
                                    href={c.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-auto text-xs text-myna-orange font-semibold hover:underline flex items-center gap-1"
                                  >
                                    Open <ExternalLink size={11} />
                                  </a>
                                </li>
                              ))
                            )}
                          </ul>
                        </Section>
                      )}

                      {/* ID document */}
                      <Section title="ID document" icon={<User size={14} />}>
                        {a.idDocumentUrl ? (
                          <a
                            href={a.idDocumentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-myna-orange hover:underline"
                          >
                            View ID document <ExternalLink size={12} />
                          </a>
                        ) : (
                          <p className="text-sm text-myna-charcoal/50 italic">No ID document uploaded.</p>
                        )}
                      </Section>

                      {/* Pricing */}
                      {a.requestedHourlyRateDA != null && (
                        <Section title="Requested hourly rate" icon={<Briefcase size={14} />}>
                          <p className="text-sm font-bold text-myna-charcoal">
                            {a.requestedHourlyRateDA} DA / hour
                          </p>
                        </Section>
                      )}

                      {/* Note + actions */}
                      <div className="pt-3 border-t border-myna-charcoal/10 space-y-3">
                        <label className="block text-xs font-bold uppercase tracking-wider text-myna-charcoal/50">
                          Review note (optional)
                        </label>
                        <textarea
                          value={notes[a.id] ?? ""}
                          onChange={(e) => setNotes((prev) => ({ ...prev, [a.id]: e.target.value }))}
                          rows={2}
                          placeholder="Reason, follow-up request, or any note for the teacher…"
                          className="w-full rounded-xl border border-myna-charcoal/15 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-myna-orange"
                        />

                        <div className="flex gap-3">
                          <button
                            onClick={() => review(a.id, "REJECTED")}
                            disabled={isActing}
                            className="flex-1 py-3 rounded-full font-semibold bg-white border-2 border-red-200 text-red-600 hover:bg-red-50 transition disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {isActing ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                            Reject
                          </button>
                          <button
                            onClick={() => review(a.id, "APPROVED")}
                            disabled={isActing}
                            className="flex-1 py-3 rounded-full font-semibold bg-myna-orange text-white hover:bg-myna-orange/90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {isActing ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                            Approve
                          </button>
                        </div>
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

function Section({
  title, icon, children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 text-myna-charcoal/60 mb-2">
        <span className="text-myna-orange">{icon}</span>
        <span className="text-xs font-bold uppercase tracking-wider">{title}</span>
      </div>
      {children}
    </div>
  );
}