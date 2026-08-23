/* ===========================================================================
   Watchable dialogues — the conversation track, played out end to end.

   The drill cards in `conversations.ts` each rehearse one beat of a
   transaction: the bag question, the heating question, asking for the bill.
   That is the right unit to *practise* and the wrong unit to *understand* —
   a real exchange is those beats in sequence, at speed, with the other person
   filling the gaps, and a learner who has only ever met them one at a time has
   never heard what the whole thing sounds like.

   So these are the same lines, chained. Every turn a learner speaks here is a
   line they have drilled as a card, which is the point: the scene should feel
   like recognition rather than new material. The staff turns are the ones the
   cards already list under `hear`, plus the connective tissue a real
   transaction has and a flashcard cannot (いらっしゃいませ, a total read out,
   the pause while food is cooked).

   Written entirely in kana, spaced into chunks, for the same reason the cards
   are: this content unlocks only once every kana is at Learning, so the promise
   is that every character on screen is one the learner can read.

   Romaji uses the pronunciation, not the spelling: を is "o", へ is "e".

   Ids are referenced from the player's URL, so they are append-only.
   =========================================================================== */

export type Speaker = "you" | "them";

export interface DialogueTurn {
  speaker: Speaker;
  /** As it appears on screen: kana, spaced into chunks. */
  japanese: string;
  /** The reading fed to speech — no spaces, no punctuation to be read aloud. */
  kana: string;
  romaji: string;
  english: string;
  /**
   * A stage direction shown before the line rather than spoken: the beats of a
   * scene that are not language. Without them a transcript reads as one
   * unbroken exchange, and the pause while a bento is microwaved is exactly
   * where a real learner loses their place.
   */
  stage?: string;
}

export interface Dialogue {
  id: string;
  /** Short enough to sit on a card. */
  title: string;
  /** Where this happens, in one line. */
  blurb: string;
  /** What the learner should come away able to do. */
  canDo: string;
  glyph: string;
  /** Roughly how long the scene runs, in seconds, for the card. */
  seconds: number;
  /** Who the other voice belongs to. */
  them: { label: string; glyph: string };
  turns: DialogueTurn[];
}

export const YOU_GLYPH = "私";

