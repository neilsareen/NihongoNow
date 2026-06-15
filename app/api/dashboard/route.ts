import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [profile, stats, progress, reviewsDue] = await Promise.all([
    prisma.userProfile.findUnique({ where: { id: user.id } }),
    prisma.userStatistics.findUnique({ where: { userId: user.id } }),
    prisma.userProgress.findMany({ where: { userId: user.id } }),
    prisma.review.count({
      where: {
        userId: user.id,
        nextReviewAt: { lte: new Date() },
        srsLevel: { not: "MASTERED" },
      },
    }),
  ]);

  return NextResponse.json({ profile, stats, progress, reviewsDue });
}
