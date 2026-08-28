import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ContentType } from "@prisma/client";
import { CULTURAL_TIPS } from "@/lib/cultural-tips";
import { CONVERSATIONS } from "@/lib/conversations";
import { NUMBER_CARDS, buildNumberQuiz } from "@/lib/numbers";
import { SCRIPT_INTRO_LIST } from "@/lib/script-intros";
import { findPhrasesByIds } from "@/lib/phrases";
import { effectiveSrsLevel } from "@/lib/srs";
import { getSessionUser } from "@/lib/simulation";
import { nextStreak } from "@/lib/utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { userId } = session;

  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: { items: { orderBy: { displayOrder: "asc" } } },
  });

  if (!lesson) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (lesson.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const culturalTipMap = new Map(CULTURAL_TIPS.map((t) => [t.id, t]));
  const scriptIntroMap = new Map(SCRIPT_INTRO_LIST.map((t) => [t.id, t]));
  const conversationMap = new Map(CONVERSATIONS.map((c) => [c.id, c]));
  const numberMap = new Map(NUMBER_CARDS.map((c) => [c.id, c]));

  // Four kinds of content live in code rather than in the database — social
  // conventions, explainer cards, conversation rehearsals and the numbers &
  // money cards — and each is recognisable from its id prefix.
  const realItems = lesson.items.filter(
    (i) =>
      !i.contentId.startsWith("cultural-") &&
      !i.contentId.startsWith("intro-") &&
      !i.contentId.startsWith("conv-") &&
      !i.contentId.startsWith("num-")
  );
  const culturalItems = lesson.items.filter((i) => i.contentId.startsWith("cultural-"));
  const scriptIntroItems = lesson.items.filter((i) => i.contentId.startsWith("intro-"));
  const conversationItems = lesson.items.filter((i) => i.contentId.startsWith("conv-"));
  const numberItems = lesson.items.filter((i) => i.contentId.startsWith("num-"));

  const itemsByType = realItems.reduce<Record<string, typeof realItems>>(
    (acc, item) => {
      (acc[item.contentType] ??= []).push(item);
      return acc;
    },
    {}
  );

  const hiraganaIds = (itemsByType[ContentType.HIRAGANA] ?? []).map((i) => i.contentId);
  const katakanaIds = (itemsByType[ContentType.KATAKANA] ?? []).map((i) => i.contentId);
  const kanjiIds = (itemsByType[ContentType.KANJI] ?? []).map((i) => i.contentId);
  const vocabularyIds = (itemsByType[ContentType.VOCABULARY] ?? []).map((i) => i.contentId);
  const phraseIds = (itemsByType[ContentType.PHRASE] ?? []).map((i) => i.contentId);

  const allRealContentIds = realItems.map((i) => i.contentId);
  // Cultural tips carry mastery too, so their reviews are fetched alongside.
  // They are always keyed under CULTURE, including on lesson items written
  // before that content type existed and stored the tip as a PHRASE.
  const reviewContentIds = [
    ...allRealContentIds,
    ...culturalItems.map((i) => i.contentId),
    ...conversationItems.map((i) => i.contentId),
    ...numberItems.map((i) => i.contentId),
  ];

  const [hiragana, katakana, kanji, vocabulary, phrases, reviews] = await Promise.all([
    hiraganaIds.length
      ? prisma.japaneseCharacter.findMany({ where: { id: { in: hiraganaIds } } })
      : [],
    katakanaIds.length
      ? prisma.japaneseCharacter.findMany({ where: { id: { in: katakanaIds } } })
      : [],
    kanjiIds.length ? prisma.kanji.findMany({ where: { id: { in: kanjiIds } } }) : [],
    vocabularyIds.length ? prisma.vocabulary.findMany({ where: { id: { in: vocabularyIds } } }) : [],
    findPhrasesByIds(phraseIds),
    reviewContentIds.length
      ? prisma.review.findMany({
          where: { userId, contentId: { in: reviewContentIds } },
          select: {
            contentId: true,
            contentType: true,
            srsLevel: true,
            totalAttempts: true,
            correctCount: true,
            incorrectCount: true,
            consecutiveSuccesses: true,
            interval: true,
          },
        })
      : [],
  ]);

  const contentMap = new Map<string, unknown>();
  for (const c of [...hiragana, ...katakana]) contentMap.set(c.id, c);
  for (const c of kanji) contentMap.set(c.id, c);
  for (const c of vocabulary) contentMap.set(c.id, c);
  for (const c of phrases) contentMap.set(c.id, c);

  for (const item of culturalItems) {
    const tip = culturalTipMap.get(item.contentId);
    if (tip) contentMap.set(item.contentId, { isCulturalTip: true, ...tip });
  }

  for (const item of scriptIntroItems) {
    const intro = scriptIntroMap.get(item.contentId);
    if (intro) contentMap.set(item.contentId, { isScriptIntro: true, ...intro });
  }

  // The line the learner says is lifted to the top level as japanese/kana/
  // romaji/english, so the say-it-back and listening cards — which know
  // nothing about conversations — can read a rehearsal like any other item,
  // and so lib/speech pronounces it from the kana rather than guessing.
  for (const item of conversationItems) {
    const exchange = conversationMap.get(item.contentId);
    if (exchange) {
      contentMap.set(item.contentId, {
        isConversation: true,
        ...exchange,
        japanese: exchange.say.japanese,
        kana: exchange.say.kana,
        romaji: exchange.say.romaji,
        english: exchange.say.english,
      });
    }
  }

  // The same lift as a rehearsal: the line the learner says goes to the top
  // level so the say-it-back and listening cards can read a numbers card like
  // any other item. The figure quiz is built here rather than in the browser,
  // so distractors can be drawn from the whole deck without shipping it twice.
  for (const item of numberItems) {
    const card = numberMap.get(item.contentId);
    if (card) {
      contentMap.set(item.contentId, {
        isNumbers: true,
        ...card,
        japanese: card.say.japanese,
        kana: card.say.kana,
        romaji: card.say.romaji,
        english: card.say.english,
        quiz: item.exerciseType === "MULTIPLE_CHOICE" ? buildNumberQuiz(card) : undefined,
      });
    }
  }

  const reviewMap = new Map<string, (typeof reviews)[0]>();
  for (const r of reviews) reviewMap.set(`${r.contentType}:${r.contentId}`, r);

  const enrichedItems = lesson.items.map((item) => {
    const lookupType = item.contentId.startsWith("cultural-")
      ? ContentType.CULTURE
      : item.contentId.startsWith("conv-")
        ? ContentType.CONVERSATION
        : item.contentId.startsWith("num-")
          ? ContentType.NUMBERS
          : item.contentType;
    const r = reviewMap.get(`${lookupType}:${item.contentId}`) ?? null;
    return {
      ...item,
      content: contentMap.get(item.contentId) ?? null,
      review: r
        ? {
            srsLevel: effectiveSrsLevel(r),
            totalAttempts: r.totalAttempts,
            correctCount: r.correctCount,
            incorrectCount: r.incorrectCount,
          }
        : null,
    };
  });

  return NextResponse.json({ ...lesson, items: enrichedItems });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { userId } = session;

  const body = await request.json().catch(() => ({}));
  const { completedAt, xpEarned, accuracy, durationSeconds } = body as {
    completedAt?: string;
    xpEarned?: number;
    accuracy?: number;
    durationSeconds?: number;
  };

  const completedDate = completedAt !== undefined ? new Date(completedAt) : undefined;

  const updated = await prisma.lesson.update({
    where: { id, userId },
    data: {
      ...(completedDate !== undefined && { completedAt: completedDate }),
      ...(xpEarned !== undefined && { xpEarned }),
      ...(accuracy !== undefined && { accuracy }),
      ...(durationSeconds !== undefined && { durationSeconds }),
    },
  });

  if (durationSeconds !== undefined && durationSeconds > 0) {
    await prisma.userStatistics.upsert({
      where: { userId },
      create: { userId, totalStudyTime: durationSeconds, lessonsCompleted: 1 },
      update: {
        totalStudyTime: { increment: durationSeconds },
        ...(completedAt !== undefined && { lessonsCompleted: { increment: 1 } }),
      },
    });
  }

  if (completedDate !== undefined) {
    const timeZone = (await cookies()).get("tz")?.value || "UTC";
    const profile = await prisma.userProfile.findUnique({
      where: { id: userId },
      select: { currentStreak: true, longestStreak: true, lastStudiedAt: true },
    });
    if (profile) {
      const { currentStreak, longestStreak } = nextStreak(profile, timeZone, completedDate);
      await prisma.userProfile.update({
        where: { id: userId },
        data: { currentStreak, longestStreak, lastStudiedAt: completedDate },
      });
    }
  }

  return NextResponse.json(updated);
}
