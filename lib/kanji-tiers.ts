/* ===========================================================================
   Kanji tiers.
   ---------------------------------------------------------------------------
   Ikou teaches Japanese for getting around Japan and holding a conversation,
   and kanji is the part of that which most often turns a learner off before
   they can order lunch. So the whole corpus is not one undifferentiated pile
   of 漢字 to grind through: it is banded by how much a traveller actually
   needs it, and the learner picks how far down that list they care to go.

   Three bands, chosen by usefulness on the ground rather than by JLPT level.
   JLPT is an exam syllabus — it puts 耳 and 駅 on the same shelf because both
   are N5, which is exactly the flattening this is meant to undo.

     ESSENTIAL     You will meet these on a sign, a ticket machine, a menu or
                   a shop's opening hours on day one. Not reading 出口 or 東口
                   is the difference between catching a train and missing it.

     INTERMEDIATE  Common in ordinary writing and in compounds you will hear
                   spoken, but nothing breaks if you cannot read them yet.

     ADVANCED      Beyond what a traveller needs. Worth learning, in no hurry.

   The bands live here rather than in a database column for the same reason
   the phrases and conversations do: they are curriculum, they are edited by
   hand, and they should be reviewable in a diff.

   A kanji not named below is treated as ADVANCED — an unclassified character
   should never leak into the set of somebody who asked for essentials only.
   =========================================================================== */

export const KANJI_TIERS = ["ESSENTIAL", "INTERMEDIATE", "ADVANCED"] as const;

export type KanjiTier = (typeof KANJI_TIERS)[number];

/**
 * How deep into the tiers a learner has chosen to go. The value names the
 * deepest band they want, and every band above it is included — picking
 * INTERMEDIATE means essential *and* intermediate, not intermediate alone.
 * A learner who wants less kanji should never have to also give up the
 * characters that keep them out of trouble at a station.
 */
export type KanjiDepth = KanjiTier;

/** Signs, numbers, days, transport, money, food. The station-and-menu set. */
const ESSENTIAL = [
  // Days of the week, as they appear on opening hours and timetables.
  "日", "月", "火", "水", "木", "金", "土",
  // Numbers — prices, platforms, floors, portions.
  "一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "百", "千", "万",
  // Size and direction, on menus and on every set of station signage.
  "大", "中", "小", "上", "下",
  // 口 carries 出口 and 入口 on its own, which makes it the single most
  // valuable character on this list.
  "口",
  // Compass points: station exits are named 東口, 西口, 南口, 北口.
  "東", "西", "南", "北",
  // Getting there and paying for it.
  "駅", "電", "車", "店", "食",
  // 大人 on a ticket machine, 日本 on everything.
  "人", "本",
];

/** Everyday words and common compounds. Useful, never urgent. */
const INTERMEDIATE = [
  "年", "国", "語", "学", "校", "先", "生", "山", "川",
];

/**
 * Beyond a traveller's needs. Body parts sit here rather than in the bands
 * above because the one situation that calls for them — describing a symptom
 * to a doctor — is better served by the phrase track than by the character.
 */
const ADVANCED = ["手", "目", "耳", "足"];

const TIER_BY_CHARACTER: Record<string, KanjiTier> = {};
for (const c of ESSENTIAL) TIER_BY_CHARACTER[c] = "ESSENTIAL";
for (const c of INTERMEDIATE) TIER_BY_CHARACTER[c] = "INTERMEDIATE";
for (const c of ADVANCED) TIER_BY_CHARACTER[c] = "ADVANCED";

/** Which band a character sits in. Anything unclassified counts as advanced. */
export function kanjiTierOf(character: string): KanjiTier {
  return TIER_BY_CHARACTER[character] ?? "ADVANCED";
}

/** The bands included at a given depth, shallowest first. */
export function tiersUpTo(depth: KanjiDepth): KanjiTier[] {
  return KANJI_TIERS.slice(0, KANJI_TIERS.indexOf(depth) + 1);
}

/** Whether a character is in scope at a given depth. */
export function isKanjiInDepth(character: string, depth: KanjiDepth): boolean {
  return tiersUpTo(depth).includes(kanjiTierOf(character));
}

/**
 * The characters in scope at a given depth, or `null` for "no restriction".
 *
 * `null` rather than the full list at ADVANCED, because the advanced band is
 * open-ended: it holds every character not named above, including any added
 * to the corpus later. A query filtered on a finite list would silently miss
 * those; an absent filter cannot.
 */
export function charactersUpTo(depth: KanjiDepth): string[] | null {
  if (depth === "ADVANCED") return null;
  const tiers = tiersUpTo(depth);
  return Object.entries(TIER_BY_CHARACTER)
    .filter(([, tier]) => tiers.includes(tier))
    .map(([character]) => character);
}

/** How many classified characters sit in each band. */
export function tierSize(tier: KanjiTier): number {
  return Object.values(TIER_BY_CHARACTER).filter((t) => t === tier).length;
}

export const KANJI_TIER_COPY: Record<
  KanjiTier,
  { label: string; blurb: string; tone: string }
> = {
  ESSENTIAL: {
    label: "Essential",
    blurb: "Signs, numbers, days, trains and menus — the characters that keep you moving.",
    tone: "var(--track-kanji)",
  },
  INTERMEDIATE: {
    label: "Intermediate",
    blurb: "Common in everyday writing and in words you'll hear spoken.",
    tone: "var(--grape)",
  },
  ADVANCED: {
    label: "Advanced",
    blurb: "Everything else. Rewarding, and safe to leave until later.",
    tone: "var(--sky)",
  },
};

/** What choosing each depth actually commits the learner to. */
export const KANJI_DEPTH_COPY: Record<KanjiDepth, { label: string; blurb: string }> = {
  ESSENTIAL: {
    label: "Essential only",
    blurb: "Just the characters you need to read a sign or a menu. Everything else stays out of lessons and drills.",
  },
  INTERMEDIATE: {
    label: "Essential + intermediate",
    blurb: "The travel set, plus the characters behind everyday words.",
  },
  ADVANCED: {
    label: "Everything",
    blurb: "The full corpus, including characters a traveller will rarely need.",
  },
};
