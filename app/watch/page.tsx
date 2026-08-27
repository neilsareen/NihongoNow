import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock, Lock, Play } from "lucide-react";
import { getSessionUser } from "@/lib/simulation";
import { getConversationGate } from "@/lib/progression";
import { DIALOGUES } from "@/lib/dialogues";
import { BottomNav } from "@/app/components/bottom-nav";
import { Card, ProgressBar, SectionLabel, TopBar } from "@/app/components/ui";

/* ===========================================================================
   Watch — the conversation track, played out rather than drilled.

   Gated exactly like the rest of the conversation content, and for the same
   reason: every line on screen is written in kana, so the promise only holds
   once the whole alphabet is at Learning.
   =========================================================================== */

/**
 * "Six scenes" rather than "6 scenes": a heading with a digit in it reads like
 * a statistic, and this is a shelf, not a score. Falls back to the numeral past
 * the point where a word is shorter than the number it spells.
 */
const COUNT_WORDS = [
  "No", "One", "Two", "Three", "Four", "Five", "Six",
  "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve",
];

function sceneCount(n: number): string {
  return `${COUNT_WORDS[n] ?? n} ${n === 1 ? "scene" : "scenes"}`;
}

export default async function WatchIndexPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  const gate = await getConversationGate(session.userId);

  return (
    <div className="min-h-screen">
      <TopBar title="Watch" />

      <main className="max-w-lg mx-auto px-4 py-6 space-y-7 pb-[calc(6rem+env(safe-area-inset-bottom))]">
        <div className="space-y-2">
          <h1 className="text-hero leading-none">Watch<br />it happen</h1>
          <p className="text-[15px] text-text-muted leading-relaxed font-medium max-w-[34ch]">
            The lines you drill as single cards, chained into the real thing — both
            sides, at speed, with subtitles you can follow.
          </p>
        </div>

        {gate.unlocked ? (
          <section className="space-y-3">
            <SectionLabel>{sceneCount(DIALOGUES.length)}</SectionLabel>
            <div className="space-y-2.5 stagger">
              {DIALOGUES.map((d) => (
                <Link
                  key={d.id}
                  href={`/watch/${d.id}`}
                  className="block p-4 rounded-card border border-line bg-surface elevated hover:border-line-strong transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span
                      className="w-14 h-14 rounded-tile grid place-items-center shrink-0 text-on-light"
                      style={{ background: "hsl(var(--track-conversation))" }}
                    >
                      <span className="jp text-2xl font-bold leading-none">{d.glyph}</span>
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-bold text-[17px] tracking-tight">{d.title}</p>
                      <p className="text-[12px] font-bold text-text-subtle mt-1 flex items-center gap-3">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" strokeWidth={2.5} />
                          <span className="tnum">
                            {Math.floor(d.seconds / 60)}:{String(d.seconds % 60).padStart(2, "0")}
                          </span>
                        </span>
                        <span className="tnum">{d.turns.length} lines</span>
                      </p>
                    </div>
                    <span
                      className="w-11 h-11 rounded-full grid place-items-center shrink-0 text-on-light"
                      style={{ background: "hsl(var(--track-conversation))" }}
                      aria-hidden="true"
                    >
                      <Play className="w-4 h-4 ml-0.5" strokeWidth={3} fill="currentColor" />
                    </span>
                  </div>
                  <p className="text-[13px] text-text-muted leading-relaxed font-medium mt-3">
                    {d.blurb}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ) : (
          <Card className="p-5 space-y-4">
            <div className="flex items-center gap-4">
              <span
                className="w-14 h-14 rounded-tile grid place-items-center shrink-0"
                style={{ background: "hsl(var(--ink-deep))" }}
              >
                <Lock className="w-5 h-5 text-text-subtle" strokeWidth={2.5} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-[17px] tracking-tight text-text-subtle">
                  Locked
                </p>
                <p className="text-[12px] font-bold text-text-subtle tnum mt-1">
                  {gate.ready}/{gate.total} kana ready
                </p>
              </div>
            </div>
            <ProgressBar
              value={gate.total > 0 ? Math.round((gate.ready / gate.total) * 100) : 0}
              hue="var(--track-conversation)"
            />
            <p className="text-[13px] text-text-muted leading-relaxed font-medium">
              Every line in these scenes is written in kana, so they open once every
              hiragana and katakana has reached Learning — {gate.remaining} to go.
            </p>
          </Card>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
