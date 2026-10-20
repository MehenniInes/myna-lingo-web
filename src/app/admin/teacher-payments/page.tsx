"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, Loader2, CheckCircle2, DollarSign, XCircle, Lock,
} from "lucide-react";
import { api, getUser } from "@/lib/api";
import { useLanguage } from "@/app/language-provider";

interface Request {
  id: string;
  frozenSeconds: number;
  payoutDA: number | null;
  status: string;
  requestedAt: string;
  approvedAt: string | null;
  paidAt: string | null;
  note: string | null;
  teacher: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    internalHourlyRateDA: number | null;
    user: { fullName: string; email: string };
  };
}

export default function AdminTeacherPaymentsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<string>("ALL");
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    const u = getUser();
    if (!u) { router.push("/login"); return; }
    if (u.role !== "ADMIN") { router.push("/"); return; }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function load() {
    setLoading(true); setError("");
    try {
      const qs = filter !== "ALL" ? `?status=${filter}` : "";
      const data = await api<Request[]>(`/teacher-payments${qs}`, { auth: true });
      setRequests(data);
    } catch (err: any) {
      setError(err.message || "Could not load requests");
    } finally {
      setLoading(false);
    }
  }

  async function action(id: string, kind: "approve" | "mark-paid" | "reject") {
    setActing(id); setError("");
    try {
      await api(`/teacher-payments/${id}/${kind}`, { method: "PATCH", auth: true });
      await load();
    } catch (err: any) {
      setError(err.message || "Action failed");
    } finally {
      setActing(null);
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
    if (s === "PENDING") return t("atp.pending");
    if (s === "APPROVED") return t("atp.approved");
    if (s === "PAID") return t("atp.paid");
    if (s === "REJECTED") return t("atp.rejected");
    return s;
  }

  function statusColor(s: string) {
    if (s === "PENDING") return "bg-amber-50 text-amber-700 border-amber-200";
    if (s === "APPROVED") return "bg-blue-50 text-blue-700 border-blue-200";
    if (s === "PAID") return "bg-green-50 text-green-700 border-green-200";
    if (s === "REJECTED") return "bg-red-50 text-red-700 border-red-200";
    return "bg-myna-charcoal/5 text-myna-charcoal/60 border-myna-charcoal/10";
  }

  return (
    <main className="min-h-screen bg-cream">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <Link href="/admin" className="inline-flex items-center gap-1 text-myna-orange font-semibold text-sm hover:underline">
          <ChevronLeft size={14} /> Back to admin
        </Link>

        <div className="mt-4">
          <h1 className="font-display text-4xl font-bold text-myna-charcoal">{t("atp.title")}</h1>
          <p className="text-myna-charcoal/60 mt-2">{t("atp.subtitle")}</p>
        </div>

        <div className="mt-6 flex items-center gap-2 flex-wrap">
          {[
            ["ALL", t("atp.all")],
            ["PENDING", t("atp.pending")],
            ["APPROVED", t("atp.approved")],
            ["PAID", t("atp.paid")],
            ["REJECTED", t("atp.rejected")],
          ].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={`px-4 py-2 rounded-xl text-xs font-bold border border-myna-charcoal transition-colors ${
                filter === val
                  ? "bg-myna-charcoal text-white"
                  : "bg-white text-myna-charcoal hover:bg-myna-charcoal/5"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">{error}</div>
        )}

        {loading ? (
          <div className="mt-8 flex justify-center text-myna-charcoal/60">
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : requests.length === 0 ? (
          <div className="mt-8 bg-white rounded-3xl shadow-sm p-12 text-center">
            <p className="font-display text-xl font-bold text-myna-charcoal">{t("atp.none")}</p>
          </div>
        ) : (
          <div className="mt-6 bg-white rounded-3xl shadow-sm overflow-hidden">
            <div className="hidden md:grid grid-cols-12 gap-3 px-5 py-3 border-b border-cream text-[10px] font-bold uppercase tracking-wider text-myna-charcoal/40">
              <div className="col-span-3">{t("atp.teacher")}</div>
              <div className="col-span-2">{t("atp.frozen")}</div>
              <div className="col-span-2">{t("atp.payout")}</div>
              <div className="col-span-2">{t("atp.requested")}</div>
              <div className="col-span-1">{t("atp.status")}</div>
              <div className="col-span-2 text-end">{t("atp.actions")}</div>
            </div>
            {requests.map((r, i) => {
              const displayName =
                [r.teacher.firstName, r.teacher.lastName].filter(Boolean).join(" ") ||
                r.teacher.user.fullName;
              const isActing = acting === r.id;
              return (
                <div
                  key={r.id}
                  className={`grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-3 px-5 py-4 ${i !== requests.length - 1 ? "border-b border-cream" : ""}`}
                >
                  <div className="md:col-span-3 min-w-0">
                    <p className="font-semibold text-myna-charcoal text-sm truncate">{displayName}</p>
                    <p className="text-[11px] text-myna-charcoal/50 truncate">{r.teacher.user.email}</p>
                    <p className="text-[10px] text-myna-charcoal/40 mt-0.5 flex items-center gap-1">
                      <Lock size={9} /> {r.teacher.internalHourlyRateDA ?? t("atp.notSet")} DA/h
                    </p>
                  </div>
                  <div className="md:col-span-2 text-sm text-myna-charcoal/70">
                    {fmtDuration(r.frozenSeconds)}
                  </div>
                  <div className="md:col-span-2">
                    <p className={`font-display text-lg font-bold ${r.payoutDA ? "text-myna-orange" : "text-myna-charcoal/40"}`}>
                      {r.payoutDA != null ? `${r.payoutDA} DA` : "—"}
                    </p>
                  </div>
                  <div className="md:col-span-2 text-xs text-myna-charcoal/60">
                    {fmtDate(r.requestedAt)}
                  </div>
                  <div className="md:col-span-1">
                    <span className={`inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${statusColor(r.status)}`}>
                      {statusLabel(r.status)}
                    </span>
                  </div>
                  <div className="md:col-span-2 flex md:justify-end gap-1 flex-wrap">
                    {r.status === "PENDING" && (
                      <>
                        <button
                          onClick={() => action(r.id, "approve")}
                          disabled={isActing}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold hover:bg-blue-100 disabled:opacity-50"
                        >
                          {isActing ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />}
                          {t("atp.approve")}
                        </button>
                        <button
                          onClick={() => action(r.id, "reject")}
                          disabled={isActing}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200 text-xs font-semibold hover:bg-red-100 disabled:opacity-50"
                        >
                          <XCircle size={11} />
                          {t("atp.reject")}
                        </button>
                      </>
                    )}
                    {r.status === "APPROVED" && (
                      <button
                        onClick={() => action(r.id, "mark-paid")}
                        disabled={isActing}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-50 text-green-700 border border-green-200 text-xs font-semibold hover:bg-green-100 disabled:opacity-50"
                      >
                        {isActing ? <Loader2 size={11} className="animate-spin" /> : <DollarSign size={11} />}
                        {t("atp.markPaid")}
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