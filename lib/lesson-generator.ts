import { prisma } from "./prisma";
import type { KanjiDepth } from "./kanji-tiers";
import { ContentType, ExerciseType } from "@prisma/client";
import { CULTURAL_TIPS, getRandomCulturalTip } from "./cultural-tips";
import { CONVERSATIONS } from "./conversations";
import { NUMBER_CARDS } from "./numbers";
import { SCRIPT_INTROS, type ScriptIntroKey } from "./script-intros";
import {
  getMasteredKana,
  filterUnlockedReviews,
  getKanjiDepth,
  getUnlockedKanji,
  getUnlockedVocabulary,
  getUnlockedPhrases,
  isConversationUnlocked,
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
// How many overdue numbers & money cards a lesson carries, on top of one the
// learner has never met. Two rather than the one the other ride-along tracks
// take — see pickNumberCards.
const DUE_NUMBER_CARDS_PER_LESSON = 2;

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
  [ContentType.CONVERSATION]: 45, // a rehearsal card carries a line, a reply and a pattern
  [ContentType.NUMBERS]:      32, // avg of SCENARIO/MULTIPLE_CHOICE/SPEAKING/LISTENING
};

const AVG_SECONDS_PER_ITEM = 25;

// Content types that get dedicated slots in every lesson, and so must be kept
// out of the general review pool: drawing them twice would put the same card
// in front of the learner twice in one sitting.
const OWN_SLOT_TYPES: ContentType[] = [
  ContentType.CULTURE,
  ContentType.CONVERSATION,
  ContentType.NUMBERS,
];

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
  // SCENARIO first, so a first encounter is always the full rehearsal card
  // (see pickExerciseType). Reviews then rotate through saying it back and
  // hearing it cold, which is the skill the track exists to build.
  CONVERSATION: [ExerciseType.SCENARIO, ExerciseType.SPEAKING, ExerciseType.LISTENING],
  // SCENARIO first for the same reason: a first encounter is the teaching card
  // that lays out the whole table. Reviews rotate onto the figure quiz — which
  // is the skill the track exists for, reading a printed number aloud — and
  // onto saying and hearing the card's own line.
  NUMBERS: [ExerciseType.SCENARIO, ExerciseType.MULTIPLE_CHOICE, ExerciseType.SPEAKING, ExerciseType.LISTENING],
};

