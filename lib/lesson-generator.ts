import { prisma } from "./prisma";
import { ContentType, ExerciseType } from "@prisma/client";

interface LessonConfig {
  userId: string;
  targetMinutes?: number;
}

const ITEMS_PER_MINUTE = 3;

const EXERCISE_TYPES_BY_CONTENT: Record<ContentType, ExerciseType[]> = {
  HIRAGANA: [
    ExerciseType.CHARACTER_RECOGNITION,
    ExerciseType.CHARACTER_TO_SOUND,
    ExerciseType.SOUND_TO_CHARACTER,
    ExerciseType.MULTIPLE_CHOICE,
  ],
  KATAKANA: [
    ExerciseType.CHARACTER_RECOGNITION,
    ExerciseType.CHARACTER_TO_SOUND,
    ExerciseType.SOUND_TO_CHARACTER,
    ExerciseType.MULTIPLE_CHOICE,
  ],
  KANJI: [
    ExerciseType.CHARACTER_RECOGNITION,
    ExerciseType.JAPANESE_TO_ENGLISH,
    ExerciseType.MULTIPLE_CHOICE,
    ExerciseType.FILL_IN_BLANK,
  ],
  VOCABULARY: [
    ExerciseType.ENGLISH_TO_JAPANESE,
    ExerciseType.JAPANESE_TO_ENGLISH,
    ExerciseType.LISTENING,
    ExerciseType.FILL_IN_BLANK,
    ExerciseType.MULTIPLE_CHOICE,
  ],
  PHRASE: [
    ExerciseType.JAPANESE_TO_ENGLISH,
    ExerciseType.ENGLISH_TO_JAPANESE,
    ExerciseType.LISTENING,
    ExerciseType.SCENARIO,
  ],
};

export async function generateDailyLesson(config: LessonConfig) {
  const { userId, targetMinutes = 20 } = config;
  const targetItems = targetMinutes * ITEMS_PER_MINUTE;
  const now = new Date();

  // Pull due reviews first (70% of lesson budget)
  const dueReviews = await prisma.review.findMany({
    where: {
      userId,
      nextReviewAt: { lte: now },
      srsLevel: { not: "MASTERED" },
    },
    orderBy: [{ srsLevel: "asc" }, { nextReviewAt: "asc" }],
    take: Math.floor(targetItems * 0.7),
  });

  const weakTypes = await getWeakContentTypes(userId);
  const newItemBudget = Math.max(5, targetItems - dueReviews.length);
  const newItems = await getNewContent(userId, newItemBudget, weakTypes);

  const lesson = await prisma.lesson.create({
    data: {
      userId,
      items: {
        create: [
          ...dueReviews.map((review, i) => ({
            contentType: review.contentType,
            contentId: review.contentId,
            exerciseType: pickExerciseType(review.contentType, review.srsLevel),
            displayOrder: i,
          })),
          ...newItems.map((item, i) => ({
            contentType: item.contentType,
            contentId: item.contentId,
            exerciseType: pickExerciseType(item.contentType, "NEW"),
            displayOrder: dueReviews.length + i,
          })),
        ],
      },
    },
    include: { items: { orderBy: { displayOrder: "asc" } } },
  });

  return lesson;
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
  weakTypes: ContentType[]
) {
  const existing = await prisma.review.findMany({
    where: { userId },
    select: { contentId: true, contentType: true },
  });

  const learnedByType: Record<string, Set<string>> = {};
  for (const r of existing) {
    if (!learnedByType[r.contentType]) learnedByType[r.contentType] = new Set();
    learnedByType[r.contentType].add(r.contentId);
  }

  const perType = Math.max(1, Math.floor(budget / 4));
  const results: { contentType: ContentType; contentId: string }[] = [];

  const boost = (type: ContentType) =>
    weakTypes.includes(type) ? perType * 2 : perType;

  const [newHiragana, newKatakana, newVocab, newKanji, newPhrases] =
    await Promise.all([
      prisma.japaneseCharacter.findMany({
        where: {
          type: ContentType.HIRAGANA,
          id: { notIn: [...(learnedByType[ContentType.HIRAGANA] ?? [])] },
        },
        orderBy: { displayOrder: "asc" },
        take: boost(ContentType.HIRAGANA),
      }),
      prisma.japaneseCharacter.findMany({
        where: {
          type: ContentType.KATAKANA,
          id: { notIn: [...(learnedByType[ContentType.KATAKANA] ?? [])] },
        },
        orderBy: { displayOrder: "asc" },
        take: boost(ContentType.KATAKANA),
      }),
      prisma.vocabulary.findMany({
        where: {
          id: { notIn: [...(learnedByType[ContentType.VOCABULARY] ?? [])] },
        },
        orderBy: { frequency: "desc" },
        take: boost(ContentType.VOCABULARY),
      }),
      prisma.kanji.findMany({
        where: {
          id: { notIn: [...(learnedByType[ContentType.KANJI] ?? [])] },
        },
        orderBy: { frequency: "desc" },
        take: boost(ContentType.KANJI),
      }),
      prisma.phrase.findMany({
        where: {
          id: { notIn: [...(learnedByType[ContentType.PHRASE] ?? [])] },
        },
        orderBy: { difficulty: "asc" },
        take: boost(ContentType.PHRASE),
      }),
    ]);

  results.push(...newHiragana.map((i) => ({ contentType: ContentType.HIRAGANA, contentId: i.id })));
  results.push(...newKatakana.map((i) => ({ contentType: ContentType.KATAKANA, contentId: i.id })));
  results.push(...newVocab.map((i) => ({ contentType: ContentType.VOCABULARY, contentId: i.id })));
  results.push(...newKanji.map((i) => ({ contentType: ContentType.KANJI, contentId: i.id })));
  results.push(...newPhrases.map((i) => ({ contentType: ContentType.PHRASE, contentId: i.id })));

  return results.slice(0, budget);
}

function pickExerciseType(contentType: ContentType, srsLevel: string): ExerciseType {
  const types = EXERCISE_TYPES_BY_CONTENT[contentType];
  if (srsLevel === "NEW") return types[0];
  return types[Math.floor(Math.random() * types.length)];
}
