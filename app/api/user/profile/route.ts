import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

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
  const { studyGoalMinutes, displayName, showRomaji } = body as {
    studyGoalMinutes?: number;
    displayName?: string;
    showRomaji?: boolean;
  };

  const profile = await prisma.userProfile.update({
    where: { id: user.id },
    data: {
      ...(studyGoalMinutes !== undefined && { studyGoalMinutes }),
      ...(displayName !== undefined && { displayName }),
      ...(showRomaji !== undefined && { showRomaji }),
    },
  });

  return NextResponse.json(profile);
}
