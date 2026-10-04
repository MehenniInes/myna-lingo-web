"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getUser } from "@/lib/api";
import { useLanguage } from "@/app/language-provider";

type Teacher = {
  id: string; bio: string | null; isOnline: boolean;
  user: { fullName: string };
  teacherLanguages: { serviceType: string; language: { name: string } }[];
};

type Call = { id: string; startTime: string; status: string; teacherId: string };
type Balance = { balanceSeconds: number; formatted: string };

export default function CallPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeCall, setActiveCall] = useState<Call | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [ending, setEnding] = useState(false);
  const [summary, setSummary] = useState<any>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const balanceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const user = getUser();
    if (!user) return router.push("/login");
    loadTeachers();
    checkActiveCall();
    loadBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeCall) {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
      balanceRef.current = setInterval(loadBalance, 10000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (balanceRef.current) clearInterval(balanceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCall]);

  async function loadTeachers() {
    try {
      const data = await api<Teacher[]>("/teachers/online");
      setTeachers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function checkActiveCall() {
    try {
      const call = await api<Call | null>("/calls/active", { auth: true });
      if (call) {
        setActiveCall(call);
        const start = new Date(call.startTime).getTime();
        setElapsed(Math.floor((Date.now() - start) / 1000));
      }
    } catch { /* silent */ }
  }

  async function loadBalance() {
    try {
      const b = await api<Balance>("/minutes/balance", { auth: true });
      setBalance(b);
    } catch { /* silent */ }
  }

  async function startCall(teacherId: string) {
    setError(""); setSummary(null);
    try {
      const call = await api<Call>("/calls/start", {
        method: "POST", auth: true,
        body: { teacherId, serviceType: "PROFESSIONAL_TEACHER" },
      });
      setActiveCall(call);
      setElapsed(0);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function endCall() {
    if (!activeCall) return;
    setEnding(true);
    try {
      const result = await api<any>(`/calls/${activeCall.id}/end`, { method: "POST", auth: true });
      setSummary(result);
      setActiveCall(null);
      setElapsed(0);
      await loadBalance();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setEnding(false);
    }
  }

  function formatSec(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  }

  if (loading) return <main className="min-h-screen flex items-center justify-center">{t("common.loading")}</main>;

  if (summary) {
    return (
      <main className="min-h-screen bg-cream px-6 py-12 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-sm p-8 text-center">
          <p className="text-5xl mb-4">✅</p>
          <h1 className="font-display text-3xl font-bold text-myna-charcoal">{t("call.ended")}</h1>
          <div className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between p-3 bg-cream rounded-xl">
              <span className="text-myna-charcoal/60">{t("call.dur")}</span>
              <span className="font-bold">{formatSec(summary.durationSec)}</span>
            </div>
            <div className="flex justify-between p-3 bg-cream rounded-xl">
              <span className="text-myna-charcoal/60">{t("call.studentBal")}</span>
              <span className="font-bold">{formatSec(summary.studentBalanceAfter)}</span>
            </div>
            <div className="flex justify-between p-3 bg-cream rounded-xl">
              <span className="text-myna-charcoal/60">{t("call.teacherEarned")}</span>
              <span className="font-bold">{formatSec(summary.teacherEarnedSec)}</span>
            </div>
          </div>
          <button
            onClick={() => setSummary(null)}
            className="mt-6 w-full py-3 rounded-full bg-myna-orange text-white font-semibold"
          >
            {t("call.backToTeachers")}
          </button>
        </div>
      </main>
    );
  }

  if (activeCall) {
    const teacher = teachers.find((tt) => tt.id === activeCall.teacherId);
    return (
      <main className="min-h-screen bg-[#1a1a1a] text-white px-6 py-12 flex items-center justify-center">
        <div className="max-w-lg w-full text-center">
          <div className="w-32 h-32 mx-auto rounded-full bg-myna-orange flex items-center justify-center text-6xl font-bold mb-6">
            {teacher?.user.fullName.charAt(0).toUpperCase() || "T"}
          </div>
          <p className="text-sm text-white/60 uppercase tracking-wider">{t("call.inCallWith")}</p>
          <h1 className="font-display text-3xl font-bold mt-2">
            {teacher?.user.fullName || t("call.teacher")}
          </h1>
          <p className="font-display text-6xl font-bold mt-8 tabular-nums">{formatSec(elapsed)}</p>
          <p className="text-white/60 mt-2">{t("call.duration")}</p>

          {balance && (
            <p className="text-sm mt-6 text-white/80">
              {t("call.remaining")} <span className="font-bold">{balance.formatted}</span>
            </p>
          )}

          <button
            onClick={endCall}
            disabled={ending}
            className="mt-10 w-full py-4 rounded-full bg-red-500 text-white font-bold text-lg hover:bg-red-600 transition disabled:opacity-50"
          >
            {ending ? t("call.ending") : t("call.end")}
          </button>
          <p className="text-xs text-white/40 mt-6">{t("call.streamSoon")}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <a href="/student" className="text-myna-orange font-semibold text-sm">{t("call.backToDashboard")}</a>
        <h1 className="font-display text-4xl font-bold text-myna-charcoal mt-4">{t("call.title")}</h1>
        <p className="text-myna-charcoal/60 mt-2">
          {balance ? t("call.balance", { balance: balance.formatted }) : t("call.startLive")}
        </p>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">{error}</div>
        )}

        {teachers.length === 0 ? (
          <div className="mt-8 bg-white rounded-3xl shadow-sm p-12 text-center">
            <p className="text-5xl mb-4">😴</p>
            <p className="font-display text-2xl font-bold text-myna-charcoal">{t("call.none")}</p>
            <p className="text-myna-charcoal/60 mt-2">{t("call.noneSub")}</p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {teachers.map((tt) => (
              <div key={tt.id} className="bg-white rounded-3xl shadow-sm p-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-myna-orange text-white flex items-center justify-center text-2xl font-bold">
                    {tt.user.fullName.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-myna-charcoal">{tt.user.fullName}</p>
                    <p className="text-xs text-green-600 font-semibold">{t("call.online")}</p>
                  </div>
                </div>
                {tt.bio && <p className="text-sm text-myna-charcoal/70 mt-3">{tt.bio}</p>}
                <button
                  onClick={() => startCall(tt.id)}
                  className="mt-5 w-full py-3 rounded-full bg-myna-orange text-white font-semibold"
                >
                  {t("call.callNow")}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}