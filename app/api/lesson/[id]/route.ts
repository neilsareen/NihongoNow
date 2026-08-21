import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ContentType } from "@prisma/client";
import { CULTURAL_TIPS } from "@/lib/cultural-tips";
import { SCRIPT_INTRO_LIST } from "@/lib/script-intros";
import { effectiveSrsLevel } from "@/lib/srs";
import { getSessionUser } from "@/lib/simulation";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { userId } = session;

  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: { items: { orderBy: { displayOrder: "asc" } } },
  });

  if (!lesson) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (lesson.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const culturalTipMap = new Map(CULTURAL_TIPS.map((t) => [t.id, t]));
  const scriptIntroMap = new Map(SCRIPT_INTRO_LIST.map((t) => [t.id, t]));

  const realItems = lesson.items.filter(
    (i) => !i.contentId.startsWith("cultural-") && !i.contentId.startsWith("intro-")
  );
  const culturalItems = lesson.items.filter((i) => i.contentId.startsWith("cultural-"));
  const scriptIntroItems = lesson.items.filter((i) => i.contentId.startsWith("intro-"));

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
  // Cultural tips carry mastery too, so their reviews are fetched alongside.
  // They are always keyed under CULTURE, including on lesson items written
  // before that content type existed and stored the tip as a PHRASE.
  const reviewContentIds = [...allRealContentIds, ...culturalItems.map((i) => i.contentId)];

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
    reviewContentIds.length
      ? prisma.review.findMany({
          where: { userId, contentId: { in: reviewContentIds } },
          select: {
            contentId: true,
            contentType: true,
            srsLevel: true,
            totalAttempts: true,
            correctCount: true,
            incorrectCount: true,
            consecutiveSuccesses: true,
            interval: true,
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

  for (const item of scriptIntroItems) {
    const intro = scriptIntroMap.get(item.contentId);
    if (intro) contentMap.set(item.contentId, { isScriptIntro: true, ...intro });
  }

  const reviewMap = new Map<string, (typeof reviews)[0]>();
  for (const r of reviews) reviewMap.set(`${r.contentType}:${r.contentId}`, r);

  const enrichedItems = lesson.items.map((item) => {
    const lookupType = item.contentId.startsWith("cultural-")
      ? ContentType.CULTURE
      : item.contentType;
    const r = reviewMap.get(`${lookupType}:${item.contentId}`) ?? null;
    return {
      ...item,
      content: contentMap.get(item.contentId) ?? null,
      review: r
        ? {
            srsLevel: effectiveSrsLevel(r),
            totalAttempts: r.totalAttempts,
            correctCount: r.correctCount,
            incorrectCount: r.incorrectCount,
          }
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

  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { userId } = session;

  const body = await request.json().catch(() => ({}));
  const { completedAt, xpEarned, accuracy, durationSeconds } = body as {
    completedAt?: string;
    xpEarned?: number;
    accuracy?: number;
    durationSeconds?: number;
  };

  const updated = await prisma.lesson.update({
    where: { id, userId },
    data: {
      ...(completedAt !== undefined && { completedAt: new Date(completedAt) }),
      ...(xpEarned !== undefined && { xpEarned }),
      ...(accuracy !== undefined && { accuracy }),
      ...(durationSeconds !== undefined && { durationSeconds }),
    },
  });

  if (durationSeconds !== undefined && durationSeconds > 0) {
    await prisma.userStatistics.upsert({
      where: { userId },
      create: { userId, totalStudyTime: durationSeconds, lessonsCompleted: 1 },
      update: {
        totalStudyTime: { increment: durationSeconds },
        ...(completedAt !== undefined && { lessonsCompleted: { increment: 1 } }),
      },
    });
  }

  return NextResponse.json(updated);
}
