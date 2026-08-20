import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Brain, Compass, TrainFront } from "lucide-react";
import { buttonStyles, Wordmark } from "@/app/components/ui";

const FEATURES = [
  {
    icon: TrainFront,
    title: "Built around real situations",
    desc: "Train stations, restaurants, konbini, pharmacies. Every item earns its place by being something you'll actually meet.",
  },
  {
    icon: Brain,
    title: "Spaced repetition that adapts",
    desc: "Each session is assembled from what you're closest to forgetting, so review time goes where it changes the outcome.",
  },
  {
    icon: Compass,
    title: "A readiness score, not a streak",
    desc: "One measure of how far you are from handling a trip unaided — weighted by what travel actually demands.",
  },
];

const SCRIPTS = [
  { glyph: "あ", label: "Hiragana" },
  { glyph: "ア", label: "Katakana" },
  { glyph: "漢", label: "Kanji" },
  { glyph: "語", label: "Vocabulary" },
];

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <main className="min-h-screen flex flex-col">
      <header className="border-b border-line">
        <div className="max-w-2xl mx-auto px-6 h-16 flex items-center justify-between">
          <Wordmark className="text-[15px]" />
          <Link href="/login" className={buttonStyles({ variant: "ghost", size: "sm" })}>
            Sign in
          </Link>
        </div>
      </header>

      <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-16 sm:py-24">
        {/* Hero */}
        <section className="max-w-xl">
          <p className="text-[13px] font-medium text-accent mb-4">Japanese for travellers</p>
          <h1 className="text-[2.25rem] sm:text-[3rem] font-semibold leading-[1.08] tracking-[-0.03em] mb-5">
            Arrive in Japan able to
            <br className="hidden sm:block" /> read the room.
          </h1>
          <p className="text-base text-text-muted leading-relaxed mb-8 max-w-lg">
            Ikou teaches the Japanese that changes a trip — reading signs, ordering
            confidently, asking for help. Ten focused minutes a day, no prior
            knowledge assumed.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/signup" className={buttonStyles({ size: "lg" })}>
              Start learning
              <ArrowRight className="w-4 h-4" strokeWidth={2} />
            </Link>
            <Link href="/login" className={buttonStyles({ variant: "secondary", size: "lg" })}>
              I have an account
            </Link>
          </div>
        </section>

        {/* Script strip — the four tracks, stated plainly */}
        <section className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-px bg-line border border-line rounded-xl overflow-hidden">
          {SCRIPTS.map((s) => (
            <div key={s.label} className="bg-surface px-5 py-6">
              <div className="jp text-3xl text-text mb-2 leading-none">{s.glyph}</div>
              <div className="text-[13px] text-text-muted">{s.label}</div>
            </div>
          ))}
        </section>

        {/* Features */}
        <section className="mt-16 space-y-10">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex gap-4 max-w-xl">
              <div className="w-9 h-9 rounded-lg bg-surface border border-line grid place-items-center shrink-0 mt-0.5">
                <Icon className="w-[18px] h-[18px] text-accent" strokeWidth={1.75} />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold mb-1.5">{title}</h2>
                <p className="text-sm text-text-muted leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </section>
      </div>

      <footer className="border-t border-line">
        <div className="max-w-2xl mx-auto px-6 py-8 flex flex-wrap items-center justify-between gap-4">
          <Wordmark className="text-[13px] text-text-muted" />
          <p className="text-xs text-text-subtle">
            Hiragana · Katakana · Kanji · Vocabulary · Phrases
          </p>
        </div>
      </footer>
    </main>
  );
}
