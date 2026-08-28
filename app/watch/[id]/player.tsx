"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Gauge, Pause, Play, RotateCcw, VolumeX } from "lucide-react";
import { estimateSpeechMs, playLine, speechReading, stopSpeaking } from "@/lib/speech";
import { SilentModeButton, useSilentMode } from "@/app/components/silent-mode";
import { YOU_GLYPH, type Dialogue } from "@/lib/dialogues";
import { cn } from "@/lib/utils";
import { TopBar, buttonStyles, buttonVars } from "@/app/components/ui";

/* ===========================================================================
   Dialogue player.
   ---------------------------------------------------------------------------
   Plays a scene the way a subtitled clip plays: one line at a time, each side
   in its own voice, the transcript filling in underneath as it goes.

   Pacing is the whole problem, and it is decided by how the line was actually
   played. `lib/speech` guarantees its promise resolves and reports which
   engine got there, because the engines are not equally trustworthy: a
   pre-rendered clip has a real duration and a real end, while synthesis on a
   device with no Japanese voice reports success having made no sound at all.
   So a clip is timed by its own playback, and synthesis is held to a readable
   floor in case it did nothing.

   Silent mode is a first-class state here, not an error: with nothing audible
   the scene runs on estimated timings and becomes a silent subtitled clip.
   That is also what a device with no synthesis and no clips falls back to.
   =========================================================================== */

/** The beat between one line ending and the next beginning. */
const TURN_GAP_MS = 420;

/** How long a stage direction sits alone before the line lands on top of it. */
const STAGE_LEAD_MS = 900;

/**
 * The shortest a *synthesised* line may hold the screen, as a fraction of its
 * estimated spoken length — regardless of what the engine says it did.
 *
 * This is not a nicety. An engine with no Japanese voice installed accepts an
 * utterance, makes no sound, and reports that it finished; so does one that
 * errors. Advancing on that signal alone runs the whole scene in a couple of
 * seconds, which is precisely the case a learner cannot read. With a floor, a
 * device that cannot speak degrades into the silent subtitled version instead
 * of a flicker. Set below 1 so that speech which genuinely runs long — the
 * estimate deliberately errs generous — is never padded with dead air.
 *
 * A pre-rendered clip needs none of this: it reports a real end because it had
 * a real duration, so its timing is used as-is.
 */
const MIN_LINE_FRACTION = 0.7;

/** Multiples of natural pace. */
const RATES = [0.75, 1, 1.25] as const;

const YOU_TONE = "var(--track-conversation)";
const THEM_TONE = "var(--sun)";

