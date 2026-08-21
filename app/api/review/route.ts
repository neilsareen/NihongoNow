import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateNextReview, isMastered, type SRSQuality } from "@/lib/srs";
import { ContentType, LearningStage } from "@prisma/client";
import { getSessionUser } from "@/lib/simulation";

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { userId } = session;

  const body = await request.json();
  const { contentType, contentId, quality, lessonItemId } = body as {
    contentType: ContentType;
    contentId: string;
    quality: SRSQuality;
    lessonItemId?: string;
  };

  const correct = quality >= 3;

  const existing = await prisma.review.findUnique({
    where: {
      userId_contentType_contentId: {
        userId: userId,
        contentType,
        contentId,
      },
    },
  });

  const currentItem = existing ?? {
    easeFactor: 2.5,
    interval: 0,
    consecutiveSuccesses: 0,
    srsLevel: "NEW" as const,
  };

  const correctCount = (existing?.correctCount ?? 0) + (correct ? 1 : 0);
  const totalAttempts = (existing?.totalAttempts ?? 0) + 1;
  // The tallies include this answer, so the level reflects the attempt just made.
  const next = calculateNextReview(currentItem, quality, { correctCount, totalAttempts });
  const mastered = isMastered(correctCount, totalAttempts, next.consecutiveSuccesses);

  const review = await prisma.review.upsert({
    where: {
      userId_contentType_contentId: {
        userId: userId,
        contentType,
        contentId,
      },
    },
    create: {
      userId: userId,
      contentType,
      contentId,
      ...next,
      srsLevel: mastered ? "MASTERED" : next.srsLevel,
      correctCount,
      incorrectCount: correct ? 0 : 1,
      totalAttempts,
      lastReviewedAt: new Date(),
    },
    update: {
      ...next,
      srsLevel: mastered ? "MASTERED" : next.srsLevel,
      correctCount,
      incorrectCount: { increment: correct ? 0 : 1 },
      totalAttempts,
      lastReviewedAt: new Date(),
    },
  });

  if (lessonItemId) {
    await prisma.lessonItem.update({
      where: { id: lessonItemId },
      data: { correct, answeredAt: new Date() },
    });
  }

  await prisma.userStatistics.upsert({
    where: { userId: userId },
    create: {
      userId: userId,
      totalReviews: 1,
      correctReviews: correct ? 1 : 0,
    },
    update: {
      totalReviews: { increment: 1 },
      correctReviews: { increment: correct ? 1 : 0 },
    },
  });

  const contentTypeToStage: Record<ContentType, LearningStage> = {
    HIRAGANA: LearningStage.HIRAGANA,
    KATAKANA: LearningStage.KATAKANA,
    VOCABULARY: LearningStage.CORE_VOCAB,
    KANJI: LearningStage.ESSENTIAL_KANJI,
    PHRASE: LearningStage.DAILY_CONVERSATION,
    CULTURE: LearningStage.CULTURE,
  };

  const stage = contentTypeToStage[contentType];

  const [totalItems, masteredItems] = await Promise.all([
    prisma.review.count({
      where: { userId: userId, contentType },
    }),
    prisma.review.count({
      where: { userId: userId, contentType, srsLevel: "MASTERED" },
    }),
  ]);

  await prisma.userProgress.upsert({
    where: { userId_stage: { userId: userId, stage } },
    create: { userId: userId, stage, totalItems, masteredItems },
    update: { totalItems, masteredItems },
  });

  return NextResponse.json({ review, mastered });
}
