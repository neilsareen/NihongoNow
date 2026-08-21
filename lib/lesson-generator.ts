import { prisma } from "./prisma";
import { ContentType, ExerciseType } from "@prisma/client";
import { CULTURAL_TIPS, getRandomCulturalTip } from "./cultural-tips";
import { SCRIPT_INTROS, type ScriptIntroKey } from "./script-intros";
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
// A learner who is fully caught up (nothing due, nothing new unlocked) would
// otherwise get handed just the day's culture card. Floor every lesson here
// by pulling in reviews ahead of schedule until it clears this bar.
const MIN_LESSON_SECONDS = 300; // 5 minutes

/** One card in a generated lesson, before it is written to the database. */
type LessonItemSpec = {
  contentType: ContentType;
  contentId: string;
  exerciseType: ExerciseType;
};

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
  [ContentType.CULTURE]:    40, // always SCENARIO: read the situation, then self-assess
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
  CULTURE:    [ExerciseType.SCENARIO],
};

export async function generateDailyLesson(config: LessonConfig) {
  const { userId } = config;
  const now = new Date();

  const cultureCardIds = await pickCultureCards(userId, now);
  const cultureSeconds = cultureCardIds.length * SECONDS_PER_EXERCISE[ExerciseType.SCENARIO];
  const effectiveBudget = TARGET_LESSON_SECONDS - cultureSeconds;
  const reviewBudget = Math.floor(effectiveBudget * 0.7);

  const masteredKana = await getMasteredKana(userId);

  // Fetch more than we'll use; trim by time budget. Reviews are then filtered
  // to content the learner can actually read: someone who studied kanji before
  // this gate existed still has those reviews on file, and they must not keep
  // resurfacing while their readings use kana that isn't mastered yet.
  // Culture has its own slots below, so it stays out of the general pool —
  // otherwise a due convention could land in the lesson twice.
  const fetchedReviews = await prisma.review.findMany({
    where: {
      userId,
      nextReviewAt: { lte: now },
      srsLevel: { not: "MASTERED" },
      contentType: { not: ContentType.CULTURE },
    },
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
  const { items: newItems, learned, hasLearnedDakuten } =
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

  // Social conventions ride along with the language: one convention the learner
  // hasn't met yet, plus one that's due for review, spread through the lesson
  // rather than stacked together.
  const cultureItems: LessonItemSpec[] = cultureCardIds.map((id) => ({
    contentType: ContentType.CULTURE,
    contentId: id,
    exerciseType: ExerciseType.SCENARIO,
  }));
  const firstSlot = 2 + Math.floor(Math.random() * 4);
  const slotGap = Math.max(2, Math.floor(baseItems.length / (cultureItems.length + 1)));
  const withCulture: LessonItemSpec[] = [...baseItems];
  for (let i = cultureItems.length - 1; i >= 0; i--) {
    withCulture.splice(Math.min(withCulture.length, firstSlot + slotGap * i), 0, cultureItems[i]);
  }

  // Explainer cards, each shown once: the very first time the learner opens a
  // lesson, and thereafter whenever a lesson is about to introduce a kind of
  // content they have never met — a new script, the sound modifiers, kanji,
  // their first real words, their first phrases. They are prepended in
  // curriculum order so an intro always lands before the item it explains.
  const introCard = (key: ScriptIntroKey) => ({
    contentType: ContentType.PHRASE,
    contentId: SCRIPT_INTROS[key].id,
    exerciseType: ExerciseType.SCENARIO,
  });

  const introduces = (type: ContentType) => newItems.some((i) => i.contentType === type);
  const introducesDakuten = newItems.some(
    (i) =>
      (i.contentType === ContentType.HIRAGANA || i.contentType === ContentType.KATAKANA) &&
      (i.displayOrder ?? 0) >= DAKUTEN_DISPLAY_ORDER_START
  );
  const hasLearnedAnything = Object.values(learned).some(Boolean);

  const scriptIntroItems: LessonItemSpec[] = [];
  // The three-scripts overview opens the very first lesson, before the
  // hiragana card explains the script that lesson actually starts with.
  if (!hasLearnedAnything) scriptIntroItems.push(introCard("welcome"));
  if (!learned.HIRAGANA && introduces(ContentType.HIRAGANA)) scriptIntroItems.push(introCard("hiragana"));
  if (!learned.KATAKANA && introduces(ContentType.KATAKANA)) scriptIntroItems.push(introCard("katakana"));
  if (!hasLearnedDakuten && introducesDakuten) scriptIntroItems.push(introCard("dakuten"));
  if (!learned.KANJI && introduces(ContentType.KANJI)) scriptIntroItems.push(introCard("kanji"));
  if (!learned.VOCABULARY && introduces(ContentType.VOCABULARY)) scriptIntroItems.push(introCard("vocabulary"));
  if (!learned.PHRASE && introduces(ContentType.PHRASE)) scriptIntroItems.push(introCard("phrases"));

  const finalItems = [...scriptIntroItems, ...withCulture];

  const paddedItems = await padToMinimumDuration(finalItems, userId, now, masteredKana);

  const lesson = await prisma.lesson.create({
    data: {
      userId,
      items: {
        create: paddedItems.map((item, i) => ({
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

function estimateSeconds(items: LessonItemSpec[]): number {
  return items.reduce((sum, item) => sum + SECONDS_PER_EXERCISE[item.exerciseType], 0);
}

/**
 * Tops a lesson up to MIN_LESSON_SECONDS by drawing on reviews that aren't
 * due yet, soonest first. Only reached when reviews-due and new-content are
 * both too thin to fill even a 5-minute floor — someone caught up on
 * everything currently unlocked — so reviewing a little early is the only
 * content left to offer.
 */
async function padToMinimumDuration(
  items: LessonItemSpec[],
  userId: string,
  now: Date,
  masteredKana: MasteredKana
): Promise<LessonItemSpec[]> {
  if (estimateSeconds(items) >= MIN_LESSON_SECONDS) return items;

  const usedIds = new Set(items.map((i) => `${i.contentType}:${i.contentId}`));
  const upcomingReviews = await prisma.review.findMany({
    where: {
      userId,
      nextReviewAt: { gt: now },
      srsLevel: { not: "MASTERED" },
      contentType: { not: ContentType.CULTURE },
    },
    orderBy: { nextReviewAt: "asc" },
    take: 30,
  });
  const unlockedUpcoming = await filterUnlockedReviews(upcomingReviews, masteredKana);

  const padded = [...items];
  for (const r of unlockedUpcoming) {
    if (estimateSeconds(padded) >= MIN_LESSON_SECONDS) break;
    const key = `${r.contentType}:${r.contentId}`;
    if (usedIds.has(key)) continue;
    usedIds.add(key);
    padded.push({
      contentType: r.contentType,
      contentId: r.contentId,
      exerciseType: pickExerciseType(r.contentType, r.srsLevel),
    });
  }
  return padded;
}

/**
 * The social conventions a lesson should carry: the one most overdue for
 * review, and one the learner has never seen. Either can be missing — a first
 * lesson has nothing due, and a learner who has met all of them has nothing
 * new — and when neither applies the convention closest to coming due is
 * pulled forward, so a lesson is never without one.
 */
async function pickCultureCards(userId: string, now: Date): Promise<string[]> {
  const reviews = await prisma.review.findMany({
    where: { userId, contentType: ContentType.CULTURE },
    select: { contentId: true, nextReviewAt: true, srsLevel: true },
  });

  const seen = new Set(reviews.map((r) => r.contentId));
  const scheduled = reviews
    .filter((r) => r.srsLevel !== "MASTERED")
    .sort((a, b) => a.nextReviewAt.getTime() - b.nextReviewAt.getTime());
  const unseen = CULTURAL_TIPS.filter((t) => !seen.has(t.id));

  const cards: string[] = [];
  const due = scheduled.find((r) => r.nextReviewAt <= now);
  if (due) cards.push(due.contentId);
  if (unseen.length > 0) cards.push(unseen[Math.floor(Math.random() * unseen.length)].id);
  if (cards.length === 0) cards.push(scheduled[0]?.contentId ?? getRandomCulturalTip().id);

  return cards;
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

  // Which kinds of content the learner has already met at least once, so a
  // first-encounter explainer is shown exactly once per kind.
  const learned = Object.fromEntries(
    Object.values(ContentType).map((t) => [t, (learnedByType[t]?.size ?? 0) > 0])
  ) as Record<ContentType, boolean>;

  return {
    items: results.slice(0, budget),
    learned,
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
