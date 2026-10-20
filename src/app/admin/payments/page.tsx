"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, Loader2, CheckCircle2, RotateCcw,
} from "lucide-react";
import { api, getUser } from "@/lib/api";
import { useLanguage } from "@/app/language-provider";

interface Payment {
  id: string;
  amountDA: number;
  currency: string;
  productType: string;
  referenceLabel: string | null;
  status: string;
  paidAt: string | null;
  createdAt: string;
  chargilyCheckoutId: string | null;
  user: { id: string; fullName: string; email: string };
}

export default function AdminPaymentsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [payments, setPayments] = useState<Payment[]>([]);
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
      const data = await api<Payment[]>(`/payments/admin/all${qs}`, { auth: true });
      setPayments(data);
    } catch (err: any) {
      setError(err.message || "Could not load payments");
    } finally {
      setLoading(false);
    }
  }

  async function activate(id: string) {
    if (!confirm("Manually credit this payment? Minutes will be added to the student.")) return;
    setActing(id); setError("");
    try {
      await api(`/payments/admin/${id}/activate`, { method: "POST", auth: true });
      await load();
    } catch (err: any) {
      setError(err.message || "Activation failed");
    } finally {
      setActing(null);
    }
  }

  async function refund(id: string) {
    if (!confirm("Refund this payment? Minutes will be deducted from the student.")) return;
    setActing(id); setError("");
    try {
      await api(`/payments/admin/${id}/refund`, { method: "POST", auth: true });
      await load();
    } catch (err: any) {
      setError(err.message || "Refund failed");
    } finally {
      setActing(null);
    }
  }

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  }

  function statusLabel(s: string) {
    if (s === "PENDING") return "Pending";
    if (s === "SUCCESS") return "Success";
    if (s === "FAILED") return "Failed";
    if (s === "CANCELLED") return "Cancelled";
    if (s === "REFUNDED") return "Refunded";
    return s;
  }

  function statusColor(s: string) {
    if (s === "PENDING") return "bg-amber-50 text-amber-700 border-amber-200";
    if (s === "SUCCESS") return "bg-green-50 text-green-700 border-green-200";
    if (s === "FAILED") return "bg-red-50 text-red-700 border-red-200";
    if (s === "CANCELLED") return "bg-myna-charcoal/5 text-myna-charcoal/60 border-myna-charcoal/10";
    if (s === "REFUNDED") return "bg-purple-50 text-purple-700 border-purple-200";
    return "bg-myna-charcoal/5 text-myna-charcoal/60 border-myna-charcoal/10";
  }

  return (
    <main className="min-h-screen bg-cream">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <Link href="/admin" className="inline-flex items-center gap-1 text-myna-orange font-semibold text-sm hover:underline">
          <ChevronLeft size={14} /> Back to admin
        </Link>

        <div className="mt-4">
          <h1 className="font-display text-4xl font-bold text-myna-charcoal">Student payments</h1>
          <p className="text-myna-charcoal/60 mt-2">Review payments and manually activate or refund.</p>
        </div>

        <div className="mt-6 flex items-center gap-2 flex-wrap">
          {["ALL", "PENDING", "SUCCESS", "FAILED", "REFUNDED"].map((val) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={`px-4 py-2 rounded-xl text-xs font-bold border border-myna-charcoal transition-colors ${
                filter === val
                  ? "bg-myna-charcoal text-white"
                  : "bg-white text-myna-charcoal hover:bg-myna-charcoal/5"
              }`}
            >
              {val === "ALL" ? "All" : val.charAt(0) + val.slice(1).toLowerCase()}
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
        ) : payments.length === 0 ? (
          <div className="mt-8 bg-white rounded-3xl shadow-sm p-12 text-center">
            <p className="font-display text-xl font-bold text-myna-charcoal">No payments</p>
          </div>
        ) : (
          <div className="mt-6 bg-white rounded-3xl shadow-sm overflow-hidden">
            <div className="hidden md:grid grid-cols-12 gap-3 px-5 py-3 border-b border-cream text-[10px] font-bold uppercase tracking-wider text-myna-charcoal/40">
              <div className="col-span-3">Student</div>
              <div className="col-span-2">Product</div>
              <div className="col-span-2">Amount</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-2 text-end">Actions</div>
            </div>
            {payments.map((p, i) => {
              const isActing = acting === p.id;
              return (
                <div
                  key={p.id}
                  className={`grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-3 px-5 py-4 ${i !== payments.length - 1 ? "border-b border-cream" : ""}`}
                >
                  <div className="md:col-span-3 min-w-0">
                    <p className="font-semibold text-myna-charcoal text-sm truncate">{p.user.fullName}</p>
                    <p className="text-[11px] text-myna-charcoal/50 truncate">{p.user.email}</p>
                    {p.chargilyCheckoutId && (
                      <p className="text-[10px] text-myna-charcoal/40 font-mono truncate mt-0.5">
                        {p.chargilyCheckoutId.slice(0, 20)}…
                      </p>
                    )}
                  </div>
                  <div className="md:col-span-2 text-sm text-myna-charcoal/70 truncate">
                    {p.referenceLabel || p.productType}
                  </div>
                  <div className="md:col-span-2">
                    <p className="font-display text-lg font-bold text-myna-orange">
                      {p.amountDA} DA
                    </p>
                  </div>
                  <div className="md:col-span-2 text-xs text-myna-charcoal/60">
                    {fmtDate(p.createdAt)}
                  </div>
                  <div className="md:col-span-1">
                    <span className={`inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${statusColor(p.status)}`}>
                      {statusLabel(p.status)}
                    </span>
                  </div>
                  <div className="md:col-span-2 flex md:justify-end gap-1 flex-wrap">
                    {(p.status === "PENDING" || p.status === "FAILED" || p.status === "CANCELLED") && (
                      <button
                        onClick={() => activate(p.id)}
                        disabled={isActing}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-50 text-green-700 border border-green-200 text-xs font-semibold hover:bg-green-100 disabled:opacity-50"
                      >
                        {isActing ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />}
                        Activate
                      </button>
                    )}
                    {p.status === "SUCCESS" && (
                      <button
                        onClick={() => refund(p.id)}
                        disabled={isActing}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 text-xs font-semibold hover:bg-purple-100 disabled:opacity-50"
                      >
                        {isActing ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={11} />}
                        Refund
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