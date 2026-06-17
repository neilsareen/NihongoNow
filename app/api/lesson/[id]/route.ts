import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { ContentType } from "@prisma/client";
import { CULTURAL_TIPS } from "@/lib/cultural-tips";

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

  const culturalTipMap = new Map(CULTURAL_TIPS.map((t) => [t.id, t]));

  const realItems = lesson.items.filter((i) => !i.contentId.startsWith("cultural-"));
  const culturalItems = lesson.items.filter((i) => i.contentId.startsWith("cultural-"));

  const itemsByType = realItems.reduce<Record<string, typeof realItems>>(
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

  const allRealContentIds = realItems.map((i) => i.contentId);

  const [hiragana, katakana, kanji, vocabulary, phrases, reviews] = await Promise.all([
    hiraganaIds.length
      ? prisma.japaneseCharacter.findMany({ where: { id: { in: hiraganaIds } } })
      : [],
    katakanaIds.length
      ? prisma.japaneseCharacter.findMany({ where: { id: { in: katakanaIds } } })
      : [],
    kanjiIds.length ? prisma.kanji.findMany({ where: { id: { in: kanjiIds } } }) : [],
    vocabularyIds.length ? prisma.vocabulary.findMany({ where: { id: { in: vocabularyIds } } }) : [],
    phraseIds.length ? prisma.phrase.findMany({ where: { id: { in: phraseIds } } }) : [],
    allRealContentIds.length
      ? prisma.review.findMany({
          where: { userId: user.id, contentId: { in: allRealContentIds } },
          select: {
            contentId: true,
            contentType: true,
            srsLevel: true,
            totalAttempts: true,
            correctCount: true,
          },
        })
      : [],
  ]);

  const contentMap = new Map<string, unknown>();
  for (const c of [...hiragana, ...katakana]) contentMap.set(c.id, c);
  for (const c of kanji) contentMap.set(c.id, c);
  for (const c of vocabulary) contentMap.set(c.id, c);
  for (const c of phrases) contentMap.set(c.id, c);

  for (const item of culturalItems) {
    const tip = culturalTipMap.get(item.contentId);
    if (tip) contentMap.set(item.contentId, { isCulturalTip: true, ...tip });
  }

  const reviewMap = new Map<string, (typeof reviews)[0]>();
  for (const r of reviews) reviewMap.set(`${r.contentType}:${r.contentId}`, r);

  const enrichedItems = lesson.items.map((item) => {
    const r = reviewMap.get(`${item.contentType}:${item.contentId}`) ?? null;
    return {
      ...item,
      content: contentMap.get(item.contentId) ?? null,
      review: r
        ? { srsLevel: r.srsLevel, totalAttempts: r.totalAttempts, correctCount: r.correctCount }
        : null,
    };
  });

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
  const { completedAt, xpEarned, accuracy, durationSeconds } = body as {
    completedAt?: string;
    xpEarned?: number;
    accuracy?: number;
    durationSeconds?: number;
  };

  const updated = await prisma.lesson.update({
    where: { id, userId: user.id },
    data: {
      ...(completedAt !== undefined && { completedAt: new Date(completedAt) }),
      ...(xpEarned !== undefined && { xpEarned }),
      ...(accuracy !== undefined && { accuracy }),
      ...(durationSeconds !== undefined && { durationSeconds }),
    },
  });

  if (durationSeconds !== undefined && durationSeconds > 0) {
    await prisma.userStatistics.upsert({
      where: { userId: user.id },
      create: { userId: user.id, totalStudyTime: durationSeconds, lessonsCompleted: 1 },
      update: {
        totalStudyTime: { increment: durationSeconds },
        ...(completedAt !== undefined && { lessonsCompleted: { increment: 1 } }),
      },
    });
  }

  return NextResponse.json(updated);
}
