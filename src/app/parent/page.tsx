"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getUser, logout } from "@/lib/api";

type Child = {
  id: string;
  fullName: string;
  ageCategory: string | null;
};

export default function ParentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser) {
      router.push("/login");
      return;
    }
    if (currentUser.role !== "PARENT") {
      router.push("/student");
      return;
    }
    setUser(currentUser);
    loadChildren();
  }, []);

  async function loadChildren() {
    try {
      const data = await api<Child[]>("/children", { auth: true });
      setChildren(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </main>
    );
  }

  const groupA = children.filter((c) => c.ageCategory === "AGE_6_11").length;
  const groupB = children.filter((c) => c.ageCategory === "AGE_12_14").length;

  return (
    <main className="min-h-screen bg-cream px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-display text-4xl font-bold text-myna-charcoal">
              Welcome, {user?.fullName}
            </h1>
            <p className="text-myna-charcoal/60 mt-2">Parent Dashboard</p>
          </div>
          <button
            onClick={logout}
            className="px-5 py-2 rounded-full border border-myna-charcoal/20 text-sm font-semibold hover:bg-white"
          >
            Logout
          </button>
        </div>

        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="bg-white rounded-3xl shadow-sm p-8">
            <p className="text-xs font-bold uppercase tracking-wider text-myna-orange mb-2">
              Total Children
            </p>
            <p className="font-display text-5xl font-bold text-myna-charcoal">
              {children.length}
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-sm p-8">
            <p className="text-xs font-bold uppercase tracking-wider text-myna-orange mb-2">
              Group A (6-11)
            </p>
            <p className="font-display text-5xl font-bold text-myna-charcoal">
              {groupA}
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-sm p-8">
            <p className="text-xs font-bold uppercase tracking-wider text-myna-orange mb-2">
              Group B (12-14)
            </p>
            <p className="font-display text-5xl font-bold text-myna-charcoal">
              {groupB}
            </p>
          </div>
        </div>

        {/* Children Preview */}
        {children.length > 0 && (
          <div className="mt-8 bg-white rounded-3xl shadow-sm p-8">
            <h2 className="font-display text-2xl font-bold text-myna-charcoal mb-4">
              My Children
            </h2>
            <div className="space-y-3">
              {children.map((child) => (
                <div
                  key={child.id}
                  className="flex items-center justify-between p-4 rounded-2xl bg-cream"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-myna-orange text-white flex items-center justify-center font-bold">
                      {child.fullName.charAt(0).toUpperCase()}
                    </div>
                    <p className="font-semibold text-myna-charcoal">
                      {child.fullName}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-myna-orange px-3 py-1 rounded-full bg-myna-orange/10">
                    {child.ageCategory === "AGE_6_11" ? "6-11" : "12-14"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <a
            href="/parent/children"
            className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition"
          >
            <p className="font-bold text-myna-charcoal">👨‍👩‍👧 Manage Children</p>
            <p className="text-xs text-myna-charcoal/60 mt-1">
              Add, view, and manage accounts
            </p>
          </a>
          <a
            href="/parent/payments"
            className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition"
          >
            <p className="font-bold text-myna-charcoal">💳 Payments</p>
            <p className="text-xs text-myna-charcoal/60 mt-1">
              View payment history
            </p>
          </a>
        </div>
      </div>
    </main>
  );
}