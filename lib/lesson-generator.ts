import { prisma } from "./prisma";
import { ContentType, ExerciseType } from "@prisma/client";
import { getRandomCulturalTip } from "./cultural-tips";
import { SCRIPT_INTROS } from "./script-intros";
import {
  getMasteredKana,
  filterUnlockedReviews,
  getUnlockedKanji,
  getUnlockedVocabulary,
  getUnlockedPhrases,
  type MasteredKana,
} from "./progression";

// Hiragana/katakana displayOrder >= this value are dakuten/handakuten (modified) kana
const DAKUTEN_DISPLAY_ORDER_START = 47;

interface LessonConfig {
  userId: string;
  targetMinutes?: number;
}

const TARGET_LESSON_SECONDS = 600; // 10 minutes

type NewContentItem = {
  contentType: ContentType;
  contentId: string;
  romaji?: string;
  displayOrder?: number;
};

// Estimated seconds a learner spends on each exercise type (think + reveal + self-assess)
const SECONDS_PER_EXERCISE: Record<ExerciseType, number> = {
  [ExerciseType.CHARACTER_RECOGNITION]: 20,
  [ExerciseType.CHARACTER_TO_SOUND]:    20,
  [ExerciseType.SOUND_TO_CHARACTER]:    25,
  [ExerciseType.ENGLISH_TO_JAPANESE]:   30,
  [ExerciseType.JAPANESE_TO_ENGLISH]:   20,
  [ExerciseType.LISTENING]:             35,
  [ExerciseType.SPEAKING]:              35,
  [ExerciseType.FILL_IN_BLANK]:         30,
  [ExerciseType.MULTIPLE_CHOICE]:       20,
  [ExerciseType.SCENARIO]:              40,
};

// Average estimated seconds per item for each content type (averaged across its exercise pool)
const AVG_SECONDS_BY_CONTENT: Record<ContentType, number> = {
  [ContentType.HIRAGANA]:   22, // avg of CHARACTER_RECOGNITION/CHARACTER_TO_SOUND/SOUND_TO_CHARACTER
  [ContentType.KATAKANA]:   22,
  [ContentType.KANJI]:      20, // avg of CHARACTER_RECOGNITION/JAPANESE_TO_ENGLISH/MULTIPLE_CHOICE
  [ContentType.VOCABULARY]: 30, // avg of ENGLISH_TO_JAPANESE/JAPANESE_TO_ENGLISH/LISTENING/SPEAKING
  [ContentType.PHRASE]:     32, // avg of ENGLISH_TO_JAPANESE/JAPANESE_TO_ENGLISH/LISTENING/SPEAKING/SCENARIO
};

const AVG_SECONDS_PER_ITEM = 25;

// LISTENING included for vocab/phrase — auto-plays audio, user self-assesses comprehension.
// SPEAKING is the mirror of it: the learner says the word and the browser's
// recogniser grades the attempt. Only vocabulary and phrases get it — a single
// kana is one mora, too short for any recogniser to judge fairly.
const EXERCISE_TYPES_BY_CONTENT: Record<ContentType, ExerciseType[]> = {
  HIRAGANA:   [ExerciseType.CHARACTER_RECOGNITION, ExerciseType.CHARACTER_TO_SOUND, ExerciseType.SOUND_TO_CHARACTER],
  KATAKANA:   [ExerciseType.CHARACTER_RECOGNITION, ExerciseType.CHARACTER_TO_SOUND, ExerciseType.SOUND_TO_CHARACTER],
  KANJI:      [ExerciseType.CHARACTER_RECOGNITION, ExerciseType.JAPANESE_TO_ENGLISH, ExerciseType.MULTIPLE_CHOICE],
  VOCABULARY: [ExerciseType.ENGLISH_TO_JAPANESE, ExerciseType.JAPANESE_TO_ENGLISH, ExerciseType.LISTENING, ExerciseType.SPEAKING],
  PHRASE:     [ExerciseType.ENGLISH_TO_JAPANESE, ExerciseType.JAPANESE_TO_ENGLISH, ExerciseType.LISTENING, ExerciseType.SPEAKING, ExerciseType.SCENARIO],
};

