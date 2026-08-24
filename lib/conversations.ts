/* ===========================================================================
   Conversation — the survival-speaking track.

   This category exists to do one thing: get a traveller through a day in
   Japan out loud. It is built on four methodologies that are well established
   in second-language research and in the Japanese-teaching literature
   specifically, and each one shows up as a field on the cards below.

   1. Can-do objectives (JF Standard for Japanese-Language Education, the
      Japan Foundation's CEFR-aligned framework, and the Marugoto course built
      on it). Every item names a real-world task the learner will be able to
      perform — "pay, and say how" — instead of a grammar point. `canDo`.

   2. Task-based language teaching (Long; Ellis). A card is a rehearsal of a
      concrete situation, not a flashcard: the learner is put at the counter
      first and asked what they would say. TBLT's own research finding is that
      this produces fluency and pragmatic competence — using language
      appropriately — faster than a structural syllabus. `situation`.

   3. The lexical approach / formulaic sequences (Lewis; Taguchi's 2007 study
      of chunk instruction in a Japanese-as-a-foreign-language classroom).
      Fluent speakers run on prefabricated chunks, so each item teaches one
      whole usable line rather than words to assemble under pressure — plus
      the frame behind it and the words that slot into it. `say`, `pattern`.

   4. Pimsleur's anticipation principle. Real conversation is a challenge and
      a response: the useful half of a transaction is usually the part the
      other person says. Every card carries what will come back at you and how
      to answer it, so no exchange ends in a shrug. `hear`, `reply`.
      (Pimsleur's other principle, graduated interval recall, is the app's
      existing SRS — these cards ride it like every other content type.)

   Two deliberate conventions:

   * Everything is written in kana, spaced into chunks. This category unlocks
     only once every kana is at Learning or better, so the promise it can make
     is that the learner can read every character on every card — which is
     also why the lines are segmented the way beginner materials segment them.
   * Romaji uses the pronunciation, not the spelling: を is "o", because the
     learner is going to say it.

   Ids are stored on lesson items and on the review rows carrying a learner's
   mastery of each exchange, so they are append-only: add to the end, never
   renumber or reuse.
   =========================================================================== */

export type ConversationScene =
  | "core"
  | "konbini"
  | "restaurant"
  | "transport"
  | "directions"
  | "shopping"
  | "hotel"
  | "trouble";

export const SCENE_LABELS: Record<ConversationScene, string> = {
  core: "Anywhere",
  konbini: "Konbini",
  restaurant: "Eating out",
  transport: "Trains & taxis",
  directions: "Directions",
  shopping: "Shops",
  hotel: "Hotel",
  trouble: "When it goes wrong",
};

export interface ConversationLine {
  /** As it appears on the card: kana, spaced into chunks. */
  japanese: string;
  /** The reading fed to speech and to pronunciation scoring. */
  kana: string;
  romaji: string;
  english: string;
}

export interface ConversationPattern {
  /** The reusable frame, with 〜 marking the slot. */
  frame: string;
  /** What the frame means once something is in the slot. */
  gloss: string;
  /** Other things that go in the slot, so one chunk becomes many. */
  swaps: { japanese: string; english: string }[];
}

export interface ConversationExchange {
  id: string;
  scene: ConversationScene;
  /** The real-world task this card makes possible (JF Standard style). */
  canDo: string;
  /** The moment being rehearsed. */
  situation: string;
  /** True when the other person speaks first, so the card opens on `hear`. */
  theySpeakFirst?: boolean;
  /** The line the learner produces. */
  say: ConversationLine;
  /** What comes back at them. */
  hear: ConversationLine[];
  /** How to answer what came back, when there is a choice to make. */
  reply: ConversationLine[];
  pattern?: ConversationPattern;
  /** One line of practical or pragmatic guidance. */
  tip: string;
}

