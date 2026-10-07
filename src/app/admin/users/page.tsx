"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getUser } from "@/lib/api";
import { useLanguage } from "@/app/language-provider";
import { formatShortDateTime } from "@/lib/i18n";
import UserTierBadge from "@/components/UserTierBadge";

type User = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  tier: string;
  paymentStatus: string;
  createdAt: string;
};

export default function AdminUsersPage() {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<string>("");

  useEffect(() => {
    const u = getUser();
    if (!u) return router.push("/login");
    if (u.role !== "ADMIN") return router.push("/");
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function load() {
    setLoading(true);
    try {
      const url = filter ? `/admin/users?role=${filter}` : "/admin/users";
      const data = await api<User[]>(url, { auth: true });
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function toggle(id: string) {
    try {
      await api(`/admin/users/${id}/toggle-active`, { method: "PATCH", auth: true });
      setUsers(users.map((u) => (u.id === id ? { ...u, isActive: !u.isActive } : u)));
    } catch (err: any) {
      setError(err.message);
    }
  }

  function roleBadge(role: string) {
    const map: Record<string, string> = {
      STUDENT: "bg-blue-100 text-blue-700",
      PARENT: "bg-purple-100 text-purple-700",
      TEACHER: "bg-green-100 text-green-700",
      ADMIN: "bg-red-100 text-red-700",
    };
    return map[role] || "bg-gray-100 text-gray-700";
  }

  function roleLabel(role: string) {
    if (role === "STUDENT") return t("aUsers.students");
    if (role === "PARENT") return t("aUsers.parents");
    if (role === "TEACHER") return t("aUsers.teachers");
    if (role === "ADMIN") return t("aUsers.admins");
    return role;
  }

  return (
    <main className="min-h-screen bg-cream px-6 py-12">
      <div className="max-w-6xl mx-auto">
        <a href="/admin" className="text-myna-orange font-semibold text-sm">{t("admin.backToAdmin")}</a>
        <h1 className="font-display text-4xl font-bold text-myna-charcoal mt-4">{t("aUsers.title")}</h1>
        <p className="text-myna-charcoal/60 mt-2">{t("aUsers.subtitle")}</p>

        <div className="mt-6 flex flex-wrap gap-2">
          {([
            ["", t("aUsers.all")],
            ["STUDENT", t("aUsers.students")],
            ["PARENT", t("aUsers.parents")],
            ["TEACHER", t("aUsers.teachers")],
            ["ADMIN", t("aUsers.admins")],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`px-4 py-2 rounded-full text-sm font-semibold ${
                filter === value ? "bg-myna-orange text-white" : "bg-white text-myna-charcoal/70 border"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {error && <p className="mt-6 text-red-600">{error}</p>}

        {loading ? (
          <p className="mt-8 text-center text-myna-charcoal/60">{t("common.loading")}</p>
        ) : users.length === 0 ? (
          <p className="mt-8 text-center text-myna-charcoal/60">{t("aUsers.none")}</p>
        ) : (
          <div className="mt-8 bg-white rounded-3xl shadow-sm overflow-hidden">
            {users.map((u, i) => (
              <div
                key={u.id}
                className={`flex items-center justify-between p-5 ${i !== users.length - 1 ? "border-b border-cream" : ""} ${!u.isActive ? "opacity-50" : ""}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-myna-orange text-white flex items-center justify-center font-bold">
                    {u.fullName.charAt(0).toUpperCase()}
                  </div>
                 <div>
  <div className="flex items-center gap-2 flex-wrap">
    <p className="font-semibold text-myna-charcoal">{u.fullName}</p>
    <UserTierBadge tier={u.tier} paymentStatus={u.paymentStatus} size="sm" />
  </div>
  <p className="text-xs text-myna-charcoal/60">{u.email}</p>
</div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${roleBadge(u.role)}`}>
                    {roleLabel(u.role)}
                  </span>
                  <span className="text-xs text-myna-charcoal/40 hidden md:inline">
                    {formatShortDateTime(locale, u.createdAt)}
                  </span>
                  <button
                    onClick={() => toggle(u.id)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold border ${
                      u.isActive
                        ? "text-red-600 border-red-200 hover:bg-red-50"
                        : "text-green-600 border-green-200 hover:bg-green-50"
                    }`}
                  >
                    {u.isActive ? t("aUsers.suspend") : t("aUsers.reactivate")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}