export async function generateDailyLesson(config: LessonConfig) {
  const { userId } = config;
  const now = new Date();

  const cultureCardIds = await pickCultureCards(userId, now);
  // Conversation is the only track with a gate of its own, so it is resolved
  // here rather than in getNewContent: until every kana is at Learning the
  // picker returns nothing and the lesson is exactly what it was before.
  const conversation = await pickConversationCards(userId, now);
  // Numbers & money rides in every lesson from the first one — no gate, because
  // a price tag is readable before the alphabet is. See lib/numbers.ts.
  const numbers = await pickNumberCards(userId, now);
  const cultureSeconds = cultureCardIds.length * SECONDS_PER_EXERCISE[ExerciseType.SCENARIO];
  const conversationSeconds = conversation.items.reduce(
    (sum, item) => sum + SECONDS_PER_EXERCISE[item.exerciseType],
    0
  );
  const numberSeconds = numbers.items.reduce(
    (sum, item) => sum + SECONDS_PER_EXERCISE[item.exerciseType],
    0
  );
  const effectiveBudget =
    TARGET_LESSON_SECONDS - cultureSeconds - conversationSeconds - numberSeconds;
  const reviewBudget = Math.floor(effectiveBudget * 0.7);

  // Both are settled once and threaded down, so every place a lesson can pick
  // up a kanji applies the same ceiling. A depth honoured in only some of them
  // would be worse than none: the learner would still meet the characters they
  // asked not to see, just less predictably.
  const [masteredKana, kanjiDepth] = await Promise.all([
    getMasteredKana(userId),
    getKanjiDepth(userId),
  ]);

  // Fetch more than we'll use; trim by time budget. Reviews are then filtered
  // to content the learner can actually read: someone who studied kanji before
  // this gate existed still has those reviews on file, and they must not keep
  // resurfacing while their readings use kana that isn't mastered yet.
  // Culture and conversation have their own slots below, so they stay out of
  // the general pool — otherwise a due card could land in the lesson twice.
  const fetchedReviews = await prisma.review.findMany({
    where: {
      userId,
      nextReviewAt: { lte: now },
      srsLevel: { not: "MASTERED" },
      contentType: { notIn: OWN_SLOT_TYPES },
    },
    orderBy: [{ srsLevel: "asc" }, { nextReviewAt: "asc" }],
    take: 60,
  });
  const allDueReviews = await filterUnlockedReviews(fetchedReviews, masteredKana, kanjiDepth);

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
    await getNewContent(userId, newItemBudget, weakTypes, masteredKana, kanjiDepth);
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
  // Conversation rides along the same way: a rehearsal or two placed among the
  // drills rather than bolted onto the end, where a tiring lesson would eat it.
  const ridealongItems: LessonItemSpec[] = [
    ...cultureItems,
    ...conversation.items,
    ...numbers.items,
  ];
  const firstSlot = 2 + Math.floor(Math.random() * 4);
  const slotGap = Math.max(2, Math.floor(baseItems.length / (ridealongItems.length + 1)));
  const withCulture: LessonItemSpec[] = [...baseItems];
  for (let i = ridealongItems.length - 1; i >= 0; i--) {
    withCulture.splice(Math.min(withCulture.length, firstSlot + slotGap * i), 0, ridealongItems[i]);
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
  // Conversation's items come from their own picker rather than newItems, so
  // its explainer is triggered by that picker having found a first exchange.
  if (!learned.CONVERSATION && conversation.introducesFirst) scriptIntroItems.push(introCard("conversation"));
  // Numbers comes from its own picker too, so its explainer follows the same
  // signal. It lands in the very first lesson, which is the point of the track.
  if (!learned.NUMBERS && numbers.introducesFirst) scriptIntroItems.push(introCard("numbers"));

  const finalItems = [...scriptIntroItems, ...withCulture];

  const paddedItems = await padToMinimumDuration(finalItems, userId, now, masteredKana, kanjiDepth);

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
 *
 * A learner who has ridden everything all the way to MASTERED has nothing
 * left in that first pool either, so a second pass reaches into mastered
 * content too — a slightly-early refresher beats a lesson that is just the
 * culture card.
 */
async function padToMinimumDuration(
  items: LessonItemSpec[],
  userId: string,
  now: Date,
  masteredKana: MasteredKana,
  kanjiDepth: KanjiDepth
): Promise<LessonItemSpec[]> {
  if (estimateSeconds(items) >= MIN_LESSON_SECONDS) return items;

  const usedIds = new Set(items.map((i) => `${i.contentType}:${i.contentId}`));
  const padded = [...items];

  const addFrom = async (srsFilter: object) => {
    if (estimateSeconds(padded) >= MIN_LESSON_SECONDS) return;
    const upcomingReviews = await prisma.review.findMany({
      where: {
        userId,
        nextReviewAt: { gt: now },
        ...srsFilter,
        contentType: { notIn: OWN_SLOT_TYPES },
      },
      orderBy: { nextReviewAt: "asc" },
      take: 30,
    });
    const unlockedUpcoming = await filterUnlockedReviews(upcomingReviews, masteredKana, kanjiDepth);

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
  };

  await addFrom({ srsLevel: { not: "MASTERED" } });
  await addFrom({ srsLevel: "MASTERED" });

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

/**
 * The conversation cards a lesson should carry, and whether one of them is the
 * learner's very first — which is what triggers the track's explainer.
 *
 * Locked until every kana is at Learning, so this returns nothing at all for
 * most of a learner's first weeks. Once open it works like the culture picker:
 * the most overdue rehearsal plus one exchange never met, so the track always
 * moves forward and never only backwards.
 *
 * Exercise types differ between the two. A first encounter is always the full
 * SCENARIO rehearsal — situation, line, the reply coming back, the pattern
 * underneath — because that is the teaching card. A review rotates onto saying
 * it back or hearing it cold, since recognising and producing the chunk under
 * time pressure is what the track is actually for.
 */
async function pickConversationCards(
  userId: string,
  now: Date
): Promise<{ items: LessonItemSpec[]; introducesFirst: boolean }> {
  if (!(await isConversationUnlocked(userId))) {
    return { items: [], introducesFirst: false };
  }

  const reviews = await prisma.review.findMany({
    where: { userId, contentType: ContentType.CONVERSATION },
    select: { contentId: true, nextReviewAt: true, srsLevel: true },
  });

  const seen = new Set(reviews.map((r) => r.contentId));
  const scheduled = reviews
    .filter((r) => r.srsLevel !== "MASTERED")
    .sort((a, b) => a.nextReviewAt.getTime() - b.nextReviewAt.getTime());
  // Curriculum order, not random: the chunks that carry an entire trip come
  // before the ones for a single counter.
  const unseen = CONVERSATIONS.filter((c) => !seen.has(c.id));

  const items: LessonItemSpec[] = [];
  const due = scheduled.find((r) => r.nextReviewAt <= now);
  if (due) {
    items.push({
      contentType: ContentType.CONVERSATION,
      contentId: due.contentId,
      exerciseType: pickExerciseType(ContentType.CONVERSATION, due.srsLevel),
    });
  }
  if (unseen.length > 0) {
    items.push({
      contentType: ContentType.CONVERSATION,
      contentId: unseen[0].id,
      exerciseType: ExerciseType.SCENARIO,
    });
  }
  // Everything met and nothing due yet: pull the next one forward rather than
  // letting a newly opened track go quiet.
  if (items.length === 0 && scheduled.length > 0) {
    items.push({
      contentType: ContentType.CONVERSATION,
      contentId: scheduled[0].contentId,
      exerciseType: pickExerciseType(ContentType.CONVERSATION, scheduled[0].srsLevel),
    });
  }

  return { items, introducesFirst: seen.size === 0 && items.length > 0 };
}

/**
 * The numbers & money cards a lesson should carry, and whether one of them is
 * the learner's very first — which is what triggers the track's explainer.
 *
 * Unlike conversation there is no gate, so this runs from lesson one. The
 * shape is otherwise the culture picker's — the overdue cards plus one never
 * met, so the track always moves forward and never only backwards, and a
 * learner who is caught up still gets the next one pulled forward rather than
 * a silent slot.
 *
 * It takes two overdue cards where the other ride-along tracks take one. That
 * is the weighting the track is meant to carry: numbers are the one part of a
 * trip that cannot be mimed (see the header of lib/numbers.ts), and a review
 * here is usually the twenty-second figure quiz rather than a full card, so
 * the extra slot costs the lesson very little.
 */
async function pickNumberCards(
  userId: string,
  now: Date
): Promise<{ items: LessonItemSpec[]; introducesFirst: boolean }> {
  const reviews = await prisma.review.findMany({
    where: { userId, contentType: ContentType.NUMBERS },
    select: { contentId: true, nextReviewAt: true, srsLevel: true },
  });

  const seen = new Set(reviews.map((r) => r.contentId));
  const scheduled = reviews
    .filter((r) => r.srsLevel !== "MASTERED")
    .sort((a, b) => a.nextReviewAt.getTime() - b.nextReviewAt.getTime());
  // Curriculum order, not random: the digits have to come before the prices
  // that are built out of them.
  const unseen = NUMBER_CARDS.filter((c) => !seen.has(c.id));

  const items: LessonItemSpec[] = [];
  const due = scheduled.filter((r) => r.nextReviewAt <= now).slice(0, DUE_NUMBER_CARDS_PER_LESSON);
  for (const r of due) {
    items.push({
      contentType: ContentType.NUMBERS,
      contentId: r.contentId,
      exerciseType: pickExerciseType(ContentType.NUMBERS, r.srsLevel),
    });
  }
  if (unseen.length > 0) {
    items.push({
      contentType: ContentType.NUMBERS,
      contentId: unseen[0].id,
      exerciseType: ExerciseType.SCENARIO,
    });
  }
  if (items.length === 0 && scheduled.length > 0) {
    items.push({
      contentType: ContentType.NUMBERS,
      contentId: scheduled[0].contentId,
      exerciseType: pickExerciseType(ContentType.NUMBERS, scheduled[0].srsLevel),
    });
  }

  return { items, introducesFirst: seen.size === 0 && items.length > 0 };
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
  masteredKana: MasteredKana,
  kanjiDepth: KanjiDepth
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
    getUnlockedKanji(masteredKana, [...(learnedByType[ContentType.KANJI] ?? [])], kanjiDepth),
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
  // Half of a numbers review is the figure quiz. Reading 1,500円 aloud without
  // being shown the answer first is the skill the whole track is for, and the
  // other three card shapes all reveal the reading rather than ask for it.
  if (contentType === ContentType.NUMBERS && Math.random() < 0.5) {
    return ExerciseType.MULTIPLE_CHOICE;
  }
  const picked = types[Math.floor(Math.random() * types.length)];
  // Half of a vocabulary review's English-to-Japanese turns ask the learner to
  // type the romaji instead of just flipping the card, so production gets
  // checked rather than taken on trust. First encounters stay pure flip cards
  // above — nothing to type yet for a word never seen before.
  if (contentType === ContentType.VOCABULARY && picked === ExerciseType.ENGLISH_TO_JAPANESE && Math.random() < 0.5) {
    return ExerciseType.FILL_IN_BLANK;
  }
  return picked;
}
