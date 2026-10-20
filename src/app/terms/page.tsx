"use client";

import { useLanguage } from "@/app/language-provider";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { AlertTriangle } from "lucide-react";

export default function TermsPage() {
  const { t } = useLanguage();
  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit", month: "long", year: "numeric",
  });

  return (
    <main className="min-h-screen bg-cream">
      <nav className="border-b border-myna-charcoal/10 bg-cream/90 backdrop-blur px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <a href="/" className="text-myna-orange font-semibold text-sm hover:underline">
            {t("legal.backHome")}
          </a>
          <LanguageSwitcher />
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="font-display text-4xl font-bold text-myna-charcoal">
          {t("legal.termsTitle")}
        </h1>
        <p className="text-sm text-myna-charcoal/50 mt-2">
          {t("legal.lastUpdated", { date: today })}
        </p>

        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-900">{t("legal.draftNotice")}</p>
        </div>

        <div className="mt-10 space-y-8 text-myna-charcoal/85 leading-relaxed text-[15px]">
          <section>
            <h2 className="font-display text-xl font-bold text-myna-charcoal mb-2">1. Acceptance</h2>
            <p>
              By creating an account or using Myna Lingo, you agree to these Terms and to our Privacy Policy. If you don't agree,
              please don't use the platform.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-myna-charcoal mb-2">2. Eligibility</h2>
            <ul className="list-disc ps-5 space-y-1">
              <li>You must be at least 18 years old to hold an account in your own name as a student, parent, or teacher.</li>
              <li>Students under 18 must be managed by a parent or legal guardian through a Parent account.</li>
              <li>Teachers must be at least 18 and pass identity verification before being approved.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-myna-charcoal mb-2">3. Accounts</h2>
            <ul className="list-disc ps-5 space-y-1">
              <li>One account per person. Don't create duplicates to circumvent suspensions or abuse limits.</li>
              <li>You're responsible for keeping your password safe. Don't share it.</li>
              <li>You're responsible for everything done through your account.</li>
              <li>Provide accurate information. Fake names, emails, or ID documents are grounds for immediate termination.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-myna-charcoal mb-2">4. Student rules</h2>
            <ul className="list-disc ps-5 space-y-1">
              <li>Minutes are purchased in packages and deducted in real time during lessons.</li>
              <li>Minutes are non-refundable once used. Unused minutes expire 12 months after purchase.</li>
              <li>You must have at least 1 minute of balance to start a live call. Calls auto-end when balance reaches zero.</li>
              <li>Don't share your account with others. Booking lessons for someone else requires a Parent-managed child account.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-myna-charcoal mb-2">5. Teacher rules</h2>
            <ul className="list-disc ps-5 space-y-1">
              <li>Teachers are independent contractors. Nothing in these Terms creates an employment relationship.</li>
              <li>You're responsible for the accuracy of your profile: certifications, diplomas, experience, and rates.</li>
              <li>You must actually hold any certification you upload. Falsifying documents is grounds for immediate termination and potential legal action.</li>
              <li>You set your own hourly rate. Myna Lingo may apply an internal compensation rate for payouts, disclosed separately.</li>
              <li>You must show up to booked lessons on time, or cancel with at least [24 hours] notice.</li>
              <li>You must not accept payment outside the platform for lessons arranged through Myna Lingo.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-myna-charcoal mb-2">6. Payments &amp; refunds</h2>
            <ul className="list-disc ps-5 space-y-1">
              <li>Payments are processed by Chargily Pay. We don't store card data.</li>
              <li>All prices are shown in Algerian Dinars (DA) and include applicable taxes.</li>
              <li>Refunds are granted when a payment fails to deliver the purchased service (e.g., package not credited).</li>
              <li>Refunds are refused for minutes already consumed, podcasts already accessed, or lessons attended.</li>
              <li>Chargebacks initiated through your bank will result in immediate account suspension while we investigate.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-myna-charcoal mb-2">7. Bookings &amp; cancellations</h2>
            <ul className="list-disc ps-5 space-y-1">
              <li>Cancelling a booking more than [24 hours] before the start time is free. Later cancellations may forfeit minutes.</li>
              <li>If a teacher cancels or doesn't show, your minutes are refunded.</li>
              <li>If you don't show for a scheduled lesson, you may be charged for it.</li>
            </ul>
            <p className="mt-2 p-3 bg-myna-charcoal/5 rounded-lg text-sm">
              <strong>[REVIEW BY LAWYER]</strong> Confirm cancellation windows and forfeiture rules are enforceable in Algeria.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-myna-charcoal mb-2">8. Video calls</h2>
            <ul className="list-disc ps-5 space-y-1">
              <li>Video is provided by Agora and is not recorded by Myna Lingo.</li>
              <li>You may not record a call without the explicit consent of everyone present. Doing so is a breach of these Terms.</li>
              <li>Call times are tracked server-side. Client-side timers are for display only.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-myna-charcoal mb-2">9. Content</h2>
            <ul className="list-disc ps-5 space-y-1">
              <li>You keep ownership of content you upload (photos, videos, bios).</li>
              <li>By uploading, you grant Myna Lingo a license to display it on the platform.</li>
              <li>You must own or have permission to use any content you upload. No stolen images, no other people's videos.</li>
              <li>You must not upload illegal, sexually explicit, harassing, or defamatory content.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-myna-charcoal mb-2">10. Prohibited conduct</h2>
            <p>You may not:</p>
            <ul className="list-disc ps-5 space-y-1 mt-2">
              <li>Harass, threaten, or discriminate against other users</li>
              <li>Share another person's private information without consent</li>
              <li>Try to hack, scrape, or reverse-engineer the platform</li>
              <li>Use the platform for illegal activity</li>
              <li>Impersonate Myna Lingo staff or another user</li>
              <li>Bypass our payment system for lessons arranged here</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-myna-charcoal mb-2">11. Termination</h2>
            <p>
              We may suspend or terminate your account for breach of these Terms, fraud, or behaviour that harms other users or
              the platform. You may close your account at any time. On closure, we delete your personal data except where we're
              required to retain it for legal or financial reasons.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-myna-charcoal mb-2">12. Liability</h2>
            <p>
              Myna Lingo is provided "as is". We don't guarantee uninterrupted service, error-free operation, or specific
              learning outcomes. To the maximum extent permitted by law, our total liability for any claim is limited to the
              amount you paid us in the 3 months before the claim.
            </p>
            <p className="mt-2 p-3 bg-myna-charcoal/5 rounded-lg text-sm">
              <strong>[REVIEW BY LAWYER]</strong> Confirm liability limitation is enforceable under Algerian law.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-myna-charcoal mb-2">13. Governing law</h2>
            <p>
              These Terms are governed by the laws of Algeria. Disputes will be heard by the courts of [Algiers], unless
              local consumer protection law grants you the right to sue in your own jurisdiction.
            </p>
            <p className="mt-2 p-3 bg-myna-charcoal/5 rounded-lg text-sm">
              <strong>[REVIEW BY LAWYER]</strong> Confirm jurisdiction and dispute resolution clause.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-myna-charcoal mb-2">14. Changes</h2>
            <p>
              We may update these Terms. Material changes will be announced by email or in-app at least 14 days before they
              take effect. Continuing to use the platform means you accept the new Terms.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-myna-charcoal mb-2">15. Contact</h2>
            <p>
              Questions? Email <strong>support@mynalingo.com</strong>.
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}