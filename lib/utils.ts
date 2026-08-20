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

// Selectable profile avatars, rendered as typographic kanji rather than
// illustrations: a single well-set glyph reads as a considered mark at every
// size, where the previous 3D cartoon PNGs pulled the whole interface toward
// looking like a game. Keys are unchanged — they are persisted in
// UserProfile.avatarUrl, so existing profiles keep their selection.
export const AVATAR_OPTIONS = [
  { key: "samurai", glyph: "侍", label: "Samurai", meaning: "Warrior",  tone: "232 66% 64%" },
  { key: "dragon",  glyph: "龍", label: "Dragon",  meaning: "Dragon",   tone: "268 46% 63%" },
  { key: "sakura",  glyph: "桜", label: "Sakura",  meaning: "Blossom",  tone: "342 48% 64%" },
  { key: "koi",     glyph: "鯉", label: "Koi",     meaning: "Carp",     tone: "14 62% 58%" },
  { key: "fuji",    glyph: "富", label: "Fuji",    meaning: "Abundance",tone: "205 55% 55%" },
  { key: "usagi",   glyph: "兎", label: "Usagi",   meaning: "Rabbit",   tone: "174 42% 50%" },
  { key: "neko",    glyph: "猫", label: "Neko",    meaning: "Cat",      tone: "36 58% 56%" },
  { key: "fortune", glyph: "福", label: "Fortune", meaning: "Fortune",  tone: "45 60% 55%" },
  { key: "wa",      glyph: "和", label: "Wa",      meaning: "Harmony",  tone: "152 40% 48%" },
  { key: "kimono",  glyph: "着", label: "Kimono",  meaning: "To wear",  tone: "290 40% 62%" },
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
