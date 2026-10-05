
"use client";
import { api, getUser, logout } from "@/lib/api";
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
  Loader2,
} from "lucide-react";
import { api, getUser, logout } from "@/lib/api";
import { useLanguage } from "@/app/language-provider";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import OnlineToggle from "@/components/OnlineToggle";

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
  const { t } = useLanguage();

  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState<any>(null);
  const [incomingCall, setIncomingCall] = useState<any>(null);

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
    useEffect(() => {
    const check = async () => {
      try {
        const c = await api<any>("/calls/active-for-teacher", { auth: true });
        setIncomingCall(c ?? null);
      } catch {
        // silent
      }
    };
    check();
    const id = setInterval(check, 5000);
    return () => clearInterval(id);
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
        err instanceof Error
          ? err.message
          : "Could not load dashboard",
      );
    } finally {
      setLoading(false);
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

          <div className="flex items-center gap-3 flex-wrap">
            <OnlineToggle
              isOnline={data.isOnline}
              disabled={pending}
              onChange={(value) => {
                setData((current) =>
                  current
                    ? {
                        ...current,
                        isOnline: value,
                      }
                    : current,
                );
              }}
            />

            <LanguageSwitcher />

            <button
              onClick={logout}
              className="px-4 py-2 rounded-full border border-myna-charcoal/15 text-sm font-semibold hover:bg-white"
            >
              Log out
            </button>
          </div>
        </div>
        {incomingCall && (
          <a
            href={`/teacher/call/${incomingCall.id}`}
            className="block mb-6 rounded-2xl bg-myna-orange text-white p-5 shadow-md hover:bg-myna-orange/90 transition"
          >
            <div className="flex items-center gap-4">
              <span className="w-3 h-3 rounded-full bg-white animate-pulse" />
              <div className="flex-1">
                <p className="font-bold">📞 Incoming call from {incomingCall.student?.user?.fullName ?? "a student"}</p>
                <p className="text-xs text-white/80 mt-0.5">Click to join the video call now.</p>
              </div>
              <span className="font-bold text-sm bg-white text-myna-orange px-4 py-2 rounded-full">
                Join now
              </span>
            </div>
          </a>
        )}
        {/* Pending banner */}
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

        {error && data && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Stats — calls */}
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

        {/* Stats — teaching time */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <StatCard
            icon={<Clock size={20} />}
            label="Total teaching time"
            value={formatDuration(data.stats.totalTeachingSec)}
            accent
          />

          <StatCard
            icon={<Clock size={20} />}
            label="Teaching this week"
            value={formatDuration(data.stats.weekTeachingSec)}
            accent
          />

          <StatCard
            icon={<Clock size={20} />}
            label="Teaching this month"
            value={formatDuration(data.stats.monthTeachingSec)}
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
              <ul className="space-y-3">
                {data.upcomingBookings.map((b) => (
                  <li
                    key={b.id}
                    className="flex items-center justify-between gap-3 pb-3 border-b border-myna-charcoal/5 last:border-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-myna-charcoal truncate">
                        {b.studentName}
                      </p>

                      <p className="text-xs text-myna-charcoal/60 mt-0.5">
                        {formatDate(b.scheduledAt)} ·{" "}
                        {b.durationMin}min
                      </p>
                    </div>

                    <span className="text-[10px] font-bold uppercase tracking-wide bg-myna-orange/10 text-myna-orange px-2 py-1 rounded-full shrink-0">
                      {b.serviceType ===
                      "PROFESSIONAL_TEACHER"
                        ? "Pro"
                        : "Chat"}
                    </span>
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
            href={`/teachers/${"me"}`}
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