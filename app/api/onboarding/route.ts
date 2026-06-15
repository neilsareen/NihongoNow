import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  await prisma.userProfile.upsert({
    where: { id: user.id },
    create: {
      id: user.id,
      email: user.email!,
      displayName:
        user.user_metadata?.display_name ?? user.email?.split("@")[0],
      nativeLevel: body.nativeLevel,
      studyGoalMinutes: body.studyGoalMinutes ?? 20,
    },
    update: {
      nativeLevel: body.nativeLevel,
      studyGoalMinutes: body.studyGoalMinutes ?? 20,
    },
  });

  await prisma.userStatistics.upsert({
    where: { userId: user.id },
    create: { userId: user.id },
    update: {},
  });

  return NextResponse.json({ ok: true });
}
