"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (localStorage.getItem("accessToken")) {
      const stored = localStorage.getItem("user");
      const u = stored ? JSON.parse(stored) : null;
      if (u?.role === "STUDENT") router.push("/student");
      else if (u?.role === "PARENT") router.push("/parent");
      else if (u?.role === "TEACHER") router.push("/teacher");
      else if (u?.role === "ADMIN") router.push("/admin");
      else router.push("/");
    } else {
      setChecking(false);
    }
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await api<{ accessToken: string; user: any }>("/auth/login", {
        method: "POST",
        body: { email, password },
      });

      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("user", JSON.stringify(data.user));

      if (data.user.role === "STUDENT") router.push("/student");
      else if (data.user.role === "PARENT") router.push("/parent");
      else if (data.user.role === "TEACHER") router.push("/teacher");
      else if (data.user.role === "ADMIN") router.push("/admin");
      else router.push("/");
    } catch (err: any) {
      setError(err.message || "Login failed");
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm p-8">
        <h1 className="font-display text-3xl font-bold text-myna-charcoal text-center">
          Welcome back
        </h1>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-myna-charcoal mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-myna-charcoal/20 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-myna-orange"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-myna-charcoal mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-myna-charcoal/20 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-myna-orange"
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full py-3 rounded-full font-semibold bg-myna-orange text-white hover:bg-myna-orange/90 transition disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-myna-charcoal/70">
          Don&apos;t have an account?{" "}
          <a href="/register" className="text-myna-orange font-medium">
            Sign up
          </a>
        </p>
      </div>
    </main>
  );
}