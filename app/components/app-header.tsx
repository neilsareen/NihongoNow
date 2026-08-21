import Link from "next/link";
import { Flame } from "lucide-react";
import { Avatar, Wordmark } from "@/app/components/ui";
import type { ResolvedAvatar } from "@/lib/utils";

/**
 * The app header.
 * ---------------------------------------------------------------------------
 * Chrome that says whose app this is, on every screen inside the tab bar.
 *
 * Three decisions worth keeping:
 *
 * 1. The band is a warmed ink, not brand colour. The obvious move is a coral
 *    bar — but coral is this app's *action* colour, and the first thing under
 *    the header is a coral card telling you to start a lesson. Painting the
 *    chrome the same colour would cost that card the only thing making it
 *    unmissable. So `--brand-bar` is pulled just far enough towards coral to
 *    separate the chrome from the violet ground, and the mark carries the
 *    colour itself.
 *
 * 2. The signature is the cast stripe along the bottom edge: the five track
 *    hues, in the order the curriculum unlocks them. It is the app's own
 *    palette used as a logotype, and it is not decoration — those same five
 *    colours name Hiragana, Katakana, Kanji, Vocabulary and Phrases everywhere
 *    else in the interface, so the stripe is a legend for the whole product.
 *
 * 3. Both edges of the bar do work rather than sitting symmetrical for looks:
 *    the learner's kanji avatar (into Settings) and their streak. That is what
 *    lets the dashboard below open on a greeting instead of a second header.
 */

// Curriculum order, matching the track list on the dashboard.
const CAST = [
  "var(--track-hiragana)",
  "var(--track-katakana)",
  "var(--track-kanji)",
  "var(--track-vocab)",
  "var(--track-phrase)",
];

export function AppHeader({
  avatar,
  streak,
}: {
  avatar?: ResolvedAvatar | null;
  streak?: number;
}) {
  return (
    <header className="sticky top-0 z-40">
      <div className="bg-brand-bar/95 backdrop-blur-xl pt-[env(safe-area-inset-top)]">
        <div className="max-w-lg mx-auto h-16 px-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          {avatar ? (
            <Link
              href="/settings"
              aria-label="Your profile and settings"
              className="justify-self-start rounded-tile"
            >
              <Avatar avatar={avatar} size={36} />
            </Link>
          ) : (
            <span className="justify-self-start" />
          )}

          <Link href="/dashboard" aria-label="Ikou — home" className="justify-self-center">
            <Wordmark size="sm" />
          </Link>

          {typeof streak === "number" ? (
            <span
              className="justify-self-end inline-flex items-center gap-1.5 h-9 px-3 rounded-full font-display font-bold text-[15px] border-2"
              // The fill is the app's own surface rather than a tinted sun,
              // which on this warm band would silt up into olive. A clean
              // plate with the sun on the flame and the number instead.
              style={{
                background: "hsl(var(--surface))",
                borderColor: streak > 0 ? "hsl(var(--sun) / 0.5)" : "hsl(var(--line))",
                color: streak > 0 ? "hsl(var(--sun))" : "hsl(var(--text-subtle))",
              }}
              title={
                streak > 0
                  ? `${streak} day streak`
                  : "Finish a lesson today to start a streak"
              }
            >
              <Flame
                className="w-4 h-4"
                strokeWidth={2.5}
                fill={streak > 0 ? "currentColor" : "none"}
              />
              <span className="tnum">{streak}</span>
              <span className="sr-only">day streak</span>
            </span>
          ) : (
            <span className="justify-self-end" />
          )}
        </div>
      </div>

      {/* The cast stripe. */}
      <div className="flex h-[3px]" aria-hidden="true">
        {CAST.map((hue) => (
          <span key={hue} className="flex-1" style={{ background: `hsl(${hue})` }} />
        ))}
      </div>
    </header>
  );
}
