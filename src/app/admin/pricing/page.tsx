"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, Loader2, DollarSign, Save, X, Power, PowerOff, AlertCircle,
} from "lucide-react";
import { api, getUser } from "@/lib/api";

interface PricingRule {
  id: string;
  key: string;
  label: string;
  pricePerMinuteDA: number;
  isActive: boolean;
  updatedAt: string;
  updatedBy: string;
}

export default function AdminPricingPage() {
  const router = useRouter();
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<{ label: string; pricePerMinuteDA: number }>({
    label: "",
    pricePerMinuteDA: 0,
  });
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    const u = getUser();
    if (!u) { router.push("/login"); return; }
    if (u.role !== "ADMIN") { router.push("/"); return; }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await api<PricingRule[]>("/admin/pricing", { auth: true });
      setRules(data);
    } catch (err: any) {
      setError(err.message || "Could not load pricing rules");
    } finally {
      setLoading(false);
    }
  }

  function beginEdit(rule: PricingRule) {
    setEditing(rule.id);
    setForm({ label: rule.label, pricePerMinuteDA: rule.pricePerMinuteDA });
    setMsg("");
  }

  function cancelEdit() {
    setEditing(null);
    setForm({ label: "", pricePerMinuteDA: 0 });
  }

  async function save(id: string) {
    if (!form.label.trim()) {
      setError("Label cannot be empty");
      return;
    }
    if (!Number.isFinite(form.pricePerMinuteDA) || form.pricePerMinuteDA < 1) {
      setError("Price per minute must be at least 1 DA");
      return;
    }

    setActing(id);
    setError("");
    try {
      await api(`/admin/pricing/${id}`, {
        method: "PATCH",
        auth: true,
        body: {
          label: form.label.trim(),
          pricePerMinuteDA: Number(form.pricePerMinuteDA),
        },
      });
      setMsg("✅ Pricing rule updated");
      setEditing(null);
      await load();
    } catch (err: any) {
      setError(err.message || "Update failed");
    } finally {
      setActing(null);
    }
  }

  async function toggleActive(rule: PricingRule) {
    setActing(rule.id);
    setError("");
    try {
      await api(`/admin/pricing/${rule.id}`, {
        method: "PATCH",
        auth: true,
        body: { isActive: !rule.isActive },
      });
      setMsg(`✅ ${rule.label} ${rule.isActive ? "disabled" : "enabled"}`);
      await load();
    } catch (err: any) {
      setError(err.message || "Toggle failed");
    } finally {
      setActing(null);
    }
  }

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  }

  return (
    <main className="min-h-screen bg-cream">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 text-myna-orange font-semibold text-sm hover:underline"
        >
          <ChevronLeft size={14} /> Back to admin
        </Link>

        <div className="mt-4 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-4xl font-bold text-myna-charcoal">Pricing</h1>
            <p className="text-myna-charcoal/60 mt-2">
              Student-facing prices per service type. Updates apply immediately to new bookings.
            </p>
          </div>
        </div>

        {msg && (
          <div className="mt-6 p-3 bg-green-50 border border-green-200 rounded-2xl text-green-800 text-sm">
            {msg}
          </div>
        )}
        {error && (
          <div className="mt-6 p-3 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm flex items-start gap-2">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="mt-8 flex justify-center text-myna-charcoal/60">
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : rules.length === 0 ? (
          <div className="mt-8 bg-white rounded-3xl shadow-sm p-12 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-myna-yellow/30 text-myna-orange flex items-center justify-center">
              <DollarSign size={24} />
            </div>
            <p className="font-display text-xl font-bold text-myna-charcoal mt-4">
              No pricing rules yet
            </p>
            <p className="text-myna-charcoal/60 text-sm mt-2">
              Create rules in Prisma Studio for now. Keys like <code>CONVERSATION_PARTNER</code> and <code>PROFESSIONAL_TEACHER</code>.
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {rules.map((rule) => {
              const isEditing = editing === rule.id;
              const isActing = acting === rule.id;

              return (
                <div
                  key={rule.id}
                  className={`bg-white rounded-3xl shadow-sm p-6 ${!rule.isActive ? "opacity-60" : ""}`}
                >
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-myna-charcoal/50 mb-1">
                            Label
                          </label>
                          <input
                            value={form.label}
                            onChange={(e) => setForm({ ...form, label: e.target.value })}
                            className="w-full rounded-xl border border-myna-charcoal/15 bg-cream px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-myna-orange"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-myna-charcoal/50 mb-1">
                            Price per minute (DA)
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={form.pricePerMinuteDA}
                            onChange={(e) => setForm({ ...form, pricePerMinuteDA: Number(e.target.value) })}
                            className="w-full rounded-xl border border-myna-charcoal/15 bg-cream px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-myna-orange"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => save(rule.id)}
                          disabled={isActing}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-myna-orange text-white font-semibold text-sm disabled:opacity-50"
                        >
                          {isActing ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          disabled={isActing}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-myna-charcoal/15 text-myna-charcoal font-semibold text-sm"
                        >
                          <X size={14} />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-display font-bold text-lg text-myna-charcoal">
                            {rule.label}
                          </p>
                          <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${
                            rule.isActive
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-myna-charcoal/5 text-myna-charcoal/60 border-myna-charcoal/10"
                          }`}>
                            {rule.isActive ? "active" : "disabled"}
                          </span>
                        </div>
                        <p className="text-xs text-myna-charcoal/50 font-mono mt-1">{rule.key}</p>
                        <p className="text-xs text-myna-charcoal/40 mt-1">
                          Last updated {fmtDate(rule.updatedAt)} · by {rule.updatedBy.slice(0, 8)}…
                        </p>
                      </div>

                      <div className="text-end shrink-0">
                        <p className="font-display text-3xl font-bold text-myna-orange">
                          {rule.pricePerMinuteDA}
                          <span className="text-base text-myna-charcoal/50 ms-1">DA/min</span>
                        </p>
                      </div>

                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => beginEdit(rule)}
                          className="px-4 py-2 rounded-full border border-myna-charcoal/15 font-semibold text-sm hover:bg-myna-charcoal/5"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => toggleActive(rule)}
                          disabled={isActing}
                          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full border font-semibold text-sm disabled:opacity-50 ${
                            rule.isActive
                              ? "border-red-200 text-red-600 hover:bg-red-50"
                              : "border-green-200 text-green-600 hover:bg-green-50"
                          }`}
                        >
                          {isActing ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : rule.isActive ? (
                            <PowerOff size={13} />
                          ) : (
                            <Power size={13} />
                          )}
                          {rule.isActive ? "Disable" : "Enable"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}