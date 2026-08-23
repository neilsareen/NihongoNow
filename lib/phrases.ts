/* ===========================================================================
   The phrase corpus — the seeded rows plus the lines the conversation cards
   teach.

   The Conversation track already carries the best phrases in the app: every
   card is one whole usable line, written in kana, with the reading and the
   English that the phrase deck needs. Leaving them locked inside that track
   meant a learner could rehearse すみません、しんじゅくゆきはなんばんせんですか
   at the ticket gate and never see it again in Phrases, where the SRS would
   otherwise keep it warm.

   So the conversation lines are lifted into the phrase corpus here rather than
   copied into the seed: one source of truth in lib/conversations.ts, and no
   database migration standing between an edit to a card and the phrase deck
   showing it.

   Which lines: the ones the learner *says* — the card's `say` line and any
   `reply` that follows it. `hear` lines are what comes back at them; those are
   for recognition inside the rehearsal, and the phrase deck drills production
   (English → Japanese, and say-it-back), which is the wrong thing to ask of a
   cashier's line.

   Ids are derived from the exchange id, which is itself append-only, so a
   phrase keeps the same id — and therefore the learner's review history —
   across edits to the rest of the card.
   =========================================================================== */

import type { Phrase } from "@prisma/client";
import { prisma } from "./prisma";
import { CONVERSATIONS, type ConversationScene } from "./conversations";

/** Everything the app reads off a phrase. A subset of the Prisma row, so a
 *  derived phrase and a seeded one are interchangeable at every call site. */
export type PhraseRow = Pick<
  Phrase,
  "id" | "japanese" | "kana" | "romaji" | "english" | "scenario" | "difficulty" | "tags" | "audioUrl"
>;

/** Marks a phrase that lives in code rather than in the phrases table. */
export const CONVERSATION_PHRASE_PREFIX = "phrase-conv-";

export function isConversationPhraseId(id: string): boolean {
  return id.startsWith(CONVERSATION_PHRASE_PREFIX);
}

// The scene vocabulary the cards use, mapped onto the scenario vocabulary the
// seeded phrases already use, so a mixed deck reads as one set.
const SCENE_SCENARIO: Record<ConversationScene, string> = {
  core: "general",
  konbini: "shopping",
  restaurant: "restaurant",
  transport: "transportation",
  directions: "directions",
  shopping: "shopping",
  hotel: "hotel",
  trouble: "emergency",
};

// Difficulty orders the deck (easiest first). The core chunks are the ones that
// carry a whole trip and are taught first, so they lead; everything else sits
// with the seeded phrases of the same scene.
const SCENE_DIFFICULTY: Record<ConversationScene, number> = {
  core: 1,
  konbini: 2,
  restaurant: 2,
  transport: 2,
  directions: 2,
  shopping: 2,
  hotel: 2,
  trouble: 2,
};

// Two readings are the same phrase even when one card ends in a 。and the other
// doesn't, or spaces its chunks differently.
const IGNORABLE = /[\s　。、．，！？!?…‥・「」『』（）()~〜]/g;

function readingKey(kana: string): string {
  return (kana ?? "").replace(IGNORABLE, "");
}

function buildConversationPhrases(): PhraseRow[] {
  const phrases: PhraseRow[] = [];
  const seen = new Set<string>();

  for (const exchange of CONVERSATIONS) {
    const lines = [
      { line: exchange.say, id: `phrase-${exchange.id}` },
      ...exchange.reply.map((line, i) => ({ line, id: `phrase-${exchange.id}-reply-${i}` })),
    ];

    for (const { line, id } of lines) {
      const key = readingKey(line.kana);
      // はい turns up as a reply on half the cards; the deck wants it once.
      if (!key || seen.has(key)) continue;
      seen.add(key);

      phrases.push({
        id,
        japanese: line.japanese,
        kana: line.kana,
        romaji: line.romaji,
        english: line.english,
        scenario: SCENE_SCENARIO[exchange.scene],
        difficulty: SCENE_DIFFICULTY[exchange.scene],
        tags: ["conversation", exchange.scene],
        audioUrl: null,
      });
    }
  }

  return phrases;
}

/** The phrases the conversation cards teach, in curriculum order. */
export const CONVERSATION_PHRASES: PhraseRow[] = buildConversationPhrases();

const BY_ID = new Map(CONVERSATION_PHRASES.map((p) => [p.id, p]));

/**
 * Phrases by id, from either source. Ids that match nothing are dropped, the
 * same way a `findMany` on missing rows would.
 */
export async function findPhrasesByIds(ids: string[]): Promise<PhraseRow[]> {
  if (ids.length === 0) return [];
  const derived = ids.map((id) => BY_ID.get(id)).filter((p): p is PhraseRow => !!p);
  const dbIds = ids.filter((id) => !BY_ID.has(id));
  const rows = dbIds.length
    ? await prisma.phrase.findMany({ where: { id: { in: dbIds } } })
    : [];
  return [...rows, ...derived];
}

/**
 * Every phrase that could be offered, easiest first, as the id and reading the
 * readability gate needs.
 *
 * A conversation line whose reading a seeded phrase already covers is dropped
 * rather than shown twice: 助けてください is seeded and たすけてください is on a
 * card, and they are the same thing to say. The seeded row wins because a
 * learner may already hold review history against it.
 */
export async function getPhraseCandidates(
  excludeIds: string[] = [],
  take = 300
): Promise<{ id: string; kana: string }[]> {
  const excluded = new Set(excludeIds);
  const rows = await prisma.phrase.findMany({
    where: excludeIds.length ? { id: { notIn: excludeIds } } : undefined,
    orderBy: { difficulty: "asc" },
    take,
    select: { id: true, kana: true, difficulty: true },
  });

  const seen = new Set(rows.map((r) => readingKey(r.kana)));
  const derived = CONVERSATION_PHRASES.filter((p) => {
    if (excluded.has(p.id)) return false;
    const key = readingKey(p.kana);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return [...rows, ...derived]
    .sort((a, b) => a.difficulty - b.difficulty)
    .map(({ id, kana }) => ({ id, kana }));
}
