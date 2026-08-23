import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ContentType } from "@prisma/client";
import {
  getMasteredKana,
  getUnlockedVocabulary,
  getUnlockedPhrases,
} from "@/lib/progression";
import { findPhrasesByIds } from "@/lib/phrases";
import { getSessionUser } from "@/lib/simulation";

// Words for the speaking drill. Weakest first, because saying a word is the
// slowest kind of practice in the app and the queue should spend that time on
// the words that need it, topped up with readable words the learner hasn't met
// yet so the drill never runs dry.

const TARGET_ITEMS = 20;
const NEW_ITEM_SHARE = 6;

export interface SpeakItem {
  id: string;
  contentType: "VOCABULARY" | "PHRASE";
  japanese: string;
  kana: string;
  romaji: string;
  english: string;
  /** Not in the learner's schedule yet — taught before it is tested. */
  isNew: boolean;
}

type SpeakableRow = {
  id: string;
  japanese: string;
  kana: string;
  romaji: string;
  english: string;
};

function toItem(
  row: SpeakableRow,
  contentType: SpeakItem["contentType"],
  isNew: boolean
): SpeakItem {
  return {
    id: row.id,
    contentType,
    japanese: row.japanese,
    kana: row.kana,
    romaji: row.romaji,
    english: row.english,
    isNew,
  };
}

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { userId } = session;

  const reviews = await prisma.review.findMany({
    where: {
      userId,
      contentType: { in: [ContentType.VOCABULARY, ContentType.PHRASE] },
    },
    select: {
      contentId: true,
      contentType: true,
      correctCount: true,
      totalAttempts: true,
    },
  });

  const learnedVocabIds = reviews
    .filter((r) => r.contentType === ContentType.VOCABULARY)
    .map((r) => r.contentId);
  const learnedPhraseIds = reviews
    .filter((r) => r.contentType === ContentType.PHRASE)
    .map((r) => r.contentId);

  const masteredKana = await getMasteredKana(userId);

  const [learnedVocab, learnedPhrases, unlockedVocab, unlockedPhrases] = await Promise.all([
    learnedVocabIds.length
      ? prisma.vocabulary.findMany({ where: { id: { in: learnedVocabIds } } })
      : [],
    findPhrasesByIds(learnedPhraseIds),
    // Same gate as the lesson generator: nothing is offered whose reading uses
    // kana the learner hasn't mastered.
    getUnlockedVocabulary(masteredKana, learnedVocabIds),
    getUnlockedPhrases(masteredKana, learnedPhraseIds),
  ]);

  // Lower is weaker. An item never attempted sits in the middle: worth
  // practising, but not ahead of one that has actually been missed.
  const accuracyById = new Map<string, number>();
  for (const r of reviews) {
    accuracyById.set(
      r.contentId,
      r.totalAttempts > 0 ? r.correctCount / r.totalAttempts : 0.5
    );
  }

  const learned: SpeakItem[] = [
    ...learnedVocab.map((v) => toItem(v, "VOCABULARY", false)),
    ...learnedPhrases.map((p) => toItem(p, "PHRASE", false)),
  ]
    .filter((i) => i.kana)
    .sort((a, b) => (accuracyById.get(a.id) ?? 1) - (accuracyById.get(b.id) ?? 1));

  const newCount = Math.min(
    NEW_ITEM_SHARE,
    unlockedVocab.length + unlockedPhrases.length,
    Math.max(0, TARGET_ITEMS - Math.min(learned.length, TARGET_ITEMS - NEW_ITEM_SHARE))
  );

  // The unlocked helpers return only what they need to test readability, so
  // the handful actually being served is re-read in full here.
  const freshVocabIds = unlockedVocab.slice(0, newCount).map((v) => v.id);
  const freshPhraseIds = unlockedPhrases
    .slice(0, Math.max(0, newCount - freshVocabIds.length))
    .map((p) => p.id);

  const [freshVocab, freshPhrases] = await Promise.all([
    freshVocabIds.length
      ? prisma.vocabulary.findMany({ where: { id: { in: freshVocabIds } } })
      : [],
    findPhrasesByIds(freshPhraseIds),
  ]);

  const fresh: SpeakItem[] = [
    ...freshVocab.map((v) => toItem(v, "VOCABULARY", true)),
    ...freshPhrases.map((p) => toItem(p, "PHRASE", true)),
  ].filter((i) => i.kana);

  const items = [...learned.slice(0, TARGET_ITEMS - fresh.length), ...fresh];

  return NextResponse.json({
    items,
    // Nothing readable yet: the learner is still on kana, and every word's
    // reading uses kana they haven't mastered.
    locked: items.length === 0,
  });
}
