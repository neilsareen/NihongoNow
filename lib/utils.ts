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
// `at` picks the instant whose local day is wanted, defaulting to now — used
// by streak bookkeeping to find the start of some earlier day too.
export function getStartOfDayInTimezone(timeZone: string, at: Date = new Date()): Date {
  const now = at;
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

// Rolls a streak forward when a lesson completes at `completedAt`: unchanged
// if that's the same local day as the last completion, +1 if it's the very
// next local day, and reset to 1 if a day (or more) was missed or this is the
// first one. `longestStreak` rides along as the running max.
export function nextStreak(
  profile: { currentStreak: number; longestStreak: number; lastStudiedAt: Date | null },
  timeZone: string,
  completedAt: Date
): { currentStreak: number; longestStreak: number } {
  const todayStart = getStartOfDayInTimezone(timeZone, completedAt);
  const lastStart = profile.lastStudiedAt
    ? getStartOfDayInTimezone(timeZone, profile.lastStudiedAt)
    : null;
  const oneDayMs = 24 * 60 * 60 * 1000;

  const currentStreak = !lastStart
    ? 1
    : lastStart.getTime() === todayStart.getTime()
      ? Math.max(profile.currentStreak, 1)
      : lastStart.getTime() === todayStart.getTime() - oneDayMs
        ? profile.currentStreak + 1
        : 1;

  return { currentStreak, longestStreak: Math.max(profile.longestStreak, currentStreak) };
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

// Selectable profile avatars, rendered as a kanji on a saturated colour plate
// rather than as illustrations: a well-set glyph stays a considered mark at
// every size, where a cartoon turns to mud in a tab bar. Tones are bright
// enough to carry dark text on top. Keys are unchanged — they are persisted in
// UserProfile.avatarUrl, so existing profiles keep their selection.
export const AVATAR_OPTIONS = [
  { key: "samurai", glyph: "侍", label: "Samurai", meaning: "Warrior",   tone: "196 90% 60%" },
  { key: "dragon",  glyph: "龍", label: "Dragon",  meaning: "Dragon",    tone: "272 82% 72%" },
  { key: "sakura",  glyph: "桜", label: "Sakura",  meaning: "Blossom",   tone: "330 86% 72%" },
  { key: "koi",     glyph: "鯉", label: "Koi",     meaning: "Carp",      tone: "16 92% 64%" },
  { key: "fuji",    glyph: "富", label: "Fuji",    meaning: "Abundance", tone: "168 70% 55%" },
  { key: "usagi",   glyph: "兎", label: "Usagi",   meaning: "Rabbit",    tone: "82 78% 60%" },
  { key: "neko",    glyph: "猫", label: "Neko",    meaning: "Cat",       tone: "44 98% 62%" },
  { key: "fortune", glyph: "福", label: "Fortune", meaning: "Fortune",   tone: "352 85% 68%" },
  { key: "wa",      glyph: "和", label: "Wa",      meaning: "Harmony",   tone: "150 68% 55%" },
  { key: "kimono",  glyph: "着", label: "Kimono",  meaning: "To wear",   tone: "300 72% 70%" },
] as const;

export type AvatarKey = (typeof AVATAR_OPTIONS)[number]["key"];

export type ResolvedAvatar =
  | { type: "image"; url: string }
  | ({ type: "preset" } & (typeof AVATAR_OPTIONS)[number]);

// UserProfile.avatarUrl doubles as either a preset key ("samurai") or, once a
// learner uploads their own picture, an actual URL — a plain key never starts
// with a slash or a scheme, so the two are unambiguous.
function isImageUrl(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/");
}

export function getAvatar(value: string | null | undefined): ResolvedAvatar {
  if (value && isImageUrl(value)) return { type: "image", url: value };
  const preset = AVATAR_OPTIONS.find((a) => a.key === value) ?? AVATAR_OPTIONS[0];
  return { type: "preset", ...preset };
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
