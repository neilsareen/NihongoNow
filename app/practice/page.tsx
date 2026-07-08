"use client";

import { useState } from "react";
import Link from "next/link";
import { ContentType } from "@prisma/client";
import { pickPrimaryKanjiReading } from "@/lib/utils";

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

function speak(text: string, lang = "ja-JP") {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = 0.9;
  window.speechSynthesis.speak(u);
}

function AudioButton({
  text,
  lang = "ja-JP",
  size = "sm",
}: {
  text: string;
  lang?: string;
  size?: "sm" | "md";
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        speak(text, lang);
      }}
      className={`rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center justify-center ${
        size === "md" ? "w-10 h-10 text-xl" : "w-8 h-8 text-base"
      }`}
      title="Play pronunciation"
      type="button"
    >
      ▶
    </button>
  );
}

function kanaToRomaji(kana: string): string {
  const clean = kana.replace(/-/g, "").replace(/ー/g, "");
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

function parseExampleWords(raw: unknown): ExampleWord[] {
  if (!raw) return [];
  try {
    const arr = Array.isArray(raw) ? raw : JSON.parse(raw as string);
    return arr.slice(0, 2) as ExampleWord[];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Selection view
// ---------------------------------------------------------------------------

type TypeKey = "HIRAGANA" | "KATAKANA" | "KANJI";

const TYPE_LABELS: Record<TypeKey, string> = {
  HIRAGANA: "Hiragana",
  KATAKANA: "Katakana",
  KANJI: "Kanji",
};

function SelectionView({
  onStart,
}: {
  onStart: (items: PracticeItem[]) => void;
}) {
  const [selected, setSelected] = useState<Set<TypeKey>>(new Set(["HIRAGANA"]));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(type: TypeKey) {
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
      const res = await fetch(`/api/practice?types=${types}`);
      if (!res.ok) throw new Error("Failed to load practice items");
      const data = await res.json();
      onStart(data.items as PracticeItem[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-gray-950/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1"
          >
            ← Dashboard
          </Link>
          <span className="text-sm font-medium text-white">Character Practice</span>
          <div className="w-20" />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-10 pb-12">
        <div className="bg-gray-900 border border-white/10 rounded-3xl p-6 space-y-6">
          <div className="text-center space-y-1">
            <div className="text-4xl mb-1">練習</div>
            <h1 className="font-display text-2xl font-bold">Character Practice</h1>
            <p className="text-gray-400 text-sm">Choose which characters to practice</p>
          </div>

          <div className="flex gap-3 justify-center">
            {(["HIRAGANA", "KATAKANA", "KANJI"] as TypeKey[]).map((type) => (
              <button
                key={type}
                onClick={() => toggle(type)}
                className={`flex-1 py-3 px-2 rounded-2xl border text-sm font-medium transition-all ${
                  selected.has(type)
                    ? "bg-sunset text-white border-transparent shadow-glow-warm scale-[1.02]"
                    : "bg-transparent text-gray-400 border-white/20 hover:border-white/40 hover:text-white"
                }`}
              >
                {TYPE_LABELS[type]}
              </button>
            ))}
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            onClick={startPractice}
            disabled={loading}
            className="w-full py-3 rounded-full bg-sunset text-white shadow-glow-warm font-display font-semibold text-sm hover:scale-[1.015] active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Loading…" : "Start Practice"}
          </button>
        </div>
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Practice view — flashcard
// ---------------------------------------------------------------------------

function PracticeView({
  items,
  onFinish,
}: {
  items: PracticeItem[];
  onFinish: (correct: number, total: number) => void;
}) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const item = items[index];
  const total = items.length;
  const isKanji = item.contentType === ContentType.KANJI;
  const exampleWords = parseExampleWords(item.exampleWords);

  function advance(wasCorrect: boolean) {
    const newCorrect = wasCorrect ? correctCount + 1 : correctCount;
    if (index + 1 >= total) {
      onFinish(newCorrect, total);
    } else {
      setCorrectCount(newCorrect);
      setIndex(index + 1);
      setFlipped(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-white/10 bg-gray-950/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1"
          >
            ← Dashboard
          </Link>
          <span className="text-sm text-gray-400">
            {index + 1} / {total}
          </span>
          <div className="w-20" />
        </div>
      </header>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-white/10">
        <div
          className="h-1.5 bg-sunset transition-all duration-300"
          style={{ width: `${((index + 1) / total) * 100}%` }}
        />
      </div>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 pt-8 pb-12 flex flex-col gap-6">
        {/* Flashcard */}
        <div
          key={index}
          onClick={() => !flipped && setFlipped(true)}
          className={`bg-gray-900 border border-white/10 rounded-3xl flex flex-col items-center justify-center gap-4 p-8 min-h-64 cursor-pointer select-none transition-all animate-pop-in ${
            flipped ? "cursor-default shadow-glow-warm border-orange-500/20" : "hover:border-white/25 active:scale-[0.99]"
          }`}
        >
          {/* Character */}
          <span
            className={`jp-char leading-none ${
              isKanji ? "text-7xl" : "text-8xl"
            }`}
          >
            {item.character}
          </span>

          {!flipped && (
            <p className="text-gray-500 text-xs mt-2">Tap to reveal</p>
          )}

          {/* Revealed content */}
          {flipped && (
            <div className="w-full space-y-3 mt-2">
              <div className="border-t border-white/10 pt-4 space-y-3">
                {/* Audio button */}
                <div className="flex justify-center">
                  <AudioButton text={item.character} size="md" />
                </div>

                {isKanji ? (
                  // Kanji revealed content
                  <div className="space-y-3 text-center">
                    {item.meanings && item.meanings.length > 0 && (
                      <p className="text-white font-semibold text-lg">
                        {item.meanings.join(", ")}
                      </p>
                    )}
                    {(() => {
                      const primaryKana = pickPrimaryKanjiReading(
                        item.character,
                        item.onyomi ?? [],
                        item.kunyomi ?? []
                      );
                      const romaji = primaryKana ? kanaToRomaji(primaryKana) : "";
                      return primaryKana ? (
                        <div className="flex items-center justify-center gap-3">
                          <span className="text-gray-200 font-medium">{romaji}</span>
                          <span className="jp-char text-gray-400">{primaryKana}</span>
                        </div>
                      ) : null;
                    })()}
                    {exampleWords.length > 0 && (
                      <div className="pt-1 space-y-1">
                        {exampleWords.slice(0, 1).map((w, i) => (
                          <div key={i} className="flex items-center justify-center gap-2 text-sm">
                            <AudioButton text={w.word ?? ""} />
                            <span className="jp-char text-gray-300">{w.word}</span>
                            {w.meaning && (
                              <>
                                <span className="text-gray-500">·</span>
                                <span className="text-gray-400">{w.meaning}</span>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  // Hiragana/Katakana revealed content
                  <div className="space-y-2 text-center">
                    <p className="text-white font-semibold text-2xl tracking-wide">
                      {item.romaji}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action buttons — only visible after flip */}
        {flipped && (
          <div className="flex gap-3">
            <button
              onClick={() => advance(false)}
              className="flex-1 py-3 rounded-2xl border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-950/40 transition-colors active:scale-[0.98]"
            >
              Again ✗
            </button>
            <button
              onClick={() => advance(true)}
              className="flex-1 py-3 rounded-2xl bg-sunset text-white shadow-glow-warm text-sm font-display font-semibold hover:scale-[1.015] active:scale-[0.98] transition-transform"
            >
              Got it ✓
            </button>
          </div>
        )}

        {/* Progress label */}
        <p className="text-center text-gray-500 text-xs">
          {index + 1} of {total}
        </p>
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Summary view
// ---------------------------------------------------------------------------

function SummaryView({
  correct,
  total,
  onPracticeAgain,
}: {
  correct: number;
  total: number;
  onPracticeAgain: () => void;
}) {
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <header className="border-b border-white/10 bg-gray-950/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1"
          >
            ← Dashboard
          </Link>
          <span className="text-sm font-medium text-white">Results</span>
          <div className="w-20" />
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 pt-10 pb-12 flex flex-col items-center gap-6">
        <div className="text-5xl animate-bounce-soft">{accuracy >= 80 ? "🎉" : accuracy >= 50 ? "👍" : "💪"}</div>
        <div className="bg-gray-900 border border-white/10 rounded-3xl p-8 w-full text-center space-y-6 animate-pop-in">
          <div className="space-y-1">
            <p className="text-gray-400 text-sm">Session complete</p>
            <p className="font-display text-6xl font-bold text-sunset">{accuracy}%</p>
            <p className="text-gray-400 text-sm">accuracy</p>
          </div>

          <div className="flex justify-center gap-8 text-sm text-gray-400">
            <div className="text-center">
              <p className="text-white text-2xl font-display font-semibold">{correct}</p>
              <p>Correct</p>
            </div>
            <div className="text-center">
              <p className="text-white text-2xl font-display font-semibold">{total - correct}</p>
              <p>Missed</p>
            </div>
            <div className="text-center">
              <p className="text-white text-2xl font-display font-semibold">{total}</p>
              <p>Total</p>
            </div>
          </div>
        </div>

        <div className="w-full space-y-3">
          <button
            onClick={onPracticeAgain}
            className="w-full py-3 rounded-full bg-sunset text-white shadow-glow-warm font-display font-semibold text-sm hover:scale-[1.015] active:scale-[0.98] transition-transform"
          >
            Practice Again
          </button>
          <Link
            href="/dashboard"
            className="block w-full py-3 rounded-full border border-white/20 text-gray-300 text-sm font-medium hover:bg-white/5 transition-colors text-center"
          >
            Back to Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Root page — state machine
// ---------------------------------------------------------------------------

type View = "selection" | "practice" | "summary";

export default function PracticePage() {
  const [view, setView] = useState<View>("selection");
  const [items, setItems] = useState<PracticeItem[]>([]);
  const [results, setResults] = useState<{ correct: number; total: number }>({
    correct: 0,
    total: 0,
  });

  function handleStart(fetchedItems: PracticeItem[]) {
    setItems(fetchedItems);
    setView("practice");
  }

  function handleFinish(correct: number, total: number) {
    setResults({ correct, total });
    setView("summary");
  }

  function handlePracticeAgain() {
    setView("selection");
    setItems([]);
  }

  if (view === "practice" && items.length > 0) {
    return <PracticeView items={items} onFinish={handleFinish} />;
  }

  if (view === "summary") {
    return (
      <SummaryView
        correct={results.correct}
        total={results.total}
        onPracticeAgain={handlePracticeAgain}
      />
    );
  }

  return <SelectionView onStart={handleStart} />;
}
