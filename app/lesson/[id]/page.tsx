"use client";

import { useEffect, useState } from "react";
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
    japanese?: string;
    kana?: string;
    english?: string;
    exampleSentenceJa?: string;
    exampleSentenceEn?: string;
    scenario?: string;
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

function isE2J(item: LessonItem) {
  return item.exerciseType === "ENGLISH_TO_JAPANESE";
}

function CardFront({ item }: { item: LessonItem }) {
  const { content, contentType } = item;
  if (!content) return <p className="text-gray-400">No content</p>;

  if (isE2J(item)) {
    const english =
      contentType === "VOCABULARY" || contentType === "PHRASE"
        ? content.english
        : content.english;
    return (
      <span className="text-4xl font-bold text-white text-center">{english}</span>
    );
  }

  if (contentType === "HIRAGANA" || contentType === "KATAKANA" || contentType === "KANJI") {
    return (
      <span className="jp-char text-8xl font-bold text-white">{content.character}</span>
    );
  }

  if (contentType === "VOCABULARY") {
    return (
      <div className="flex flex-col items-center gap-2">
        <span className="jp-char text-6xl font-bold text-white">{content.japanese}</span>
        <span className="jp-char text-2xl text-purple-300">{content.kana}</span>
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

  if (isE2J(item)) {
    if (contentType === "VOCABULARY") {
      return (
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="jp-char text-4xl font-bold text-white">{content.japanese}</p>
          {content.kana && <p className="jp-char text-xl text-purple-300">{content.kana}</p>}
          {content.romaji && <p className="text-lg text-gray-300">{content.romaji}</p>}
        </div>
      );
    }
    if (contentType === "PHRASE") {
      return (
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="jp-char text-3xl font-semibold text-white">{content.japanese}</p>
          {content.kana && <p className="jp-char text-lg text-purple-300">{content.kana}</p>}
          {content.romaji && <p className="text-sm text-gray-400">{content.romaji}</p>}
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="jp-char text-6xl font-bold text-white">{content.character}</p>
        {content.romaji && <p className="text-xl text-purple-300">{content.romaji}</p>}
      </div>
    );
  }

  if (contentType === "HIRAGANA" || contentType === "KATAKANA") {
    return (
      <div className="flex flex-col items-center gap-3">
        <p className="text-2xl font-semibold text-purple-300">{content.romaji}</p>
        {content.mnemonicHint && (
          <p className="text-sm text-gray-400 text-center max-w-xs">{content.mnemonicHint}</p>
        )}
      </div>
    );
  }

  if (contentType === "KANJI") {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="text-xl font-semibold text-white">{(content.meanings ?? []).join(", ")}</p>
        {(content.onyomi ?? []).length > 0 && (
          <p className="text-sm text-purple-300">
            <span className="text-gray-400">On: </span>
            <span className="jp-char">{(content.onyomi ?? []).join("、")}</span>
          </p>
        )}
        {(content.kunyomi ?? []).length > 0 && (
          <p className="text-sm text-purple-300">
            <span className="text-gray-400">Kun: </span>
            <span className="jp-char">{(content.kunyomi ?? []).join("、")}</span>
          </p>
        )}
        {content.mnemonicHint && (
          <p className="text-sm text-gray-400 max-w-xs">{content.mnemonicHint}</p>
        )}
      </div>
    );
  }

  if (contentType === "VOCABULARY") {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="text-2xl font-semibold text-purple-300">{content.romaji}</p>
        <p className="text-xl text-white">{content.english}</p>
        {content.exampleSentenceJa && (
          <div className="mt-2 text-sm text-gray-400 max-w-xs">
            <p className="jp-char">{content.exampleSentenceJa}</p>
            {content.exampleSentenceEn && <p className="mt-1">{content.exampleSentenceEn}</p>}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <p className="text-xl font-semibold text-purple-300">{content.romaji}</p>
      <p className="text-xl text-white">{content.english}</p>
      {content.scenario && <p className="text-sm text-gray-400">{content.scenario}</p>}
    </div>
  );
}

function Spinner() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-400 text-lg">Preparing lesson...</p>
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

  const unansweredItems = lesson
    ? lesson.items.filter((item) => item.answeredAt === null)
    : [];

  const currentItem = unansweredItems[currentIndex] ?? null;
  const totalUnanswered = unansweredItems.length;

  function submitReview(item: LessonItem, quality: 1 | 5) {
    fetch("/api/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contentType: item.contentType,
        contentId: item.contentId,
        quality,
        lessonItemId: item.id,
      }),
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

      fetch(`/api/lesson/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completedAt: new Date().toISOString(),
          xpEarned: newCorrectCount * 10,
        }),
      });
    }
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
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-8 px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Lesson Complete!</h1>
          <p className="text-gray-400">Great work on today&apos;s session.</p>
        </div>
        <div className="bg-gray-900 rounded-2xl p-8 flex flex-col items-center gap-4 w-full max-w-sm">
          <div className="text-center">
            <p className="text-5xl font-bold text-purple-400">{finalResults.accuracy}%</p>
            <p className="text-gray-400 mt-1">Accuracy</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-semibold text-white">{finalResults.total}</p>
            <p className="text-gray-400">Items completed</p>
          </div>
          <div className="flex gap-4 text-sm">
            <span className="text-green-400">{finalResults.correct} correct</span>
            <span className="text-red-400">{finalResults.total - finalResults.correct} incorrect</span>
          </div>
        </div>
        <a
          href="/dashboard"
          className="mt-4 px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-colors"
        >
          Back to Dashboard
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center px-4 pt-12 pb-8 gap-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-between items-center mb-3 text-sm text-gray-500">
          <span>{currentIndex + 1} / {totalUnanswered}</span>
          <span className="capitalize text-purple-400">{currentItem?.contentType.toLowerCase()}</span>
          <a
            href="/dashboard"
            className="text-gray-500 hover:text-gray-300 transition-colors font-medium"
          >
            Exit
          </a>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-1">
          <div
            className="bg-purple-500 h-1 rounded-full transition-all"
            style={{ width: `${(currentIndex / totalUnanswered) * 100}%` }}
          />
        </div>
      </div>

      <div className="w-full max-w-sm bg-purple-900/40 border border-purple-800/50 rounded-2xl p-10 flex flex-col items-center justify-center min-h-56 gap-4">
        {currentItem && <CardFront item={currentItem} />}
      </div>

      <div className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-2xl p-8 flex flex-col items-center justify-center min-h-32">
        {revealed && currentItem
          ? <CardBack item={currentItem} />
          : <span className="text-gray-700 text-sm select-none">─ ─ ─</span>
        }
      </div>

      <div className="flex gap-4 w-full max-w-sm">
        {!revealed ? (
          <button
            onClick={() => setRevealed(true)}
            className="flex-1 py-4 bg-gray-800 hover:bg-gray-700 text-white rounded-2xl font-semibold text-lg transition-colors"
          >
            Tap to reveal
          </button>
        ) : (
          <>
            <button
              onClick={() => handleAnswer(false)}
              className="flex-1 py-4 bg-red-900/60 hover:bg-red-800/80 border border-red-700/50 text-red-300 rounded-2xl font-semibold text-lg transition-colors"
            >
              Need practice ✗
            </button>
            <button
              onClick={() => handleAnswer(true)}
              className="flex-1 py-4 bg-green-900/60 hover:bg-green-800/80 border border-green-700/50 text-green-300 rounded-2xl font-semibold text-lg transition-colors"
            >
              Got it ✓
            </button>
          </>
        )}
      </div>
    </div>
  );
}
