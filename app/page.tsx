import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Brain, Compass, TrainFront } from "lucide-react";
import { buttonStyles, buttonVars, Wordmark } from "@/app/components/ui";

const FEATURES = [
  {
    icon: TrainFront,
    title: "Stuff you'll actually use",
    desc: "Train stations, konbini, restaurants, pharmacies. Every item earns its place by being something you'll really meet.",
    tone: "var(--sky)",
  },
  {
    icon: Brain,
    title: "It knows what you're forgetting",
    desc: "Each session is built from whatever is closest to slipping away, so your ten minutes land where they count.",
    tone: "var(--grape)",
  },
  {
    icon: Compass,
    title: "A readiness score, not a streak",
    desc: "One honest number for how close you are to handling a trip unaided — weighted by what travel actually demands.",
    tone: "var(--lime)",
  },
];

const SCRIPTS = [
  { glyph: "あ", label: "Hiragana", tone: "var(--blossom)" },
  { glyph: "ア", label: "Katakana", tone: "var(--sky)" },
  { glyph: "漢", label: "Kanji", tone: "var(--sun)" },
  { glyph: "語", label: "Words", tone: "var(--grape)" },
  { glyph: "話", label: "Phrases", tone: "var(--lime)" },
];

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <main className="min-h-screen flex flex-col">
      <header className="border-b-2 border-line">
        <div className="max-w-2xl mx-auto px-6 h-20 flex items-center justify-between">
          <Wordmark />
          <Link
            href="/login"
            className={buttonStyles({ variant: "ghost", size: "sm" })}
          >
            Sign in
          </Link>
        </div>
      </header>

      <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-14 sm:py-20">
        {/* Hero */}
        <section>
          <span
            className="inline-flex items-center h-8 px-4 rounded-full font-display text-[12px] font-bold uppercase tracking-[0.1em] text-on-light mb-6"
            style={{ background: "hsl(var(--sun))" }}
          >
            Japanese for travellers
          </span>

          <h1 className="text-[2.75rem] sm:text-[4rem] leading-[0.98] mb-6">
            Land in Japan
            <br />
            able to{" "}
            <span className="relative inline-block">
              <span className="relative z-10">read the room</span>
              {/* A hand-drawn-feeling highlight behind the payoff words. */}
              <span
                className="absolute inset-x-[-6px] bottom-[0.06em] h-[0.28em] z-0 rounded-full -rotate-1"
                style={{ background: "hsl(var(--coral))" }}
                aria-hidden="true"
              />
            </span>
            .
          </h1>

          <p className="text-[17px] text-text-muted leading-relaxed mb-9 max-w-lg font-medium">
            Ikou teaches the Japanese that changes a trip — reading signs, ordering
            without pointing, asking for help and understanding the answer. Ten
            minutes a day. No prior knowledge assumed.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/signup"
              className={buttonStyles({ size: "lg" })}
              style={buttonVars("primary")}
            >
              Start free
              <ArrowRight className="w-[18px] h-[18px]" strokeWidth={3} />
            </Link>
            <Link
              href="/login"
              className={buttonStyles({ variant: "secondary", size: "lg" })}
              style={buttonVars("secondary")}
            >
              I have an account
            </Link>
          </div>
        </section>

        {/* The five tracks, each as its own colour block */}
        <section className="mt-16 grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {SCRIPTS.map((s) => (
            <div
              key={s.label}
              className="rounded-card p-4 text-on-light card-ledge"
              style={{ background: `hsl(${s.tone})`, ["--ledge" as string]: "hsl(var(--ink-deep))" }}
            >
              <div className="jp text-[2.75rem] leading-none font-bold mb-2">{s.glyph}</div>
              <div className="font-display text-[13px] font-bold">{s.label}</div>
            </div>
          ))}
        </section>

        {/* Features */}
        <section className="mt-16 space-y-3">
          {FEATURES.map(({ icon: Icon, title, desc, tone }) => (
            <div
              key={title}
              className="flex gap-4 p-5 rounded-card border-2 border-line bg-surface card-ledge"
            >
              <span
                className="w-12 h-12 rounded-tile grid place-items-center shrink-0 text-on-light"
                style={{ background: `hsl(${tone})` }}
              >
                <Icon className="w-6 h-6" strokeWidth={2.5} />
              </span>
              <div>
                <h2 className="text-[19px] mb-1.5">{title}</h2>
                <p className="text-[14px] text-text-muted leading-relaxed font-medium">{desc}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Closing call to action */}
        <section className="mt-14">
          <div
            className="relative rounded-card overflow-hidden card-ledge text-on-light p-7 text-center"
            style={{ background: "hsl(var(--coral))", ["--ledge" as string]: "hsl(var(--ink-deep))" }}
          >
            <span
              className="jp absolute -right-6 -bottom-12 text-[12rem] leading-none font-bold select-none pointer-events-none"
              style={{ color: "hsl(var(--on-light) / 0.13)" }}
              aria-hidden="true"
            >
              行
            </span>
            <div className="relative">
              <h2 className="text-[26px] mb-2">Your trip is closer than you think</h2>
              <p className="text-[15px] font-medium opacity-85 mb-6 max-w-sm mx-auto">
                Start with hiragana today. It is the one that unlocks everything else.
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 h-14 px-7 rounded-full font-display font-bold text-[16px] bg-on-light text-coral ledge"
                style={{ ["--ledge" as string]: "hsl(var(--ink-deep))" }}
              >
                Start free
                <ArrowRight className="w-[18px] h-[18px]" strokeWidth={3} />
              </Link>
            </div>
          </div>
        </section>
      </div>

      <footer className="border-t-2 border-line">
        <div className="max-w-2xl mx-auto px-6 py-8 flex flex-wrap items-center justify-between gap-4">
          <Wordmark />
          <p className="text-[13px] text-text-subtle font-medium">
            Hiragana · Katakana · Kanji · Words · Phrases
          </p>
        </div>
      </footer>
    </main>
  );
}
