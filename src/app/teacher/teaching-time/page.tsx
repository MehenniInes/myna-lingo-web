"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Loader2, Clock, TrendingUp, Award, BookOpen,
} from "lucide-react";
import { api, getUser } from "@/lib/api";

interface DailyBucket {
  date: string;
  seconds: number;
}

interface LedgerEntry {
  id: string;
  type: string;
  seconds: number;
  balanceAfter: number;
  referenceId: string | null;
  note: string | null;
  createdAt: string;
}

interface Breakdown {
  allTimeSec: number;
  weekSec: number;
  monthSec: number;
  dailyLast30: DailyBucket[];
  ledger: LedgerEntry[];
}

function fmtDuration(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    day: "2-digit", month: "short",
    hour: "2-digit", minute: "2-digit",
  });
}

function typeLabel(t: string) {
  switch (t) {
    case "LESSON_COMPLETED": return "Lesson completed";
    case "PAYMENT_REQUESTED": return "Payment requested";
    case "TIME_FROZEN": return "Time frozen";
    case "PAYMENT_COMPLETED": return "Payment completed";
    case "ADMIN_ADJUSTMENT": return "Admin adjustment";
    default: return t;
  }
}

function typeColor(t: string) {
  switch (t) {
    case "LESSON_COMPLETED": return "bg-green-50 text-green-700 border-green-200";
    case "PAYMENT_REQUESTED": return "bg-amber-50 text-amber-700 border-amber-200";
    case "TIME_FROZEN": return "bg-blue-50 text-blue-700 border-blue-200";
    case "PAYMENT_COMPLETED": return "bg-purple-50 text-purple-700 border-purple-200";
    case "ADMIN_ADJUSTMENT": return "bg-myna-charcoal/5 text-myna-charcoal/70 border-myna-charcoal/10";
    default: return "bg-myna-charcoal/5 text-myna-charcoal/70 border-myna-charcoal/10";
  }
}

export default function TeachingTimePage() {
  const router = useRouter();
  const [data, setData] = useState<Breakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const user = getUser();
    if (!user) { router.push("/login"); return; }
    if (user.role !== "TEACHER") { router.push("/"); return; }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const d = await api<Breakdown>("/teachers/me/teaching-time", { auth: true });
      setData(d);
    } catch (err: any) {
      setError(err.message || "Could not load teaching time");
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

  const maxBar = Math.max(60, ...data.dailyLast30.map((d) => d.seconds));

  return (
    <main className="min-h-screen bg-cream">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <Link
          href="/teacher"
          className="inline-flex items-center gap-1 text-myna-orange font-semibold text-sm hover:underline"
        >
          <ArrowLeft size={14} /> Back to dashboard
        </Link>

        <div className="mt-4">
          <h1 className="font-display text-4xl font-bold text-myna-charcoal">Teaching time</h1>
          <p className="text-myna-charcoal/60 mt-2">
            Server-tracked minutes you&apos;ve taught. Only completed lessons count.
          </p>
        </div>

        {/* Top stat cards */}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <StatCard
            icon={<Clock size={20} />}
            label="All time"
            value={fmtDuration(data.allTimeSec)}
          />
          <StatCard
            icon={<TrendingUp size={20} />}
            label="This week"
            value={fmtDuration(data.weekSec)}
            accent
          />
          <StatCard
            icon={<Award size={20} />}
            label="This month"
            value={fmtDuration(data.monthSec)}
            accent
          />
        </div>

        {/* Daily bars — last 30 days */}
        <section className="mt-10 bg-white rounded-3xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <BookOpen size={16} className="text-myna-orange" />
            <h2 className="font-display font-bold text-lg text-myna-charcoal">Last 30 days</h2>
          </div>

          <div className="flex items-end gap-1 h-32">
            {data.dailyLast30.map((d) => {
              const pct = maxBar === 0 ? 0 : (d.seconds / maxBar) * 100;
              return (
                <div
                  key={d.date}
                  className="flex-1 group relative"
                  title={`${fmtDate(d.date)}: ${fmtDuration(d.seconds)}`}
                >
                  <div
                    className={`w-full rounded-t transition-all ${
                      d.seconds === 0 ? "bg-myna-charcoal/5" : "bg-myna-orange"
                    }`}
                    style={{ height: `${Math.max(2, pct)}%` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] text-myna-charcoal/40 mt-2">
            <span>{fmtDate(data.dailyLast30[0]?.date ?? "")}</span>
            <span>Today</span>
          </div>
        </section>

        {/* Ledger table */}
        <section className="mt-10">
          <h2 className="font-display text-2xl font-bold text-myna-charcoal mb-4">
            Recent ledger activity
          </h2>

          {data.ledger.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-sm p-8 text-center">
              <p className="text-myna-charcoal/60 text-sm">
                No teaching time yet. Once you complete a lesson, it&apos;ll show up here.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
              {data.ledger.map((e, i) => (
                <div
                  key={e.id}
                  className={`flex items-center justify-between gap-4 p-5 ${
                    i !== data.ledger.length - 1 ? "border-b border-cream" : ""
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${typeColor(e.type)}`}>
                        {typeLabel(e.type)}
                      </span>
                      {e.note && (
                        <span className="text-xs text-myna-charcoal/50 truncate">· {e.note}</span>
                      )}
                    </div>
                    <p className="text-xs text-myna-charcoal/40 mt-1.5">{fmtTime(e.createdAt)}</p>
                  </div>
                  <div className="text-end shrink-0">
                    <p className={`font-display text-xl font-bold tabular-nums ${
                      e.seconds >= 0 ? "text-myna-orange" : "text-red-600"
                    }`}>
                      {e.seconds >= 0 ? "+" : ""}{fmtDuration(Math.abs(e.seconds))}
                    </p>
                    <p className="text-[10px] text-myna-charcoal/40">
                      bal {fmtDuration(e.balanceAfter)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function StatCard({
  icon, label, value, accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <div className={`flex items-center gap-2 ${accent ? "text-myna-orange" : "text-myna-charcoal/50"}`}>
        {icon}
        <p className="text-[11px] font-bold uppercase tracking-wider">{label}</p>
      </div>
      <p className={`font-display font-bold mt-3 text-3xl ${accent ? "text-myna-orange" : "text-myna-charcoal"}`}>
        {value}
      </p>
    </div>
  );
}