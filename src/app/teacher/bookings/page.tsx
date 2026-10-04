"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  User,
  Check,
  X,
  CheckCircle,
  Loader2,
} from "lucide-react";

import { api, getUser } from "@/lib/api";

type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED";

type Booking = {
  id: string;
  scheduledAt: string;
  durationMin: number;
  serviceType: string;
  status: BookingStatus;
  notes?: string | null;

  student?: {
    user?: {
      fullName?: string | null;
      name?: string | null;
      email?: string | null;
    };
  };

  studentName?: string;
};

type Tab = "upcoming" | "completed" | "cancelled";

export default function TeacherBookingsPage() {
  const router = useRouter();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("upcoming");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

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

    loadBookings();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadBookings() {
    setLoading(true);
    setError("");

    try {
      const data = await api<Booking[]>("/bookings/teacher", {
        auth: true,
      });

      setBookings(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load bookings",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(
    bookingId: string,
    action: "accept" | "reject" | "complete" | "cancel",
  ) {
    setActionLoading(`${bookingId}-${action}`);
    setError("");

    try {
      if (action === "accept") {
        await api(`/bookings/${bookingId}/accept`, {
          method: "PATCH",
          auth: true,
        });
      }

      if (action === "reject") {
        await api(`/bookings/${bookingId}/reject`, {
          method: "PATCH",
          auth: true,
        });
      }

      if (action === "complete") {
        await api(`/bookings/${bookingId}/complete`, {
          method: "PATCH",
          auth: true,
        });
      }

      if (action === "cancel") {
        await api(`/bookings/${bookingId}/cancel`, {
          method: "PATCH",
          auth: true,
        });
      }

      await loadBookings();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : `Could not ${action} booking`,
      );
    } finally {
      setActionLoading(null);
    }
  }

  function getStudentName(booking: Booking) {
    return (
      booking.studentName ||
      booking.student?.user?.fullName ||
      booking.student?.user?.name ||
      booking.student?.user?.email ||
      "Student"
    );
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString("en-GB", {
      weekday: "long",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatServiceType(serviceType: string) {
    if (serviceType === "PROFESSIONAL_TEACHER") {
      return "Professional Teacher";
    }

    if (serviceType === "CONVERSATION_PARTNER") {
      return "Conversation";
    }

    return serviceType
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function statusLabel(status: BookingStatus) {
    switch (status) {
      case "PENDING":
        return "Pending";

      case "CONFIRMED":
        return "Confirmed";

      case "COMPLETED":
        return "Completed";

      case "CANCELLED":
        return "Cancelled";

      default:
        return status;
    }
  }

  function statusClasses(status: BookingStatus) {
    switch (status) {
      case "PENDING":
        return "bg-amber-50 text-amber-700 border-amber-200";

      case "CONFIRMED":
        return "bg-blue-50 text-blue-700 border-blue-200";

      case "COMPLETED":
        return "bg-green-50 text-green-700 border-green-200";

      case "CANCELLED":
        return "bg-red-50 text-red-700 border-red-200";

      default:
        return "bg-gray-50 text-gray-600 border-gray-200";
    }
  }

  const upcomingBookings = bookings.filter(
    (booking) =>
      booking.status === "PENDING" ||
      booking.status === "CONFIRMED",
  );

  const completedBookings = bookings.filter(
    (booking) => booking.status === "COMPLETED",
  );

  const cancelledBookings = bookings.filter(
    (booking) => booking.status === "CANCELLED",
  );

  const visibleBookings =
    activeTab === "upcoming"
      ? upcomingBookings
      : activeTab === "completed"
        ? completedBookings
        : cancelledBookings;

  function isActionLoading(
    bookingId: string,
    action: string,
  ) {
    return actionLoading === `${bookingId}-${action}`;
  }

  function renderBooking(booking: Booking) {
    return (
      <div
        key={booking.id}
        className="bg-white rounded-3xl shadow-sm p-6"
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          {/* Student */}
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-myna-orange/10 text-myna-orange flex items-center justify-center shrink-0">
                <User size={20} />
              </div>

              <div className="min-w-0">
                <p className="font-bold text-myna-charcoal truncate">
                  {getStudentName(booking)}
                </p>

                <span
                  className={`inline-flex mt-1 px-2 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wide ${statusClasses(
                    booking.status,
                  )}`}
                >
                  {statusLabel(booking.status)}
                </span>
              </div>
            </div>

            {/* Booking details */}
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="flex items-center gap-2 text-sm text-myna-charcoal/60">
                <Calendar
                  size={16}
                  className="text-myna-orange shrink-0"
                />

                <span>{formatDate(booking.scheduledAt)}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-myna-charcoal/60">
                <Clock
                  size={16}
                  className="text-myna-orange shrink-0"
                />

                <span>
                  {formatTime(booking.scheduledAt)} ·{" "}
                  {booking.durationMin} min
                </span>
              </div>

              <div className="text-sm text-myna-charcoal/60">
                <span className="text-myna-charcoal/40">
                  Service:{" "}
                </span>

                {formatServiceType(booking.serviceType)}
              </div>
            </div>

            {booking.notes && (
              <div className="mt-4 rounded-2xl bg-myna-charcoal/[0.03] px-4 py-3 text-sm text-myna-charcoal/60">
                <span className="font-semibold text-myna-charcoal/50">
                  Notes:{" "}
                </span>

                {booking.notes}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 lg:shrink-0 lg:justify-end">
            {booking.status === "PENDING" && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    handleAction(booking.id, "accept")
                  }
                  disabled={!!actionLoading}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-myna-orange text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isActionLoading(
                    booking.id,
                    "accept",
                  ) ? (
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
                  type="button"
                  onClick={() =>
                    handleAction(booking.id, "reject")
                  }
                  disabled={!!actionLoading}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-red-200 bg-red-50 text-red-700 text-sm font-semibold hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isActionLoading(
                    booking.id,
                    "reject",
                  ) ? (
                    <Loader2
                      size={15}
                      className="animate-spin"
                    />
                  ) : (
                    <X size={15} />
                  )}

                  Reject
                </button>
              </>
            )}

            {booking.status === "CONFIRMED" && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    handleAction(
                      booking.id,
                      "complete",
                    )
                  }
                  disabled={!!actionLoading}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-green-50 text-green-700 text-sm font-semibold hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isActionLoading(
                    booking.id,
                    "complete",
                  ) ? (
                    <Loader2
                      size={15}
                      className="animate-spin"
                    />
                  ) : (
                    <CheckCircle size={15} />
                  )}

                  Mark completed
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleAction(booking.id, "cancel")
                  }
                  disabled={!!actionLoading}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-red-200 bg-red-50 text-red-700 text-sm font-semibold hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isActionLoading(
                    booking.id,
                    "cancel",
                  ) ? (
                    <Loader2
                      size={15}
                      className="animate-spin"
                    />
                  ) : (
                    <X size={15} />
                  )}

                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-cream">
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <button
            type="button"
            onClick={() => router.push("/teacher")}
            className="text-myna-orange font-semibold text-sm hover:underline"
          >
            ← Teacher Dashboard
          </button>

          <h1 className="font-display text-4xl font-bold text-myna-charcoal mt-3">
            Bookings
          </h1>

          <p className="text-myna-charcoal/60 mt-1">
            Manage your lesson requests and scheduled lessons.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm p-1.5 mb-6 flex gap-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("upcoming")}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition ${
              activeTab === "upcoming"
                ? "bg-myna-orange text-white"
                : "text-myna-charcoal/60 hover:bg-myna-charcoal/5"
            }`}
          >
            Upcoming ({upcomingBookings.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("completed")}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition ${
              activeTab === "completed"
                ? "bg-myna-orange text-white"
                : "text-myna-charcoal/60 hover:bg-myna-charcoal/5"
            }`}
          >
            Completed ({completedBookings.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("cancelled")}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition ${
              activeTab === "cancelled"
                ? "bg-myna-orange text-white"
                : "text-myna-charcoal/60 hover:bg-myna-charcoal/5"
            }`}
          >
            Cancelled ({cancelledBookings.length})
          </button>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="min-h-[300px] bg-white rounded-3xl shadow-sm flex items-center justify-center">
            <div className="flex items-center gap-3 text-myna-charcoal/50">
              <Loader2
                size={20}
                className="animate-spin"
              />

              Loading bookings...
            </div>
          </div>
        ) : visibleBookings.length === 0 ? (
          /* Empty state */
          <div className="min-h-[300px] bg-white rounded-3xl shadow-sm flex flex-col items-center justify-center text-center px-6">
            <div className="w-14 h-14 rounded-2xl bg-myna-orange/10 text-myna-orange flex items-center justify-center mb-4">
              <Calendar size={24} />
            </div>

            <h2 className="font-display font-bold text-xl text-myna-charcoal">
              No {activeTab} bookings
            </h2>

            <p className="text-sm text-myna-charcoal/50 mt-2 max-w-md">
              {activeTab === "upcoming"
                ? "You don't have any pending or confirmed lessons yet."
                : activeTab === "completed"
                  ? "Completed lessons will appear here."
                  : "Cancelled bookings will appear here."}
            </p>
          </div>
        ) : (
          /* Booking list */
          <div className="space-y-4">
            {visibleBookings.map(renderBooking)}
          </div>
        )}
      </div>
    </main>
  );
}