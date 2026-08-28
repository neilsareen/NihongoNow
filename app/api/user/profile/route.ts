import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { AVATAR_OPTIONS } from "@/lib/utils";
import { KANJI_TIERS, type KanjiDepth } from "@/lib/kanji-tiers";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({ where: { id: user.id } });
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(profile);
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { studyGoalMinutes, displayName, avatarUrl, kanjiDepth } = body as {
    studyGoalMinutes?: number;
    displayName?: string;
    avatarUrl?: string;
    kanjiDepth?: string;
  };

  if (avatarUrl !== undefined && !AVATAR_OPTIONS.some((a) => a.key === avatarUrl)) {
    return NextResponse.json({ error: "Invalid avatar" }, { status: 400 });
  }

  // Validated against the tier list rather than cast: the value decides how
  // much of the corpus a learner is ever served, so an unrecognised one has to
  // be refused rather than written through and quietly widening their study set.
  if (kanjiDepth !== undefined && !KANJI_TIERS.includes(kanjiDepth as KanjiDepth)) {
    return NextResponse.json({ error: "Invalid kanji depth" }, { status: 400 });
  }

  const profile = await prisma.userProfile.update({
    where: { id: user.id },
    data: {
      ...(studyGoalMinutes !== undefined && { studyGoalMinutes }),
      ...(displayName !== undefined && { displayName }),
      ...(avatarUrl !== undefined && { avatarUrl }),
      ...(kanjiDepth !== undefined && { kanjiDepth: kanjiDepth as KanjiDepth }),
    },
  });

  return NextResponse.json(profile);
}
