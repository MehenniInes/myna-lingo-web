"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Star, Globe2, Wifi, WifiOff, ChevronRight, Filter, X } from "lucide-react";
import { api, getUser } from "@/lib/api";
import { useLanguage } from "@/app/language-provider";
import LanguageSwitcher from "@/components/LanguageSwitcher";

interface Language { id: string; name: string; code: string; }

interface TeacherCard {
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
  user: { fullName: string };
  teacherLanguages: {
    id: string;
    serviceType: string;
    language: Language;
  }[];
}

export default function FindTeacherPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [teachers, setTeachers] = useState<TeacherCard[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [languageId, setLanguageId] = useState<string>("");
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [serviceType, setServiceType] = useState<string>("");

  useEffect(() => {
    const user = getUser();
    if (!user) { router.push("/login"); return; }
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const [tch, langsRaw] = await Promise.all([
        api<TeacherCard[]>("/teachers"),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/languages`).then((r) => r.json()),
      ]);
      setTeachers(tch);
      const langs = Array.isArray(langsRaw) ? langsRaw : langsRaw?.languages ?? langsRaw?.data ?? [];
      setLanguages(langs);
    } catch (err: any) {
      setError(err.message || "Failed to load teachers");
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return teachers.filter((tc) => {
      if (onlineOnly && !tc.isOnline) return false;
      if (languageId && !tc.teacherLanguages.some((tl) => tl.language.id === languageId)) return false;
      if (serviceType && !tc.teacherLanguages.some((tl) => tl.serviceType === serviceType)) return false;
      if (q) {
        const haystack = [
          tc.user.fullName,
          tc.bio ?? "",
          tc.profileTitle ?? "",
          tc.countryOfBirth ?? "",
          ...tc.teacherLanguages.map((tl) => tl.language.name),
        ].join(" ").toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [teachers, search, languageId, onlineOnly, serviceType]);

  const hasFilters = search || languageId || onlineOnly || serviceType;

  function clearFilters() {
    setSearch("");
    setLanguageId("");
    setOnlineOnly(false);
    setServiceType("");
  }

  return (
    <main className="min-h-screen bg-cream">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap mb-8">
          <div>
            <Link href="/" className="text-myna-orange font-semibold text-sm hover:underline">
              ← Home
            </Link>
            <h1 className="font-display text-4xl font-bold text-myna-charcoal mt-3">
              Find a Teacher
            </h1>
            <p className="text-myna-charcoal/60 mt-2">
              {teachers.length} verified {teachers.length === 1 ? "teacher" : "teachers"} available
            </p>
          </div>
          <LanguageSwitcher />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-8">
          <div className="grid gap-3 md:grid-cols-12">
            <div className="md:col-span-5 relative">
              <Search size={16} className="absolute start-4 top-1/2 -translate-y-1/2 text-myna-charcoal/40" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, language, or country"
                className="w-full rounded-xl border border-myna-charcoal/15 bg-cream ps-10 pe-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-myna-orange"
              />
            </div>

            <select
              value={languageId}
              onChange={(e) => setLanguageId(e.target.value)}
              className="md:col-span-3 rounded-xl border border-myna-charcoal/15 bg-cream px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-myna-orange"
            >
              <option value="">All languages</option>
              {languages.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>

            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              className="md:col-span-2 rounded-xl border border-myna-charcoal/15 bg-cream px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-myna-orange"
            >
              <option value="">Any type</option>
              <option value="PROFESSIONAL_TEACHER">Professional</option>
              <option value="CONVERSATION_PARTNER">Conversation</option>
            </select>

            <button
              onClick={() => setOnlineOnly(!onlineOnly)}
              className={`md:col-span-2 rounded-xl border px-4 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition ${
                onlineOnly
                  ? "border-green-600 bg-green-50 text-green-700"
                  : "border-myna-charcoal/15 bg-cream text-myna-charcoal/70 hover:bg-myna-charcoal/5"
              }`}
            >
              {onlineOnly ? <Wifi size={14} /> : <WifiOff size={14} />}
              Online now
            </button>
          </div>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="mt-3 text-xs font-semibold text-myna-orange hover:underline flex items-center gap-1"
            >
              <X size={12} /> Clear filters
            </button>
          )}
        </div>

        {/* States */}
        {loading && (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm p-5 animate-pulse h-72" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="bg-white rounded-3xl shadow-sm p-12 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-cream flex items-center justify-center text-myna-charcoal/40">
              <Filter size={24} />
            </div>
            <p className="font-display text-xl font-bold text-myna-charcoal mt-4">
              No teachers match your filters
            </p>
            <p className="text-myna-charcoal/60 text-sm mt-2">
              Try clearing a filter or searching for a different language.
            </p>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="mt-5 px-5 py-2.5 rounded-full bg-myna-orange text-white font-semibold text-sm"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Grid */}
        {!loading && !error && filtered.length > 0 && (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((tc) => (
              <TeacherCardItem key={tc.id} teacher={tc} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function TeacherCardItem({ teacher }: { teacher: TeacherCard }) {
  const displayName =
    [teacher.firstName, teacher.lastName].filter(Boolean).join(" ") || teacher.user.fullName;

  const langs = teacher.teacherLanguages.map((tl) => tl.language.name);

  return (
    <Link
      href={`/teachers/${teacher.id}`}
      className="group bg-white rounded-2xl shadow-sm hover:shadow-md transition overflow-hidden flex flex-col"
    >
      <div className="p-5 flex items-start gap-4">
        <div className="w-16 h-16 rounded-full bg-myna-orange text-white flex items-center justify-center text-xl font-bold shrink-0 overflow-hidden">
          {teacher.profilePhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={teacher.profilePhotoUrl} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            displayName.charAt(0).toUpperCase()
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-display font-bold text-myna-charcoal truncate">
              {displayName}
            </p>
            {teacher.isOnline && (
              <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" title="Online now" />
            )}
          </div>
          {teacher.profileTitle && (
            <p className="text-xs text-myna-charcoal/60 truncate">{teacher.profileTitle}</p>
          )}

          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {langs.slice(0, 3).map((l) => (
              <span
                key={l}
                className="text-[10px] font-bold uppercase tracking-wide bg-myna-orange/10 text-myna-orange px-2 py-0.5 rounded-full"
              >
                {l}
              </span>
            ))}
            {langs.length > 3 && (
              <span className="text-[10px] text-myna-charcoal/50">+{langs.length - 3}</span>
            )}
          </div>
        </div>
      </div>

      <div className="px-5 pb-5 flex-1 flex flex-col">
        {teacher.bio ? (
          <p className="text-sm text-myna-charcoal/70 line-clamp-3">{teacher.bio}</p>
        ) : (
          <p className="text-sm text-myna-charcoal/40 italic">No bio yet</p>
        )}

        <div className="mt-auto pt-4 flex items-center justify-between text-xs text-myna-charcoal/60">
          <div className="flex items-center gap-3">
            {teacher.countryOfBirth && (
              <span className="flex items-center gap-1">
                <Globe2 size={12} /> {teacher.countryOfBirth}
              </span>
            )}
            {teacher.experienceYears != null && teacher.experienceYears > 0 && (
              <span>{teacher.experienceYears}y exp</span>
            )}
          </div>

          <span className="flex items-center gap-1 font-semibold text-myna-orange group-hover:translate-x-0.5 transition-transform">
            View <ChevronRight size={12} />
          </span>
        </div>
      </div>
    </Link>
  );
}