/* ===========================================================================
   Numbers & Money — the track that decides whether a day in Japan goes
   smoothly or expensively.

   Numbers are the one part of the language a traveller cannot route around.
   You can point at a menu, mime a direction, and smile through a greeting —
   but you cannot point at a price. Every counter in the country ends with a
   number said out loud at speed, and Japan is still a cash country in exactly
   the places a visitor ends up: the shrine stall, the ramen counter, the
   ticket machine, the ryokan that has never taken a card.

   So this track is built money-first. The number system is taught because
   prices need it, the counters are taught because the counter asks "how
   many?", and the clock is taught because opening hours and platform times
   are numbers too. Every card ends up at something you can say at a till.

   How the cards work, and why:

   1. Figure first. Every reading is anchored to what is actually printed —
      「1,500円」, 「3階」, 「9:45」 — because that is the form the learner
      meets in the world. The Japanese is how you say what you are looking at,
      not a separate fact to memorise.

   2. The irregulars are marked, not buried. Japanese numbers are regular
      right up until they aren't: 300 is さんびゃく, 600 is ろっぴゃく, 8000 is
      はっせん, 3 o'clock is さんじ but 4 o'clock is よじ. Those sound changes
      are where every learner comes unstuck, so each one carries `irregular`
      and the card names the trap in its `tip`.

   3. Grouped by 万, not by thousand. English chunks large numbers every three
      digits; Japanese chunks them every four. ¥12,800 is not "twelve thousand
      eight hundred" but 一万二千八百 — "one man, two thousand, eight hundred".
      Getting this wrong is the difference between paying ¥1,000 and ¥10,000,
      which is why it gets a card of its own and turns up again in the drills.

   4. One line to say, on every card. A table of readings teaches recognition;
      it does not teach a mouth to move. Each card carries `say` — the thing
      you would actually come out with in that moment — plus what comes back
      at you (`hear`) and the frame the line came from (`pattern`), the same
      way the Conversation track works.

   Availability: unlike Conversation, this track is open from the first lesson.
   The reason is that a numeral is legible to everyone on day one — a price tag
   needs no kana at all — and every reading here carries its romaji, so the
   track is usable before the alphabet is and reinforces it afterwards. Money
   is also the thing a traveller needs first, and gating it behind the whole
   syllabary would be teaching the alphabet before the ATM.

   Ids are stored on lesson items and on the review rows carrying a learner's
   mastery of each card, so they are append-only: add to the end, never
   renumber or reuse.
   =========================================================================== */

export type NumberScene =
  | "digits"
  | "counting"
  | "money"
  | "counters"
  | "time"
  | "everyday";

export const NUMBER_SCENE_LABELS: Record<NumberScene, string> = {
  digits: "The digits",
  counting: "Building numbers",
  money: "Money",
  counters: "Counting things",
  time: "Clock & calendar",
  everyday: "Numbers in the wild",
};

/** One row of a card's table: what is printed, and how it is said. */
export interface NumberReading {
  /** As it appears in the world — a price tag, a sign, a clock face. */
  figure: string;
  /** How it is written in Japanese. Kana, the way the cards are written. */
  japanese: string;
  /** The reading fed to speech and to pronunciation scoring. */
  kana: string;
  romaji: string;
  /** What it means in English. */
  english: string;
  /** A sound change that breaks the pattern — さんびゃく, はっせん, よじ. */
  irregular?: boolean;
}

/** A whole line, said or heard. Same shape as a conversation line. */
export interface NumberLine {
  japanese: string;
  kana: string;
  romaji: string;
  english: string;
}

export interface NumberPattern {
  /** The reusable frame, with 〜 marking the slot. */
  frame: string;
  gloss: string;
  swaps: { japanese: string; english: string }[];
}

export interface NumberCard {
  id: string;
  scene: NumberScene;
  /** The real-world task this card makes possible. */
  canDo: string;
  /** The moment being rehearsed. */
  situation: string;
  /** The numbers the card teaches, in the form they are printed. */
  readings: NumberReading[];
  /** The line the learner produces in that moment. */
  say: NumberLine;
  /** What comes back at them. */
  hear?: NumberLine[];
  /** How to answer what came back. */
  reply?: NumberLine[];
  pattern?: NumberPattern;
  /** One line of practical guidance — usually the trap on this card. */
  tip: string;
}

/** Curriculum order: the digits, then the sizes, then the till, then the rest
 *  of the numbers a day throws at you. */
