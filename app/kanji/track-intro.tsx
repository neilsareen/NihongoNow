"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/app/components/ui";
import { TrackIntroBody } from "@/app/components/track-intro-body";
import {
  TRACK_INTROS,
  hasSeenTrackIntro,
  markTrackIntroSeen,
  type TrackIntroScope,
} from "@/lib/track-intros";

/**
 * "What is Kanji?", on the kanji track screen.
 *
 * Every other track opens straight into a drill, so its explainer is the full
 * screen in app/practice/track-intro.tsx. Kanji opens a screen of its own, and
 * two pages of reading back to back is how an explanation gets skipped — so
 * here it is a panel at the top instead: open the first time, folded away
 * afterwards, and reopenable, which is more than the others get.
 *
 * Reading it here also settles the drill: the same "seen" flag gates the full
 * screen behind "Drill these kanji", so nobody is told what kanji is twice in
 * one sitting.
 */
export function KanjiTrackIntro({ simulating }: { simulating: boolean }) {
  const intro = TRACK_INTROS.KANJI;
  const scope: TrackIntroScope = simulating ? "sim" : "self";

  // Starts closed on both the server and the first client render — localStorage
  // cannot be read during hydration, and a panel that unfolds a beat later is
  // far better than one that slams shut on a returning learner.
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (hasSeenTrackIntro("KANJI", scope)) return;
    setOpen(true);
    // Marked on sight rather than on dismissal: it is on screen, and there is
    // no "start" here to hang it off.
    markTrackIntroSeen("KANJI", scope);
  }, [scope]);

  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-3.5 p-4 text-left"
      >
        <span
          className="w-11 h-11 rounded-tile grid place-items-center shrink-0"
          style={{ background: `hsl(${intro.tone})`, color: "hsl(var(--on-light))" }}
        >
          <span className="jp text-xl font-bold leading-none">{intro.glyph}</span>
        </span>
        <span className="flex-1 min-w-0">
          <span className="block font-display font-bold text-[15px] tracking-tight">
            {intro.title}
          </span>
          <span className="block text-[13px] text-text-subtle font-medium">
            {open ? "Tap to fold away" : "What kanji is, and how this track works"}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "w-5 h-5 shrink-0 text-text-subtle transition-transform",
            open && "rotate-180"
          )}
          strokeWidth={2.5}
        />
      </button>

      {open && (
        <div className="px-4 pb-5 space-y-5 animate-fade">
          <TrackIntroBody intro={intro} />
        </div>
      )}
    </Card>
  );
}
