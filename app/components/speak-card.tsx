"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Mic, RotateCcw, Volume2 } from "lucide-react";
import { readingSpeechText, speak } from "@/lib/speech";
import {
  gradePronunciation,
  kanaToRomaji,
  type PronunciationGrade,
} from "@/lib/pronunciation";
import { useSpeechRecognition } from "@/lib/use-speech-recognition";
import { cn } from "@/lib/utils";
import { Card, buttonStyles, buttonVars } from "./ui";

/* ===========================================================================
   Say-it-back exercise.
   ---------------------------------------------------------------------------
   The learner hears a word, says it, and the browser's recogniser decides
   whether it landed close enough to count. Two things keep that from being
   frustrating. First, grading is phonetic and forgiving (see lib/pronunciation)
   — the bar is "a Japanese speaker would understand you", not "you matched a
   native recording". Second, the recogniser is never the last word: a learner
   who knows they said it right can say so, because a mis-hearing is the
   recogniser's failure and charging the learner for it teaches nothing.
   =========================================================================== */

export interface SpeakPrompt {
  /** Written form as it appears on the card — may be kanji. */
  japanese: string;
  kana?: string | null;
  romaji?: string | null;
  english?: string | null;
}

interface SpeakCardProps {
  prompt: SpeakPrompt;
  /**
   * Show the word straight away and play it once. For a word the learner is
   * meeting for the first time this is a repeat-after-me drill; for one they
   * already know, the English alone is the prompt and the word stays hidden
   * until they ask for it.
   */
  teachFirst?: boolean;
  /** Passed the attempt — graded, or self-graded after a mis-hearing. */
  onPass: (grade: PronunciationGrade | null) => void;
  /** Gave up on this one. */
  onFail: () => void;
  /** Label for the give-up action, which differs between lesson and drill. */
  failLabel?: string;
}

const PASS_ADVANCE_MS = 1200;

function toneForBand(grade: PronunciationGrade | null): string {
  if (!grade) return "var(--sky)";
  if (grade.band === "great") return "var(--lime)";
  if (grade.band === "close") return "var(--lime)";
  return "var(--rose)";
}

function headlineForGrade(grade: PronunciationGrade): string {
  if (grade.band === "great") return "Spot on.";
  if (grade.band === "close") return "Close enough — that would land.";
  return "Not quite yet.";
}

/** Model pronunciation, at speed and slowed down. */
function ListenControls({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div className="flex items-center justify-center gap-2.5">
      <button
        type="button"
        onClick={() => speak(text)}
        className={buttonStyles({ variant: "secondary", size: "sm" })}
        style={buttonVars("secondary")}
      >
        <Volume2 className="w-4 h-4" strokeWidth={2.5} />
        Hear it
      </button>
      <button
        type="button"
        onClick={() => speak(text, "ja-JP", 0.45)}
        className={buttonStyles({ variant: "ghost", size: "sm" })}
      >
        Slowly
      </button>
    </div>
  );
}

