import type { TrackIntro } from "@/lib/track-intros";

/**
 * The prose of a track introduction: what the track is, then how it behaves.
 *
 * Shared because kanji shows the same explanation in a different frame — its
 * row opens a track screen rather than a drill, so its intro is a card on that
 * screen instead of the full page every other track gets. One component keeps
 * the two from drifting into telling learners different things.
 */
export function TrackIntroBody({ intro }: { intro: TrackIntro }) {
  return (
    <>
      <div className="space-y-4">
        {intro.body.map((paragraph, i) => (
          <p key={i} className="text-[17px] text-text-muted leading-relaxed">
            {paragraph}
          </p>
        ))}
      </div>

      <section className="space-y-2.5">
        <h2 className="font-display text-[14px] font-bold uppercase tracking-[0.1em] text-text-subtle">
          How this track works
        </h2>
        <ul className="space-y-2.5">
          {intro.points.map((point) => (
            <li
              key={point.label}
              className="flex gap-3 p-3.5 rounded-card border border-line bg-surface elevated"
            >
              <span
                className="w-1 self-stretch rounded-full shrink-0"
                style={{ background: `hsl(${intro.tone})` }}
                aria-hidden="true"
              />
              <span className="min-w-0">
                <span className="block font-display font-bold text-[16px] tracking-tight">
                  {point.label}
                </span>
                <span className="block text-[15px] text-text-muted leading-relaxed mt-0.5">
                  {point.text}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
