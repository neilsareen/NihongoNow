import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getKanjiDepth, getMasteredKana, filterUnlockedReviews } from "@/lib/progression";
import { ExerciseType } from "@prisma/client";
import { getSessionUser } from "@/lib/simulation";

const EXERCISE_FOR_TYPE: Record<string, ExerciseType> = {
  HIRAGANA: ExerciseType.CHARACTER_RECOGNITION,
  KATAKANA: ExerciseType.CHARACTER_RECOGNITION,
  KANJI: ExerciseType.JAPANESE_TO_ENGLISH,
  VOCABULARY: ExerciseType.ENGLISH_TO_JAPANESE,
  PHRASE: ExerciseType.JAPANESE_TO_ENGLISH,
  CULTURE: ExerciseType.SCENARIO,
  // A weak rehearsal is re-run as the full situation card, not as a say-it-back:
  // the point of drilling it again is the moment, not the microphone.
  CONVERSATION: ExerciseType.SCENARIO,
  // A weak numbers card is re-run as the figure quiz rather than the teaching
  // card: it is already met, and what went wrong was reading the figure.
  NUMBERS: ExerciseType.MULTIPLE_CHOICE,
};

export async function POST() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { userId } = session;

  // Same readability gate as the daily lesson, so content whose reading isn't
  // unlocked yet can't sneak back in through the weakest-items shortcut.
  const masteredKana = await getMasteredKana(userId);

  const fetched = await prisma.review.findMany({
    where: {
      userId,
      totalAttempts: { gte: 3 },
      srsLevel: { not: "MASTERED" },
    },
    orderBy: [{ correctCount: "asc" }, { totalAttempts: "desc" }],
    take: 30,
  });
  const reviews = (await filterUnlockedReviews(fetched, masteredKana, await getKanjiDepth(userId))).slice(0, 15);

  if (reviews.length === 0) {
    return NextResponse.json({ error: "No weak items found — keep studying!" }, { status: 404 });
  }

  const lesson = await prisma.lesson.create({
    data: {
      userId,
      items: {
        create: reviews.map((r, i) => ({
          contentType: r.contentType,
          contentId: r.contentId,
          exerciseType: EXERCISE_FOR_TYPE[r.contentType] ?? ExerciseType.CHARACTER_RECOGNITION,
          displayOrder: i,
        })),
      },
    },
    include: { items: { orderBy: { displayOrder: "asc" } } },
  });

  return NextResponse.json({ lessonId: lesson.id });
}
