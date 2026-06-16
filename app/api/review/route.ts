import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { calculateNextReview, isMastered, type SRSQuality } from "@/lib/srs";
import { ContentType, LearningStage } from "@prisma/client";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
        userId: user.id,
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

  const next = calculateNextReview(currentItem, quality);
  const correctCount = (existing?.correctCount ?? 0) + (correct ? 1 : 0);
  const totalAttempts = (existing?.totalAttempts ?? 0) + 1;
  const mastered = isMastered(correctCount, totalAttempts, next.consecutiveSuccesses);

  const review = await prisma.review.upsert({
    where: {
      userId_contentType_contentId: {
        userId: user.id,
        contentType,
        contentId,
      },
    },
    create: {
      userId: user.id,
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
    where: { userId: user.id },
    create: {
      userId: user.id,
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
  };

  const stage = contentTypeToStage[contentType];

  const [totalItems, masteredItems] = await Promise.all([
    prisma.review.count({
      where: { userId: user.id, contentType },
    }),
    prisma.review.count({
      where: { userId: user.id, contentType, srsLevel: "MASTERED" },
    }),
  ]);

  await prisma.userProgress.upsert({
    where: { userId_stage: { userId: user.id, stage } },
    create: { userId: user.id, stage, totalItems, masteredItems },
    update: { totalItems, masteredItems },
  });

  return NextResponse.json({ review, mastered });
}
