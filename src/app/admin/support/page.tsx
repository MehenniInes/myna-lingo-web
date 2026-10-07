"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getUser } from "@/lib/api";
import UserTierBadge from "@/components/UserTierBadge";

type PendingUser = {
  id: string;
  email: string;
  fullName: string;
  tier: string;
  paymentStatus: string;
  createdAt: string;
};

export default function SupportPage() {
  const router = useRouter();
  const [pending, setPending] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [activating, setActivating] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  useEffect(() => {
    const u = getUser();
    if (!u) return router.push("/login");
    if (u.role !== "ADMIN") return router.push("/");
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await api<PendingUser[]>("/admin/users/pending", { auth: true });
      setPending(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function activateOne(userId: string) {
    setActivating(userId);
    setMessage("");
    try {
      await api(`/admin/users/${userId}/payment-status`, {
        method: "PATCH",
        auth: true,
        body: { paymentStatus: "ACTIVE" },
      });
      setMessage("✅ User activated");
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActivating(null);
    }
  }

  async function bulkActivate() {
    setBulkLoading(true);
    setMessage("");
    try {
      const res = await api<{ activatedCount: number }>(
        "/admin/users/bulk-activate",
        { method: "POST", auth: true }
      );
      setMessage(`✅ Activated ${res.activatedCount} student(s)`);
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBulkLoading(false);
    }
  }

  function formatDate(s: string) {
    return new Date(s).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (loading) {
    return <main className="min-h-screen flex items-center justify-center"><p>Loading...</p></main>;
  }

  return (
    <main className="min-h-screen bg-cream px-6 py-12">
      <div className="max-w-5xl mx-auto">
        <a href="/admin" className="text-myna-orange font-semibold text-sm">← Back to Admin</a>
        <div className="mt-4 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-4xl font-bold text-myna-charcoal">Support</h1>
            <p className="text-myna-charcoal/60 mt-2">
              Students waiting for manual payment verification
            </p>
          </div>
          {pending.length > 0 && (
            <button
              onClick={bulkActivate}
              disabled={bulkLoading}
              className="px-6 py-3 rounded-full bg-myna-orange text-white font-semibold text-sm hover:bg-myna-orange/90 transition disabled:opacity-50"
            >
              {bulkLoading ? "Activating..." : `⚡ Activate All (${pending.length})`}
            </button>
          )}
        </div>

        {message && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-2xl text-green-800 text-sm">
            {message}
          </div>
        )}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
            {error}
          </div>
        )}

        {pending.length === 0 ? (
          <div className="mt-8 bg-white rounded-3xl shadow-sm p-12 text-center">
            <p className="text-5xl mb-4">✨</p>
            <p className="font-display text-2xl font-bold text-myna-charcoal">All caught up!</p>
            <p className="text-myna-charcoal/60 mt-2">No pending payments</p>
          </div>
        ) : (
          <div className="mt-8 bg-yellow-50 border-2 border-yellow-300 rounded-3xl shadow-sm overflow-hidden">
            <div className="bg-yellow-100 px-6 py-3 border-b border-yellow-300">
              <p className="font-bold text-yellow-900 text-sm">
                ⚠️ {pending.length} student(s) waiting for activation
              </p>
            </div>
            {pending.map((u, i) => (
              <div
                key={u.id}
                className={`flex items-center justify-between p-5 gap-4 flex-wrap ${
                  i !== pending.length - 1 ? "border-b border-yellow-200" : ""
                }`}
              >
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="w-10 h-10 rounded-full bg-myna-orange text-white flex items-center justify-center font-bold">
                    {u.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-myna-charcoal">{u.fullName}</p>
                      <UserTierBadge tier={u.tier} paymentStatus={u.paymentStatus} size="sm" />
                    </div>
                    <p className="text-xs text-myna-charcoal/60 mt-0.5">{u.email}</p>
                    <p className="text-xs text-myna-charcoal/40 mt-0.5">{formatDate(u.createdAt)}</p>
                  </div>
                </div>
                <button
                  onClick={() => activateOne(u.id)}
                  disabled={activating === u.id}
                  className="px-5 py-2.5 rounded-full bg-myna-charcoal text-white font-semibold text-sm hover:bg-myna-charcoal/90 transition disabled:opacity-50 whitespace-nowrap"
                >
                  {activating === u.id ? "..." : "✅ Activate"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}