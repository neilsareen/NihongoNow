import { PrismaClient, ContentType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");
  await seedHiragana();
  await seedKatakana();
  await seedVocabulary();
  await seedKanji();
  await seedPhrases();
  await seedAchievements();
  console.log("Seeding complete.");
}

async function seedHiragana() {
  const hiragana = [
    // Basic vowels
    { character: "あ", romaji: "a", displayOrder: 1 },
    { character: "い", romaji: "i", displayOrder: 2 },
    { character: "う", romaji: "u", displayOrder: 3 },
    { character: "え", romaji: "e", displayOrder: 4 },
    { character: "お", romaji: "o", displayOrder: 5 },
    // K row
    { character: "か", romaji: "ka", displayOrder: 6 },
    { character: "き", romaji: "ki", displayOrder: 7 },
    { character: "く", romaji: "ku", displayOrder: 8 },
    { character: "け", romaji: "ke", displayOrder: 9 },
    { character: "こ", romaji: "ko", displayOrder: 10 },
    // S row
    { character: "さ", romaji: "sa", displayOrder: 11 },
    { character: "し", romaji: "shi", displayOrder: 12 },
    { character: "す", romaji: "su", displayOrder: 13 },
    { character: "せ", romaji: "se", displayOrder: 14 },
    { character: "そ", romaji: "so", displayOrder: 15 },
    // T row
    { character: "た", romaji: "ta", displayOrder: 16 },
    { character: "ち", romaji: "chi", displayOrder: 17 },
    { character: "つ", romaji: "tsu", displayOrder: 18 },
    { character: "て", romaji: "te", displayOrder: 19 },
    { character: "と", romaji: "to", displayOrder: 20 },
    // N row
    { character: "な", romaji: "na", displayOrder: 21 },
    { character: "に", romaji: "ni", displayOrder: 22 },
    { character: "ぬ", romaji: "nu", displayOrder: 23 },
    { character: "ね", romaji: "ne", displayOrder: 24 },
    { character: "の", romaji: "no", displayOrder: 25 },
    // H row
    { character: "は", romaji: "ha", displayOrder: 26 },
    { character: "ひ", romaji: "hi", displayOrder: 27 },
    { character: "ふ", romaji: "fu", displayOrder: 28 },
    { character: "へ", romaji: "he", displayOrder: 29 },
    { character: "ほ", romaji: "ho", displayOrder: 30 },
    // M row
    { character: "ま", romaji: "ma", displayOrder: 31 },
    { character: "み", romaji: "mi", displayOrder: 32 },
    { character: "む", romaji: "mu", displayOrder: 33 },
    { character: "め", romaji: "me", displayOrder: 34 },
    { character: "も", romaji: "mo", displayOrder: 35 },
    // Y row
    { character: "や", romaji: "ya", displayOrder: 36 },
    { character: "ゆ", romaji: "yu", displayOrder: 37 },
    { character: "よ", romaji: "yo", displayOrder: 38 },
    // R row
    { character: "ら", romaji: "ra", displayOrder: 39 },
    { character: "り", romaji: "ri", displayOrder: 40 },
    { character: "る", romaji: "ru", displayOrder: 41 },
    { character: "れ", romaji: "re", displayOrder: 42 },
    { character: "ろ", romaji: "ro", displayOrder: 43 },
    // W row + N
    { character: "わ", romaji: "wa", displayOrder: 44 },
    { character: "を", romaji: "wo", displayOrder: 45 },
    { character: "ん", romaji: "n", displayOrder: 46 },
    // Dakuten G
    { character: "が", romaji: "ga", displayOrder: 47 },
    { character: "ぎ", romaji: "gi", displayOrder: 48 },
    { character: "ぐ", romaji: "gu", displayOrder: 49 },
    { character: "げ", romaji: "ge", displayOrder: 50 },
    { character: "ご", romaji: "go", displayOrder: 51 },
    // Z row
    { character: "ざ", romaji: "za", displayOrder: 52 },
    { character: "じ", romaji: "ji", displayOrder: 53 },
    { character: "ず", romaji: "zu", displayOrder: 54 },
    { character: "ぜ", romaji: "ze", displayOrder: 55 },
    { character: "ぞ", romaji: "zo", displayOrder: 56 },
    // D row
    { character: "だ", romaji: "da", displayOrder: 57 },
    { character: "ぢ", romaji: "ji2", displayOrder: 58 },
    { character: "づ", romaji: "zu2", displayOrder: 59 },
    { character: "で", romaji: "de", displayOrder: 60 },
    { character: "ど", romaji: "do", displayOrder: 61 },
    // B row
    { character: "ば", romaji: "ba", displayOrder: 62 },
    { character: "び", romaji: "bi", displayOrder: 63 },
    { character: "ぶ", romaji: "bu", displayOrder: 64 },
    { character: "べ", romaji: "be", displayOrder: 65 },
    { character: "ぼ", romaji: "bo", displayOrder: 66 },
    // P row
    { character: "ぱ", romaji: "pa", displayOrder: 67 },
    { character: "ぴ", romaji: "pi", displayOrder: 68 },
    { character: "ぷ", romaji: "pu", displayOrder: 69 },
    { character: "ぺ", romaji: "pe", displayOrder: 70 },
    { character: "ぽ", romaji: "po", displayOrder: 71 },
  ];

  for (const h of hiragana) {
    await prisma.japaneseCharacter.upsert({
      where: { character: h.character },
      create: { ...h, type: ContentType.HIRAGANA },
      update: {},
    });
  }
  console.log(`  Seeded ${hiragana.length} hiragana`);
}

