"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Check, Flame, Lightbulb, RotateCcw, Volume2, X } from "lucide-react";
import { readingSpeechText, speak, speechText } from "@/lib/speech";
import { kanaToRomaji, katakanaToHiragana } from "@/lib/pronunciation";
import { cn } from "@/lib/utils";
import { SpeakCard } from "@/app/components/speak-card";
import { Card, Chip, buttonStyles, buttonVars } from "@/app/components/ui";

type ContentType = "HIRAGANA" | "KATAKANA" | "KANJI" | "VOCABULARY" | "PHRASE";

interface LessonItem {
  id: string;
  contentType: ContentType;
  contentId: string;
  exerciseType: string;
  displayOrder: number;
  answeredAt: string | null;
  correct: boolean | null;
  content: {
    character?: string;
    romaji?: string;
    mnemonicHint?: string;
    onyomi?: string[];
    kunyomi?: string[];
    meanings?: string[];
    exampleWords?: { word?: string; reading?: string; meaning?: string }[] | null;
    japanese?: string;
    kana?: string;
    english?: string;
    exampleSentenceJa?: string;
    exampleSentenceEn?: string;
    scenario?: string;
    isCulturalTip?: boolean;
    isScriptIntro?: boolean;
    title?: string;
    question?: string;
    body?: string;
    category?: string;
  } | null;
  review: {
    srsLevel: string;
    totalAttempts: number;
    correctCount: number;
    incorrectCount: number;
  } | null;
}

interface LessonResult {
  id: string;
  items: LessonItem[];
}

interface FinalResult {
  correct: number;
  total: number;
  accuracy: number;
}

// Mastery stages, expressed as an ordered scale rather than five unrelated
// colours: the learner should read progression, not a category.
const SRS_DISPLAY: Record<string, { label: string; tone: string; step: number }> = {
  NEW: { label: "New", tone: "var(--text-subtle)", step: 0 },
  LEARNING: { label: "Learning", tone: "var(--sky)", step: 1 },
  FAMILIAR: { label: "Familiar", tone: "var(--grape)", step: 2 },
  STRONG: { label: "Strong", tone: "var(--lime)", step: 3 },
  MASTERED: { label: "Mastered", tone: "var(--sun)", step: 4 },
};

const CONTENT_LABEL: Record<ContentType, { label: string; tone: string }> = {
  HIRAGANA: { label: "Hiragana", tone: "var(--track-hiragana)" },
  KATAKANA: { label: "Katakana", tone: "var(--track-katakana)" },
  KANJI: { label: "Kanji", tone: "var(--track-kanji)" },
  VOCABULARY: { label: "Vocabulary", tone: "var(--track-vocab)" },
  PHRASE: { label: "Phrase", tone: "var(--track-phrase)" },
};

const CATEGORY_LABELS: Record<string, string> = {
  etiquette: "Etiquette",
  communication: "Communication",
  "daily-life": "Daily Life",
  travel: "Travel",
};

function isCulturalTipItem(item: LessonItem): boolean {
  return !!item.content?.isCulturalTip;
}

function isScriptIntroItem(item: LessonItem): boolean {
  return !!item.content?.isScriptIntro;
}

function AudioButton({
  text,
  lang = "ja-JP",
  size = "sm",
}: {
  text: string;
  lang?: string;
  size?: "sm" | "md" | "lg";
}) {
  const dims = size === "lg" ? "w-16 h-16" : size === "md" ? "w-12 h-12" : "w-9 h-9";
  const icon = size === "lg" ? "w-6 h-6" : size === "md" ? "w-5 h-5" : "w-4 h-4";
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        speak(text, lang);
      }}
      className={cn(
        "relative rounded-full shrink-0 grid place-items-center transition-colors touch-manipulation",
        size === "sm"
          ? "bg-surface-raised text-sky hover:brightness-125"
          : "ledge-sm text-on-light",
        // 36px still reads under the thumb as small, so the compact size keeps its
        // look and grows the tap area to 44px with an invisible overlay.
        size === "sm" &&
          "before:absolute before:left-1/2 before:top-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:h-11 before:w-11 before:content-['']",
        dims
      )}
      style={
        size === "sm"
          ? undefined
          : { background: "hsl(var(--sky))", ["--ledge" as string]: "var(--sky-deep)" }
      }
      aria-label="Play pronunciation"
      title="Play pronunciation"
      type="button"
    >
      <Volume2 className={icon} strokeWidth={2.5} />
    </button>
  );
}

