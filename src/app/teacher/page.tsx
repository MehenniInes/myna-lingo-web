/*"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Phone, Calendar, Clock, TrendingUp, Award, AlertTriangle, Wifi, WifiOff, Loader2 } from "lucide-react";
import { api, getUser, logout } from "@/lib/api";
import LanguageSwitcher from "@/components/LanguageSwitcher";

interface Dashboard {
  isOnline: boolean;
  applicationStatus: string;
  stats: {
    totalCalls: number;
    weekCalls: number;
    monthCalls: number;
    totalTeachingSec: number;
    weekTeachingSec: number;
    monthTeachingSec: number;
  };
 upcomingBookings: {
  id: string;
  scheduledAt: string;
  durationMin: number;
  serviceType: string;
  studentName: string;
  status: string;
}[];
  recentCalls: {
    id: string;
    startTime: string;
    durationSec: number;
    serviceType: string;
    studentName: string;
  }[];
}

function formatDuration(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TeacherDashboardPage() {
  const router = useRouter();

  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toggling, setToggling] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const u = getUser();
    if (!u) { router.push("/login"); return; }
    if (u.role !== "TEACHER") { router.push("/"); return; }
    setUser(u);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const d = await api<Dashboard>("/teachers/me/dashboard", { auth: true });
      setData(d);
    } catch (err: any) {
      setError(err.message || "Could not load dashboard");
    } finally {
      setLoading(false);
    }
  }

  async function toggleOnline() {
    if (!data) return;
    const next = !data.isOnline;
    setData({ ...data, isOnline: next });
    setToggling(true);
    try {
      await api("/teachers/me/online", {
        method: "PATCH",
        auth: true,
        body: { isOnline: next },
      });
    } catch (err: any) {
      setData({ ...data, isOnline: !next });
      setError(err.message || "Could not update status");
    } finally {
      setToggling(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center text-myna-charcoal/60">
        <Loader2 size={20} className="animate-spin" />
      </main>
    );
  }

  if (error && !data) {
    return (
      <main className="min-h-screen bg-cream flex items-center justify-center px-6">
        <div className="max-w-md text-center bg-red-50 border border-red-200 rounded-3xl p-8">
          <p className="text-red-700 text-sm">{error}</p>
          <button onClick={load} className="mt-4 px-5 py-2.5 rounded-full bg-myna-orange text-white font-semibold text-sm">
            Try again
          </button>
        </div>
      </main>
    );
  }

  if (!data) return null;

  const pending = data.applicationStatus !== "APPROVED";

  return (
    <main className="min-h-screen bg-cream">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-8">
          <div>
            <Link href="/" className="text-myna-orange font-semibold text-sm hover:underline">← Home</Link>
            <h1 className="font-display text-4xl font-bold text-myna-charcoal mt-3">Teacher Dashboard</h1>
            <p className="text-myna-charcoal/60 mt-1">
              Welcome back{user?.fullName ? `, ${user.fullName.split(" ")[0]}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <button onClick={logout} className="px-4 py-2 rounded-full border border-myna-charcoal/15 text-sm font-semibold hover:bg-white">
              Log out
            </button>
          </div>
        </div>

        {pending && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-semibold">Your application is {data.applicationStatus.toLowerCase().replace("_", " ")}</p>
              <p className="text-amber-700/80 mt-0.5">
                You can't go online until an admin approves your profile.
              </p>
              <Link href="/become-a-teacher" className="inline-block mt-2 font-semibold text-amber-900 hover:underline">
                Continue application →
              </Link>
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-sm p-6 mb-6 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition ${data.isOnline ? "bg-green-100 text-green-700" : "bg-myna-charcoal/5 text-myna-charcoal/40"}`}>
              {data.isOnline ? <Wifi size={26} /> : <WifiOff size={26} />}
            </div>
            <div>
              <p className="font-display font-bold text-lg text-myna-charcoal">
                {data.isOnline ? "You're online" : "You're offline"}
              </p>
              <p className="text-sm text-myna-charcoal/60">
                {data.isOnline ? "Students can start a live call with you." : "Turn on to accept live calls."}
              </p>
            </div>
          </div>

          <button
            onClick={toggleOnline}
            disabled={pending || toggling}
            className={`relative inline-flex h-10 w-20 items-center rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${data.isOnline ? "bg-green-500" : "bg-myna-charcoal/20"}`}
          >
            <span className={`inline-block h-8 w-8 transform rounded-full bg-white shadow transition-transform ${data.isOnline ? "translate-x-11" : "translate-x-1"}`} />
          </button>
        </div>

        {error && data && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">{error}</div>
        )}

        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <StatCard icon={<Phone size={20} />} label="Total calls" value={String(data.stats.totalCalls)} />
          <StatCard icon={<TrendingUp size={20} />} label="This week" value={String(data.stats.weekCalls)} />
          <StatCard icon={<Award size={20} />} label="This month" value={String(data.stats.monthCalls)} />
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <StatCard icon={<Clock size={20} />} label="Total teaching time" value={formatDuration(data.stats.totalTeachingSec)} />
          <StatCard icon={<Clock size={20} />} label="Teaching this week" value={formatDuration(data.stats.weekTeachingSec)} />
          <StatCard icon={<Clock size={20} />} label="Teaching this month" value={formatDuration(data.stats.monthTeachingSec)} />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <section className="bg-white rounded-3xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={16} className="text-myna-orange" />
              <h2 className="font-display font-bold text-lg text-myna-charcoal">Upcoming bookings</h2>
            </div>
            {data.upcomingBookings.length === 0 ? (
              <p className="text-sm text-myna-charcoal/50 italic">No upcoming lessons yet.</p>
            ) : (
              <ul className="space-y-3">
                {data.upcomingBookings.map((b) => (
                  <li key={b.id} className="flex items-center justify-between gap-3 pb-3 border-b border-myna-charcoal/5 last:border-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="font-semibold text-myna-charcoal truncate">{b.studentName}</p>
                      <p className="text-xs text-myna-charcoal/60 mt-0.5">{formatDate(b.scheduledAt)} · {b.durationMin}min</p>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wide bg-myna-orange/10 text-myna-orange px-2 py-1 rounded-full shrink-0">
                      {b.serviceType === "PROFESSIONAL_TEACHER" ? "Pro" : "Chat"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="bg-white rounded-3xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Phone size={16} className="text-myna-orange" />
              <h2 className="font-display font-bold text-lg text-myna-charcoal">Recent calls</h2>
            </div>
            {data.recentCalls.length === 0 ? (
              <p className="text-sm text-myna-charcoal/50 italic">No completed calls yet.</p>
            ) : (
              <ul className="space-y-3">
                {data.recentCalls.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 pb-3 border-b border-myna-charcoal/5 last:border-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="font-semibold text-myna-charcoal truncate">{c.studentName}</p>
                      <p className="text-xs text-myna-charcoal/60 mt-0.5">{formatDate(c.startTime)}</p>
                    </div>
                    <span className="text-xs font-bold text-myna-charcoal/70 tabular-nums shrink-0">
                      {formatDuration(c.durationSec)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Link href="/become-a-teacher" className="bg-white rounded-2xl shadow-sm p-5 hover:shadow-md transition">
            <p className="font-bold text-myna-charcoal">✏️ Edit profile</p>
            <p className="text-xs text-myna-charcoal/60 mt-1">Update bio, pricing, availability</p>
          </Link>
        </div>
      </div>
    </main>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <div className="flex items-center gap-2 text-myna-orange">
        {icon}
        <p className="text-[11px] font-bold uppercase tracking-wider text-myna-charcoal/50">{label}</p>
      </div>
      <p className="font-display font-bold mt-3 text-3xl text-myna-charcoal">{value}</p>
    </div>
  );
}*/
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Phone,
  Calendar,
  Clock,
  TrendingUp,
  Award,
  AlertTriangle,
  Wifi,
  WifiOff,
  Loader2,
  Check,
  X,
} from "lucide-react";
import { api, getUser, logout } from "@/lib/api";
import { useLanguage } from "@/app/language-provider";
import LanguageSwitcher from "@/components/LanguageSwitcher";