export async function generateDailyLesson(config: LessonConfig) {
  const { userId } = config;
  const now = new Date();

  const culturalTipSeconds = SECONDS_PER_EXERCISE[ExerciseType.SCENARIO];
  const effectiveBudget = TARGET_LESSON_SECONDS - culturalTipSeconds;
  const reviewBudget = Math.floor(effectiveBudget * 0.7);

  const masteredKana = await getMasteredKana(userId);

  // Fetch more than we'll use; trim by time budget. Reviews are then filtered
  // to content the learner can actually read: someone who studied kanji before
  // this gate existed still has those reviews on file, and they must not keep
  // resurfacing while their readings use kana that isn't mastered yet.
  const fetchedReviews = await prisma.review.findMany({
    where: { userId, nextReviewAt: { lte: now }, srsLevel: { not: "MASTERED" } },
    orderBy: [{ srsLevel: "asc" }, { nextReviewAt: "asc" }],
    take: 60,
  });
  const allDueReviews = await filterUnlockedReviews(fetchedReviews, masteredKana);

  let reviewSeconds = 0;
  const dueReviews: typeof allDueReviews = [];
  for (const r of allDueReviews) {
    const est = AVG_SECONDS_BY_CONTENT[r.contentType as ContentType] ?? AVG_SECONDS_PER_ITEM;
    if (reviewSeconds + est > reviewBudget) break;
    dueReviews.push(r);
    reviewSeconds += est;
  }

  const remainingSeconds = effectiveBudget - reviewSeconds;
  // Guarantee at least ~2 minutes of new content even if reviews fill the budget
  const newItemSeconds = Math.max(120, remainingSeconds);
  const newItemBudget = Math.max(3, Math.round(newItemSeconds / AVG_SECONDS_PER_ITEM));

  const weakTypes = await getWeakContentTypes(userId);
  const { items: newItems, hasLearnedHiragana, hasLearnedKatakana, hasLearnedDakuten } =
    await getNewContent(userId, newItemBudget, weakTypes, masteredKana);
  const spreadNewItems = spreadByFamily(newItems);

  const reviewItems = dueReviews.map((review) => ({
    contentType: review.contentType,
    contentId: review.contentId,
    exerciseType: pickExerciseType(review.contentType, review.srsLevel),
  }));

  const newItemsMapped = spreadNewItems.map((item) => ({
    contentType: item.contentType,
    contentId: item.contentId,
    exerciseType: pickExerciseType(item.contentType, "NEW"),
  }));

  const baseItems = interleaveItems(reviewItems, newItemsMapped);

  // Inject one cultural tip per lesson, inserted at a random position after item 2
  const tip = getRandomCulturalTip();
  const tipItem = {
    contentType: ContentType.PHRASE,
    contentId: tip.id,
    exerciseType: ExerciseType.SCENARIO,
  };
  const insertAt = Math.min(baseItems.length, 2 + Math.floor(Math.random() * 4));

  // Explainer cards shown once, before a learner meets a new script or the
  // dakuten/handakuten modifiers, for the first time
  const scriptIntroItems: typeof baseItems = [];
  const introducesHiragana = newItems.some((i) => i.contentType === ContentType.HIRAGANA);
  const introducesKatakana = newItems.some((i) => i.contentType === ContentType.KATAKANA);
  const introducesDakuten = newItems.some(
    (i) =>
      (i.contentType === ContentType.HIRAGANA || i.contentType === ContentType.KATAKANA) &&
      (i.displayOrder ?? 0) >= DAKUTEN_DISPLAY_ORDER_START
  );
  if (!hasLearnedHiragana && introducesHiragana) {
    scriptIntroItems.push({ contentType: ContentType.PHRASE, contentId: SCRIPT_INTROS.hiragana.id, exerciseType: ExerciseType.SCENARIO });
  }
  if (!hasLearnedKatakana && introducesKatakana) {
    scriptIntroItems.push({ contentType: ContentType.PHRASE, contentId: SCRIPT_INTROS.katakana.id, exerciseType: ExerciseType.SCENARIO });
  }
  if (!hasLearnedDakuten && introducesDakuten) {
    scriptIntroItems.push({ contentType: ContentType.PHRASE, contentId: SCRIPT_INTROS.dakuten.id, exerciseType: ExerciseType.SCENARIO });
  }

  const finalItems = [
    ...scriptIntroItems,
    ...baseItems.slice(0, insertAt),
    tipItem,
    ...baseItems.slice(insertAt),
  ];

  const lesson = await prisma.lesson.create({
    data: {
      userId,
      items: {
        create: finalItems.map((item, i) => ({
          contentType: item.contentType,
          contentId: item.contentId,
          exerciseType: item.exerciseType,
          displayOrder: i,
        })),
      },
    },
    include: { items: { orderBy: { displayOrder: "asc" } } },
  });

  return lesson;
}

