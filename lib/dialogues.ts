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
  {
    id: "train-platform",
    title: "Catching the train",
    blurb:
      "Topping up an IC card at the window, finding the right platform, and checking the train in front of you is actually the one you want.",
    canDo:
      "Add money to a travel card, ask which platform a service leaves from, and confirm a train before you get on it.",
    glyph: "駅",
    seconds: 60,
    them: { label: "Station staff", glyph: "駅" },
    turns: [
      {
        speaker: "you",
        stage: "The gate beeps red — the card is empty, and the machine's menu is only in Japanese.",
        japanese: "すみません。",
        kana: "すみません",
        romaji: "sumimasen",
        english: "Excuse me.",
      },
      {
        speaker: "them",
        japanese: "はい、どうぞ。",
        kana: "はいどうぞ",
        romaji: "hai, douzo",
        english: "Yes, go ahead.",
      },
      {
        speaker: "you",
        japanese: "チャージ、おねがいします。",
        kana: "チャージおねがいします",
        romaji: "chaaji, onegaishimasu",
        english: "A top-up, please.",
      },
      {
        speaker: "them",
        japanese: "いくら チャージ しますか。",
        kana: "いくらチャージしますか",
        romaji: "ikura chaaji shimasu ka",
        english: "How much would you like to add?",
      },
      {
        speaker: "you",
        japanese: "せんえん、おねがいします。",
        kana: "せんえんおねがいします",
        romaji: "sen en, onegaishimasu",
        english: "1,000 yen, please.",
      },
      {
        speaker: "them",
        japanese: "かしこまりました。",
        kana: "かしこまりました",
        romaji: "kashikomarimashita",
        english: "Certainly.",
      },
      {
        // The same person, before you walk off — which is why this one opens
        // without another すみません.
        speaker: "you",
        stage: "The card takes the money. The board above the gates lists twelve platforms.",
        japanese: "しんじゅくゆきは なんばんせんですか。",
        kana: "しんじゅくゆきはなんばんせんですか",
        romaji: "shinjuku yuki wa nanbansen desu ka",
        english: "Which platform is the Shinjuku train?",
      },
      {
        speaker: "them",
        japanese: "さんばんせんです。あちらです。",
        kana: "さんばんせんです。あちらです",
        romaji: "sanbansen desu. achira desu",
        english: "Platform 3. Over that way.",
      },
      {
        speaker: "you",
        japanese: "ありがとうございます。",
        kana: "ありがとうございます",
        romaji: "arigatou gozaimasu",
        english: "Thank you.",
      },
      {
        speaker: "you",
        stage: "A train is already sitting at platform 3 — and it is not the only one that stops there.",
        japanese: "これは しんじゅくに いきますか。",
        kana: "これはしんじゅくにいきますか",
        romaji: "kore wa shinjuku ni ikimasu ka",
        english: "Does this one go to Shinjuku?",
      },
      {
        speaker: "them",
        japanese: "いいえ、つぎのです。",
        kana: "いいえつぎのです",
        romaji: "iie, tsugi no desu",
        english: "No — the next one.",
      },
      {
        speaker: "you",
        japanese: "そうですか。ありがとうございます。",
        kana: "そうですか。ありがとうございます",
        romaji: "sou desu ka. arigatou gozaimasu",
        english: "Ah, I see. Thank you.",
      },
      {
        speaker: "them",
        stage: "Two minutes later, an announcement over the platform.",
        japanese: "まもなく でんしゃが まいります。",
        kana: "まもなくでんしゃがまいります",
        romaji: "mamonaku densha ga mairimasu",
        english: "The train will be arriving shortly.",
      },
      {
        speaker: "them",
        stage: "You get on the right one. Two stops later, the carriage speaker again:",
        japanese: "つぎは しんじゅく、しんじゅくです。",
        kana: "つぎはしんじゅく。しんじゅくです",
        romaji: "tsugi wa shinjuku, shinjuku desu",
        english: "Next stop, Shinjuku — Shinjuku.",
      },
    ],
  },
  {
    id: "hotel-checkin",
    title: "Checking in",
    blurb:
      "Arriving at a front desk with a reservation, sorting out breakfast and checkout, and leaving your bag behind on the last morning.",
    canDo:
      "Check into a hotel, ask the two times that decide your day, and have your luggage held after you check out.",
    glyph: "宿",
    seconds: 60,
    them: { label: "Front desk", glyph: "宿" },
    turns: [
      {
        speaker: "them",
        stage: "You reach the counter with your bag still on your shoulder.",
        japanese: "いらっしゃいませ。",
        kana: "いらっしゃいませ",
        romaji: "irasshaimase",
        english: "Welcome.",
      },
      {
        speaker: "you",
        japanese: "チェックイン、おねがいします。よやくして います。",
        kana: "チェックインおねがいします。よやくしています",
        romaji: "chekkuin, onegaishimasu. yoyaku shite imasu",
        english: "Checking in, please. I have a reservation.",
      },
      {
        speaker: "them",
        japanese: "パスポートを おねがいします。",
        kana: "パスポートをおねがいします",
        romaji: "pasupooto o onegaishimasu",
        english: "Your passport, please.",
      },
      {
        speaker: "you",
        japanese: "はい、どうぞ。",
        kana: "はいどうぞ",
        romaji: "hai, douzo",
        english: "Here you are.",
      },
      {
        speaker: "them",
        stage: "They photograph the passport and slide a key card back across the counter.",
        japanese: "おへやは ごかいです。",
        kana: "おへやはごかいです",
        romaji: "oheya wa gokai desu",
        english: "Your room is on the fifth floor.",
      },
      {
        speaker: "you",
        japanese: "あさごはんは なんじですか。",
        kana: "あさごはんはなんじですか",
        romaji: "asagohan wa nanji desu ka",
        english: "What time is breakfast?",
      },
      {
        speaker: "them",
        japanese: "しちじからです。",
        kana: "しちじからです",
        romaji: "shichiji kara desu",
        english: "From seven.",
      },
      {
        speaker: "you",
        japanese: "チェックアウトは なんじですか。",
        kana: "チェックアウトはなんじですか",
        romaji: "chekkuauto wa nanji desu ka",
        english: "And what time is checkout?",
      },
      {
        speaker: "them",
        japanese: "じゅうじです。",
        kana: "じゅうじです",
        romaji: "juuji desu",
        english: "Ten o'clock.",
      },
      {
        speaker: "you",
        stage: "The last morning: bags packed, room handed back, and a night train that does not leave for hours.",
        japanese: "にもつを あずかって もらえますか。",
        kana: "にもつをあずかってもらえますか",
        romaji: "nimotsu o azukatte moraemasu ka",
        english: "Could you look after my luggage?",
      },
      {
        speaker: "them",
        japanese: "はい、おあずかりします。なんじごろ おもどりですか。",
        kana: "はいおあずかりします。なんじごろおもどりですか",
        romaji: "hai, oazukari shimasu. nanji goro omodori desu ka",
        english: "Yes, we'll keep it for you. About what time will you be back?",
      },
      {
        speaker: "you",
        japanese: "ろくじごろです。",
        kana: "ろくじごろです",
        romaji: "rokuji goro desu",
        english: "Around six.",
      },
      {
        speaker: "them",
        stage: "A numbered tag goes on the bag, and its twin comes back to you.",
        japanese: "かしこまりました。",
        kana: "かしこまりました",
        romaji: "kashikomarimashita",
        english: "Certainly.",
      },
      {
        speaker: "you",
        japanese: "ありがとうございます。",
        kana: "ありがとうございます",
        romaji: "arigatou gozaimasu",
        english: "Thank you.",
      },
      {
        speaker: "them",
        japanese: "いってらっしゃいませ。",
        kana: "いってらっしゃいませ",
        romaji: "itterasshaimase",
        english: "Enjoy your day.",
      },
    ],
  },
  {
    id: "asking-directions",
    title: "Lost on the way",
    blurb:
      "Stopping a stranger in the street, showing them where you are trying to get to, and reading the answer back before you walk off.",
    canDo:
      "Admit you are lost, ask how far it is, and confirm which way is right rather than guessing.",
    glyph: "道",
    seconds: 50,
    them: { label: "Passer-by", glyph: "人" },
    turns: [
      {
        speaker: "you",
        stage: "The map app has you on the wrong side of a block with no street signs. Someone is walking your way.",
        japanese: "すみません、みちに まよいました。",
        kana: "すみませんみちにまよいました",
        romaji: "sumimasen, michi ni mayoimashita",
        english: "Excuse me — I'm lost.",
      },
      {
        speaker: "them",
        japanese: "どこに いきますか。",
        kana: "どこにいきますか",
        romaji: "doko ni ikimasu ka",
        english: "Where are you going?",
      },
      {
        speaker: "you",
        stage: "You hold the phone up so they can see the screen.",
        japanese: "ここに いきたいです。",
        kana: "ここにいきたいです",
        romaji: "koko ni ikitai desu",
        english: "I want to go here.",
      },
      {
        speaker: "them",
        japanese: "ああ、えきの ちかくですね。",
        kana: "ああえきのちかくですね",
        romaji: "aa, eki no chikaku desu ne",
        english: "Ah — near the station, isn't it.",
      },
      {
        speaker: "you",
        japanese: "ここから とおいですか。",
        kana: "ここからとおいですか",
        romaji: "koko kara tooi desu ka",
        english: "Is it far from here?",
      },
      {
        speaker: "them",
        japanese: "あるいて じゅっぷんです。",
        kana: "あるいてじゅっぷんです",
        romaji: "aruite juppun desu",
        english: "Ten minutes on foot.",
      },
      {
        speaker: "you",
        stage: "They point up the street, then turn their hand at the end of it.",
        japanese: "こっちですか。",
        kana: "こっちですか",
        romaji: "kocchi desu ka",
        english: "This way?",
      },
      {
        speaker: "them",
        japanese: "いいえ、あっちです。あの さきを みぎです。",
        kana: "いいえあっちです。あのさきをみぎです",
        romaji: "iie, acchi desu. ano saki o migi desu",
        english: "No — that way. Right, just up ahead.",
      },
      {
        // Reading the directions back is the whole trick: it turns a nod you
        // did not mean into a correction you can still act on.
        speaker: "you",
        japanese: "あの さきを みぎですね。",
        kana: "あのさきをみぎですね",
        romaji: "ano saki o migi desu ne",
        english: "Right at the end there — got it.",
      },
      {
        speaker: "them",
        japanese: "はい、そうです。",
        kana: "はいそうです",
        romaji: "hai, sou desu",
        english: "Yes, that's right.",
      },
      {
        speaker: "you",
        japanese: "ありがとうございます。",
        kana: "ありがとうございます",
        romaji: "arigatou gozaimasu",
        english: "Thank you.",
      },
      {
        speaker: "them",
        stage: "They wait on the corner until you have started off the right way.",
        japanese: "きを つけて。",
        kana: "きをつけて",
        romaji: "ki o tsukete",
        english: "Take care.",
      },
    ],
  },
  {
    id: "souvenir-shop",
    title: "One good souvenir",
    blurb:
      "Asking a price, asking for a bigger one, getting it wrapped, and claiming the tax back on the way out.",
    canDo:
      "Buy something you actually chose — price, size, wrapping and tax-free — instead of pointing and hoping.",
    glyph: "買",
    seconds: 65,
    them: { label: "Shop staff", glyph: "店" },
    turns: [
      {
        speaker: "them",
        stage: "You have been holding the same small ceramic cup for two minutes.",
        japanese: "いらっしゃいませ。",
        kana: "いらっしゃいませ",
        romaji: "irasshaimase",
        english: "Welcome.",
      },
      {
        speaker: "you",
        japanese: "これは いくらですか。",
        kana: "これはいくらですか",
        romaji: "kore wa ikura desu ka",
        english: "How much is this?",
      },
      {
        speaker: "them",
        japanese: "せんにひゃくえんです。",
        kana: "せんにひゃくえんです",
        romaji: "sen nihyaku en desu",
        english: "It's 1,200 yen.",
      },
      {
        speaker: "you",
        japanese: "もっと おおきいのは ありますか。",
        kana: "もっとおおきいのはありますか",
        romaji: "motto ookii no wa arimasu ka",
        english: "Do you have a bigger one?",
      },
      {
        speaker: "them",
        japanese: "はい、あります。こちらです。",
        kana: "はいあります。こちらです",
        romaji: "hai, arimasu. kochira desu",
        english: "Yes, we do. Here it is.",
      },
      {
        speaker: "you",
        stage: "The bigger one is better, and eight hundred yen more.",
        japanese: "じゃあ、これを ふたつ ください。",
        kana: "じゃあこれをふたつください",
        romaji: "jaa, kore o futatsu kudasai",
        english: "That one, then — two of them, please.",
      },
      {
        speaker: "them",
        japanese: "かしこまりました。プレゼントですか。",
        kana: "かしこまりました。プレゼントですか",
        romaji: "kashikomarimashita. purezento desu ka",
        english: "Certainly. Are they gifts?",
      },
      {
        speaker: "you",
        japanese: "はい。",
        kana: "はい",
        romaji: "hai",
        english: "Yes.",
      },
      {
        speaker: "them",
        stage: "Each cup goes into paper, then a second layer, then a box, unhurried.",
        japanese: "おつつみ しますね。",
        kana: "おつつみしますね",
        romaji: "otsutsumi shimasu ne",
        english: "I'll wrap them, then.",
      },
      {
        speaker: "you",
        japanese: "めんぜいは できますか。",
        kana: "めんぜいはできますか",
        romaji: "menzei wa dekimasu ka",
        english: "Can I buy this tax-free?",
      },
      {
        speaker: "them",
        japanese: "はい。パスポートを おねがいします。",
        kana: "はい。パスポートをおねがいします",
        romaji: "hai. pasupooto o onegaishimasu",
        english: "Yes. Your passport, please.",
      },
      {
        speaker: "you",
        japanese: "はい、どうぞ。",
        kana: "はいどうぞ",
        romaji: "hai, douzo",
        english: "Here you are.",
      },
      {
        speaker: "them",
        japanese: "ごうけい よんせんえんです。",
        kana: "ごうけいよんせんえんです",
        romaji: "goukei yonsen en desu",
        english: "That's 4,000 yen in total.",
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
        stage: "The receipt is stapled into your passport — it stays there until you leave the country.",
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
];

const BY_ID = new Map(DIALOGUES.map((d) => [d.id, d]));

export function getDialogueById(id: string): Dialogue | undefined {
  return BY_ID.get(id);
}
