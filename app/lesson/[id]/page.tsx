"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";

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
    exampleWords?: Record<string, string> | null;
    japanese?: string;
    kana?: string;
    english?: string;
    exampleSentenceJa?: string;
    exampleSentenceEn?: string;
    scenario?: string;
    isCulturalTip?: boolean;
    title?: string;
    body?: string;
    category?: string;
  } | null;
  review: {
    srsLevel: string;
    totalAttempts: number;
    correctCount: number;
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

// Pick Japanese voices once, with variety across gender/accent
let _jpVoices: SpeechSynthesisVoice[] = [];
function loadJpVoices() {
  if (typeof window === "undefined") return;
  const all = window.speechSynthesis.getVoices();
  const ja = all.filter((v) => v.lang.startsWith("ja"));
  _jpVoices = ja.length > 0 ? ja : [];
}
if (typeof window !== "undefined") {
  window.speechSynthesis.addEventListener("voiceschanged", loadJpVoices);
  loadJpVoices();
}

// Index advances per speak() call to cycle through available voices
let _voiceIdx = 0;

const SRS_DISPLAY: Record<string, { label: string; color: string }> = {
  NEW:      { label: "New",      color: "text-gray-500" },
  LEARNING: { label: "Learning", color: "text-blue-400" },
  FAMILIAR: { label: "Familiar", color: "text-yellow-400" },
  STRONG:   { label: "Strong",   color: "text-green-400" },
  MASTERED: { label: "Mastered", color: "text-purple-400" },
};

const CATEGORY_LABELS: Record<string, string> = {
  etiquette:      "Etiquette",
  communication:  "Communication",
  "daily-life":   "Daily Life",
  travel:         "Travel",
};

function isCulturalTipItem(item: LessonItem): boolean {
  return !!item.content?.isCulturalTip;
}

function speak(text: string, lang = "ja-JP") {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = 0.85;
  if (_jpVoices.length > 0) {
    // Cycle through available Japanese voices for variety
    u.voice = _jpVoices[_voiceIdx % _jpVoices.length];
    _voiceIdx++;
  }
  window.speechSynthesis.speak(u);
}

function AudioButton({ text, lang = "ja-JP", size = "sm" }: { text: string; lang?: string; size?: "sm" | "md" }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); speak(text, lang); }}
      className={`rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center justify-center ${size === "md" ? "w-10 h-10 text-xl" : "w-8 h-8 text-base"}`}
      title="Play pronunciation"
      type="button"
    >
      ▶
    </button>
  );
}

function MasteryBadge({ review }: { review: LessonItem["review"] }) {
  const level = review?.srsLevel ?? "NEW";
  const display = SRS_DISPLAY[level] ?? SRS_DISPLAY.NEW;
  return <span className={`text-xs ${display.color}`}>{display.label}</span>;
}

function isE2J(item: LessonItem) {
  return item.exerciseType === "ENGLISH_TO_JAPANESE";
}

function isListening(item: LessonItem) {
  return item.exerciseType === "LISTENING";
}

function getJapaneseText(item: LessonItem): string {
  const c = item.content;
  if (!c) return "";
  if (item.contentType === "HIRAGANA" || item.contentType === "KATAKANA" || item.contentType === "KANJI") {
    return c.character ?? "";
  }
  return c.japanese ?? c.kana ?? "";
}

function CardFront({ item }: { item: LessonItem }) {
  const { content, contentType } = item;
  if (!content) return <p className="text-gray-400">No content</p>;

  if (isListening(item)) {
    const text = getJapaneseText(item);
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="text-gray-400 text-sm">Listen and identify</div>
        <button
          onClick={() => speak(text)}
          className="w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 text-3xl flex items-center justify-center transition-colors"
        >
          ▶
        </button>
        <div className="text-gray-500 text-xs">Tap to play</div>
      </div>
    );
  }

  if (isE2J(item)) {
    return <span className="text-4xl font-bold text-white text-center">{content.english}</span>;
  }

  if (contentType === "HIRAGANA" || contentType === "KATAKANA" || contentType === "KANJI") {
    return <span className="jp-char text-8xl font-bold text-white">{content.character}</span>;
  }

  if (contentType === "VOCABULARY") {
    return (
      <div className="flex flex-col items-center gap-2">
        <span className="jp-char text-6xl font-bold text-white">{content.japanese}</span>
        <span className="jp-char text-2xl text-gray-300">{content.kana}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="jp-char text-3xl font-semibold text-white text-center">{content.japanese}</span>
    </div>
  );
}