/** Five discrete pips: mastery is a stage, so it reads better than a bar. */
function MasteryPips({ review }: { review: LessonItem["review"] }) {
  const level = review?.srsLevel ?? "NEW";
  const display = SRS_DISPLAY[level] ?? SRS_DISPLAY.NEW;
  return (
    <span
      className="inline-flex items-center gap-2"
      title={`Mastery: ${display.label} — New → Learning → Familiar → Strong → Mastered`}
    >
      <span
        className="font-display font-bold text-[11px] uppercase tracking-wider"
        style={{ color: `hsl(${display.tone})` }}
      >
        {display.label}
      </span>
      <span className="flex items-center gap-1">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full transition-colors"
            style={{
              background: i < display.step ? `hsl(${display.tone})` : "hsl(var(--ink-deep))",
            }}
          />
        ))}
      </span>
    </span>
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
        title="You've missed this one before — a memory hook may help"
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

function shouldShowMnemonicHint(item: LessonItem): boolean {
  if (isE2J(item) || isListening(item)) return false;
  if (item.contentType !== "HIRAGANA" && item.contentType !== "KATAKANA" && item.contentType !== "KANJI") return false;
  if (!item.content?.mnemonicHint) return false;
  return (item.review?.incorrectCount ?? 0) > 0;
}

function kanjiReadings(onyomi: string[] = [], kunyomi: string[] = []) {
  const readings = [
    ...onyomi.map((r) => ({ label: "on" as const, kana: katakanaToHiragana(r) })),
    ...kunyomi.map((r) => ({ label: "kun" as const, kana: katakanaToHiragana(r) })),
  ].filter((r) => r.kana);
  const seen = new Set<string>();
  return readings.filter((r) => (seen.has(r.kana) ? false : (seen.add(r.kana), true))).slice(0, 3);
}

function isE2J(item: LessonItem) {
  return item.exerciseType === "ENGLISH_TO_JAPANESE";
}

function isListening(item: LessonItem) {
  return item.exerciseType === "LISTENING";
}

function isSpeaking(item: LessonItem) {
  return item.exerciseType === "SPEAKING";
}

// Audio always plays the kana reading, never the kanji — see lib/speech.
function getSpeechText(item: LessonItem): string {
  return speechText(item.contentType, item.content);
}

/** Small caption above a group of secondary details on the answer side. */
function DetailLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-display text-[11px] font-bold uppercase tracking-[0.12em] text-text-subtle">
      {children}
    </p>
  );
}

function CardFront({ item }: { item: LessonItem }) {
  const { content, contentType } = item;
  if (!content) return <p className="text-text-muted">No content</p>;

  if (isListening(item)) {
    const text = getSpeechText(item);
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="text-[14px] text-text-muted font-medium">Listen and identify</p>
        <button
          onClick={() => speak(text)}
          className="w-20 h-20 rounded-full grid place-items-center ledge text-on-light"
          style={{ background: "hsl(var(--sky))", ["--ledge" as string]: "var(--sky-deep)" }}
          aria-label="Play audio"
        >
          <Volume2 className="w-8 h-8" strokeWidth={2.5} />
        </button>
        <p className="text-[13px] text-text-subtle font-medium">Tap to replay</p>
      </div>
    );
  }

  if (isE2J(item)) {
    return (
      <span className="font-display text-[2rem] font-extrabold tracking-tight text-center leading-tight">
        {content.english}
      </span>
    );
  }

  if (contentType === "HIRAGANA" || contentType === "KATAKANA" || contentType === "KANJI") {
    return <span className="jp text-mega leading-none font-bold">{content.character}</span>;
  }

  if (contentType === "VOCABULARY") {
    return (
      <div className="flex flex-col items-center gap-2">
        <span className="jp text-[3.5rem] leading-none font-bold">{content.japanese}</span>
        <span className="jp text-xl text-text-muted font-medium">{content.kana}</span>
      </div>
    );
  }

  return (
    <span className="jp text-[1.75rem] leading-relaxed font-bold text-center">
      {content.japanese}
    </span>
  );
}