async function seedKatakana() {
  const katakana = [
    { character: "ア", romaji: "a", displayOrder: 1 },
    { character: "イ", romaji: "i", displayOrder: 2 },
    { character: "ウ", romaji: "u", displayOrder: 3 },
    { character: "エ", romaji: "e", displayOrder: 4 },
    { character: "オ", romaji: "o", displayOrder: 5 },
    { character: "カ", romaji: "ka", displayOrder: 6 },
    { character: "キ", romaji: "ki", displayOrder: 7 },
    { character: "ク", romaji: "ku", displayOrder: 8 },
    { character: "ケ", romaji: "ke", displayOrder: 9 },
    { character: "コ", romaji: "ko", displayOrder: 10 },
    { character: "サ", romaji: "sa", displayOrder: 11 },
    { character: "シ", romaji: "shi", displayOrder: 12 },
    { character: "ス", romaji: "su", displayOrder: 13 },
    { character: "セ", romaji: "se", displayOrder: 14 },
    { character: "ソ", romaji: "so", displayOrder: 15 },
    { character: "タ", romaji: "ta", displayOrder: 16 },
    { character: "チ", romaji: "chi", displayOrder: 17 },
    { character: "ツ", romaji: "tsu", displayOrder: 18 },
    { character: "テ", romaji: "te", displayOrder: 19 },
    { character: "ト", romaji: "to", displayOrder: 20 },
    { character: "ナ", romaji: "na", displayOrder: 21 },
    { character: "ニ", romaji: "ni", displayOrder: 22 },
    { character: "ヌ", romaji: "nu", displayOrder: 23 },
    { character: "ネ", romaji: "ne", displayOrder: 24 },
    { character: "ノ", romaji: "no", displayOrder: 25 },
    { character: "ハ", romaji: "ha", displayOrder: 26 },
    { character: "ヒ", romaji: "hi", displayOrder: 27 },
    { character: "フ", romaji: "fu", displayOrder: 28 },
    { character: "ヘ", romaji: "he", displayOrder: 29 },
    { character: "ホ", romaji: "ho", displayOrder: 30 },
    { character: "マ", romaji: "ma", displayOrder: 31 },
    { character: "ミ", romaji: "mi", displayOrder: 32 },
    { character: "ム", romaji: "mu", displayOrder: 33 },
    { character: "メ", romaji: "me", displayOrder: 34 },
    { character: "モ", romaji: "mo", displayOrder: 35 },
    { character: "ヤ", romaji: "ya", displayOrder: 36 },
    { character: "ユ", romaji: "yu", displayOrder: 37 },
    { character: "ヨ", romaji: "yo", displayOrder: 38 },
    { character: "ラ", romaji: "ra", displayOrder: 39 },
    { character: "リ", romaji: "ri", displayOrder: 40 },
    { character: "ル", romaji: "ru", displayOrder: 41 },
    { character: "レ", romaji: "re", displayOrder: 42 },
    { character: "ロ", romaji: "ro", displayOrder: 43 },
    { character: "ワ", romaji: "wa", displayOrder: 44 },
    { character: "ヲ", romaji: "wo", displayOrder: 45 },
    { character: "ン", romaji: "n", displayOrder: 46 },
    { character: "ガ", romaji: "ga", displayOrder: 47 },
    { character: "ギ", romaji: "gi", displayOrder: 48 },
    { character: "グ", romaji: "gu", displayOrder: 49 },
    { character: "ゲ", romaji: "ge", displayOrder: 50 },
    { character: "ゴ", romaji: "go", displayOrder: 51 },
    { character: "ザ", romaji: "za", displayOrder: 52 },
    { character: "ジ", romaji: "ji", displayOrder: 53 },
    { character: "ズ", romaji: "zu", displayOrder: 54 },
    { character: "ゼ", romaji: "ze", displayOrder: 55 },
    { character: "ゾ", romaji: "zo", displayOrder: 56 },
    { character: "ダ", romaji: "da", displayOrder: 57 },
    { character: "デ", romaji: "de", displayOrder: 58 },
    { character: "ド", romaji: "do", displayOrder: 59 },
    { character: "バ", romaji: "ba", displayOrder: 60 },
    { character: "ビ", romaji: "bi", displayOrder: 61 },
    { character: "ブ", romaji: "bu", displayOrder: 62 },
    { character: "ベ", romaji: "be", displayOrder: 63 },
    { character: "ボ", romaji: "bo", displayOrder: 64 },
    { character: "パ", romaji: "pa", displayOrder: 65 },
    { character: "ピ", romaji: "pi", displayOrder: 66 },
    { character: "プ", romaji: "pu", displayOrder: 67 },
    { character: "ペ", romaji: "pe", displayOrder: 68 },
    { character: "ポ", romaji: "po", displayOrder: 69 },
  ];

  for (const k of katakana) {
    await prisma.japaneseCharacter.upsert({
      where: { character: k.character },
      create: { ...k, type: ContentType.KATAKANA },
      update: {},
    });
  }
  console.log(`  Seeded ${katakana.length} katakana`);
}

