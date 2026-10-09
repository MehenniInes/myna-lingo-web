"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getUser } from "@/lib/api";
import { Copy, Check, Gift, Users } from "lucide-react";

type ReferralLink = { code: string; url: string };

type Reward = {
  id: string;
  friendName: string;
  minutesGiven: number;
  createdAt: string;
};

type Rewards = {
  totalMinutes: number;
  canStillEarn: boolean;
  rewards: Reward[];
};

export default function ReferralsPage() {
  const router = useRouter();
  const [link, setLink] = useState<ReferralLink | null>(null);
  const [rewards, setRewards] = useState<Rewards | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const user = getUser();
    if (!user) return router.push("/login");
    if (user.role !== "STUDENT") return router.push("/");
    load();
  }, []);

  async function load() {
    try {
      const [linkData, rewardsData] = await Promise.all([
        api<ReferralLink>("/referrals/my-link", { auth: true }),
        api<Rewards>("/referrals/my-rewards", { auth: true }),
      ]);
      setLink(linkData);
      setRewards(rewardsData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* silent */
    }
  }

  function shareWhatsApp() {
    if (!link) return;
    const msg = encodeURIComponent(
      `Join me on Myna Lingo and learn a language! ${link.url}`,
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  }

  function shareFacebook() {
    if (!link) return;
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link.url)}`,
      "_blank",
    );
  }

  function shareTelegram() {
    if (!link) return;
    const msg = encodeURIComponent(
      `Join me on Myna Lingo! ${link.url}`,
    );
    window.open(`https://t.me/share/url?url=${link.url}&text=${msg}`, "_blank");
  }

  function shareSMS() {
    if (!link) return;
    const msg = encodeURIComponent(`Join me on Myna Lingo! ${link.url}`);
    window.open(`sms:?body=${msg}`, "_blank");
  }

  function formatDate(s: string) {
    return new Date(s).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </main>
    );
  }

  if (error || !link || !rewards) {
    return (
      <main className="min-h-screen bg-cream flex items-center justify-center px-6">
        <div className="bg-white rounded-3xl shadow-sm p-8 max-w-md text-center">
          <p className="text-red-600 mb-4">{error || "Something went wrong"}</p>
          <a
            href="/student"
            className="text-myna-orange font-semibold"
          >
            ← Back to Dashboard
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <a
          href="/student"
          className="text-myna-orange font-semibold text-sm"
        >
          ← Back to Dashboard
        </a>

        <h1 className="font-display text-4xl font-bold text-myna-charcoal mt-4">
          Invite Friends
        </h1>
        <p className="text-myna-charcoal/60 mt-2">
          Earn 10 free minutes when a friend joins using your link. Limit: 1
          reward.
        </p>

        {/* Reward status card */}
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="bg-white rounded-3xl shadow-sm p-6">
            <div className="flex items-center gap-2">
              <Gift size={18} className="text-myna-orange" />
              <p className="text-xs font-bold uppercase tracking-wider text-myna-charcoal/60">
                Minutes Earned
              </p>
            </div>
            <p className="font-display text-4xl font-bold text-myna-charcoal mt-3">
              {rewards.totalMinutes}
            </p>
            <p className="text-xs text-myna-charcoal/60 mt-1">
              {rewards.canStillEarn
                ? "You can still earn 10 more minutes"
                : "Reward already claimed"}
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-sm p-6">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-myna-orange" />
              <p className="text-xs font-bold uppercase tracking-wider text-myna-charcoal/60">
                Friends Joined
              </p>
            </div>
            <p className="font-display text-4xl font-bold text-myna-charcoal mt-3">
              {rewards.rewards.length}
            </p>
          </div>
        </div>

        {/* Referral link card */}
        <div className="mt-6 bg-white rounded-3xl shadow-sm p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-myna-charcoal/60 mb-3">
            Your referral code
          </p>
          <p className="font-display text-3xl font-bold text-myna-orange mb-4">
            {link.code}
          </p>

          <p className="text-xs font-bold uppercase tracking-wider text-myna-charcoal/60 mb-3">
            Your referral link
          </p>
          <div className="flex gap-2 items-stretch">
            <input
              value={link.url}
              readOnly
              className="flex-1 rounded-xl border border-myna-charcoal/20 px-4 py-3 text-sm bg-cream"
            />
            <button
              onClick={copyLink}
              className="px-5 py-3 rounded-xl bg-myna-orange text-white font-semibold text-sm flex items-center gap-2 hover:bg-myna-orange/90 transition whitespace-nowrap"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          {/* Share buttons */}
          <p className="text-xs font-bold uppercase tracking-wider text-myna-charcoal/60 mt-6 mb-3">
            Share via
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <button
              onClick={shareWhatsApp}
              className="py-3 rounded-xl bg-[#25D366] text-white font-semibold text-sm hover:opacity-90 transition"
            >
              💬 WhatsApp
            </button>
            <button
              onClick={shareFacebook}
              className="py-3 rounded-xl bg-[#1877F2] text-white font-semibold text-sm hover:opacity-90 transition"
            >
              📘 Facebook
            </button>
            <button
              onClick={shareTelegram}
              className="py-3 rounded-xl bg-[#0088cc] text-white font-semibold text-sm hover:opacity-90 transition"
            >
              ✈️ Telegram
            </button>
            <button
              onClick={shareSMS}
              className="py-3 rounded-xl bg-myna-charcoal text-white font-semibold text-sm hover:opacity-90 transition"
            >
              📱 SMS
            </button>
          </div>
        </div>

        {/* Rewards list */}
        {rewards.rewards.length > 0 && (
          <div className="mt-6 bg-white rounded-3xl shadow-sm p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-myna-charcoal/60 mb-4">
              Friends you invited
            </p>
            <div className="space-y-3">
              {rewards.rewards.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-cream"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-myna-orange text-white flex items-center justify-center font-bold">
                      {r.friendName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-myna-charcoal">
                        {r.friendName}
                      </p>
                      <p className="text-xs text-myna-charcoal/60">
                        {formatDate(r.createdAt)}
                      </p>
                    </div>
                  </div>
                  <span className="font-display text-lg font-bold text-myna-orange">
                    +{r.minutesGiven} min
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}