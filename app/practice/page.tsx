"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ContentType } from "@prisma/client";
import { Check, Flame, Lightbulb, Lock, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { readingSpeechText, speak, speechText } from "@/lib/speech";
import { useSilentMode } from "@/app/components/silent-mode";
import { kanaToRomaji, katakanaToHiragana } from "@/lib/pronunciation";
import { cn } from "@/lib/utils";
import { Card, CardScroller, Chip, TopBar, buttonStyles, buttonVars } from "@/app/components/ui";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PracticeItem {
  id: string;
  contentType: ContentType;
  character: string;
  romaji: string;
  meanings?: string[];
  onyomi?: string[];
  kunyomi?: string[];
  exampleWords?: unknown;
  mnemonicHint?: string | null;
}

type ExampleWord = {
  word?: string;
  reading?: string;
  meaning?: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function AudioButton({ text, lang = "ja-JP" }: { text: string; lang?: string }) {
  const { active: silent } = useSilentMode();
  // Same reasoning as the lesson player's: a mute should remove the audio, not
  // leave dead buttons behind.
  if (silent) return null;
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        speak(text, lang);
      }}
      className="w-12 h-12 rounded-full shrink-0 grid place-items-center ledge-sm text-on-light transition-colors touch-manipulation"
      style={{ background: "hsl(var(--sky))", ["--ledge" as string]: "var(--sky-deep)" }}
      aria-label="Play pronunciation"
      title="Play pronunciation"
      type="button"
    >
      <Volume2 className="w-5 h-5" strokeWidth={2.5} />
    </button>
  );
}

/**
 * A whole reading — icon, kana, romaji, tag — is the tap target. Several of
 * these sit side by side on a kanji card, where a lone icon is easy to miss.
 */
function SpeakChip({
  text,
  className,
  children,
}: {
  text: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { active: silent } = useSilentMode();

  // Muted, the chip is still worth showing — it carries the reading itself,
  // not just a speaker icon — so it drops to plain text rather than staying a
  // button that does nothing.
  if (silent) {
    return (
      <span
        className={cn(
          "flex items-center gap-2 min-h-11 px-3 rounded-full bg-surface-raised",
          className
        )}
      >
        <VolumeX className="w-4 h-4 shrink-0 text-text-subtle" strokeWidth={2.5} />
        {children}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        speak(text);
      }}
      className={cn(
        "flex items-center gap-2 min-h-11 px-3 rounded-full bg-surface-raised",
        "transition-[filter] hover:brightness-125 active:brightness-110 touch-manipulation",
        className
      )}
      aria-label="Play pronunciation"
      title="Play pronunciation"
    >
      <Volume2 className="w-4 h-4 shrink-0 text-sky" strokeWidth={2.5} />
      {children}
    </button>
  );
}

function kanjiReadings(onyomi: string[] = [], kunyomi: string[] = []) {
  const readings = [
    ...onyomi.map((r) => ({ label: "on" as const, kana: katakanaToHiragana(r) })),
    ...kunyomi.map((r) => ({ label: "kun" as const, kana: katakanaToHiragana(r) })),
  ].filter((r) => r.kana);
  const seen = new Set<string>();
  return readings.filter((r) => (seen.has(r.kana) ? false : (seen.add(r.kana), true))).slice(0, 3);
}

function parseExampleWords(raw: unknown): ExampleWord[] {
  if (!raw) return [];
  try {
    const arr = Array.isArray(raw) ? raw : JSON.parse(raw as string);
    return arr.slice(0, 3) as ExampleWord[];
  } catch {
    return [];
  }
}

function DetailLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-display text-[11px] font-bold uppercase tracking-[0.12em] text-text-subtle">
      {children}
    </p>
  );
}

function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="hidden sm:inline-grid place-items-center min-w-[1.25rem] h-[1.25rem] px-1.5 rounded-md bg-black/15 text-[10px] font-sans font-bold opacity-80">
      {children}
    </kbd>
  );
}

// ---------------------------------------------------------------------------
// Selection view
// ---------------------------------------------------------------------------

type TypeKey = "HIRAGANA" | "KATAKANA" | "KANJI";

const TYPES: { key: TypeKey; label: string; glyph: string; tone: string }[] = [
  { key: "HIRAGANA", label: "Hiragana", glyph: "あ", tone: "var(--track-hiragana)" },
  { key: "KATAKANA", label: "Katakana", glyph: "ア", tone: "var(--track-katakana)" },
  { key: "KANJI", label: "Kanji", glyph: "漢", tone: "var(--track-kanji)" },
];

