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

// Midnight "today" in the given IANA timezone, as a UTC instant — used for
// day-boundary stats (e.g. "minutes studied today"). The server process's
// own local time is usually UTC, which is wrong for a user in any other
// timezone: their late-evening session can already fall after UTC midnight
// and get miscounted as "today" before their day has actually started.
export function getStartOfDayInTimezone(timeZone: string): Date {
  const now = new Date();
  let dateStr: string;
  try {
    dateStr = now.toLocaleDateString("en-CA", { timeZone });
  } catch {
    dateStr = now.toLocaleDateString("en-CA", { timeZone: "UTC" });
  }
  const guessUTC = new Date(`${dateStr}T00:00:00Z`);
  const tzWallClock = new Date(guessUTC.toLocaleString("en-US", { timeZone }));
  const utcWallClock = new Date(guessUTC.toLocaleString("en-US", { timeZone: "UTC" }));
  const offsetMs = tzWallClock.getTime() - utcWallClock.getTime();
  return new Date(guessUTC.getTime() - offsetMs);
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

// Selectable profile avatars — single kanji glyphs on a gradient background,
// stored by key in UserProfile.avatarUrl (an otherwise-unused legacy field).
export const AVATAR_OPTIONS = [
  { key: "samurai", char: "👹", label: "Samurai", from: "#f87171", to: "#b91c1c" },
  { key: "ninja",   char: "🥷", label: "Ninja",   from: "#818cf8", to: "#4338ca" },
  { key: "dragon",  char: "🐉", label: "Dragon",  from: "#34d399", to: "#047857" },
  { key: "sakura",  char: "🌸", label: "Sakura",  from: "#f9a8d4", to: "#db2777" },
  { key: "koi",     char: "🎏", label: "Koi",     from: "#fb923c", to: "#ea580c" },
  { key: "fuji",    char: "🗻", label: "Fuji",    from: "#38bdf8", to: "#0284c7" },
  { key: "kitsune", char: "🦊", label: "Kitsune", from: "#fbbf24", to: "#d97706" },
  { key: "neko",    char: "🐱", label: "Neko",    from: "#a78bfa", to: "#7c3aed" },
  { key: "fortune", char: "🧧", label: "Fortune", from: "#facc15", to: "#ca8a04" },
  { key: "wa",      char: "⛩️", label: "Wa",      from: "#4ade80", to: "#16a34a" },
] as const;

export type AvatarKey = (typeof AVATAR_OPTIONS)[number]["key"];

export function getAvatar(key: string | null | undefined) {
  return AVATAR_OPTIONS.find((a) => a.key === key) ?? AVATAR_OPTIONS[0];
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