async function seedVocabulary() {
  const vocab = [
    // Food & Drink
    { japanese: "ご飯", kana: "ごはん", romaji: "gohan", english: "rice / meal", category: "food", jlptLevel: "N5", frequency: 100 },
    { japanese: "水", kana: "みず", romaji: "mizu", english: "water", category: "food", jlptLevel: "N5", frequency: 99 },
    { japanese: "お茶", kana: "おちゃ", romaji: "ocha", english: "tea", category: "food", jlptLevel: "N5", frequency: 98 },
    { japanese: "肉", kana: "にく", romaji: "niku", english: "meat", category: "food", jlptLevel: "N5", frequency: 95 },
    { japanese: "魚", kana: "さかな", romaji: "sakana", english: "fish", category: "food", jlptLevel: "N5", frequency: 94 },
    { japanese: "野菜", kana: "やさい", romaji: "yasai", english: "vegetables", category: "food", jlptLevel: "N5", frequency: 93 },
    { japanese: "パン", kana: "パン", romaji: "pan", english: "bread", category: "food", jlptLevel: "N5", frequency: 92 },
    { japanese: "卵", kana: "たまご", romaji: "tamago", english: "egg", category: "food", jlptLevel: "N5", frequency: 91 },
    { japanese: "牛乳", kana: "ぎゅうにゅう", romaji: "gyuunyuu", english: "milk", category: "food", jlptLevel: "N5", frequency: 90 },
    { japanese: "コーヒー", kana: "コーヒー", romaji: "koohii", english: "coffee", category: "food", jlptLevel: "N5", frequency: 89 },
    { japanese: "ビール", kana: "ビール", romaji: "biiru", english: "beer", category: "food", jlptLevel: "N5", frequency: 85 },
    { japanese: "ラーメン", kana: "ラーメン", romaji: "raamen", english: "ramen", category: "food", jlptLevel: "N5", frequency: 88 },
    { japanese: "寿司", kana: "すし", romaji: "sushi", english: "sushi", category: "food", jlptLevel: "N4", frequency: 87 },
    { japanese: "天ぷら", kana: "てんぷら", romaji: "tenpura", english: "tempura", category: "food", jlptLevel: "N4", frequency: 80 },
    { japanese: "弁当", kana: "べんとう", romaji: "bentou", english: "bento / boxed lunch", category: "food", jlptLevel: "N4", frequency: 86 },
    // Transportation
    { japanese: "電車", kana: "でんしゃ", romaji: "densha", english: "train", category: "transportation", jlptLevel: "N5", frequency: 100 },
    { japanese: "バス", kana: "バス", romaji: "basu", english: "bus", category: "transportation", jlptLevel: "N5", frequency: 99 },
    { japanese: "タクシー", kana: "タクシー", romaji: "takushii", english: "taxi", category: "transportation", jlptLevel: "N5", frequency: 98 },
    { japanese: "駅", kana: "えき", romaji: "eki", english: "station", category: "transportation", jlptLevel: "N5", frequency: 97 },
    { japanese: "空港", kana: "くうこう", romaji: "kuukou", english: "airport", category: "transportation", jlptLevel: "N4", frequency: 96 },
    { japanese: "切符", kana: "きっぷ", romaji: "kippu", english: "ticket", category: "transportation", jlptLevel: "N5", frequency: 95 },
    { japanese: "地下鉄", kana: "ちかてつ", romaji: "chikatetsu", english: "subway", category: "transportation", jlptLevel: "N4", frequency: 94 },
    { japanese: "自転車", kana: "じてんしゃ", romaji: "jitensha", english: "bicycle", category: "transportation", jlptLevel: "N4", frequency: 93 },
    { japanese: "新幹線", kana: "しんかんせん", romaji: "shinkansen", english: "bullet train", category: "transportation", jlptLevel: "N4", frequency: 88 },
    { japanese: "出口", kana: "でぐち", romaji: "deguchi", english: "exit", category: "transportation", jlptLevel: "N5", frequency: 96 },
    { japanese: "入口", kana: "いりぐち", romaji: "iriguchi", english: "entrance", category: "transportation", jlptLevel: "N5", frequency: 95 },
    // Time
    { japanese: "今日", kana: "きょう", romaji: "kyou", english: "today", category: "time", jlptLevel: "N5", frequency: 100 },
    { japanese: "明日", kana: "あした", romaji: "ashita", english: "tomorrow", category: "time", jlptLevel: "N5", frequency: 99 },
    { japanese: "昨日", kana: "きのう", romaji: "kinou", english: "yesterday", category: "time", jlptLevel: "N5", frequency: 98 },
    { japanese: "時間", kana: "じかん", romaji: "jikan", english: "time / hour", category: "time", jlptLevel: "N5", frequency: 97 },
    { japanese: "朝", kana: "あさ", romaji: "asa", english: "morning", category: "time", jlptLevel: "N5", frequency: 96 },
    { japanese: "夜", kana: "よる", romaji: "yoru", english: "night / evening", category: "time", jlptLevel: "N5", frequency: 95 },
    { japanese: "週", kana: "しゅう", romaji: "shuu", english: "week", category: "time", jlptLevel: "N5", frequency: 93 },
    { japanese: "月", kana: "つき", romaji: "tsuki", english: "month / moon", category: "time", jlptLevel: "N5", frequency: 94 },
    { japanese: "年", kana: "ねん", romaji: "nen", english: "year", category: "time", jlptLevel: "N5", frequency: 92 },
    // General / Daily Life
    { japanese: "名前", kana: "なまえ", romaji: "namae", english: "name", category: "general", jlptLevel: "N5", frequency: 100 },
    { japanese: "日本語", kana: "にほんご", romaji: "nihongo", english: "Japanese language", category: "general", jlptLevel: "N5", frequency: 99 },
    { japanese: "英語", kana: "えいご", romaji: "eigo", english: "English language", category: "general", jlptLevel: "N5", frequency: 98 },
    { japanese: "人", kana: "ひと", romaji: "hito", english: "person", category: "general", jlptLevel: "N5", frequency: 100 },
    { japanese: "友達", kana: "ともだち", romaji: "tomodachi", english: "friend", category: "relationships", jlptLevel: "N5", frequency: 95 },
    { japanese: "家族", kana: "かぞく", romaji: "kazoku", english: "family", category: "relationships", jlptLevel: "N5", frequency: 94 },
    { japanese: "会社", kana: "かいしゃ", romaji: "kaisha", english: "company", category: "work", jlptLevel: "N5", frequency: 95 },
    { japanese: "仕事", kana: "しごと", romaji: "shigoto", english: "work / job", category: "work", jlptLevel: "N5", frequency: 96 },
    { japanese: "学校", kana: "がっこう", romaji: "gakkou", english: "school", category: "general", jlptLevel: "N5", frequency: 97 },
    // Shopping
    { japanese: "お金", kana: "おかね", romaji: "okane", english: "money", category: "shopping", jlptLevel: "N5", frequency: 95 },
    { japanese: "値段", kana: "ねだん", romaji: "nedan", english: "price", category: "shopping", jlptLevel: "N4", frequency: 94 },
    { japanese: "店", kana: "みせ", romaji: "mise", english: "shop / store", category: "shopping", jlptLevel: "N5", frequency: 93 },
    { japanese: "スーパー", kana: "スーパー", romaji: "suupaa", english: "supermarket", category: "shopping", jlptLevel: "N5", frequency: 90 },
    { japanese: "コンビニ", kana: "コンビニ", romaji: "konbini", english: "convenience store", category: "shopping", jlptLevel: "N4", frequency: 92 },
    { japanese: "レシート", kana: "レシート", romaji: "reshiito", english: "receipt", category: "shopping", jlptLevel: "N4", frequency: 85 },
    { japanese: "円", kana: "えん", romaji: "en", english: "yen (currency)", category: "shopping", jlptLevel: "N5", frequency: 98 },
    // Housing
    { japanese: "家", kana: "いえ", romaji: "ie", english: "house / home", category: "housing", jlptLevel: "N5", frequency: 100 },
    { japanese: "部屋", kana: "へや", romaji: "heya", english: "room", category: "housing", jlptLevel: "N5", frequency: 99 },
    { japanese: "トイレ", kana: "トイレ", romaji: "toire", english: "toilet / bathroom", category: "housing", jlptLevel: "N5", frequency: 98 },
    { japanese: "お風呂", kana: "おふろ", romaji: "ofuro", english: "bath", category: "housing", jlptLevel: "N5", frequency: 95 },
    { japanese: "鍵", kana: "かぎ", romaji: "kagi", english: "key / lock", category: "housing", jlptLevel: "N4", frequency: 90 },
    { japanese: "ゴミ", kana: "ゴミ", romaji: "gomi", english: "trash / garbage", category: "housing", jlptLevel: "N4", frequency: 88 },
    // Healthcare
    { japanese: "病院", kana: "びょういん", romaji: "byouin", english: "hospital", category: "healthcare", jlptLevel: "N5", frequency: 95 },
    { japanese: "薬", kana: "くすり", romaji: "kusuri", english: "medicine", category: "healthcare", jlptLevel: "N4", frequency: 94 },
    { japanese: "医者", kana: "いしゃ", romaji: "isha", english: "doctor", category: "healthcare", jlptLevel: "N4", frequency: 93 },
    { japanese: "痛い", kana: "いたい", romaji: "itai", english: "painful / it hurts", category: "healthcare", jlptLevel: "N5", frequency: 92 },
    { japanese: "熱", kana: "ねつ", romaji: "netsu", english: "fever", category: "healthcare", jlptLevel: "N4", frequency: 88 },
    { japanese: "アレルギー", kana: "アレルギー", romaji: "arerugii", english: "allergy", category: "healthcare", jlptLevel: "N3", frequency: 85 },
    // Technology
    { japanese: "携帯", kana: "けいたい", romaji: "keitai", english: "mobile phone", category: "technology", jlptLevel: "N4", frequency: 95 },
    { japanese: "インターネット", kana: "インターネット", romaji: "intaanetto", english: "internet", category: "technology", jlptLevel: "N4", frequency: 94 },
    { japanese: "パソコン", kana: "パソコン", romaji: "pasokon", english: "computer", category: "technology", jlptLevel: "N4", frequency: 93 },
    { japanese: "充電", kana: "じゅうでん", romaji: "juuden", english: "charging (battery)", category: "technology", jlptLevel: "N3", frequency: 88 },
    // Banking
    { japanese: "銀行", kana: "ぎんこう", romaji: "ginkou", english: "bank", category: "banking", jlptLevel: "N4", frequency: 92 },
    { japanese: "ATM", kana: "エーティーエム", romaji: "ee tii emu", english: "ATM", category: "banking", jlptLevel: "N4", frequency: 91 },
    { japanese: "カード", kana: "カード", romaji: "kaado", english: "card", category: "banking", jlptLevel: "N4", frequency: 90 },
    // Emergencies
    { japanese: "助けて", kana: "たすけて", romaji: "tasukete", english: "Help!", category: "emergencies", jlptLevel: "N4", frequency: 100 },
    { japanese: "警察", kana: "けいさつ", romaji: "keisatsu", english: "police", category: "emergencies", jlptLevel: "N4", frequency: 98 },
    { japanese: "救急車", kana: "きゅうきゅうしゃ", romaji: "kyuukyuusha", english: "ambulance", category: "emergencies", jlptLevel: "N3", frequency: 97 },
    { japanese: "火事", kana: "かじ", romaji: "kaji", english: "fire", category: "emergencies", jlptLevel: "N4", frequency: 95 },
    { japanese: "地震", kana: "じしん", romaji: "jishin", english: "earthquake", category: "emergencies", jlptLevel: "N4", frequency: 94 },
  ];

  for (const v of vocab) {
    await prisma.vocabulary.upsert({
      where: { id: `vocab-${v.japanese}` },
      create: { ...v, id: `vocab-${v.japanese}`, tags: [] },
      update: {},
    });
  }
  console.log(`  Seeded ${vocab.length} vocabulary items`);
}

