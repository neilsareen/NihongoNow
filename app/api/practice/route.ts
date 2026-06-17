import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { ContentType } from "@prisma/client";

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const typesParam = searchParams.get("types") ?? "";
  const requestedTypes = typesParam
    .split(",")
    .map((t) => t.trim().toUpperCase())
    .filter(Boolean) as ContentType[];

  if (requestedTypes.length === 0) {
    return NextResponse.json({ error: "At least one type is required" }, { status: 400 });
  }

  const charTypes = requestedTypes.filter(
    (t) => t === ContentType.HIRAGANA || t === ContentType.KATAKANA
  );
  const includeKanji = requestedTypes.includes(ContentType.KANJI);

  const items: {
    id: string;
    contentType: ContentType;
    character: string;
    romaji: string;
    meanings?: string[];
    onyomi?: string[];
    kunyomi?: string[];
    exampleWords?: unknown;
    mnemonicHint?: string | null;
  }[] = [];

  if (charTypes.length > 0) {
    const characters = await prisma.japaneseCharacter.findMany({
      where: { type: { in: charTypes } },
      orderBy: { displayOrder: "asc" },
      select: {
        id: true,
        character: true,
        romaji: true,
        type: true,
        mnemonicHint: true,
      },
    });

    for (const c of characters) {
      items.push({
        id: c.id,
        contentType: c.type,
        character: c.character,
        romaji: c.romaji,
        mnemonicHint: c.mnemonicHint,
      });
    }
  }

  if (includeKanji) {
    const kanjiList = await prisma.kanji.findMany({
      select: {
        id: true,
        character: true,
        onyomi: true,
        kunyomi: true,
        meanings: true,
        exampleWords: true,
        mnemonicHint: true,
      },
    });

    for (const k of kanjiList) {
      items.push({
        id: k.id,
        contentType: ContentType.KANJI,
        character: k.character,
        romaji: k.onyomi[0] ?? k.kunyomi[0] ?? "",
        meanings: k.meanings,
        onyomi: k.onyomi,
        kunyomi: k.kunyomi,
        exampleWords: k.exampleWords,
        mnemonicHint: k.mnemonicHint,
      });
    }
  }

  return NextResponse.json({ items: shuffleArray(items) });
}
