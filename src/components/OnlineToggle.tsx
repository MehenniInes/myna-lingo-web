"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";

interface OnlineToggleProps {
  isOnline: boolean;
  onChange?: (isOnline: boolean) => void;
  disabled?: boolean;
}

export default function OnlineToggle({
  isOnline,
  onChange,
  disabled = false,
}: OnlineToggleProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function toggle() {
    if (loading || disabled) return;

    const nextStatus = !isOnline;

    setError("");
    setLoading(true);

    try {
      await api("/teachers/online-status", {
        method: "PATCH",
        auth: true,
        body: {
          isOnline: nextStatus,
        },
      });

      onChange?.(nextStatus);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not update your online status",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        type="button"
        onClick={toggle}
        disabled={disabled || loading}
        aria-pressed={isOnline}
        aria-label={
          isOnline
            ? "Set yourself offline"
            : "Set yourself online"
        }
        className="flex items-center gap-3 rounded-full border border-myna-charcoal/10 bg-white px-4 py-2.5 shadow-sm transition hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
      >
        {/* Status dot */}
        <span
          className={`h-3 w-3 rounded-full ${
            isOnline
              ? "bg-green-500"
              : "bg-gray-400"
          }`}
        />

        {/* Status text */}
        <span className="text-sm font-semibold text-myna-charcoal">
          {isOnline ? "Online" : "Offline"}
        </span>

        {/* Toggle switch */}
        <span
          className={`relative h-6 w-11 rounded-full transition-colors ${
            isOnline
              ? "bg-green-500"
              : "bg-gray-300"
          }`}
        >
          <span
            className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
              isOnline
                ? "translate-x-6"
                : "translate-x-1"
            }`}
          />
        </span>

        {loading && (
          <Loader2
            size={15}
            className="animate-spin text-myna-charcoal/50"
          />
        )}
      </button>

      {error && (
        <p className="max-w-xs text-right text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}