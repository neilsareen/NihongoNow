"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Wordmark, buttonStyles, buttonVars } from "@/app/components/ui";

// Levels read as a ladder: each row states what the learner can already do,
// which is easier to self-assess against than a badge or a JLPT number alone.
const LEVELS: { id: string; label: string; desc: string; glyph: string; tone: string }[] = [
  { id: "complete_beginner", label: "Total beginner", desc: "I know no Japanese at all", glyph: "一", tone: "var(--coral)" },
  { id: "know_hiragana", label: "Hiragana", desc: "I can read hiragana", glyph: "あ", tone: "var(--blossom)" },
  { id: "know_kana", label: "Both kana", desc: "Hiragana and katakana, no problem", glyph: "ア", tone: "var(--sky)" },
  { id: "some_kanji", label: "Some kanji", desc: "Some kanji and everyday words", glyph: "漢", tone: "var(--sun)" },
  { id: "intermediate", label: "Intermediate", desc: "Roughly JLPT N4–N3", glyph: "語", tone: "var(--grape)" },
];

const GOALS = [10, 15, 20, 30];

export default function OnboardingPage() {
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [studyGoal, setStudyGoal] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleComplete() {
    if (!selectedLevel) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nativeLevel: selectedLevel,
          studyGoalMinutes: studyGoal,
        }),
      });
      if (res.ok) {
        router.push("/dashboard");
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || `Error ${res.status} — please try again`);
        setLoading(false);
      }
    } catch {
      setError("Network error — please try again");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="top-chrome border-b border-line">
        <div className="max-w-lg mx-auto h-16 px-4 flex items-center">
          <Link href="/">
            <Wordmark />
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-10 space-y-9">
        <div className="space-y-2">
          <h1 className="text-hero leading-none">Let&apos;s get<br />you started</h1>
          <p className="text-[15px] text-text-muted leading-relaxed font-medium max-w-[34ch]">
            Two questions. Then Ikou builds a schedule around exactly where you are.
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="font-display text-[13px] font-bold uppercase tracking-[0.1em] text-text-subtle">
            Where are you starting from?
          </h2>
          <div className="space-y-2.5 stagger">
            {LEVELS.map((level) => {
              const isOn = selectedLevel === level.id;
              return (
                <button
                  key={level.id}
                  onClick={() => setSelectedLevel(level.id)}
                  aria-pressed={isOn}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-card border text-left elevated",
                    "transition-colors duration-150",
                    isOn ? "bg-surface" : "border-line bg-surface hover:border-line-strong"
                  )}
                  style={
                    isOn
                      ? {
                          borderColor: `hsl(${level.tone} / 0.75)`,
                          // A hairline alone is too quiet to carry selection, so
                          // the chosen row also takes a wash of its own hue. It
                          // is layered over --surface rather than replacing it,
                          // so the tint reads the same on either ground.
                          background: `linear-gradient(hsl(${level.tone} / 0.14), hsl(${level.tone} / 0.14)), hsl(var(--surface))`,
                        }
                      : undefined
                  }
                >
                  <span
                    className="w-14 h-14 rounded-tile grid place-items-center shrink-0 text-on-light"
                    style={{ background: `hsl(${level.tone})` }}
                  >
                    <span className="jp text-2xl font-bold leading-none">{level.glyph}</span>
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-display font-bold text-[17px] tracking-tight">
                      {level.label}
                    </span>
                    <span className="block text-[13px] text-text-muted mt-0.5 font-medium">
                      {level.desc}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "w-7 h-7 rounded-full grid place-items-center shrink-0 transition-colors border",
                      isOn ? "text-on-light" : "border-line-strong"
                    )}
                    style={isOn ? { background: `hsl(${level.tone})`, borderColor: `hsl(${level.tone})` } : undefined}
                  >
                    {isOn && <Check className="w-4 h-4" strokeWidth={3.5} />}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-[13px] font-bold uppercase tracking-[0.1em] text-text-subtle">
            How much a day?
          </h2>
          <div className="grid grid-cols-4 gap-2">
            {GOALS.map((min) => {
              const isOn = studyGoal === min;
              return (
                <button
                  key={min}
                  onClick={() => setStudyGoal(min)}
                  aria-pressed={isOn}
                  className={cn(
                    "h-16 rounded-tile border font-display font-bold text-[16px] tnum elevated",
                    "transition-colors duration-150",
                    isOn
                      ? "border-lime bg-lime text-on-light"
                      : "border-line bg-surface text-text-muted hover:border-line-strong hover:text-text"
                  )}
                >
                  {min}
                  <span className="text-[11px] font-bold opacity-70 ml-0.5">min</span>
                </button>
              );
            })}
          </div>
          <p className="text-[13px] text-text-subtle font-medium">
            Lessons run about ten minutes — your goal sets how many to aim for.
          </p>
        </section>

        {error && (
          <p
            role="alert"
            className="text-[14px] text-rose bg-rose/12 border border-rose/35 rounded-tile px-4 py-3 font-semibold animate-shake"
          >
            {error}
          </p>
        )}

        <button
          onClick={handleComplete}
          disabled={!selectedLevel || loading}
          className={buttonStyles({ size: "lg", full: true })}
          style={buttonVars("primary")}
        >
          {loading ? "Setting things up…" : "Start learning"}
        </button>
      </main>
    </div>
  );
}
