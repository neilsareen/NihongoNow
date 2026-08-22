import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pickPrimaryKanjiReading } from "@/lib/utils";
import { getMasteredKana, getUnlockedKanji, getUnlockedVocabulary, getUnlockedPhrases } from "@/lib/progression";
import { ContentType } from "@prisma/client";
import { getSessionUser } from "@/lib/simulation";

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getConsonantFamily(romaji: string): string {
  if (!romaji) return "other";
  const r = romaji.toLowerCase().trim();
  if (/^[aeiou]/.test(r)) return "vowel";
  if (r.startsWith("ch") || r.startsWith("ts")) return r.slice(0, 2);
  if (r.startsWith("sh")) return "sh";
  return r[0];
}

function spreadShuffleByFamily<T extends { romaji: string; contentType: ContentType }>(array: T[]): T[] {
  const shuffled = shuffleArray(array);
  const kana = shuffled.filter(i => i.contentType === ContentType.HIRAGANA || i.contentType === ContentType.KATAKANA);
  const others = shuffled.filter(i => i.contentType !== ContentType.HIRAGANA && i.contentType !== ContentType.KATAKANA);

  const families: Record<string, T[]> = {};
  for (const item of kana) {
    const f = getConsonantFamily(item.romaji);
    if (!families[f]) families[f] = [];
    families[f].push(item);
  }
  const queues = Object.values(families);
  const spread: T[] = [];
  let changed = true;
  while (changed) {
    changed = false;
    for (const q of queues) {
      if (q.length > 0) { spread.push(q.shift()!); changed = true; }
    }
  }

  const result: T[] = [];
  const maxLen = Math.max(spread.length, others.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < spread.length) result.push(spread[i]);
    if (i < others.length) result.push(others[i]);
  }
  return result;
}

export async function GET(request: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
  // Kanji, vocabulary and phrases are only practisable once their reading is
  // readable. Enforced here rather than only in the UI, since the type comes
  // off the query string.
  const wantsKanji = requestedTypes.includes(ContentType.KANJI);
  const wantsVocab = requestedTypes.includes(ContentType.VOCABULARY);
  const wantsPhrase = requestedTypes.includes(ContentType.PHRASE);
  const masteredKana =
    wantsKanji || wantsVocab || wantsPhrase ? await getMasteredKana(session.userId) : null;
  const unlockedKanji = masteredKana ? await getUnlockedKanji(masteredKana) : [];
  const includeKanji = wantsKanji && unlockedKanji.length > 0;

  // The unlocked helpers return only what they need to test readability, so
  // the handful actually being served is re-read in full below.
  const unlockedVocabStubs = wantsVocab && masteredKana ? await getUnlockedVocabulary(masteredKana) : [];
  const unlockedPhraseStubs = wantsPhrase && masteredKana ? await getUnlockedPhrases(masteredKana) : [];
  const includeVocab = wantsVocab && unlockedVocabStubs.length > 0;
  const includePhrase = wantsPhrase && unlockedPhraseStubs.length > 0;

  if (charTypes.length === 0 && !includeKanji && !includeVocab && !includePhrase) {
    return NextResponse.json(
      { error: "Master more kana to unlock this content.", locked: true },
      { status: 403 }
    );
  }

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
    kana?: string;
    english?: string;
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
    for (const k of unlockedKanji) {
      items.push({
        id: k.id,
        contentType: ContentType.KANJI,
        character: k.character,
        romaji: pickPrimaryKanjiReading(k.character, k.onyomi, k.kunyomi),
        meanings: k.meanings,
        onyomi: k.onyomi,
        kunyomi: k.kunyomi,
        exampleWords: k.exampleWords,
        mnemonicHint: k.mnemonicHint,
      });
    }
  }

  if (includeVocab) {
    const vocab = await prisma.vocabulary.findMany({
      where: { id: { in: unlockedVocabStubs.map((v) => v.id) } },
    });
    for (const v of vocab) {
      items.push({
        id: v.id,
        contentType: ContentType.VOCABULARY,
        character: v.japanese,
        romaji: v.romaji,
        kana: v.kana,
        english: v.english,
      });
    }
  }

  if (includePhrase) {
    const phrases = await prisma.phrase.findMany({
      where: { id: { in: unlockedPhraseStubs.map((p) => p.id) } },
    });
    for (const p of phrases) {
      items.push({
        id: p.id,
        contentType: ContentType.PHRASE,
        character: p.japanese,
        romaji: p.romaji,
        kana: p.kana,
        english: p.english,
      });
    }
  }

  // The drill screen asks for a stack of a fixed size (10/25/50/100). Trim
  // after the spread shuffle so a short stack is still a spread sample of the
  // whole set rather than the first few of one family.
  const limitParam = Number(searchParams.get("limit"));
  const limit =
    Number.isFinite(limitParam) && limitParam > 0
      ? Math.min(Math.floor(limitParam), 500)
      : null;
  const ordered = spreadShuffleByFamily(items);

  return NextResponse.json({ items: limit ? ordered.slice(0, limit) : ordered });
}