export function SpeakCard({
  prompt,
  teachFirst = false,
  onPass,
  onFail,
  failLabel = "Skip this one",
}: SpeakCardProps) {
  const [revealed, setRevealed] = useState(teachFirst);
  const [grade, setGrade] = useState<PronunciationGrade | null>(null);
  const [attempts, setAttempts] = useState(0);
  const passedRef = useRef(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const speechTextForPrompt =
    readingSpeechText(prompt.kana ?? "") || prompt.japanese || "";
  const romaji = prompt.romaji || (prompt.kana ? kanaToRomaji(prompt.kana) : "");

  const handleResult = useCallback(
    (transcripts: string[]) => {
      const result = gradePronunciation(transcripts, prompt);
      setGrade(result);
      setAttempts((n) => n + 1);
      if (!result.passed) {
        // A miss is also a teaching moment: the answer goes on screen so the
        // next attempt has something to aim at.
        setRevealed(true);
        return;
      }
      if (passedRef.current) return;
      passedRef.current = true;
      advanceTimer.current = setTimeout(() => onPass(result), PASS_ADVANCE_MS);
    },
    [prompt, onPass]
  );

  const { supported, listening, interim, error, start, reset } = useSpeechRecognition({
    onResult: handleResult,
  });

  // A fresh word: clear the previous verdict, and play the model reading when
  // this is a word being taught rather than tested.
  useEffect(() => {
    passedRef.current = false;
    setGrade(null);
    setAttempts(0);
    setRevealed(teachFirst);
    if (teachFirst && speechTextForPrompt) {
      const t = setTimeout(() => speak(speechTextForPrompt), 250);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt.japanese, prompt.kana, teachFirst]);

  useEffect(() => {
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    };
  }, []);

  function tryAgain() {
    setGrade(null);
    reset();
    start();
  }

  function selfGradePass() {
    if (passedRef.current) return;
    passedRef.current = true;
    onPass(null);
  }

  const passed = grade?.passed ?? false;
  const tone = toneForBand(grade);

  return (
    <div className="w-full flex flex-col gap-4">
      <Card className="overflow-hidden">
        <div className="px-4 h-12 flex items-center justify-between border-b-2 border-line">
          <span
            className="inline-flex items-center h-7 px-3 rounded-full font-display text-[11px] font-bold uppercase tracking-[0.1em] text-on-light"
            style={{ background: "hsl(var(--grape))" }}
          >
            Say it back
          </span>
          {attempts > 0 && (
            <span className="font-display text-[11px] font-bold uppercase tracking-wider text-text-subtle tnum">
              Attempt {attempts + (passed ? 0 : 1)}
            </span>
          )}
        </div>

        <div className="px-6 pt-5 pb-6 flex flex-col items-center gap-4 min-h-[13rem] justify-center text-center">
          {prompt.english && (
            <p className="font-display text-[19px] font-extrabold tracking-tight leading-tight">
              {prompt.english}
            </p>
          )}

          {revealed ? (
            <div className="flex flex-col items-center gap-1.5 animate-pop-in">
              <p className="jp text-[2.75rem] leading-none font-bold">{prompt.japanese}</p>
              {prompt.kana && prompt.kana !== prompt.japanese && (
                <p className="jp text-[17px] text-text-muted font-medium">{prompt.kana}</p>
              )}
              {romaji && <p className="text-[13px] text-text-subtle">{romaji}</p>}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setRevealed(true)}
              className="jp text-[2rem] text-text-subtle/35 tracking-[0.3em] select-none hover:text-text-subtle/60 transition-colors"
              aria-label="Show the word"
            >
              ？？？
            </button>
          )}

          <ListenControls text={speechTextForPrompt} />
        </div>

        {/* Verdict panel. Reserved space rather than a panel that appears and
            shoves the mic button down mid-tap. */}
        <div
          className="border-t-2 border-line px-6 py-5 min-h-[6.5rem] flex flex-col items-center justify-center gap-2 bg-ink-deep/40"
          aria-live="polite"
        >
          {listening ? (
            <>
              <p className="font-display font-bold text-[15px]" style={{ color: "hsl(var(--lime))" }}>
                Listening…
              </p>
              <p className="jp text-[15px] text-text-muted min-h-[1.4rem]">
                {interim || "Say the word out loud"}
              </p>
            </>
          ) : grade ? (
            <div className="w-full flex items-center gap-4 animate-pop-in">
              <div
                className="w-14 h-14 shrink-0 rounded-full grid place-items-center font-display font-extrabold text-[17px] tnum text-on-light"
                style={{ background: `hsl(${tone})` }}
              >
                {Math.round(grade.score * 100)}
              </div>
              <div className="min-w-0 text-left">
                <p className="font-display font-bold text-[15px]" style={{ color: `hsl(${tone})` }}>
                  {headlineForGrade(grade)}
                </p>
                <p className="text-[13px] text-text-muted mt-0.5 truncate">
                  Heard: <span className="jp">{grade.heard || "—"}</span>
                </p>
              </div>
            </div>
          ) : error ? (
            <p className="text-[13px] text-text-muted leading-relaxed">{error.message}</p>
          ) : supported ? (
            <p className="text-[13px] text-text-subtle font-medium">
              Tap the mic and say it in Japanese.
            </p>
          ) : (
            <p className="text-[13px] text-text-muted leading-relaxed">
              This browser can&apos;t listen — Chrome, Edge and Safari can. Say it out
              loud anyway, then grade yourself.
            </p>
          )}
        </div>
      </Card>

      {/* Controls. Grading yourself is always available: the recogniser
          mishears often enough that making it the only judge would punish
          correct answers. */}
      {!supported ? (
        <div className="flex gap-2.5">
          <button
            onClick={onFail}
            className={buttonStyles({ variant: "reject", size: "lg", full: true })}
            style={buttonVars("reject")}
          >
            <RotateCcw className="w-[18px] h-[18px]" strokeWidth={2.5} />
            Again
          </button>
          <button
            onClick={selfGradePass}
            className={buttonStyles({ variant: "affirm", size: "lg", full: true })}
            style={buttonVars("affirm")}
          >
            <Check className="w-[18px] h-[18px]" strokeWidth={3} />
            Said it
          </button>
        </div>
      ) : passed ? (
        <button
          onClick={() => {
            if (advanceTimer.current) clearTimeout(advanceTimer.current);
            onPass(grade);
          }}
          className={buttonStyles({ variant: "affirm", size: "lg", full: true })}
          style={buttonVars("affirm")}
        >
          <Check className="w-[18px] h-[18px]" strokeWidth={3} />
          Nice — keep going
        </button>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={listening ? undefined : tryAgain}
            disabled={listening}
            className={cn(
              "relative w-20 h-20 rounded-full grid place-items-center text-on-light ledge",
              "transition-transform active:scale-95 disabled:pointer-events-none"
            )}
            style={{
              background: listening ? "hsl(var(--lime))" : "hsl(var(--coral))",
              ["--ledge" as string]: listening ? "var(--lime-deep)" : "var(--coral-deep)",
            }}
            aria-label={listening ? "Listening" : grade || error ? "Try again" : "Start speaking"}
          >
            {listening && (
              <span
                className="absolute inset-0 rounded-full animate-ping"
                style={{ background: "hsl(var(--lime) / 0.45)" }}
                aria-hidden="true"
              />
            )}
            <Mic className="relative w-8 h-8" strokeWidth={2.5} />
          </button>
          <p className="font-display font-bold text-[13px] text-text-subtle">
            {listening ? "Listening…" : grade || error ? "Tap to try again" : "Tap to speak"}
          </p>

          <div className="w-full flex flex-col gap-2 pt-1">
            {(grade || error) && !listening && (
              <button
                onClick={selfGradePass}
                className={buttonStyles({ variant: "secondary", full: true })}
                style={buttonVars("secondary")}
              >
                I said it right — it misheard me
              </button>
            )}
            <button
              onClick={onFail}
              className={buttonStyles({ variant: "ghost", full: true })}
            >
              {failLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
