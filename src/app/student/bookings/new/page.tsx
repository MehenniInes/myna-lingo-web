
"use client";

import { useEffect, useMemo, useState } from "react";
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

export default function NewBookingPage() {
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
      (a, b) =>
        DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day),
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
      setError(
        "The teacher is not available on the selected day.",
      );
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
      <main className="min-h-screen bg-cream flex items-center justify-center">
        <p className="text-myna-charcoal/60">
          Loading teacher...
        </p>
      </main>
    );
  }

  if (!teacher) {
    return (
      <main className="min-h-screen bg-cream px-6 py-12">
        <div className="max-w-xl mx-auto bg-white rounded-3xl shadow-sm p-8 text-center">
          <p className="text-red-600">{error || "Teacher not found."}</p>

          <Link
            href="/find-teacher"
            className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-full bg-myna-orange text-white font-semibold"
          >
            <ArrowLeft size={16} />
            Back to teachers
          </Link>
        </div>
      </main>
    );
  }

  const teacherName =
    [teacher.firstName, teacher.lastName]
      .filter(Boolean)
      .join(" ") || teacher.user.fullName;

  return (
    <main className="min-h-screen bg-cream px-6 py-12">
      <div className="max-w-2xl mx-auto">
        <Link
          href={`/teachers/${teacher.id}`}
          className="inline-flex items-center gap-2 text-myna-orange font-semibold text-sm hover:underline"
        >
          <ArrowLeft size={15} />
          Back to teacher
        </Link>

        <div className="mt-5 bg-white rounded-3xl shadow-sm p-6 md:p-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-myna-orange">
              Book a lesson
            </p>

            <h1 className="font-display text-3xl font-bold text-myna-charcoal mt-2">
              Lesson with {teacherName}
            </h1>

            {teacher.profileTitle && (
              <p className="text-myna-charcoal/60 mt-2">
                {teacher.profileTitle}
              </p>
            )}
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-2xl bg-myna-orange/5 border border-myna-orange/10 p-4">
              <CalendarDays
                size={18}
                className="text-myna-orange"
              />
              <p className="text-xs text-myna-charcoal/50 mt-2">
                Available days
              </p>

              <p className="text-sm font-semibold text-myna-charcoal mt-1">
                {availableDays.length > 0
                  ? availableDays
                      .map((slot) => {
                        const code = slot.day.toUpperCase();

                        return (
                          DAY_NAMES[code] ?? slot.day
                        );
                      })
                      .join(", ")
                  : "No availability set"}
              </p>
            </div>

            <div className="rounded-2xl bg-myna-charcoal/5 p-4">
              <Clock
                size={18}
                className="text-myna-orange"
              />

              <p className="text-xs text-myna-charcoal/50 mt-2">
                Hourly rate
              </p>

              <p className="text-sm font-semibold text-myna-charcoal mt-1">
                {teacher.requestedHourlyRateDA
                  ? `${teacher.requestedHourlyRateDA} DA / hour`
                  : "Rate on request"}
              </p>
            </div>
          </div>

          <form
            onSubmit={submitBooking}
            className="mt-8 space-y-5"
          >
            <div>
              <label className="block text-sm font-semibold text-myna-charcoal mb-2">
                Date
              </label>

              <input
                type="date"
                min={getMinimumDate()}
                value={date}
                onChange={(e) =>
                  handleDateChange(e.target.value)
                }
                className="w-full rounded-2xl border border-myna-charcoal/10 px-4 py-3 bg-white outline-none focus:border-myna-orange"
                required
              />

              {date && selectedDayAvailability.length > 0 && (
                <p className="text-xs text-green-700 mt-2">
                  Available:
                  {" "}
                  {selectedDayAvailability
                    .map(
                      (slot) =>
                        `${slot.startTime} – ${slot.endTime}`,
                    )
                    .join(", ")}
                </p>
              )}

              {date && selectedDayAvailability.length === 0 && (
                <p className="text-xs text-red-600 mt-2">
                  Teacher is not available on this day.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-myna-charcoal mb-2">
                Time
              </label>

              <input
                type="time"
                value={time}
                onChange={(e) =>
                  setTime(e.target.value)
                }
                disabled={
                  !date ||
                  selectedDayAvailability.length === 0
                }
                className="w-full rounded-2xl border border-myna-charcoal/10 px-4 py-3 bg-white outline-none focus:border-myna-orange disabled:bg-gray-100 disabled:cursor-not-allowed"
                required
              />

              {selectedDayAvailability.length > 0 && (
                <p className="text-xs text-myna-charcoal/50 mt-2">
                  Choose a time inside the teacher's
                  availability window.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-myna-charcoal mb-2">
                Duration
              </label>

              <select
                value={duration}
                onChange={(e) =>
                  setDuration(e.target.value)
                }
                className="w-full rounded-2xl border border-myna-charcoal/10 px-4 py-3 bg-white outline-none focus:border-myna-orange"
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
              <label className="block text-sm font-semibold text-myna-charcoal mb-2">
                Lesson type
              </label>

              <select
                value={serviceType}
                onChange={(e) =>
                  setServiceType(e.target.value)
                }
                className="w-full rounded-2xl border border-myna-charcoal/10 px-4 py-3 bg-white outline-none focus:border-myna-orange"
                required
              >
                {teacher.teacherLanguages.map((tl) => (
                  <option
                    key={tl.id}
                    value={tl.serviceType}
                  >
                    {tl.language.name} —{" "}
                    {tl.serviceType ===
                    "CONVERSATION_PARTNER"
                      ? "Conversation"
                      : "Professional Teacher"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-myna-charcoal mb-2">
                Note
                <span className="font-normal text-myna-charcoal/40">
                  {" "}
                  (optional)
                </span>
              </label>

              <textarea
                value={notes}
                onChange={(e) =>
                  setNotes(e.target.value)
                }
                rows={4}
                maxLength={500}
                placeholder="Tell the teacher what you would like to work on..."
                className="w-full rounded-2xl border border-myna-charcoal/10 px-4 py-3 bg-white outline-none focus:border-myna-orange resize-none"
              />
            </div>

            {error && (
              <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
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
              className="w-full py-3.5 rounded-full bg-myna-orange text-white font-semibold hover:bg-myna-orange/90 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

            <p className="text-xs text-center text-myna-charcoal/50">
              Your request will be sent to the teacher.
              Your lesson becomes confirmed after the teacher
              accepts it.
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}