export const NUMBER_CARDS: NumberCard[] = [
  /* --- The digits ------------------------------------------------------- */
  {
    id: "num-0",
    scene: "digits",
    canDo: "Count from one to five, and recognise them said back to you.",
    situation:
      "Everything else in this track is built on ten sounds. These are the first five, and they turn up in every price, every platform number and every order you will ever place.",
    readings: [
      { figure: "1", japanese: "いち", kana: "いち", romaji: "ichi", english: "one" },
      { figure: "2", japanese: "に", kana: "に", romaji: "ni", english: "two" },
      { figure: "3", japanese: "さん", kana: "さん", romaji: "san", english: "three" },
      { figure: "4", japanese: "よん", kana: "よん", romaji: "yon", english: "four" },
      { figure: "5", japanese: "ご", kana: "ご", romaji: "go", english: "five" },
    ],
    say: {
      japanese: "いち、に、さん、よん、ご",
      kana: "いち に さん よん ご",
      romaji: "ichi, ni, san, yon, go",
      english: "One, two, three, four, five.",
    },
    tip: "Four has two readings — よん and し — and よん is the one to use. し is also the word for death, so Japanese avoids it almost everywhere a number stands alone. Say よん and you will never be the odd one out.",
  },
  {
    id: "num-1",
    scene: "digits",
    canDo: "Count from six to ten, and finish the set.",
    situation:
      "The other half of the base set. With these ten sounds you can already read a platform number, a floor, and the first digit of any price.",
    readings: [
      { figure: "6", japanese: "ろく", kana: "ろく", romaji: "roku", english: "six" },
      { figure: "7", japanese: "なな", kana: "なな", romaji: "nana", english: "seven" },
      { figure: "8", japanese: "はち", kana: "はち", romaji: "hachi", english: "eight" },
      { figure: "9", japanese: "きゅう", kana: "きゅう", romaji: "kyuu", english: "nine" },
      { figure: "10", japanese: "じゅう", kana: "じゅう", romaji: "juu", english: "ten" },
    ],
    say: {
      japanese: "ろく、なな、はち、きゅう、じゅう",
      kana: "ろく なな はち きゅう じゅう",
      romaji: "roku, nana, hachi, kyuu, juu",
      english: "Six, seven, eight, nine, ten.",
    },
    tip: "Seven and nine have alternates too — しち and く. They survive in fixed places like 7時 (しちじ) and 9時 (くじ), but for a bare number なな and きゅう are safer and clearer, especially over a phone.",
  },
  {
    id: "num-2",
    scene: "digits",
    canDo: "Say zero, and read any number from eleven to nineteen.",
    situation:
      "You are reading a room number and a phone number. Both need a zero, and the teens are the first place the system shows how simple it really is.",
    readings: [
      { figure: "0", japanese: "ゼロ", kana: "ゼロ", romaji: "zero", english: "zero (everyday)" },
      { figure: "0", japanese: "れい", kana: "れい", romaji: "rei", english: "zero (formal, announcements)" },
      { figure: "11", japanese: "じゅういち", kana: "じゅういち", romaji: "juu-ichi", english: "eleven — ten-one" },
      { figure: "14", japanese: "じゅうよん", kana: "じゅうよん", romaji: "juu-yon", english: "fourteen — ten-four" },
      { figure: "19", japanese: "じゅうきゅう", kana: "じゅうきゅう", romaji: "juu-kyuu", english: "nineteen — ten-nine" },
    ],
    say: {
      japanese: "ぜろ、じゅういち、じゅうよん、じゅうきゅう",
      kana: "ゼロ じゅういち じゅうよん じゅうきゅう",
      romaji: "zero, juu-ichi, juu-yon, juu-kyuu",
      english: "Zero, eleven, fourteen, nineteen.",
    },
    tip: "There is no separate word for the teens. Eleven is literally ten-one, nineteen is ten-nine, and that is the whole rule — no 'eleven', 'twelve', 'thirteen' to memorise. Japanese numbers are more regular than English ones from here on.",
  },
  {
    id: "num-3",
    scene: "digits",
    canDo: "Read any two-digit number on a sign, a receipt or a seat.",
    situation:
      "Your seat is 42, the shop shuts at 21:00 and the sale sign says 30% off. Two digits carry most of a day.",
    readings: [
      { figure: "20", japanese: "にじゅう", kana: "にじゅう", romaji: "ni-juu", english: "twenty — two-tens" },
      { figure: "30", japanese: "さんじゅう", kana: "さんじゅう", romaji: "san-juu", english: "thirty" },
      { figure: "42", japanese: "よんじゅうに", kana: "よんじゅうに", romaji: "yon-juu-ni", english: "forty-two" },
      { figure: "78", japanese: "ななじゅうはち", kana: "ななじゅうはち", romaji: "nana-juu-hachi", english: "seventy-eight" },
      { figure: "99", japanese: "きゅうじゅうきゅう", kana: "きゅうじゅうきゅう", romaji: "kyuu-juu-kyuu", english: "ninety-nine" },
    ],
    say: {
      japanese: "よんじゅうに ばん です。",
      kana: "よんじゅうに ばん です",
      romaji: "yon-juu-ni ban desu",
      english: "It's number forty-two.",
    },
    pattern: {
      frame: "〜 ばん",
      gloss: "number 〜 — a seat, a ticket, a locker, a queue position",
      swaps: [
        { japanese: "じゅうご ばん", english: "number 15" },
        { japanese: "さんじゅう ばん", english: "number 30" },
        { japanese: "ろくじゅうなな ばん", english: "number 67" },
      ],
    },
    tip: "Two digits are built exactly as you would guess: the tens digit, じゅう, then the units. 42 is 4-10-2. Nothing changes shape until you hit the hundreds, which is the next card.",
  },

  /* --- Building bigger numbers ------------------------------------------ */
  {
    id: "num-4",
    scene: "counting",
    canDo: "Read prices in the hundreds — and dodge the three sounds that change.",
    situation:
      "Almost everything in a konbini is a three-digit price. This is the first place where the pattern bends, and it bends in exactly three spots.",
    readings: [
      { figure: "100", japanese: "ひゃく", kana: "ひゃく", romaji: "hyaku", english: "one hundred" },
      { figure: "200", japanese: "にひゃく", kana: "にひゃく", romaji: "ni-hyaku", english: "two hundred" },
      { figure: "300", japanese: "さんびゃく", kana: "さんびゃく", romaji: "san-byaku", english: "three hundred", irregular: true },
      { figure: "600", japanese: "ろっぴゃく", kana: "ろっぴゃく", romaji: "rop-pyaku", english: "six hundred", irregular: true },
      { figure: "800", japanese: "はっぴゃく", kana: "はっぴゃく", romaji: "hap-pyaku", english: "eight hundred", irregular: true },
      { figure: "450", japanese: "よんひゃくごじゅう", kana: "よんひゃくごじゅう", romaji: "yon-hyaku-go-juu", english: "four hundred and fifty" },
    ],
    say: {
      japanese: "さんびゃくえん です。",
      kana: "さんびゃくえん です",
      romaji: "san-byaku-en desu",
      english: "It's three hundred yen.",
    },
    tip: "Three, six and eight are the troublemakers, and they stay the troublemakers all the way up. 300 さんびゃく, 600 ろっぴゃく, 800 はっぴゃく. Everything else is just the digit plus ひゃく.",
  },
  {
    id: "num-5",
    scene: "counting",
    canDo: "Read prices in the thousands, where most meals and tickets land.",
    situation:
      "A bowl of ramen, a museum ticket, a taxi across town — the thousands are the working range of a trip.",
    readings: [
      { figure: "1,000", japanese: "せん", kana: "せん", romaji: "sen", english: "one thousand" },
      { figure: "2,000", japanese: "にせん", kana: "にせん", romaji: "ni-sen", english: "two thousand" },
      { figure: "3,000", japanese: "さんぜん", kana: "さんぜん", romaji: "san-zen", english: "three thousand", irregular: true },
      { figure: "8,000", japanese: "はっせん", kana: "はっせん", romaji: "has-sen", english: "eight thousand", irregular: true },
      { figure: "1,500", japanese: "せんごひゃく", kana: "せんごひゃく", romaji: "sen-go-hyaku", english: "one thousand five hundred" },
      { figure: "6,300", japanese: "ろくせんさんびゃく", kana: "ろくせんさんびゃく", romaji: "roku-sen-san-byaku", english: "six thousand three hundred" },
    ],
    say: {
      japanese: "せんごひゃくえん です。",
      kana: "せんごひゃくえん です",
      romaji: "sen-go-hyaku-en desu",
      english: "It's one thousand five hundred yen.",
    },
    tip: "1,000 on its own is just せん — no いち in front of it, unlike English 'one thousand'. Only three and eight change: さんぜん and はっせん. Six behaves itself here, which catches people who over-apply the ろっぴゃく rule.",
  },
  {
    id: "num-6",
    scene: "counting",
    canDo: "Read five-figure prices without accidentally paying ten times too much.",
    situation:
      "The hotel bill says 38,000円. English wants to chunk that as thirty-eight thousand. Japanese does not — and this is the single most expensive misunderstanding on the trip.",
    readings: [
      { figure: "10,000", japanese: "いちまん", kana: "いちまん", romaji: "ichi-man", english: "ten thousand — one 万", irregular: true },
      { figure: "20,000", japanese: "にまん", kana: "にまん", romaji: "ni-man", english: "twenty thousand — two 万" },
      { figure: "38,000", japanese: "さんまんはっせん", kana: "さんまんはっせん", romaji: "san-man-has-sen", english: "thirty-eight thousand" },
      { figure: "12,800", japanese: "いちまんにせんはっぴゃく", kana: "いちまんにせんはっぴゃく", romaji: "ichi-man-ni-sen-hap-pyaku", english: "twelve thousand eight hundred" },
      { figure: "100,000", japanese: "じゅうまん", kana: "じゅうまん", romaji: "juu-man", english: "one hundred thousand — ten 万" },
    ],
    say: {
      japanese: "いちまんにせんはっぴゃくえん です。",
      kana: "いちまんにせんはっぴゃくえん です",
      romaji: "ichi-man-ni-sen-hap-pyaku-en desu",
      english: "It's twelve thousand eight hundred yen.",
    },
    tip: "Japanese counts in blocks of four digits, not three. 万 is the unit for 10,000, so read the comma in your head one place to the left: 12,800 is 1万 2,800. And it is always いちまん — まん alone is never a number.",
  },
  {
    id: "num-7",
    scene: "counting",
    canDo: "Catch a price said at full speed and know roughly what you owe.",
    situation:
      "The cashier says a number faster than you can parse it. You do not need every syllable — you need the unit, because the unit is the order of magnitude.",
    readings: [
      { figure: "¥380", japanese: "さんびゃくはちじゅうえん", kana: "さんびゃくはちじゅうえん", romaji: "san-byaku-hachi-juu-en", english: "380 yen — pocket change" },
      { figure: "¥980", japanese: "きゅうひゃくはちじゅうえん", kana: "きゅうひゃくはちじゅうえん", romaji: "kyuu-hyaku-hachi-juu-en", english: "980 yen — a lunch" },
      { figure: "¥1,980", japanese: "せんきゅうひゃくはちじゅうえん", kana: "せんきゅうひゃくはちじゅうえん", romaji: "sen-kyuu-hyaku-hachi-juu-en", english: "1,980 yen — a dinner" },
      { figure: "¥9,800", japanese: "きゅうせんはっぴゃくえん", kana: "きゅうせんはっぴゃくえん", romaji: "kyuu-sen-hap-pyaku-en", english: "9,800 yen — a nice dinner" },
      { figure: "¥19,800", japanese: "いちまんきゅうせんはっぴゃくえん", kana: "いちまんきゅうせんはっぴゃくえん", romaji: "ichi-man-kyuu-sen-hap-pyaku-en", english: "19,800 yen — a hotel night" },
    ],
    say: {
      japanese: "すみません、もういちど おねがいします。",
      kana: "すみません もういちど おねがいします",
      romaji: "sumimasen, mou ichido onegaishimasu",
      english: "Sorry — once more, please.",
    },
    hear: [
      {
        japanese: "せんきゅうひゃくはちじゅうえん に なります。",
        kana: "せんきゅうひゃくはちじゅうえん に なります",
        romaji: "sen-kyuu-hyaku-hachi-juu-en ni narimasu",
        english: "That comes to 1,980 yen.",
      },
    ],
    tip: "Listen for まん and せん first — those two words tell you whether you are being asked for hundreds, thousands or tens of thousands. And every till in Japan shows the total on a customer-facing display, so a glance settles it if the ear doesn't.",
  },

  /* --- Money ------------------------------------------------------------- */
  {
    id: "num-8",
    scene: "money",
    canDo: "Ask what something costs.",
    situation:
      "You are holding something in a shop with no price on it. This is the single most useful sentence in the whole track.",
    readings: [
      { figure: "¥", japanese: "えん", kana: "えん", romaji: "en", english: "yen — written 円" },
      { figure: "?", japanese: "いくら", kana: "いくら", romaji: "ikura", english: "how much" },
    ],
    say: {
      japanese: "これは いくらですか。",
      kana: "これは いくらですか",
      romaji: "kore wa ikura desu ka",
      english: "How much is this?",
    },
    hear: [
      {
        japanese: "はっぴゃくえん です。",
        kana: "はっぴゃくえん です",
        romaji: "hap-pyaku-en desu",
        english: "It's 800 yen.",
      },
    ],
    pattern: {
      frame: "〜は いくらですか",
      gloss: "how much is 〜?",
      swaps: [
        { japanese: "これは いくらですか", english: "How much is this?" },
        { japanese: "ぜんぶで いくらですか", english: "How much is it altogether?" },
        { japanese: "おとな にまい、いくらですか", english: "How much for two adults?" },
      ],
    },
    tip: "Point and say これは いくらですか and you are understood anywhere in the country. ぜんぶで (altogether) is the version to use when you are holding several things.",
  },
  {
    id: "num-9",
    scene: "money",
    canDo: "Recognise every coin and note in your hand.",
    situation:
      "Japanese cash is heavy on coins — the 500円 coin alone is worth more than most foreign notes. Knowing what is in your palm is what stops you handing over a fistful and hoping.",
    readings: [
      { figure: "¥1", japanese: "いちえん", kana: "いちえん", romaji: "ichi-en", english: "1 yen — aluminium, almost weightless" },
      { figure: "¥10", japanese: "じゅうえん", kana: "じゅうえん", romaji: "juu-en", english: "10 yen — copper" },
      { figure: "¥100", japanese: "ひゃくえん", kana: "ひゃくえん", romaji: "hyaku-en", english: "100 yen — the workhorse coin" },
      { figure: "¥500", japanese: "ごひゃくえん", kana: "ごひゃくえん", romaji: "go-hyaku-en", english: "500 yen — the big brass coin" },
      { figure: "¥1,000", japanese: "せんえんさつ", kana: "せんえんさつ", romaji: "sen-en satsu", english: "1,000 yen note" },
      { figure: "¥10,000", japanese: "いちまんえんさつ", kana: "いちまんえんさつ", romaji: "ichi-man-en satsu", english: "10,000 yen note" },
    ],
    say: {
      japanese: "こまかい おかねが ありません。",
      kana: "こまかい おかねが ありません",
      romaji: "komakai okane ga arimasen",
      english: "I don't have any small change.",
    },
    tip: "さつ (札) means a note, こうか (硬貨) a coin. The 5円 and 50円 coins are the ones with a hole through the middle — the 5円 is brass, the 50円 silver. Keep the 500円 coins: vending machines and coin lockers love them.",
  },
  {
    id: "num-10",
    scene: "money",
    canDo: "Get through a konbini till without saying a word wrong.",
    situation:
      "Your items are scanned, the total appears, and the cashier says a sentence at speed. There are only about four things it can be.",
    readings: [
      { figure: "¥1,240", japanese: "せんにひゃくよんじゅうえん", kana: "せんにひゃくよんじゅうえん", romaji: "sen-ni-hyaku-yon-juu-en", english: "1,240 yen" },
    ],
    say: {
      japanese: "これで おねがいします。",
      kana: "これで おねがいします",
      romaji: "kore de onegaishimasu",
      english: "With this, please. (handing over money)",
    },
    hear: [
      {
        japanese: "せんにひゃくよんじゅうえん に なります。",
        kana: "せんにひゃくよんじゅうえん に なります",
        romaji: "sen-ni-hyaku-yon-juu-en ni narimasu",
        english: "That comes to 1,240 yen.",
      },
      {
        japanese: "おあずかりします。",
        kana: "おあずかりします",
        romaji: "o-azukari shimasu",
        english: "I'll take that. (receiving your money)",
      },
      {
        japanese: "ろっぴゃくろくじゅうえんの おかえしです。",
        kana: "ろっぴゃくろくじゅうえんの おかえしです",
        romaji: "rop-pyaku-roku-juu-en no okaeshi desu",
        english: "660 yen is your change.",
      },
    ],
    tip: "Put your money in the little tray, not into the cashier's hand — that tray is what it is for. おかえし and おつり both mean your change; you will hear おかえし at a chain, おつり anywhere.",
  },
  {
    id: "num-11",
    scene: "money",
    canDo: "Say how you want to pay — and understand the question when it's asked.",
    situation:
      "Cards are accepted more widely every year, but the question still comes: cash or card? Answer it in one phrase and the transaction moves.",
    readings: [
      { figure: "現金", japanese: "げんきん", kana: "げんきん", romaji: "genkin", english: "cash" },
      { figure: "カード", japanese: "カード", kana: "カード", romaji: "kaado", english: "card" },
      { figure: "IC", japanese: "スイカ", kana: "スイカ", romaji: "suika", english: "Suica — the tap-to-pay IC card" },
    ],
    say: {
      japanese: "カードで おねがいします。",
      kana: "カードで おねがいします",
      romaji: "kaado de onegaishimasu",
      english: "By card, please.",
    },
    hear: [
      {
        japanese: "おしはらいは どうなさいますか。",
        kana: "おしはらいは どうなさいますか",
        romaji: "o-shiharai wa dou nasaimasu ka",
        english: "How would you like to pay?",
      },
      {
        japanese: "げんきんのみ です。",
        kana: "げんきんのみ です",
        romaji: "genkin nomi desu",
        english: "Cash only.",
      },
    ],
    pattern: {
      frame: "〜で おねがいします",
      gloss: "by 〜, please — the all-purpose 'this is how I'm paying'",
      swaps: [
        { japanese: "げんきんで おねがいします", english: "By cash, please." },
        { japanese: "カードで おねがいします", english: "By card, please." },
        { japanese: "スイカで おねがいします", english: "By Suica, please." },
      ],
    },
    tip: "げんきんのみ (cash only) is the sign to watch for on the door of every small restaurant. If you hear it after ordering, the ATM in the nearest konbini takes foreign cards.",
  },
  {
    id: "num-12",
    scene: "money",
    canDo: "Read a price tag properly — and know what you'll actually be charged.",
    situation:
      "The tag says 1,000円 in big type and something smaller underneath. Japanese shelf prices sometimes show the pre-tax figure, and the difference is ten percent.",
    readings: [
      { figure: "税込", japanese: "ぜいこみ", kana: "ぜいこみ", romaji: "zeikomi", english: "tax included — this is what you pay" },
      { figure: "税抜", japanese: "ぜいぬき", kana: "ぜいぬき", romaji: "zeinuki", english: "before tax — 10% will be added" },
      { figure: "10%", japanese: "じゅっパーセント", kana: "じゅっパーセント", romaji: "jup-paasento", english: "ten percent — the standard rate" },
      { figure: "8%", japanese: "はちパーセント", kana: "はちパーセント", romaji: "hachi-paasento", english: "eight percent — food to take away" },
      { figure: "半額", japanese: "はんがく", kana: "はんがく", romaji: "hangaku", english: "half price" },
    ],
    say: {
      japanese: "これは ぜいこみですか。",
      kana: "これは ぜいこみですか",
      romaji: "kore wa zeikomi desu ka",
      english: "Is this tax included?",
    },
    tip: "Consumption tax is 10%, but takeaway food and drink is 8% — which is why a konbini asks whether you are eating in. And 半額 stickers land on the bento shelf late in the evening, which is a genuinely good dinner plan.",
  },
  {
    id: "num-13",
    scene: "money",
    canDo: "Answer the two questions every konbini cashier asks.",
    situation:
      "Two scripted questions come at every till in the country. Neither matters much, and both stall a traveller who has not heard them before.",
    readings: [
      { figure: "¥3", japanese: "さんえん", kana: "さんえん", romaji: "san-en", english: "3 yen — a typical bag charge" },
      { figure: "¥5", japanese: "ごえん", kana: "ごえん", romaji: "go-en", english: "5 yen — a larger bag" },
    ],
    say: {
      japanese: "だいじょうぶです。",
      kana: "だいじょうぶです",
      romaji: "daijoubu desu",
      english: "I'm fine, thanks. (a polite no)",
    },
    hear: [
      {
        japanese: "ポイントカードは おもちですか。",
        kana: "ポイントカードは おもちですか",
        romaji: "pointo kaado wa o-mochi desu ka",
        english: "Do you have a point card?",
      },
      {
        japanese: "レジぶくろは ごりようですか。",
        kana: "レジぶくろは ごりようですか",
        romaji: "reji-bukuro wa go-riyou desu ka",
        english: "Would you like a bag?",
      },
    ],
    reply: [
      {
        japanese: "ふくろを おねがいします。",
        kana: "ふくろを おねがいします",
        romaji: "fukuro o onegaishimasu",
        english: "A bag, please.",
      },
    ],
    tip: "Bags have been chargeable since 2020 — a few yen, added to your total. だいじょうぶです declines either question warmly; it is the softest no in the language.",
  },
  {
    id: "num-14",
    scene: "money",
    canDo: "Split a bill, or pay for the table.",
    situation:
      "The meal is over and someone has to deal with the till. In Japan you usually pay at the counter on the way out, with the slip the waiter left on your table.",
    readings: [
      { figure: "別々", japanese: "べつべつ", kana: "べつべつ", romaji: "betsu-betsu", english: "separately" },
      { figure: "一緒", japanese: "いっしょ", kana: "いっしょ", romaji: "issho", english: "together" },
      { figure: "2人", japanese: "ふたり", kana: "ふたり", romaji: "futari", english: "two people" },
    ],
    say: {
      japanese: "べつべつで おねがいします。",
      kana: "べつべつで おねがいします",
      romaji: "betsu-betsu de onegaishimasu",
      english: "Separately, please.",
    },
    hear: [
      {
        japanese: "おしはらいは ごいっしょですか。",
        kana: "おしはらいは ごいっしょですか",
        romaji: "o-shiharai wa go-issho desu ka",
        english: "Are you paying together?",
      },
    ],
    reply: [
      {
        japanese: "おかいけい おねがいします。",
        kana: "おかいけい おねがいします",
        romaji: "o-kaikei onegaishimasu",
        english: "The bill, please.",
      },
    ],
    tip: "Splitting is normal at an izakaya and awkward at a small counter restaurant with one till — if the place is tiny, pay together and settle it outside. And never tip: leaving money behind will get someone chasing you down the street to return it.",
  },
  {
    id: "num-15",
    scene: "money",
    canDo: "Get cash out when the card machine says no.",
    situation:
      "You are somewhere cash-only with an empty wallet. The konbini on the corner is the answer — Japanese bank ATMs often refuse foreign cards, but 7-Eleven and Japan Post machines take them.",
    readings: [
      { figure: "¥10,000", japanese: "いちまんえん", kana: "いちまんえん", romaji: "ichi-man-en", english: "10,000 yen — the usual withdrawal" },
      { figure: "¥3,000", japanese: "さんぜんえん", kana: "さんぜんえん", romaji: "san-zen-en", english: "3,000 yen" },
      { figure: "ATM", japanese: "エーティーエム", kana: "エーティーエム", romaji: "ee-tii-emu", english: "ATM" },
      { figure: "両替", japanese: "りょうがえ", kana: "りょうがえ", romaji: "ryougae", english: "money exchange / breaking a note" },
    ],
    say: {
      japanese: "この カードは つかえますか。",
      kana: "この カードは つかえますか",
      romaji: "kono kaado wa tsukaemasu ka",
      english: "Can I use this card?",
    },
    reply: [
      {
        japanese: "いちまんえんさつを くずせますか。",
        kana: "いちまんえんさつを くずせますか",
        romaji: "ichi-man-en satsu o kuzusemasu ka",
        english: "Could you break a 10,000 yen note?",
      },
    ],
    tip: "ATMs ask you to choose a language before anything else — the English option is always there. Take out more than you think you need: the fee is per withdrawal, and cash-only is more common the further you get from a station.",
  },
  {
    id: "num-16",
    scene: "money",
    canDo: "Talk about price — too expensive, anything cheaper, and tax-free.",
    situation:
      "A market stall in Osaka, a souvenir shop, a department store counter. Haggling is not really a thing in Japan, but asking is.",
    readings: [
      { figure: "高い", japanese: "たかい", kana: "たかい", romaji: "takai", english: "expensive / high" },
      { figure: "安い", japanese: "やすい", kana: "やすい", romaji: "yasui", english: "cheap" },
      { figure: "免税", japanese: "めんぜい", kana: "めんぜい", romaji: "menzei", english: "tax-free" },
      { figure: "¥5,000", japanese: "ごせんえん", kana: "ごせんえん", romaji: "go-sen-en", english: "5,000 yen — the tax-free minimum" },
    ],
    say: {
      japanese: "もう すこし やすいのは ありますか。",
      kana: "もう すこし やすいのは ありますか",
      romaji: "mou sukoshi yasui no wa arimasu ka",
      english: "Is there anything a bit cheaper?",
    },
    hear: [
      {
        japanese: "めんぜいに できますよ。",
        kana: "めんぜいに できますよ",
        romaji: "menzei ni dekimasu yo",
        english: "We can do that tax-free.",
      },
    ],
    tip: "Tax-free shopping starts at 5,000円 in one shop on one day, and you need your passport in your pocket, not in the hotel safe. Asking for a discount outright is unusual — asking whether something cheaper exists is not.",
  },

  /* --- Counting things --------------------------------------------------- */
  {
    id: "num-17",
    scene: "counters",
    canDo: "Count anything at all, without knowing the right counter word.",
    situation:
      "Japanese has a different counter for almost every kind of object. This set sidesteps all of it — ひとつ, ふたつ, みっつ works for practically anything you can point at.",
    readings: [
      { figure: "1", japanese: "ひとつ", kana: "ひとつ", romaji: "hitotsu", english: "one (of anything)" },
      { figure: "2", japanese: "ふたつ", kana: "ふたつ", romaji: "futatsu", english: "two" },
      { figure: "3", japanese: "みっつ", kana: "みっつ", romaji: "mittsu", english: "three" },
      { figure: "4", japanese: "よっつ", kana: "よっつ", romaji: "yottsu", english: "four" },
      { figure: "5", japanese: "いつつ", kana: "いつつ", romaji: "itsutsu", english: "five" },
      { figure: "10", japanese: "とお", kana: "とお", romaji: "too", english: "ten" },
    ],
    say: {
      japanese: "これを ふたつ ください。",
      kana: "これを ふたつ ください",
      romaji: "kore o futatsu kudasai",
      english: "Two of these, please.",
    },
    pattern: {
      frame: "これを 〜 ください",
      gloss: "〜 of these, please — point, then count",
      swaps: [
        { japanese: "これを ひとつ ください", english: "One of these, please." },
        { japanese: "これを みっつ ください", english: "Three of these, please." },
        { japanese: "これを よっつ ください", english: "Four of these, please." },
      ],
    },
    tip: "This is the escape hatch, and it is a good one: a native speaker will happily use ふたつ rather than reach for the technically correct counter. It only goes up to とお (10) — after that you switch to じゅういち with a proper counter.",
  },
  {
    id: "num-18",
    scene: "counters",
    canDo: "Say how many people are in your party.",
    situation:
      "You walk into a restaurant and the first thing said to you is a question about numbers. Answer it before you are asked and you look like you have done this before.",
    readings: [
      { figure: "1人", japanese: "ひとり", kana: "ひとり", romaji: "hitori", english: "one person", irregular: true },
      { figure: "2人", japanese: "ふたり", kana: "ふたり", romaji: "futari", english: "two people", irregular: true },
      { figure: "3人", japanese: "さんにん", kana: "さんにん", romaji: "san-nin", english: "three people" },
      { figure: "4人", japanese: "よにん", kana: "よにん", romaji: "yo-nin", english: "four people", irregular: true },
      { figure: "5人", japanese: "ごにん", kana: "ごにん", romaji: "go-nin", english: "five people" },
    ],
    say: {
      japanese: "ふたりです。",
      kana: "ふたりです",
      romaji: "futari desu",
      english: "Two of us.",
    },
    hear: [
      {
        japanese: "なんめいさま ですか。",
        kana: "なんめいさま ですか",
        romaji: "nan-mei-sama desu ka",
        english: "How many in your party?",
      },
    ],
    tip: "One and two break the pattern completely — ひとり and ふたり, not いちにん and になん. From three onward it is just the number plus にん, except four, which is よにん rather than よんにん.",
  },
  {
    id: "num-19",
    scene: "counters",
    canDo: "Order drinks and count flat things — tickets, stamps, sheets.",
    situation:
      "Two beers at an izakaya and two adult tickets at a station window. Different counters, same job.",
    readings: [
      { figure: "1杯", japanese: "いっぱい", kana: "いっぱい", romaji: "ip-pai", english: "one cup/glass", irregular: true },
      { figure: "2杯", japanese: "にはい", kana: "にはい", romaji: "ni-hai", english: "two glasses" },
      { figure: "3杯", japanese: "さんばい", kana: "さんばい", romaji: "san-bai", english: "three glasses", irregular: true },
      { figure: "1枚", japanese: "いちまい", kana: "いちまい", romaji: "ichi-mai", english: "one sheet/ticket" },
      { figure: "2枚", japanese: "にまい", kana: "にまい", romaji: "ni-mai", english: "two tickets" },
      { figure: "3枚", japanese: "さんまい", kana: "さんまい", romaji: "san-mai", english: "three tickets" },
    ],
    say: {
      japanese: "ビールを にはい おねがいします。",
      kana: "ビールを にはい おねがいします",
      romaji: "biiru o ni-hai onegaishimasu",
      english: "Two beers, please.",
    },
    reply: [
      {
        japanese: "おとな にまい おねがいします。",
        kana: "おとな にまい おねがいします",
        romaji: "otona ni-mai onegaishimasu",
        english: "Two adult tickets, please.",
      },
    ],
    tip: "枚 is for anything flat — tickets, stamps, sheets of paper, slices of bread — and it is beautifully regular. 杯 is not: いっぱい, にはい, さんばい. Note that いっぱい also means 'full', which is a joke every Japanese learner eventually makes.",
  },
  {
    id: "num-20",
    scene: "counters",
    canDo: "Count small objects and long objects — the two you'll actually need.",
    situation:
      "Three onigiri at the konbini, two bottles of water. 個 covers small round things, 本 covers long thin ones, and both change shape at one, six and eight.",
    readings: [
      { figure: "1個", japanese: "いっこ", kana: "いっこ", romaji: "ik-ko", english: "one item", irregular: true },
      { figure: "3個", japanese: "さんこ", kana: "さんこ", romaji: "san-ko", english: "three items" },
      { figure: "6個", japanese: "ろっこ", kana: "ろっこ", romaji: "rok-ko", english: "six items", irregular: true },
      { figure: "1本", japanese: "いっぽん", kana: "いっぽん", romaji: "ip-pon", english: "one bottle", irregular: true },
      { figure: "2本", japanese: "にほん", kana: "にほん", romaji: "ni-hon", english: "two bottles" },
      { figure: "3本", japanese: "さんぼん", kana: "さんぼん", romaji: "san-bon", english: "three bottles", irregular: true },
    ],
    say: {
      japanese: "おにぎりを さんこ ください。",
      kana: "おにぎりを さんこ ください",
      romaji: "onigiri o san-ko kudasai",
      english: "Three onigiri, please.",
    },
    tip: "本 counts anything long and thin: bottles, umbrellas, pens, bananas — and also train lines and phone calls. If a counter deserts you mid-sentence, fall back on ふたつ, みっつ from the ひとつ set and nobody will blink.",
  },

  /* --- Clock & calendar --------------------------------------------------- */
  {
    id: "num-21",
    scene: "time",
    canDo: "Tell the time, and read a departure board.",
    situation:
      "Your train is at 7:42 and the last one back is at 23:15. Japanese transport runs on the clock to the minute, so the clock is worth the ten minutes it takes to learn.",
    readings: [
      { figure: "1:00", japanese: "いちじ", kana: "いちじ", romaji: "ichi-ji", english: "one o'clock" },
      { figure: "4:00", japanese: "よじ", kana: "よじ", romaji: "yo-ji", english: "four o'clock", irregular: true },
      { figure: "7:00", japanese: "しちじ", kana: "しちじ", romaji: "shichi-ji", english: "seven o'clock", irregular: true },
      { figure: "9:00", japanese: "くじ", kana: "くじ", romaji: "ku-ji", english: "nine o'clock", irregular: true },
      { figure: "7:42", japanese: "しちじ よんじゅうにふん", kana: "しちじ よんじゅうにふん", romaji: "shichi-ji yon-juu-ni-fun", english: "seven forty-two" },
    ],
    say: {
      japanese: "いま なんじですか。",
      kana: "いま なんじですか",
      romaji: "ima nan-ji desu ka",
      english: "What time is it now?",
    },
    tip: "Three hours break the pattern and they are the three you would expect from the number cards: 4時 is よじ (never よんじ), 7時 is しちじ, 9時 is くじ. Timetables use the 24-hour clock, so 23:15 is a real time you will read.",
  },
  {
    id: "num-22",
    scene: "time",
    canDo: "Say the minutes — including the six that change sound.",
    situation:
      "The station announcement gives a departure to the minute. 分 is the most irregular counter in daily use, and it is worth meeting the irregulars head-on.",
    readings: [
      { figure: "1分", japanese: "いっぷん", kana: "いっぷん", romaji: "ip-pun", english: "one minute", irregular: true },
      { figure: "3分", japanese: "さんぷん", kana: "さんぷん", romaji: "san-pun", english: "three minutes", irregular: true },
      { figure: "5分", japanese: "ごふん", kana: "ごふん", romaji: "go-fun", english: "five minutes" },
      { figure: "6分", japanese: "ろっぷん", kana: "ろっぷん", romaji: "rop-pun", english: "six minutes", irregular: true },
      { figure: "10分", japanese: "じゅっぷん", kana: "じゅっぷん", romaji: "jup-pun", english: "ten minutes", irregular: true },
      { figure: "30分", japanese: "さんじゅっぷん", kana: "さんじゅっぷん", romaji: "san-jup-pun", english: "thirty minutes / half past" },
    ],
    say: {
      japanese: "じゅっぷんぐらい かかります。",
      kana: "じゅっぷんぐらい かかります",
      romaji: "jup-pun gurai kakarimasu",
      english: "It takes about ten minutes.",
    },
    hear: [
      {
        japanese: "あるいて ごふんです。",
        kana: "あるいて ごふんです",
        romaji: "aruite go-fun desu",
        english: "It's five minutes on foot.",
      },
    ],
    tip: "The rule underneath: 1, 3, 4, 6, 8 and 10 turn ふん into ぷん. Half past is はん — しちじはん (7:30) is far more common in speech than しちじ さんじゅっぷん.",
  },
  {
    id: "num-23",
    scene: "time",
    canDo: "Read a date, and ask when something is open.",
    situation:
      "Museums close on Mondays, shrines have festival dates, and your hotel wants a check-in date. The first ten days of the month use their own ancient readings.",
    readings: [
      { figure: "1日", japanese: "ついたち", kana: "ついたち", romaji: "tsuitachi", english: "the 1st", irregular: true },
      { figure: "2日", japanese: "ふつか", kana: "ふつか", romaji: "futsuka", english: "the 2nd", irregular: true },
      { figure: "3日", japanese: "みっか", kana: "みっか", romaji: "mikka", english: "the 3rd", irregular: true },
      { figure: "8日", japanese: "ようか", kana: "ようか", romaji: "youka", english: "the 8th", irregular: true },
      { figure: "20日", japanese: "はつか", kana: "はつか", romaji: "hatsuka", english: "the 20th", irregular: true },
      { figure: "4月", japanese: "しがつ", kana: "しがつ", romaji: "shi-gatsu", english: "April", irregular: true },
    ],
    say: {
      japanese: "なんじから なんじまで ですか。",
      kana: "なんじから なんじまで ですか",
      romaji: "nan-ji kara nan-ji made desu ka",
      english: "What time are you open from and until?",
    },
    hear: [
      {
        japanese: "くじから ごじまで です。",
        kana: "くじから ごじまで です",
        romaji: "ku-ji kara go-ji made desu",
        english: "From nine until five.",
      },
    ],
    tip: "Days 1–10, plus 14, 20 and 24, use the old native readings; everything else is just the number plus にち. Months are simpler — number plus がつ — with the same three exceptions as the clock: しがつ, しちがつ, くがつ.",
  },

  /* --- Numbers in the wild ------------------------------------------------ */
  {
    id: "num-24",
    scene: "everyday",
    canDo: "Find your platform, and get on the right train.",
    situation:
      "A station announcement names a platform number and you have ninety seconds. 番線 is the word that matters.",
    readings: [
      { figure: "1番線", japanese: "いちばんせん", kana: "いちばんせん", romaji: "ichi-ban-sen", english: "platform 1" },
      { figure: "3番線", japanese: "さんばんせん", kana: "さんばんせん", romaji: "san-ban-sen", english: "platform 3" },
      { figure: "8番線", japanese: "はちばんせん", kana: "はちばんせん", romaji: "hachi-ban-sen", english: "platform 8" },
      { figure: "出口A3", japanese: "エーさん でぐち", kana: "エーさん でぐち", romaji: "ee-san deguchi", english: "exit A3" },
    ],
    say: {
      japanese: "しんじゅくゆきは なんばんせん ですか。",
      kana: "しんじゅくゆきは なんばんせん ですか",
      romaji: "shinjuku-yuki wa nan-ban-sen desu ka",
      english: "Which platform is the Shinjuku train?",
    },
    hear: [
      {
        japanese: "さんばんせん です。",
        kana: "さんばんせん です",
        romaji: "san-ban-sen desu",
        english: "Platform 3.",
      },
    ],
    pattern: {
      frame: "〜ゆきは なんばんせん ですか",
      gloss: "which platform for the 〜 train?",
      swaps: [
        { japanese: "きょうとゆきは なんばんせん ですか", english: "Which platform for Kyoto?" },
        { japanese: "くうこうゆきは なんばんせん ですか", english: "Which platform for the airport?" },
      ],
    },
    tip: "なん〜 turns any counter into its question: なんばんせん (which platform), なんじ (what time), なんにん (how many people), なんこ (how many). Learn the counter and you get the question free.",
  },
  {
    id: "num-25",
    scene: "everyday",
    canDo: "Find the right floor in a department store.",
    situation:
      "The lift panel has eight floors and a basement, and what you want is on 地下1階. Floors are counted with 階, which bends at three, six and ten.",
    readings: [
      { figure: "1階", japanese: "いっかい", kana: "いっかい", romaji: "ik-kai", english: "1st floor (ground floor)", irregular: true },
      { figure: "3階", japanese: "さんがい", kana: "さんがい", romaji: "san-gai", english: "3rd floor", irregular: true },
      { figure: "6階", japanese: "ろっかい", kana: "ろっかい", romaji: "rok-kai", english: "6th floor", irregular: true },
      { figure: "B1", japanese: "ちかいっかい", kana: "ちかいっかい", romaji: "chika ik-kai", english: "basement level 1" },
      { figure: "何階", japanese: "なんがい", kana: "なんがい", romaji: "nan-gai", english: "which floor?" },
    ],
    say: {
      japanese: "トイレは なんがい ですか。",
      kana: "トイレは なんがい ですか",
      romaji: "toire wa nan-gai desu ka",
      english: "Which floor is the toilet on?",
    },
    hear: [
      {
        japanese: "ちかいっかい です。",
        kana: "ちかいっかい です",
        romaji: "chika ik-kai desu",
        english: "Basement level one.",
      },
    ],
    tip: "地下 (ちか) means below ground, and the basement of a department store — the depachika — is where the food hall is. It is the best-value meal in any Japanese city, especially in the last hour before closing.",
  },
  {
    id: "num-26",
    scene: "everyday",
    canDo: "Give a phone number, and book a room for a number of nights.",
    situation:
      "Check-in, a restaurant booking, a lost-property form. Phone numbers are read digit by digit, and nights are counted with 泊.",
    readings: [
      { figure: "0-", japanese: "ゼロの", kana: "ゼロの", romaji: "zero no", english: "'zero, dash' — の reads the hyphen" },
      { figure: "1泊", japanese: "いっぱく", kana: "いっぱく", romaji: "ip-paku", english: "one night", irregular: true },
      { figure: "2泊", japanese: "にはく", kana: "にはく", romaji: "ni-haku", english: "two nights" },
      { figure: "3泊", japanese: "さんぱく", kana: "さんぱく", romaji: "san-paku", english: "three nights", irregular: true },
      { figure: "203号室", japanese: "にひゃくさんごうしつ", kana: "にひゃくさんごうしつ", romaji: "ni-hyaku-san goushitsu", english: "room 203" },
    ],
    say: {
      japanese: "にはく おねがいします。",
      kana: "にはく おねがいします",
      romaji: "ni-haku onegaishimasu",
      english: "Two nights, please.",
    },
    hear: [
      {
        japanese: "おでんわばんごうを おねがいします。",
        kana: "おでんわばんごうを おねがいします",
        romaji: "o-denwa-bangou o onegaishimasu",
        english: "Your phone number, please.",
      },
    ],
    tip: "Read a phone number one digit at a time and say の where the hyphen is: 090-1234-5678 becomes ゼロ きゅう ゼロ の いち に さん よん の… Use なな and きゅう rather than しち and く — they are much harder to mishear.",
  },
];

