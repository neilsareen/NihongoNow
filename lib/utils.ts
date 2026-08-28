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

// Selectable profile avatars: a flat cartoon of something Japanese on a
// saturated colour plate. The drawings live in app/components/avatar-art.tsx,
// keyed by `key`; this table is the data half, so the API routes can validate
// a selection without pulling JSX into a server route.
//
// `key` is what lands in UserProfile.avatarUrl, so a key is a stored value and
// renaming one orphans every profile holding it — retire through
// LEGACY_AVATAR_KEYS below instead.
export const AVATAR_OPTIONS = [
  { key: "samurai",    label: "Samurai",     caption: "Warrior",        tone: "198 90% 62%" },
  { key: "ninja",      label: "Ninja",       caption: "Shadow",         tone: "46 98% 62%" },
  { key: "sumo",       label: "Sumo",        caption: "Wrestler",       tone: "152 66% 56%" },
  { key: "sushi",      label: "Sushi chef",  caption: "Itamae",         tone: "216 88% 70%" },
  { key: "kimono",     label: "Kimono",      caption: "Festivalgoer",   tone: "172 62% 54%" },
  { key: "taiko",      label: "Taiko",       caption: "Drummer",        tone: "268 78% 74%" },
  { key: "nigiri",     label: "Sushi",       caption: "Nigiri",         tone: "232 68% 74%" },
  { key: "shiba",      label: "Shiba Inu",   caption: "Good dog",       tone: "96 58% 60%" },
  { key: "maneki",     label: "Maneki-neko", caption: "Lucky cat",      tone: "330 88% 74%" },
  { key: "sakura",     label: "Sakura",      caption: "Cherry blossom", tone: "252 82% 78%" },
  { key: "shinkansen", label: "Shinkansen",  caption: "Bullet train",   tone: "6 84% 66%" },
  { key: "fuji",       label: "Mt Fuji",     caption: "The mountain",   tone: "40 94% 66%" },
  { key: "matcha",     label: "Matcha",      caption: "Green tea",      tone: "312 70% 74%" },
  { key: "koi",        label: "Koi",         caption: "Carp",           tone: "190 70% 66%" },
  { key: "torii",      label: "Torii",       caption: "Shrine gate",    tone: "128 48% 58%" },
] as const;

export type AvatarKey = (typeof AVATAR_OPTIONS)[number]["key"];

// Presets that have been retired: the kanji-glyph set this replaced had a few
// keys with no cartoon counterpart, and the odd character gets dropped later.
// Each maps to its nearest survivor so a learner who picked one keeps a
// comparable choice, rather than being silently reset to the first option.
const LEGACY_AVATAR_KEYS: Record<string, AvatarKey> = {
  dragon: "koi",      // auspicious creature
  fortune: "maneki",  // 福 — the lucky cat's whole job
  wa: "matcha",       // 和 — harmony, poured
  usagi: "shiba",     // the animal one
  neko: "maneki",     // still the cat
  student: "nigiri",  // the tile that stood here
};

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
  const key = (value && LEGACY_AVATAR_KEYS[value]) || value;
  const preset = AVATAR_OPTIONS.find((a) => a.key === key) ?? AVATAR_OPTIONS[0];
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

// UserProfile.displayName is only ever shown as a greeting ("こんにちは、Neil
// さん"), so it is one short name rather than a full identity. The cap is
// generous enough for a long given name and tight enough that the dashboard
// heading, which sits on one truncating line, still reads as a greeting.
export const MAX_DISPLAY_NAME_LENGTH = 40;

/**
 * Reduces whatever an identity provider hands us to the single name the
 * greeting can use. Google returns a full legal name, which is not always the
 * name someone goes by — this is only ever the starting point, and Settings
 * lets the learner write their own over it.
 */
export function toFirstName(value: string | null | undefined): string | null {
  const first = value?.trim().split(/\s+/)[0] ?? "";
  return first ? first.slice(0, MAX_DISPLAY_NAME_LENGTH) : null;
}