function CardBack({ item }: { item: LessonItem }) {
  const { content, contentType } = item;
  if (!content) return null;

  const speechTextForItem = getSpeechText(item);

  if (isE2J(item)) {
    if (contentType === "VOCABULARY") {
      return (
        <div className="flex flex-col items-center gap-2.5 text-center">
          <div className="flex items-center gap-2.5">
            <p className="jp text-[2.5rem] leading-none font-bold">{content.japanese}</p>
            {content.kana && <AudioButton text={readingSpeechText(content.kana)} size="md" />}
          </div>
          {content.kana && <p className="jp text-base text-text-muted">{content.kana}</p>}
          {content.romaji && <p className="text-[13px] text-text-subtle">{content.romaji}</p>}
        </div>
      );
    }
    if (contentType === "PHRASE") {
      return (
        <div className="flex flex-col items-center gap-2.5 text-center">
          <div className="flex items-center gap-2.5">
            <p className="jp text-2xl font-bold leading-snug">{content.japanese}</p>
            {content.kana && <AudioButton text={readingSpeechText(content.kana)} size="md" />}
          </div>
          {content.kana && <p className="jp text-[15px] text-text-muted">{content.kana}</p>}
          {content.romaji && <p className="text-[13px] text-text-subtle">{content.romaji}</p>}
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center gap-2.5 text-center">
        <div className="flex items-center gap-2.5">
          <p className="jp text-[3.5rem] leading-none font-bold">{content.character}</p>
          {speechTextForItem && <AudioButton text={speechTextForItem} size="md" />}
        </div>
        {content.romaji && <p className="text-base text-text-muted">{content.romaji}</p>}
      </div>
    );
  }

  if (contentType === "HIRAGANA" || contentType === "KATAKANA") {
    return (
      <div className="flex items-center gap-2.5">
        <p className="font-display text-[2rem] font-extrabold tracking-tight">{content.romaji}</p>
        {speechTextForItem && <AudioButton text={speechTextForItem} size="md" />}
      </div>
    );
  }

  if (contentType === "KANJI") {
    const exampleWords = (content.exampleWords ?? []).slice(0, 3);
    const readings = kanjiReadings(content.onyomi, content.kunyomi);
    return (
      <div className="flex flex-col items-center gap-4 text-center w-full">
        <p className="font-display text-2xl font-extrabold tracking-tight">{(content.meanings ?? []).join(", ")}</p>

        {readings.length > 0 && (
          <div className="w-full space-y-2">
            <DetailLabel>Readings</DetailLabel>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
              {readings.map((r) => (
                <div key={`${r.label}-${r.kana}`} className="flex items-center gap-2">
                  <AudioButton text={readingSpeechText(r.kana)} />
                  <span className="jp text-[15px] text-text">{r.kana}</span>
                  <span className="text-[13px] text-text-muted">{kanaToRomaji(r.kana)}</span>
                  <span className="font-display text-[10px] font-bold uppercase tracking-wider text-text-subtle bg-ink-deep rounded-full px-2 py-0.5">
                    {r.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {exampleWords.length > 0 && (
          <div className="w-full space-y-2 pt-1">
            <DetailLabel>Common words</DetailLabel>
            <div className="space-y-1.5">
              {exampleWords.map((w, i) => (
                <div key={i} className="flex items-center justify-center gap-2 text-[13px]">
                  <AudioButton text={w.reading || w.word || ""} />
                  <span className="jp text-text">{w.word}</span>
                  {w.meaning && <span className="text-text-muted">{w.meaning}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (contentType === "VOCABULARY") {
    return (
      <div className="flex flex-col items-center gap-2.5 text-center">
        <div className="flex items-center gap-2.5">
          <p className="text-[13px] text-text-subtle">{content.romaji}</p>
          {speechTextForItem && <AudioButton text={speechTextForItem} />}
        </div>
        <p className="font-display text-2xl font-extrabold tracking-tight">{content.english}</p>
        {content.exampleSentenceJa && (
          <div className="mt-1 pt-3 border-t border-line w-full space-y-1">
            <p className="jp text-[13px] text-text-muted leading-relaxed">{content.exampleSentenceJa}</p>
            {content.exampleSentenceEn && (
              <p className="text-[13px] text-text-subtle">{content.exampleSentenceEn}</p>
            )}
          </div>
        )}
      </div>
    );
  }

  // PHRASE
  return (
    <div className="flex flex-col items-center gap-2.5 text-center">
      <div className="flex items-center gap-2.5">
        <p className="text-[13px] text-text-subtle">{content.romaji}</p>
        {speechTextForItem && <AudioButton text={speechTextForItem} />}
      </div>
      <p className="font-display text-2xl font-extrabold tracking-tight">{content.english}</p>
      {content.scenario && (
        <p className="text-[13px] text-text-subtle">{content.scenario}</p>
      )}
    </div>
  );
}

/** Editorial cards (culture tips, script intros) share one masthead treatment. */
function Masthead({ kicker, tone }: { kicker: string; tone: string }) {
  return (
    <span
      className="inline-flex self-start items-center h-7 px-3 rounded-full font-display text-[11px] font-bold uppercase tracking-[0.1em] text-on-light"
      style={{ background: `hsl(${tone})` }}
    >
      {kicker}
    </span>
  );
}

function CulturalTipQuestion({ item }: { item: LessonItem }) {
  const { content } = item;
  if (!content) return null;
  const category = CATEGORY_LABELS[content.category ?? ""] ?? "Culture";
  return (
    <div className="flex flex-col gap-4 w-full">
      <Masthead kicker={`Japan tip · ${category}`} tone="var(--sun)" />
      <p className="text-[17px] leading-relaxed font-medium">{content.question}</p>
    </div>
  );
}

function CulturalTipAnswer({ item }: { item: LessonItem }) {
  const { content } = item;
  if (!content) return null;
  return (
    <div className="flex flex-col gap-3 w-full animate-fade">
      <h3 className="text-xl">{content.title}</h3>
      <p className="text-[15px] text-text-muted leading-relaxed">{content.body}</p>
    </div>
  );
}

function ScriptIntroCard({ item }: { item: LessonItem }) {
  const { content } = item;
  if (!content) return null;
  return (
    <div className="flex flex-col gap-3 w-full">
      <Masthead kicker="Before you begin" tone="var(--sky)" />
      <h3 className="text-xl">{content.title}</h3>
      <p className="text-[15px] text-text-muted leading-relaxed">{content.body}</p>
    </div>
  );
}

/** Keyboard affordance shown beside the answer buttons on pointer-and-keyboard
    devices. Study sessions are long; hands should be able to stay on the keys. */
function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="hidden sm:inline-grid place-items-center min-w-[1.25rem] h-[1.25rem] px-1.5 rounded-md bg-black/15 text-[10px] font-sans font-bold opacity-80">
      {children}
    </kbd>
  );
}

function Spinner({ label = "Preparing lesson…" }: { label?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <div className="w-8 h-8 border-4 border-surface-raised border-t-coral rounded-full animate-spin" />
      <p className="text-[14px] text-text-subtle font-medium">{label}</p>
    </div>
  );
}

export default function LessonPage() {
  const { id } = useParams<{ id: string }>();

  const [lesson, setLesson] = useState<LessonResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  // Consecutive correct answers. Surfaced from three up — a small, honest
  // reason to keep going that costs nothing if the learner ignores it.
  const [combo, setCombo] = useState(0);
  const [finalResults, setFinalResults] = useState<FinalResult | null>(null);
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const [showDoneDialog, setShowDoneDialog] = useState(false);
  const [mcChoice, setMcChoice] = useState<string | null>(null);
  const [mcCorrect, setMcCorrect] = useState<boolean | null>(null);
  const startTime = useRef(Date.now());
  // Guards against a double-tap/ghost-click firing an answer handler twice for
  // the same item before React commits the advance, which silently skips a card.
  const answeringRef = useRef(false);

  useEffect(() => {
    answeringRef.current = false;
  }, [currentIndex]);

  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    setRevealed(false);
    setMcChoice(null);
    setMcCorrect(null);
    setCorrectCount(0);
    setAnsweredCount(0);
    setCombo(0);
    setFinalResults(null);
    answeringRef.current = false;
    startTime.current = Date.now();
    fetch(`/api/lesson/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed to load lesson"))))
      .then((data: LessonResult) => {
        setLesson(data);
        setCurrentIndex(0);
        setLoading(false);
      })
      .catch(() => {
        setLesson(null);
        setLoading(false);
      });
  }, [id]);

  const unansweredItems = lesson ? lesson.items.filter((item) => item.answeredAt === null) : [];
  const currentItem = unansweredItems[currentIndex] ?? null;
  const totalUnanswered = unansweredItems.length;

  const isListeningMC = currentItem
    ? isListening(currentItem) && (currentItem.contentType === "VOCABULARY" || currentItem.contentType === "PHRASE")
    : false;

  const isSpeakingItem = currentItem ? isSpeaking(currentItem) : false;

  // Must stay above the loading/empty/results early returns below: those skip
  // the rest of the render, so calling a hook after them changes the hook count
  // between renders and React throws "rendered more hooks than expected".
  const mcChoices: string[] = useMemo(() => {
    if (!isListeningMC || !currentItem || !lesson) return [];
    const correctAnswer = currentItem.content?.english ?? "";
    const others = lesson.items
      .filter((i) => i.id !== currentItem.id && i.content?.english && i.content.english !== correctAnswer)
      .map((i) => i.content!.english as string);
    const shuffled = others.sort(() => Math.random() - 0.5).slice(0, 3);
    return [...shuffled, correctAnswer].sort(() => Math.random() - 0.5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentItem?.id, isListeningMC]);

  // Revealing a "Say it in Japanese" card plays the answer straight away. The
  // whole point of that card is what the word sounds like, so making the learner
  // reach for the speaker button every time puts a tap between them and the one
  // thing they are there to hear. The speaker button stays for replays.
  const revealSpeechText =
    revealed && currentItem && isE2J(currentItem) ? getSpeechText(currentItem) : "";
  useEffect(() => {
    if (!revealSpeechText) return;
    // A beat, so the answer is on screen before it is spoken.
    const t = setTimeout(() => speak(revealSpeechText), 120);
    return () => clearTimeout(t);
  }, [revealSpeechText]);

  function submitReview(item: LessonItem, quality: 1 | 5) {
    if (isCulturalTipItem(item) || isScriptIntroItem(item)) return;
    fetch("/api/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentType: item.contentType, contentId: item.contentId, quality, lessonItemId: item.id }),
    });
  }

  function advanceAfterAnswer(correct: boolean) {
    const newCorrectCount = correctCount + (correct ? 1 : 0);
    const newAnsweredCount = answeredCount + 1;
    setCorrectCount(newCorrectCount);
    setAnsweredCount(newAnsweredCount);

    if (currentIndex + 1 < totalUnanswered) {
      setCurrentIndex((i) => i + 1);
      setRevealed(false);
    } else {
      const total = newAnsweredCount;
      const accuracy = total > 0 ? Math.round((newCorrectCount / total) * 100) : 0;
      setFinalResults({ correct: newCorrectCount, total, accuracy });
      const durationSeconds = Math.round((Date.now() - startTime.current) / 1000);
      fetch(`/api/lesson/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completedAt: new Date().toISOString(),
          xpEarned: newCorrectCount * 10,
          accuracy,
          durationSeconds,
        }),
      });
    }
  }

  const handleAnswer = useCallback(
    (correct: boolean) => {
      if (!currentItem || !lesson) return;
      if (answeringRef.current) return;
      answeringRef.current = true;
      setMcChoice(null);
      setMcCorrect(null);
      setCombo((c) => (correct ? c + 1 : 0));
      submitReview(currentItem, correct ? 5 : 1);
      advanceAfterAnswer(correct);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentItem, lesson, correctCount, answeredCount, currentIndex, totalUnanswered]
  );

  function handleEarlyExit() {
    const durationSeconds = Math.round((Date.now() - startTime.current) / 1000);
    if (durationSeconds > 10) {
      fetch(`/api/lesson/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ durationSeconds }),
      });
    }
    window.location.href = "/dashboard";
  }

  // Keyboard control. A review session is dozens of identical decisions in a
  // row; requiring a pointer for every one of them is the single biggest drag
  // on the desktop experience.
  const canUseShortcuts =
    !loading && !finalResults && !!currentItem && !isListeningMC && !isSpeakingItem;
  useEffect(() => {
    if (!canUseShortcuts) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;

      if (showDoneDialog) {
        if (e.key === "Escape") setShowDoneDialog(false);
        return;
      }
      if (e.key === "Escape") {
        setShowDoneDialog(true);
        return;
      }
      if (!revealed) {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          setRevealed(true);
        }
        return;
      }
      if (e.key === "1") handleAnswer(false);
      if (e.key === "2" || e.key === " " || e.key === "Enter") {
        e.preventDefault();
        handleAnswer(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canUseShortcuts, revealed, showDoneDialog, handleAnswer]);

  if (loading) return <Spinner />;

  if (!lesson || unansweredItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="jp text-5xl">空</p>
        <p className="text-text-muted font-medium">Nothing left to study in this lesson.</p>
        <Link
          href="/dashboard"
          className={buttonStyles({ variant: "secondary" })}
          style={buttonVars("secondary")}
        >
          Back to dashboard
        </Link>
      </div>
    );
  }

  if (finalResults) {
    const missed = finalResults.total - finalResults.correct;
    const great = finalResults.accuracy >= 80;
    // The celebration colour is earned, not automatic: a rough set gets warmth
    // and encouragement rather than confetti it didn't deserve.
    const hue = great ? "var(--lime)" : finalResults.accuracy >= 50 ? "var(--sun)" : "var(--coral)";

    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm space-y-5">
          {/* Score as a block of colour with the number at poster size. */}
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
                Lesson complete
              </p>
              <p className="font-display font-extrabold text-mega tnum mt-2">
                {finalResults.accuracy}
                <span className="text-3xl align-top">%</span>
              </p>
              <p className="font-display font-bold text-[17px] mt-1">
                {great
                  ? "That material is sticking."
                  : finalResults.accuracy >= 50
                    ? "Solid. The misses come back sooner."
                    : "Tough set — these will resurface."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5 stagger">
            {[
              { label: "Correct", value: finalResults.correct, tone: "var(--lime)" },
              { label: "Missed", value: missed, tone: "var(--rose)" },
              { label: "Best run", value: combo, tone: "var(--sun)" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-tile border-2 border-line bg-surface card-ledge py-3.5 text-center"
              >
                <p
                  className="font-display font-extrabold text-[26px] tnum leading-none"
                  style={{ color: `hsl(${stat.tone})` }}
                >
                  {stat.value}
                </p>
                <p className="text-[11px] font-bold text-text-subtle mt-1.5 uppercase tracking-wider">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          {installPrompt && (
            <Card className="p-4 flex items-center justify-between gap-3">
              <div>
                <p className="font-display font-bold text-[14px]">Put Ikou on your home screen</p>
                <p className="text-[12px] text-text-subtle mt-0.5 font-medium">
                  Full screen, works offline
                </p>
              </div>
              <button
                onClick={() => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (installPrompt as any).prompt?.();
                  setInstallPrompt(null);
                }}
                className={buttonStyles({ variant: "secondary", size: "sm" })}
                style={buttonVars("secondary")}
              >
                Install
              </button>
            </Card>
          )}

          <div className="space-y-3 pt-1">
            <Link
              href="/lesson"
              className={buttonStyles({ full: true, size: "lg" })}
              style={buttonVars("primary")}
            >
              One more round
            </Link>
            <Link
              href="/dashboard"
              className={buttonStyles({ variant: "secondary", full: true, size: "lg" })}
              style={buttonVars("secondary")}
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const progressPct = totalUnanswered > 0 ? Math.round((currentIndex / totalUnanswered) * 100) : 0;
  const isCultural = currentItem ? isCulturalTipItem(currentItem) : false;
  const isScriptIntro = currentItem ? isScriptIntroItem(currentItem) : false;
  const isEditorial = isCultural || isScriptIntro;

  return (
    <div className="min-h-screen flex flex-col">
      {showDoneDialog && (
        <div
          className="fixed inset-0 z-50 grid place-items-center px-4 bg-scrim/70 backdrop-blur-sm animate-fade"
          role="dialog"
          aria-modal="true"
          aria-labelledby="stop-title"
          onClick={() => setShowDoneDialog(false)}
        >
          <Card
            className="p-5 w-full max-w-sm animate-pop-in"
            // Clicks inside the dialog must not fall through to the backdrop
            // dismiss handler above.
          >
            <div onClick={(e) => e.stopPropagation()}>
              <h2 id="stop-title" className="text-xl mb-2">Call it here?</h2>
              <p className="text-[14px] text-text-muted leading-relaxed mb-5 font-medium">
                Your progress is saved — this lesson will be waiting exactly where you
                left it.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleEarlyExit}
                  className={buttonStyles({ variant: "secondary", full: true })}
                  style={buttonVars("secondary")}
                >
                  Finish
                </button>
                <button
                  onClick={() => setShowDoneDialog(false)}
                  className={buttonStyles({ full: true })}
                  style={buttonVars("primary")}
                >
                  Keep going
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Session bar. A hairline progress track sits flush under it, so the
          measure of the session is always in view without taking up a row. */}
      {/* Session bar. The progress track is thick and lime because watching it
          fill is a large part of why anyone finishes a set. */}
      <header className="sticky top-0 z-30 bg-ink/90 backdrop-blur-xl">
        <div className="max-w-md mx-auto h-16 px-4 flex items-center gap-3">
          <button
            onClick={() => setShowDoneDialog(true)}
            className="w-10 h-10 -ml-1 rounded-full grid place-items-center bg-surface border-2 border-line text-text-muted hover:text-text hover:border-line-strong transition-colors shrink-0"
            aria-label="End session"
            title="End session (Esc)"
          >
            <X className="w-[18px] h-[18px]" strokeWidth={2.5} />
          </button>

          <div className="flex-1">
            <div className="h-3.5 rounded-full bg-surface-raised overflow-hidden">
              <div
                className="h-full rounded-full bg-lime transition-[width] duration-500 ease-bounce"
                style={{
                  width: `${progressPct}%`,
                  boxShadow: "inset 0 2px 0 0 rgb(255 255 255 / 0.3)",
                }}
              />
            </div>
          </div>

          {combo >= 3 ? (
            <Chip hue="var(--sun)" className="shrink-0 animate-pop" key={combo}>
              <Flame className="w-3.5 h-3.5" strokeWidth={2.5} fill="currentColor" />
              <span className="tnum">{combo}</span>
            </Chip>
          ) : (
            <span className="font-display font-bold text-[14px] text-text-subtle tnum shrink-0 min-w-[3rem] text-right">
              {currentIndex + 1}/{totalUnanswered}
            </span>
          )}
        </div>
      </header>

      <main className="flex-1 w-full max-w-md mx-auto px-4 py-6 flex flex-col gap-4">
        {/* One keyed wrapper for the whole card group. Every card, hint and
            answer control for the current item lives inside this single subtree,
            so advancing swaps it out as one unit. Previously these were sibling
            nodes that each carried key={currentItem.id}; duplicate keys among
            siblings make React drop one of them from its reconciliation map, and
            the dropped card's DOM node is never removed — that is what left a
            previous character sitting above the current one. */}
        {currentItem && (
          <div key={currentItem.id} className="flex-1 w-full flex flex-col gap-4 animate-pop-in">
            {isEditorial ? (
              <>
                <div className="flex-1 flex flex-col justify-center">
                  <Card className="p-6 flex flex-col justify-center min-h-[13rem]">
                    {isScriptIntro ? (
                      <ScriptIntroCard item={currentItem} />
                    ) : revealed ? (
                      <CulturalTipAnswer item={currentItem} />
                    ) : (
                      <CulturalTipQuestion item={currentItem} />
                    )}
                  </Card>
                </div>

                {isScriptIntro ? (
                  <button
                    onClick={() => handleAnswer(true)}
                    className={buttonStyles({ size: "lg", full: true })}
                    style={buttonVars("primary")}
                  >
                    Got it — let&apos;s start
                  </button>
                ) : !revealed ? (
                  <button
                    onClick={() => setRevealed(true)}
                    className={buttonStyles({ size: "lg", full: true })}
                    style={buttonVars("primary")}
                  >
                    Reveal
                    <Key>space</Key>
                  </button>
                ) : (
                  <div className="flex gap-2.5">
                    <button
                      onClick={() => handleAnswer(false)}
                      className={buttonStyles({ variant: "reject", size: "lg", full: true })}
                      style={buttonVars("reject")}
                    >
                      <RotateCcw className="w-[18px] h-[18px]" strokeWidth={2.5} />
                      Again
                      <Key>1</Key>
                    </button>
                    <button
                      onClick={() => handleAnswer(true)}
                      className={buttonStyles({ variant: "affirm", size: "lg", full: true })}
                      style={buttonVars("affirm")}
                    >
                      <Check className="w-[18px] h-[18px]" strokeWidth={3} />
                      Got it
                      <Key>2</Key>
                    </button>
                  </div>
                )}
              </>
            ) : isSpeakingItem ? (
              /* Say-it-back. The card owns its own controls end to end: there
                 is no reveal step and no self-assessment pair, because the
                 attempt itself is the answer. */
              <div className="flex-1 flex flex-col justify-center">
                <SpeakCard
                  prompt={{
                    japanese: currentItem.content?.japanese ?? currentItem.content?.character ?? "",
                    kana: currentItem.content?.kana,
                    romaji: currentItem.content?.romaji,
                    english: currentItem.content?.english,
                  }}
                  /* A word met for the first time is taught, then repeated
                     back; one already in the schedule is prompted from its
                     meaning and has to be recalled. */
                  teachFirst={(currentItem.review?.srsLevel ?? "NEW") === "NEW"}
                  onPass={() => handleAnswer(true)}
                  onFail={() => handleAnswer(false)}
                  failLabel="I can't say this one yet"
                />
              </div>
            ) : (
              <>
                {/* Prompt and answer share one card, divided by a hairline.
                    The old layout used two detached cards with a "─ ─ ─"
                    placeholder in the second, which read as a rendering fault. */}
                <div className="flex-1 flex flex-col justify-center gap-4">
                <Card className="overflow-hidden">
                  <div className="px-4 h-12 flex items-center justify-between border-b-2 border-line">
                    <span
                      className="inline-flex items-center h-7 px-3 rounded-full font-display text-[11px] font-bold uppercase tracking-[0.1em] text-on-light"
                      style={{ background: `hsl(${CONTENT_LABEL[currentItem.contentType].tone})` }}
                    >
                      {CONTENT_LABEL[currentItem.contentType].label}
                    </span>
                    <MasteryPips review={currentItem.review} />
                  </div>

                  <div className="px-8 pt-5 pb-8 flex flex-col items-center justify-center gap-4 min-h-[12rem]">
                    <p className="text-[13px] font-semibold text-text-subtle">
                      {isE2J(currentItem)
                        ? "Say it in Japanese"
                        : isListening(currentItem)
                          ? "What did you hear?"
                          : "What does this mean?"}
                    </p>
                    <CardFront item={currentItem} />
                  </div>

                  {!isListeningMC && (
                    <div className="border-t-2 border-line p-6 flex items-center justify-center min-h-[7rem] bg-ink-deep/40">
                      {revealed ? (
                        <div className="w-full flex justify-center animate-pop-in">
                          <CardBack item={currentItem} />
                        </div>
                      ) : (
                        <button
                          onClick={() => setRevealed(true)}
                          className="jp text-[2rem] text-text-subtle/35 tracking-[0.3em] select-none hover:text-text-subtle/60 transition-colors"
                          aria-label="Reveal the answer"
                        >
                          ？？？
                        </button>
                      )}
                    </div>
                  )}
                </Card>

                {shouldShowMnemonicHint(currentItem) && (
                  <MnemonicButton hint={currentItem.content!.mnemonicHint!} />
                )}
                </div>

                {isListeningMC ? (
                  <div className="space-y-2">
                    {mcChoices.map((choice) => {
                      const isCorrectAnswer = choice === (currentItem.content?.english ?? "");
                      const isSelected = mcChoice === choice;

                      let stateClass =
                        "bg-surface border-line text-text hover:border-line-strong card-ledge";
                      if (mcChoice) {
                        if (isSelected && mcCorrect) {
                          stateClass = "bg-lime border-lime text-on-light animate-pop";
                        } else if (isSelected && !mcCorrect) {
                          stateClass = "bg-rose border-rose text-on-dark animate-shake";
                        } else if (isCorrectAnswer) {
                          stateClass = "bg-lime/15 border-lime/50 text-lime";
                        } else {
                          stateClass = "bg-surface border-line text-text-subtle opacity-60";
                        }
                      }

                      return (
                        <button
                          key={choice}
                          disabled={!!mcChoice}
                          className={cn(
                            "w-full py-4 px-5 rounded-tile text-[15px] font-semibold text-left border-2",
                            "transition-colors duration-150 disabled:cursor-default",
                            stateClass
                          )}
                          onClick={() => {
                            if (mcChoice) return;
                            const correct = isCorrectAnswer;
                            setMcChoice(choice);
                            setMcCorrect(correct);
                            if (correct) {
                              setTimeout(() => handleAnswer(true), 700);
                            }
                          }}
                        >
                          {choice}
                        </button>
                      );
                    })}
                    {mcChoice && !mcCorrect && (
                      <button
                        onClick={() => handleAnswer(false)}
                        className={buttonStyles({ variant: "secondary", full: true, size: "lg", className: "mt-1" })}
                        style={buttonVars("secondary")}
                      >
                        Continue
                      </button>
                    )}
                  </div>
                ) : !revealed ? (
                  <button
                    onClick={() => setRevealed(true)}
                    className={buttonStyles({ size: "lg", full: true })}
                    style={buttonVars("primary")}
                  >
                    Reveal
                    <Key>space</Key>
                  </button>
                ) : (
                  <div className="flex gap-2.5">
                    <button
                      onClick={() => handleAnswer(false)}
                      className={buttonStyles({ variant: "reject", size: "lg", full: true })}
                      style={buttonVars("reject")}
                    >
                      <RotateCcw className="w-[18px] h-[18px]" strokeWidth={2.5} />
                      Again
                      <Key>1</Key>
                    </button>
                    <button
                      onClick={() => handleAnswer(true)}
                      className={buttonStyles({ variant: "affirm", size: "lg", full: true })}
                      style={buttonVars("affirm")}
                    >
                      <Check className="w-[18px] h-[18px]" strokeWidth={3} />
                      Got it
                      <Key>2</Key>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
