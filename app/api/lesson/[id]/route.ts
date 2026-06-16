import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { ContentType } from "@prisma/client";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: { items: { orderBy: { displayOrder: "asc" } } },
  });

  if (!lesson) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (lesson.userId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const itemsByType = lesson.items.reduce<Record<string, typeof lesson.items>>(
    (acc, item) => {
      (acc[item.contentType] ??= []).push(item);
      return acc;
    },
    {}
  );

  const hiraganaIds = (itemsByType[ContentType.HIRAGANA] ?? []).map((i) => i.contentId);
  const katakanaIds = (itemsByType[ContentType.KATAKANA] ?? []).map((i) => i.contentId);
  const kanjiIds = (itemsByType[ContentType.KANJI] ?? []).map((i) => i.contentId);
  const vocabularyIds = (itemsByType[ContentType.VOCABULARY] ?? []).map((i) => i.contentId);
  const phraseIds = (itemsByType[ContentType.PHRASE] ?? []).map((i) => i.contentId);

  const [hiragana, katakana, kanji, vocabulary, phrases] = await Promise.all([
    hiraganaIds.length
      ? prisma.japaneseCharacter.findMany({ where: { id: { in: hiraganaIds } } })
      : [],
    katakanaIds.length
      ? prisma.japaneseCharacter.findMany({ where: { id: { in: katakanaIds } } })
      : [],
    kanjiIds.length ? prisma.kanji.findMany({ where: { id: { in: kanjiIds } } }) : [],
    vocabularyIds.length ? prisma.vocabulary.findMany({ where: { id: { in: vocabularyIds } } }) : [],
    phraseIds.length ? prisma.phrase.findMany({ where: { id: { in: phraseIds } } }) : [],
  ]);

  const contentMap = new Map<string, unknown>();
  for (const c of [...hiragana, ...katakana]) contentMap.set(c.id, c);
  for (const c of kanji) contentMap.set(c.id, c);
  for (const c of vocabulary) contentMap.set(c.id, c);
  for (const c of phrases) contentMap.set(c.id, c);

  const enrichedItems = lesson.items.map((item) => ({
    ...item,
    content: contentMap.get(item.contentId) ?? null,
  }));

  return NextResponse.json({ ...lesson, items: enrichedItems });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { completedAt, xpEarned, accuracy } = body as {
    completedAt?: string;
    xpEarned?: number;
    accuracy?: number;
  };

  const updated = await prisma.lesson.update({
    where: { id, userId: user.id },
    data: {
      ...(completedAt !== undefined && { completedAt: new Date(completedAt) }),
      ...(xpEarned !== undefined && { xpEarned }),
      ...(accuracy !== undefined && { accuracy }),
    },
  });

  return NextResponse.json(updated);
}
