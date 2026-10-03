"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Wifi, WifiOff, ChevronRight, Filter, X } from "lucide-react";
import { api, getUser } from "@/lib/api";
import { useRouter } from "next/navigation";
import LanguageSwitcher from "@/components/LanguageSwitcher";

interface Language {
  id: string;
  name: string;
  code: string;
}

interface TeacherLanguage {
  id: string;
  serviceType: string;
  language: Language;
}

interface Teacher {
  id: string;
  firstName: string | null;
  lastName: string | null;
  bio: string | null;
  profileTitle: string | null;
  profilePhotoUrl: string | null;
  experienceYears: number | null;
  isOnline: boolean;
  requestedHourlyRateDA: number | null;
  user: {
    fullName: string;
  };
  teacherLanguages: TeacherLanguage[];
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function FindTeacherPage() {
  const router = useRouter();

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);

  const [languageId, setLanguageId] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const user = getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    loadLanguages();
  }, [router]);

  useEffect(() => {
    loadTeachers();
  }, [languageId, serviceType, onlineOnly]);

 async function loadLanguages() {
  try {
    const data = await api<Language[]>("/languages");
    setLanguages(data);
  } catch (err) {
    console.error(err);
  }
}

  async function loadTeachers() {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      if (languageId) {
        params.set("languageId", languageId);
      }

      if (serviceType) {
        params.set("serviceType", serviceType);
      }

      if (onlineOnly) {
        params.set("onlineOnly", "true");
      }

      const query = params.toString();
      const endpoint = query
        ? `/teachers/search?${query}`
        : "/teachers/search";

      const data = await api<Teacher[]>(endpoint);

      setTeachers(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load teachers");
    } finally {
      setLoading(false);
    }
  }

  const filteredTeachers = teachers.filter((teacher) => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return true;
    }

    const languages = teacher.teacherLanguages
      .map((tl) => tl.language.name)
      .join(" ");

    const text = [
      teacher.user.fullName,
      teacher.firstName,
      teacher.lastName,
      teacher.bio,
      teacher.profileTitle,
      languages,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return text.includes(query);
  });

  const hasFilters =
    search || languageId || serviceType || onlineOnly;

  function clearFilters() {
    setSearch("");
    setLanguageId("");
    setServiceType("");
    setOnlineOnly(false);
  }

  return (
    <main className="min-h-screen bg-cream">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href="/"
              className="text-sm font-semibold text-myna-orange hover:underline"
            >
              ← Home
            </Link>

            <h1 className="mt-3 font-display text-4xl font-bold text-myna-charcoal">
              Find a Teacher
            </h1>

            <p className="mt-2 text-myna-charcoal/60">
              {teachers.length}{" "}
              {teachers.length === 1 ? "teacher" : "teachers"} available
            </p>
          </div>

          <LanguageSwitcher />
        </div>

        <div className="mb-8 rounded-3xl bg-white p-5 shadow-sm">
          <div className="grid gap-3 md:grid-cols-12">
            <div className="relative md:col-span-5">
              <Search
                size={16}
                className="absolute start-4 top-1/2 -translate-y-1/2 text-myna-charcoal/40"
              />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or language"
                className="w-full rounded-xl border border-myna-charcoal/15 bg-cream py-3 ps-10 pe-4 text-sm focus:outline-none focus:ring-2 focus:ring-myna-orange"
              />
            </div>

            <select
              value={languageId}
              onChange={(e) => setLanguageId(e.target.value)}
              className="rounded-xl border border-myna-charcoal/15 bg-cream px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-myna-orange md:col-span-3"
            >
              <option value="">All languages</option>

              {languages.map((language) => (
                <option key={language.id} value={language.id}>
                  {language.name}
                </option>
              ))}
            </select>

            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              className="rounded-xl border border-myna-charcoal/15 bg-cream px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-myna-orange md:col-span-2"
            >
              <option value="">Any type</option>
              <option value="PROFESSIONAL_TEACHER">
                Professional
              </option>
              <option value="CONVERSATION_PARTNER">
                Conversation
              </option>
            </select>

            <button
              type="button"
              onClick={() => setOnlineOnly((value) => !value)}
              className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition md:col-span-2 ${
                onlineOnly
                  ? "border-green-600 bg-green-50 text-green-700"
                  : "border-myna-charcoal/15 bg-cream text-myna-charcoal/70 hover:bg-myna-charcoal/5"
              }`}
            >
              {onlineOnly ? (
                <Wifi size={14} />
              ) : (
                <WifiOff size={14} />
              )}
              Online now
            </button>
          </div>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-3 flex items-center gap-1 text-xs font-semibold text-myna-orange hover:underline"
            >
              <X size={12} />
              Clear filters
            </button>
          )}
        </div>

        {loading && (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-72 animate-pulse rounded-3xl bg-white shadow-sm"
              />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && filteredTeachers.length === 0 && (
          <div className="rounded-3xl bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cream text-myna-charcoal/40">
              <Filter size={24} />
            </div>

            <p className="mt-4 font-display text-xl font-bold text-myna-charcoal">
              No teachers found
            </p>

            <p className="mt-2 text-sm text-myna-charcoal/60">
              Try changing your filters or search.
            </p>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-5 rounded-full bg-myna-orange px-5 py-2.5 text-sm font-semibold text-white"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {!loading && !error && filteredTeachers.length > 0 && (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredTeachers.map((teacher) => (
              <TeacherCard
                key={teacher.id}
                teacher={teacher}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function TeacherCard({ teacher }: { teacher: Teacher }) {
  const displayName =
    [teacher.firstName, teacher.lastName]
      .filter(Boolean)
      .join(" ") || teacher.user.fullName;

  const languages = teacher.teacherLanguages.map(
    (teacherLanguage) => teacherLanguage.language.name
  );

  return (
    <Link
      href={`/teachers/${teacher.id}`}
      className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
    >
      <div className="flex items-start gap-4 p-5">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-myna-orange text-xl font-bold text-white">
          {teacher.profilePhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={teacher.profilePhotoUrl}
              alt={displayName}
              className="h-full w-full object-cover"
            />
          ) : (
            displayName.charAt(0).toUpperCase()
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-display font-bold text-myna-charcoal">
              {displayName}
            </p>

            {teacher.isOnline && (
              <span
                className="h-2 w-2 shrink-0 rounded-full bg-green-500"
                title="Online now"
              />
            )}
          </div>

          {teacher.profileTitle && (
            <p className="truncate text-xs text-myna-charcoal/60">
              {teacher.profileTitle}
            </p>
          )}

          <div className="mt-2 flex flex-wrap gap-1.5">
            {languages.slice(0, 3).map((language) => (
              <span
                key={language}
                className="rounded-full bg-myna-orange/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-myna-orange"
              >
                {language}
              </span>
            ))}

            {languages.length > 3 && (
              <span className="text-[10px] text-myna-charcoal/50">
                +{languages.length - 3}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-5 pb-5">
        {teacher.bio ? (
          <p className="line-clamp-3 text-sm text-myna-charcoal/70">
            {teacher.bio}
          </p>
        ) : (
          <p className="text-sm italic text-myna-charcoal/40">
            No bio yet
          </p>
        )}

        <div className="mt-auto flex items-center justify-end pt-5">
          <span className="flex items-center gap-1 text-xs font-semibold text-myna-orange transition-transform group-hover:translate-x-0.5">
            View
            <ChevronRight size={12} />
          </span>
        </div>
      </div>
    </Link>
  );
}