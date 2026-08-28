"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionLabel } from "@/app/components/ui";
import { KANJI_TIERS, KANJI_DEPTH_COPY, type KanjiDepth } from "@/lib/kanji-tiers";

/**
 * How much kanji the learner wants.
 *
 * It lives on the kanji track rather than in Settings on purpose: the choice
 * only means anything next to the three bands it is choosing between, and the
 * tier list directly above it is what makes "essential only" a decision rather
 * than a guess. Settings is where you go to change something you already
 * understand; this is where you come to understand it.
 *
 * The saved value is applied optimistically and rolled back if the write
 * fails — the whole page below re-reads from it, and a row of bars that
 * disagreed with the button you just pressed would read as a bug.
 */
export function KanjiDepthPicker({ initial }: { initial: KanjiDepth }) {
  const router = useRouter();
  const [depth, setDepth] = useState<KanjiDepth>(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function choose(next: KanjiDepth) {
    if (next === depth || pending) return;
    const previous = depth;
    setDepth(next);
    setError(null);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kanjiDepth: next }),
      });
      if (!res.ok) throw new Error("save failed");
      // The tier rows, the totals and the dashboard row all read this value
      // server-side, so the page has to come back from the server to agree.
      startTransition(() => router.refresh());
    } catch {
      setDepth(previous);
      setError("Couldn't save that — check your connection and try again.");
    }
  }

  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <SectionLabel>How much kanji</SectionLabel>
        <p className="text-[14px] text-text-muted leading-relaxed font-medium">
          Lessons and drills serve only what you pick here. Nothing is lost by
          narrowing it — widen it again and the characters come straight back.
        </p>
      </div>

      <div className="space-y-2">
        {KANJI_TIERS.map((tier) => {
          const isOn = depth === tier;
          const { label, blurb } = KANJI_DEPTH_COPY[tier];
          return (
            <button
              key={tier}
              type="button"
              onClick={() => choose(tier)}
              aria-pressed={isOn}
              disabled={pending}
              className={cn(
                "w-full text-left p-4 rounded-card border elevated transition-colors duration-150",
                "flex items-start gap-3 disabled:opacity-70",
                isOn
                  ? "border-lime bg-lime/10"
                  : "border-line bg-surface hover:border-line-strong"
              )}
            >
              <span
                className={cn(
                  "w-5 h-5 rounded-full grid place-items-center shrink-0 mt-0.5 border-2",
                  isOn ? "bg-lime border-lime text-on-light" : "border-line-strong"
                )}
                aria-hidden="true"
              >
                {isOn && <Check className="w-3 h-3" strokeWidth={3.5} />}
              </span>
              <span className="min-w-0">
                <span
                  className={cn(
                    "block font-display font-bold text-[15px] tracking-tight",
                    isOn ? "text-lime" : "text-text"
                  )}
                >
                  {label}
                </span>
                <span className="block text-[13px] text-text-muted leading-relaxed font-medium mt-0.5">
                  {blurb}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {error && (
        <p className="text-[13px] font-medium text-rose px-1" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