function interleaveItems<T>(a: T[], b: T[]): T[] {
  const result: T[] = [];
  const aShuffled = [...a].sort(() => Math.random() - 0.5);
  const bShuffled = [...b].sort(() => Math.random() - 0.5);
  const maxLen = Math.max(aShuffled.length, bShuffled.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < aShuffled.length) result.push(aShuffled[i]);
    if (i < bShuffled.length) result.push(bShuffled[i]);
  }
  return result;
}

function getConsonantFamily(romaji: string): string {
  if (!romaji) return "other";
  const r = romaji.toLowerCase().trim();
  if (/^[aeiou]/.test(r)) return "vowel";
  if (r.startsWith("ch") || r.startsWith("ts")) return r.slice(0, 2);
  if (r.startsWith("sh")) return "sh";
  return r[0];
}

function spreadByFamily(
  items: { contentType: ContentType; contentId: string; romaji?: string }[]
): { contentType: ContentType; contentId: string; romaji?: string }[] {
  const charItems = items.filter(
    (i) => i.contentType === ContentType.HIRAGANA || i.contentType === ContentType.KATAKANA
  );
  const otherItems = items.filter(
    (i) => i.contentType !== ContentType.HIRAGANA && i.contentType !== ContentType.KATAKANA
  );
  const families: Record<string, typeof charItems> = {};
  for (const item of charItems) {
    const family = getConsonantFamily(item.romaji ?? "");
    if (!families[family]) families[family] = [];
    families[family].push(item);
  }
  const familyQueues = Object.values(families);
  const spreadChars: typeof charItems = [];
  let changed = true;
  while (changed) {
    changed = false;
    for (const queue of familyQueues) {
      if (queue.length > 0) { spreadChars.push(queue.shift()!); changed = true; }
    }
  }
  // Merge spread kana (order preserved) with shuffled non-kana items round-robin
  const shuffledOthers = [...otherItems].sort(() => Math.random() - 0.5);
  const merged: typeof charItems = [];
  const maxLen = Math.max(spreadChars.length, shuffledOthers.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < spreadChars.length) merged.push(spreadChars[i]);
    if (i < shuffledOthers.length) merged.push(shuffledOthers[i]);
  }
  return merged;
}

async function getWeakContentTypes(userId: string): Promise<ContentType[]> {
  const reviews = await prisma.review.findMany({
    where: { userId, totalAttempts: { gt: 5 } },
    select: { contentType: true, correctCount: true, totalAttempts: true },
  });
  const byType: Record<string, { correct: number; total: number }> = {};
  for (const r of reviews) {
    if (!byType[r.contentType]) byType[r.contentType] = { correct: 0, total: 0 };
    byType[r.contentType].correct += r.correctCount;
    byType[r.contentType].total += r.totalAttempts;
  }
  return Object.entries(byType)
    .filter(([, v]) => v.total > 0 && v.correct / v.total < 0.7)
    .map(([k]) => k as ContentType);
}

