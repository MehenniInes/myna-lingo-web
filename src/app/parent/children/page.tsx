"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getUser } from "@/lib/api";

type Child = {
  id: string;
  fullName: string;
  dateOfBirth: string;
  ageCategory: string | null;
  userId: string;
};

export default function ChildrenPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const newChild = await api<Child>("/children", {
        method: "POST",
        auth: true,
        body: { fullName, dateOfBirth },
      });
      setChildren([...children, newChild]);
      setFullName("");
      setDateOfBirth("");
      setShowForm(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteChild(id: string) {
    if (!confirm("Are you sure you want to delete this child?")) return;
    try {
      await api(`/children/${id}`, { method: "DELETE", auth: true });
      setChildren(children.filter((c) => c.id !== id));
    } catch (err: any) {
      setError(err.message);
    }
  }

  function ageCategoryLabel(cat: string | null) {
    if (cat === "AGE_6_11") return "6-11 years";
    if (cat === "AGE_12_14") return "12-14 years";
    return "Unknown";
  }

  function calculateAge(dob: string) {
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-display text-4xl font-bold text-myna-charcoal">
              My Children
            </h1>
            <p className="text-myna-charcoal/60 mt-2">
              Manage your children's accounts
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-3 rounded-full bg-myna-orange text-white font-semibold text-sm hover:bg-myna-orange/90 transition"
          >
            {showForm ? "Cancel" : "+ Add Child"}
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Add Form */}
        {showForm && (
          <div className="mb-8 bg-white rounded-3xl shadow-sm p-8">
            <h2 className="font-display text-2xl font-bold text-myna-charcoal mb-6">
              Add a New Child
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-myna-charcoal mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-myna-charcoal/20 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-myna-orange"
                  placeholder="e.g. Lina"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-myna-charcoal mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  required
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full rounded-xl border border-myna-charcoal/20 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-myna-orange"
                />
                <p className="text-xs text-myna-charcoal/60 mt-2">
                  Child must be between 6 and 14 years old.
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-full bg-myna-orange text-white font-semibold hover:bg-myna-orange/90 transition disabled:opacity-50"
              >
                {submitting ? "Adding..." : "Add Child"}
              </button>
            </form>
          </div>
        )}

        {/* Children List */}
        {children.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm p-12 text-center">
            <p className="text-4xl mb-4">👶</p>
            <p className="font-display text-xl font-bold text-myna-charcoal">
              No children yet
            </p>
            <p className="text-myna-charcoal/60 mt-2">
              Add your first child to get started
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {children.map((child) => (
              <div
                key={child.id}
                className="bg-white rounded-3xl shadow-sm p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-14 h-14 rounded-full bg-myna-orange text-white flex items-center justify-center text-2xl font-bold">
                    {child.fullName.charAt(0).toUpperCase()}
                  </div>
                  <button
                    onClick={() => deleteChild(child.id)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    🗑
                  </button>
                </div>

                <h3 className="font-display text-xl font-bold text-myna-charcoal">
                  {child.fullName}
                </h3>

                <p className="text-sm text-myna-charcoal/60 mt-1">
                  {calculateAge(child.dateOfBirth)} years old
                </p>

                <span className="inline-block mt-3 px-3 py-1 rounded-full bg-myna-orange/10 text-myna-orange text-xs font-bold">
                  {ageCategoryLabel(child.ageCategory)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}