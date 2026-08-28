"use client";

import { ChevronRight } from "lucide-react";
import { TopBar, buttonStyles, buttonVars } from "@/app/components/ui";
import { TrackIntroBody } from "@/app/components/track-intro-body";
import type { TrackIntro } from "@/lib/track-intros";

/**
 * The one-time explainer a track shows the first time it is opened from the
 * dashboard, before any card appears.
 *
 * It is a full screen rather than a dismissible banner over the drill: the
 * point is that the learner reads it, and a card sitting behind a panel is an
 * invitation to swipe it away unread. The drill is already loaded by the time
 * this is on screen, so "Start" is instant.
 */
export function TrackIntroView({
  intro,
  onStart,
}: {
  intro: TrackIntro;
  onStart: () => void;
}) {
  return (
    <div className="min-h-screen">
      <TopBar title={intro.label} />

      <main className="max-w-lg mx-auto px-4 py-8 space-y-7">
        <header className="space-y-4">
          {/* The track's own glyph in the track's own hue — the same pairing
              the dashboard row uses, so it is obvious which one was tapped. */}
          <div className="flex items-center gap-3.5">
            <span
              className="w-16 h-16 rounded-tile grid place-items-center shrink-0"
              style={{ background: `hsl(${intro.tone})`, color: "hsl(var(--on-light))" }}
            >
              <span className="jp text-[1.9rem] font-bold leading-none">{intro.glyph}</span>
            </span>
            <span
              className="inline-flex items-center h-7 px-3 rounded-full font-display text-[12px] font-bold uppercase tracking-[0.1em] text-on-light"
              style={{ background: `hsl(${intro.tone})` }}
            >
              {intro.kicker}
            </span>
          </div>

          <h1 className="font-display font-extrabold text-[27px] leading-[1.15] tracking-tight">
            {intro.title}
          </h1>
        </header>

        <TrackIntroBody intro={intro} />

        <button
          onClick={onStart}
          className={buttonStyles({ full: true, size: "lg" })}
          style={buttonVars("primary")}
        >
          {intro.cta}
          <ChevronRight className="w-[18px] h-[18px]" strokeWidth={3} />
        </button>
      </main>
    </div>
  );
}
