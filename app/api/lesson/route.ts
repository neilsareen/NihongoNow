import { NextResponse } from "next/server";
import { generateDailyLesson } from "@/lib/lesson-generator";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/simulation";

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.userId;

  try {
    const body = await request.json().catch(() => ({}));

    const inProgress = await prisma.lesson.findFirst({
      where: { userId, completedAt: null },
      orderBy: { generatedAt: "desc" },
      include: { items: { orderBy: { displayOrder: "asc" } } },
    });

    if (inProgress) {
      const hasUnanswered = inProgress.items.some((item) => item.answeredAt === null);
      if (hasUnanswered) {
        return NextResponse.json(inProgress);
      }
    }

    const lesson = await generateDailyLesson({
      userId,
      targetMinutes: body.targetMinutes ?? 20,
    });
    return NextResponse.json(lesson);
  } catch (err) {
    console.error("Lesson generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate lesson" },
      { status: 500 }
    );
  }
}
