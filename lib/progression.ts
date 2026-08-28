import { prisma } from "./prisma";
import { ContentType } from "@prisma/client";
import { findPhrasesByIds, getPhraseCandidates } from "./phrases";
import { pickPrimaryKanjiReading } from "./utils";
import { effectiveSrsLevel, srsRank, type SRSLevel } from "./srs";
import {
  KANJI_TIERS,
  charactersUpTo,
  isKanjiInDepth,
  kanjiTierOf,
  tiersUpTo,
  type KanjiDepth,
  type KanjiTier,
} from "./kanji-tiers";

export const KANA_TYPES: ContentType[] = [ContentType.HIRAGANA, ContentType.KATAKANA];

// Content with no Japanese reading to gate on. Kana is what the gate is built
// from, and social conventions are taught in English, so neither can ever be
// locked behind kana the learner hasn't mastered. Conversation carries its own,
// stricter gate (every kana at Learning before the track opens at all), so once
// a learner holds a conversation review the reading gate has nothing to add.
//
// Numbers & money is ungated on purpose rather than by omission. A price tag
// is legible on day one — 1,500円 needs no kana at all — and every reading in
// that track carries its figure and its romaji alongside the kana, so the
// cards are usable before the alphabet is and reinforce it afterwards. It is
// also the first thing a traveller actually needs: gating the ATM behind the
// syllabary would be teaching the wrong thing first.
const UNGATED_TYPES: ContentType[] = [
  ...KANA_TYPES,
  ContentType.CULTURE,
  ContentType.CONVERSATION,
  ContentType.NUMBERS,
];

// What every kana has to reach before the conversation track opens. Level 1 on
// the scale the cards draw: New → Learning → Familiar → Strong → Mastered.
export const CONVERSATION_KANA_LEVEL: SRSLevel = "LEARNING";

// How many candidates to consider when looking for content the learner can
// already read. The corpus is ordered by frequency, so the readable items
// cluster near the front; this keeps the scan bounded instead of loading
// every kanji and vocabulary row on each lesson.
const CANDIDATE_POOL = 300;

// Characters that modify a neighbouring kana rather than standing on their
// own: small yoon and vowels, the sokuon, and the katakana long-vowel mark.
// None are seeded as separate characters, so requiring them would leave words
// like きっぷ and きゅうきゅうしゃ permanently locked.
const MODIFIER_KANA = /[ゃゅょぁぃぅぇぉっャュョァィゥェォッーヵヶ]/g;

export interface MasteredKana {
  hiragana: Set<string>;
  katakana: Set<string>;
}

function katakanaToHiragana(str: string): string {
  return str.replace(/[ァ-ヶ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 96));
}

// The kana the learner has taken all the way to MASTERED, as characters rather
// than ids, so readings can be checked against them directly.
export async function getMasteredKana(userId: string): Promise<MasteredKana> {
  const mastered = await prisma.review.findMany({
    where: { userId, contentType: { in: KANA_TYPES }, srsLevel: "MASTERED" },
    select: { contentId: true },
  });
  const ids = mastered.map((r) => r.contentId);
  const hiragana = new Set<string>();
  const katakana = new Set<string>();
  if (ids.length === 0) return { hiragana, katakana };

  const chars = await prisma.japaneseCharacter.findMany({
    where: { id: { in: ids } },
    select: { character: true, type: true },
  });
  for (const c of chars) {
    if (c.type === ContentType.HIRAGANA) hiragana.add(c.character);
    else if (c.type === ContentType.KATAKANA) katakana.add(c.character);
  }
  return { hiragana, katakana };
}

// Sentence punctuation that turns up in phrase readings (full-width comma,
// period, exclamation and question marks, the wave dash used for a blank to
// fill in) — none of it is a kana, so none of it should gate a reading.
const READING_PUNCTUATION = /[-・\s、。！？~〜]/g;