export function DialoguePlayer({ dialogue }: { dialogue: Dialogue }) {
  const { active: silent } = useSilentMode();

  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState(false);
  const [rate, setRate] = useState<number>(1);
  const [showEnglish, setShowEnglish] = useState(true);

  const total = dialogue.turns.length;
  const turn = dialogue.turns[index];
  const activeRef = useRef<HTMLLIElement | null>(null);

  /* --- Playback ---------------------------------------------------------- */

  useEffect(() => {
    if (!playing) return;
    const current = dialogue.turns[index];
    if (!current) return;

    // Doubles as the cleanup flag and the once-only guard: nothing advances
    // twice, and nothing advances after the effect has been torn down.
    let settled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const after = (ms: number, fn: () => void) => {
      timers.push(setTimeout(fn, ms));
    };

    const advance = () => {
      if (settled) return;
      settled = true;
      if (index + 1 >= total) {
        setPlaying(false);
        setFinished(true);
      } else {
        setIndex(index + 1);
      }
    };

    const estimate = estimateSpeechMs(current.kana, rate);
    const lead = current.stage ? STAGE_LEAD_MS : 0;

    after(lead, () => {
      if (settled) return;
      const startedAt = Date.now();

      // The audio layer guarantees this resolves — no watchdog needed here.
      // What it resolves *to* is how the line should be paced.
      void playLine(speechReading(current.japanese, current.kana), { role: current.speaker, speed: rate }).then((outcome) => {
        if (settled) return;

        if (outcome === "clip") {
          // A real file with a real duration finished. Trust it.
          after(TURN_GAP_MS, advance);
          return;
        }

        if (outcome === "silent" || outcome === "unsupported") {
          // Nothing was audible, so the clock is the pacing and the line has
          // to stay up long enough to read.
          const elapsed = Date.now() - startedAt;
          after(Math.max(TURN_GAP_MS, estimate - elapsed), advance);
          return;
        }

        // Synthesis, which may have finished instantly without making a sound.
        const elapsed = Date.now() - startedAt;
        after(Math.max(TURN_GAP_MS, estimate * MIN_LINE_FRACTION - elapsed), advance);
      });
    });

    return () => {
      settled = true;
      timers.forEach(clearTimeout);
      stopSpeaking();
    };
  }, [playing, index, rate, total, dialogue]);

  // Nothing should keep talking once the screen is gone.
  useEffect(() => stopSpeaking, []);

  // Keep the line being spoken in view without dragging the page around when
  // it is already visible.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [index]);

  const togglePlay = useCallback(() => {
    if (finished) {
      setIndex(0);
      setFinished(false);
      setPlaying(true);
      return;
    }
    setPlaying((p) => !p);
  }, [finished]);

  const restart = useCallback(() => {
    setIndex(0);
    setFinished(false);
    setPlaying(true);
  }, []);

  const jumpTo = useCallback((i: number) => {
    setIndex(i);
    setFinished(false);
    setPlaying(true);
  }, []);

  const tone = turn.speaker === "you" ? YOU_TONE : THEM_TONE;

  return (
    <div className="screen-fixed flex flex-col">
      <TopBar title={dialogue.title} backHref="/watch" trailing={<SilentModeButton />} />

      <main className="flex-1 min-h-0 w-full max-w-lg mx-auto px-4 pb-2 flex flex-col gap-3">
        {/* --- The stage: who is talking, and what they are saying --------- */}
        <section
          className="shrink-0 rounded-card border border-line overflow-hidden elevated"
          style={{ background: "hsl(var(--surface))" }}
          aria-live="polite"
        >
          <div className="flex items-stretch">
            {(["you", "them"] as const).map((role) => {
              const isActive = turn.speaker === role;
              const roleTone = role === "you" ? YOU_TONE : THEM_TONE;
              return (
                <div
                  key={role}
                  className={cn(
                    "flex-1 flex items-center gap-2.5 px-4 py-2.5 transition-opacity duration-200",
                    role === "them" && "justify-end text-right",
                    isActive ? "opacity-100" : "opacity-35"
                  )}
                  style={isActive ? { background: `hsl(${roleTone} / 0.12)` } : undefined}
                >
                  {role === "them" && (
                    <span className="font-display font-bold text-[13px] tracking-tight truncate">
                      {dialogue.them.label}
                    </span>
                  )}
                  <span
                    className={cn(
                      "w-9 h-9 rounded-tile grid place-items-center shrink-0 text-on-light transition-transform duration-200",
                      isActive && "scale-110"
                    )}
                    style={{ background: `hsl(${roleTone})` }}
                  >
                    <span className="jp text-[17px] font-bold leading-none">
                      {role === "you" ? YOU_GLYPH : dialogue.them.glyph}
                    </span>
                  </span>
                  {role === "you" && (
                    <span className="font-display font-bold text-[13px] tracking-tight">You</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Subtitles. Sized to be read at arm's length, not scanned. */}
          <div className="border-t border-line px-5 py-5 min-h-[10.5rem] flex flex-col items-center justify-center gap-2.5 text-center bg-ink-deep/40">
            {turn.stage && (
              <p className="text-[15px] text-text-subtle italic leading-relaxed max-w-[34ch]">
                {turn.stage}
              </p>
            )}
            <p
              key={`${index}-ja`}
              className="jp text-[26px] font-bold leading-snug animate-pop-in"
              style={{ color: `hsl(${tone})` }}
            >
              {turn.japanese}
            </p>
            <p className="text-[17px] text-text-muted font-medium leading-relaxed">
              {turn.romaji}
            </p>
            {showEnglish && (
              <p className="text-[17px] text-text font-semibold leading-relaxed max-w-[34ch]">
                {turn.english}
              </p>
            )}
          </div>

          {/* Position through the scene. */}
          <div className="h-1.5 bg-ink-deep">
            <div
              className="h-full transition-[width] duration-300"
              style={{
                width: `${((index + 1) / total) * 100}%`,
                background: `hsl(${tone})`,
              }}
            />
          </div>
        </section>

        {silent && (
          <p className="shrink-0 flex items-center justify-center gap-2 text-[13px] text-text-subtle font-medium">
            <VolumeX className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />
            Silent mode — playing as subtitles
          </p>
        )}

        {/* --- Transcript -------------------------------------------------- */}
        <ol className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-0.5">
          {dialogue.turns.map((t, i) => {
            const isYou = t.speaker === "you";
            const isNow = i === index;
            const isPast = i < index;
            return (
              <li
                key={i}
                ref={isNow ? activeRef : null}
                className={cn("flex", isYou ? "justify-end" : "justify-start")}
              >
                <button
                  type="button"
                  onClick={() => jumpTo(i)}
                  className={cn(
                    "max-w-[85%] text-left rounded-card border px-3.5 py-2.5 transition-opacity duration-200",
                    isNow ? "opacity-100" : isPast ? "opacity-70" : "opacity-40"
                  )}
                  style={
                    isNow
                      ? {
                          borderColor: `hsl(${isYou ? YOU_TONE : THEM_TONE} / 0.7)`,
                          background: `linear-gradient(hsl(${isYou ? YOU_TONE : THEM_TONE} / 0.12), hsl(${isYou ? YOU_TONE : THEM_TONE} / 0.12)), hsl(var(--surface))`,
                        }
                      : { borderColor: "hsl(var(--line))", background: "hsl(var(--surface))" }
                  }
                  aria-current={isNow ? "true" : undefined}
                >
                  <span className="block font-display font-bold text-[11px] uppercase tracking-[0.1em] text-text-subtle mb-1">
                    {isYou ? "You" : dialogue.them.label}
                  </span>
                  <span className="jp block text-[17px] font-medium leading-snug">
                    {t.japanese}
                  </span>
                  <span className="block text-[13px] text-text-subtle mt-0.5">{t.romaji}</span>
                  {showEnglish && (
                    <span className="block text-[15px] text-text-muted font-medium mt-1">
                      {t.english}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ol>

        {/* --- Transport ---------------------------------------------------- */}
        <div className="shrink-0 safe-bottom space-y-2.5">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={restart}
              aria-label="Start again"
              title="Start again"
              className="w-12 h-12 rounded-full grid place-items-center shrink-0 bg-surface-raised border border-line text-text-muted hover:text-text hover:border-line-strong transition-colors"
            >
              <RotateCcw className="w-[18px] h-[18px]" strokeWidth={2.5} />
            </button>

            <button
              type="button"
              onClick={togglePlay}
              className={buttonStyles({ size: "lg", full: true })}
              style={buttonVars("primary")}
            >
              {playing ? (
                <>
                  <Pause className="w-[18px] h-[18px]" strokeWidth={2.5} fill="currentColor" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-[18px] h-[18px]" strokeWidth={2.5} fill="currentColor" />
                  {finished ? "Watch again" : index === 0 ? "Play the scene" : "Resume"}
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setRate((r) => RATES[(RATES.indexOf(r as typeof RATES[number]) + 1) % RATES.length])}
              className={buttonStyles({ variant: "secondary", size: "sm", full: true })}
              style={buttonVars("secondary")}
              title="Playback speed"
            >
              <Gauge className="w-4 h-4" strokeWidth={2.5} />
              <span className="tnum">{rate}×</span>
            </button>
            <button
              type="button"
              onClick={() => setShowEnglish((v) => !v)}
              className={buttonStyles({ variant: "secondary", size: "sm", full: true })}
              style={buttonVars("secondary")}
              aria-pressed={showEnglish}
            >
              {showEnglish ? (
                <>
                  <EyeOff className="w-4 h-4" strokeWidth={2.5} />
                  Hide English
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" strokeWidth={2.5} />
                  Show English
                </>
              )}
            </button>
          </div>

          {finished && (
            <Link
              href="/practice?type=CONVERSATION"
              className={buttonStyles({ variant: "secondary", full: true, size: "sm" })}
              style={buttonVars("secondary")}
            >
              Drill these lines
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
