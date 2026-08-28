"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Check, Flame, Lightbulb, RotateCcw, Volume2, VolumeX, X } from "lucide-react";
import { readingSpeechText, speak, speechReading, speechText } from "@/lib/speech";
import { gradePronunciation, kanaToRomaji, katakanaToHiragana } from "@/lib/pronunciation";
import { cn } from "@/lib/utils";
import { SpeakCard } from "@/app/components/speak-card";
import { SilentModeButton, useSilentMode } from "@/app/components/silent-mode";
import { Card, CardScroller, Chip, buttonStyles, buttonVars } from "@/app/components/ui";
import {
  SCENE_LABELS,
  type ConversationLine,
  type ConversationPattern,
  type ConversationScene,
} from "@/lib/conversations";
import {
  NUMBER_SCENE_LABELS,
  type NumberQuiz,
  type NumberReading,
  type NumberScene,
} from "@/lib/numbers";

type ContentType =
  | "HIRAGANA"
  | "KATAKANA"
  | "KANJI"
  | "VOCABULARY"
  | "PHRASE"
  | "CULTURE"
  | "CONVERSATION"
  | "NUMBERS";

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
    kicker?: string;
    title?: string;
    question?: string;
    body?: string;
    category?: string;
    isConversation?: boolean;
    /** A conversation scene or a numbers scene — each card's own renderer
     *  narrows it, and the two label maps never overlap. */
    scene?: ConversationScene | NumberScene;
    canDo?: string;
    situation?: string;
    theySpeakFirst?: boolean;
    say?: ConversationLine;
    hear?: ConversationLine[];
    reply?: ConversationLine[];
    pattern?: ConversationPattern;
    tip?: string;
    isNumbers?: boolean;
    readings?: NumberReading[];
    /** Built server-side for a MULTIPLE_CHOICE numbers card. */
    quiz?: NumberQuiz | null;
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
  CULTURE: { label: "Culture", tone: "var(--sun)" },
  CONVERSATION: { label: "Conversation", tone: "var(--track-conversation)" },
  NUMBERS: { label: "Numbers & money", tone: "var(--track-numbers)" },
};

const CATEGORY_LABELS: Record<string, string> = {
  etiquette: "Etiquette",
  communication: "Communication",
  "daily-life": "Daily Life",
  travel: "Travel",
  dining: "Dining",
  bathing: "Onsen",
  sacred: "Shrines",
  work: "Work",
};

function isCulturalTipItem(item: LessonItem): boolean {
  return !!item.content?.isCulturalTip;
}

function isScriptIntroItem(item: LessonItem): boolean {
  return !!item.content?.isScriptIntro;
}

function isConversationItem(item: LessonItem): boolean {
  return !!item.content?.isConversation;
}

/**
 * A rehearsal card: the situation, then what you would say. The other exercise
 * types a conversation item can be dealt (say-it-back, listening) are handled
 * by the player's existing cards, which read the `say` line lifted to the top
 * of the content object by the lesson API.
 */
function isConversationScenario(item: LessonItem): boolean {
  return isConversationItem(item) && item.exerciseType === "SCENARIO";
}

function isNumbersItem(item: LessonItem): boolean {
  return !!item.content?.isNumbers;
}

/** The teaching card: the situation, the table of figures, the line to say. */
function isNumbersScenario(item: LessonItem): boolean {
  return isNumbersItem(item) && item.exerciseType === "SCENARIO";
}

/**
 * The figure quiz: a printed number on one side, four readings on the other.
 * Falls back to false when the server could not build a question, so the card
 * becomes an ordinary reveal rather than a choice with one option.
 */