/** Curriculum order: the chunks that carry everything first, then the day. */
export const CONVERSATIONS: ConversationExchange[] = [
  // --- Anywhere: the handful of chunks that carry an entire trip -----------
  {
    id: "conv-0",
    scene: "core",
    canDo: "Get anyone's attention, politely, anywhere.",
    situation:
      "You are standing at a counter and nobody has noticed you yet. One word opens almost every exchange in Japan.",
    say: {
      japanese: "すみません。",
      kana: "すみません",
      romaji: "sumimasen",
      english: "Excuse me.",
    },
    hear: [
      { japanese: "はい。", kana: "はい", romaji: "hai", english: "Yes?" },
      { japanese: "はい、どうぞ。", kana: "はい、どうぞ", romaji: "hai, douzo", english: "Yes, go ahead." },
    ],
    reply: [],
    pattern: {
      frame: "すみません、〜",
      gloss: "Excuse me — …",
      swaps: [
        { japanese: "すみません、トイレは どこですか。", english: "Excuse me, where is the toilet?" },
        { japanese: "すみません、これを ください。", english: "Excuse me, I'll take this." },
      ],
    },
    tip: "すみません is an apology, an 'excuse me' and a light 'thank you' all at once. Open every request with it and you are already being polite.",
  },
  {
    id: "conv-1",
    scene: "core",
    canDo: "Ask for anything you can point at, without knowing its name.",
    situation:
      "You are at a counter or a menu and you have no idea what the thing you want is called. You still need to ask for it.",
    say: {
      japanese: "おねがいします。",
      kana: "おねがいします",
      romaji: "onegaishimasu",
      english: "Please. / Yes, please.",
    },
    hear: [
      { japanese: "かしこまりました。", kana: "かしこまりました", romaji: "kashikomarimashita", english: "Certainly." },
      { japanese: "はい、しょうしょう おまちください。", kana: "はい、しょうしょうおまちください", romaji: "hai, shoushou omachi kudasai", english: "Yes, one moment please." },
    ],
    reply: [],
    pattern: {
      frame: "〜、おねがいします。",
      gloss: "…, please.",
      swaps: [
        { japanese: "これ、おねがいします。", english: "This one, please." },
        { japanese: "チェックイン、おねがいします。", english: "Check-in, please." },
        { japanese: "しんじゅくまで、おねがいします。", english: "To Shinjuku, please." },
      ],
    },
    tip: "Point first, then say it. おねがいします turns a gesture into a polite request — and it is also the right answer to almost any 'would you like…?' question.",
  },
  {
    id: "conv-2",
    scene: "core",
    canDo: "Buy or order anything on a shelf, a menu or a display.",
    situation:
      "The thing you want is right there in front of you. You need four syllables and a finger.",
    say: {
      japanese: "これを ください。",
      kana: "これをください",
      romaji: "kore o kudasai",
      english: "This one, please.",
    },
    hear: [
      { japanese: "こちらですね。", kana: "こちらですね", romaji: "kochira desu ne", english: "This one, right?" },
      { japanese: "ほかには？", kana: "ほかには", romaji: "hoka ni wa?", english: "Anything else?" },
    ],
    reply: [
      { japanese: "はい。", kana: "はい", romaji: "hai", english: "Yes." },
      { japanese: "いじょうです。", kana: "いじょうです", romaji: "ijou desu", english: "That's everything." },
    ],
    pattern: {
      frame: "〜を ください。",
      gloss: "…, please. (things)",
      swaps: [
        { japanese: "おみずを ください。", english: "Water, please." },
        { japanese: "メニューを ください。", english: "A menu, please." },
        { japanese: "レシートを ください。", english: "A receipt, please." },
      ],
    },
    tip: "ください is for things you can point at; おねがいします is for actions and services. Both are polite — when unsure, おねがいします is never wrong.",
  },
  {
    id: "conv-3",
    scene: "core",
    canDo: "Close any exchange warmly.",
    situation:
      "You have what you came for and it is time to leave. How you finish is what the other person remembers.",
    say: {
      japanese: "ありがとうございます。",
      kana: "ありがとうございます",
      romaji: "arigatou gozaimasu",
      english: "Thank you very much.",
    },
    hear: [
      { japanese: "ありがとうございました。", kana: "ありがとうございました", romaji: "arigatou gozaimashita", english: "Thank you (for your custom)." },
      { japanese: "どういたしまして。", kana: "どういたしまして", romaji: "dou itashimashite", english: "You're welcome." },
    ],
    reply: [],
    tip: "Staff use the past-tense ございました as you leave — it marks the exchange as finished. A small nod while you say it does more work than perfect grammar.",
  },
  {
    id: "conv-4",
    scene: "core",
    canDo: "Turn down anything you are offered, politely.",
    situation:
      "A cashier offers you a bag, chopsticks, a point card. You want none of it, and a flat いいえ lands hard.",
    say: {
      japanese: "だいじょうぶです。",
      kana: "だいじょうぶです",
      romaji: "daijoubu desu",
      english: "I'm fine, thank you.",
    },
    hear: [
      { japanese: "かしこまりました。", kana: "かしこまりました", romaji: "kashikomarimashita", english: "Certainly." },
      { japanese: "はい、しつれいしました。", kana: "はい、しつれいしました", romaji: "hai, shitsurei shimashita", english: "Right, excuse me." },
    ],
    reply: [],
    pattern: {
      frame: "だいじょうぶです。",
      gloss: "No thank you / I'm OK.",
      swaps: [
        { japanese: "けっこうです。", english: "No thank you. (firmer)" },
        { japanese: "いりません。", english: "I don't need it." },
      ],
    },
    tip: "だいじょうぶです is the softest 'no' in Japanese and covers nearly every offer. It also means 'I'm OK' when someone asks whether you need help.",
  },
  {
    id: "conv-5",
    scene: "core",
    canDo: "Say that you don't speak Japanese, and ask for English.",
    situation:
      "The exchange has moved past you and you would rather say so than nod at something you didn't understand.",
    say: {
      japanese: "すみません、にほんごが よく わかりません。えいごを はなせますか。",
      kana: "すみません、にほんごがよくわかりません。えいごをはなせますか",
      romaji: "sumimasen, nihongo ga yoku wakarimasen. eigo o hanasemasu ka",
      english: "Sorry, I don't understand Japanese well. Can you speak English?",
    },
    hear: [
      { japanese: "すこしだけ。", kana: "すこしだけ", romaji: "sukoshi dake", english: "Only a little." },
      { japanese: "ちょっと まってください。", kana: "ちょっとまってください", romaji: "chotto matte kudasai", english: "One moment, please." },
      { japanese: "えいごの メニューが あります。", kana: "えいごのメニューがあります", romaji: "eigo no menyuu ga arimasu", english: "We have an English menu." },
    ],
    reply: [],
    tip: "Lead with すみません, finish with a smile. 'ちょっと まってください' usually means someone is being fetched — wait rather than walking off.",
  },
  {
    id: "conv-6",
    scene: "core",
    canDo: "Ask someone to say it again, slowly.",
    situation:
      "They answered you and it went past at full speed. This is the most valuable repair line you can carry.",
    say: {
      japanese: "すみません、もう いちど、ゆっくり おねがいします。",
      kana: "すみません、もういちど、ゆっくりおねがいします",
      romaji: "sumimasen, mou ichido, yukkuri onegaishimasu",
      english: "Sorry — once more, slowly please.",
    },
    hear: [
      { japanese: "あ、はい。", kana: "あ、はい", romaji: "a, hai", english: "Oh — of course." },
      { japanese: "ゆっくり いいますね。", kana: "ゆっくりいいますね", romaji: "yukkuri iimasu ne", english: "I'll say it slowly." },
    ],
    reply: [],
    tip: "People slow down instantly when asked — they simply had no idea they were fast. Use this instead of nodding at something you didn't catch.",
  },

  // --- Konbini: the transaction you will have most often ------------------
  {
    id: "conv-7",
    scene: "konbini",
    canDo: "Answer when a cashier asks whether to heat your food.",
    situation:
      "You put a bento on the konbini counter. The cashier says something and reaches towards the microwave.",
    theySpeakFirst: true,
    say: {
      japanese: "はい、おねがいします。",
      kana: "はい、おねがいします",
      romaji: "hai, onegaishimasu",
      english: "Yes, please.",
    },
    hear: [
      { japanese: "あたためますか。", kana: "あたためますか", romaji: "atatamemasu ka", english: "Shall I heat this up?" },
    ],
    reply: [
      { japanese: "だいじょうぶです。", kana: "だいじょうぶです", romaji: "daijoubu desu", english: "No, it's fine as it is." },
    ],
    tip: "You may hear it as あたためましょうか too. Either way the answer is おねがいします or だいじょうぶです — you never need the verb yourself.",
  },
  {
    id: "conv-8",
    scene: "konbini",
    canDo: "Say whether you want a bag.",
    situation:
      "Your items are scanned and the cashier's hand hovers over the bags. Since 2020 they cost a few yen, so you will be asked every single time.",
    theySpeakFirst: true,
    say: {
      japanese: "だいじょうぶです。",
      kana: "だいじょうぶです",
      romaji: "daijoubu desu",
      english: "No thanks, I'm fine.",
    },
    hear: [
      { japanese: "ふくろは いりますか。", kana: "ふくろはいりますか", romaji: "fukuro wa irimasu ka", english: "Do you need a bag?" },
      { japanese: "レジぶくろは ごりようですか。", kana: "レジぶくろはごりようですか", romaji: "reji bukuro wa goriyou desu ka", english: "Will you be using a carrier bag?" },
    ],
    reply: [
      { japanese: "おねがいします。", kana: "おねがいします", romaji: "onegaishimasu", english: "Yes, please." },
    ],
    tip: "Listen for ふくろ — that one word is the whole question, however elaborately it is wrapped.",
  },
  {
    id: "conv-9",
    scene: "konbini",
    canDo: "Ask for, or decline, chopsticks and cutlery.",
    situation:
      "You bought something hot. The cashier asks whether to put chopsticks in the bag.",
    theySpeakFirst: true,
    say: {
      japanese: "おねがいします。",
      kana: "おねがいします",
      romaji: "onegaishimasu",
      english: "Yes, please.",
    },
    hear: [
      { japanese: "おはしは おつけしますか。", kana: "おはしはおつけしますか", romaji: "ohashi wa otsuke shimasu ka", english: "Shall I add chopsticks?" },
      { japanese: "スプーンは いりますか。", kana: "スプーンはいりますか", romaji: "supuun wa irimasu ka", english: "Do you need a spoon?" },
    ],
    reply: [
      { japanese: "だいじょうぶです。", kana: "だいじょうぶです", romaji: "daijoubu desu", english: "No, I'm fine." },
    ],
    tip: "おはし is chopsticks, スプーン a spoon, フォーク a fork. Same two answers for all three.",
  },
  {
    id: "conv-10",
    scene: "konbini",
    canDo: "Pay, and say how you are paying.",
    situation:
      "The total is read out and the cashier is waiting. Saying how you'll pay before they ask makes the whole thing smooth.",
    say: {
      japanese: "カードで おねがいします。",
      kana: "カードでおねがいします",
      romaji: "kaado de onegaishimasu",
      english: "By card, please.",
    },
    hear: [
      { japanese: "ごうけい せんにひゃくえんに なります。", kana: "ごうけいせんにひゃくえんになります", romaji: "goukei sen nihyaku en ni narimasu", english: "That's 1,200 yen in total." },
      { japanese: "おしはらいほうほうは？", kana: "おしはらいほうほうは", romaji: "oshiharai houhou wa?", english: "How will you be paying?" },
    ],
    reply: [
      { japanese: "げんきんで おねがいします。", kana: "げんきんでおねがいします", romaji: "genkin de onegaishimasu", english: "Cash, please." },
    ],
    pattern: {
      frame: "〜で おねがいします。",
      gloss: "By …, please. (method)",
      swaps: [
        { japanese: "げんきんで おねがいします。", english: "By cash, please." },
        { japanese: "カードで おねがいします。", english: "By card, please." },
        { japanese: "スイカで おねがいします。", english: "By Suica, please." },
      ],
    },
    tip: "Put cash and cards in the little tray rather than into the cashier's hand. Plenty of small places are still cash-only, so always carry yen.",
  },
  {
    id: "conv-11",
    scene: "konbini",
    canDo: "Handle the point-card question without freezing.",
    situation:
      "Mid-transaction you are asked something long and you catch only ポイントカード. It is not about payment — it is a loyalty card you don't have.",
    theySpeakFirst: true,
    say: {
      japanese: "だいじょうぶです。",
      kana: "だいじょうぶです",
      romaji: "daijoubu desu",
      english: "I don't have one, thanks.",
    },
    hear: [
      { japanese: "ポイントカードは おもちですか。", kana: "ポイントカードはおもちですか", romaji: "pointo kaado wa omochi desu ka", english: "Do you have a point card?" },
    ],
    reply: [],
    tip: "Nothing turns on the answer — travellers can always decline. Recognising the question is the whole skill here.",
  },

  // --- Eating out ---------------------------------------------------------
  {
    id: "conv-12",
    scene: "restaurant",
    canDo: "Say how many people are in your party.",
    situation:
      "You step inside a restaurant and a member of staff comes straight over with one question.",
    theySpeakFirst: true,
    say: {
      japanese: "ふたりです。",
      kana: "ふたりです",
      romaji: "futari desu",
      english: "Two people.",
    },
    hear: [
      { japanese: "なんめいさまですか。", kana: "なんめいさまですか", romaji: "nanmei sama desu ka", english: "How many in your party?" },
      { japanese: "こちらへ どうぞ。", kana: "こちらへどうぞ", romaji: "kochira e douzo", english: "This way, please." },
    ],
    reply: [
      { japanese: "ひとりです。", kana: "ひとりです", romaji: "hitori desu", english: "Just me." },
    ],
    pattern: {
      frame: "〜です。",
      gloss: "Counting people",
      swaps: [
        { japanese: "ひとりです。", english: "1 person" },
        { japanese: "ふたりです。", english: "2 people" },
        { japanese: "さんにんです。", english: "3 people" },
        { japanese: "よにんです。", english: "4 people" },
      ],
    },
    tip: "Hold up fingers as you say it. ひとり and ふたり are irregular; from three on it is just the number plus にん.",
  },
  {
    id: "conv-13",
    scene: "restaurant",
    canDo: "Call a server over and order.",
    situation:
      "You have decided. Now you have to get someone's attention across a busy room — which in Japan you do out loud.",
    say: {
      japanese: "すみません！これを ひとつ ください。",
      kana: "すみません、これをひとつください",
      romaji: "sumimasen! kore o hitotsu kudasai",
      english: "Excuse me! One of these, please.",
    },
    hear: [
      { japanese: "はい、ただいま。", kana: "はい、ただいま", romaji: "hai, tadaima", english: "Yes, right away." },
      { japanese: "いじょうで よろしいですか。", kana: "いじょうでよろしいですか", romaji: "ijou de yoroshii desu ka", english: "Will that be all?" },
    ],
    reply: [
      { japanese: "はい、いじょうです。", kana: "はい、いじょうです", romaji: "hai, ijou desu", english: "Yes, that's everything." },
    ],
    pattern: {
      frame: "これを 〜 ください。",
      gloss: "… of these, please.",
      swaps: [
        { japanese: "これを ひとつ ください。", english: "One of these, please." },
        { japanese: "これを ふたつ ください。", english: "Two of these, please." },
        { japanese: "これを みっつ ください。", english: "Three of these, please." },
      ],
    },
    tip: "Calling すみません across a restaurant is normal and expected, not rude. Many places also have a call button on the table.",
  },
  {
    id: "conv-14",
    scene: "restaurant",
    canDo: "Ask what the place is known for.",
    situation:
      "The menu is long, in Japanese, and unphotographed. Hand the decision to someone who knows.",
    say: {
      japanese: "おすすめは なんですか。",
      kana: "おすすめはなんですか",
      romaji: "osusume wa nan desu ka",
      english: "What do you recommend?",
    },
    hear: [
      { japanese: "こちらが にんきです。", kana: "こちらがにんきです", romaji: "kochira ga ninki desu", english: "This one is popular." },
      { japanese: "きょうは これが おすすめです。", kana: "きょうはこれがおすすめです", romaji: "kyou wa kore ga osusume desu", english: "Today I'd recommend this." },
    ],
    reply: [
      { japanese: "じゃあ、それを ください。", kana: "じゃあ、それをください", romaji: "jaa, sore o kudasai", english: "That one, then, please." },
    ],
    tip: "Ask it anywhere — restaurants, sake shops, tea counters. Staff enjoy the question, and they answer by pointing at the menu, which solves the reading problem too.",
  },
  {
    id: "conv-15",
    scene: "restaurant",
    canDo: "Say what you cannot eat.",
    situation:
      "You have an allergy or something you avoid, and you need it understood before the food arrives.",
    say: {
      japanese: "すみません、たまごが たべられません。",
      kana: "すみません、たまごがたべられません",
      romaji: "sumimasen, tamago ga taberaremasen",
      english: "Sorry — I can't eat egg.",
    },
    hear: [
      { japanese: "かくにん して きます。", kana: "かくにんしてきます", romaji: "kakunin shite kimasu", english: "I'll go and check." },
      { japanese: "こちらは だいじょうぶです。", kana: "こちらはだいじょうぶです", romaji: "kochira wa daijoubu desu", english: "This one is fine." },
    ],
    reply: [],
    pattern: {
      frame: "〜が たべられません。",
      gloss: "I can't eat ….",
      swaps: [
        { japanese: "にくが たべられません。", english: "I can't eat meat." },
        { japanese: "さかなが たべられません。", english: "I can't eat fish." },
        { japanese: "えびが たべられません。", english: "I can't eat prawns." },
        { japanese: "こむぎが たべられません。", english: "I can't eat wheat." },
      ],
    },
    tip: "Dashi (fish stock) is in almost everything, so vegetarians want 'にくと さかなが たべられません'. For a serious allergy, carry it written down as well as said.",
  },
  {
    id: "conv-16",
    scene: "restaurant",
    canDo: "Ask for water or anything else at the table.",
    situation:
      "Your glass is empty. Water and tea are free everywhere, and asking for more is completely ordinary.",
    say: {
      japanese: "おみず、おねがいします。",
      kana: "おみず、おねがいします",
      romaji: "omizu, onegaishimasu",
      english: "Water, please.",
    },
    hear: [
      { japanese: "はい、どうぞ。", kana: "はい、どうぞ", romaji: "hai, douzo", english: "Here you are." },
      { japanese: "すぐ おもちします。", kana: "すぐおもちします", romaji: "sugu omochi shimasu", english: "I'll bring it right away." },
    ],
    reply: [],
    pattern: {
      frame: "〜、おねがいします。",
      gloss: "…, please. (at the table)",
      swaps: [
        { japanese: "おちゃ、おねがいします。", english: "Tea, please." },
        { japanese: "とりざら、おねがいします。", english: "A small plate, please." },
        { japanese: "おしぼり、おねがいします。", english: "A hand towel, please." },
      ],
    },
    tip: "The restaurant word for cold water is おひや — you'll hear it, but おみず works perfectly well when you say it.",
  },
  {
    id: "conv-17",
    scene: "restaurant",
    canDo: "Ask for the bill and pay.",
    situation:
      "You are finished. In most places the bill is not brought to you — you go to it.",
    say: {
      japanese: "おかいけい、おねがいします。",
      kana: "おかいけい、おねがいします",
      romaji: "okaikei, onegaishimasu",
      english: "The bill, please.",
    },
    hear: [
      { japanese: "レジで おねがいします。", kana: "レジでおねがいします", romaji: "reji de onegaishimasu", english: "At the register, please." },
      { japanese: "でんぴょうを おもちください。", kana: "でんぴょうをおもちください", romaji: "denpyou o omochi kudasai", english: "Please bring the slip." },
    ],
    reply: [],
    tip: "The slip on your table is the bill — take it to the front register. You can also cross your index fingers into an X, the standard silent way to ask.",
  },
  {
    id: "conv-18",
    scene: "restaurant",
    canDo: "Leave the way a regular would.",
    situation:
      "You have paid and you are at the door. One phrase turns a transaction into a good exchange.",
    say: {
      japanese: "ごちそうさまでした。",
      kana: "ごちそうさまでした",
      romaji: "gochisousama deshita",
      english: "Thank you for the meal.",
    },
    hear: [
      { japanese: "ありがとうございました。", kana: "ありがとうございました", romaji: "arigatou gozaimashita", english: "Thank you very much." },
      { japanese: "また どうぞ。", kana: "またどうぞ", romaji: "mata douzo", english: "Please come again." },
    ],
    reply: [],
    tip: "It lands warmly everywhere, from a standing ramen counter to someone's kitchen. Its partner いただきます is what you say before eating.",
  },

  // --- Trains, buses and taxis -------------------------------------------
  {
    id: "conv-19",
    scene: "transport",
    canDo: "Find out which platform your train leaves from.",
    situation:
      "You are in a station the size of a town, the signs are scrolling, and you need one number.",
    say: {
      japanese: "すみません、しんじゅくゆきは なんばんせんですか。",
      kana: "すみません、しんじゅくゆきはなんばんせんですか",
      romaji: "sumimasen, shinjuku yuki wa nanbansen desu ka",
      english: "Excuse me — which platform for Shinjuku?",
    },
    hear: [
      { japanese: "さんばんせんです。", kana: "さんばんせんです", romaji: "sanbansen desu", english: "Platform 3." },
      { japanese: "あちらです。", kana: "あちらです", romaji: "achira desu", english: "Over that way." },
    ],
    reply: [],
    pattern: {
      frame: "〜ゆきは なんばんせんですか。",
      gloss: "Which platform for …?",
      swaps: [
        { japanese: "きょうとゆきは なんばんせんですか。", english: "Which platform for Kyoto?" },
        { japanese: "くうこうゆきは なんばんせんですか。", english: "Which platform for the airport?" },
      ],
    },
    tip: "Platform numbers are shown in numerals everywhere, so even if the rest of the answer goes past you, the number will not.",
  },
  {
    id: "conv-20",
    scene: "transport",
    canDo: "Check that a train actually goes where you're going.",
    situation:
      "A train is at the platform with its doors open. Local, rapid and express services share platforms, and the fast one may not stop where you want.",
    say: {
      japanese: "これは きょうとに いきますか。",
      kana: "これはきょうとにいきますか",
      romaji: "kore wa kyouto ni ikimasu ka",
      english: "Does this go to Kyoto?",
    },
    hear: [
      { japanese: "はい、いきます。", kana: "はい、いきます", romaji: "hai, ikimasu", english: "Yes, it does." },
      { japanese: "いいえ、つぎのです。", kana: "いいえ、つぎのです", romaji: "iie, tsugi no desu", english: "No — the next one." },
    ],
    reply: [],
    pattern: {
      frame: "これは 〜に いきますか。",
      gloss: "Does this go to …?",
      swaps: [
        { japanese: "これは しぶやに いきますか。", english: "Does this go to Shibuya?" },
        { japanese: "これは くうこうに いきますか。", english: "Does this go to the airport?" },
      ],
    },
    tip: "Ask it at the door before boarding, of staff or of any passenger. A headshake and a point at the next train is a complete answer.",
  },
  {
    id: "conv-21",
    scene: "transport",
    canDo: "Top up an IC card.",
    situation:
      "The gate beeped and refused you: your Suica or ICOCA is out of credit. Any konbini register will fix it.",
    say: {
      japanese: "チャージ、おねがいします。",
      kana: "チャージ、おねがいします",
      romaji: "chaaji, onegaishimasu",
      english: "Top-up, please.",
    },
    hear: [
      { japanese: "いくら チャージ しますか。", kana: "いくらチャージしますか", romaji: "ikura chaaji shimasu ka", english: "How much would you like to add?" },
    ],
    reply: [
      { japanese: "せんえん、おねがいします。", kana: "せんえん、おねがいします", romaji: "sen en, onegaishimasu", english: "1,000 yen, please." },
      { japanese: "にせんえん、おねがいします。", kana: "にせんえん、おねがいします", romaji: "nisen en, onegaishimasu", english: "2,000 yen, please." },
    ],
    tip: "IC card top-ups are cash only, at machines and at konbini alike. The same card then works on trains, buses and at the konbini itself.",
  },
  {
    id: "conv-22",
    scene: "transport",
    canDo: "Tell a taxi driver where you are going.",
    situation:
      "You are in the back of a taxi with the address on your phone screen. The doors closed themselves.",
    say: {
      japanese: "ここまで おねがいします。",
      kana: "ここまでおねがいします",
      romaji: "koko made onegaishimasu",
      english: "To here, please.",
    },
    hear: [
      { japanese: "かしこまりました。", kana: "かしこまりました", romaji: "kashikomarimashita", english: "Certainly." },
      { japanese: "じゅうしょは わかりますか。", kana: "じゅうしょはわかりますか", romaji: "juusho wa wakarimasu ka", english: "Do you know the address?" },
    ],
    reply: [],
    pattern: {
      frame: "〜まで おねがいします。",
      gloss: "To …, please.",
      swaps: [
        { japanese: "えきまで おねがいします。", english: "To the station, please." },
        { japanese: "ホテルまで おねがいします。", english: "To the hotel, please." },
        { japanese: "この じゅうしょまで おねがいします。", english: "To this address, please." },
      ],
    },
    tip: "Never touch a taxi door — it opens and closes automatically. Show the address on screen; drivers navigate by address far more reliably than by name.",
  },
  {
    id: "conv-23",
    scene: "transport",
    canDo: "Ask to be let out where you want.",
    situation:
      "You can see the place. Say something now, a little before you arrive, rather than at the moment you pass it.",
    say: {
      japanese: "ここで だいじょうぶです。",
      kana: "ここでだいじょうぶです",
      romaji: "koko de daijoubu desu",
      english: "Here is fine.",
    },
    hear: [
      { japanese: "こちらで よろしいですか。", kana: "こちらでよろしいですか", romaji: "kochira de yoroshii desu ka", english: "Is here all right?" },
      { japanese: "はい、とまります。", kana: "はい、とまります", romaji: "hai, tomarimasu", english: "Yes, I'll stop." },
    ],
    reply: [],
    tip: "The same phrase works for a taxi and for asking a bus driver to let you off. Stay seated until the vehicle has fully stopped — drivers will tell you so.",
  },

  // --- Directions ---------------------------------------------------------
  {
    id: "conv-24",
    scene: "directions",
    canDo: "Ask where something is, and understand the answer.",
    situation:
      "You are lost in a grid of streets with no names. Almost everyone you ask will help, and many will walk you there.",
    say: {
      japanese: "すみません、えきは どこですか。",
      kana: "すみません、えきはどこですか",
      romaji: "sumimasen, eki wa doko desu ka",
      english: "Excuse me, where is the station?",
    },
    hear: [
      { japanese: "まっすぐです。", kana: "まっすぐです", romaji: "massugu desu", english: "Straight ahead." },
      { japanese: "ひだりです。", kana: "ひだりです", romaji: "hidari desu", english: "To the left." },
      { japanese: "みぎです。", kana: "みぎです", romaji: "migi desu", english: "To the right." },
      { japanese: "あの さきです。", kana: "あのさきです", romaji: "ano saki desu", english: "Just up ahead." },
    ],
    reply: [],
    pattern: {
      frame: "〜は どこですか。",
      gloss: "Where is …?",
      swaps: [
        { japanese: "トイレは どこですか。", english: "Where is the toilet?" },
        { japanese: "コンビニは どこですか。", english: "Where is a convenience store?" },
        { japanese: "バスていは どこですか。", english: "Where is the bus stop?" },
      ],
    },
    tip: "You only need three words out of the answer: まっすぐ (straight), ひだり (left), みぎ (right). Everything else is decoration.",
  },
  {
    id: "conv-25",
    scene: "directions",
    canDo: "Find out whether it's walkable.",
    situation:
      "You have a direction. What you still don't know is whether it's two minutes away or two trains away.",
    say: {
      japanese: "ここから とおいですか。",
      kana: "ここからとおいですか",
      romaji: "koko kara tooi desu ka",
      english: "Is it far from here?",
    },
    hear: [
      { japanese: "あるいて じゅっぷんです。", kana: "あるいてじゅっぷんです", romaji: "aruite juppun desu", english: "Ten minutes on foot." },
      { japanese: "すぐ そこです。", kana: "すぐそこです", romaji: "sugu soko desu", english: "It's right there." },
      { japanese: "ちょっと とおいです。", kana: "ちょっととおいです", romaji: "chotto tooi desu", english: "It's a fair way." },
    ],
    reply: [],
    tip: "'すぐ そこ' means around the corner. 'ちょっと とおい' is a polite understatement — assume it means take the train.",
  },
  {
    id: "conv-26",
    scene: "directions",
    canDo: "Confirm a direction with a gesture and one word.",
    situation:
      "You set off, and now you are not sure you turned the right way. Point, and check.",
    say: {
      japanese: "こっちですか。",
      kana: "こっちですか",
      romaji: "kocchi desu ka",
      english: "This way?",
    },
    hear: [
      { japanese: "はい、そうです。", kana: "はい、そうです", romaji: "hai, sou desu", english: "Yes, that's right." },
      { japanese: "いいえ、あっちです。", kana: "いいえ、あっちです", romaji: "iie, acchi desu", english: "No — that way." },
    ],
    reply: [],
    tip: "Two syllables and a pointed finger will save you ten minutes. Confirming beats guessing every time.",
  },

  // --- Shops --------------------------------------------------------------
  {
    id: "conv-27",
    scene: "shopping",
    canDo: "Ask a price and understand the answer.",
    situation:
      "Nothing on the shelf is labelled in a way you can read, and you would rather know before you commit.",
    say: {
      japanese: "これは いくらですか。",
      kana: "これはいくらですか",
      romaji: "kore wa ikura desu ka",
      english: "How much is this?",
    },
    hear: [
      { japanese: "せんにひゃくえんです。", kana: "せんにひゃくえんです", romaji: "sen nihyaku en desu", english: "It's 1,200 yen." },
      { japanese: "ぜいこみで せんさんびゃくえんです。", kana: "ぜいこみでせんさんびゃくえんです", romaji: "zeikomi de sen sanbyaku en desu", english: "1,300 yen including tax." },
    ],
    reply: [],
    tip: "Prices are often shown twice — ぜいぬき (before tax) and ぜいこみ (with tax). The bigger number is the one you pay. Staff will happily key it into the register display for you.",
  },
  {
    id: "conv-28",
    scene: "shopping",
    canDo: "Ask whether they have something else.",
    situation:
      "The thing is right, the size or the colour isn't. This is the all-purpose 'do you have…?'.",
    say: {
      japanese: "もっと おおきいのは ありますか。",
      kana: "もっとおおきいのはありますか",
      romaji: "motto ookii no wa arimasu ka",
      english: "Do you have a bigger one?",
    },
    hear: [
      { japanese: "はい、あります。", kana: "はい、あります", romaji: "hai, arimasu", english: "Yes, we do." },
      { japanese: "もうしわけありません、ございません。", kana: "もうしわけありません、ございません", romaji: "moushiwake arimasen, gozaimasen", english: "I'm very sorry, we don't." },
    ],
    reply: [],
    pattern: {
      frame: "〜は ありますか。",
      gloss: "Do you have …?",
      swaps: [
        { japanese: "ちいさいのは ありますか。", english: "Do you have a smaller one?" },
        { japanese: "べつの いろは ありますか。", english: "Do you have another colour?" },
        { japanese: "えいごの メニューは ありますか。", english: "Do you have an English menu?" },
      ],
    },
    tip: "もうしわけありません is a very formal apology. Hearing it means no — kindly, and with regret.",
  },
  {
    id: "conv-29",
    scene: "shopping",
    canDo: "Buy tax free as a visitor.",
    situation:
      "You are spending real money and you are a tourist, which means you shouldn't be paying consumption tax on it.",
    say: {
      japanese: "めんぜいは できますか。",
      kana: "めんぜいはできますか",
      romaji: "menzei wa dekimasu ka",
      english: "Can I buy this tax free?",
    },
    hear: [
      { japanese: "パスポートを おねがいします。", kana: "パスポートをおねがいします", romaji: "pasupooto o onegaishimasu", english: "Your passport, please." },
      { japanese: "にかいの カウンターへ どうぞ。", kana: "にかいのカウンターへどうぞ", romaji: "nikai no kauntaa e douzo", english: "Please go to the counter on the second floor." },
    ],
    reply: [],
    tip: "Tax-free needs the actual passport at the register, on the day, above a minimum spend. A photo of it will not do.",
  },

  // --- Hotel --------------------------------------------------------------
  {
    id: "conv-30",
    scene: "hotel",
    canDo: "Check in.",
    situation:
      "You've arrived, you're carrying everything you own, and the front desk is looking at you expectantly.",
    say: {
      japanese: "チェックイン、おねがいします。よやくして います。",
      kana: "チェックイン、おねがいします。よやくしています",
      romaji: "chekkuin, onegaishimasu. yoyaku shite imasu",
      english: "Check-in, please. I have a reservation.",
    },
    hear: [
      { japanese: "おなまえを おねがいします。", kana: "おなまえをおねがいします", romaji: "onamae o onegaishimasu", english: "Your name, please." },
      { japanese: "パスポートを おねがいします。", kana: "パスポートをおねがいします", romaji: "pasupooto o onegaishimasu", english: "Your passport, please." },
    ],
    reply: [],
    tip: "Hotels are legally required to copy a foreign guest's passport at check-in. It's the law, not suspicion — have it out and ready.",
  },
  {
    id: "conv-31",
    scene: "hotel",
    canDo: "Ask what time anything happens.",
    situation:
      "Checkout, breakfast, the last train, when the bath closes — one frame answers all of them.",
    say: {
      japanese: "チェックアウトは なんじですか。",
      kana: "チェックアウトはなんじですか",
      romaji: "chekku auto wa nanji desu ka",
      english: "What time is checkout?",
    },
    hear: [
      { japanese: "じゅうじです。", kana: "じゅうじです", romaji: "juuji desu", english: "Ten o'clock." },
      { japanese: "じゅういちじまでです。", kana: "じゅういちじまでです", romaji: "juuichi ji made desu", english: "Until eleven." },
    ],
    reply: [],
    pattern: {
      frame: "〜は なんじですか。",
      gloss: "What time is …?",
      swaps: [
        { japanese: "あさごはんは なんじですか。", english: "What time is breakfast?" },
        { japanese: "おふろは なんじまでですか。", english: "Until what time is the bath open?" },
        { japanese: "でんしゃは なんじですか。", english: "What time is the train?" },
      ],
    },
    tip: "なんじ is 'what time'. Numbers come back fast, so watch for the fingers or the clock — staff almost always show as well as tell.",
  },
  {
    id: "conv-32",
    scene: "hotel",
    canDo: "Leave your bags before check-in or after check-out.",
    situation:
      "It's ten in the morning, your room isn't ready, and you would rather see the city without a suitcase.",
    say: {
      japanese: "にもつを あずかって もらえますか。",
      kana: "にもつをあずかってもらえますか",
      romaji: "nimotsu o azukatte moraemasu ka",
      english: "Could you look after my luggage?",
    },
    hear: [
      { japanese: "はい、おあずかりします。", kana: "はい、おあずかりします", romaji: "hai, oazukari shimasu", english: "Yes, we'll keep it for you." },
      { japanese: "なんじごろ おもどりですか。", kana: "なんじごろおもどりですか", romaji: "nanji goro omodori desu ka", english: "About what time will you be back?" },
    ],
    reply: [],
    tip: "Nearly every hotel does this for free, before and after your stay. Stations have coin lockers for the same job — look for コインロッカー.",
  },

  // --- When it goes wrong -------------------------------------------------
  {
    id: "conv-33",
    scene: "trouble",
    canDo: "Say that you are lost, and show where you're going.",
    situation:
      "You have no idea where you are. A station attendant or a konbini clerk is the fastest way out of it.",
    say: {
      japanese: "すみません、みちに まよいました。",
      kana: "すみません、みちにまよいました",
      romaji: "sumimasen, michi ni mayoimashita",
      english: "Excuse me — I'm lost.",
    },
    hear: [
      { japanese: "どこに いきますか。", kana: "どこにいきますか", romaji: "doko ni ikimasu ka", english: "Where are you going?" },
      { japanese: "ちずを みせて ください。", kana: "ちずをみせてください", romaji: "chizu o misete kudasai", english: "Show me the map." },
    ],
    reply: [
      { japanese: "ここに いきたいです。", kana: "ここにいきたいです", romaji: "koko ni ikitai desu", english: "I want to go here." },
    ],
    tip: "Have the destination already on your screen before you ask. Station staff and police boxes (こうばん) expect this question and are good at it.",
  },
  {
    id: "conv-34",
    scene: "trouble",
    canDo: "Say you feel unwell and ask for medicine.",
    situation:
      "Something is wrong and you are standing in a drugstore, or at a hotel desk, needing to explain it simply.",
    say: {
      japanese: "きぶんが わるいです。くすりは ありますか。",
      kana: "きぶんがわるいです。くすりはありますか",
      romaji: "kibun ga warui desu. kusuri wa arimasu ka",
      english: "I feel unwell. Do you have any medicine?",
    },
    hear: [
      { japanese: "どう しましたか。", kana: "どうしましたか", romaji: "dou shimashita ka", english: "What's wrong?" },
      { japanese: "びょういんに いきますか。", kana: "びょういんにいきますか", romaji: "byouin ni ikimasu ka", english: "Do you want to go to a hospital?" },
    ],
    reply: [
      { japanese: "あたまが いたいです。", kana: "あたまがいたいです", romaji: "atama ga itai desu", english: "I have a headache." },
      { japanese: "おなかが いたいです。", kana: "おなかがいたいです", romaji: "onaka ga itai desu", english: "I have a stomach ache." },
    ],
    pattern: {
      frame: "〜が いたいです。",
      gloss: "My … hurts.",
      swaps: [
        { japanese: "あたまが いたいです。", english: "My head hurts." },
        { japanese: "おなかが いたいです。", english: "My stomach hurts." },
        { japanese: "のどが いたいです。", english: "My throat hurts." },
      ],
    },
    tip: "ドラッグストア are everywhere and staff will point you to the basics. For anything serious ask the hotel front desk — they will phone ahead in Japanese for you.",
  },
  {
    id: "conv-35",
    scene: "trouble",
    canDo: "Ask for help in an emergency.",
    situation:
      "Something has actually gone wrong. This is the one card where hesitating is the bigger risk.",
    say: {
      japanese: "たすけて ください！",
      kana: "たすけてください",
      romaji: "tasukete kudasai!",
      english: "Please help me!",
    },
    hear: [
      { japanese: "だいじょうぶですか。", kana: "だいじょうぶですか", romaji: "daijoubu desu ka", english: "Are you all right?" },
      { japanese: "いま よびます。", kana: "いまよびます", romaji: "ima yobimasu", english: "I'll call someone now." },
    ],
    reply: [
      { japanese: "けいさつを よんで ください。", kana: "けいさつをよんでください", romaji: "keisatsu o yonde kudasai", english: "Please call the police." },
      { japanese: "きゅうきゅうしゃを よんで ください。", kana: "きゅうきゅうしゃをよんでください", romaji: "kyuukyuusha o yonde kudasai", english: "Please call an ambulance." },
    ],
    tip: "Police are 110, ambulance and fire are 119, and every neighbourhood police box (こうばん) is staffed. Say it loudly — volume is not rude in an emergency.",
  },
  {
    id: "conv-36",
    scene: "trouble",
    canDo: "Report something lost.",
    situation:
      "Your wallet, phone or bag is gone. Japan has an unusually high return rate for lost property, so this is worth saying properly.",
    say: {
      japanese: "さいふを なくしました。",
      kana: "さいふをなくしました",
      romaji: "saifu o nakushimashita",
      english: "I've lost my wallet.",
    },
    hear: [
      { japanese: "こうばんに いきましょう。", kana: "こうばんにいきましょう", romaji: "kouban ni ikimashou", english: "Let's go to the police box." },
      { japanese: "どこで なくしましたか。", kana: "どこでなくしましたか", romaji: "doko de nakushimashita ka", english: "Where did you lose it?" },
    ],
    reply: [],
    pattern: {
      frame: "〜を なくしました。",
      gloss: "I've lost my ….",
      swaps: [
        { japanese: "スマホを なくしました。", english: "I've lost my phone." },
        { japanese: "かばんを なくしました。", english: "I've lost my bag." },
        { japanese: "きっぷを なくしました。", english: "I've lost my ticket." },
      ],
    },
    tip: "Report it at the nearest こうばん or at a station office. Things genuinely do come back — handed in intact, days later.",
  },
];

