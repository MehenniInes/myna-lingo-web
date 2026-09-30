"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getUser } from "@/lib/api";

type Package = {
  id: string;
  priceDA: number;
  minutes: number;
  sortOrder: number;
  isActive: boolean;
};

export default function PackagesPage() {
  const router = useRouter();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const user = getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    loadPackages();
  }, []);

  async function loadPackages() {
    try {
      const data = await api<Package[]>("/packages");
      setPackages(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function buyPackage(packageId: string) {
    setBuying(packageId);
    setMessage("");
    setError("");

    try {
      const result = await api<{
        purchaseId: string;
        minutesAdded: number;
        newBalanceSeconds: number;
      }>(`/packages/${packageId}/purchase`, {
        method: "POST",
        auth: true,
      });

      setMessage(`✅ Purchased ${result.minutesAdded} minutes! New balance: ${Math.floor(result.newBalanceSeconds / 60)}:${(result.newBalanceSeconds % 60).toString().padStart(2, "0")}`);
    } catch (err: any) {
      setError(err.message || "Purchase failed");
    } finally {
      setBuying(null);
    }
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
        <div className="mb-8">
          <a href="/student" className="text-myna-orange font-semibold text-sm">
            ← Back to Dashboard
          </a>
          <h1 className="font-display text-4xl font-bold text-myna-charcoal mt-4">
            Buy Minutes
          </h1>
          <p className="text-myna-charcoal/60 mt-2">
            Choose a package to start learning
          </p>
        </div>

        {message && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl text-green-800 text-sm">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="bg-white rounded-3xl shadow-sm p-8 text-center hover:shadow-md transition"
            >
              <p className="text-xs font-bold uppercase tracking-wider text-myna-orange mb-3">
                Package
              </p>
              <p className="font-display text-4xl font-bold text-myna-charcoal">
                {pkg.minutes}
              </p>
              <p className="text-myna-charcoal/60 text-sm">minutes</p>

              <p className="font-display text-3xl font-bold text-myna-charcoal mt-6">
                {pkg.priceDA}
                <span className="text-lg text-myna-charcoal/60 ml-1">DA</span>
              </p>

              <button
                onClick={() => buyPackage(pkg.id)}
                disabled={buying === pkg.id}
                className="mt-6 w-full py-3 rounded-full bg-myna-orange text-white font-semibold hover:bg-myna-orange/90 transition disabled:opacity-50"
              >
                {buying === pkg.id ? "Buying..." : "Buy Now"}
              </button>
            </div>
          ))}
        </div>

        {packages.length === 0 && (
          <p className="text-center text-myna-charcoal/60">
            No packages available
          </p>
        )}
      </div>
    </main>
  );
}