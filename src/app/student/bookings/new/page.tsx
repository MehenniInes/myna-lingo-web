"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CalendarDays,
  Clock,
  ArrowLeft,
  Send,
} from "lucide-react";
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

const DAY_ORDER = [
  "MON",
  "TUE",
  "WED",
  "THU",
  "FRI",
  "SAT",
  "SUN",
];

function normalizeDay(day: string) {
  const value = day.trim().toUpperCase();

  if (DAY_NAMES[value]) {
    return value;
  }

  const fullDay = Object.entries(DAY_NAMES).find(
    ([, name]) => name.toUpperCase() === value,
  );

  return fullDay?.[0] ?? value;
}

function getDayCode(date: string) {
  const selectedDate = new Date(`${date}T12:00:00`);
  const jsDay = selectedDate.getDay();

  return [
    "SUN",
    "MON",
    "TUE",
    "WED",
    "THU",
    "FRI",
    "SAT",
  ][jsDay];
}

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return NaN;
  }

  return hours * 60 + minutes;
}

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(
    2,
    "0",
  )}`;
}

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
        setServiceType(
          data.teacherLanguages[0].serviceType,
        );
      }
    } catch (err: any) {
      setError(
        err.message || "Could not load teacher.",
      );
    } finally {
      setLoading(false);
    }
  }

  const availableDays = useMemo(() => {
    if (!teacher?.availability) {
      return [];
    }

    return [...teacher.availability].sort(
      (a, b) =>
        DAY_ORDER.indexOf(normalizeDay(a.day)) -
        DAY_ORDER.indexOf(normalizeDay(b.day)),
    );
  }, [teacher]);

  const selectedDayAvailability = useMemo(() => {
    if (!teacher?.availability || !date) {
      return [];
    }

    const dayCode = getDayCode(date);

    return teacher.availability.filter(
      (slot) => normalizeDay(slot.day) === dayCode,
    );
  }, [teacher, date]);

  const selectedDuration = Number(duration);

  const validTimeRange = useMemo(() => {
    if (
      !time ||
      selectedDayAvailability.length === 0 ||
      Number.isNaN(selectedDuration)
    ) {
      return null;
    }

    const startMinutes = timeToMinutes(time);

    if (Number.isNaN(startMinutes)) {
      return null;
    }

    const endMinutes =
      startMinutes + selectedDuration;

    const matchingSlot =
      selectedDayAvailability.find((slot) => {
        const availabilityStart =
          timeToMinutes(slot.startTime);

        const availabilityEnd =
          timeToMinutes(slot.endTime);

        return (
          startMinutes >= availabilityStart &&
          endMinutes <= availabilityEnd
        );
      });

    if (!matchingSlot) {
      return null;
    }

    return {
      startMinutes,
      endMinutes,
      endTime: formatMinutes(endMinutes),
    };
  }, [
    time,
    selectedDayAvailability,
    selectedDuration,
  ]);

  function getMinimumDate() {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(
      today.getMonth() + 1,
    ).padStart(2, "0");
    const day = String(today.getDate()).padStart(
      2,
      "0",
    );

    return `${year}-${month}-${day}`;
  }

  function isDateAvailable(selectedDate: string) {
    if (
      !teacher?.availability ||
      teacher.availability.length === 0
    ) {
      return false;
    }

    const dayCode = getDayCode(selectedDate);

    return teacher.availability.some(
      (slot) => normalizeDay(slot.day) === dayCode,
    );
  }

  function handleDateChange(value: string) {
    setDate(value);
    setTime("");

    if (
      value &&
      !isDateAvailable(value)
    ) {
      setError(
        "This teacher is not available on the selected day. Please choose another day.",
      );
    } else {
      setError("");
    }
  }

  function handleTimeChange(value: string) {
    setTime(value);

    if (!value) {
      setError("");
      return;
    }

    const startMinutes = timeToMinutes(value);

    if (Number.isNaN(startMinutes)) {
      setError("Please choose a valid time.");
      return;
    }

    const endMinutes =
      startMinutes + selectedDuration;

    const fitsAvailability =
      selectedDayAvailability.some((slot) => {
        const availabilityStart =
          timeToMinutes(slot.startTime);

        const availabilityEnd =
          timeToMinutes(slot.endTime);

        return (
          startMinutes >= availabilityStart &&
          endMinutes <= availabilityEnd
        );
      });

    if (!fitsAvailability) {
      setError(
        `This lesson does not fit inside the teacher's availability. Please choose a time between ${selectedDayAvailability
          .map(
            (slot) =>
              `${slot.startTime} – ${slot.endTime}`,
          )
          .join(", ")}.`,
      );
    } else {
      setError("");
    }
  }

  function handleDurationChange(value: string) {
    setDuration(value);

    if (
      !time ||
      selectedDayAvailability.length === 0
    ) {
      setError("");
      return;
    }

    const newDuration = Number(value);
    const startMinutes = timeToMinutes(time);

    if (
      Number.isNaN(startMinutes) ||
      Number.isNaN(newDuration)
    ) {
      return;
    }

    const endMinutes =
      startMinutes + newDuration;

    const fitsAvailability =
      selectedDayAvailability.some((slot) => {
        const availabilityStart =
          timeToMinutes(slot.startTime);

        const availabilityEnd =
          timeToMinutes(slot.endTime);

        return (
          startMinutes >= availabilityStart &&
          endMinutes <= availabilityEnd
        );
      });

    if (!fitsAvailability) {
      setError(
        `A ${newDuration}-minute lesson starting at ${time} does not fit inside the teacher's availability.`,
      );
    } else {
      setError("");
    }
  }

  async function submitBooking(
    e: React.FormEvent,
  ) {
    e.preventDefault();

    if (!teacherId) {
      setError("No teacher was selected.");
      return;
    }

    if (!date) {
      setError("Please select a date.");
      return;
    }

    if (!time) {
      setError("Please select a time.");
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

    if (!validTimeRange) {
      setError(
        "This lesson does not fit inside the teacher's availability. Please choose another time or a shorter duration.",
      );
      return;
    }

    const scheduledAt =
      `${date}T${time}:00`;

    console.log("BOOKING REQUEST:", {
      teacherId,
      serviceType,
      scheduledAt,
      durationMin: Number(duration),
      notes: notes.trim() || undefined,
    });

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
          notes:
            notes.trim() || undefined,
        },
      });

      router.push("/student/bookings");
    } catch (err: any) {
      setError(
        err.message ||
          "Could not create booking.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream">
        <p className="text-myna-charcoal/60">
          Loading teacher...
        </p>
      </main>
    );
  }

  if (!teacher) {
    return (
      <main className="min-h-screen bg-cream px-6 py-12">
        <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 text-center shadow-sm">
          <p className="text-red-600">
            {error || "Teacher not found."}
          </p>

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
    [teacher.firstName, teacher.lastName]
      .filter(Boolean)
      .join(" ") ||
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
              <CalendarDays
                size={18}
                className="text-myna-orange"
              />

              <p className="mt-2 text-xs text-myna-charcoal/50">
                Available days
              </p>

              <p className="mt-1 text-sm font-semibold text-myna-charcoal">
                {availableDays.length > 0
                  ? availableDays
                      .map((slot) => {
                        const code =
                          normalizeDay(slot.day);

                        return (
                          DAY_NAMES[code] ??
                          slot.day
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

          <form
            onSubmit={submitBooking}
            className="mt-8 space-y-5"
          >
            {/* Date */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-myna-charcoal">
                Date
              </label>

              <input
                type="date"
                min={getMinimumDate()}
                value={date}
                onChange={(e) =>
                  handleDateChange(
                    e.target.value,
                  )
                }
                className="w-full rounded-2xl border border-myna-charcoal/10 bg-white px-4 py-3 outline-none focus:border-myna-orange"
                required
              />

              {date &&
                selectedDayAvailability.length >
                  0 && (
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

              {date &&
                selectedDayAvailability.length ===
                  0 && (
                  <p className="mt-2 text-xs text-red-600">
                    Teacher is not available on
                    this day.
                  </p>
                )}
            </div>

            {/* Time */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-myna-charcoal">
                Time
              </label>

              <input
                type="time"
                value={time}
                min={
                  selectedDayAvailability.length >
                  0
                    ? selectedDayAvailability[0]
                        .startTime
                    : undefined
                }
                max={
                  selectedDayAvailability.length >
                  0
                    ? selectedDayAvailability[
                        selectedDayAvailability.length -
                          1
                      ].endTime
                    : undefined
                }
                onChange={(e) =>
                  handleTimeChange(
                    e.target.value,
                  )
                }
                disabled={
                  !date ||
                  selectedDayAvailability.length ===
                    0
                }
                className="w-full rounded-2xl border border-myna-charcoal/10 bg-white px-4 py-3 outline-none focus:border-myna-orange disabled:cursor-not-allowed disabled:bg-gray-100"
                required
              />

              {selectedDayAvailability.length >
                0 && (
                <p className="mt-2 text-xs text-myna-charcoal/50">
                  Choose a start time inside the
                  teacher&apos;s availability
                  window.
                </p>
              )}

              {validTimeRange && (
                <p className="mt-2 text-xs font-medium text-green-700">
                  Lesson: {time} –{" "}
                  {validTimeRange.endTime}
                </p>
              )}
            </div>

            {/* Duration */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-myna-charcoal">
                Duration
              </label>

              <select
                value={duration}
                onChange={(e) =>
                  handleDurationChange(
                    e.target.value,
                  )
                }
                className="w-full rounded-2xl border border-myna-charcoal/10 bg-white px-4 py-3 outline-none focus:border-myna-orange"
              >
                <option value="15">
                  15 minutes
                </option>
                <option value="30">
                  30 minutes
                </option>
                <option value="45">
                  45 minutes
                </option>
                <option value="60">
                  60 minutes
                </option>
                <option value="75">
                  75 minutes
                </option>
                <option value="90">
                  90 minutes
                </option>
              </select>
            </div>

            {/* Lesson type */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-myna-charcoal">
                Lesson type
              </label>

              <select
                value={serviceType}
                onChange={(e) =>
                  setServiceType(
                    e.target.value,
                  )
                }
                className="w-full rounded-2xl border border-myna-charcoal/10 bg-white px-4 py-3 outline-none focus:border-myna-orange"
                required
              >
                {teacher.teacherLanguages.map(
                  (teacherLanguage) => (
                    <option
                      key={teacherLanguage.id}
                      value={
                        teacherLanguage.serviceType
                      }
                    >
                      {teacherLanguage.language.name}{" "}
                      —{" "}
                      {teacherLanguage.serviceType ===
                      "CONVERSATION_PARTNER"
                        ? "Conversation"
                        : "Professional Teacher"}
                    </option>
                  ),
                )}
              </select>
            </div>

            {/* Note */}
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
                onChange={(e) =>
                  setNotes(e.target.value)
                }
                rows={4}
                maxLength={500}
                placeholder="Tell the teacher what you would like to work on..."
                className="w-full resize-none rounded-2xl border border-myna-charcoal/10 bg-white px-4 py-3 outline-none focus:border-myna-orange"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={
                submitting ||
                !date ||
                !time ||
                !serviceType ||
                selectedDayAvailability.length ===
                  0 ||
                !validTimeRange
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
              Your request will be sent to the
              teacher. Your lesson becomes confirmed
              after the teacher accepts it.
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
          <p className="text-myna-charcoal/60">
            Loading...
          </p>
        </main>
      }
    >
      <NewBookingContent />
    </Suspense>
  );
}