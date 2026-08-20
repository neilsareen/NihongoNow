"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ContentType } from "@prisma/client";
import { Check, Lightbulb, Lock, RotateCcw, Volume2 } from "lucide-react";
import { speak, speechText } from "@/lib/speech";
import { cn } from "@/lib/utils";
import { Card, TopBar, buttonStyles } from "@/app/components/ui";

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
      className={cn(
        "rounded-full border border-line bg-surface-raised text-text-muted shrink-0",
        "hover:text-text hover:border-line-strong transition-colors duration-150 ease-swift",
        "grid place-items-center active:translate-y-px",
        size === "md" ? "w-9 h-9" : "w-7 h-7"
      )}
      aria-label="Play pronunciation"
      title="Play pronunciation"
      type="button"
    >
      <Volume2 className={size === "md" ? "w-4 h-4" : "w-3.5 h-3.5"} strokeWidth={1.75} />
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

function katakanaToHiragana(str: string): string {
  return str.replace(/[ァ-ヶ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 96)).replace(/-/g, "");
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
    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text-subtle">
      {children}
    </p>
  );
}

function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="hidden sm:inline-grid place-items-center min-w-[1.15rem] h-[1.15rem] px-1 rounded border border-current/25 text-[10px] font-sans font-medium opacity-70">
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

