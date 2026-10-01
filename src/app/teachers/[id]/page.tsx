"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Globe2, GraduationCap, Award, Clock, BookOpen,
  Wifi, WifiOff, Phone, CalendarPlus, ChevronLeft, Star, Briefcase,
} from "lucide-react";
import { api, getUser } from "@/lib/api";
import { useLanguage } from "@/app/language-provider";

interface TeacherProfile {
  id: string;
  firstName: string | null;
  lastName: string | null;
  bio: string | null;
  profileTitle: string | null;
  profilePhotoUrl: string | null;
  experienceYears: number | null;
  isOnline: boolean;
  countryOfBirth: string | null;
  requestedHourlyRateDA: number | null;
  availability: { day: string; startTime: string; endTime: string }[] | null;
  user: { fullName: string; createdAt: string };
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
    }[];
  }[];
  spokenLanguages: { id: string; level: string; language: { name: string } }[];
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

const DAY_ORDER: Record<string, number> = { MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6, SUN: 7 };
const DAY_LABEL: Record<string, string> = {
  MON: "Mon", TUE: "Tue", WED: "Wed", THU: "Thu", FRI: "Fri", SAT: "Sat", SUN: "Sun",
};

export default function TeacherProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { t } = useLanguage();

  const [teacher, setTeacher] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const user = getUser();
    if (!user) { router.push("/login"); return; }
    if (!params?.id) return;
    load(params.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.id]);

  async function load(id: string) {
    setLoading(true);
    setError("");
    setNotFound(false);
    try {
      const data = await api<TeacherProfile>(`/teachers/${id}`);
      setTeacher(data);
    } catch (err: any) {
      if (/not found|404/i.test(err.message)) setNotFound(true);
      else setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <main className="min-h-screen flex items-center justify-center text-myna-charcoal/60">Loading…</main>;
  }

  if (notFound || (!teacher && !error)) {
    return (
      <main className="min-h-screen bg-cream flex items-center justify-center px-6">
        <div className="max-w-md text-center bg-white rounded-3xl shadow-sm p-10">
          <p className="font-display text-2xl font-bold text-myna-charcoal">Teacher not available</p>
          <p className="text-myna-charcoal/60 mt-2 text-sm">
            This profile doesn&apos;t exist or hasn&apos;t been approved yet.
          </p>
          <Link
            href="/find-teacher"
            className="inline-block mt-6 px-6 py-3 rounded-full bg-myna-orange text-white font-semibold text-sm"
          >
            Browse teachers
          </Link>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-cream flex items-center justify-center px-6">
        <div className="max-w-md text-center bg-red-50 border border-red-200 rounded-3xl p-8">
          <p className="text-red-700 text-sm">{error}</p>
          <button
            onClick={() => params?.id && load(params.id)}
            className="mt-4 px-5 py-2.5 rounded-full bg-myna-orange text-white font-semibold text-sm"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  if (!teacher) return null;

  const displayName =
    [teacher.firstName, teacher.lastName].filter(Boolean).join(" ") || teacher.user.fullName;

  const sortedSlots = (teacher.availability ?? [])
    .slice()
    .sort((a, b) => (DAY_ORDER[a.day] ?? 99) - (DAY_ORDER[b.day] ?? 99));

  const hourlyRate = teacher.requestedHourlyRateDA;

  return (
    <main className="min-h-screen bg-cream">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <Link
          href="/find-teacher"
          className="inline-flex items-center gap-1 text-myna-orange font-semibold text-sm hover:underline"
        >
          <ChevronLeft size={14} /> Back to teachers
        </Link>

        {/* Header card */}
        <div className="mt-4 bg-white rounded-3xl shadow-sm p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-myna-orange text-white flex items-center justify-center text-3xl font-bold shrink-0 overflow-hidden mx-auto md:mx-0">
              {teacher.profilePhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={teacher.profilePhotoUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                displayName.charAt(0).toUpperCase()
              )}
            </div>

            <div className="flex-1 min-w-0 text-center md:text-start">
              <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap">
                <h1 className="font-display text-3xl font-bold text-myna-charcoal">
                  {displayName}
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${
                    teacher.isOnline
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-myna-charcoal/5 text-myna-charcoal/60 border border-myna-charcoal/10"
                  }`}
                >
                  {teacher.isOnline ? <Wifi size={11} /> : <WifiOff size={11} />}
                  {teacher.isOnline ? "Online now" : "Offline"}
                </span>
              </div>

              {teacher.profileTitle && (
                <p className="text-myna-charcoal/70 mt-1">{teacher.profileTitle}</p>
              )}

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2 mt-4 text-sm text-myna-charcoal/60">
                {teacher.countryOfBirth && (
                  <span className="flex items-center gap-1.5">
                    <Globe2 size={14} /> {teacher.countryOfBirth}
                  </span>
                )}
                {teacher.experienceYears != null && teacher.experienceYears > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Briefcase size={14} /> {teacher.experienceYears} years experience
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
                {teacher.teacherLanguages.map((tl) => (
                  <span
                    key={tl.id}
                    className="text-xs font-bold bg-myna-orange/10 text-myna-orange px-3 py-1 rounded-full"
                  >
                    {tl.language.name}
                    {tl.serviceType === "CONVERSATION_PARTNER" ? " · Conversation" : " · Professional"}
                  </span>
                ))}
              </div>
            </div>

            <div className="md:text-end shrink-0">
              {hourlyRate ? (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-myna-charcoal/50">
                    Hourly rate
                  </p>
                  <p className="font-display text-3xl font-bold text-myna-orange mt-1">
                    {hourlyRate} <span className="text-lg">DA</span>
                  </p>
                </div>
              ) : (
                <p className="text-sm text-myna-charcoal/50 italic">Rate on request</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              disabled={!teacher.isOnline}
              className="flex-1 py-3 rounded-full font-semibold bg-myna-orange text-white hover:bg-myna-orange/90 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              title={teacher.isOnline ? "Start a live call" : "Teacher is offline"}
            >
              <Phone size={16} />
              {teacher.isOnline ? "Call now" : "Offline"}
            </button>
            <Link
              href={`/student/bookings/new?teacherId=${teacher.id}`}
              className="flex-1 py-3 rounded-full font-semibold bg-myna-charcoal text-white hover:bg-myna-charcoal/90 transition flex items-center justify-center gap-2"
            >
              <CalendarPlus size={16} />
              Book a lesson
            </Link>
          </div>
        </div>

        {/* Body grid */}
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {/* Left column */}
          <div className="md:col-span-2 space-y-6">
            {/* Bio */}
            <Section title="About" icon={<BookOpen size={16} />}>
              {teacher.bio ? (
                <p className="text-myna-charcoal/75 leading-relaxed whitespace-pre-line">
                  {teacher.bio}
                </p>
              ) : (
                <p className="text-myna-charcoal/50 italic text-sm">
                  This teacher hasn&apos;t written a bio yet.
                </p>
              )}
            </Section>

            {/* Education */}
            {teacher.educations.length > 0 && (
              <Section title="Education" icon={<GraduationCap size={16} />}>
                <div className="space-y-4">
                  {teacher.educations.map((e) => (
                    <div key={e.id} className="flex gap-3">
                      <div className="w-10 h-10 rounded-xl bg-myna-orange/10 text-myna-orange flex items-center justify-center shrink-0">
                        <GraduationCap size={18} />
                      </div>
                      <div>
                        <p className="font-semibold text-myna-charcoal">
                          {e.degree}
                          {e.specialization ? ` · ${e.specialization}` : ""}
                        </p>
                        <p className="text-sm text-myna-charcoal/60">{e.university}</p>
                        <p className="text-xs text-myna-charcoal/50 mt-0.5">
                          {e.yearFrom} – {e.yearTo}
                          {e.degreeType ? ` · ${e.degreeType}` : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Certificates */}
            {teacher.teacherLanguages.some((tl) => tl.certificates.length > 0) && (
              <Section title="Certificates" icon={<Award size={16} />}>
                <div className="space-y-3">
                  {teacher.teacherLanguages.flatMap((tl) =>
                    tl.certificates.map((c) => (
                      <div key={c.id} className="flex gap-3">
                        <div className="w-10 h-10 rounded-xl bg-myna-yellow/20 text-myna-orange flex items-center justify-center shrink-0">
                          <Award size={18} />
                        </div>
                        <div>
                          <p className="font-semibold text-myna-charcoal">
                            {c.description || `${tl.language.name} certificate`}
                          </p>
                          {c.issuedBy && (
                            <p className="text-sm text-myna-charcoal/60">{c.issuedBy}</p>
                          )}
                          {c.yearFrom && c.yearTo && (
                            <p className="text-xs text-myna-charcoal/50 mt-0.5">
                              {c.yearFrom} – {c.yearTo}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Section>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Availability */}
            <Section title="Weekly availability" icon={<Clock size={16} />}>
              {sortedSlots.length === 0 ? (
                <p className="text-sm text-myna-charcoal/50 italic">
                  No availability set.
                </p>
              ) : (
                <ul className="space-y-2">
                  {sortedSlots.map((s, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between text-sm py-2 border-b border-myna-charcoal/5 last:border-0"
                    >
                      <span className="font-semibold text-myna-charcoal">
                        {DAY_LABEL[s.day] ?? s.day}
                      </span>
                      <span className="text-myna-charcoal/60 tabular-nums">
                        {s.startTime} – {s.endTime}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            {/* Spoken languages */}
            {teacher.spokenLanguages.length > 0 && (
              <Section title="Speaks" icon={<Globe2 size={16} />}>
                <div className="flex flex-wrap gap-2">
                  {teacher.spokenLanguages.map((sl) => (
                    <span
                      key={sl.id}
                      className="text-xs font-semibold bg-myna-charcoal/5 text-myna-charcoal/70 px-2.5 py-1 rounded-full"
                    >
                      {sl.language.name} · {sl.level}
                    </span>
                  ))}
                </div>
              </Section>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-3xl shadow-sm p-6">
      <div className="flex items-center gap-2 text-myna-charcoal mb-4">
        <span className="text-myna-orange">{icon}</span>
        <h2 className="font-display font-bold text-lg">{title}</h2>
      </div>
      {children}
    </div>
  );
}