function CardBack({ item }: { item: LessonItem }) {
  const { content, contentType } = item;
  if (!content) return null;

  const japText = getJapaneseText(item);

  if (isE2J(item)) {
    if (contentType === "VOCABULARY") {
      return (
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-2">
            <p className="jp-char text-4xl font-bold text-white">{content.japanese}</p>
            {content.japanese && <AudioButton text={content.japanese} />}
          </div>
          {content.kana && <p className="jp-char text-xl text-gray-300">{content.kana}</p>}
          {content.romaji && <p className="text-lg text-gray-400">{content.romaji}</p>}
        </div>
      );
    }
    if (contentType === "PHRASE") {
      return (
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-2">
            <p className="jp-char text-3xl font-semibold text-white">{content.japanese}</p>
            {content.japanese && <AudioButton text={content.japanese} />}
          </div>
          {content.kana && <p className="jp-char text-lg text-gray-300">{content.kana}</p>}
          {content.romaji && <p className="text-sm text-gray-500">{content.romaji}</p>}
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex items-center gap-2">
          <p className="jp-char text-6xl font-bold text-white">{content.character}</p>
          {content.character && <AudioButton text={content.character} />}
        </div>
        {content.romaji && <p className="text-xl text-gray-300">{content.romaji}</p>}
      </div>
    );
  }

  if (contentType === "HIRAGANA" || contentType === "KATAKANA") {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-2">
          <p className="text-2xl font-semibold text-gray-200">{content.romaji}</p>
          {japText && <AudioButton text={japText} />}
        </div>
        {content.mnemonicHint && (
          <p className="text-sm text-gray-500 text-center max-w-xs">{content.mnemonicHint}</p>
        )}
      </div>
    );
  }

  if (contentType === "KANJI") {
    const exampleWords = content.exampleWords as Record<string, string> | null | undefined;
    const allReadings = [
      ...(content.onyomi ?? []).map((r) => r.toLowerCase()),
      ...(content.kunyomi ?? []).map((r) => r.replace(/[-ー]/g, "").toLowerCase()),
    ].filter(Boolean).slice(0, 3);

    return (
      <div className="flex flex-col items-center gap-3 text-center max-w-xs">
        <div className="flex items-center gap-2">
          <p className="text-xl font-semibold text-white">{(content.meanings ?? []).join(" / ")}</p>
          {japText && <AudioButton text={japText} />}
        </div>
        {allReadings.length > 0 && (
          <p className="text-sm text-gray-400">
            Pronounced: <span className="text-gray-200">{allReadings.join(", ")}</span>
          </p>
        )}
        {exampleWords && Object.keys(exampleWords).length > 0 && (
          <div className="text-sm text-gray-500 space-y-1 mt-1">
            <p className="text-gray-600 text-xs uppercase tracking-wide">Common words</p>
            {Object.entries(exampleWords).slice(0, 3).map(([jp, en]) => (
              <div key={jp} className="flex items-center gap-2 justify-center">
                <span className="jp-char text-gray-300">{jp}</span>
                <span className="text-gray-500">·</span>
                <span className="text-gray-400">{en}</span>
              </div>
            ))}
          </div>
        )}
        {content.mnemonicHint && (
          <p className="text-xs text-gray-600 max-w-xs italic">{content.mnemonicHint}</p>
        )}
      </div>
    );
  }

  if (contentType === "VOCABULARY") {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-400">{content.romaji}</p>
          {japText && <AudioButton text={japText} />}
        </div>
        <p className="text-xl text-white font-medium">{content.english}</p>
        {content.exampleSentenceJa && (
          <div className="mt-1 text-sm text-gray-500 max-w-xs">
            <p className="jp-char">{content.exampleSentenceJa}</p>
            {content.exampleSentenceEn && <p className="mt-1 text-gray-600">{content.exampleSentenceEn}</p>}
          </div>
        )}
      </div>
    );
  }

  // PHRASE
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="flex items-center gap-2">
        <p className="text-sm text-gray-400">{content.romaji}</p>
        {japText && <AudioButton text={japText} />}
      </div>
      <p className="text-xl text-white font-medium">{content.english}</p>
      {content.scenario && (
        <p className="text-xs text-gray-600 italic">{content.scenario}</p>
      )}
    </div>
  );
}

function CulturalTipCard({ item }: { item: LessonItem }) {
  const { content } = item;
  if (!content) return null;
  const category = CATEGORY_LABELS[content.category ?? ""] ?? "Culture";
  return (
    <div className="flex flex-col gap-4 w-full">
      <p className="text-xs text-amber-600 uppercase tracking-widest font-medium">
        Japan Tip · {category}
      </p>
      <h3 className="text-xl font-semibold text-white">{content.title}</h3>
      <p className="text-gray-300 text-sm leading-relaxed">{content.body}</p>
    </div>
  );
}

