import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getMasteredKana, filterUnlockedReviews } from "@/lib/progression";
import { ExerciseType } from "@prisma/client";

const EXERCISE_FOR_TYPE: Record<string, ExerciseType> = {
  HIRAGANA: ExerciseType.CHARACTER_RECOGNITION,
  KATAKANA: ExerciseType.CHARACTER_RECOGNITION,
  KANJI: ExerciseType.JAPANESE_TO_ENGLISH,
  VOCABULARY: ExerciseType.ENGLISH_TO_JAPANESE,
  PHRASE: ExerciseType.JAPANESE_TO_ENGLISH,
  CULTURE: ExerciseType.SCENARIO,
};

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Same readability gate as the daily lesson, so content whose reading isn't
  // unlocked yet can't sneak back in through the weakest-items shortcut.
  const masteredKana = await getMasteredKana(user.id);

  const fetched = await prisma.review.findMany({
    where: {
      userId: user.id,
      totalAttempts: { gte: 3 },
      srsLevel: { not: "MASTERED" },
    },
    orderBy: [{ correctCount: "asc" }, { totalAttempts: "desc" }],
    take: 30,
  });
  const reviews = (await filterUnlockedReviews(fetched, masteredKana)).slice(0, 15);

  if (reviews.length === 0) {
    return NextResponse.json({ error: "No weak items found — keep studying!" }, { status: 404 });
  }

  const lesson = await prisma.lesson.create({
    data: {
      userId: user.id,
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