interface Booking {
  id: string;
  scheduledAt: string;
  durationMin: number;
  serviceType: string;
  studentName: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
}

interface Dashboard {
  isOnline: boolean;
  applicationStatus: string;

  stats: {
    totalCalls: number;
    weekCalls: number;
    monthCalls: number;
    totalTeachingSec: number;
    weekTeachingSec: number;
    monthTeachingSec: number;
  };

  upcomingBookings: Booking[];

  recentCalls: {
    id: string;
    startTime: string;
    durationSec: number;
    serviceType: string;
    studentName: string;
  }[];
}

function formatDuration(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);

  if (h === 0) return `${m}m`;

  return `${h}h ${m}m`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TeacherDashboardPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toggling, setToggling] = useState(false);
  const [bookingAction, setBookingAction] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const u = getUser();

    if (!u) {
      router.push("/login");
      return;
    }

    if (u.role !== "TEACHER") {
      router.push("/");
      return;
    }

    setUser(u);
    load();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setLoading(true);
    setError("");

    try {
      const d = await api<Dashboard>("/teachers/me/dashboard", {
        auth: true,
      });

      setData(d);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Could not load dashboard"
      );
    } finally {
      setLoading(false);
    }
  }

  async function toggleOnline() {
    if (!data) return;

    const next = !data.isOnline;

    setData({
      ...data,
      isOnline: next,
    });

    setToggling(true);

    try {
      await api("/teachers/me/online", {
        method: "PATCH",
        auth: true,
        body: {
          isOnline: next,
        },
      });
    } catch (err: any) {
      setData({
        ...data,
        isOnline: !next,
      });

      setError(err.message || "Could not update status");
    } finally {
      setToggling(false);
    }
  }

  async function handleBookingAction(
    bookingId: string,
    action: "accept" | "reject"
  ) {
    if (bookingAction) return;

    setBookingAction(bookingId);
    setError("");

    try {
      await api(`/bookings/${bookingId}/${action}`, {
        method: "PATCH",
        auth: true,
      });

      await load();
    } catch (err: any) {
      setError(
        err.message ||
          `Could not ${action === "accept" ? "accept" : "reject"} booking`
      );
    } finally {
      setBookingAction(null);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center text-myna-charcoal/60">
        <Loader2 size={20} className="animate-spin" />
      </main>
    );
  }

  if (error && !data) {
    return (
      <main className="min-h-screen bg-cream flex items-center justify-center px-6">
        <div className="max-w-md text-center bg-red-50 border border-red-200 rounded-3xl p-8">
          <p className="text-red-700 text-sm">{error}</p>

          <button
            onClick={load}
            className="mt-4 px-5 py-2.5 rounded-full bg-myna-orange text-white font-semibold text-sm"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  if (!data) return null;

  const pending = data.applicationStatus !== "APPROVED";

  return (
    <main className="min-h-screen bg-cream">
      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap mb-8">
          <div>
            <Link
              href="/"
              className="text-myna-orange font-semibold text-sm hover:underline"
            >
              ← Home
            </Link>

            <h1 className="font-display text-4xl font-bold text-myna-charcoal mt-3">
              Teacher Dashboard
            </h1>

            <p className="text-myna-charcoal/60 mt-1">
              Welcome back
              {user?.fullName
                ? `, ${user.fullName.split(" ")[0]}`
                : ""}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />

            <button
              onClick={logout}
              className="px-4 py-2 rounded-full border border-myna-charcoal/15 text-sm font-semibold hover:bg-white"
            >
              Log out
            </button>
          </div>
        </div>

        {/* Pending application banner */}
        {pending && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle
              size={18}
              className="text-amber-600 shrink-0 mt-0.5"
            />

            <div className="text-sm text-amber-800">
              <p className="font-semibold">
                Your application is{" "}
                {data.applicationStatus
                  .toLowerCase()
                  .replace("_", " ")}
              </p>

              <p className="text-amber-700/80 mt-0.5">
                You can&apos;t go online until an admin approves your
                profile. Finish every step of your application if you
                haven&apos;t already.
              </p>

              <Link
                href="/become-a-teacher"
                className="inline-block mt-2 font-semibold text-amber-900 hover:underline"
              >
                Continue application →
              </Link>
            </div>
          </div>
        )}

        {/* Online toggle */}
        <div className="bg-white rounded-3xl shadow-sm p-6 mb-6 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition ${
                data.isOnline
                  ? "bg-green-100 text-green-700"
                  : "bg-myna-charcoal/5 text-myna-charcoal/40"
              }`}
            >
              {data.isOnline ? (
                <Wifi size={26} />
              ) : (
                <WifiOff size={26} />
              )}
            </div>

            <div>
              <p className="font-display font-bold text-lg text-myna-charcoal">
                {data.isOnline
                  ? "You're online"
                  : "You're offline"}
              </p>

              <p className="text-sm text-myna-charcoal/60">
                {data.isOnline
                  ? "Students can start a live call with you."
                  : "Turn on to accept live calls."}
              </p>
            </div>
          </div>

          <button
            onClick={toggleOnline}
            disabled={pending || toggling}
            className={`relative inline-flex h-10 w-20 items-center rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              data.isOnline
                ? "bg-green-500"
                : "bg-myna-charcoal/20"
            }`}
            aria-pressed={data.isOnline}
          >
            <span
              className={`inline-block h-8 w-8 transform rounded-full bg-white shadow transition-transform ${
                data.isOnline
                  ? "translate-x-11"
                  : "translate-x-1"
              }`}
            />

            <span className="sr-only">
              Toggle online status
            </span>
          </button>
        </div>

        {/* Error */}
        {error && data && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Call stats */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <StatCard
            icon={<Phone size={20} />}
            label="Total calls"
            value={String(data.stats.totalCalls)}
          />

          <StatCard
            icon={<TrendingUp size={20} />}
            label="This week"
            value={String(data.stats.weekCalls)}
          />

          <StatCard
            icon={<Award size={20} />}
            label="This month"
            value={String(data.stats.monthCalls)}
          />
        </div>

        {/* Teaching time stats */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <StatCard
            icon={<Clock size={20} />}
            label="Total teaching time"
            value={formatDuration(
              data.stats.totalTeachingSec
            )}
            accent
          />

          <StatCard
            icon={<Clock size={20} />}
            label="Teaching this week"
            value={formatDuration(
              data.stats.weekTeachingSec
            )}
            accent
          />

          <StatCard
            icon={<Clock size={20} />}
            label="Teaching this month"
            value={formatDuration(
              data.stats.monthTeachingSec
            )}
            accent
          />
        </div>

        {/* Two-column lists */}
        <div className="grid gap-6 md:grid-cols-2">

          {/* Upcoming bookings */}
          <section className="bg-white rounded-3xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar
                size={16}
                className="text-myna-orange"
              />

              <h2 className="font-display font-bold text-lg text-myna-charcoal">
                Upcoming bookings
              </h2>
            </div>

            {data.upcomingBookings.length === 0 ? (
              <p className="text-sm text-myna-charcoal/50 italic">
                No upcoming lessons yet.
              </p>
            ) : (
              <ul className="space-y-4">
                {data.upcomingBookings.map((b) => (
                  <li
                    key={b.id}
                    className="pb-4 border-b border-myna-charcoal/5 last:border-0 last:pb-0"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-myna-charcoal truncate">
                          {b.studentName}
                        </p>

                        <p className="text-xs text-myna-charcoal/60 mt-1">
                          {formatDate(b.scheduledAt)}
                        </p>

                        <p className="text-xs text-myna-charcoal/50 mt-1">
                          {b.durationMin} minutes
                        </p>
                      </div>

                      <span
                        className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full shrink-0 ${
                          b.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-700"
                            : b.status === "CONFIRMED"
                            ? "bg-green-100 text-green-700"
                            : b.status === "CANCELLED"
                            ? "bg-red-100 text-red-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>

                    {/* Booking actions */}
                    {b.status === "PENDING" && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() =>
                            handleBookingAction(
                              b.id,
                              "accept"
                            )
                          }
                          disabled={bookingAction === b.id}
                          className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {bookingAction === b.id ? (
                            <Loader2
                              size={15}
                              className="animate-spin"
                            />
                          ) : (
                            <Check size={15} />
                          )}

                          Accept
                        </button>

                        <button
                          onClick={() =>
                            handleBookingAction(
                              b.id,
                              "reject"
                            )
                          }
                          disabled={bookingAction === b.id}
                          className="flex-1 py-2.5 rounded-xl bg-red-50 text-red-600 border border-red-200 text-sm font-semibold hover:bg-red-100 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          <X size={15} />
                          Reject
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Recent calls */}
          <section className="bg-white rounded-3xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Phone
                size={16}
                className="text-myna-orange"
              />

              <h2 className="font-display font-bold text-lg text-myna-charcoal">
                Recent calls
              </h2>
            </div>

            {data.recentCalls.length === 0 ? (
              <p className="text-sm text-myna-charcoal/50 italic">
                No completed calls yet.
              </p>
            ) : (
              <ul className="space-y-3">
                {data.recentCalls.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between gap-3 pb-3 border-b border-myna-charcoal/5 last:border-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-myna-charcoal truncate">
                        {c.studentName}
                      </p>

                      <p className="text-xs text-myna-charcoal/60 mt-0.5">
                        {formatDate(c.startTime)}
                      </p>
                    </div>

                    <span className="text-xs font-bold text-myna-charcoal/70 tabular-nums shrink-0">
                      {formatDuration(c.durationSec)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Quick links */}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Link
            href="/become-a-teacher"
            className="bg-white rounded-2xl shadow-sm p-5 hover:shadow-md transition"
          >
            <p className="font-bold text-myna-charcoal">
              ✏️ Edit profile
            </p>

            <p className="text-xs text-myna-charcoal/60 mt-1">
              Update bio, pricing, availability
            </p>
          </Link>

          <Link
            href="/teachers/me"
            className="bg-white rounded-2xl shadow-sm p-5 hover:shadow-md transition opacity-50 pointer-events-none"
            aria-disabled
          >
            <p className="font-bold text-myna-charcoal">
              👁 View public profile
            </p>

            <p className="text-xs text-myna-charcoal/60 mt-1">
              Coming soon
            </p>
          </Link>

          <Link
            href="/teacher/payments"
            className="bg-white rounded-2xl shadow-sm p-5 hover:shadow-md transition opacity-50 pointer-events-none"
            aria-disabled
          >
            <p className="font-bold text-myna-charcoal">
              💳 Payments
            </p>

            <p className="text-xs text-myna-charcoal/60 mt-1">
              Coming soon
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <div className="flex items-center gap-2 text-myna-orange">
        {icon}

        <p className="text-[11px] font-bold uppercase tracking-wider text-myna-charcoal/50">
          {label}
        </p>
      </div>

      <p
        className={`font-display font-bold mt-3 text-myna-charcoal ${
          accent ? "text-3xl" : "text-3xl"
        }`}
      >
        {value}
      </p>
    </div>
  );
}