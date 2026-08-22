import { NextResponse } from "next/server";
import { hasAnyUnlockedKanji, getConversationGate } from "@/lib/progression";
import { getSessionUser } from "@/lib/simulation";

// Exposes which stages of content the learner has unlocked, so the client can
// present locked content as locked instead of offering it and then failing.
export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [kanjiUnlocked, conversation] = await Promise.all([
    hasAnyUnlockedKanji(session.userId),
    getConversationGate(session.userId),
  ]);
  return NextResponse.json({ kanjiUnlocked, conversation });
}