function Spinner() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4">
      <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      <p className="text-gray-500 text-sm">Preparing lesson...</p>
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
  const startTime = useRef(Date.now());

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
    fetch(`/api/lesson/${id}`)
      .then((r) => r.json())
      .then((data: LessonResult) => {
        setLesson(data);
        const firstUnanswered = data.items.findIndex((item) => item.answeredAt === null);
        setCurrentIndex(firstUnanswered === -1 ? 0 : firstUnanswered);
        setLoading(false);
      });
  }, [id]);

  const unansweredItems = lesson ? lesson.items.filter((item) => item.answeredAt === null) : [];
  const currentItem = unansweredItems[currentIndex] ?? null;
  const totalUnanswered = unansweredItems.length;

  function submitReview(item: LessonItem, quality: 1 | 5) {
    if (isCulturalTipItem(item)) return;
    fetch("/api/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentType: item.contentType, contentId: item.contentId, quality, lessonItemId: item.id }),
    });
  }

  function handleAnswer(correct: boolean) {
    if (!currentItem || !lesson) return;
    submitReview(currentItem, correct ? 5 : 1);

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

  if (loading) return <Spinner />;

  if (!lesson || unansweredItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400 text-lg">No items found.</p>
      </div>
    );
  }

  if (finalResults) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-6 px-4">
        {installPrompt && (
          <div className="w-full max-w-sm bg-gray-900 border border-white/10 rounded-xl p-4 flex items-center justify-between gap-3 text-sm">
            <div>
              <div className="font-medium text-white">Install Nihongo Now</div>
              <div className="text-gray-500 text-xs mt-0.5">Add to your home screen for quick access</div>
            </div>
            <button
              onClick={() => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (installPrompt as any).prompt?.();
                setInstallPrompt(null);
              }}
              className="bg-white text-gray-950 text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0"
            >
              Install
            </button>
          </div>
        )}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-1">Lesson Complete</h1>
          <p className="text-gray-500 text-sm">Good work.</p>
        </div>
        <div className="bg-gray-900 border border-white/10 rounded-2xl p-8 flex flex-col items-center gap-4 w-full max-w-sm">
          <div className="text-center">
            <p className="text-5xl font-bold text-white">{finalResults.accuracy}%</p>
            <p className="text-gray-500 mt-1 text-sm">Accuracy</p>
          </div>
          <div className="flex gap-6 text-sm">
            <span className="text-green-400">{finalResults.correct} correct</span>
            <span className="text-red-400">{finalResults.total - finalResults.correct} incorrect</span>
          </div>
        </div>
        <a
          href="/dashboard"
          className="px-8 py-3 bg-white text-gray-950 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
        >
          Back to Dashboard
        </a>
      </div>
    );
  }

  const progressPct = totalUnanswered > 0 ? Math.round((currentIndex / totalUnanswered) * 100) : 0;
  const isCultural = currentItem ? isCulturalTipItem(currentItem) : false;

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center px-4 pt-10 pb-8 gap-4">
      {showDoneDialog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold text-white mb-2">Stop studying?</h2>
            <p className="text-gray-400 text-sm mb-6">
              Your progress has been saved. You can come back and continue any time.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDoneDialog(false)}
                className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm font-medium transition-colors"
              >
                Keep going
              </button>
              <button
                onClick={handleEarlyExit}
                className="flex-1 py-3 bg-white hover:bg-gray-100 text-gray-950 rounded-xl text-sm font-semibold transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-sm">
        <div className="flex justify-between items-center mb-2 text-xs text-gray-600">
          <span>{currentIndex + 1} / {totalUnanswered}</span>
          <div className="flex items-center gap-2">
            {currentItem && <MasteryBadge review={currentItem.review} />}
            <span className="capitalize">{currentItem?.contentType.toLowerCase()}</span>
          </div>
          <button
            onClick={() => setShowDoneDialog(true)}
            className="text-gray-600 hover:text-gray-400 transition-colors"
          >
            Done
          </button>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-1">
          <div
            className="bg-white h-1 rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {isCultural && currentItem ? (
        <>
          <div className="w-full max-w-sm bg-gray-900 border border-amber-900/30 rounded-2xl p-8 flex flex-col items-start justify-center gap-4 min-h-56">
            <CulturalTipCard item={currentItem} />
          </div>
          <div className="w-full max-w-sm">
            <button
              onClick={() => handleAnswer(true)}
              className="w-full py-4 bg-white hover:bg-gray-100 text-gray-950 rounded-xl font-semibold text-base transition-colors"
            >
              Got it
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="w-full max-w-sm bg-gray-900 border border-white/10 rounded-2xl p-10 flex flex-col items-center justify-center min-h-56 gap-4">
            {currentItem && <CardFront item={currentItem} />}
          </div>

          <div className="w-full max-w-sm bg-gray-900 border border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center min-h-32">
            {revealed && currentItem
              ? <CardBack item={currentItem} />
              : <span className="text-gray-800 text-sm select-none">─ ─ ─</span>
            }
          </div>

          <div className="flex gap-3 w-full max-w-sm">
            {!revealed ? (
              <button
                onClick={() => setRevealed(true)}
                className="flex-1 py-4 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium text-base transition-colors"
              >
                Reveal
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleAnswer(false)}
                  className="flex-1 py-4 bg-gray-900 hover:bg-gray-800 border border-red-900/50 text-red-400 rounded-xl font-medium text-base transition-colors"
                >
                  Again ✗
                </button>
                <button
                  onClick={() => handleAnswer(true)}
                  className="flex-1 py-4 bg-gray-900 hover:bg-gray-800 border border-green-900/50 text-green-400 rounded-xl font-medium text-base transition-colors"
                >
                  Got it ✓
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