// A reading is unlocked once every standalone kana in it is already mastered.
// Modifiers are stripped first, so しゃ needs し and nothing else.
export function isReadingUnlocked(reading: string, mastered: MasteredKana): boolean {
  if (!reading) return false;
  const stripped = reading.replace(MODIFIER_KANA, "").replace(READING_PUNCTUATION, "");
  if (!stripped) return false;

  for (const ch of stripped) {
    if (ch >= "ぁ" && ch <= "ん") {
      if (!mastered.hiragana.has(ch)) return false;
    } else if (ch >= "ァ" && ch <= "ヶ") {
      if (!mastered.katakana.has(ch)) return false;
    } else {
      // A kanji or latin character inside what should be a kana reading —
      // treat as not yet readable rather than silently allowing it.
      return false;
    }
  }
  return true;
}

// Kanji readings are surfaced to the learner in hiragana (on'yomi included),
// so gate on the hiragana form of the reading they'll actually be shown.
export function isKanjiUnlocked(
  kanji: { character: string; onyomi: string[]; kunyomi: string[] },
  mastered: MasteredKana
): boolean {
  const primary = pickPrimaryKanjiReading(kanji.character, kanji.onyomi, kanji.kunyomi);
  return isReadingUnlocked(katakanaToHiragana(primary), mastered);
}

// Drops reviews for content whose reading the learner can't read yet. Only the
// already-fetched page of reviews is checked, so this stays cheap regardless
// of corpus size. Kana reviews always pass.
//
// `depth` additionally drops kanji outside the band the learner has opted into.
// It belongs here rather than only at the point where new content is chosen,
// because a learner who narrows their setting keeps the review rows they
// already earned: without this they would go on coming due forever in a
// dashboard count that no lesson would ever satisfy. The rows are kept, not
// deleted — widening the setting brings them straight back.
export async function filterUnlockedReviews<
  T extends { contentType: ContentType; contentId: string }
>(reviews: T[], mastered: MasteredKana, depth?: KanjiDepth): Promise<T[]> {
  const wordReviews = reviews.filter((r) => !UNGATED_TYPES.includes(r.contentType));
  if (wordReviews.length === 0) return reviews;

  const idsFor = (t: ContentType) =>
    wordReviews.filter((r) => r.contentType === t).map((r) => r.contentId);
  const vocabIds = idsFor(ContentType.VOCABULARY);
  const kanjiIds = idsFor(ContentType.KANJI);
  const phraseIds = idsFor(ContentType.PHRASE);

  const [vocab, kanji, phrases] = await Promise.all([
    vocabIds.length
      ? prisma.vocabulary.findMany({ where: { id: { in: vocabIds } }, select: { id: true, kana: true } })
      : Promise.resolve([]),
    kanjiIds.length
      ? prisma.kanji.findMany({
          where: { id: { in: kanjiIds } },
          select: { id: true, character: true, onyomi: true, kunyomi: true },
        })
      : Promise.resolve([]),
    // Phrases come from both the table and the conversation cards, so the
    // lookup goes through the corpus helper rather than straight to Prisma —
    // otherwise a review written against a card's line would read as locked.
    findPhrasesByIds(phraseIds),
  ]);

  const unlocked = new Set<string>();
  for (const v of vocab) if (isReadingUnlocked(v.kana, mastered)) unlocked.add(v.id);
  for (const p of phrases) if (isReadingUnlocked(p.kana, mastered)) unlocked.add(p.id);
  for (const k of kanji) {
    if (!isKanjiUnlocked(k, mastered)) continue;
    if (depth && !isKanjiInDepth(k.character, depth)) continue;
    unlocked.add(k.id);
  }

  return reviews.filter(
    (r) => UNGATED_TYPES.includes(r.contentType) || unlocked.has(r.contentId)
  );
}

