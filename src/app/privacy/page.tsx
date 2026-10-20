"use client";

import { useLanguage } from "@/app/language-provider";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { AlertTriangle } from "lucide-react";

export default function PrivacyPage() {
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
          {t("legal.privacyTitle")}
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
            <h2 className="font-display text-xl font-bold text-myna-charcoal mb-2">1. Who we are</h2>
            <p>
              Myna Lingo ("we", "us", "our") operates the platform at mynalingo.com and related mobile applications.
              We are a language-learning service that connects students with independent teachers for live online lessons.
            </p>
            <p className="mt-2 p-3 bg-myna-charcoal/5 rounded-lg text-sm">
              <strong>[REVIEW BY LAWYER]</strong> Legal entity: [Company name] · Registered address: [Address] ·
              Registration number: [RC / NIF] · Contact: privacy@mynalingo.com
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-myna-charcoal mb-2">2. What we collect</h2>
            <ul className="list-disc ps-5 space-y-1">
              <li><strong>Account data:</strong> full name, email, password (hashed), phone number (optional), locale, account role.</li>
              <li><strong>Profile data:</strong> date of birth (for parent-managed children), country of birth, profile photo, short bio, spoken and taught languages.</li>
              <li><strong>Verification data (teachers only):</strong> ID document image, certificates, diplomas, intro videos.</li>
              <li><strong>Usage data:</strong> call logs (start time, duration, participants, end reason), lesson bookings, teaching-time ledger entries, XP and minute ledgers, notifications.</li>
              <li><strong>Payment data:</strong> package or podcast purchases, Chargily transaction reference, amount, currency, status. <em>We never receive or store your card number or CVV.</em></li>
              <li><strong>Technical data:</strong> IP address (short-lived, for fraud prevention), browser and device type, error logs.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-myna-charcoal mb-2">3. Why we collect it</h2>
            <ul className="list-disc ps-5 space-y-1">
              <li>To create and secure your account</li>
              <li>To let teachers and students find each other and hold live lessons</li>
              <li>To verify teachers' identity and certifications before approval</li>
              <li>To process payments, track minute balances, and resolve disputes</li>
              <li>To prevent fraud, abuse, and platform misuse</li>
              <li>To send you service notifications (booking confirmations, payment status, lesson reminders)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-myna-charcoal mb-2">4. Who can see what</h2>
            <ul className="list-disc ps-5 space-y-1">
              <li><strong>Public (anyone):</strong> teacher name, photo, bio, spoken languages, education, certificates (minus files), videos, price range, online status.</li>
              <li><strong>Students see:</strong> the above for teachers they've viewed or booked.</li>
              <li><strong>Teachers see:</strong> the name of students who booked them, plus any lesson notes.</li>
              <li><strong>Admins see:</strong> everything needed to review applications, resolve disputes, or investigate fraud — including ID documents and internal notes.</li>
              <li><strong>Nobody else:</strong> your ID document, phone number, exact email, payment records, and IP address are never shown publicly.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-myna-charcoal mb-2">5. How long we keep it</h2>
            <ul className="list-disc ps-5 space-y-1">
              <li><strong>Active accounts:</strong> kept while your account is open.</li>
              <li><strong>Rejected teacher applications:</strong> retained for [90 days] to allow reapplication, then deleted.</li>
              <li><strong>Approved teacher ID documents:</strong> kept for the duration of the teacher's activity on the platform, and up to [1 year] after account closure, for legal defense purposes.</li>
              <li><strong>Payment records:</strong> kept for [10 years] as required by Algerian tax and commercial law.</li>
              <li><strong>Call logs and chat/lesson notes:</strong> kept for [1 year] for dispute resolution.</li>
              <li><strong>Deleted accounts:</strong> most data is deleted immediately; audit and financial records are retained per the above.</li>
            </ul>
            <p className="mt-2 p-3 bg-myna-charcoal/5 rounded-lg text-sm">
              <strong>[REVIEW BY LAWYER]</strong> Confirm these retention periods against Algerian Law 18-07 and any sectoral requirements.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-myna-charcoal mb-2">6. Your rights</h2>
            <p>Depending on where you live, you may have the right to:</p>
            <ul className="list-disc ps-5 space-y-1 mt-2">
              <li>Access the data we hold about you</li>
              <li>Correct inaccurate data</li>
              <li>Delete your account and personal data (subject to legal retention requirements)</li>
              <li>Export your data in a machine-readable format</li>
              <li>Object to certain processing</li>
              <li>Withdraw consent at any time</li>
              <li>Lodge a complaint with your data protection authority</li>
            </ul>
            <p className="mt-2">
              To exercise any of these, email <strong>privacy@mynalingo.com</strong>. We'll respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-myna-charcoal mb-2">7. Third parties</h2>
            <p>We share limited data with the following processors so the platform works:</p>
            <ul className="list-disc ps-5 space-y-1 mt-2">
              <li><strong>Chargily Pay</strong> (payment gateway) — processes card data and notifies us of payment results. <a href="https://chargily.com/privacy" className="text-myna-orange hover:underline" target="_blank" rel="noopener">Their privacy policy</a>.</li>
              <li><strong>Agora</strong> (video infrastructure) — routes your audio and video during calls. Calls are not recorded by us.</li>
              <li><strong>Hosting provider</strong> — stores our database and uploaded files. [REVIEW BY LAWYER: name hosting provider and location — ideally Algeria or EU.]</li>
            </ul>
            <p className="mt-2">We do not sell your data.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-myna-charcoal mb-2">8. Children</h2>
            <p>
              Accounts for students under 18 must be created and managed by a parent or legal guardian through a Parent account.
              We do not knowingly collect data from children without parental consent. If you believe a child's data has reached
              us without consent, contact us and we'll delete it.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-myna-charcoal mb-2">9. Cookies &amp; local storage</h2>
            <p>
              We don't use advertising cookies. We use your browser's <code className="text-xs bg-myna-charcoal/10 px-1 py-0.5 rounded">localStorage</code>
              to remember your login and language preference. Session tokens expire after 7 days.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-myna-charcoal mb-2">10. Changes</h2>
            <p>
              When we change this policy, we'll update the date at the top and, for material changes, notify you by email or in-app
              before they take effect.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-myna-charcoal mb-2">11. Contact</h2>
            <p>
              Questions about your data? Email <strong>privacy@mynalingo.com</strong>.
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}