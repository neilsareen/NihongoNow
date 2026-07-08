import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

// Kanji whose most natural standalone reading is on'yomi: counting numbers,
// plus 本 which is overwhelmingly read as "hon" (book) rather than its
// kun'yomi "moto" (origin/root) when encountered on its own.
const ONYOMI_PRIMARY_KANJI = new Set([
  "一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "百", "千", "万", "本",
]);

// Picks the reading a learner would actually use when the kanji stands alone,
// e.g. 水 -> みず (kun) not すい (on, used in compounds like 水曜日).
// Kunyomi entries like "た-べる" or "おお-" are dictionary stems: a leading/
// trailing "-" means the entry isn't usable on its own, so those are skipped.
export function pickPrimaryKanjiReading(
  character: string,
  onyomi: string[] = [],
  kunyomi: string[] = []
): string {
  if (!ONYOMI_PRIMARY_KANJI.has(character)) {
    const cleanKun = kunyomi.find((k) => !k.startsWith("-") && !k.endsWith("-"));
    if (cleanKun) return cleanKun.replace(/-/g, "");
  }
  return (onyomi[0] ?? kunyomi[0] ?? "").replace(/-/g, "");
}

export function getXPForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

export function getLevelFromXP(xp: number): { level: number; progressPct: number } {
  let level = 1;
  let remaining = xp;
  let required = 100;

  while (remaining >= required) {
    remaining -= required;
    level++;
    required = Math.floor(100 * Math.pow(1.5, level - 1));
  }

  return { level, progressPct: Math.round((remaining / required) * 100) };
}
