import type { Metadata } from "next";
import Link from "next/link";
import { Card, Wordmark } from "@/app/components/ui";

// A public page: no auth, no data fetching. Google's OAuth consent screen and
// the Play Store listing both require a privacy policy at a stable URL that is
// reachable without signing in, so this must stay outside the middleware's
// protected paths.

export const metadata: Metadata = {
  title: "Privacy Policy — Ikou",
  description: "What Ikou collects, why, and how to have it deleted.",
};

// Kept next to the copy it appears in so the address in the text and the one in
// the mailto link can never drift apart.
const CONTACT_EMAIL = "ikou.info@gmail.com";
const LAST_UPDATED = "27 August 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display font-bold text-[19px] tracking-tight">{title}</h2>
      <div className="space-y-3 text-[15px] leading-relaxed text-text-muted font-medium">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen px-4 py-12">
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-3">
          <Link href="/" className="inline-block">
            <Wordmark />
          </Link>
          <div className="space-y-1">
            <h1 className="text-[28px]">Privacy Policy</h1>
            <p className="text-[15px] text-text-muted font-medium">
              Last updated {LAST_UPDATED}
            </p>
          </div>
        </div>

        <Card className="p-6 space-y-8">
          <Section title="The short version">
            <p>
              Ikou is a Japanese learning app. It stores the account you sign in with and
              the progress you make, so your reviews are waiting for you on your next
              visit. There are no advertising trackers and no third-party analytics, and
              your data is never sold or shared for marketing.
            </p>
          </Section>

          <Section title="What we collect">
            <p>
              <strong className="text-text">Account details.</strong> Your email address,
              and a display name if you set one. Sign-in is handled by Supabase Auth. If
              you sign in with Google, Google shares your name, email address and profile
              picture with us; we keep the name and email. We never receive your Google
              password.
            </p>
            <p>
              <strong className="text-text">Learning progress.</strong> Which characters,
              words and phrases you have studied, your answers and whether they were
              correct, review scheduling, streaks, XP, achievements and time spent
              studying. This is the substance of the app — without it there is nothing to
              come back to.
            </p>
            <p>
              <strong className="text-text">Preferences.</strong> Your study goal, chosen
              avatar and stated experience level. Your theme choice and silent-mode
              setting are stored only in your own browser, not on our servers.
            </p>
            <p>
              We do not collect your location, contacts, or any advertising identifier,
              and Ikou contains no third-party analytics or tracking SDKs.
            </p>
          </Section>

          <Section title="Microphone and speech">
            <p>
              The speaking drills ask for microphone access. Ikou never records, stores or
              transmits your audio — we only receive the text your browser produces.
            </p>
            <p>
              That transcription is done by your browser&apos;s built-in speech
              recognition, not by us. Some browsers, including Google Chrome, perform it
              by sending the audio to the browser vendor&apos;s servers. That processing is
              governed by your browser vendor&apos;s privacy policy rather than this one.
              If you would rather it did not happen, decline the microphone permission —
              the speaking drills fall back to grading yourself, and the rest of the app is
              unaffected.
            </p>
          </Section>

          <Section title="Where your data lives">
            <p>
              Accounts and progress are stored in a Postgres database hosted by Supabase in
              the United States. The app itself is hosted on Vercel. Both act as processors
              on our behalf. If you are in the UK, EU or elsewhere outside the United
              States, using Ikou means your data is transferred there.
            </p>
          </Section>

          <Section title="How long we keep it">
            <p>
              Your account and progress are kept for as long as your account exists. If you
              ask us to delete it, we remove your profile and everything attached to it —
              reviews, lessons, achievements and statistics — from our database.
            </p>
          </Section>

          <Section title="Your choices">
            <p>
              You can ask for a copy of your data, ask us to correct it, or ask us to
              delete your account entirely. Email{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-coral hover:brightness-110 transition-all font-bold"
              >
                {CONTACT_EMAIL}
              </a>{" "}
              and we will action it. Depending on where you live, you may also have the
              right to complain to your local data protection authority.
            </p>
          </Section>

          <Section title="Children">
            <p>
              Ikou is not directed at children under 13, and we do not knowingly collect
              their data. If you believe a child has created an account, email us and we
              will remove it.
            </p>
          </Section>

          <Section title="Changes">
            <p>
              If this policy changes in a way that materially affects you, we will update
              the date at the top of this page and, where appropriate, tell you in the app.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              Questions about this policy or your data:{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-coral hover:brightness-110 transition-all font-bold"
              >
                {CONTACT_EMAIL}
              </a>
            </p>
          </Section>
        </Card>

        <p className="text-center text-[14px] text-text-subtle font-medium">
          <Link href="/" className="text-coral hover:brightness-110 transition-all font-bold">
            Back to Ikou
          </Link>
        </p>
      </div>
    </div>
  );
}
