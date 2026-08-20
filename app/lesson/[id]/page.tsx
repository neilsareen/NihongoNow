"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Check, Lightbulb, RotateCcw, Volume2, X } from "lucide-react";
import { readingSpeechText, speak, speechText } from "@/lib/speech";
import { cn } from "@/lib/utils";
import { Card, buttonStyles } from "@/app/components/ui";

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
  NEW: { label: "New", tone: "220 9% 50%", step: 0 },
  LEARNING: { label: "Learning", tone: "205 60% 58%", step: 1 },
  FAMILIAR: { label: "Familiar", tone: "174 45% 48%", step: 2 },
  STRONG: { label: "Strong", tone: "152 45% 48%", step: 3 },
  MASTERED: { label: "Mastered", tone: "45 60% 56%", step: 4 },
};

const CONTENT_LABEL: Record<ContentType, string> = {
  HIRAGANA: "Hiragana",
  KATAKANA: "Katakana",
  KANJI: "Kanji",
  VOCABULARY: "Vocabulary",
  PHRASE: "Phrase",
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
  const dims = size === "lg" ? "w-14 h-14" : size === "md" ? "w-9 h-9" : "w-7 h-7";
  const icon = size === "lg" ? "w-5 h-5" : size === "md" ? "w-4 h-4" : "w-3.5 h-3.5";
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        speak(text, lang);
      }}
      className={cn(
        "rounded-full border border-line bg-surface-raised text-text-muted shrink-0",
        "hover:text-text hover:border-line-strong transition-colors duration-150 ease-swift",
        "grid place-items-center active:translate-y-px",
        dims
      )}
      aria-label="Play pronunciation"
      title="Play pronunciation"
      type="button"
    >
      <Volume2 className={icon} strokeWidth={1.75} />
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
      <span className="text-[11px] font-medium" style={{ color: `hsl(${display.tone})` }}>
        {display.label}
      </span>
      <span className="flex items-center gap-[3px]">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="w-1 h-1 rounded-full transition-colors"
            style={{
              background:
                i < display.step ? `hsl(${display.tone})` : "hsl(var(--line-strong))",
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
        className={buttonStyles({ variant: "ghost", size: "sm", className: "text-warning hover:text-warning" })}
        title="You've missed this one before — a memory hook may help"
      >
        <Lightbulb className="w-3.5 h-3.5" strokeWidth={1.75} />
        {show ? "Hide hint" : "Need a hint?"}
      </button>
      {show && (
        <p className="text-[13px] text-text-muted leading-relaxed text-center max-w-xs animate-fade">
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

function katakanaToHiragana(str: string): string {
  return str.replace(/[ァ-ヶ]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 96)).replace(/-/g, "");
}

function kanaToRomaji(kana: string): string {
  const clean = kana.replace(/-/g, "").replace(/ー/g, "");
  // Katakana → hiragana
  const hira = clean.replace(/[ァ-ヶ]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 96)
  );
  const T: Record<string, string> = {
    "きゃ":"kya","きゅ":"kyu","きょ":"kyo","しゃ":"sha","しゅ":"shu","しょ":"sho",
    "ちゃ":"cha","ちゅ":"chu","ちょ":"cho","にゃ":"nya","にゅ":"nyu","にょ":"nyo",
    "ひゃ":"hya","ひゅ":"hyu","ひょ":"hyo","みゃ":"mya","みゅ":"myu","みょ":"myo",
    "りゃ":"rya","りゅ":"ryu","りょ":"ryo","ぎゃ":"gya","ぎゅ":"gyu","ぎょ":"gyo",
    "じゃ":"ja","じゅ":"ju","じょ":"jo","びゃ":"bya","びゅ":"byu","びょ":"byo",
    "ぴゃ":"pya","ぴゅ":"pyu","ぴょ":"pyo",
    "あ":"a","い":"i","う":"u","え":"e","お":"o",
    "か":"ka","き":"ki","く":"ku","け":"ke","こ":"ko",
    "さ":"sa","し":"shi","す":"su","せ":"se","そ":"so",
    "た":"ta","ち":"chi","つ":"tsu","て":"te","と":"to",
    "な":"na","に":"ni","ぬ":"nu","ね":"ne","の":"no",
    "は":"ha","ひ":"hi","ふ":"fu","へ":"he","ほ":"ho",
    "ま":"ma","み":"mi","む":"mu","め":"me","も":"mo",
    "や":"ya","ゆ":"yu","よ":"yo",
    "ら":"ra","り":"ri","る":"ru","れ":"re","ろ":"ro",
    "わ":"wa","を":"o","ん":"n",
    "が":"ga","ぎ":"gi","ぐ":"gu","げ":"ge","ご":"go",
    "ざ":"za","じ":"ji","ず":"zu","ぜ":"ze","ぞ":"zo",
    "だ":"da","ぢ":"ji","づ":"zu","で":"de","ど":"do",
    "ば":"ba","び":"bi","ぶ":"bu","べ":"be","ぼ":"bo",
    "ぱ":"pa","ぴ":"pi","ぷ":"pu","ぺ":"pe","ぽ":"po",
  };
  let result = "";
  let i = 0;
  while (i < hira.length) {
    if (hira[i] === "っ") {
      const next2 = T[hira.substring(i + 1, i + 3)] ?? T[hira[i + 1]] ?? "";
      result += next2[0] ?? "";
      i++; continue;
    }
    const two = T[hira.substring(i, i + 2)];
    if (two) { result += two; i += 2; continue; }
    result += T[hira[i]] ?? hira[i];
    i++;
  }
  return result;
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

// Audio always plays the kana reading, never the kanji — see lib/speech.
function getSpeechText(item: LessonItem): string {
  return speechText(item.contentType, item.content);
}

/** Small caption above a group of secondary details on the answer side. */
function DetailLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text-subtle">
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
        <p className="text-[13px] text-text-muted">Listen and identify</p>
        <button
          onClick={() => speak(text)}
          className="w-16 h-16 rounded-full bg-accent/12 border border-accent/30 text-accent grid place-items-center hover:bg-accent/18 transition-colors duration-150 ease-swift active:translate-y-px"
          aria-label="Play audio"
        >
          <Volume2 className="w-6 h-6" strokeWidth={1.75} />
        </button>
        <p className="text-xs text-text-subtle">Tap to replay</p>
      </div>
    );
  }

  if (isE2J(item)) {
    return (
      <span className="text-[1.75rem] font-semibold tracking-tight text-center leading-snug">
        {content.english}
      </span>
    );
  }

  if (contentType === "HIRAGANA" || contentType === "KATAKANA" || contentType === "KANJI") {
    return <span className="jp text-[5.5rem] leading-none font-medium">{content.character}</span>;
  }

  if (contentType === "VOCABULARY") {
    return (
      <div className="flex flex-col items-center gap-2">
        <span className="jp text-[3.25rem] leading-none font-medium">{content.japanese}</span>
        <span className="jp text-lg text-text-muted">{content.kana}</span>
      </div>
    );
  }

  return (
    <span className="jp text-[1.6rem] leading-relaxed font-medium text-center">
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
            <p className="jp text-[2.25rem] leading-none font-medium">{content.japanese}</p>
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
            <p className="jp text-xl font-medium leading-snug">{content.japanese}</p>
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
          <p className="jp text-[3.25rem] leading-none font-medium">{content.character}</p>
          {speechTextForItem && <AudioButton text={speechTextForItem} size="md" />}
        </div>
        {content.romaji && <p className="text-base text-text-muted">{content.romaji}</p>}
      </div>
    );
  }

  if (contentType === "HIRAGANA" || contentType === "KATAKANA") {
    return (
      <div className="flex items-center gap-2.5">
        <p className="text-2xl font-semibold tracking-tight">{content.romaji}</p>
        {speechTextForItem && <AudioButton text={speechTextForItem} size="md" />}
      </div>
    );
  }

  if (contentType === "KANJI") {
    const exampleWords = (content.exampleWords ?? []).slice(0, 3);
    const readings = kanjiReadings(content.onyomi, content.kunyomi);
    return (
      <div className="flex flex-col items-center gap-4 text-center w-full">
        <p className="text-lg font-semibold tracking-tight">{(content.meanings ?? []).join(", ")}</p>

        {readings.length > 0 && (
          <div className="w-full space-y-2">
            <DetailLabel>Readings</DetailLabel>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
              {readings.map((r) => (
                <div key={`${r.label}-${r.kana}`} className="flex items-center gap-2">
                  <AudioButton text={readingSpeechText(r.kana)} />
                  <span className="jp text-[15px] text-text">{r.kana}</span>
                  <span className="text-[13px] text-text-muted">{kanaToRomaji(r.kana)}</span>
                  <span className="text-[10px] uppercase tracking-wider text-text-subtle border border-line rounded px-1 py-px">
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
        <p className="text-lg font-semibold tracking-tight">{content.english}</p>
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
      <p className="text-lg font-semibold tracking-tight">{content.english}</p>
      {content.scenario && (
        <p className="text-[13px] text-text-subtle">{content.scenario}</p>
      )}
    </div>
  );
}

/** Editorial cards (culture tips, script intros) share one masthead treatment. */
function Masthead({ kicker, tone }: { kicker: string; tone: string }) {
  return (
    <p
      className="text-[10px] font-semibold uppercase tracking-[0.12em]"
      style={{ color: `hsl(${tone})` }}
    >
      {kicker}
    </p>
  );
}

function CulturalTipQuestion({ item }: { item: LessonItem }) {
  const { content } = item;
  if (!content) return null;
  const category = CATEGORY_LABELS[content.category ?? ""] ?? "Culture";
  return (
    <div className="flex flex-col gap-4 w-full">
      <Masthead kicker={`Japan tip · ${category}`} tone="var(--warning)" />
      <p className="text-[15px] leading-relaxed">{content.question}</p>
    </div>
  );
}

function CulturalTipAnswer({ item }: { item: LessonItem }) {
  const { content } = item;
  if (!content) return null;
  return (
    <div className="flex flex-col gap-3 w-full animate-fade">
      <h3 className="text-base font-semibold tracking-tight">{content.title}</h3>
      <p className="text-[14px] text-text-muted leading-relaxed">{content.body}</p>
    </div>
  );
}

function ScriptIntroCard({ item }: { item: LessonItem }) {
  const { content } = item;
  if (!content) return null;
  return (
    <div className="flex flex-col gap-3 w-full">
      <Masthead kicker="Before you begin" tone="var(--accent)" />
      <h3 className="text-base font-semibold tracking-tight">{content.title}</h3>
      <p className="text-[14px] text-text-muted leading-relaxed">{content.body}</p>
    </div>
  );
}

/** Keyboard affordance shown beside the answer buttons on pointer-and-keyboard
    devices. Study sessions are long; hands should be able to stay on the keys. */
function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="hidden sm:inline-grid place-items-center min-w-[1.15rem] h-[1.15rem] px-1 rounded border border-current/25 text-[10px] font-sans font-medium opacity-70">
      {children}
    </kbd>
  );
}

function Spinner({ label = "Preparing lesson…" }: { label?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <div className="w-6 h-6 border-2 border-line-strong border-t-accent rounded-full animate-spin" />
      <p className="text-[13px] text-text-subtle">{label}</p>
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
  const canUseShortcuts = !loading && !finalResults && !!currentItem && !isListeningMC;
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
        <p className="text-text-muted">Nothing left to study in this lesson.</p>
        <Link href="/dashboard" className={buttonStyles({ variant: "secondary" })}>
          Back to dashboard
        </Link>
      </div>
    );
  }

  if (finalResults) {
    const missed = finalResults.total - finalResults.correct;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 py-12">
        <div className="w-full max-w-sm space-y-6 animate-enter">
          <div className="text-center space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight">Lesson complete</h1>
            <p className="text-[13px] text-text-muted">
              {finalResults.accuracy >= 80
                ? "Strong session — that material is sticking."
                : finalResults.accuracy >= 50
                  ? "Solid work. The misses come back sooner."
                  : "Tough set. These will resurface until they hold."}
            </p>
          </div>

          <Card className="p-6 space-y-5">
            <div className="text-center">
              <p className="text-[3.25rem] leading-none font-semibold tracking-[-0.03em] tnum">
                {finalResults.accuracy}
                <span className="text-2xl text-text-muted font-medium">%</span>
              </p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-text-subtle mt-2">
                Accuracy
              </p>
            </div>

            <div className="grid grid-cols-3 divide-x divide-line border-t border-line pt-4">
              {[
                { label: "Correct", value: finalResults.correct, tone: "var(--success)" },
                { label: "Missed", value: missed, tone: "var(--danger)" },
                { label: "Total", value: finalResults.total, tone: "var(--text)" },
              ].map((s) => (
                <div key={s.label} className="text-center px-2">
                  <p className="text-xl font-semibold tnum" style={{ color: `hsl(${s.tone})` }}>
                    {s.value}
                  </p>
                  <p className="text-[11px] text-text-subtle mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </Card>

          {installPrompt && (
            <Card className="p-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[13px] font-medium">Add Ikou to your home screen</p>
                <p className="text-xs text-text-subtle mt-0.5">Opens full screen, works offline</p>
              </div>
              <button
                onClick={() => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (installPrompt as any).prompt?.();
                  setInstallPrompt(null);
                }}
                className={buttonStyles({ variant: "secondary", size: "sm" })}
              >
                Install
              </button>
            </Card>
          )}

          <div className="space-y-2.5">
            <Link href="/lesson" className={buttonStyles({ full: true, size: "lg" })}>
              Start another lesson
            </Link>
            <Link href="/dashboard" className={buttonStyles({ variant: "secondary", full: true, size: "lg" })}>
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
          className="fixed inset-0 z-50 grid place-items-center px-4 bg-canvas/70 backdrop-blur-sm animate-fade"
          role="dialog"
          aria-modal="true"
          aria-labelledby="stop-title"
          onClick={() => setShowDoneDialog(false)}
        >
          <Card
            className="p-5 w-full max-w-sm shadow-lifted animate-enter"
            // Clicks inside the dialog must not fall through to the backdrop
            // dismiss handler above.
          >
            <div onClick={(e) => e.stopPropagation()}>
              <h2 id="stop-title" className="text-base font-semibold tracking-tight mb-1.5">
                Stop studying?
              </h2>
              <p className="text-[13px] text-text-muted leading-relaxed mb-5">
                Your progress is saved. This lesson will be waiting where you left it.
              </p>
              <div className="flex gap-2.5">
                <button
                  onClick={() => setShowDoneDialog(false)}
                  className={buttonStyles({ variant: "secondary", full: true })}
                >
                  Keep going
                </button>
                <button onClick={handleEarlyExit} className={buttonStyles({ full: true })}>
                  Finish
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Session bar. A hairline progress track sits flush under it, so the
          measure of the session is always in view without taking up a row. */}
      <header className="sticky top-0 z-30 bg-canvas/85 backdrop-blur-xl border-b border-line">
        <div className="max-w-md mx-auto h-14 px-3 flex items-center gap-3">
          <button
            onClick={() => setShowDoneDialog(true)}
            className="w-9 h-9 -ml-1 rounded-lg grid place-items-center text-text-subtle hover:text-text hover:bg-surface-raised transition-colors duration-150 ease-swift"
            aria-label="End session"
            title="End session (Esc)"
          >
            <X className="w-[18px] h-[18px]" strokeWidth={1.75} />
          </button>

          <span className="flex-1 text-center text-[11px] font-semibold uppercase tracking-[0.09em] text-text-subtle">
            {currentItem ? CONTENT_LABEL[currentItem.contentType] : ""}
          </span>

          <span className="text-[13px] text-text-muted tnum tabular-nums min-w-[3rem] text-right">
            {currentIndex + 1}/{totalUnanswered}
          </span>
        </div>
        <div className="h-px bg-line">
          <div
            className="h-px bg-accent transition-[width] duration-300 ease-swift"
            style={{ width: `${progressPct}%` }}
          />
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
          <div key={currentItem.id} className="flex-1 w-full flex flex-col gap-4 animate-enter">
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
                  >
                    Got it — let&apos;s start
                  </button>
                ) : !revealed ? (
                  <button
                    onClick={() => setRevealed(true)}
                    className={buttonStyles({ size: "lg", full: true })}
                  >
                    Reveal
                    <Key>space</Key>
                  </button>
                ) : (
                  <div className="flex gap-2.5">
                    <button
                      onClick={() => handleAnswer(false)}
                      className={buttonStyles({ variant: "danger", size: "lg", full: true })}
                    >
                      <RotateCcw className="w-4 h-4" strokeWidth={1.75} />
                      Again
                      <Key>1</Key>
                    </button>
                    <button
                      onClick={() => handleAnswer(true)}
                      className={buttonStyles({ variant: "success", size: "lg", full: true })}
                    >
                      <Check className="w-4 h-4" strokeWidth={2} />
                      Got it
                      <Key>2</Key>
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Prompt and answer share one card, divided by a hairline.
                    The old layout used two detached cards with a "─ ─ ─"
                    placeholder in the second, which read as a rendering fault. */}
                <div className="flex-1 flex flex-col justify-center gap-4">
                <Card className="overflow-hidden">
                  <div className="px-4 h-10 flex items-center justify-between border-b border-line">
                    <span className="text-[11px] font-medium text-text-subtle">
                      {isE2J(currentItem)
                        ? "Say it in Japanese"
                        : isListening(currentItem)
                          ? "What did you hear?"
                          : "What does this mean?"}
                    </span>
                    <MasteryPips review={currentItem.review} />
                  </div>

                  <div className="p-8 flex flex-col items-center justify-center min-h-[11rem]">
                    <CardFront item={currentItem} />
                  </div>

                  {!isListeningMC && (
                    <div className="border-t border-line p-6 flex items-center justify-center min-h-[7rem] bg-surface-sunken/40">
                      {revealed ? (
                        <div className="w-full flex justify-center animate-fade">
                          <CardBack item={currentItem} />
                        </div>
                      ) : (
                        <button
                          onClick={() => setRevealed(true)}
                          className="text-[13px] text-text-subtle hover:text-text-muted transition-colors"
                        >
                          Answer hidden — tap Reveal
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
                        "bg-surface border-line text-text hover:border-line-strong hover:bg-surface-raised";
                      if (mcChoice) {
                        if (isSelected && mcCorrect) {
                          stateClass = "bg-success/12 border-success/45 text-success";
                        } else if (isSelected && !mcCorrect) {
                          stateClass = "bg-danger/12 border-danger/45 text-danger animate-flag";
                        } else if (isCorrectAnswer) {
                          stateClass = "bg-success/[0.06] border-success/25 text-success/80";
                        } else {
                          stateClass = "bg-surface border-line text-text-subtle";
                        }
                      }

                      return (
                        <button
                          key={choice}
                          disabled={!!mcChoice}
                          className={cn(
                            "w-full py-3 px-4 rounded-lg text-sm font-medium text-left border",
                            "transition-colors duration-150 ease-swift disabled:cursor-default",
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
                        className={buttonStyles({ variant: "secondary", full: true, className: "mt-1" })}
                      >
                        Continue
                      </button>
                    )}
                  </div>
                ) : !revealed ? (
                  <button
                    onClick={() => setRevealed(true)}
                    className={buttonStyles({ size: "lg", full: true })}
                  >
                    Reveal
                    <Key>space</Key>
                  </button>
                ) : (
                  <div className="flex gap-2.5">
                    <button
                      onClick={() => handleAnswer(false)}
                      className={buttonStyles({ variant: "danger", size: "lg", full: true })}
                    >
                      <RotateCcw className="w-4 h-4" strokeWidth={1.75} />
                      Again
                      <Key>1</Key>
                    </button>
                    <button
                      onClick={() => handleAnswer(true)}
                      className={buttonStyles({ variant: "success", size: "lg", full: true })}
                    >
                      <Check className="w-4 h-4" strokeWidth={2} />
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
