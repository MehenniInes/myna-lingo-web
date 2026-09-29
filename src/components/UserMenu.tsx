"use client";

import { useEffect, useState } from "react";

export default function UserMenu() {
  const [user, setUser] = useState<{ fullName: string; role: string } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  function handleLogout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/";
  }

  // Avoid hydration mismatch
  if (!mounted) return <div className="w-24 h-8" />;

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-myna-charcoal font-medium hidden sm:inline">
          Hi, {user.fullName}
        </span>
        <button
          onClick={handleLogout}
          className="text-sm px-4 py-1.5 rounded-full font-medium text-myna-charcoal hover:bg-myna-orange/10 transition"
        >
          Log Out
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <a
        href="/login"
        className="text-sm px-4 py-1.5 rounded-full font-medium text-myna-charcoal hover:bg-myna-orange/10 transition"
      >
        Log In
      </a>
      <a
        href="/register"
        className="text-sm px-4 py-1.5 rounded-full font-medium bg-myna-orange text-white hover:bg-myna-orange/90 transition"
      >
        Sign Up
      </a>
    </div>
  );
}