/**
 * The learner's chosen kanji depth. Read on its own rather than passed down
 * from whatever already loaded the profile, because the three callers that
 * need it (lesson generation, drills, the dashboard) each reach this file by a
 * different route, and a depth that is merely *usually* applied is worse than
 * none — it would mean a learner who asked for essentials only still meeting
 * advanced characters in whichever surface forgot to thread it through.
 */
export async function getKanjiDepth(userId: string): Promise<KanjiDepth> {
  const profile = await prisma.userProfile.findUnique({
    where: { id: userId },
    select: { kanjiDepth: true },
  });
  return profile?.kanjiDepth ?? "ESSENTIAL";
}

// Kanji the learner can read right now, most frequent first, and within the
// band they have opted into. `depth` is optional so the readability helpers
// can still ask "is any kanji at all readable" without a profile lookup.
export async function getUnlockedKanji(
  mastered: MasteredKana,
  excludeIds: string[] = [],
  depth?: KanjiDepth
) {
  if (mastered.hiragana.size === 0 && mastered.katakana.size === 0) return [];
  // `null` means the depth places no ceiling on the corpus — see
  // `charactersUpTo`, which deliberately does not enumerate the open-ended
  // advanced band.
  const allowed = depth ? charactersUpTo(depth) : null;
  const candidates = await prisma.kanji.findMany({
    where: {
      ...(excludeIds.length ? { id: { notIn: excludeIds } } : {}),
      ...(allowed ? { character: { in: allowed } } : {}),
    },
    orderBy: { frequency: "desc" },
    take: CANDIDATE_POOL,
    select: {
      id: true,
      character: true,
      onyomi: true,
      kunyomi: true,
      meanings: true,
      exampleWords: true,
      mnemonicHint: true,
      frequency: true,
    },
  });
  return candidates.filter((k) => isKanjiUnlocked(k, mastered));
}

export async function getUnlockedVocabulary(mastered: MasteredKana, excludeIds: string[] = []) {
  if (mastered.hiragana.size === 0 && mastered.katakana.size === 0) return [];
  const candidates = await prisma.vocabulary.findMany({
    where: excludeIds.length ? { id: { notIn: excludeIds } } : undefined,
    orderBy: { frequency: "desc" },
    take: CANDIDATE_POOL,
    select: { id: true, kana: true },
  });
  return candidates.filter((v) => isReadingUnlocked(v.kana, mastered));
}

export async function getUnlockedPhrases(mastered: MasteredKana, excludeIds: string[] = []) {
  if (mastered.hiragana.size === 0 && mastered.katakana.size === 0) return [];
  const candidates = await getPhraseCandidates(excludeIds, CANDIDATE_POOL);
  return candidates.filter((p) => isReadingUnlocked(p.kana, mastered));
}

// Whether any kanji at all is readable yet — drives the locked states in the UI.
// Scoped to the learner's depth, so a row that says "unlocked" always leads to
// content a drill can actually serve.
export async function hasAnyUnlockedKanji(userId: string): Promise<boolean> {
  const [mastered, depth] = await Promise.all([
    getMasteredKana(userId),
    getKanjiDepth(userId),
  ]);
  const unlocked = await getUnlockedKanji(mastered, [], depth);
  return unlocked.length > 0;
}

export interface KanjiTierProgress {
  tier: KanjiTier;
  /** Characters in this band that exist in the corpus. */
  total: number;
  /** How many of them the learner has taken to MASTERED. */
  mastered: number;
  /** Whether this band is inside the learner's chosen depth. */
  included: boolean;
}

/**
 * Per-band totals and mastery, for the kanji track screen.
 *
 * Counted from the corpus rather than from `UserProgress`, which stores one
 * number for kanji as a whole and so cannot say which band the mastered
 * characters came from. Both queries are small — the corpus is the corpus, and
 * a learner has at most one review row per character.
 */
