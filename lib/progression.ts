import { prisma } from "./prisma";
import { ContentType } from "@prisma/client";

export const KANA_TYPES: ContentType[] = [ContentType.HIRAGANA, ContentType.KATAKANA];

// True once the user has every hiragana and katakana character at SRS level
// MASTERED. Until that point the app stays kana-only: kanji is withheld
// everywhere, and so are vocabulary and phrases, since those are themselves
// written with kanji and would leak the characters back in through the
// side door.
export async function hasMasteredAllKana(userId: string): Promise<boolean> {
  const [totalKana, masteredKana] = await Promise.all([
    prisma.japaneseCharacter.count({
      where: { type: { in: KANA_TYPES } },
    }),
    prisma.review.count({
      where: {
        userId,
        contentType: { in: KANA_TYPES },
        srsLevel: "MASTERED",
      },
    }),
  ]);
  return totalKana > 0 && masteredKana >= totalKana;
}