/** Stack sizes on offer. The middle one is the default — a few minutes' worth. */
const COUNTS = [10, 25, 50, 100] as const;
const DEFAULT_COUNT = 25;

function SelectionView({
  onStart,
}: {
  onStart: (items: PracticeItem[]) => void;
}) {
  const [selected, setSelected] = useState<Set<TypeKey>>(new Set(["HIRAGANA"]));
  const [count, setCount] = useState<number>(DEFAULT_COUNT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Assume locked until told otherwise, so kanji is never offered on a slow
  // or failed response.
  const [kanjiUnlocked, setKanjiUnlocked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/progression")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("failed"))))
      .then((d) => {
        if (!cancelled) setKanjiUnlocked(!!d.kanjiUnlocked);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  function toggle(type: TypeKey) {
    if (type === "KANJI" && !kanjiUnlocked) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        if (next.size === 1) return prev; // at least one required
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }

  async function startPractice() {
    setLoading(true);
    setError(null);
    try {
      const types = Array.from(selected).join(",");
      const res = await fetch(`/api/practice?types=${types}&limit=${count}`);
      if (!res.ok) throw new Error("Failed to load practice items");
      const data = await res.json();
      // The server already trims to the limit; slicing again keeps the stack
      // honest if that ever changes.
      onStart((data.items as PracticeItem[]).slice(0, count));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <TopBar title="Practice" />

      <main className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <div className="space-y-2">
          <h1 className="text-hero leading-none">Drill<br />mode</h1>
          <p className="text-[15px] text-text-muted leading-relaxed font-medium max-w-[32ch]">
            Free-form flashcards. Nothing here touches your review schedule — warm up,
            or hammer one script until it sticks.
          </p>
        </div>

        <fieldset className="space-y-2.5">
          <legend className="font-display text-[13px] font-bold uppercase tracking-[0.1em] text-text-subtle mb-3">
            What are we drilling?
          </legend>
          {TYPES.map(({ key, label, glyph, tone }) => {
            const locked = key === "KANJI" && !kanjiUnlocked;
            const isOn = selected.has(key);
            return (
              <button
                key={key}
                onClick={() => toggle(key)}
                disabled={locked}
                aria-pressed={isOn}
                title={locked ? "Master the kana used in a kanji\u2019s reading to unlock it" : undefined}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-card border-2 text-left card-ledge",
                  "transition-colors duration-150",
                  locked
                    ? "border-line bg-surface/50 cursor-not-allowed"
                    : isOn
                      ? "bg-surface"
                      : "border-line bg-surface hover:border-line-strong"
                )}
                style={!locked && isOn ? { borderColor: `hsl(${tone})` } : undefined}
              >
                <span
                  className="w-14 h-14 rounded-tile grid place-items-center shrink-0"
                  style={
                    locked
                      ? { background: "hsl(var(--ink-deep))" }
                      : { background: `hsl(${tone})`, color: "hsl(var(--on-light))" }
                  }
                >
                  {locked ? (
                    <Lock className="w-5 h-5 text-text-subtle" strokeWidth={2.5} />
                  ) : (
                    <span className="jp text-2xl font-bold leading-none">{glyph}</span>
                  )}
                </span>

                <span className="flex-1 min-w-0">
                  <span
                    className={cn(
                      "block font-display font-bold text-[17px] tracking-tight",
                      locked && "text-text-subtle"
                    )}
                  >
                    {label}
                  </span>
                  {locked && (
                    <span className="block text-[13px] text-text-subtle mt-0.5 font-medium">
                      Unlocks as you master the kana in its readings
                    </span>
                  )}
                </span>

                {!locked && (
                  <span
                    className={cn(
                      "w-7 h-7 rounded-full grid place-items-center shrink-0 transition-colors border-2",
                      isOn ? "text-on-light" : "border-line-strong"
                    )}
                    style={isOn ? { background: `hsl(${tone})`, borderColor: `hsl(${tone})` } : undefined}
                  >
                    {isOn && <Check className="w-4 h-4" strokeWidth={3.5} />}
                  </span>
                )}
              </button>
            );
          })}
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="font-display text-[13px] font-bold uppercase tracking-[0.1em] text-text-subtle mb-3">
            How many cards?
          </legend>
          <div className="grid grid-cols-4 gap-2">
            {COUNTS.map((n) => {
              const isOn = count === n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setCount(n)}
                  aria-pressed={isOn}
                  className={cn(
                    "h-14 rounded-tile border-2 bg-surface card-ledge",
                    "font-display font-extrabold text-[19px] tnum transition-colors duration-150",
                    isOn ? "text-text" : "border-line text-text-muted hover:border-line-strong"
                  )}
                  style={isOn ? { borderColor: "hsl(var(--sky))", color: "hsl(var(--sky))" } : undefined}
                >
                  {n}
                </button>
              );
            })}
          </div>
          <p className="text-[13px] text-text-muted leading-relaxed font-medium">
            You&rsquo;ll drill until all {count} are cleared. Any card you miss goes back
            into the stack and comes round again — so a miss costs you a repeat, not the
            card. If a script has fewer than {count} cards, you get everything it has.
          </p>
        </fieldset>

        {error && (
          <p className="text-[14px] text-rose font-semibold" role="alert">{error}</p>
        )}

        <button
          onClick={startPractice}
          disabled={loading}
          className={buttonStyles({ size: "lg", full: true })}
          style={buttonVars("primary")}
        >
          {loading ? "Loading…" : "Let's go"}
        </button>
      </main>
    </div>
  );
}

function MnemonicButton({ hint }: { hint: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="w-full flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className={buttonStyles({ variant: "sun", size: "sm" })}
        style={buttonVars("sun")}
        title="Tap for a memory hook"
      >
        <Lightbulb className="w-4 h-4" strokeWidth={2.5} fill="currentColor" />
        {show ? "Hide hint" : "Need a hint?"}
      </button>
      {show && (
        <p
          className="text-[14px] leading-relaxed text-center max-w-xs animate-pop-in rounded-tile px-4 py-3 font-medium"
          style={{ background: "hsl(var(--sun) / 0.14)", color: "hsl(var(--sun))" }}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

function LoadingView() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <div className="w-8 h-8 border-4 border-surface-raised border-t-coral rounded-full animate-spin" />
      <p className="text-[14px] text-text-subtle font-medium">Loading…</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Practice view — flashcard
// ---------------------------------------------------------------------------

/**
 * A missed card slots back in this many cards later: far enough that you have
 * to recall it rather than echo it, near enough that it comes back inside the
 * session.
 */
const RETRY_GAP = 3;

interface SessionResults {
  /** Cards in the stack. Every one of them is cleared by the end. */
  size: number;
  /** Cleared without ever going back in the stack. */
  firstTry: number;
  /** How many times a card was put back in the stack. */
  putBack: number;
  /** Longest run of consecutive correct answers. */
  best: number;
}

function PracticeView({
  items,
  onFinish,
}: {
  items: PracticeItem[];
  onFinish: (results: SessionResults) => void;
}) {
  // The stack itself. Cards leave it only by being answered correctly, so a
  // session ends when it is empty rather than after a fixed number of turns.
  const [queue, setQueue] = useState<PracticeItem[]>(items);
  const [flipped, setFlipped] = useState(false);
  const [cleared, setCleared] = useState(0);
  const [firstTry, setFirstTry] = useState(0);
  const [putBack, setPutBack] = useState(0);
  // Cards that have been missed at least once, so a later hit is not counted
  // as a first-try hit.
  const [missedIds] = useState(() => new Set<string>());
  // Run of consecutive hits, shown from three up — the same mechanic the
  // lesson player uses, so the two flows reward you the same way.
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  // Says out loud what just happened to the card, so "back in the stack" is
  // something the app tells you rather than something you infer from a counter.
  const [flash, setFlash] = useState<{ turn: number; correct: boolean } | null>(null);

  const size = items.length;
  const item = queue[0];
  const isKanji = item.contentType === ContentType.KANJI;
  const exampleWords = parseExampleWords(item.exampleWords);
  const readings = isKanji ? kanjiReadings(item.onyomi, item.kunyomi) : [];
  const turn = cleared + putBack;

  const advance = useCallback(
    (wasCorrect: boolean) => {
      const current = queue[0];
      const rest = queue.slice(1);

      if (wasCorrect) {
        const clean = !missedIds.has(current.id);
        const newStreak = streak + 1;
        const newBest = Math.max(best, newStreak);
        if (rest.length === 0) {
          onFinish({
            size,
            firstTry: firstTry + (clean ? 1 : 0),
            putBack,
            best: newBest,
          });
          return;
        }
        setStreak(newStreak);
        setBest(newBest);
        setCleared((c) => c + 1);
        if (clean) setFirstTry((f) => f + 1);
        setQueue(rest);
      } else {
        missedIds.add(current.id);
        setStreak(0);
        setPutBack((p) => p + 1);
        // Slot it a few cards along; at the tail of a short stack it simply
        // comes straight back, which is the point.
        const at = Math.min(RETRY_GAP, rest.length);
        setQueue([...rest.slice(0, at), current, ...rest.slice(at)]);
      }

      setFlash({ turn: turn + 1, correct: wasCorrect });
      setFlipped(false);
    },
    [queue, missedIds, streak, best, firstTry, putBack, size, turn, onFinish]
  );

  // Clear the read-back after a beat so it reads as a reaction, not a label.
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 2000);
    return () => clearTimeout(t);
  }, [flash]);

  // Same shortcuts as the lesson player, so the two flows feel like one app.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;

      if (!flipped) {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          setFlipped(true);
        }
        return;
      }
      if (e.key === "1") advance(false);
      if (e.key === "2" || e.key === " " || e.key === "Enter") {
        e.preventDefault();
        advance(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [flipped, advance]);

  return (
    <div className="screen-fixed flex flex-col">
      <header className="shrink-0 z-30 bg-ink/90 backdrop-blur-xl">
        <div className="max-w-md mx-auto h-16 px-4 flex items-center gap-3">
          <Link
            href="/dashboard"
            aria-label="Back to dashboard"
            className="w-10 h-10 -ml-1 rounded-full grid place-items-center bg-surface border-2 border-line text-text-muted hover:text-text hover:border-line-strong transition-colors shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="2.2"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>

          <div className="flex-1">
            {/* Progress is cards cleared out of the stack, not turns taken — a
                miss holds the bar where it is instead of advancing it. */}
            <div className="h-3.5 rounded-full bg-surface-raised overflow-hidden">
              <div
                className="h-full rounded-full bg-lime transition-[width] duration-500 ease-bounce"
                style={{
                  width: `${(cleared / size) * 100}%`,
                  boxShadow: "inset 0 2px 0 0 rgb(255 255 255 / 0.3)",
                }}
              />
            </div>
          </div>

          {streak >= 3 ? (
            <Chip hue="var(--sun)" className="shrink-0 animate-pop" key={streak}>
              <Flame className="w-3.5 h-3.5" strokeWidth={2.5} fill="currentColor" />
              <span className="tnum">{streak}</span>
            </Chip>
          ) : (
            <span className="font-display font-bold text-[14px] text-text-subtle tnum shrink-0 min-w-[3rem] text-right">
              {cleared}/{size}
            </span>
          )}
        </div>
      </header>

      <main className="flex-1 min-h-0 w-full max-w-md mx-auto px-4 pt-4 safe-bottom flex flex-col gap-3">
        {/* Running score. Spelled out rather than abbreviated, so there is no
            guessing at what a number means mid-drill. */}
        <div className="shrink-0 flex items-center justify-center gap-2 flex-wrap">
          <Chip hue="var(--lime)">
            <Check className="w-3.5 h-3.5" strokeWidth={3} />
            <span className="tnum">{cleared}</span> got right
          </Chip>
          <Chip hue="var(--rose)">
            <RotateCcw className="w-3.5 h-3.5" strokeWidth={2.5} />
            <span className="tnum">{putBack}</span> back in the stack
          </Chip>
          <Chip>
            <span className="tnum">{queue.length}</span> left to clear
          </Chip>
        </div>

        <div className="h-5 shrink-0 flex items-center justify-center">
          {flash && (
            <p
              key={flash.turn}
              className="animate-pop-in text-[13px] font-display font-bold text-center"
              style={{ color: `hsl(${flash.correct ? "var(--lime)" : "var(--rose)"})` }}
            >
              {flash.correct
                ? "Right — that card is out of the stack."
                : "Back in the stack — it will come round again."}
            </p>
          )}
        </div>

        <div key={turn} className="flex-1 min-h-0 w-full flex flex-col gap-4 animate-pop-in">
          <CardScroller>
          <Card className="overflow-hidden">
            <div className="p-8 flex items-center justify-center min-h-[12rem]">
              <span className={cn("jp leading-none font-bold", isKanji ? "text-[5rem]" : "text-mega")}>
                {item.character}
              </span>
            </div>

            <div className="border-t-2 border-line p-6 flex items-center justify-center min-h-[7rem] bg-ink-deep/40">
              {!flipped ? (
                <button
                  onClick={() => setFlipped(true)}
                  className="jp text-[2rem] text-text-subtle/35 tracking-[0.3em] select-none hover:text-text-subtle/60 transition-colors"
                  aria-label="Reveal the answer"
                >
                  ？？？
                </button>
              ) : (
                <div className="w-full flex flex-col items-center gap-4 animate-pop-in">
                  {isKanji ? (
                    <>
                      <div className="flex items-center gap-2.5">
                        {item.meanings && item.meanings.length > 0 && (
                          <p className="font-display text-2xl font-extrabold tracking-tight">
                            {item.meanings.join(", ")}
                          </p>
                        )}
                        <AudioButton text={speechText(item.contentType, item)} />
                      </div>

                      {readings.length > 0 && (
                        <div className="w-full space-y-2 text-center">
                          <DetailLabel>Readings</DetailLabel>
                          <div className="flex flex-wrap items-center justify-center gap-2">
                            {readings.map((r) => (
                              <SpeakChip key={`${r.label}-${r.kana}`} text={readingSpeechText(r.kana)}>
                                <span className="jp text-[15px]">{r.kana}</span>
                                <span className="text-[13px] text-text-muted">{kanaToRomaji(r.kana)}</span>
                                <span className="font-display text-[10px] font-bold uppercase tracking-wider text-text-subtle bg-ink-deep rounded-full px-2 py-0.5">
                                  {r.label}
                                </span>
                              </SpeakChip>
                            ))}
                          </div>
                        </div>
                      )}

                      {exampleWords.length > 0 && (
                        <div className="w-full space-y-2 text-center">
                          <DetailLabel>Common words</DetailLabel>
                          <div className="flex flex-col items-center gap-1.5">
                            {exampleWords.map((w, i) => (
                              <SpeakChip key={i} text={w.reading || w.word || ""} className="text-[13px]">
                                <span className="jp">{w.word}</span>
                                {w.meaning && <span className="text-text-muted">{w.meaning}</span>}
                              </SpeakChip>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-2.5">
                      <p className="font-display text-[2rem] font-extrabold tracking-tight">{item.romaji}</p>
                      <AudioButton text={speechText(item.contentType, item)} />
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          {flipped && item.mnemonicHint && <MnemonicButton key={item.id} hint={item.mnemonicHint} />}
          </CardScroller>

          {!flipped ? (
            <button
              onClick={() => setFlipped(true)}
              className={buttonStyles({ size: "lg", full: true, className: "shrink-0" })}
              style={buttonVars("primary")}
            >
              Reveal
              <Key>space</Key>
            </button>
          ) : (
            <div className="flex gap-2.5 shrink-0">
              <button
                onClick={() => advance(false)}
                className={buttonStyles({ variant: "reject", size: "lg", full: true })}
                style={buttonVars("reject")}
                title="Puts this card back in the stack"
              >
                <RotateCcw className="w-[18px] h-[18px]" strokeWidth={2.5} />
                Missed it
                <Key>1</Key>
              </button>
              <button
                onClick={() => advance(true)}
                className={buttonStyles({ variant: "affirm", size: "lg", full: true })}
                style={buttonVars("affirm")}
                title="Clears this card from the stack"
              >
                <Check className="w-[18px] h-[18px]" strokeWidth={3} />
                Got it
                <Key>2</Key>
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Summary view
// ---------------------------------------------------------------------------

function SummaryView({
  results,
  onPracticeAgain,
}: {
  results: SessionResults;
  onPracticeAgain: () => void;
}) {
  const { size, firstTry, putBack, best } = results;
  // Everything gets cleared eventually, so the score worth reporting is how
  // much of the stack went down on the first attempt.
  const accuracy = size > 0 ? Math.round((firstTry / size) * 100) : 0;
  const great = accuracy >= 80;
  const hue = great ? "var(--lime)" : accuracy >= 50 ? "var(--sun)" : "var(--coral)";

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar title="Results" />

      <main className="flex-1 max-w-sm mx-auto w-full px-4 py-6 flex flex-col justify-center">
        <div className="space-y-5">
          <div
            className="relative rounded-card overflow-hidden card-ledge text-on-light animate-pop-in"
            style={{ background: `hsl(${hue})`, ["--ledge" as string]: "hsl(var(--ledge-base))" }}
          >
            <span
              className="jp absolute -right-7 -bottom-14 text-[9rem] leading-none font-bold select-none pointer-events-none"
              style={{ color: "hsl(var(--on-light) / 0.1)" }}
              aria-hidden="true"
            >
              {great ? "祝" : "続"}
            </span>
            <div className="relative p-6 text-center">
              <p className="font-display font-bold text-[13px] uppercase tracking-[0.12em] opacity-75">
                Stack cleared — all {size} cards
              </p>
              <p className="font-display font-extrabold text-mega tnum mt-2">
                {accuracy}
                <span className="text-3xl align-top">%</span>
              </p>
              <p className="font-display font-bold text-[15px] opacity-80">
                right on the first try
              </p>
              <p className="font-display font-bold text-[17px] mt-2">
                {great
                  ? "That set is well in hand."
                  : accuracy >= 50
                    ? "Coming along nicely."
                    : "Worth another run shortly."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5 stagger">
            {[
              { label: "Right first try", value: firstTry, tone: "var(--lime)" },
              { label: "Put back in stack", value: putBack, tone: "var(--rose)" },
              { label: "Best run", value: best, tone: "var(--sun)" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-tile border-2 border-line bg-surface card-ledge py-3.5 px-2 text-center"
              >
                <p
                  className="font-display font-extrabold text-[26px] tnum leading-none"
                  style={{ color: `hsl(${stat.tone})` }}
                >
                  {stat.value}
                </p>
                <p className="text-[11px] font-bold text-text-subtle mt-1.5 uppercase tracking-wider leading-tight">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          <p className="text-[13px] text-text-muted leading-relaxed font-medium text-center">
            {putBack === 0
              ? `You cleared every card first time — nothing went back in the stack.`
              : `${putBack} time${putBack === 1 ? "" : "s"} a card went back in the stack for another go, and you cleared them all in the end.`}
          </p>

          <div className="space-y-3 pt-1">
            <button
              onClick={onPracticeAgain}
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
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Root page — state machine
// ---------------------------------------------------------------------------

type View = "loading" | "selection" | "practice" | "summary";

const AUTO_START_TYPES: TypeKey[] = ["HIRAGANA", "KATAKANA", "KANJI"];

function PracticePageInner() {
  const searchParams = useSearchParams();
  const requestedType = searchParams.get("type")?.toUpperCase();
  const autoType = AUTO_START_TYPES.includes(requestedType as TypeKey)
    ? (requestedType as TypeKey)
    : null;

  const [view, setView] = useState<View>(autoType ? "loading" : "selection");
  const [items, setItems] = useState<PracticeItem[]>([]);
  const [results, setResults] = useState<SessionResults>({
    size: 0,
    firstTry: 0,
    putBack: 0,
    best: 0,
  });

  useEffect(() => {
    if (!autoType) return;
    let cancelled = false;
    (async () => {
      try {
        // Jumping straight in from the dashboard gets the default stack size;
        // the picker on the selection screen is for anything else.
        const res = await fetch(`/api/practice?types=${autoType}&limit=${DEFAULT_COUNT}`);
        if (!res.ok) throw new Error("Failed to load practice items");
        const data = await res.json();
        if (!cancelled) {
          setItems((data.items as PracticeItem[]).slice(0, DEFAULT_COUNT));
          setView("practice");
        }
      } catch {
        if (!cancelled) setView("selection");
      }
    })();
    return () => {
      cancelled = true;
    };
    // Only ever auto-start once, for the type present on initial load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleStart(fetchedItems: PracticeItem[]) {
    setItems(fetchedItems);
    setView("practice");
  }

  function handleFinish(sessionResults: SessionResults) {
    setResults(sessionResults);
    setView("summary");
  }

  function handlePracticeAgain() {
    setView("selection");
    setItems([]);
  }

  if (view === "loading") {
    return <LoadingView />;
  }

  if (view === "practice" && items.length > 0) {
    return <PracticeView items={items} onFinish={handleFinish} />;
  }

  if (view === "summary") {
    return <SummaryView results={results} onPracticeAgain={handlePracticeAgain} />;
  }

  return <SelectionView onStart={handleStart} />;
}

export default function PracticePage() {
  return (
    <Suspense fallback={<LoadingView />}>
      <PracticePageInner />
    </Suspense>
  );
}
