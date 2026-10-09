"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, Loader2, PhoneCall, Clock, Users, TrendingUp, Activity,
} from "lucide-react";
import { api, getUser } from "@/lib/api";

interface CallRow {
  id: string;
  startTime: string;
  endTime: string | null;
  durationSec: number;
  status: string;
  serviceType: string;
  agoraChannelId: string | null;
  student: { user: { fullName: string; email: string } };
  teacher: { user: { fullName: string; email: string } };
}

interface CallStats {
  activeCalls: number;
  today: { calls: number; seconds: number };
  week: { calls: number; seconds: number };
  total: { calls: number; seconds: number };
}

function fmtDuration(sec: number) {
  if (sec < 60) return `${sec}s`;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function statusBadge(s: string) {
  switch (s) {
    case "ACTIVE": return "bg-green-50 text-green-700 border-green-200";
    case "COMPLETED": return "bg-blue-50 text-blue-700 border-blue-200";
    case "CANCELLED": return "bg-red-50 text-red-700 border-red-200";
    default: return "bg-myna-charcoal/5 text-myna-charcoal/60 border-myna-charcoal/10";
  }
}

export default function AdminAgoraPage() {
  const router = useRouter();
  const [calls, setCalls] = useState<CallRow[]>([]);
  const [stats, setStats] = useState<CallStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("ALL");

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
      const qs = status && status !== "ALL" ? `?status=${status}` : "";
      const [c, s] = await Promise.all([
        api<CallRow[]>(`/admin/calls${qs}`, { auth: true }),
        api<CallStats>("/admin/calls/stats", { auth: true }),
      ]);
      setCalls(c);
      setStats(s);
    } catch (err: any) {
      setError(err.message || "Could not load call data");
    } finally {
      setLoading(false);
    }
  }

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
          <h1 className="font-display text-4xl font-bold text-myna-charcoal">Agora call monitoring</h1>
          <p className="text-myna-charcoal/60 mt-2">
            Live call usage, durations, and participants
          </p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <StatCard
              icon={<Activity size={18} />}
              label="Active now"
              value={String(stats.activeCalls)}
              accent={stats.activeCalls > 0}
            />
            <StatCard
              icon={<Clock size={18} />}
              label="Today"
              value={fmtDuration(stats.today.seconds)}
              sub={`${stats.today.calls} call${stats.today.calls !== 1 ? "s" : ""}`}
            />
            <StatCard
              icon={<TrendingUp size={18} />}
              label="This week"
              value={fmtDuration(stats.week.seconds)}
              sub={`${stats.week.calls} call${stats.week.calls !== 1 ? "s" : ""}`}
            />
            <StatCard
              icon={<Users size={18} />}
              label="All time"
              value={fmtDuration(stats.total.seconds)}
              sub={`${stats.total.calls} call${stats.total.calls !== 1 ? "s" : ""}`}
            />
          </div>
        )}

        {/* Filter */}
        <div className="mt-6 flex items-center gap-2 flex-wrap">
          {["ALL", "ACTIVE", "COMPLETED", "CANCELLED"].map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-4 py-2 rounded-xl text-xs font-bold border border-myna-charcoal transition-colors ${
                status === s
                  ? "bg-myna-charcoal text-white"
                  : "bg-white text-myna-charcoal hover:bg-myna-charcoal/5"
              }`}
            >
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="mt-8 flex justify-center text-myna-charcoal/60">
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : calls.length === 0 ? (
          <div className="mt-8 bg-white rounded-3xl shadow-sm p-12 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-myna-yellow/30 text-myna-orange flex items-center justify-center">
              <PhoneCall size={24} />
            </div>
            <p className="font-display text-xl font-bold text-myna-charcoal mt-4">
              No calls {status !== "ALL" ? `with status ${status.toLowerCase()}` : "yet"}
            </p>
            <p className="text-myna-charcoal/60 text-sm mt-2">
              Call activity will appear here.
            </p>
          </div>
        ) : (
          <div className="mt-6 bg-white rounded-3xl shadow-sm overflow-hidden">
            <div className="hidden md:grid grid-cols-12 gap-3 px-5 py-3 border-b border-cream text-[10px] font-bold uppercase tracking-wider text-myna-charcoal/40">
              <div className="col-span-3">Student</div>
              <div className="col-span-3">Teacher</div>
              <div className="col-span-2">Started</div>
              <div className="col-span-2">Duration</div>
              <div className="col-span-2 text-end">Status</div>
            </div>
            {calls.map((c, i) => (
              <div
                key={c.id}
                className={`grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-3 px-5 py-4 ${
                  i !== calls.length - 1 ? "border-b border-cream" : ""
                }`}
              >
                <div className="md:col-span-3 min-w-0">
                  <p className="font-semibold text-myna-charcoal text-sm truncate">
                    {c.student.user.fullName}
                  </p>
                  <p className="text-[11px] text-myna-charcoal/50 truncate">
                    {c.student.user.email}
                  </p>
                </div>
                <div className="md:col-span-3 min-w-0">
                  <p className="font-semibold text-myna-charcoal text-sm truncate">
                    {c.teacher.user.fullName}
                  </p>
                  <p className="text-[11px] text-myna-charcoal/50 truncate">
                    {c.teacher.user.email}
                  </p>
                </div>
                <div className="md:col-span-2 text-xs text-myna-charcoal/60">
                  {fmtDate(c.startTime)}
                </div>
                <div className="md:col-span-2 text-sm font-semibold text-myna-charcoal tabular-nums">
                  {fmtDuration(c.durationSec)}
                </div>
                <div className="md:col-span-2 md:text-end">
                  <span className={`inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${statusBadge(c.status)}`}>
                    {c.status}
                  </span>
                </div>
                <div className="md:col-span-12 text-[10px] font-mono text-myna-charcoal/30 md:mt-0 mt-1 truncate">
                  channel: {c.agoraChannelId ?? "—"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function StatCard({
  icon, label, value, sub, accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <div className={`flex items-center gap-2 ${accent ? "text-green-600" : "text-myna-orange"}`}>
        {icon}
        <p className="text-[11px] font-bold uppercase tracking-wider text-myna-charcoal/50">{label}</p>
      </div>
      <p className="font-display font-bold text-2xl text-myna-charcoal mt-2">{value}</p>
      {sub && <p className="text-xs text-myna-charcoal/50 mt-1">{sub}</p>}
    </div>
  );
}