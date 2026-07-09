import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { AVATAR_OPTIONS } from "@/lib/utils";

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
  const { studyGoalMinutes, displayName, avatarUrl } = body as {
    studyGoalMinutes?: number;
    displayName?: string;
    avatarUrl?: string;
  };

  if (avatarUrl !== undefined && !AVATAR_OPTIONS.some((a) => a.key === avatarUrl)) {
    return NextResponse.json({ error: "Invalid avatar" }, { status: 400 });
  }

  const profile = await prisma.userProfile.update({
    where: { id: user.id },
    data: {
      ...(studyGoalMinutes !== undefined && { studyGoalMinutes }),
      ...(displayName !== undefined && { displayName }),
      ...(avatarUrl !== undefined && { avatarUrl }),
    },
  });

  return NextResponse.json(profile);
}