async function seedKanji() {
  const kanji = [
    { character: "日", onyomi: ["ニチ", "ジツ"], kunyomi: ["ひ", "-び", "-か"], meanings: ["sun", "day"], strokeCount: 4, jlptLevel: "N5", frequency: 100, radicals: ["日"] },
    { character: "月", onyomi: ["ゲツ", "ガツ"], kunyomi: ["つき"], meanings: ["moon", "month"], strokeCount: 4, jlptLevel: "N5", frequency: 99, radicals: ["月"] },
    { character: "火", onyomi: ["カ"], kunyomi: ["ひ", "ほ-"], meanings: ["fire"], strokeCount: 4, jlptLevel: "N5", frequency: 95, radicals: ["火"] },
    { character: "水", onyomi: ["スイ"], kunyomi: ["みず"], meanings: ["water"], strokeCount: 4, jlptLevel: "N5", frequency: 98, radicals: ["水"] },
    { character: "木", onyomi: ["モク", "ボク"], kunyomi: ["き", "こ-"], meanings: ["tree", "wood"], strokeCount: 4, jlptLevel: "N5", frequency: 97, radicals: ["木"] },
    { character: "金", onyomi: ["キン", "コン"], kunyomi: ["かね", "かな-"], meanings: ["gold", "money", "metal"], strokeCount: 8, jlptLevel: "N5", frequency: 96, radicals: ["金"] },
    { character: "土", onyomi: ["ド", "ト"], kunyomi: ["つち"], meanings: ["earth", "soil"], strokeCount: 3, jlptLevel: "N5", frequency: 93, radicals: ["土"] },
    { character: "山", onyomi: ["サン"], kunyomi: ["やま"], meanings: ["mountain"], strokeCount: 3, jlptLevel: "N5", frequency: 92, radicals: ["山"] },
    { character: "川", onyomi: ["セン"], kunyomi: ["かわ"], meanings: ["river"], strokeCount: 3, jlptLevel: "N5", frequency: 91, radicals: ["川"] },
    { character: "人", onyomi: ["ジン", "ニン"], kunyomi: ["ひと"], meanings: ["person", "people"], strokeCount: 2, jlptLevel: "N5", frequency: 100, radicals: ["人"] },
    { character: "口", onyomi: ["コウ", "ク"], kunyomi: ["くち"], meanings: ["mouth", "opening"], strokeCount: 3, jlptLevel: "N5", frequency: 97, radicals: ["口"] },
    { character: "手", onyomi: ["シュ", "ズ"], kunyomi: ["て"], meanings: ["hand"], strokeCount: 4, jlptLevel: "N5", frequency: 96, radicals: ["手"] },
    { character: "目", onyomi: ["モク", "ボク"], kunyomi: ["め"], meanings: ["eye"], strokeCount: 5, jlptLevel: "N5", frequency: 95, radicals: ["目"] },
    { character: "耳", onyomi: ["ジ"], kunyomi: ["みみ"], meanings: ["ear"], strokeCount: 6, jlptLevel: "N5", frequency: 90, radicals: ["耳"] },
    { character: "足", onyomi: ["ソク"], kunyomi: ["あし"], meanings: ["foot", "leg"], strokeCount: 7, jlptLevel: "N5", frequency: 94, radicals: ["足"] },
    { character: "一", onyomi: ["イチ", "イツ"], kunyomi: ["ひと-"], meanings: ["one"], strokeCount: 1, jlptLevel: "N5", frequency: 100, radicals: ["一"] },
    { character: "二", onyomi: ["ニ", "ジ"], kunyomi: ["ふた-"], meanings: ["two"], strokeCount: 2, jlptLevel: "N5", frequency: 99, radicals: ["二"] },
    { character: "三", onyomi: ["サン"], kunyomi: ["みっ-"], meanings: ["three"], strokeCount: 3, jlptLevel: "N5", frequency: 98, radicals: ["三"] },
    { character: "四", onyomi: ["シ"], kunyomi: ["よ-", "よん"], meanings: ["four"], strokeCount: 5, jlptLevel: "N5", frequency: 97, radicals: ["囗"] },
    { character: "五", onyomi: ["ゴ"], kunyomi: ["いつ-"], meanings: ["five"], strokeCount: 4, jlptLevel: "N5", frequency: 96, radicals: ["二"] },
    { character: "六", onyomi: ["ロク"], kunyomi: ["むっ-", "むい"], meanings: ["six"], strokeCount: 4, jlptLevel: "N5", frequency: 95, radicals: ["八"] },
    { character: "七", onyomi: ["シチ"], kunyomi: ["なな", "なな-"], meanings: ["seven"], strokeCount: 2, jlptLevel: "N5", frequency: 94, radicals: ["一"] },
    { character: "八", onyomi: ["ハチ"], kunyomi: ["やっ-", "やつ"], meanings: ["eight"], strokeCount: 2, jlptLevel: "N5", frequency: 93, radicals: ["八"] },
    { character: "九", onyomi: ["ク", "キュウ"], kunyomi: ["ここの-"], meanings: ["nine"], strokeCount: 2, jlptLevel: "N5", frequency: 92, radicals: ["乙"] },
    { character: "十", onyomi: ["ジュウ", "ジッ"], kunyomi: ["とお", "と"], meanings: ["ten"], strokeCount: 2, jlptLevel: "N5", frequency: 99, radicals: ["十"] },
    { character: "百", onyomi: ["ヒャク"], kunyomi: ["もも"], meanings: ["hundred"], strokeCount: 6, jlptLevel: "N5", frequency: 97, radicals: ["百"] },
    { character: "千", onyomi: ["セン"], kunyomi: ["ち"], meanings: ["thousand"], strokeCount: 3, jlptLevel: "N5", frequency: 96, radicals: ["十"] },
    { character: "万", onyomi: ["マン", "バン"], kunyomi: ["よろず"], meanings: ["ten-thousand"], strokeCount: 3, jlptLevel: "N5", frequency: 95, radicals: ["一"] },
    { character: "上", onyomi: ["ジョウ", "ショウ"], kunyomi: ["うえ", "かみ", "あ-げる"], meanings: ["above", "up", "raise"], strokeCount: 3, jlptLevel: "N5", frequency: 98, radicals: ["一"] },
    { character: "下", onyomi: ["カ", "ゲ"], kunyomi: ["した", "しも", "さ-げる"], meanings: ["below", "down", "lower"], strokeCount: 3, jlptLevel: "N5", frequency: 97, radicals: ["一"] },
    { character: "中", onyomi: ["チュウ"], kunyomi: ["なか"], meanings: ["middle", "inside", "center"], strokeCount: 4, jlptLevel: "N5", frequency: 99, radicals: ["口"] },
    { character: "大", onyomi: ["ダイ", "タイ"], kunyomi: ["おお-", "おおきい"], meanings: ["big", "large", "great"], strokeCount: 3, jlptLevel: "N5", frequency: 99, radicals: ["大"] },
    { character: "小", onyomi: ["ショウ"], kunyomi: ["ちい-さい", "こ-"], meanings: ["small", "little"], strokeCount: 3, jlptLevel: "N5", frequency: 98, radicals: ["小"] },
    { character: "年", onyomi: ["ネン"], kunyomi: ["とし"], meanings: ["year"], strokeCount: 6, jlptLevel: "N5", frequency: 99, radicals: ["干"] },
    { character: "国", onyomi: ["コク"], kunyomi: ["くに"], meanings: ["country", "nation"], strokeCount: 8, jlptLevel: "N5", frequency: 98, radicals: ["囗"] },
    { character: "語", onyomi: ["ゴ"], kunyomi: ["かた-る"], meanings: ["language", "word", "talk"], strokeCount: 14, jlptLevel: "N5", frequency: 97, radicals: ["言"] },
    { character: "本", onyomi: ["ホン"], kunyomi: ["もと"], meanings: ["book", "origin", "root"], strokeCount: 5, jlptLevel: "N5", frequency: 99, radicals: ["木"] },
    { character: "学", onyomi: ["ガク"], kunyomi: ["まな-ぶ"], meanings: ["study", "learn"], strokeCount: 8, jlptLevel: "N5", frequency: 98, radicals: ["子"] },
    { character: "校", onyomi: ["コウ"], kunyomi: [], meanings: ["school"], strokeCount: 10, jlptLevel: "N5", frequency: 96, radicals: ["木"] },
    { character: "先", onyomi: ["セン"], kunyomi: ["さき"], meanings: ["ahead", "previous", "tip"], strokeCount: 6, jlptLevel: "N5", frequency: 97, radicals: ["儿"] },
    { character: "生", onyomi: ["セイ", "ショウ"], kunyomi: ["い-きる", "うま-れる", "なま"], meanings: ["life", "birth", "raw"], strokeCount: 5, jlptLevel: "N5", frequency: 100, radicals: ["生"] },
    { character: "東", onyomi: ["トウ"], kunyomi: ["ひがし"], meanings: ["east"], strokeCount: 8, jlptLevel: "N5", frequency: 97, radicals: ["木"] },
    { character: "西", onyomi: ["セイ", "サイ"], kunyomi: ["にし"], meanings: ["west"], strokeCount: 6, jlptLevel: "N5", frequency: 95, radicals: ["西"] },
    { character: "南", onyomi: ["ナン", "ナ"], kunyomi: ["みなみ"], meanings: ["south"], strokeCount: 9, jlptLevel: "N5", frequency: 94, radicals: ["十"] },
    { character: "北", onyomi: ["ホク"], kunyomi: ["きた"], meanings: ["north"], strokeCount: 5, jlptLevel: "N5", frequency: 93, radicals: ["匕"] },
    { character: "駅", onyomi: ["エキ"], kunyomi: [], meanings: ["station"], strokeCount: 14, jlptLevel: "N5", frequency: 96, radicals: ["馬"] },
    { character: "電", onyomi: ["デン"], kunyomi: [], meanings: ["electricity", "electric"], strokeCount: 13, jlptLevel: "N5", frequency: 97, radicals: ["雨"] },
    { character: "車", onyomi: ["シャ"], kunyomi: ["くるま"], meanings: ["car", "vehicle"], strokeCount: 7, jlptLevel: "N5", frequency: 98, radicals: ["車"] },
    { character: "店", onyomi: ["テン"], kunyomi: ["みせ"], meanings: ["store", "shop"], strokeCount: 8, jlptLevel: "N5", frequency: 96, radicals: ["广"] },
    { character: "食", onyomi: ["ショク", "ジキ"], kunyomi: ["た-べる", "く-う"], meanings: ["eat", "food"], strokeCount: 9, jlptLevel: "N5", frequency: 99, radicals: ["食"] },
  ];

  for (const k of kanji) {
    await prisma.kanji.upsert({
      where: { character: k.character },
      create: k,
      update: {},
    });
  }
  console.log(`  Seeded ${kanji.length} kanji`);
}

