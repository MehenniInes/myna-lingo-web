"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getUser } from "@/lib/api";

type Booking = {
  id: string;
  scheduledAt: string;
  durationMin: number;
  status: string;
  serviceType: string;
  notes: string | null;
  teacher: { user: { fullName: string } };
};

export default function BookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"upcoming" | "completed" | "cancelled">("upcoming");
  const [error, setError] = useState("");

  useEffect(() => {
    const u = getUser();
    if (!u) return router.push("/login");
    load();
  }, []);

  async function load() {
    try {
      const data = await api<Booking[]>("/bookings/my", { auth: true });
      setBookings(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function cancel(id: string) {
    if (!confirm("Cancel this booking?")) return;
    try {
      await api(`/bookings/${id}`, { method: "DELETE", auth: true });
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  function formatDate(s: string) {
    return new Date(s).toLocaleString("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const now = new Date();
  const filtered = bookings.filter((b) => {
    if (tab === "upcoming") return (b.status === "PENDING" || b.status === "CONFIRMED") && new Date(b.scheduledAt) > now;
    if (tab === "completed") return b.status === "COMPLETED";
    return b.status === "CANCELLED";
  });

  if (loading) return <main className="min-h-screen flex items-center justify-center"><p>Loading...</p></main>;

  return (
    <main className="min-h-screen bg-cream px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <a href="/student" className="text-myna-orange font-semibold text-sm">← Back to Dashboard</a>
        <h1 className="font-display text-4xl font-bold text-myna-charcoal mt-4">My Bookings</h1>

        {/* Tabs */}
        <div className="mt-6 flex gap-2">
          {[
            ["upcoming", "Upcoming"],
            ["completed", "Completed"],
            ["cancelled", "Cancelled"],
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() => setTab(value as any)}
              className={`px-5 py-2 rounded-full text-sm font-semibold ${
                tab === value ? "bg-myna-orange text-white" : "bg-white border"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {error && <p className="mt-6 text-red-600">{error}</p>}

        {filtered.length === 0 ? (
          <div className="mt-8 bg-white rounded-3xl shadow-sm p-12 text-center">
            <p className="text-5xl mb-4">📅</p>
            <p className="font-display text-2xl font-bold text-myna-charcoal">
              No {tab} bookings
            </p>
            <a
              href="/student/call"
              className="mt-6 inline-block px-6 py-3 rounded-full bg-myna-orange text-white font-semibold"
            >
              Find a Teacher
            </a>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {filtered.map((b) => (
              <div key={b.id} className="bg-white rounded-3xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-myna-charcoal">
                      Lesson with {b.teacher.user.fullName}
                    </p>
                    <p className="text-sm text-myna-charcoal/60 mt-1">
                      📅 {formatDate(b.scheduledAt)}
                    </p>
                    <p className="text-xs text-myna-charcoal/50 mt-1">
                      {b.durationMin} minutes · {b.serviceType.replace("_", " ")}
                    </p>
                    {b.notes && <p className="text-xs text-myna-charcoal/60 mt-2 italic">"{b.notes}"</p>}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    b.status === "CONFIRMED" ? "bg-green-100 text-green-700" :
                    b.status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
                    b.status === "CANCELLED" ? "bg-red-100 text-red-700" :
                    "bg-blue-100 text-blue-700"
                  }`}>
                    {b.status}
                  </span>
                </div>
                {(b.status === "PENDING" || b.status === "CONFIRMED") && (
                  <button
                    onClick={() => cancel(b.id)}
                    className="mt-4 text-sm text-red-600 font-semibold hover:underline"
                  >
                    Cancel booking
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}