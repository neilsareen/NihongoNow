import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/simulation";

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { userId } = session;

  const [profile, stats, progress, reviewsDue] = await Promise.all([
    prisma.userProfile.findUnique({ where: { id: userId } }),
    prisma.userStatistics.findUnique({ where: { userId } }),
    prisma.userProgress.findMany({ where: { userId } }),
    prisma.review.count({
      where: {
        userId,
        nextReviewAt: { lte: new Date() },
        srsLevel: { not: "MASTERED" },
      },
    }),
  ]);

  return NextResponse.json({ profile, stats, progress, reviewsDue });
}