export async function getKanjiTierProgress(
  userId: string,
  depth: KanjiDepth
): Promise<KanjiTierProgress[]> {
  const [corpus, masteredReviews] = await Promise.all([
    prisma.kanji.findMany({ select: { id: true, character: true } }),
    prisma.review.findMany({
      where: { userId, contentType: ContentType.KANJI, srsLevel: "MASTERED" },
      select: { contentId: true },
    }),
  ]);

  const masteredIds = new Set(masteredReviews.map((r) => r.contentId));
  const totals = new Map<KanjiTier, { total: number; mastered: number }>(
    KANJI_TIERS.map((t) => [t, { total: 0, mastered: 0 }])
  );

  for (const k of corpus) {
    const bucket = totals.get(kanjiTierOf(k.character))!;
    bucket.total += 1;
    if (masteredIds.has(k.id)) bucket.mastered += 1;
  }

  const included = new Set(tiersUpTo(depth));
  return KANJI_TIERS.map((tier) => ({
    tier,
    ...totals.get(tier)!,
    included: included.has(tier),
  }));
}


export async function hasAnyUnlockedVocabulary(userId: string): Promise<boolean> {
  const mastered = await getMasteredKana(userId);
  const unlocked = await getUnlockedVocabulary(mastered);
  return unlocked.length > 0;
}

export async function hasAnyUnlockedPhrases(userId: string): Promise<boolean> {
  const mastered = await getMasteredKana(userId);
  const unlocked = await getUnlockedPhrases(mastered);
  return unlocked.length > 0;
}

export interface ConversationGate {
  unlocked: boolean;
  /** Every kana in the curriculum. */
  total: number;
  /** How many of them are at CONVERSATION_KANA_LEVEL or above. */
  ready: number;
  /** How many are still short of it. */
  remaining: number;
}

/**
 * The conversation track's gate: every hiragana and katakana character has to
 * be at Learning or better before a single exchange is offered.
 *
 * Why that bar, and why it is measured through `effectiveSrsLevel` rather than
 * the stored column: the level a card shows the learner is the effective one,
 * so a gate read off anything else would disagree with the app's own mastery
 * pips — "every kana says at least Learning" has to mean exactly what it looks
 * like it means. Learning is also the first level an answered character can
 * never fall below, which makes the gate monotonic: once conversation opens it
 * stays open, and reviews written against it can never be stranded.
 *
 * The bar is on the kana rather than on reading each line because every
 * conversation card is written in kana — clearing the whole alphabet is
 * precisely the point at which the learner can read all of them.
 */
export async function getConversationGate(userId: string): Promise<ConversationGate> {
  const [kana, reviews] = await Promise.all([
    prisma.japaneseCharacter.findMany({
      where: { type: { in: KANA_TYPES } },
      select: { id: true },
    }),
    prisma.review.findMany({
      where: { userId, contentType: { in: KANA_TYPES } },
      select: {
        contentId: true,
        srsLevel: true,
        consecutiveSuccesses: true,
        interval: true,
        correctCount: true,
        totalAttempts: true,
      },
    }),
  ]);

  const total = kana.length;
  const kanaIds = new Set(kana.map((k) => k.id));
  const bar = srsRank(CONVERSATION_KANA_LEVEL);

  // Deduplicated by contentId: hiragana and katakana are separate content
  // types, so a row can only ever match one character, but counting rows
  // rather than characters would still be the wrong thing to say out loud.
  const ready = new Set(
    reviews
      .filter((r) => kanaIds.has(r.contentId) && srsRank(effectiveSrsLevel(r)) >= bar)
      .map((r) => r.contentId)
  ).size;

  return {
    // A database with no kana seeded must not read as "everything is ready".
    unlocked: total > 0 && ready >= total,
    total,
    ready,
    remaining: Math.max(0, total - ready),
  };
}

/** Whether the conversation track is open — drives its locked states in the UI. */
export async function isConversationUnlocked(userId: string): Promise<boolean> {
  return (await getConversationGate(userId)).unlocked;
}