async function getNewContent(
  userId: string,
  budget: number,
  weakTypes: ContentType[],
  masteredKana: MasteredKana
) {
  const existing = await prisma.review.findMany({ where: { userId }, select: { contentId: true, contentType: true } });
  const learnedByType: Record<string, Set<string>> = {};
  for (const r of existing) {
    if (!learnedByType[r.contentType]) learnedByType[r.contentType] = new Set();
    learnedByType[r.contentType].add(r.contentId);
  }
  const learnedKanaIds = [
    ...(learnedByType[ContentType.HIRAGANA] ?? []),
    ...(learnedByType[ContentType.KATAKANA] ?? []),
  ];
  const perType = Math.max(1, Math.floor(budget / 4));
  const boost = (type: ContentType) => weakTypes.includes(type) ? perType * 2 : perType;

  const [newHiragana, newKatakana, unlockedVocab, unlockedKanji, unlockedPhrases, learnedDakuten] = await Promise.all([
    prisma.japaneseCharacter.findMany({ where: { type: ContentType.HIRAGANA, id: { notIn: [...(learnedByType[ContentType.HIRAGANA] ?? [])] } }, orderBy: { displayOrder: "asc" }, take: boost(ContentType.HIRAGANA) * 2 }),
    prisma.japaneseCharacter.findMany({ where: { type: ContentType.KATAKANA, id: { notIn: [...(learnedByType[ContentType.KATAKANA] ?? [])] } }, orderBy: { displayOrder: "asc" }, take: boost(ContentType.KATAKANA) * 2 }),
    // Words and kanji are offered only once every kana in their reading is
    // mastered, so the learner can always sound out what they're shown.
    getUnlockedVocabulary(masteredKana, [...(learnedByType[ContentType.VOCABULARY] ?? [])]),
    getUnlockedKanji(masteredKana, [...(learnedByType[ContentType.KANJI] ?? [])]),
    getUnlockedPhrases(masteredKana, [...(learnedByType[ContentType.PHRASE] ?? [])]),
    learnedKanaIds.length
      ? prisma.japaneseCharacter.findMany({ where: { id: { in: learnedKanaIds }, displayOrder: { gte: DAKUTEN_DISPLAY_ORDER_START } }, select: { id: true }, take: 1 })
      : Promise.resolve([]),
  ]);

  const kanaItems: NewContentItem[] = [
    ...newHiragana.map((i) => ({ contentType: ContentType.HIRAGANA, contentId: i.id, romaji: i.romaji, displayOrder: i.displayOrder })),
    ...newKatakana.map((i) => ({ contentType: ContentType.KATAKANA, contentId: i.id, romaji: i.romaji, displayOrder: i.displayOrder })),
  ];
  const wordItems: NewContentItem[] = [
    ...unlockedVocab.slice(0, boost(ContentType.VOCABULARY)).map((i) => ({ contentType: ContentType.VOCABULARY, contentId: i.id })),
    ...unlockedKanji.slice(0, boost(ContentType.KANJI)).map((i) => ({ contentType: ContentType.KANJI, contentId: i.id })),
    ...unlockedPhrases.slice(0, boost(ContentType.PHRASE)).map((i) => ({ contentType: ContentType.PHRASE, contentId: i.id })),
  ];

  // Learning the rest of the alphabet stays the priority while any kana is
  // still unseen, but readable words are mixed in so mastered kana gets used
  // for something rather than sitting idle until the whole set is finished.
  const kanaShare = kanaItems.length > 0 ? Math.max(1, Math.ceil(budget * 0.6)) : 0;
  const results: NewContentItem[] = kanaItems.slice(0, kanaShare);
  results.push(...wordItems.slice(0, Math.max(0, budget - results.length)));
  if (results.length < budget) {
    results.push(...kanaItems.slice(kanaShare, kanaShare + (budget - results.length)));
  }

  return {
    items: results.slice(0, budget),
    hasLearnedHiragana: (learnedByType[ContentType.HIRAGANA]?.size ?? 0) > 0,
    hasLearnedKatakana: (learnedByType[ContentType.KATAKANA]?.size ?? 0) > 0,
    hasLearnedDakuten: learnedDakuten.length > 0,
  };
}

function pickExerciseType(contentType: ContentType, srsLevel: string): ExerciseType {
  const types = EXERCISE_TYPES_BY_CONTENT[contentType];
  if (srsLevel === "NEW") {
    if (contentType === ContentType.VOCABULARY || contentType === ContentType.PHRASE) return ExerciseType.ENGLISH_TO_JAPANESE;
    return types[0];
  }
  return types[Math.floor(Math.random() * types.length)];
}