const BY_ID = new Map(NUMBER_CARDS.map((c) => [c.id, c]));

export function getNumberCard(id: string): NumberCard | undefined {
  return BY_ID.get(id);
}

/** Every reading in the deck, tagged with the card it came from. */
const ALL_READINGS: { card: NumberCard; reading: NumberReading }[] = NUMBER_CARDS.flatMap(
  (card) => card.readings.map((reading) => ({ card, reading }))
);

/* ---------------------------------------------------------------------------
   The figure quiz.

   A reveal card shows you 1,500円 and then tells you it is せんごひゃくえん,
   which is exposure rather than recall — the learner grades themselves and a
   shrug passes. The quiz turns the same card into a question that can be got
   wrong: the printed figure on one side, four readings on the other.

   Distractors come from the same card first, because that is where the real
   confusions live — さんびゃく against さんぜん, ろっぴゃく against ろくせん.
   Being asked to tell 300 from "three o'clock" teaches nothing; being asked to
   tell 300 from 3,000 is the entire skill. The pool is topped up from the same
   scene, then from the rest of the deck, when one card is too small.
   --------------------------------------------------------------------------- */

const CHOICE_COUNT = 4;

function shuffled<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export interface NumberQuiz {
  /** What is printed, and the question. */
  figure: string;
  /** The reading being asked for. Also present in `choices`. */
  answer: NumberReading;
  choices: NumberReading[];
}

