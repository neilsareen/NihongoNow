"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SpeakCard } from "@/app/components/speak-card";
import { SilentModeButton, useSilentMode } from "@/app/components/silent-mode";
import { Card, TopBar, buttonStyles, buttonVars } from "@/app/components/ui";
import { endSilentMode, silentMinutesLeft } from "@/lib/silent-mode";
import { cn } from "@/lib/utils";

/* ===========================================================================
   Speaking drill.
   ---------------------------------------------------------------------------
   A focused run of say-it-back cards, weakest words first. Like the other
   drills it sits outside the review schedule: nothing here moves an item's
   next-review date, so a learner can hammer a word they keep fumbling without
   the scheduler concluding they have mastered it.
   =========================================================================== */

interface SpeakItem {
  id: string;
  contentType: "VOCABULARY" | "PHRASE";
  japanese: string;
  kana: string;
  romaji: string;
  english: string;
  isNew: boolean;
}

type View = "loading" | "error" | "locked" | "drill" | "summary";

/**
 * `fixed` is for the drill itself: the card screen is exactly the viewport and
 * does not scroll, so the mic and the skip control stay under the thumb instead
 * of sliding off the bottom behind the browser's URL bar. The notices and the
 * summary keep the ordinary scrolling page.
 */
function Shell({ children, fixed = false }: { children: React.ReactNode; fixed?: boolean }) {
  return (
    <div className={cn(fixed ? "screen-fixed" : "min-h-screen", "bg-canvas text-text flex flex-col")}>
      <TopBar title="Speaking" trailing={<SilentModeButton />} />
      <main
        className={cn(
          "flex-1 w-full max-w-md mx-auto px-4 flex flex-col",
          fixed ? "min-h-0 safe-bottom" : "pb-8"
        )}
      >
        {children}
      </main>
    </div>
  );
}

function CenteredNotice({
  glyph,
  title,
  body,
  action,
}: {
  glyph: string;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-2">
      <p className="jp text-5xl">{glyph}</p>
      <h2 className="text-xl">{title}</h2>
      <p className="text-[14px] text-text-muted leading-relaxed max-w-xs font-medium">{body}</p>
      {action}
    </div>
  );
}

