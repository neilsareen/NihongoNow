"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Wordmark, buttonStyles } from "@/app/components/ui";

// Levels read as a ladder: each row states what the learner can already do,
// which is easier to self-assess against than a badge or a JLPT number alone.
const LEVELS = [
  { id: "complete_beginner", label: "Complete beginner", desc: "I know no Japanese at all", glyph: "一" },
  { id: "know_hiragana", label: "Hiragana", desc: "I can read hiragana", glyph: "あ" },
  { id: "know_kana", label: "Both kana", desc: "I can read hiragana and katakana", glyph: "ア" },
  { id: "some_kanji", label: "Some kanji", desc: "I know some kanji and everyday vocabulary", glyph: "漢" },
  { id: "intermediate", label: "Intermediate", desc: "Roughly JLPT N4–N3", glyph: "語" },
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
      <header className="border-b border-line">
        <div className="max-w-lg mx-auto h-16 px-4 flex items-center">
          <Link href="/">
            <Wordmark className="text-[15px]" />
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-10 space-y-9">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Set up your path</h1>
          <p className="text-sm text-text-muted leading-relaxed">
            Two answers, and Ikou builds a schedule around where you actually are.
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.09em] text-text-subtle">
            Where are you starting from?
          </h2>
          <div className="space-y-2">
            {LEVELS.map((level) => {
              const isOn = selectedLevel === level.id;
              return (
                <button
                  key={level.id}
                  onClick={() => setSelectedLevel(level.id)}
                  aria-pressed={isOn}
                  className={cn(
                    "w-full flex items-center gap-3 p-3.5 rounded-xl border text-left",
                    "transition-colors duration-150 ease-swift",
                    isOn
                      ? "border-accent/45 bg-accent/[0.07]"
                      : "border-line bg-surface hover:border-line-strong"
                  )}
                >
                  <span
                    className={cn(
                      "w-9 h-9 rounded-lg grid place-items-center shrink-0 border",
                      isOn
                        ? "bg-accent/12 border-accent/30 text-accent"
                        : "bg-surface-raised border-line text-text-muted"
                    )}
                  >
                    <span className="jp text-base font-medium leading-none">{level.glyph}</span>
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium">{level.label}</span>
                    <span className="block text-[13px] text-text-muted mt-0.5">{level.desc}</span>
                  </span>
                  <span
                    className={cn(
                      "w-5 h-5 rounded-full border grid place-items-center shrink-0 transition-colors",
                      isOn ? "bg-accent border-accent text-accent-fg" : "border-line-strong"
                    )}
                  >
                    {isOn && <Check className="w-3 h-3" strokeWidth={3} />}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.09em] text-text-subtle">
            Daily goal
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
                    "h-11 rounded-lg border text-sm font-medium tnum",
                    "transition-colors duration-150 ease-swift",
                    isOn
                      ? "border-accent bg-accent text-accent-fg"
                      : "border-line bg-surface text-text-muted hover:border-line-strong hover:text-text"
                  )}
                >
                  {min} min
                </button>
              );
            })}
          </div>
          <p className="text-[13px] text-text-subtle">
            Lessons run about ten minutes; your goal sets how many to aim for.
          </p>
        </section>

        {error && (
          <p
            role="alert"
            className="text-[13px] text-danger bg-danger/10 border border-danger/25 rounded-lg px-3 py-2.5"
          >
            {error}
          </p>
        )}

        <button
          onClick={handleComplete}
          disabled={!selectedLevel || loading}
          className={buttonStyles({ size: "lg", full: true })}
        >
          {loading ? "Setting things up…" : "Start learning"}
        </button>
      </main>
    </div>
  );
}
