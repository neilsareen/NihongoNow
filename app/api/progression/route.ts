import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasAnyUnlockedKanji } from "@/lib/progression";

// Exposes which stages of content the learner has unlocked, so the client can
// present locked content as locked instead of offering it and then failing.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const kanjiUnlocked = await hasAnyUnlockedKanji(user.id);
  return NextResponse.json({ kanjiUnlocked });
}
