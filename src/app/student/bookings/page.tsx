"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CalendarDays,
  Clock,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock3,
  Loader2,
  CalendarPlus,
} from "lucide-react";
import { api, getUser } from "@/lib/api";

type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED";

interface Booking {
  id: string;
  scheduledAt: string;
  durationMin: number;
  serviceType: "CONVERSATION_PARTNER" | "PROFESSIONAL_TEACHER";
  status: BookingStatus;
  notes?: string | null;

  teacher?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    user?: {
      fullName?: string | null;
    };
  };
}

type Tab = "upcoming" | "completed" | "cancelled";

function formatDate(value: string) {
  const date = new Date(value);

  return date.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(value: string) {
  const date = new Date(value);

  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getTeacherName(booking: Booking) {
  const teacher = booking.teacher;

  if (!teacher) {
    return "Teacher";
  }

  const profileName = [teacher.firstName, teacher.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return profileName || teacher.user?.fullName || "Teacher";
}

function getServiceLabel(serviceType: Booking["serviceType"]) {
  return serviceType === "PROFESSIONAL_TEACHER"
    ? "Professional Teacher"
    : "Conversation Partner";
}

function getStatusLabel(status: BookingStatus) {
  switch (status) {
    case "PENDING":
      return "Waiting for teacher";
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

function getStatusClasses(status: BookingStatus) {
  switch (status) {
    case "PENDING":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "CONFIRMED":
      return "bg-green-50 text-green-700 border-green-200";

    case "COMPLETED":
      return "bg-blue-50 text-blue-700 border-blue-200";

    case "CANCELLED":
      return "bg-red-50 text-red-700 border-red-200";

    default:
      return "bg-myna-charcoal/5 text-myna-charcoal/60 border-myna-charcoal/10";
  }
}

function StatusIcon({ status }: { status: BookingStatus }) {
  if (status === "PENDING") {
    return <Clock3 size={15} />;
  }

  if (status === "CONFIRMED") {
    return <CheckCircle2 size={15} />;
  }

  if (status === "COMPLETED") {
    return <CheckCircle2 size={15} />;
  }

  return <XCircle size={15} />;
}
export default function StudentBookingsPage() {
  return (
    <Suspense fallback={null}>
      <StudentBookingsContent />
    </Suspense>
  );
}

function StudentBookingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("upcoming");

  useEffect(() => {
    const user = getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    /*
     * Teacher profile currently links to:
     *
     * /student/bookings?teacherId=...
     *
     * The actual booking form lives at:
     *
     * /student/bookings/new?teacherId=...
     *
     * So redirect here instead of trying to make the booking
     * list itself behave like the booking form.
     */
    const teacherId = searchParams.get("teacherId");

    if (teacherId) {
      router.replace(
        `/student/bookings/new?teacherId=${encodeURIComponent(
          teacherId,
        )}`,
      );
      return;
    }

    loadBookings();
  }, [router, searchParams]);

  async function loadBookings() {
    try {
      setLoading(true);
      setError("");

      const data = await api<Booking[]>("/bookings/my", {
        auth: true,
      });

      setBookings(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Could not load bookings:", err);

      setError(
        err?.message ||
          "Could not load your bookings. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function cancelBooking(bookingId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this booking?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setCancellingId(bookingId);
      setError("");

      await api(`/bookings/${bookingId}`, {
        method: "DELETE",
        auth: true,
      });

      await loadBookings();
    } catch (err: any) {
      console.error("Could not cancel booking:", err);

      setError(
        err?.message ||
          "Could not cancel this booking. Please try again.",
      );
    } finally {
      setCancellingId(null);
    }
  }

  const upcomingBookings = useMemo(() => {
    return bookings
      .filter(
        (booking) =>
          booking.status === "PENDING" ||
          booking.status === "CONFIRMED",
      )
      .sort(
        (a, b) =>
          new Date(a.scheduledAt).getTime() -
          new Date(b.scheduledAt).getTime(),
      );
  }, [bookings]);

  const completedBookings = useMemo(() => {
    return bookings
      .filter((booking) => booking.status === "COMPLETED")
      .sort(
        (a, b) =>
          new Date(b.scheduledAt).getTime() -
          new Date(a.scheduledAt).getTime(),
      );
  }, [bookings]);

  const cancelledBookings = useMemo(() => {
    return bookings
      .filter((booking) => booking.status === "CANCELLED")
      .sort(
        (a, b) =>
          new Date(b.scheduledAt).getTime() -
          new Date(a.scheduledAt).getTime(),
      );
  }, [bookings]);

  const visibleBookings =
    tab === "upcoming"
      ? upcomingBookings
      : tab === "completed"
        ? completedBookings
        : cancelledBookings;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream">
        <div className="flex items-center gap-3 text-myna-charcoal/60">
          <Loader2 size={20} className="animate-spin" />
          Loading your bookings...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream px-6 py-10">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-myna-orange hover:underline"
            >
              <ArrowLeft size={15} />
              Home
            </Link>

            <h1 className="mt-3 font-display text-4xl font-bold text-myna-charcoal">
              My Bookings
            </h1>

            <p className="mt-2 text-myna-charcoal/60">
              Manage your upcoming and previous lessons.
            </p>
          </div>

          <Link
            href="/find-teacher"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-myna-orange px-5 py-3 font-semibold text-white transition hover:bg-myna-orange/90"
          >
            <CalendarPlus size={17} />
            Book a lesson
          </Link>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 rounded-2xl bg-white p-2 shadow-sm">
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setTab("upcoming")}
              className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                tab === "upcoming"
                  ? "bg-myna-orange text-white"
                  : "text-myna-charcoal/60 hover:bg-myna-charcoal/5"
              }`}
            >
              Upcoming
              <span className="ml-1.5 opacity-70">
                ({upcomingBookings.length})
              </span>
            </button>

            <button
              type="button"
              onClick={() => setTab("completed")}
              className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                tab === "completed"
                  ? "bg-myna-orange text-white"
                  : "text-myna-charcoal/60 hover:bg-myna-charcoal/5"
              }`}
            >
              Completed
              <span className="ml-1.5 opacity-70">
                ({completedBookings.length})
              </span>
            </button>

            <button
              type="button"
              onClick={() => setTab("cancelled")}
              className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                tab === "cancelled"
                  ? "bg-myna-orange text-white"
                  : "text-myna-charcoal/60 hover:bg-myna-charcoal/5"
              }`}
            >
              Cancelled
              <span className="ml-1.5 opacity-70">
                ({cancelledBookings.length})
              </span>
            </button>
          </div>
        </div>

        {/* Empty state */}
        {visibleBookings.length === 0 && (
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-myna-orange/10 text-myna-orange">
              <CalendarDays size={25} />
            </div>

            <h2 className="mt-5 font-display text-xl font-bold text-myna-charcoal">
              {tab === "upcoming"
                ? "No upcoming bookings"
                : tab === "completed"
                  ? "No completed lessons"
                  : "No cancelled bookings"}
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-myna-charcoal/55">
              {tab === "upcoming"
                ? "Find a teacher and book your next lesson."
                : tab === "completed"
                  ? "Your completed lessons will appear here."
                  : "Cancelled bookings will appear here."}
            </p>

            {tab === "upcoming" && (
              <Link
                href="/find-teacher"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-myna-orange px-5 py-3 font-semibold text-white"
              >
                <CalendarPlus size={16} />
                Find a teacher
              </Link>
            )}
          </div>
        )}

        {/* Booking cards */}
        <div className="space-y-4">
          {visibleBookings.map((booking) => {
            const teacherName = getTeacherName(booking);
            const isUpcoming =
              booking.status === "PENDING" ||
              booking.status === "CONFIRMED";

            return (
              <article
                key={booking.id}
                className="rounded-3xl bg-white p-5 shadow-sm md:p-6"
              >
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  {/* Main information */}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-xl font-bold text-myna-charcoal">
                        {teacherName}
                      </h2>

                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${
                          getStatusClasses(booking.status)
                        }`}
                      >
                        <StatusIcon status={booking.status} />
                        {getStatusLabel(booking.status)}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-myna-charcoal/55">
                      {getServiceLabel(booking.serviceType)}
                    </p>

                    <div className="mt-4 flex flex-col gap-2 text-sm text-myna-charcoal/70 sm:flex-row sm:flex-wrap sm:gap-x-5">
                      <span className="inline-flex items-center gap-2">
                        <CalendarDays
                          size={16}
                          className="text-myna-orange"
                        />
                        {formatDate(booking.scheduledAt)}
                      </span>

                      <span className="inline-flex items-center gap-2">
                        <Clock
                          size={16}
                          className="text-myna-orange"
                        />
                        {formatTime(booking.scheduledAt)} ·{" "}
                        {booking.durationMin} min
                      </span>
                    </div>

                    {booking.notes && (
                      <div className="mt-4 rounded-2xl bg-myna-charcoal/5 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-myna-charcoal/40">
                          Your note
                        </p>
                        <p className="mt-1 text-sm text-myna-charcoal/70">
                          {booking.notes}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 flex-col gap-2 sm:flex-row md:flex-col">
                    {isUpcoming && (
                      <button
                        type="button"
                        onClick={() => cancelBooking(booking.id)}
                        disabled={cancellingId === booking.id}
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {cancellingId === booking.id ? (
                          <>
                            <Loader2
                              size={15}
                              className="animate-spin"
                            />
                            Cancelling...
                          </>
                        ) : (
                          <>
                            <XCircle size={15} />
                            Cancel booking
                          </>
                        )}
                      </button>
                    )}

                    {booking.status === "CONFIRMED" && (
                      <Link
                        href="/student/call"
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-myna-charcoal px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-myna-charcoal/90"
                      >
                        Join lesson
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}