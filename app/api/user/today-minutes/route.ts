import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");

  if (!from) {
    return NextResponse.json({ error: "Missing from parameter" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const todayStart = new Date(from);

  const todayStudy = await prisma.lesson.aggregate({
    where: { userId: user.id, completedAt: { gte: todayStart }, durationSeconds: { not: null } },
    _sum: { durationSeconds: true },
  });

  const todayMinutes = Math.round((todayStudy._sum.durationSeconds ?? 0) / 60);
  return NextResponse.json({ todayMinutes });
}