function SelectionView({
  onStart,
}: {
  onStart: (items: PracticeItem[]) => void;
}) {
  const [selected, setSelected] = useState<Set<TypeKey>>(new Set(["HIRAGANA"]));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Assume locked until told otherwise, so kanji is never offered on a slow
  // or failed response.
  const [kanaMastered, setKanaMastered] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/progression")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("failed"))))
      .then((d) => {
        if (!cancelled) setKanaMastered(!!d.kanaMastered);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  function toggle(type: TypeKey) {
    if (type === "KANJI" && !kanaMastered) return;
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
    <div className="min-h-screen">
      <TopBar title="Practice" backLabel="Dashboard" />

      <main className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">Character practice</h1>
          <p className="text-sm text-text-muted leading-relaxed">
            Free-form flashcards. Nothing here affects your review schedule — use it
            to warm up or drill a script on its own.
          </p>
        </div>

        <fieldset className="space-y-2.5">
          <legend className="text-[11px] font-semibold uppercase tracking-[0.09em] text-text-subtle mb-2.5">
            Include
          </legend>
          {TYPES.map(({ key, label, glyph, tone }) => {
            const locked = key === "KANJI" && !kanaMastered;
            const isOn = selected.has(key);
            return (
              <button
                key={key}
                onClick={() => toggle(key)}
                disabled={locked}
                aria-pressed={isOn}
                title={locked ? "Master all hiragana and katakana to unlock kanji" : undefined}
                className={cn(
                  "w-full flex items-center gap-3 p-3.5 rounded-xl border text-left",
                  "transition-colors duration-150 ease-swift",
                  locked
                    ? "border-line bg-surface/50 cursor-not-allowed"
                    : isOn
                      ? "border-accent/45 bg-accent/[0.07]"
                      : "border-line bg-surface hover:border-line-strong"
                )}
              >
                <span
                  className="w-9 h-9 rounded-lg grid place-items-center shrink-0 border"
                  style={
                    locked
                      ? { background: "hsl(var(--surface-raised))", borderColor: "hsl(var(--line))" }
                      : {
                          background: `hsl(${tone} / 0.12)`,
                          borderColor: `hsl(${tone} / 0.28)`,
                          color: `hsl(${tone})`,
                        }
                  }
                >
                  {locked ? (
                    <Lock className="w-4 h-4 text-text-subtle" strokeWidth={1.75} />
                  ) : (
                    <span className="jp text-base font-medium leading-none">{glyph}</span>
                  )}
                </span>

                <span className="flex-1 min-w-0">
                  <span className={cn("block text-sm font-medium", locked && "text-text-subtle")}>
                    {label}
                  </span>
                  {locked && (
                    <span className="block text-xs text-text-subtle mt-0.5">
                      Unlocks once all kana is mastered
                    </span>
                  )}
                </span>

                {!locked && (
                  <span
                    className={cn(
                      "w-5 h-5 rounded-md border grid place-items-center shrink-0 transition-colors",
                      isOn ? "bg-accent border-accent text-accent-fg" : "border-line-strong"
                    )}
                  >
                    {isOn && <Check className="w-3 h-3" strokeWidth={3} />}
                  </span>
                )}
              </button>
            );
          })}
        </fieldset>

        {error && (
          <p className="text-[13px] text-danger" role="alert">{error}</p>
        )}

        <button
          onClick={startPractice}
          disabled={loading}
          className={buttonStyles({ size: "lg", full: true })}
        >
          {loading ? "Loading…" : "Start practice"}
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
        className={buttonStyles({ variant: "ghost", size: "sm", className: "text-warning hover:text-warning" })}
        title="Tap for a memory hook"
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

function LoadingView() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <div className="w-6 h-6 border-2 border-line-strong border-t-accent rounded-full animate-spin" />
      <p className="text-[13px] text-text-subtle">Loading…</p>
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
  const readings = isKanji ? kanjiReadings(item.onyomi, item.kunyomi) : [];

  const advance = useCallback(
    (wasCorrect: boolean) => {
      const newCorrect = wasCorrect ? correctCount + 1 : correctCount;
      if (index + 1 >= total) {
        onFinish(newCorrect, total);
      } else {
        setCorrectCount(newCorrect);
        setIndex(index + 1);
        setFlipped(false);
      }
    },
    [correctCount, index, total, onFinish]
  );

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
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 bg-canvas/85 backdrop-blur-xl border-b border-line">
        <div className="max-w-md mx-auto h-14 px-4 flex items-center justify-between gap-3">
          <Link
            href="/dashboard"
            className="text-[13px] text-text-muted hover:text-text transition-colors -ml-1 px-1 py-1 rounded"
          >
            ← Dashboard
          </Link>
          <span className="text-[11px] font-semibold uppercase tracking-[0.09em] text-text-subtle">
            Practice
          </span>
          <span className="text-[13px] text-text-muted tnum min-w-[3rem] text-right">
            {index + 1}/{total}
          </span>
        </div>
        <div className="h-px bg-line">
          <div
            className="h-px bg-accent transition-[width] duration-300 ease-swift"
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        </div>
      </header>

      <main className="flex-1 w-full max-w-md mx-auto px-4 py-6 flex flex-col gap-4">
        <div key={index} className="flex-1 w-full flex flex-col gap-4 animate-enter">
          <div className="flex-1 flex flex-col justify-center gap-4">
          <Card className="overflow-hidden">
            <div className="p-8 flex items-center justify-center min-h-[11rem]">
              <span className={cn("jp leading-none font-medium", isKanji ? "text-[5rem]" : "text-[5.5rem]")}>
                {item.character}
              </span>
            </div>

            <div className="border-t border-line p-6 flex items-center justify-center min-h-[7rem] bg-surface-sunken/40">
              {!flipped ? (
                <button
                  onClick={() => setFlipped(true)}
                  className="text-[13px] text-text-subtle hover:text-text-muted transition-colors"
                >
                  Answer hidden — tap Reveal
                </button>
              ) : (
                <div className="w-full flex flex-col items-center gap-4 animate-fade">
                  {isKanji ? (
                    <>
                      <div className="flex items-center gap-2.5">
                        {item.meanings && item.meanings.length > 0 && (
                          <p className="text-lg font-semibold tracking-tight">
                            {item.meanings.join(", ")}
                          </p>
                        )}
                        <AudioButton text={speechText(item.contentType, item)} size="md" />
                      </div>

                      {readings.length > 0 && (
                        <div className="w-full space-y-2 text-center">
                          <DetailLabel>Readings</DetailLabel>
                          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                            {readings.map((r) => (
                              <div key={`${r.label}-${r.kana}`} className="flex items-center gap-1.5">
                                <span className="jp text-[15px]">{r.kana}</span>
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
                        <div className="w-full space-y-2 text-center">
                          <DetailLabel>Common words</DetailLabel>
                          <div className="space-y-1.5">
                            {exampleWords.map((w, i) => (
                              <div key={i} className="flex items-center justify-center gap-2 text-[13px]">
                                <AudioButton text={w.reading || w.word || ""} />
                                <span className="jp">{w.word}</span>
                                {w.meaning && <span className="text-text-muted">{w.meaning}</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-2.5">
                      <p className="text-2xl font-semibold tracking-tight">{item.romaji}</p>
                      <AudioButton text={speechText(item.contentType, item)} size="md" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          {flipped && item.mnemonicHint && <MnemonicButton key={item.id} hint={item.mnemonicHint} />}
          </div>

          {!flipped ? (
            <button onClick={() => setFlipped(true)} className={buttonStyles({ size: "lg", full: true })}>
              Reveal
              <Key>space</Key>
            </button>
          ) : (
            <div className="flex gap-2.5">
              <button
                onClick={() => advance(false)}
                className={buttonStyles({ variant: "danger", size: "lg", full: true })}
              >
                <RotateCcw className="w-4 h-4" strokeWidth={1.75} />
                Again
                <Key>1</Key>
              </button>
              <button
                onClick={() => advance(true)}
                className={buttonStyles({ variant: "success", size: "lg", full: true })}
              >
                <Check className="w-4 h-4" strokeWidth={2} />
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
    <div className="min-h-screen flex flex-col">
      <TopBar title="Results" backLabel="Dashboard" />

      <main className="flex-1 max-w-md mx-auto w-full px-4 py-10 flex flex-col justify-center">
        <div className="space-y-6 animate-enter">
          <div className="text-center space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight">Session complete</h1>
            <p className="text-[13px] text-text-muted">
              {accuracy >= 80
                ? "That set is well in hand."
                : accuracy >= 50
                  ? "Coming along — another pass will help."
                  : "Worth running these again shortly."}
            </p>
          </div>

          <Card className="p-6 space-y-5">
            <div className="text-center">
              <p className="text-[3.25rem] leading-none font-semibold tracking-[-0.03em] tnum">
                {accuracy}
                <span className="text-2xl text-text-muted font-medium">%</span>
              </p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-text-subtle mt-2">
                Accuracy
              </p>
            </div>
            <div className="grid grid-cols-3 divide-x divide-line border-t border-line pt-4">
              {[
                { label: "Correct", value: correct, tone: "var(--success)" },
                { label: "Missed", value: total - correct, tone: "var(--danger)" },
                { label: "Total", value: total, tone: "var(--text)" },
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

          <div className="space-y-2.5">
            <button onClick={onPracticeAgain} className={buttonStyles({ size: "lg", full: true })}>
              Practice again
            </button>
            <Link href="/dashboard" className={buttonStyles({ variant: "secondary", size: "lg", full: true })}>
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
  const [results, setResults] = useState<{ correct: number; total: number }>({
    correct: 0,
    total: 0,
  });

  useEffect(() => {
    if (!autoType) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/practice?types=${autoType}`);
        if (!res.ok) throw new Error("Failed to load practice items");
        const data = await res.json();
        if (!cancelled) {
          setItems(data.items as PracticeItem[]);
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

  function handleFinish(correct: number, total: number) {
    setResults({ correct, total });
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

export default function PracticePage() {
  return (
    <Suspense fallback={<LoadingView />}>
      <PracticePageInner />
    </Suspense>
  );
}