async function seedPhrases() {
  const phrases = [
    { japanese: "ありがとうございます", kana: "ありがとうございます", romaji: "arigatou gozaimasu", english: "Thank you very much", scenario: "general", difficulty: 1, tags: ["polite", "essential"] },
    { japanese: "どういたしまして", kana: "どういたしまして", romaji: "dou itashimashite", english: "You're welcome", scenario: "general", difficulty: 1, tags: ["polite"] },
    { japanese: "すみません", kana: "すみません", romaji: "sumimasen", english: "Excuse me / I'm sorry", scenario: "general", difficulty: 1, tags: ["essential"] },
    { japanese: "ごめんなさい", kana: "ごめんなさい", romaji: "gomen nasai", english: "I'm sorry", scenario: "general", difficulty: 1, tags: ["essential"] },
    { japanese: "はい", kana: "はい", romaji: "hai", english: "Yes", scenario: "general", difficulty: 1, tags: ["essential"] },
    { japanese: "いいえ", kana: "いいえ", romaji: "iie", english: "No", scenario: "general", difficulty: 1, tags: ["essential"] },
    { japanese: "わかりません", kana: "わかりません", romaji: "wakarimasen", english: "I don't understand", scenario: "general", difficulty: 1, tags: ["essential"] },
    { japanese: "日本語があまりわかりません", kana: "にほんごがあまりわかりません", romaji: "nihongo ga amari wakarimasen", english: "I don't understand Japanese very well", scenario: "general", difficulty: 2, tags: ["essential"] },
    { japanese: "英語を話せますか？", kana: "えいごをはなせますか？", romaji: "eigo wo hanasemasu ka?", english: "Can you speak English?", scenario: "general", difficulty: 2, tags: ["useful"] },
    { japanese: "もう一度言ってください", kana: "もういちどいってください", romaji: "mou ichido itte kudasai", english: "Please say that again", scenario: "general", difficulty: 2, tags: ["useful"] },
    { japanese: "ゆっくり話してください", kana: "ゆっくりはなしてください", romaji: "yukkuri hanashite kudasai", english: "Please speak slowly", scenario: "general", difficulty: 2, tags: ["useful"] },
    // Shopping
    { japanese: "これはいくらですか？", kana: "これはいくらですか？", romaji: "kore wa ikura desu ka?", english: "How much is this?", scenario: "shopping", difficulty: 1, tags: ["shopping", "essential"] },
    { japanese: "カードで払えますか？", kana: "カードではらえますか？", romaji: "kaado de haraemasu ka?", english: "Can I pay by card?", scenario: "shopping", difficulty: 2, tags: ["shopping", "essential"] },
    { japanese: "これをください", kana: "これをください", romaji: "kore wo kudasai", english: "I'll take this one, please", scenario: "shopping", difficulty: 1, tags: ["shopping", "essential"] },
    { japanese: "袋はいりません", kana: "ふくろはいりません", romaji: "fukuro wa irimasen", english: "I don't need a bag", scenario: "shopping", difficulty: 2, tags: ["shopping"] },
    { japanese: "レシートをください", kana: "レシートをください", romaji: "reshiito wo kudasai", english: "Please give me a receipt", scenario: "shopping", difficulty: 2, tags: ["shopping"] },
    { japanese: "試着できますか？", kana: "しちゃくできますか？", romaji: "shichaku dekimasu ka?", english: "Can I try this on?", scenario: "shopping", difficulty: 3, tags: ["shopping"] },
    // Directions
    { japanese: "駅はどこですか？", kana: "えきはどこですか？", romaji: "eki wa doko desu ka?", english: "Where is the station?", scenario: "directions", difficulty: 1, tags: ["directions", "essential"] },
    { japanese: "トイレはどこですか？", kana: "トイレはどこですか？", romaji: "toire wa doko desu ka?", english: "Where is the bathroom?", scenario: "directions", difficulty: 1, tags: ["directions", "essential"] },
    { japanese: "〜はどこですか？", kana: "〜はどこですか？", romaji: "~ wa doko desu ka?", english: "Where is ~?", scenario: "directions", difficulty: 1, tags: ["directions", "essential"] },
    { japanese: "まっすぐ行ってください", kana: "まっすぐいってください", romaji: "massugu itte kudasai", english: "Go straight ahead", scenario: "directions", difficulty: 2, tags: ["directions"] },
    // Restaurant
    { japanese: "メニューをください", kana: "メニューをください", romaji: "menyuu wo kudasai", english: "Please give me a menu", scenario: "restaurant", difficulty: 2, tags: ["restaurant"] },
    { japanese: "これをひとつください", kana: "これをひとつください", romaji: "kore wo hitotsu kudasai", english: "One of these, please", scenario: "restaurant", difficulty: 2, tags: ["restaurant", "shopping"] },
    { japanese: "お会計をお願いします", kana: "おかいけいをおねがいします", romaji: "okaikei wo onegai shimasu", english: "The bill please", scenario: "restaurant", difficulty: 2, tags: ["restaurant", "essential"] },
    { japanese: "おすすめは何ですか？", kana: "おすすめはなんですか？", romaji: "osusume wa nan desu ka?", english: "What do you recommend?", scenario: "restaurant", difficulty: 3, tags: ["restaurant"] },
    { japanese: "アレルギーがあります", kana: "アレルギーがあります", romaji: "arerugii ga arimasu", english: "I have an allergy", scenario: "restaurant", difficulty: 3, tags: ["restaurant", "healthcare"] },
    // Transportation
    { japanese: "〜まで、お願いします", kana: "〜まで、おねがいします", romaji: "~ made, onegai shimasu", english: "To ~, please (to driver)", scenario: "transportation", difficulty: 2, tags: ["taxi", "essential"] },
    { japanese: "〜行きの電車はどれですか？", kana: "〜いきのでんしゃはどれですか？", romaji: "~ yuki no densha wa dore desu ka?", english: "Which train goes to ~?", scenario: "transportation", difficulty: 3, tags: ["train"] },
    { japanese: "切符を一枚ください", kana: "きっぷをいちまいください", romaji: "kippu wo ichimai kudasai", english: "One ticket please", scenario: "transportation", difficulty: 2, tags: ["train"] },
    // Hotel
    { japanese: "チェックインをお願いします", kana: "チェックインをおねがいします", romaji: "chekkuin wo onegai shimasu", english: "I'd like to check in", scenario: "hotel", difficulty: 2, tags: ["hotel"] },
    { japanese: "予約しています", kana: "よやくしています", romaji: "yoyaku shite imasu", english: "I have a reservation", scenario: "hotel", difficulty: 2, tags: ["hotel", "restaurant"] },
    { japanese: "部屋のカギをなくしました", kana: "へやのかぎをなくしました", romaji: "heya no kagi wo nakushimashita", english: "I lost my room key", scenario: "hotel", difficulty: 3, tags: ["hotel"] },
    // Emergency
    { japanese: "助けてください！", kana: "たすけてください！", romaji: "tasukete kudasai!", english: "Please help me!", scenario: "emergency", difficulty: 1, tags: ["emergency", "essential"] },
    { japanese: "救急車を呼んでください", kana: "きゅうきゅうしゃをよんでください", romaji: "kyuukyuusha wo yonde kudasai", english: "Please call an ambulance", scenario: "emergency", difficulty: 3, tags: ["emergency"] },
    { japanese: "警察を呼んでください", kana: "けいさつをよんでください", romaji: "keisatsu wo yonde kudasai", english: "Please call the police", scenario: "emergency", difficulty: 3, tags: ["emergency"] },
    { japanese: "財布を盗まれました", kana: "さいふをぬすまれました", romaji: "saifu wo nusumaremashita", english: "My wallet was stolen", scenario: "emergency", difficulty: 4, tags: ["emergency"] },
  ];

  for (const p of phrases) {
    await prisma.phrase.upsert({
      where: { id: `phrase-${p.japanese}` },
      create: { ...p, id: `phrase-${p.japanese}` },
      update: {},
    });
  }
  console.log(`  Seeded ${phrases.length} phrases`);
}

