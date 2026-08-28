import Link from "next/link";
import { redirect } from "next/navigation";
import { Lock } from "lucide-react";
import { getSessionUser } from "@/lib/simulation";
import { prisma } from "@/lib/prisma";
import {
  getKanjiDepth,
  getKanjiTierProgress,
  getMasteredKana,
  getUnlockedKanji,
} from "@/lib/progression";
import { KANJI_TIER_COPY } from "@/lib/kanji-tiers";
import {
  Card,
  ProgressBar,
  SectionLabel,
  TopBar,
  buttonStyles,
  buttonVars,
} from "@/app/components/ui";
import { KanjiDepthPicker } from "./depth-picker";
import { KanjiTrackIntro } from "./track-intro";

/**
 * The kanji track.
 * ---------------------------------------------------------------------------
 * Every other track row on the dashboard opens a drill. This one opens a
 * screen, because kanji is the one track where the first question is not "how
 * many today" but "how much of this do I want at all" — and that question
 * needs the three bands laid out beside it to be answerable.
 *
 * The bands and their reasoning live in lib/kanji-tiers.ts.
 */
export default async function KanjiTrackPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  const depth = await getKanjiDepth(session.userId);
  const [tiers, masteredKana, corpusSize] = await Promise.all([
    getKanjiTierProgress(session.userId, depth),
    getMasteredKana(session.userId),
    prisma.kanji.count(),
  ]);

  const unlocked = await getUnlockedKanji(masteredKana, [], depth);
  const canDrill = unlocked.length > 0;

  const included = tiers.filter((t) => t.included);
  const total = included.reduce((n, t) => n + t.total, 0);
  const mastered = included.reduce((n, t) => n + t.mastered, 0);
  const pct = total > 0 ? Math.min(100, Math.round((mastered / total) * 100)) : 0;

  return (
    <div className="min-h-screen">
      <TopBar title="Kanji" />

      <main className="max-w-lg mx-auto px-4 py-6 space-y-8 pb-[calc(6rem+var(--safe-b))]">
        <div className="space-y-2">
          <h1 className="text-hero leading-none">
            Only the
            <br />
            kanji you need
          </h1>
          <p className="text-[15px] text-text-muted leading-relaxed font-medium max-w-[34ch]">
            Ikou is built around understanding what is said to you and being
            able to answer. Kanji helps you read a sign — it is not the price of
            admission, so you set how far into it you go.
          </p>
        </div>

        {/* What kanji actually is, for anyone who arrived here before a
            lesson ever mentioned it. Open on a first visit, folded away after. */}
        <KanjiTrackIntro simulating={session.isSimulating} />

        {/* Where the learner currently stands, against their own ceiling
            rather than against the whole corpus. */}
        <Card className="p-5 space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-display font-bold text-[16px] tracking-tight">
              In your set
            </span>
            <span className="text-[13px] font-bold text-text-subtle tnum">
              {mastered.toLocaleString()} / {total.toLocaleString()} mastered
            </span>
          </div>
          <ProgressBar value={pct} hue="var(--track-kanji)" className="h-4" />
          <p className="text-[13px] text-text-subtle font-medium">
            {corpusSize.toLocaleString()} characters in the corpus overall.
          </p>
        </Card>

        {/* The three bands, so the choice below is made against something. */}
        <section className="space-y-3">
          <SectionLabel className="px-1">The three bands</SectionLabel>
          <div className="space-y-2.5">
            {tiers.map((t) => {
              const copy = KANJI_TIER_COPY[t.tier];
              const tierPct =
                t.total > 0 ? Math.min(100, Math.round((t.mastered / t.total) * 100)) : 0;
              return (
                <div
                  key={t.tier}
                  className="flex items-start gap-4 p-3.5 rounded-card border border-line bg-surface elevated"
                >
                  <span
                    className="w-12 h-12 rounded-tile grid place-items-center shrink-0"
                    style={
                      t.included
                        ? { background: `hsl(${copy.tone})`, color: "hsl(var(--on-light))" }
                        : { background: "hsl(var(--ink-deep))" }
                    }
                  >
                    {t.included ? (
                      <span className="jp text-xl font-bold leading-none">漢</span>
                    ) : (
                      <Lock className="w-4 h-4 text-text-subtle" strokeWidth={2.5} />
                    )}
                  </span>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <span
                        className={`font-display font-bold text-[15px] tracking-tight ${
                          t.included ? "" : "text-text-subtle"
                        }`}
                      >
                        {copy.label}
                      </span>
                      <span className="text-[12px] font-bold text-text-subtle tnum shrink-0">
                        {t.included
                          ? `${t.mastered} / ${t.total}`
                          : `${t.total} not in your set`}
                      </span>
                    </div>
                    <p className="text-[13px] text-text-muted leading-relaxed font-medium">
                      {copy.blurb}
                    </p>
                    <ProgressBar
                      value={t.included ? tierPct : 0}
                      hue={t.included ? copy.tone : "var(--line)"}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <KanjiDepthPicker initial={depth} />

        {canDrill ? (
          <Link
            href="/practice?type=KANJI"
            className={buttonStyles({ variant: "primary", full: true, size: "lg" })}
            style={buttonVars("primary")}
          >
            Drill these kanji
          </Link>
        ) : (
          <Card className="p-4">
            <p className="text-[14px] text-text-muted leading-relaxed font-medium">
              Nothing to drill yet — kanji appear once you have mastered the kana
              their readings are written in.
            </p>
          </Card>
        )}
      </main>
    </div>
  );
}
