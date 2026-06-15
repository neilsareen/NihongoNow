import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateDailyLesson } from "@/lib/lesson-generator";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json().catch(() => ({}));
    const lesson = await generateDailyLesson({
      userId: user.id,
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