const BY_ID = new Map(CONVERSATIONS.map((c) => [c.id, c]));

/** Lesson items store ids; this is how a card is resolved back to its content. */
export function getConversationById(id: string): ConversationExchange | undefined {
  return BY_ID.get(id);
}

export function isConversationId(id: string): boolean {
  return id.startsWith("conv-");
}

export function getRandomConversation(): ConversationExchange {
  return CONVERSATIONS[Math.floor(Math.random() * CONVERSATIONS.length)];
}

/* ---------------------------------------------------------------------------
   Quiz choices.

   A rehearsal card asks "what would you say?" and then shows the answer, which
   is exposure, not recall — the learner grades themselves and a shrug passes.
   Choices turn the same card into a question that can actually be got wrong:
   the situation (or the line that comes at you) on one side, four lines on the
   other, only one of which belongs in that moment.

   Distractors are drawn from the same scene first, because the point is to
   read the line rather than to spot the odd topic out — at a konbini counter,
   "cash, please" and "a bag, please" both look plausible until you read them.
   The pool is topped up from the rest of the deck when a scene is too small.
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

/**
 * The lines to offer for one exchange: the one the learner should say, plus
 * plausible wrong ones, shuffled. Fewer than `CHOICE_COUNT` come back only if
 * the deck itself is too small — the caller should treat one choice as "no
 * quiz for this card" rather than as a question with a single answer.
 */
export function buildResponseChoices(exchange: ConversationExchange): ConversationLine[] {
  const answer = exchange.say;
  const taken = new Set([answer.kana, answer.english]);

  const candidates = CONVERSATIONS.filter((c) => {
    if (c.id === exchange.id) return false;
    // だいじょうぶです is the right answer on three different cards. A distractor
    // that is the same line — or means the same thing — is not a wrong answer.
    if (taken.has(c.say.kana) || taken.has(c.say.english)) return false;
    return true;
  });

  const sameScene = shuffled(candidates.filter((c) => c.scene === exchange.scene));
  const elsewhere = shuffled(candidates.filter((c) => c.scene !== exchange.scene));

  const distractors: ConversationLine[] = [];
  for (const c of [...sameScene, ...elsewhere]) {
    if (distractors.length >= CHOICE_COUNT - 1) break;
    if (taken.has(c.say.kana) || taken.has(c.say.english)) continue;
    taken.add(c.say.kana);
    taken.add(c.say.english);
    distractors.push(c.say);
  }

  return shuffled([answer, ...distractors]);
}
