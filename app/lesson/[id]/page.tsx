"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type ContentType = "HIRAGANA" | "KATAKANA" | "KANJI" | "VOCABULARY" | "PHRASE";

interface CharacterContent {
  character: string;
  romaji: string;
  mnemonicHint?: string;
}

interface VocabularyContent {
  japanese: string;
  kana: string;
  romaji: string;
  english: string;
  exampleSentenceJa?: string;
  exampleSentenceEn?: string;
}

interface KanjiContent {
  character: string;
  onyomi: string[];
  kunyomi: string[];
  meanings: string[];
  mnemonicHint?: string;
}

interface PhraseContent {
  japanese: string;
  kana: string;
  romaji: string;
  english: string;
  scenario?: string;
}

type Content = CharacterContent | VocabularyContent | KanjiContent | PhraseContent;

interface LessonItem {
  id: string;
  contentType: ContentType;
  contentId: string;
  displayOrder: number;
  content: Content | null;
}

interface LessonResult {
  id: string;
  items: LessonItem[];
}

function CardFront({ item }: { item: LessonItem }) {
  const { content, contentType } = item;
  if (!content) return <p className="text-gray-400">No content</p>;

  if (contentType === "HIRAGANA" || contentType === "KATAKANA" || contentType === "KANJI") {
    const c = content as CharacterContent | KanjiContent;
    return (
      <span className="jp-char text-8xl font-bold text-white">{c.character}</span>
    );
  }

  if (contentType === "VOCABULARY") {
    const v = content as VocabularyContent;
    return (
      <div className="flex flex-col items-center gap-2">
        <span className="jp-char text-6xl font-bold text-white">{v.japanese}</span>
        <span className="jp-char text-2xl text-purple-300">{v.kana}</span>
      </div>
    );
  }

  const p = content as PhraseContent;
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="jp-char text-3xl font-semibold text-white text-center">{p.japanese}</span>
    </div>
  );
}

function CardBack({ item }: { item: LessonItem }) {
  const { content, contentType } = item;
  if (!content) return null;

  if (contentType === "HIRAGANA" || contentType === "KATAKANA") {
    const c = content as CharacterContent;
    return (
      <div className="flex flex-col items-center gap-3">
        <p className="text-2xl font-semibold text-purple-300">{c.romaji}</p>
        {c.mnemonicHint && (
          <p className="text-sm text-gray-400 text-center max-w-xs">{c.mnemonicHint}</p>
        )}
      </div>
    );
  }

  if (contentType === "KANJI") {
    const k = content as KanjiContent;
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="text-xl font-semibold text-white">{k.meanings.join(", ")}</p>
        {k.onyomi.length > 0 && (
          <p className="text-sm text-purple-300">
            <span className="text-gray-400">On: </span>
            <span className="jp-char">{k.onyomi.join("、")}</span>
          </p>
        )}
        {k.kunyomi.length > 0 && (
          <p className="text-sm text-purple-300">
            <span className="text-gray-400">Kun: </span>
            <span className="jp-char">{k.kunyomi.join("、")}</span>
          </p>
        )}
        {k.mnemonicHint && (
          <p className="text-sm text-gray-400 max-w-xs">{k.mnemonicHint}</p>
        )}
      </div>
    );
  }

  if (contentType === "VOCABULARY") {
    const v = content as VocabularyContent;
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="text-2xl font-semibold text-purple-300">{v.romaji}</p>
        <p className="text-xl text-white">{v.english}</p>
        {v.exampleSentenceJa && (
          <div className="mt-2 text-sm text-gray-400 max-w-xs">
            <p className="jp-char">{v.exampleSentenceJa}</p>
            {v.exampleSentenceEn && <p className="mt-1">{v.exampleSentenceEn}</p>}
          </div>
        )}
      </div>
    );
  }

  const p = content as PhraseContent;
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <p className="text-xl font-semibold text-purple-300">{p.romaji}</p>
      <p className="text-xl text-white">{p.english}</p>
      {p.scenario && <p className="text-sm text-gray-400">{p.scenario}</p>}
    </div>
  );
}

export default function LessonPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [lesson, setLesson] = useState<LessonResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState<{ item: LessonItem; correct: boolean }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch(`/api/lesson/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setLesson(data);
        setLoading(false);
      });
  }, [id]);

  const currentItem = lesson?.items[currentIndex];

  function handleAnswer(correct: boolean) {
    if (!currentItem) return;
    const newResults = [...results, { item: currentItem, correct }];
    setResults(newResults);

    if (currentIndex + 1 < (lesson?.items.length ?? 0)) {
      setCurrentIndex((i) => i + 1);
      setRevealed(false);
    } else {
      setSubmitting(true);
      Promise.all(
        newResults.map(({ item, correct: c }) =>
          fetch("/api/review", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contentType: item.contentType,
              contentId: item.contentId,
              quality: c ? 5 : 1,
            }),
          })
        )
      ).finally(() => {
        setSubmitting(false);
        setDone(true);
      });
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400 text-lg">Loading lesson…</p>
      </div>
    );
  }

  if (!lesson || lesson.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400 text-lg">No items found.</p>
      </div>
    );
  }

  if (done || submitting) {
    const correct = results.filter((r) => r.correct).length;
    const total = results.length;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-8 px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Lesson Complete!</h1>
          <p className="text-gray-400">Great work on today&apos;s session.</p>
        </div>
        <div className="bg-gray-900 rounded-2xl p-8 flex flex-col items-center gap-4 w-full max-w-sm">
          <div className="text-center">
            <p className="text-5xl font-bold text-purple-400">{accuracy}%</p>
            <p className="text-gray-400 mt-1">Accuracy</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-semibold text-white">{total}</p>
            <p className="text-gray-400">Items completed</p>
          </div>
          <div className="flex gap-4 text-sm">
            <span className="text-green-400">{correct} correct</span>
            <span className="text-red-400">{total - correct} incorrect</span>
          </div>
        </div>
        {submitting && <p className="text-gray-500 text-sm">Saving results…</p>}
        <button
          onClick={() => router.push("/dashboard")}
          className="mt-4 px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 gap-8">
      <div className="w-full max-w-sm">
        <div className="flex justify-between items-center mb-4 text-sm text-gray-500">
          <span>{currentIndex + 1} / {lesson.items.length}</span>
          <span className="capitalize text-purple-400">{currentItem?.contentType.toLowerCase()}</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-1 mb-8">
          <div
            className="bg-purple-500 h-1 rounded-full transition-all"
            style={{ width: `${((currentIndex) / lesson.items.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="w-full max-w-sm bg-purple-900/40 border border-purple-800/50 rounded-2xl p-10 flex flex-col items-center justify-center min-h-56 gap-4">
        <CardFront item={currentItem!} />
      </div>

      {!revealed ? (
        <button
          onClick={() => setRevealed(true)}
          className="w-full max-w-sm py-4 bg-gray-800 hover:bg-gray-700 text-white rounded-2xl font-semibold text-lg transition-colors"
        >
          Tap to reveal
        </button>
      ) : (
        <>
          <div className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-2xl p-8 flex flex-col items-center justify-center min-h-32">
            <CardBack item={currentItem!} />
          </div>
          <div className="flex gap-4 w-full max-w-sm">
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
          </div>
        </>
      )}
    </div>
  );
}