export default function SpeakPracticePage() {
  const { until, active: silent } = useSilentMode();
  const [view, setView] = useState<View>("loading");
  const [items, setItems] = useState<SpeakItem[]>([]);
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [runKey, setRunKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setView("loading");
    fetch("/api/speak")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed to load words"))))
      .then((data: { items: SpeakItem[]; locked: boolean }) => {
        if (cancelled) return;
        setItems(data.items ?? []);
        setIndex(0);
        setCorrect(0);
        setView(data.locked || (data.items ?? []).length === 0 ? "locked" : "drill");
      })
      .catch(() => {
        if (!cancelled) setView("error");
      });
    return () => {
      cancelled = true;
    };
  }, [runKey]);

  function advance(wasCorrect: boolean) {
    const nextCorrect = correct + (wasCorrect ? 1 : 0);
    setCorrect(nextCorrect);
    if (index + 1 < items.length) {
      setIndex((i) => i + 1);
    } else {
      setView("summary");
    }
  }

  // Nothing on this screen works without a voice, so silent mode takes the
  // whole page rather than each card. A finished run keeps its summary — that
  // is a report on work already done, and pulling it away would lose it.
  if (silent && view !== "summary") {
    return (
      <Shell>
        <CenteredNotice
          glyph="静"
          title="Silent for now"
          body={`Speaking practice needs your voice, so it's paused for another ${silentMinutesLeft(until)} ${silentMinutesLeft(until) === 1 ? "minute" : "minutes"}. Lessons still work — listening and speaking cards are asked in writing while silent mode is on.`}
          action={
            <div className="w-full max-w-xs space-y-3">
              <button
                onClick={endSilentMode}
                className={buttonStyles({ size: "lg", full: true })}
                style={buttonVars("primary")}
              >
                Turn sound back on
              </button>
              <Link
                href="/lesson"
                className={buttonStyles({ variant: "secondary", full: true, size: "lg" })}
                style={buttonVars("secondary")}
              >
                Do a lesson instead
              </Link>
            </div>
          }
        />
      </Shell>
    );
  }

  if (view === "loading") {
    return (
      <Shell>
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="w-8 h-8 border-4 border-surface-raised border-t-coral rounded-full animate-spin" />
          <p className="text-[14px] text-text-subtle font-medium">Finding words to say…</p>
        </div>
      </Shell>
    );
  }

  if (view === "error") {
    return (
      <Shell>
        <CenteredNotice
          glyph="…"
          title="Couldn't load that"
          body="Something went wrong fetching your words. Try again in a moment."
          action={
            <button
              onClick={() => setRunKey((k) => k + 1)}
              className={buttonStyles({ size: "lg" })}
              style={buttonVars("primary")}
            >
              Try again
            </button>
          }
        />
      </Shell>
    );
  }

  if (view === "locked") {
    return (
      <Shell>
        <CenteredNotice
          glyph="語"
          title="No words to say yet"
          body="Speaking practice opens up once you've met a few words. Master the kana in a word's reading and it turns up here."
          action={
            <Link href="/lesson" className={buttonStyles({ size: "lg" })} style={buttonVars("primary")}>
              Start a lesson
            </Link>
          }
        />
      </Shell>
    );
  }

  if (view === "summary") {
    const total = items.length;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    const great = accuracy >= 80;
    const hue = great ? "var(--lime)" : accuracy >= 50 ? "var(--sun)" : "var(--coral)";

    return (
      <Shell>
        <div className="flex-1 flex flex-col justify-center gap-5 py-6">
          <div
            className="relative rounded-card overflow-hidden elevated text-on-light animate-pop-in"
            style={{ background: `hsl(${hue})` }}
          >
            <span
              className="jp absolute -right-7 -bottom-14 text-[9rem] leading-none font-bold select-none pointer-events-none"
              style={{ color: "hsl(var(--on-light) / 0.1)" }}
              aria-hidden="true"
            >
              {great ? "声" : "続"}
            </span>
            <div className="relative p-6 text-center">
              <p className="font-display font-bold text-[13px] uppercase tracking-[0.12em] opacity-75">
                Said out loud
              </p>
              <p className="font-display font-extrabold text-mega tnum mt-2">
                {correct}
                <span className="text-3xl align-top">/{total}</span>
              </p>
              <p className="font-display font-bold text-[17px] mt-1">
                {great
                  ? "Understood on the first try."
                  : accuracy >= 50
                    ? "Getting heard more often than not."
                    : "Mouths need reps too — go again."}
              </p>
            </div>
          </div>

          <Card className="p-4">
            <p className="text-[13px] text-text-muted leading-relaxed font-medium">
              Speaking drills don&apos;t change your review schedule — say a word as many
              times as you like.
            </p>
          </Card>

          <div className="space-y-3">
            <button
              onClick={() => setRunKey((k) => k + 1)}
              className={buttonStyles({ size: "lg", full: true })}
              style={buttonVars("primary")}
            >
              Go again
            </button>
            <Link
              href="/dashboard"
              className={buttonStyles({ variant: "secondary", full: true, size: "lg" })}
              style={buttonVars("secondary")}
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </Shell>
    );
  }

  const item = items[index];
  const progressPct = items.length > 0 ? Math.round((index / items.length) * 100) : 0;

  return (
    <Shell fixed>
      <div className="shrink-0 flex items-center gap-3 pb-4">
        <div className="flex-1 h-3.5 rounded-full bg-surface-raised overflow-hidden">
          <div
            className="h-full rounded-full bg-lime sheen transition-[width] duration-500 ease-bounce"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <span className="font-display font-bold text-[14px] text-text-subtle tnum shrink-0">
          {index + 1}/{items.length}
        </span>
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        <SpeakCard
          key={item.id}
          prompt={{
            japanese: item.japanese,
            kana: item.kana,
            romaji: item.romaji,
            english: item.english,
          }}
          teachFirst={item.isNew}
          onPass={() => advance(true)}
          onFail={() => advance(false)}
          failLabel="Skip this one"
        />
      </div>
    </Shell>
  );
}