async function seedAchievements() {
  const achievements = [
    { key: "first_lesson", title: "First Steps", description: "Complete your first lesson", xpReward: 50, iconName: "star" },
    { key: "streak_3", title: "Getting Warmed Up", description: "Study 3 days in a row", xpReward: 100, iconName: "flame" },
    { key: "streak_7", title: "One Week Strong", description: "Study 7 days in a row", xpReward: 250, iconName: "flame" },
    { key: "streak_30", title: "Dedicated Learner", description: "Study 30 days in a row", xpReward: 1000, iconName: "trophy" },
    { key: "streak_100", title: "Unstoppable", description: "Study 100 days in a row", xpReward: 5000, iconName: "trophy" },
    { key: "hiragana_complete", title: "Hiragana Master", description: "Master all hiragana", xpReward: 500, iconName: "check-circle" },
    { key: "katakana_complete", title: "Katakana Master", description: "Master all katakana", xpReward: 500, iconName: "check-circle" },
    { key: "vocab_50", title: "Word Starter", description: "Learn 50 vocabulary words", xpReward: 150, iconName: "book" },
    { key: "vocab_100", title: "Word Collector", description: "Learn 100 vocabulary words", xpReward: 300, iconName: "book" },
    { key: "vocab_500", title: "Vocabulary Builder", description: "Learn 500 vocabulary words", xpReward: 750, iconName: "book" },
    { key: "vocab_1000", title: "Word Master", description: "Learn 1000 vocabulary words", xpReward: 2000, iconName: "book" },
    { key: "kanji_50", title: "Kanji Beginner", description: "Learn 50 kanji", xpReward: 300, iconName: "zap" },
    { key: "kanji_100", title: "Kanji Student", description: "Learn 100 kanji", xpReward: 500, iconName: "zap" },
    { key: "kanji_250", title: "Kanji Scholar", description: "Learn 250 kanji", xpReward: 1000, iconName: "zap" },
    { key: "kanji_500", title: "Kanji Expert", description: "Learn 500 kanji", xpReward: 2500, iconName: "zap" },
    { key: "reviews_100", title: "Review Warrior", description: "Complete 100 reviews", xpReward: 200, iconName: "refresh-cw" },
    { key: "reviews_500", title: "Review Champion", description: "Complete 500 reviews", xpReward: 500, iconName: "refresh-cw" },
    { key: "perfect_lesson", title: "Perfect Score", description: "Complete a lesson with 100% accuracy", xpReward: 150, iconName: "award" },
    { key: "level_5", title: "Level 5", description: "Reach level 5", xpReward: 200, iconName: "star" },
    { key: "level_10", title: "Level 10", description: "Reach level 10", xpReward: 500, iconName: "star" },
  ];

  for (const a of achievements) {
    await prisma.achievement.upsert({
      where: { key: a.key },
      create: a,
      update: {},
    });
  }
  console.log(`  Seeded ${achievements.length} achievements`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