export const DIALOGUES: Dialogue[] = [
  {
    id: "konbini-run",
    title: "A konbini run",
    blurb:
      "A bento, a coffee and four questions at the register — the transaction you will have more than any other in Japan.",
    canDo:
      "Get through a convenience-store checkout answering every question, without once being caught out.",
    glyph: "店",
    seconds: 55,
    them: { label: "Cashier", glyph: "店" },
    turns: [
      {
        speaker: "them",
        stage: "You put a bento and a coffee on the counter.",
        japanese: "いらっしゃいませ。",
        kana: "いらっしゃいませ",
        romaji: "irasshaimase",
        english: "Welcome.",
      },
      {
        // これを would be the card's line, but これ is singular and there are
        // two items on the counter. Bare おねがいします is what is actually
        // said here, and it is the same chunk conv-1 drills.
        speaker: "you",
        japanese: "おねがいします。",
        kana: "おねがいします",
        romaji: "onegaishimasu",
        english: "Please.",
      },
      {
        speaker: "them",
        japanese: "おべんとうは あたためますか。",
        kana: "おべんとうはあたためますか",
        romaji: "obentou wa atatamemasu ka",
        english: "Shall I heat the bento up?",
      },
      {
        speaker: "you",
        japanese: "はい、おねがいします。",
        kana: "はいおねがいします",
        romaji: "hai, onegaishimasu",
        english: "Yes, please.",
      },
      {
        speaker: "them",
        japanese: "おはしは おつけしますか。",
        kana: "おはしはおつけしますか",
        romaji: "ohashi wa otsuke shimasu ka",
        english: "Shall I add chopsticks?",
      },
      {
        speaker: "you",
        japanese: "おねがいします。",
        kana: "おねがいします",
        romaji: "onegaishimasu",
        english: "Yes, please.",
      },
      {
        speaker: "them",
        japanese: "ふくろは いりますか。",
        kana: "ふくろはいりますか",
        romaji: "fukuro wa irimasu ka",
        english: "Do you need a bag?",
      },
      {
        speaker: "you",
        japanese: "だいじょうぶです。",
        kana: "だいじょうぶです",
        romaji: "daijoubu desu",
        english: "No, I'm fine.",
      },
      {
        speaker: "them",
        japanese: "ポイントカードは おもちですか。",
        kana: "ポイントカードはおもちですか",
        romaji: "pointo kaado wa omochi desu ka",
        english: "Do you have a point card?",
      },
      {
        speaker: "you",
        japanese: "だいじょうぶです。",
        kana: "だいじょうぶです",
        romaji: "daijoubu desu",
        english: "No, I don't.",
      },
      {
        speaker: "them",
        japanese: "ごうけい ななひゃくはちじゅうえんです。",
        kana: "ごうけいななひゃくはちじゅうえんです",
        romaji: "goukei nanahyaku hachijuu en desu",
        english: "That's 780 yen in total.",
      },
      {
        speaker: "you",
        japanese: "カードで おねがいします。",
        kana: "カードでおねがいします",
        romaji: "kaado de onegaishimasu",
        english: "By card, please.",
      },
      {
        speaker: "them",
        stage: "You put the card in the little tray, not in their hand.",
        japanese: "かしこまりました。",
        kana: "かしこまりました",
        romaji: "kashikomarimashita",
        english: "Certainly.",
      },
      {
        speaker: "them",
        japanese: "ありがとうございました。",
        kana: "ありがとうございました",
        romaji: "arigatou gozaimashita",
        english: "Thank you very much.",
      },
      {
        speaker: "you",
        japanese: "ありがとうございます。",
        kana: "ありがとうございます",
        romaji: "arigatou gozaimasu",
        english: "Thank you.",
      },
    ],
  },
  {
    id: "dinner-out",
    title: "Dinner for two",
    blurb:
      "Walking into a restaurant with no English menu, ordering on a recommendation, and paying at the front like a regular.",
    canDo:
      "Be seated, order without reading the menu, ask for what you need at the table, and settle the bill.",
    glyph: "食",
    seconds: 60,
    them: { label: "Server", glyph: "店" },
    turns: [
      {
        speaker: "them",
        stage: "You step inside and someone comes straight over.",
        japanese: "いらっしゃいませ。なんめいさまですか。",
        kana: "いらっしゃいませ。なんめいさまですか",
        romaji: "irasshaimase. nanmei sama desu ka",
        english: "Welcome. How many in your party?",
      },
      {
        speaker: "you",
        japanese: "ふたりです。",
        kana: "ふたりです",
        romaji: "futari desu",
        english: "Two people.",
      },
      {
        speaker: "them",
        japanese: "こちらへ どうぞ。",
        kana: "こちらへどうぞ",
        romaji: "kochira e douzo",
        english: "This way, please.",
      },
      {
        speaker: "you",
        stage: "The menu is long, in Japanese, and unphotographed.",
        japanese: "すみません！",
        kana: "すみません",
        romaji: "sumimasen!",
        english: "Excuse me!",
      },
      {
        speaker: "them",
        japanese: "はい、ただいま。",
        kana: "はいただいま",
        romaji: "hai, tadaima",
        english: "Yes, right away.",
      },
      {
        speaker: "you",
        japanese: "おすすめは なんですか。",
        kana: "おすすめはなんですか",
        romaji: "osusume wa nan desu ka",
        english: "What do you recommend?",
      },
      {
        speaker: "them",
        japanese: "こちらが にんきです。",
        kana: "こちらがにんきです",
        romaji: "kochira ga ninki desu",
        english: "This one is popular.",
      },
      {
        speaker: "you",
        japanese: "じゃあ、それを ふたつ ください。",
        kana: "じゃあそれをふたつください",
        romaji: "jaa, sore o futatsu kudasai",
        english: "That one, then — two of them, please.",
      },
      {
        speaker: "them",
        japanese: "いじょうで よろしいですか。",
        kana: "いじょうでよろしいですか",
        romaji: "ijou de yoroshii desu ka",
        english: "Will that be all?",
      },
      {
        speaker: "you",
        japanese: "おみず、おねがいします。",
        kana: "おみずおねがいします",
        romaji: "omizu, onegaishimasu",
        english: "Water, please.",
      },
      {
        speaker: "them",
        japanese: "はい、しょうしょう おまちください。",
        kana: "はいしょうしょうおまちください",
        romaji: "hai, shoushou omachi kudasai",
        english: "Certainly, one moment please.",
      },
      {
        speaker: "you",
        stage: "The food arrives. You eat. It was a good recommendation.",
        japanese: "すみません、おかいけい、おねがいします。",
        kana: "すみませんおかいけいおねがいします",
        romaji: "sumimasen, okaikei, onegaishimasu",
        english: "Excuse me — the bill, please.",
      },
      {
        speaker: "them",
        japanese: "レジで おねがいします。",
        kana: "レジでおねがいします",
        romaji: "reji de onegaishimasu",
        english: "At the register, please.",
      },
      {
        speaker: "you",
        stage: "You take the slip from your table to the front.",
        japanese: "ごちそうさまでした。",
        kana: "ごちそうさまでした",
        romaji: "gochisousama deshita",
        english: "Thank you for the meal.",
      },
      {
        speaker: "them",
        japanese: "ありがとうございました。また どうぞ。",
        kana: "ありがとうございました。またどうぞ",
        romaji: "arigatou gozaimashita. mata douzo",
        english: "Thank you very much. Please come again.",
      },
    ],
  },
];

const BY_ID = new Map(DIALOGUES.map((d) => [d.id, d]));

export function getDialogueById(id: string): Dialogue | undefined {
  return BY_ID.get(id);
}
