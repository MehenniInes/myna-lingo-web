"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CalendarDays, Clock, ArrowLeft, Send } from "lucide-react";
import { api, getUser } from "@/lib/api";

interface Teacher {
  id: string;
  firstName: string | null;
  lastName: string | null;
  bio: string | null;
  profileTitle: string | null;
  requestedHourlyRateDA: number | null;
  availability: {
    day: string;
    startTime: string;
    endTime: string;
  }[] | null;
  user: {
    fullName: string;
  };
  teacherLanguages: {
    id: string;
    serviceType: string;
    language: {
      id: string;
      name: string;
      code: string;
    };
  }[];
}

const DAY_NAMES: Record<string, string> = {
  MON: "Monday",
  TUE: "Tuesday",
  WED: "Wednesday",
  THU: "Thursday",
  FRI: "Friday",
  SAT: "Saturday",
  SUN: "Sunday",
};

const DAY_ORDER = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

function NewBookingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const teacherId = searchParams.get("teacherId");

  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("30");
  const [serviceType, setServiceType] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const user = getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    if (!teacherId) {
      setError("No teacher was selected.");
      setLoading(false);
      return;
    }

    loadTeacher(teacherId);
  }, [teacherId, router]);

  async function loadTeacher(id: string) {
    try {
      setLoading(true);
      setError("");

      const data = await api<Teacher>(`/teachers/${id}`);
      setTeacher(data);

      if (data.teacherLanguages.length > 0) {
        setServiceType(data.teacherLanguages[0].serviceType);
      }
    } catch (err: any) {
      setError(err.message || "Could not load teacher.");
    } finally {
      setLoading(false);
    }
  }

  const availableDays = useMemo(() => {
    if (!teacher?.availability) return [];

    return [...teacher.availability].sort(
      (a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day),
    );
  }, [teacher]);

  const selectedDayAvailability = useMemo(() => {
    if (!teacher?.availability || !date) return [];

    const selectedDate = new Date(`${date}T12:00:00`);
    const jsDay = selectedDate.getDay();

    const dayCode =
      jsDay === 0
        ? "SUN"
        : jsDay === 1
          ? "MON"
          : jsDay === 2
            ? "TUE"
            : jsDay === 3
              ? "WED"
              : jsDay === 4
                ? "THU"
                : jsDay === 5
                  ? "FRI"
                  : "SAT";

    return teacher.availability.filter(
      (slot) =>
        slot.day === dayCode ||
        slot.day.toLowerCase() === DAY_NAMES[dayCode].toLowerCase(),
    );
  }, [teacher, date]);

  function getMinimumDate() {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function isDateAvailable(selectedDate: string) {
    if (!teacher?.availability || teacher.availability.length === 0) {
      return false;
    }

    const dateObject = new Date(`${selectedDate}T12:00:00`);
    const jsDay = dateObject.getDay();

    const dayCode =
      jsDay === 0
        ? "SUN"
        : jsDay === 1
          ? "MON"
          : jsDay === 2
            ? "TUE"
            : jsDay === 3
              ? "WED"
              : jsDay === 4
                ? "THU"
                : jsDay === 5
                  ? "FRI"
                  : "SAT";

    return teacher.availability.some(
      (slot) =>
        slot.day === dayCode ||
        slot.day.toLowerCase() === DAY_NAMES[dayCode].toLowerCase(),
    );
  }

  function handleDateChange(value: string) {
    setDate(value);
    setTime("");

    if (value && !isDateAvailable(value)) {
      setError(
        "This teacher is not available on the selected day. Please choose another day.",
      );
    } else {
      setError("");
    }
  }

  async function submitBooking(e: React.FormEvent) {
    e.preventDefault();

    if (!teacherId) {
      setError("No teacher was selected.");
      return;
    }

    if (!date || !time) {
      setError("Please select a date and time.");
      return;
    }

    if (!serviceType) {
      setError("Please select a lesson type.");
      return;
    }

    if (!isDateAvailable(date)) {
      setError("The teacher is not available on the selected day.");
      return;
    }

    const scheduledAt = `${date}T${time}:00`;

    try {
      setSubmitting(true);
      setError("");

      await api("/bookings", {
        method: "POST",
        auth: true,
        body: {
          teacherId,
          serviceType,
          scheduledAt,
          durationMin: Number(duration),
          notes: notes.trim() || undefined,
        },
      });

      router.push("/student/bookings");
    } catch (err: any) {
      setError(err.message || "Could not create booking.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream">
        <p className="text-myna-charcoal/60">Loading teacher...</p>
      </main>
    );
  }

  if (!teacher) {
    return (
      <main className="min-h-screen bg-cream px-6 py-12">
        <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 text-center shadow-sm">
          <p className="text-red-600">{error || "Teacher not found."}</p>

          <Link
            href="/find-teacher"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-myna-orange px-6 py-3 font-semibold text-white"
          >
            <ArrowLeft size={16} />
            Back to teachers
          </Link>
        </div>
      </main>
    );
  }

  const teacherName =
    [teacher.firstName, teacher.lastName].filter(Boolean).join(" ") ||
    teacher.user.fullName;

  return (
    <main className="min-h-screen bg-cream px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <Link
          href={`/teachers/${teacher.id}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-myna-orange hover:underline"
        >
          <ArrowLeft size={15} />
          Back to teacher
        </Link>

        <div className="mt-5 rounded-3xl bg-white p-6 shadow-sm md:p-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-myna-orange">
              Book a lesson
            </p>

            <h1 className="mt-2 font-display text-3xl font-bold text-myna-charcoal">
              Lesson with {teacherName}
            </h1>

            {teacher.profileTitle && (
              <p className="mt-2 text-myna-charcoal/60">
                {teacher.profileTitle}
              </p>
            )}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-myna-orange/10 bg-myna-orange/5 p-4">
              <CalendarDays size={18} className="text-myna-orange" />

              <p className="mt-2 text-xs text-myna-charcoal/50">
                Available days
              </p>

              <p className="mt-1 text-sm font-semibold text-myna-charcoal">
                {availableDays.length > 0
                  ? availableDays
                      .map((slot) => {
                        const code = slot.day.toUpperCase();
                        return DAY_NAMES[code] ?? slot.day;
                      })
                      .join(", ")
                  : "No availability set"}
              </p>
            </div>

            <div className="rounded-2xl bg-myna-charcoal/5 p-4">
              <Clock size={18} className="text-myna-orange" />

              <p className="mt-2 text-xs text-myna-charcoal/50">
                Hourly rate
              </p>

              <p className="mt-1 text-sm font-semibold text-myna-charcoal">
                {teacher.requestedHourlyRateDA
                  ? `${teacher.requestedHourlyRateDA} DA / hour`
                  : "Rate on request"}
              </p>
            </div>
          </div>

          <form onSubmit={submitBooking} className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-myna-charcoal">
                Date
              </label>

              <input
                type="date"
                min={getMinimumDate()}
                value={date}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full rounded-2xl border border-myna-charcoal/10 bg-white px-4 py-3 outline-none focus:border-myna-orange"
                required
              />

              {date && selectedDayAvailability.length > 0 && (
                <p className="mt-2 text-xs text-green-700">
                  Available:{" "}
                  {selectedDayAvailability
                    .map(
                      (slot) =>
                        `${slot.startTime} – ${slot.endTime}`,
                    )
                    .join(", ")}
                </p>
              )}

              {date && selectedDayAvailability.length === 0 && (
                <p className="mt-2 text-xs text-red-600">
                  Teacher is not available on this day.
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-myna-charcoal">
                Time
              </label>

              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                disabled={!date || selectedDayAvailability.length === 0}
                className="w-full rounded-2xl border border-myna-charcoal/10 bg-white px-4 py-3 outline-none focus:border-myna-orange disabled:cursor-not-allowed disabled:bg-gray-100"
                required
              />

              {selectedDayAvailability.length > 0 && (
                <p className="mt-2 text-xs text-myna-charcoal/50">
                  Choose a time inside the teacher's availability window.
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-myna-charcoal">
                Duration
              </label>

              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full rounded-2xl border border-myna-charcoal/10 bg-white px-4 py-3 outline-none focus:border-myna-orange"
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
                <option value="75">75 minutes</option>
                <option value="90">90 minutes</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-myna-charcoal">
                Lesson type
              </label>

              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="w-full rounded-2xl border border-myna-charcoal/10 bg-white px-4 py-3 outline-none focus:border-myna-orange"
                required
              >
                {teacher.teacherLanguages.map((teacherLanguage) => (
                  <option
                    key={teacherLanguage.id}
                    value={teacherLanguage.serviceType}
                  >
                    {teacherLanguage.language.name} —{" "}
                    {teacherLanguage.serviceType === "CONVERSATION_PARTNER"
                      ? "Conversation"
                      : "Professional Teacher"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-myna-charcoal">
                Note
                <span className="font-normal text-myna-charcoal/40">
                  {" "}
                  (optional)
                </span>
              </label>

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                maxLength={500}
                placeholder="Tell the teacher what you would like to work on..."
                className="w-full resize-none rounded-2xl border border-myna-charcoal/10 bg-white px-4 py-3 outline-none focus:border-myna-orange"
              />
            </div>

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={
                submitting ||
                !date ||
                !time ||
                !serviceType ||
                selectedDayAvailability.length === 0
              }
              className="flex w-full items-center justify-center gap-2 rounded-full bg-myna-orange py-3.5 font-semibold text-white transition hover:bg-myna-orange/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? (
                "Sending request..."
              ) : (
                <>
                  <Send size={16} />
                  Request booking
                </>
              )}
            </button>

            <p className="text-center text-xs text-myna-charcoal/50">
              Your request will be sent to the teacher. Your lesson becomes
              confirmed after the teacher accepts it.
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}

export default function NewBookingPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-cream">
          <p className="text-myna-charcoal/60">Loading...</p>
        </main>
      }
    >
      <NewBookingContent />
    </Suspense>
  );
}