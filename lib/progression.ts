import { prisma } from "./prisma";
import { ContentType } from "@prisma/client";
import { pickPrimaryKanjiReading } from "./utils";

export const KANA_TYPES: ContentType[] = [ContentType.HIRAGANA, ContentType.KATAKANA];

// Content with no Japanese reading to gate on. Kana is what the gate is built
// from, and social conventions are taught in English, so neither can ever be
// locked behind kana the learner hasn't mastered.
const UNGATED_TYPES: ContentType[] = [...KANA_TYPES, ContentType.CULTURE];

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

// A reading is unlocked once every standalone kana in it is already mastered.
// Modifiers are stripped first, so しゃ needs し and nothing else.
export function isReadingUnlocked(reading: string, mastered: MasteredKana): boolean {
  if (!reading) return false;
  const stripped = reading.replace(MODIFIER_KANA, "").replace(/[-・\s]/g, "");
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
export async function filterUnlockedReviews<
  T extends { contentType: ContentType; contentId: string }
>(reviews: T[], mastered: MasteredKana): Promise<T[]> {
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
    phraseIds.length
      ? prisma.phrase.findMany({ where: { id: { in: phraseIds } }, select: { id: true, kana: true } })
      : Promise.resolve([]),
  ]);

  const unlocked = new Set<string>();
  for (const v of vocab) if (isReadingUnlocked(v.kana, mastered)) unlocked.add(v.id);
  for (const p of phrases) if (isReadingUnlocked(p.kana, mastered)) unlocked.add(p.id);
  for (const k of kanji) if (isKanjiUnlocked(k, mastered)) unlocked.add(k.id);

  return reviews.filter(
    (r) => UNGATED_TYPES.includes(r.contentType) || unlocked.has(r.contentId)
  );
}

// Kanji the learner can read right now, most frequent first.
export async function getUnlockedKanji(mastered: MasteredKana, excludeIds: string[] = []) {
  if (mastered.hiragana.size === 0 && mastered.katakana.size === 0) return [];
  const candidates = await prisma.kanji.findMany({
    where: excludeIds.length ? { id: { notIn: excludeIds } } : undefined,
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
  const candidates = await prisma.phrase.findMany({
    where: excludeIds.length ? { id: { notIn: excludeIds } } : undefined,
    orderBy: { difficulty: "asc" },
    take: CANDIDATE_POOL,
    select: { id: true, kana: true },
  });
  return candidates.filter((p) => isReadingUnlocked(p.kana, mastered));
}

// Whether any kanji at all is readable yet — drives the locked states in the UI.
export async function hasAnyUnlockedKanji(userId: string): Promise<boolean> {
  const mastered = await getMasteredKana(userId);
  const unlocked = await getUnlockedKanji(mastered);
  return unlocked.length > 0;
}
