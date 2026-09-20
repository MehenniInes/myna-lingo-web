"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = searchParams.get("role") === "teacher" ? "TEACHER" : "STUDENT";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(defaultRole);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:4000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Registration failed");
        setLoading(false);
        return;
      }

      router.push("/login");
    } catch {
      setError("Could not connect to the server");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md bg-myna-white rounded-3xl shadow-sm p-8">
        <h1 className="font-display text-3xl font-bold text-myna-charcoal text-center">Create your account</h1>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-myna-charcoal mb-1">Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl border border-myna-charcoal/20 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-myna-orange"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-myna-charcoal mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-myna-charcoal/20 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-myna-orange"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-myna-charcoal mb-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-myna-charcoal/20 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-myna-orange"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-myna-charcoal mb-1">I am a</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-xl border border-myna-charcoal/20 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-myna-orange"
            >
              <option value="STUDENT">Student</option>
              <option value="PARENT">Parent</option>
              <option value="TEACHER">Teacher</option>
            </select>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full py-3 rounded-full font-semibold bg-myna-orange text-white hover:bg-myna-orange/90 transition disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-myna-charcoal/70">
          Already have an account? <a href="/login" className="text-myna-orange font-medium">Log in</a>
        </p>
      </div>
    </main>
  );
}