/**
 * One question for a card: a figure off it, plus plausible wrong readings,
 * shuffled. Returns null when the deck cannot furnish at least two distinct
 * options — a "multiple choice" listing only the right answer gives the game
 * away, so the caller should fall back to a reveal card instead.
 */
export function buildNumberQuiz(card: NumberCard): NumberQuiz | null {
  if (card.readings.length === 0) return null;
  const answer = card.readings[Math.floor(Math.random() * card.readings.length)];

  // Two readings are the same question when they are said the same way, and
  // an alternative reading of the same figure (0 as ゼロ or れい) is not a
  // wrong answer either — both are ruled out as distractors.
  const takenKana = new Set([answer.kana]);
  const takenFigures = new Set([answer.figure]);

  const sameCard = shuffled(ALL_READINGS.filter((r) => r.card.id === card.id));
  const sameScene = shuffled(
    ALL_READINGS.filter((r) => r.card.id !== card.id && r.card.scene === card.scene)
  );
  const elsewhere = shuffled(ALL_READINGS.filter((r) => r.card.scene !== card.scene));

  const distractors: NumberReading[] = [];
  for (const { reading } of [...sameCard, ...sameScene, ...elsewhere]) {
    if (distractors.length >= CHOICE_COUNT - 1) break;
    if (takenKana.has(reading.kana) || takenFigures.has(reading.figure)) continue;
    takenKana.add(reading.kana);
    takenFigures.add(reading.figure);
    distractors.push(reading);
  }

  if (distractors.length === 0) return null;
  return { figure: answer.figure, answer, choices: shuffled([answer, ...distractors]) };
}