function isNumbersQuiz(item: LessonItem): boolean {
  return (
    isNumbersItem(item) &&
    item.exerciseType === "MULTIPLE_CHOICE" &&
    (item.content?.quiz?.choices.length ?? 0) > 1
  );
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
  const { active: silent } = useSilentMode();
  const dims = size === "lg" ? "w-16 h-16" : size === "md" ? "w-12 h-12" : "w-9 h-9";
  const icon = size === "lg" ? "w-6 h-6" : size === "md" ? "w-5 h-5" : "w-4 h-4";
  // A play button that plays nothing is worse than no play button: it reads as
  // broken audio rather than as a mute the learner switched on themselves.
  if (silent) return null;
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
          : "pressable-sm text-on-light",
        // 36px still reads under the thumb as small, so the compact size keeps its
        // look and grows the tap area to 44px with an invisible overlay.
        size === "sm" &&
          "before:absolute before:left-1/2 before:top-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:h-11 before:w-11 before:content-['']",
        dims
      )}
      style={
        size === "sm"
          ? undefined
          : { background: "hsl(var(--sky))", ["--shade" as string]: "var(--sky-deep)" }
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
  if (isE2J(item) || isListening(item) || isFillInBlank(item)) return false;
  if (item.contentType !== "HIRAGANA" && item.contentType !== "KATAKANA" && item.contentType !== "KANJI") return false;
  if (!item.content?.mnemonicHint) return false;
  return (item.review?.incorrectCount ?? 0) > 0;
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

/** Fisher-Yates, so every ordering is equally likely. */
function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
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

function isFillInBlank(item: LessonItem) {
  return item.exerciseType === "FILL_IN_BLANK";
}

/* Two of the exercise types cannot be answered without sound: a listening card
   is nothing but audio, and a say-it-back card is graded by microphone. With
   silent mode on they are asked another way rather than dropped — dropping
   them would quietly shorten the lesson and leave those words unstudied, and
   the learner would never know which ones they missed.

   The substitutes keep the same recall direction the sound version had.
   Listening is meaning-from-Japanese, so it becomes the written form of that
   question; saying a word back is production, so it becomes the prompt that
   asks for the Japanese. Both still count for the same review. */
const SILENT_SUBSTITUTES: Record<string, string> = {
  LISTENING: "JAPANESE_TO_ENGLISH",
  SPEAKING: "ENGLISH_TO_JAPANESE",
};

function askInSilence(item: LessonItem): LessonItem {
  const substitute = SILENT_SUBSTITUTES[item.exerciseType];
  return substitute ? { ...item, exerciseType: substitute } : item;
}

// Audio always plays the kana reading, never the kanji — see lib/speech.
function getSpeechText(item: LessonItem): string {
  return speechText(item.contentType, item.content);
}

/** The typed-answer input for a "type the romaji" card. Its own tiny form so
 * Enter submits without needing the Check button below the card. */
function RomajiInputForm({
  value,
  onChange,
  onSubmit,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="w-full flex justify-center"
    >
      <input
        autoFocus
        type="text"
        inputMode="text"
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="type the romaji…"
        className={cn(
          "w-full max-w-[16rem] h-12 px-4 rounded-tile text-center text-[17px] font-medium",
          "bg-ink-deep border border-line text-text placeholder:text-text-subtle/60",
          "transition-colors duration-150",
          "hover:border-line-strong focus:border-coral focus:outline-none"
        )}
      />
    </form>
  );
}

/** Correct/incorrect readout shown above the revealed answer on a typed card. */
function RomajiResultBanner({ correct }: { correct: boolean }) {
  return (
    <p
      className="font-display text-[13px] font-bold uppercase tracking-[0.1em]"
      style={{ color: `hsl(${correct ? "var(--lime)" : "var(--rose)"})` }}
    >
      {correct ? "Correct" : "Not quite"}
    </p>
  );
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

  // A figure quiz is answered from the printed number alone — the form it is
  // actually met in, on a tag, a lift panel or a departure board.
  if (isNumbersQuiz(item)) {
    return (
      <span
        className="font-display text-[3.25rem] leading-none font-extrabold tnum tracking-tight text-center"
        style={{ color: "hsl(var(--track-numbers))" }}
      >
        {content.quiz!.figure}
      </span>
    );
  }

  if (isListening(item)) {
    const text = getSpeechText(item);
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="text-[14px] text-text-muted font-medium">Listen and identify</p>
        <button
          onClick={() => speak(text)}
          className="w-20 h-20 rounded-full grid place-items-center pressable text-on-light"
          style={{ background: "hsl(var(--sky))", ["--shade" as string]: "var(--sky-deep)" }}
          aria-label="Play audio"
        >
          <Volume2 className="w-8 h-8" strokeWidth={2.5} />
        </button>
        <p className="text-[13px] text-text-subtle font-medium">Tap to replay</p>
      </div>
    );
  }

  if (isE2J(item) || isFillInBlank(item)) {
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
    // A kana-only word repeats the same text below itself, so the reading
    // line only earns its place when it actually adds information.
    const showKana = !!content.kana && content.kana !== content.japanese;
    return (
      <div className="flex flex-col items-center gap-2">
        <span className="jp text-[3.5rem] leading-none font-bold">{content.japanese}</span>
        {showKana && <span className="jp text-xl text-text-muted font-medium">{content.kana}</span>}
        {content.romaji && (
          <span className="text-sm text-text-subtle font-medium tracking-wide">{content.romaji}</span>
        )}
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

  // A listening card's prompt is audio alone, so its answer has to show the
  // word in writing as well as in English — otherwise the learner never finds
  // out what they were listening to.
  if (isListening(item)) {
    const japanese = content.japanese ?? content.character ?? "";
    // Whole lines rather than single words — set smaller so they don't wrap
    // into a wall. A conversation card's Japanese is a whole line too.
    const isPhrase =
      contentType === "PHRASE" || contentType === "CONVERSATION" || contentType === "NUMBERS";
    return (
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex items-center gap-2.5">
          <p className={cn("jp font-bold leading-snug", isPhrase ? "text-2xl" : "text-[2.5rem] leading-none")}>
            {japanese}
          </p>
          {speechTextForItem && <AudioButton text={speechTextForItem} size="md" />}
        </div>
        {content.kana && content.kana !== japanese && (
          <p className="jp text-base text-text-muted">{content.kana}</p>
        )}
        {content.romaji && <p className="text-[13px] text-text-subtle">{content.romaji}</p>}
        <p className="font-display text-xl font-extrabold tracking-tight mt-0.5">{content.english}</p>
      </div>
    );
  }

  if (isE2J(item) || isFillInBlank(item)) {
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
    if (contentType === "PHRASE" || contentType === "CONVERSATION") {
      return (
        <div className="flex flex-col items-center gap-2.5 text-center">
          <div className="flex items-center gap-2.5">
            <p className="jp text-2xl font-bold leading-snug">{content.japanese}</p>
            {content.kana && <AudioButton text={readingSpeechText(speechReading(content.japanese, content.kana))} size="md" />}
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
            <div className="flex flex-wrap items-center justify-center gap-2">
              {readings.map((r) => (
                <SpeakChip key={`${r.label}-${r.kana}`} text={readingSpeechText(r.kana)}>
                  <span className="jp text-[15px] text-text">{r.kana}</span>
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
          <div className="w-full space-y-2 pt-1">
            <DetailLabel>Common words</DetailLabel>
            <div className="flex flex-col items-center gap-1.5">
              {exampleWords.map((w, i) => (
                <SpeakChip key={i} text={w.reading || w.word || ""} className="text-[13px]">
                  <span className="jp text-text">{w.word}</span>
                  {w.meaning && <span className="text-text-muted">{w.meaning}</span>}
                </SpeakChip>
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
      <div className="flex items-center justify-between gap-3">
        <Masthead kicker={`Japan tip · ${category}`} tone="var(--sun)" />
        <MasteryPips review={item.review} />
      </div>
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

/** One line of a dialogue: the Japanese, its romaji, its meaning, and audio. */
function DialogueLine({
  line,
  tone,
  emphasis = false,
  hideEnglish = false,
}: {
  line: ConversationLine;
  tone: string;
  emphasis?: boolean;
  /** Withhold the meaning, for a line the learner is being asked to decode. */
  hideEnglish?: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5 w-full">
      <span
        className="w-1 self-stretch rounded-full shrink-0 mt-0.5"
        style={{ background: `hsl(${tone})` }}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <p
            className={cn(
              "jp font-bold leading-snug flex-1 min-w-0",
              emphasis ? "text-[1.6rem]" : "text-[17px]"
            )}
          >
            {line.japanese}
          </p>
          <AudioButton text={readingSpeechText(speechReading(line.japanese, line.kana))} size={emphasis ? "md" : "sm"} />
        </div>
        <p className={cn("text-text-subtle mt-0.5", emphasis ? "text-[14px]" : "text-[12px]")}>
          {line.romaji}
        </p>
        {!hideEnglish && (
          <p
            className={cn(
              "text-text-muted font-medium mt-1",
              emphasis ? "text-[15px]" : "text-[13px]"
            )}
          >
            {line.english}
          </p>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Conversation rehearsals.

   The question side puts the learner in the moment and stops there — being
   asked "what would you say?" before the answer exists is the whole exercise,
   and it is what makes the line available when the counter is real rather than
   only recognisable on a card.

   The answer side is laid out in the order a real exchange arrives: your line,
   then what comes back at you, then how to answer that, then the frame the
   line came from, then the one thing worth knowing about the situation.
   --------------------------------------------------------------------------- */

function ConversationQuestion({ item }: { item: LessonItem }) {
  const { content } = item;
  if (!content) return null;
  const scene = SCENE_LABELS[content.scene as ConversationScene] ?? "Conversation";
  const opener = content.theySpeakFirst ? content.hear?.[0] : undefined;

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center justify-between gap-3">
        <Masthead kicker={`Out loud · ${scene}`} tone="var(--track-conversation)" />
        <MasteryPips review={item.review} />
      </div>

      {content.canDo && (
        <p
          className="font-display text-[11px] font-bold uppercase tracking-[0.12em]"
          style={{ color: "hsl(var(--track-conversation))" }}
        >
          {content.canDo}
        </p>
      )}

      <p className="text-[16px] leading-relaxed text-text-muted font-medium">
        {content.situation}
      </p>

      {/* When they speak first, their line is the prompt. Its meaning is
          withheld here on purpose: working out what was asked is half of what
          strands a traveller, and the answer side hands it over a tap later. */}
      {opener && (
        <div className="rounded-tile bg-surface-raised p-3.5">
          <DetailLabel>They say</DetailLabel>
          <div className="mt-2.5">
            <DialogueLine line={opener} tone="var(--sky)" hideEnglish />
          </div>
        </div>
      )}

      <p className="font-display font-extrabold text-[19px] tracking-tight">
        {content.theySpeakFirst ? "What do you say back?" : "What do you say?"}
      </p>
    </div>
  );
}

function ConversationAnswer({ item }: { item: LessonItem }) {
  const { content } = item;
  if (!content?.say) return null;
  const hear = content.hear ?? [];
  const reply = content.reply ?? [];

  return (
    <div className="flex flex-col gap-5 w-full animate-fade">
      <div>
        <DetailLabel>You say</DetailLabel>
        <div className="mt-2.5">
          <DialogueLine line={content.say} tone="var(--track-conversation)" emphasis />
        </div>
      </div>

      {hear.length > 0 && (
        <div>
          <DetailLabel>{hear.length > 1 ? "You might hear" : "You'll hear"}</DetailLabel>
          <div className="mt-2.5 flex flex-col gap-3">
            {hear.map((line, i) => (
              <DialogueLine key={i} line={line} tone="var(--sky)" />
            ))}
          </div>
        </div>
      )}

      {reply.length > 0 && (
        <div>
          <DetailLabel>Then you can say</DetailLabel>
          <div className="mt-2.5 flex flex-col gap-3">
            {reply.map((line, i) => (
              <DialogueLine key={i} line={line} tone="var(--track-conversation)" />
            ))}
          </div>
        </div>
      )}

      {content.pattern && (
        <div className="rounded-tile bg-surface-raised p-3.5">
          <DetailLabel>The pattern</DetailLabel>
          <p className="jp text-[17px] font-bold mt-2">{content.pattern.frame}</p>
          <p className="text-[13px] text-text-subtle mt-0.5">{content.pattern.gloss}</p>
          <ul className="mt-3 flex flex-col gap-2">
            {content.pattern.swaps.map((swap, i) => (
              <li key={i} className="flex flex-col">
                <span className="jp text-[15px] font-medium">{swap.japanese}</span>
                <span className="text-[12px] text-text-subtle">{swap.english}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {content.tip && (
        <p className="text-[14px] text-text-muted leading-relaxed">{content.tip}</p>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Numbers & money.

   The teaching card is laid out the way the moment arrives: the situation, the
   table of figures as they are actually printed, the line you would say, what
   comes back, the frame underneath, and the trap at the bottom. The table is
   the part that makes this track different from the rest of the app — a number
   is only ever met as a figure on a tag or a screen, so the figure leads and
   the reading answers it.
   --------------------------------------------------------------------------- */

/** One row of the table: the printed figure, then how it is said. */
function ReadingRow({ reading }: { reading: NumberReading }) {
  return (
    <li className="flex items-center gap-3 py-2 border-b border-line last:border-0">
      <span
        className="font-display font-extrabold text-[17px] tnum tracking-tight shrink-0 min-w-[4.5rem]"
        style={{ color: "hsl(var(--track-numbers))" }}
      >
        {reading.figure}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 flex-wrap">
          <span className="jp text-[16px] font-bold leading-snug">{reading.japanese}</span>
          {reading.irregular && (
            <span
              className="font-display text-[9px] font-bold uppercase tracking-[0.1em] rounded-full px-1.5 py-0.5"
              style={{ background: "hsl(var(--sun) / 0.18)", color: "hsl(var(--sun))" }}
              title="An irregular sound change — this is where the pattern breaks"
            >
              Irregular
            </span>
          )}
        </span>
        <span className="block text-[12px] text-text-subtle leading-snug">{reading.romaji}</span>
        <span className="block text-[12px] text-text-muted font-medium leading-snug mt-0.5">
          {reading.english}
        </span>
      </span>
      <AudioButton text={readingSpeechText(reading.kana)} />
    </li>
  );
}

function NumbersQuestion({ item }: { item: LessonItem }) {
  const { content } = item;
  if (!content) return null;
  const scene = NUMBER_SCENE_LABELS[content.scene as NumberScene] ?? "Numbers";

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center justify-between gap-3">
        <Masthead kicker={`Numbers · ${scene}`} tone="var(--track-numbers)" />
        <MasteryPips review={item.review} />
      </div>

      {content.canDo && (
        <p
          className="font-display text-[11px] font-bold uppercase tracking-[0.12em]"
          style={{ color: "hsl(var(--track-numbers))" }}
        >
          {content.canDo}
        </p>
      )}

      <p className="text-[16px] leading-relaxed text-text-muted font-medium">
        {content.situation}
      </p>

      <p className="font-display font-extrabold text-[19px] tracking-tight">
        How do you say these?
      </p>

      {/* The figures without their readings: the question is whether the
          learner can produce them, so the answer side is what fills them in. */}
      <div className="flex flex-wrap gap-2">
        {(content.readings ?? []).map((r, i) => (
          <span
            key={i}
            className="font-display font-extrabold text-[17px] tnum rounded-tile px-3 py-1.5"
            style={{
              background: "hsl(var(--track-numbers) / 0.14)",
              color: "hsl(var(--track-numbers))",
            }}
          >
            {r.figure}
          </span>
        ))}
      </div>
    </div>
  );
}

function NumbersAnswer({ item }: { item: LessonItem }) {
  const { content } = item;
  if (!content) return null;
  const hear = content.hear ?? [];
  const reply = content.reply ?? [];

  return (
    <div className="flex flex-col gap-5 w-full animate-fade">
      <div>
        <DetailLabel>How they read</DetailLabel>
        <ul className="mt-1.5">
          {(content.readings ?? []).map((r, i) => (
            <ReadingRow key={i} reading={r} />
          ))}
        </ul>
      </div>

      {content.say && (
        <div>
          <DetailLabel>You say</DetailLabel>
          <div className="mt-2.5">
            <DialogueLine line={content.say} tone="var(--track-numbers)" emphasis />
          </div>
        </div>
      )}

      {hear.length > 0 && (
        <div>
          <DetailLabel>{hear.length > 1 ? "You might hear" : "You'll hear"}</DetailLabel>
          <div className="mt-2.5 flex flex-col gap-3">
            {hear.map((line, i) => (
              <DialogueLine key={i} line={line} tone="var(--sky)" />
            ))}
          </div>
        </div>
      )}

      {reply.length > 0 && (
        <div>
          <DetailLabel>Then you can say</DetailLabel>
          <div className="mt-2.5 flex flex-col gap-3">
            {reply.map((line, i) => (
              <DialogueLine key={i} line={line} tone="var(--track-numbers)" />
            ))}
          </div>
        </div>
      )}

      {content.pattern && (
        <div className="rounded-tile bg-surface-raised p-3.5">
          <DetailLabel>The pattern</DetailLabel>
          <p className="jp text-[17px] font-bold mt-2">{content.pattern.frame}</p>
          <p className="text-[13px] text-text-subtle mt-0.5">{content.pattern.gloss}</p>
          <ul className="mt-3 flex flex-col gap-2">
            {content.pattern.swaps.map((swap, i) => (
              <li key={i} className="flex flex-col">
                <span className="jp text-[15px] font-medium">{swap.japanese}</span>
                <span className="text-[12px] text-text-subtle">{swap.english}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {content.tip && (
        <p className="text-[14px] text-text-muted leading-relaxed">{content.tip}</p>
      )}
    </div>
  );
}

/**
 * The figure quiz's choice list. Each option carries its romaji as well as its
 * kana: the track is open from day one, before the alphabet is, and a question
 * the learner cannot read is not a question about numbers. It gives nothing
 * away — every option is a real reading, and which one matches the figure is
 * still the thing being asked.
 */
function NumbersQuizChoices({
  quiz,
  chosen,
  onPick,
}: {
  quiz: NumberQuiz;
  chosen: string | null;
  onPick: (kana: string) => void;
}) {
  return (
    <div className="space-y-2 shrink-0">
      {quiz.choices.map((choice) => {
        const isAnswer = choice.kana === quiz.answer.kana;
        const isSelected = chosen === choice.kana;

        let stateClass = "bg-surface border-line text-text hover:border-line-strong elevated";
        if (chosen) {
          if (isSelected && isAnswer) stateClass = "bg-lime border-lime text-on-light animate-pop";
          else if (isSelected) stateClass = "bg-rose border-rose text-on-dark animate-shake";
          else if (isAnswer) stateClass = "bg-lime/15 border-lime/50 text-lime";
          else stateClass = "bg-surface border-line text-text-subtle opacity-60";
        }

        return (
          <button
            key={choice.kana}
            disabled={!!chosen}
            className={cn(
              "w-full py-3.5 px-5 rounded-tile text-left border",
              "transition-colors duration-150 disabled:cursor-default",
              stateClass
            )}
            onClick={() => {
              if (chosen) return;
              onPick(choice.kana);
            }}
          >
            <span className="jp block text-[17px] font-bold leading-snug">{choice.japanese}</span>
            <span className="block text-[12px] opacity-75 leading-snug mt-0.5">{choice.romaji}</span>
          </button>
        );
      })}
    </div>
  );
}

function ScriptIntroCard({ item }: { item: LessonItem }) {
  const { content } = item;
  if (!content) return null;
  return (
    <div className="flex flex-col gap-3 w-full">
      <Masthead kicker={content.kicker ?? "Before you begin"} tone="var(--sky)" />
      <h3 className="text-xl">{content.title}</h3>
      <p className="text-[15px] text-text-muted leading-relaxed">{content.body}</p>
    </div>
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

  const { active: silent } = useSilentMode();

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
  const [romajiInput, setRomajiInput] = useState("");
  const [romajiCorrect, setRomajiCorrect] = useState<boolean | null>(null);
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
    setRomajiInput("");
    setRomajiCorrect(null);
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

  // Cards already put on screen in their written form. A silent window can
  // lapse mid-card, and a card that reshaped itself between the learner
  // reading it and answering it — the answer they had revealed swapped for a
  // play button they now have to listen to — would read as a glitch. Sound
  // comes back on the next card instead.
  const askedInWriting = useRef<Set<string>>(new Set());

  // Substituted here, at the single source the whole player reads from, so
  // every card, hint and control below follows without knowing about silence.
  const unansweredItems = useMemo(() => {
    const pending = lesson ? lesson.items.filter((item) => item.answeredAt === null) : [];
    if (silent) return pending.map(askInSilence);
    return pending.map((item) => (askedInWriting.current.has(item.id) ? askInSilence(item) : item));
  }, [lesson, silent]);
  const currentItem = unansweredItems[currentIndex] ?? null;

  useEffect(() => {
    if (silent && currentItem) askedInWriting.current.add(currentItem.id);
  }, [silent, currentItem]);
  const totalUnanswered = unansweredItems.length;

  const isListeningWord = currentItem
    ? isListening(currentItem) && (currentItem.contentType === "VOCABULARY" || currentItem.contentType === "PHRASE")
    : false;

  const isSpeakingItem = currentItem ? isSpeaking(currentItem) : false;
  const isFillInBlankItem = currentItem ? isFillInBlank(currentItem) : false;

  // Must stay above the loading/empty/results early returns below: those skip
  // the rest of the render, so calling a hook after them changes the hook count
  // between renders and React throws "rendered more hooks than expected".
  //
  // Distractors come from the rest of the lesson, so a lesson that happens to
  // carry only one translatable item can't fill a question. When that happens
  // this returns nothing and the card falls back to reveal-and-self-assess:
  // a "multiple choice" listing the single correct answer under the play
  // button gives the answer away before the learner has listened.
  const mcChoices: string[] = useMemo(() => {
    if (!isListeningWord || !currentItem || !lesson) return [];
    const correctAnswer = currentItem.content?.english ?? "";
    if (!correctAnswer) return [];
    const others = [
      ...new Set(
        lesson.items
          .filter((i) => i.id !== currentItem.id && i.content?.english && i.content.english !== correctAnswer)
          .map((i) => i.content!.english as string)
      ),
    ];
    const distractors = shuffle(others).slice(0, 3);
    if (distractors.length < 2) return [];
    return shuffle([...distractors, correctAnswer]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentItem?.id, isListeningWord]);

  const isListeningMC = mcChoices.length > 0;

  // Revealing a "Say it in Japanese" card plays the answer straight away. The
  // whole point of that card is what the word sounds like, so making the learner
  // reach for the speaker button every time puts a tap between them and the one
  // thing they are there to hear. The speaker button stays for replays.
  const revealSpeechText =
    revealed && !silent && currentItem && (isE2J(currentItem) || isFillInBlankItem)
      ? getSpeechText(currentItem)
      : "";
  useEffect(() => {
    if (!revealSpeechText) return;
    // A beat, so the answer is on screen before it is spoken.
    const t = setTimeout(() => speak(revealSpeechText), 120);
    return () => clearTimeout(t);
  }, [revealSpeechText]);

  function submitReview(item: LessonItem, quality: 1 | 5) {
    // Script intros are read-once explainers with nothing to remember.
    if (isScriptIntroItem(item)) return;
    // Conventions are always scored as CULTURE, including on lesson items
    // written before that content type existed and stored them as PHRASE.
    // Rehearsals score as CONVERSATION for the same reason: the content type
    // that owns the card, not whatever the item row happens to carry.
    const contentType = isCulturalTipItem(item)
      ? "CULTURE"
      : isConversationItem(item)
        ? "CONVERSATION"
        : isNumbersItem(item)
          ? "NUMBERS"
          : item.contentType;
    fetch("/api/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentType, contentId: item.contentId, quality, lessonItemId: item.id }),
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
      setRomajiInput("");
      setRomajiCorrect(null);
      setCombo((c) => (correct ? c + 1 : 0));
      submitReview(currentItem, correct ? 5 : 1);
      advanceAfterAnswer(correct);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentItem, lesson, correctCount, answeredCount, currentIndex, totalUnanswered]
  );

  // Graded the moment the learner submits, rather than trusted like a flip
  // card's self-assessment — the whole point of typing an answer is that it
  // can be checked. Reuses the same phonetic folding a spoken answer is judged
  // by, so a typo in vowel length or shi/si doesn't fail an answer that was
  // otherwise right.
  function checkFillInBlank() {
    if (!currentItem || romajiInput.trim().length === 0) return;
    const grade = gradePronunciation([romajiInput], {
      japanese: currentItem.content?.japanese,
      kana: currentItem.content?.kana,
      romaji: currentItem.content?.romaji,
    });
    setRomajiCorrect(grade.passed);
    setRevealed(true);
    if (grade.passed) {
      setTimeout(() => handleAnswer(true), 900);
    }
  }

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

  // Escape backs out to the leave-lesson confirmation, or closes it. This is
  // the only keyboard binding the lesson player keeps — reveal/answer is
  // touch-only, since the target is a mobile app rather than a desktop one.
  const canUseShortcuts = !loading && !finalResults;
  useEffect(() => {
    if (!canUseShortcuts) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (e.key !== "Escape") return;

      if (showDoneDialog) setShowDoneDialog(false);
      else setShowDoneDialog(true);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canUseShortcuts, showDoneDialog]);

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
            className="relative rounded-card overflow-hidden elevated text-on-light animate-pop-in"
            style={{ background: `hsl(${hue})` }}
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
                className="rounded-tile border border-line bg-surface elevated py-3.5 text-center"
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
  const isRehearsal = currentItem ? isConversationScenario(currentItem) : false;
  const isNumberCard = currentItem ? isNumbersScenario(currentItem) : false;
  const numberQuiz = currentItem && isNumbersQuiz(currentItem) ? currentItem.content!.quiz! : null;
  // All four are read-then-self-assess cards, so they share the reveal flow
  // below and differ only in what they put on the two faces.
  const isEditorial = isCultural || isScriptIntro || isRehearsal || isNumberCard;

  return (
    <div className="screen-fixed flex flex-col">
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
      <header className="shrink-0 z-30 top-chrome bg-ink/90 backdrop-blur-xl">
        <div className="max-w-md mx-auto h-16 px-4 flex items-center gap-3">
          <button
            onClick={() => setShowDoneDialog(true)}
            className="w-10 h-10 -ml-1 rounded-full grid place-items-center bg-surface border border-line text-text-muted hover:text-text hover:border-line-strong transition-colors shrink-0"
            aria-label="End session"
            title="End session (Esc)"
          >
            <X className="w-[18px] h-[18px]" strokeWidth={2.5} />
          </button>

          <div className="flex-1">
            <div className="h-3.5 rounded-full bg-surface-raised overflow-hidden">
              <div
                className="h-full rounded-full bg-lime sheen transition-[width] duration-500 ease-bounce"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <SilentModeButton />

          {combo >= 3 ? (
            <Chip hue="var(--sun)" className="shrink-0 animate-pop" key={combo}>
              <Flame className="w-3.5 h-3.5" strokeWidth={2.5} fill="currentColor" />
              <span className="tnum">{combo}</span>
            </Chip>
          ) : (
            <span className="font-display font-bold text-[14px] text-text-subtle tnum shrink-0 text-right">
              {currentIndex + 1}/{totalUnanswered}
            </span>
          )}
        </div>
      </header>

      <main className="flex-1 min-h-0 w-full max-w-md mx-auto px-4 pt-4 safe-bottom flex flex-col gap-4">
        {/* One keyed wrapper for the whole card group. Every card, hint and
            answer control for the current item lives inside this single subtree,
            so advancing swaps it out as one unit. Previously these were sibling
            nodes that each carried key={currentItem.id}; duplicate keys among
            siblings make React drop one of them from its reconciliation map, and
            the dropped card's DOM node is never removed — that is what left a
            previous character sitting above the current one. */}
        {currentItem && (
          <div key={currentItem.id} className="flex-1 min-h-0 w-full flex flex-col gap-4 animate-pop-in">
            {isEditorial ? (
              <>
                <CardScroller>
                  <Card className="p-6 flex flex-col justify-center min-h-[13rem]">
                    {isScriptIntro ? (
                      <ScriptIntroCard item={currentItem} />
                    ) : isRehearsal ? (
                      revealed ? (
                        <ConversationAnswer item={currentItem} />
                      ) : (
                        <ConversationQuestion item={currentItem} />
                      )
                    ) : isNumberCard ? (
                      revealed ? (
                        <NumbersAnswer item={currentItem} />
                      ) : (
                        <NumbersQuestion item={currentItem} />
                      )
                    ) : revealed ? (
                      <CulturalTipAnswer item={currentItem} />
                    ) : (
                      <CulturalTipQuestion item={currentItem} />
                    )}
                  </Card>
                </CardScroller>

                {isScriptIntro ? (
                  <button
                    onClick={() => handleAnswer(true)}
                    className={buttonStyles({ size: "lg", full: true, className: "shrink-0" })}
                    style={buttonVars("primary")}
                  >
                    Got it — let&apos;s start
                  </button>
                ) : !revealed ? (
                  <button
                    onClick={() => setRevealed(true)}
                    className={buttonStyles({ size: "lg", full: true, className: "shrink-0" })}
                    style={buttonVars("primary")}
                  >
                    Reveal
                  </button>
                ) : (
                  <div className="flex gap-2.5 shrink-0">
                    <button
                      onClick={() => handleAnswer(false)}
                      className={buttonStyles({ variant: "reject", size: "lg", full: true })}
                      style={buttonVars("reject")}
                    >
                      <RotateCcw className="w-[18px] h-[18px]" strokeWidth={2.5} />
                      Again
                    </button>
                    <button
                      onClick={() => handleAnswer(true)}
                      className={buttonStyles({ variant: "affirm", size: "lg", full: true })}
                      style={buttonVars("affirm")}
                    >
                      <Check className="w-[18px] h-[18px]" strokeWidth={3} />
                      Got it
                    </button>
                  </div>
                )}
              </>
            ) : isSpeakingItem ? (
              /* Say-it-back. The card owns its own controls end to end: there
                 is no reveal step and no self-assessment pair, because the
                 attempt itself is the answer. */
              <div className="flex-1 min-h-0 flex flex-col">
                <SpeakCard
                  prompt={{
                    japanese: currentItem.content?.japanese ?? currentItem.content?.character ?? "",
                    kana: currentItem.content?.kana,
                    romaji: currentItem.content?.romaji,
                    english: currentItem.content?.english,
                  }}
                  /* A word the learner has never got right is taught, then
                     repeated back; one they have answered before is prompted
                     from its meaning and has to be recalled. Keyed on the
                     tally rather than the mastery level, which no longer
                     falls back to "New" after a miss. */
                  teachFirst={(currentItem.review?.correctCount ?? 0) === 0}
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
                <CardScroller>
                <Card className="overflow-hidden">
                  <div className="px-4 h-12 flex items-center justify-between border-b border-line">
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
                      {numberQuiz
                        ? "How is this said?"
                        : isFillInBlankItem
                        ? "Type it in romaji"
                        : isE2J(currentItem)
                          ? silent
                            ? "How would you say this?"
                            : "Say it in Japanese"
                          : isListening(currentItem)
                            ? "What did you hear?"
                            : "What does this mean?"}
                    </p>
                    <CardFront item={currentItem} />
                  </div>

                  {!isListeningMC && !numberQuiz && (
                    <div className="border-t border-line p-6 flex items-center justify-center min-h-[7rem] bg-ink-deep/40">
                      {revealed ? (
                        <div className="w-full flex flex-col items-center gap-2 animate-pop-in">
                          {isFillInBlankItem && romajiCorrect !== null && (
                            <RomajiResultBanner correct={romajiCorrect} />
                          )}
                          <CardBack item={currentItem} />
                        </div>
                      ) : isFillInBlankItem ? (
                        <RomajiInputForm
                          value={romajiInput}
                          onChange={setRomajiInput}
                          onSubmit={checkFillInBlank}
                        />
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
                </CardScroller>

                {numberQuiz ? (
                  <>
                    <NumbersQuizChoices
                      quiz={numberQuiz}
                      chosen={mcChoice}
                      onPick={(kana) => {
                        const correct = kana === numberQuiz.answer.kana;
                        setMcChoice(kana);
                        setMcCorrect(correct);
                        if (correct) setTimeout(() => handleAnswer(true), 700);
                      }}
                    />
                    {mcChoice && !mcCorrect && (
                      <button
                        onClick={() => handleAnswer(false)}
                        className={buttonStyles({ variant: "secondary", full: true, size: "lg", className: "shrink-0" })}
                        style={buttonVars("secondary")}
                      >
                        Continue
                      </button>
                    )}
                  </>
                ) : isListeningMC ? (
                  <div className="space-y-2 shrink-0">
                    {mcChoices.map((choice) => {
                      const isCorrectAnswer = choice === (currentItem.content?.english ?? "");
                      const isSelected = mcChoice === choice;

                      let stateClass =
                        "bg-surface border-line text-text hover:border-line-strong elevated";
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
                            "w-full py-4 px-5 rounded-tile text-[15px] font-semibold text-left border",
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
                ) : isFillInBlankItem ? (
                  !revealed ? (
                    <button
                      onClick={checkFillInBlank}
                      disabled={romajiInput.trim().length === 0}
                      className={buttonStyles({ size: "lg", full: true, className: "shrink-0" })}
                      style={buttonVars("primary")}
                    >
                      Check
                    </button>
                  ) : (
                    !romajiCorrect && (
                      <button
                        onClick={() => handleAnswer(false)}
                        className={buttonStyles({ variant: "secondary", full: true, size: "lg", className: "shrink-0" })}
                        style={buttonVars("secondary")}
                      >
                        Continue
                      </button>
                    )
                  )
                ) : !revealed ? (
                  <button
                    onClick={() => setRevealed(true)}
                    className={buttonStyles({ size: "lg", full: true, className: "shrink-0" })}
                    style={buttonVars("primary")}
                  >
                    Reveal
                  </button>
                ) : (
                  <div className="flex gap-2.5 shrink-0">
                    <button
                      onClick={() => handleAnswer(false)}
                      className={buttonStyles({ variant: "reject", size: "lg", full: true })}
                      style={buttonVars("reject")}
                    >
                      <RotateCcw className="w-[18px] h-[18px]" strokeWidth={2.5} />
                      Again
                    </button>
                    <button
                      onClick={() => handleAnswer(true)}
                      className={buttonStyles({ variant: "affirm", size: "lg", full: true })}
                      style={buttonVars("affirm")}
                    >
                      <Check className="w-[18px] h-[18px]" strokeWidth={3} />
                      Got it
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
