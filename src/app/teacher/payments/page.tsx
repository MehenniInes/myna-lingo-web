"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, Loader2, Wallet, Clock, CheckCircle2, Send, AlertCircle, Lock,
} from "lucide-react";
import { api, getUser } from "@/lib/api";
import { useLanguage } from "@/app/language-provider";

interface PaymentRequest {
  id: string;
  frozenSeconds: number;
  payoutDA: number | null;
  status: string;
  requestedAt: string;
  approvedAt: string | null;
  paidAt: string | null;
}

interface Summary {
  availableSeconds: number;
  pendingSeconds: number;
  approvedSeconds: number;
  paidSeconds: number;
  totalEarnedSeconds: number;
  totalPaidDA: number;
  internalHourlyRateDA: number;
  estimatedPayoutDA: number;
  requests: PaymentRequest[];
}

export default function TeacherPaymentsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

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
      const d = await api<Summary>("/teacher-payments/me", { auth: true });
      setData(d);
    } catch (err: any) {
      setError(err.message || "Could not load payments");
    } finally {
      setLoading(false);
    }
  }

  async function requestPayment() {
    if (!confirm("Freeze all available time into a new payment request?")) return;
    setRequesting(true);
    setError(""); setMsg("");
    try {
      await api("/teacher-payments/request", { method: "POST", auth: true });
      setMsg("✅ Payment request created. Waiting for admin approval.");
      await load();
    } catch (err: any) {
      setError(err.message || "Could not request payment");
    } finally {
      setRequesting(false);
    }
  }

  function fmtDuration(sec: number) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
  }

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    });
  }

  function statusLabel(s: string) {
    if (s === "PENDING") return t("tpay.statusPending");
    if (s === "APPROVED") return t("tpay.statusApproved");
    if (s === "PAID") return t("tpay.statusPaid");
    if (s === "REJECTED") return t("tpay.statusRejected");
    return t("tpay.statusCancelled");
  }

  function statusColor(s: string) {
    if (s === "PENDING") return "bg-amber-50 text-amber-700 border-amber-200";
    if (s === "APPROVED") return "bg-blue-50 text-blue-700 border-blue-200";
    if (s === "PAID") return "bg-green-50 text-green-700 border-green-200";
    if (s === "REJECTED") return "bg-red-50 text-red-700 border-red-200";
    return "bg-myna-charcoal/5 text-myna-charcoal/60 border-myna-charcoal/10";
  }

  if (loading) {
    return <main className="min-h-screen flex items-center justify-center text-myna-charcoal/60"><Loader2 size={20} className="animate-spin" /></main>;
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

  const hasActive = data.requests.some((r) => r.status === "PENDING" || r.status === "APPROVED");

  return (
    <main className="min-h-screen bg-cream">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <Link href="/teacher" className="inline-flex items-center gap-1 text-myna-orange font-semibold text-sm hover:underline">
          <ChevronLeft size={14} /> Back to dashboard
        </Link>

        <div className="mt-4">
          <h1 className="font-display text-4xl font-bold text-myna-charcoal">{t("tpay.title")}</h1>
          <p className="text-myna-charcoal/60 mt-2">{t("tpay.subtitle")}</p>
        </div>

        {msg && (
          <div className="mt-6 p-3 bg-green-50 border border-green-200 rounded-2xl text-green-800 text-sm">{msg}</div>
        )}
        {error && (
          <div className="mt-6 p-3 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">{error}</div>
        )}

        {/* Stat cards */}
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={<Wallet size={18} />} label={t("tpay.available")} value={fmtDuration(data.availableSeconds)} accent />
          <StatCard icon={<Clock size={18} />} label={t("tpay.pending")} value={fmtDuration(data.pendingSeconds)} />
          <StatCard icon={<CheckCircle2 size={18} />} label={t("tpay.approved")} value={fmtDuration(data.approvedSeconds)} />
          <StatCard icon={<CheckCircle2 size={18} />} label={t("tpay.paid")} value={fmtDuration(data.paidSeconds)} />
        </div>

        {/* Payout estimate + request */}
        <div className="mt-6 bg-white rounded-3xl shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-myna-charcoal/40 flex items-center gap-1">
                <Lock size={10} /> {t("tpay.estimatedPayout")}
              </p>
              <p className="font-display text-3xl font-bold text-myna-orange mt-1">
                {data.estimatedPayoutDA.toLocaleString()} DA
              </p>
              <p className="text-xs text-myna-charcoal/50 mt-1">
                {t("tpay.rate")}: {data.internalHourlyRateDA} {t("tpay.perHour")}
              </p>
            </div>
            <div className="shrink-0">
              <button
                onClick={requestPayment}
                disabled={requesting || hasActive || data.availableSeconds < 60}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-myna-orange text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {requesting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {requesting ? t("tpay.requesting") : t("tpay.requestBtn")}
              </button>
              <p className="text-xs text-myna-charcoal/50 mt-2 max-w-xs text-end md:text-end">
                {hasActive ? t("tpay.alreadyActive") : t("tpay.requestHint")}
              </p>
            </div>
          </div>
        </div>

        {/* History */}
        <h2 className="font-display text-2xl font-bold text-myna-charcoal mt-10 mb-4">
          {t("tpay.history")}
        </h2>

        {data.requests.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm p-8 text-center">
            <p className="text-myna-charcoal/60 text-sm">{t("tpay.noHistory")}</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
            {data.requests.map((r, i) => (
              <div
                key={r.id}
                className={`flex items-center justify-between gap-4 p-5 ${i !== data.requests.length - 1 ? "border-b border-cream" : ""}`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${statusColor(r.status)}`}>
                      {statusLabel(r.status)}
                    </span>
                    <span className="text-xs text-myna-charcoal/50">
                      {fmtDate(r.requestedAt)}
                    </span>
                  </div>
                  <p className="text-sm text-myna-charcoal/70 mt-1.5">
                    {fmtDuration(r.frozenSeconds)} {t("tpay.frozen")}
                  </p>
                </div>
                <div className="text-end shrink-0">
                  <p className={`font-display text-xl font-bold ${r.payoutDA ? "text-myna-orange" : "text-myna-charcoal/40"}`}>
                    {r.payoutDA != null ? `${r.payoutDA} DA` : "—"}
                  </p>
                  {r.paidAt && (
                    <p className="text-[10px] text-myna-charcoal/40 mt-0.5">
                      Paid {fmtDate(r.paidAt)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <div className={`flex items-center gap-2 ${accent ? "text-myna-orange" : "text-myna-charcoal/50"}`}>
        {icon}
        <p className="text-[11px] font-bold uppercase tracking-wider">{label}</p>
      </div>
      <p className={`font-display font-bold mt-3 text-2xl ${accent ? "text-myna-orange" : "text-myna-charcoal"}`}>
        {value}
      </p>
    </div>
  );
}