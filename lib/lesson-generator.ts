import { prisma } from "./prisma";
import { ContentType, ExerciseType } from "@prisma/client";
import { getRandomCulturalTip } from "./cultural-tips";

interface LessonConfig {
  userId: string;
  targetMinutes?: number;
}

const TARGET_LESSON_SECONDS = 600; // 10 minutes

// Estimated seconds a learner spends on each exercise type (think + reveal + self-assess)
const SECONDS_PER_EXERCISE: Record<ExerciseType, number> = {
  [ExerciseType.CHARACTER_RECOGNITION]: 20,
  [ExerciseType.CHARACTER_TO_SOUND]:    20,
  [ExerciseType.SOUND_TO_CHARACTER]:    25,
  [ExerciseType.ENGLISH_TO_JAPANESE]:   30,
  [ExerciseType.JAPANESE_TO_ENGLISH]:   20,
  [ExerciseType.LISTENING]:             35,
  [ExerciseType.FILL_IN_BLANK]:         30,
  [ExerciseType.MULTIPLE_CHOICE]:       20,
  [ExerciseType.SCENARIO]:              40,
};

// Average estimated seconds per item for each content type (averaged across its exercise pool)
const AVG_SECONDS_BY_CONTENT: Record<ContentType, number> = {
  [ContentType.HIRAGANA]:   22, // avg of CHARACTER_RECOGNITION/CHARACTER_TO_SOUND/SOUND_TO_CHARACTER
  [ContentType.KATAKANA]:   22,
  [ContentType.KANJI]:      20, // avg of CHARACTER_RECOGNITION/JAPANESE_TO_ENGLISH/MULTIPLE_CHOICE
  [ContentType.VOCABULARY]: 28, // avg of ENGLISH_TO_JAPANESE/JAPANESE_TO_ENGLISH/LISTENING
  [ContentType.PHRASE]:     31, // avg of ENGLISH_TO_JAPANESE/JAPANESE_TO_ENGLISH/LISTENING/SCENARIO
};

const AVG_SECONDS_PER_ITEM = 25;

// LISTENING included for vocab/phrase — auto-plays audio, user self-assesses comprehension
const EXERCISE_TYPES_BY_CONTENT: Record<ContentType, ExerciseType[]> = {
  HIRAGANA:   [ExerciseType.CHARACTER_RECOGNITION, ExerciseType.CHARACTER_TO_SOUND, ExerciseType.SOUND_TO_CHARACTER],
  KATAKANA:   [ExerciseType.CHARACTER_RECOGNITION, ExerciseType.CHARACTER_TO_SOUND, ExerciseType.SOUND_TO_CHARACTER],
  KANJI:      [ExerciseType.CHARACTER_RECOGNITION, ExerciseType.JAPANESE_TO_ENGLISH, ExerciseType.MULTIPLE_CHOICE],
  VOCABULARY: [ExerciseType.ENGLISH_TO_JAPANESE, ExerciseType.JAPANESE_TO_ENGLISH, ExerciseType.LISTENING],
  PHRASE:     [ExerciseType.ENGLISH_TO_JAPANESE, ExerciseType.JAPANESE_TO_ENGLISH, ExerciseType.LISTENING, ExerciseType.SCENARIO],
};

export async function generateDailyLesson(config: LessonConfig) {
  const { userId } = config;
  const now = new Date();

  const culturalTipSeconds = SECONDS_PER_EXERCISE[ExerciseType.SCENARIO];
  const effectiveBudget = TARGET_LESSON_SECONDS - culturalTipSeconds;
  const reviewBudget = Math.floor(effectiveBudget * 0.7);

  // Fetch more than we'll use; trim by time budget
  const allDueReviews = await prisma.review.findMany({
    where: { userId, nextReviewAt: { lte: now }, srsLevel: { not: "MASTERED" } },
    orderBy: [{ srsLevel: "asc" }, { nextReviewAt: "asc" }],
    take: 60,
  });

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
  const newItems = await getNewContent(userId, newItemBudget, weakTypes);
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
  const finalItems = [
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

async function getNewContent(userId: string, budget: number, weakTypes: ContentType[]) {
  const existing = await prisma.review.findMany({ where: { userId }, select: { contentId: true, contentType: true } });
  const learnedByType: Record<string, Set<string>> = {};
  for (const r of existing) {
    if (!learnedByType[r.contentType]) learnedByType[r.contentType] = new Set();
    learnedByType[r.contentType].add(r.contentId);
  }
  const perType = Math.max(1, Math.floor(budget / 4));
  const boost = (type: ContentType) => weakTypes.includes(type) ? perType * 2 : perType;
  const results: { contentType: ContentType; contentId: string; romaji?: string }[] = [];
  const [newHiragana, newKatakana, newVocab, newKanji, newPhrases] = await Promise.all([
    prisma.japaneseCharacter.findMany({ where: { type: ContentType.HIRAGANA, id: { notIn: [...(learnedByType[ContentType.HIRAGANA] ?? [])] } }, orderBy: { displayOrder: "asc" }, take: boost(ContentType.HIRAGANA) }),
    prisma.japaneseCharacter.findMany({ where: { type: ContentType.KATAKANA, id: { notIn: [...(learnedByType[ContentType.KATAKANA] ?? [])] } }, orderBy: { displayOrder: "asc" }, take: boost(ContentType.KATAKANA) }),
    prisma.vocabulary.findMany({ where: { id: { notIn: [...(learnedByType[ContentType.VOCABULARY] ?? [])] } }, orderBy: { frequency: "desc" }, take: boost(ContentType.VOCABULARY) }),
    prisma.kanji.findMany({ where: { id: { notIn: [...(learnedByType[ContentType.KANJI] ?? [])] } }, orderBy: { frequency: "desc" }, take: boost(ContentType.KANJI) }),
    prisma.phrase.findMany({ where: { id: { notIn: [...(learnedByType[ContentType.PHRASE] ?? [])] } }, orderBy: { difficulty: "asc" }, take: boost(ContentType.PHRASE) }),
  ]);
  results.push(...newHiragana.map((i) => ({ contentType: ContentType.HIRAGANA, contentId: i.id, romaji: i.romaji })));
  results.push(...newKatakana.map((i) => ({ contentType: ContentType.KATAKANA, contentId: i.id, romaji: i.romaji })));
  results.push(...newVocab.map((i) => ({ contentType: ContentType.VOCABULARY, contentId: i.id })));
  results.push(...newKanji.map((i) => ({ contentType: ContentType.KANJI, contentId: i.id })));
  results.push(...newPhrases.map((i) => ({ contentType: ContentType.PHRASE, contentId: i.id })));
  return results.slice(0, budget);
}

function pickExerciseType(contentType: ContentType, srsLevel: string): ExerciseType {
  const types = EXERCISE_TYPES_BY_CONTENT[contentType];
  if (srsLevel === "NEW") {
    if (contentType === ContentType.VOCABULARY || contentType === ContentType.PHRASE) return ExerciseType.ENGLISH_TO_JAPANESE;
    return types[0];
  }
  return types[Math.floor(Math.random() * types.length)];
}
