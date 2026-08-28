import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { toFirstName } from "@/lib/utils";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const metadata = user.user_metadata ?? {};

  await prisma.userProfile.upsert({
    where: { id: user.id },
    create: {
      id: user.id,
      email: user.email!,
      // Seeded from whatever the provider knows, reduced to a first name:
      // Google returns a full legal name and nothing else, and the greeting
      // wants one name. It is a starting point only — Settings is where the
      // learner writes the name they actually go by.
      displayName:
        toFirstName(metadata.display_name) ??
        toFirstName(metadata.given_name) ??
        toFirstName(metadata.full_name ?? metadata.name) ??
        user.email?.split("@")[0],
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
