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
    { character: "あ", romaji: "a", displayOrder: 1, mnemonicHint: "Looks like an 'a' with a fishing hook tail — imagine catching an 'ah!' fish." },
    { character: "い", romaji: "i", displayOrder: 2, mnemonicHint: "Two chopsticks standing side by side, like the two dots on a lowercase 'i'." },
    { character: "う", romaji: "u", displayOrder: 3, mnemonicHint: "A bird's beak dipping down to sip water — 'u' for a sip of water." },
    { character: "え", romaji: "e", displayOrder: 4, mnemonicHint: "A stretched-out figure leaning forward, like someone exercising and yelling 'eh!'" },
    { character: "お", romaji: "o", displayOrder: 5, mnemonicHint: "A person with a round belly and a topknot — 'o' for an 'oh so round' curve." },
    // K row
    { character: "か", romaji: "ka", displayOrder: 6, mnemonicHint: "A knife slicing with a 'ka-ching' sound as the blade swings down." },
    { character: "き", romaji: "ki", displayOrder: 7, mnemonicHint: "Looks like a key with two teeth on the stem — 'ki' sounds like 'key'." },
    { character: "く", romaji: "ku", displayOrder: 8, mnemonicHint: "A boomerang shape curving back — 'ku' curves like a comma." },
    { character: "け", romaji: "ke", displayOrder: 9, mnemonicHint: "A key sticking out of a lock, shaped like a 'k' with an extra leg." },
    { character: "こ", romaji: "ko", displayOrder: 10, mnemonicHint: "Two parallel strokes stacked like two commas — 'ko-ko' for 'comma-comma'." },
    // S row
    { character: "さ", romaji: "sa", displayOrder: 11, mnemonicHint: "A fishing rod with a hook — 'sa' for the 'saw' cutting the line free." },
    { character: "し", romaji: "shi", displayOrder: 12, mnemonicHint: "A single curved fishhook, simple as a soft 'shh' whispered." },
    { character: "す", romaji: "su", displayOrder: 13, mnemonicHint: "A swirling straw sucking up a drink — 'su' for 'suck'." },
    { character: "せ", romaji: "se", displayOrder: 14, mnemonicHint: "A seesaw shape tilting side to side — 'se' for 'seesaw'." },
    { character: "そ", romaji: "so", displayOrder: 15, mnemonicHint: "A zigzag lightning bolt — 'so' surprising, like a shock." },
    // T row
    { character: "た", romaji: "ta", displayOrder: 16, mnemonicHint: "A person standing with arms out, shouting 'ta-da!'" },
    { character: "ち", romaji: "chi", displayOrder: 17, mnemonicHint: "A curled ribbon, like a cheerleader's pom-pom for a 'chi-chi-chi' cheer." },
    { character: "つ", romaji: "tsu", displayOrder: 18, mnemonicHint: "A single cresting wave — 'tsu' as in tsunami." },
    { character: "て", romaji: "te", displayOrder: 19, mnemonicHint: "A hand reaching out, shaped like a hook — 'te' for a 'ten-tacle' reaching." },
    { character: "と", romaji: "to", displayOrder: 20, mnemonicHint: "A toe pointing forward, a simple hook and line — 'to' for 'toe'." },
    // N row
    { character: "な", romaji: "na", displayOrder: 21, mnemonicHint: "A knot tangled like noodles — 'na' for 'noodle'." },
    { character: "に", romaji: "ni", displayOrder: 22, mnemonicHint: "Two chopsticks and a needle side by side — 'ni' for 'needle'." },
    { character: "ぬ", romaji: "nu", displayOrder: 23, mnemonicHint: "A noodle with a loop tangled at the end — 'nu' for a 'noodle knot'." },
    { character: "ね", romaji: "ne", displayOrder: 24, mnemonicHint: "A cat's tail curling with a loop — 'ne' sounds like 'neko' (cat)." },
    { character: "の", romaji: "no", displayOrder: 25, mnemonicHint: "A single spiral loop, drawn in one stroke — like writing 'no' with a swirl." },
    // H row
    { character: "は", romaji: "ha", displayOrder: 26, mnemonicHint: "A person laughing 'ha ha' with arms raised." },
    { character: "ひ", romaji: "hi", displayOrder: 27, mnemonicHint: "A simple curved smile — 'hi' for a happy wave hello." },
    { character: "ふ", romaji: "fu", displayOrder: 28, mnemonicHint: "Mount Fuji's silhouette in three strokes — 'fu' for Fuji." },
    { character: "へ", romaji: "he", displayOrder: 29, mnemonicHint: "A single upward slope like a small hill — 'he' for a hill." },
    { character: "ほ", romaji: "ho", displayOrder: 30, mnemonicHint: "A house with a chimney and a flag — 'ho' for 'home'." },
    // M row
    { character: "ま", romaji: "ma", displayOrder: 31, mnemonicHint: "A mother rocking a loop like a cradle — 'ma' for 'mama'." },
    { character: "み", romaji: "mi", displayOrder: 32, mnemonicHint: "A curled fishing line with a loop — 'mi' for a miniature swirl." },
    { character: "む", romaji: "mu", displayOrder: 33, mnemonicHint: "A cow's face mooing — 'mu' sounds like 'moo'." },
    { character: "め", romaji: "me", displayOrder: 34, mnemonicHint: "An eye shape looking back at you — 'me' means 'eye' in Japanese." },
    { character: "も", romaji: "mo", displayOrder: 35, mnemonicHint: "A fishhook with an extra loop — 'mo' for 'more' hook." },
    // Y row
    { character: "や", romaji: "ya", displayOrder: 36, mnemonicHint: "A slingshot 'Y' shape — 'ya' as in yelling 'yah!'" },
    { character: "ゆ", romaji: "yu", displayOrder: 37, mnemonicHint: "A hook with a loop like a U-turn — 'yu' sounds like 'you'." },
    { character: "よ", romaji: "yo", displayOrder: 38, mnemonicHint: "A fishhook with a little flag — 'yo!' waving hello." },
    // R row
    { character: "ら", romaji: "ra", displayOrder: 39, mnemonicHint: "A rabbit's ear flopping over — 'ra' for 'rabbit'." },
    { character: "り", romaji: "ri", displayOrder: 40, mnemonicHint: "Two strokes leaning like chopsticks — 'ri' for 'rice' sticks." },
    { character: "る", romaji: "ru", displayOrder: 41, mnemonicHint: "A loop swirling like a whirlpool — 'ru' for the swirl." },
    { character: "れ", romaji: "re", displayOrder: 42, mnemonicHint: "A person leaning back, relaxed — 're' for 'rest'." },
    { character: "ろ", romaji: "ro", displayOrder: 43, mnemonicHint: "A rolled-up scroll — 'ro' for 'roll'." },
    // W row + N
    { character: "わ", romaji: "wa", displayOrder: 44, mnemonicHint: "A wave rolling with a loop at the end — 'wa' for 'water wave'." },
    { character: "を", romaji: "wo", displayOrder: 45, mnemonicHint: "A fishhook with a flourish — rarely written, only used as the particle 'wo/o'." },
    { character: "ん", romaji: "n", displayOrder: 46, mnemonicHint: "A single hooked stroke — the only sound that's just 'n', hooked and alone." },
    // Dakuten G
    { character: "が", romaji: "ga", displayOrder: 47, mnemonicHint: "Same shape as か (ka) with two small strokes (゛) added — the knife now clangs 'ga'." },
    { character: "ぎ", romaji: "gi", displayOrder: 48, mnemonicHint: "Same as き (ki) plus dakuten marks — the key buzzes into 'gi'." },
    { character: "ぐ", romaji: "gu", displayOrder: 49, mnemonicHint: "Same as く (ku) plus dakuten marks — the boomerang hums 'gu'." },
    { character: "げ", romaji: "ge", displayOrder: 50, mnemonicHint: "Same as け (ke) plus dakuten marks — the key-in-lock clicks 'ge'." },
    { character: "ご", romaji: "go", displayOrder: 51, mnemonicHint: "Same as こ (ko) plus dakuten marks — the two commas buzz into 'go'." },
    // Z row
    { character: "ざ", romaji: "za", displayOrder: 52, mnemonicHint: "Same as さ (sa) plus dakuten marks — the fishing rod buzzes 'za'." },
    { character: "じ", romaji: "ji", displayOrder: 53, mnemonicHint: "Same as し (shi) plus dakuten marks — the fishhook buzzes into 'ji'." },
    { character: "ず", romaji: "zu", displayOrder: 54, mnemonicHint: "Same as す (su) plus dakuten marks — the straw slurp buzzes 'zu'." },
    { character: "ぜ", romaji: "ze", displayOrder: 55, mnemonicHint: "Same as せ (se) plus dakuten marks — the seesaw buzzes 'ze'." },
    { character: "ぞ", romaji: "zo", displayOrder: 56, mnemonicHint: "Same as そ (so) plus dakuten marks — the lightning bolt buzzes 'zo'." },
    // D row
    { character: "だ", romaji: "da", displayOrder: 57, mnemonicHint: "Same as た (ta) plus dakuten marks — 'ta-da!' becomes a buzzing 'da'." },
    { character: "ぢ", romaji: "ji2", displayOrder: 58, mnemonicHint: "Same as ち (chi) plus dakuten marks — rare, and pronounced just like じ." },
    { character: "づ", romaji: "zu2", displayOrder: 59, mnemonicHint: "Same as つ (tsu) plus dakuten marks — rare, and pronounced just like ず." },
    { character: "で", romaji: "de", displayOrder: 60, mnemonicHint: "Same as て (te) plus dakuten marks — the reaching hand buzzes 'de'." },
    { character: "ど", romaji: "do", displayOrder: 61, mnemonicHint: "Same as と (to) plus dakuten marks — the toe stomps 'do'." },
    // B row
    { character: "ば", romaji: "ba", displayOrder: 62, mnemonicHint: "Same as は (ha) plus dakuten marks — the laugh buzzes into 'ba'." },
    { character: "び", romaji: "bi", displayOrder: 63, mnemonicHint: "Same as ひ (hi) plus dakuten marks — the smile buzzes 'bi'." },
    { character: "ぶ", romaji: "bu", displayOrder: 64, mnemonicHint: "Same as ふ (fu) plus dakuten marks — Mount Fuji buzzes 'bu'." },
    { character: "べ", romaji: "be", displayOrder: 65, mnemonicHint: "Same as へ (he) plus dakuten marks — the small hill buzzes 'be'." },
    { character: "ぼ", romaji: "bo", displayOrder: 66, mnemonicHint: "Same as ほ (ho) plus dakuten marks — the house buzzes 'bo'." },
    // P row
    { character: "ぱ", romaji: "pa", displayOrder: 67, mnemonicHint: "Same as は (ha) with a small circle (゜) — the laugh pops crisply into 'pa'." },
    { character: "ぴ", romaji: "pi", displayOrder: 68, mnemonicHint: "Same as ひ (hi) with a small circle (゜) — the smile pops into 'pi'." },
    { character: "ぷ", romaji: "pu", displayOrder: 69, mnemonicHint: "Same as ふ (fu) with a small circle (゜) — Mount Fuji pops into 'pu'." },
    { character: "ぺ", romaji: "pe", displayOrder: 70, mnemonicHint: "Same as へ (he) with a small circle (゜) — the hill pops into 'pe'." },
    { character: "ぽ", romaji: "po", displayOrder: 71, mnemonicHint: "Same as ほ (ho) with a small circle (゜) — the house pops into 'po'." },
  ];

  for (const h of hiragana) {
    await prisma.japaneseCharacter.upsert({
      where: { character: h.character },
      create: { ...h, type: ContentType.HIRAGANA },
      update: { mnemonicHint: h.mnemonicHint },
    });
  }
  console.log(`  Seeded ${hiragana.length} hiragana`);
}

async function seedKatakana() {
  const katakana = [
    { character: "ア", romaji: "a", displayOrder: 1, mnemonicHint: "Sharp and angular, like the horns of an antelope — 'A' for antelope." },
    { character: "イ", romaji: "i", displayOrder: 2, mnemonicHint: "Two straight strokes like a mustache — a simple 'i' shape." },
    { character: "ウ", romaji: "u", displayOrder: 3, mnemonicHint: "A roof over a hooked stroke, like a rabbit's ear peeking under a lid." },
    { character: "エ", romaji: "e", displayOrder: 4, mnemonicHint: "Looks like a capital 'E' rotated — an elevator shaft with three floors." },
    { character: "オ", romaji: "o", displayOrder: 5, mnemonicHint: "A person raising one arm and shouting 'oh!'" },
    { character: "カ", romaji: "ka", displayOrder: 6, mnemonicHint: "A sharp karate chop, angular version of か." },
    { character: "キ", romaji: "ki", displayOrder: 7, mnemonicHint: "A key with jagged teeth, angular version of き." },
    { character: "ク", romaji: "ku", displayOrder: 8, mnemonicHint: "A comma-like hook — 'ku' for a cool, quick chop." },
    { character: "ケ", romaji: "ke", displayOrder: 9, mnemonicHint: "A key with an extra leg, angular version of け." },
    { character: "コ", romaji: "ko", displayOrder: 10, mnemonicHint: "A squared-off 'C' shape, like a comma boxed in." },
    { character: "サ", romaji: "sa", displayOrder: 11, mnemonicHint: "A saw blade, angular version of さ." },
    { character: "シ", romaji: "shi", displayOrder: 12, mnemonicHint: "Three short strokes like falling rain — 'shi' for a light shower." },
    { character: "ス", romaji: "su", displayOrder: 13, mnemonicHint: "A person crouching in a swirl — 'su' for a sumo stance." },
    { character: "セ", romaji: "se", displayOrder: 14, mnemonicHint: "A squared-off seesaw, angular version of せ." },
    { character: "ソ", romaji: "so", displayOrder: 15, mnemonicHint: "Two strokes like a falling drop — mirror image of ツ." },
    { character: "タ", romaji: "ta", displayOrder: 16, mnemonicHint: "A standing figure, angular version of た shouting 'ta-da!'" },
    { character: "チ", romaji: "chi", displayOrder: 17, mnemonicHint: "A 'T' shape with a hook, angular version of ち." },
    { character: "ツ", romaji: "tsu", displayOrder: 18, mnemonicHint: "Three short strokes like a cresting wave — mirror image of ソ." },
    { character: "テ", romaji: "te", displayOrder: 19, mnemonicHint: "A television antenna on a stand — 'te' for 'TV'." },
    { character: "ト", romaji: "to", displayOrder: 20, mnemonicHint: "A simple hook, angular version of と — 'to' for 'toe'." },
    { character: "ナ", romaji: "na", displayOrder: 21, mnemonicHint: "A cross shape, angular version of な." },
    { character: "ニ", romaji: "ni", displayOrder: 22, mnemonicHint: "Two horizontal strokes, like the kanji for 'two' — 'ni' for 'knee-two'." },
    { character: "ヌ", romaji: "nu", displayOrder: 23, mnemonicHint: "A noodle looping with a tail, angular version of ぬ." },
    { character: "ネ", romaji: "ne", displayOrder: 24, mnemonicHint: "A shrine gate shape — 'ne' resembles ネ used in shrine names." },
    { character: "ノ", romaji: "no", displayOrder: 25, mnemonicHint: "A single downward slash — the simplest katakana, just one stroke." },
    { character: "ハ", romaji: "ha", displayOrder: 26, mnemonicHint: "Two legs standing apart, like a person laughing 'ha ha'." },
    { character: "ヒ", romaji: "hi", displayOrder: 27, mnemonicHint: "A simple hook and line, angular version of ひ." },
    { character: "フ", romaji: "fu", displayOrder: 28, mnemonicHint: "A single hook stroke like a sickle — 'fu' for the hook." },
    { character: "ヘ", romaji: "he", displayOrder: 29, mnemonicHint: "A small peak or hill — same shape as へ in hiragana." },
    { character: "ホ", romaji: "ho", displayOrder: 30, mnemonicHint: "A house with a crossbeam — angular 'home'." },
    { character: "マ", romaji: "ma", displayOrder: 31, mnemonicHint: "A hook with a cross stroke, angular version of ま." },
    { character: "ミ", romaji: "mi", displayOrder: 32, mnemonicHint: "Three short strokes like a cat's whiskers — 'mi' for whiskers." },
    { character: "ム", romaji: "mu", displayOrder: 33, mnemonicHint: "A cow's face, angular version — 'mu' sounds like 'moo'." },
    { character: "メ", romaji: "me", displayOrder: 34, mnemonicHint: "A crossed 'X' shape, angular version of め — 'me' means 'eye'." },
    { character: "モ", romaji: "mo", displayOrder: 35, mnemonicHint: "A fishhook with a crossbar, angular version of も." },
    { character: "ヤ", romaji: "ya", displayOrder: 36, mnemonicHint: "A slingshot 'Y' shape, angular version of や." },
    { character: "ユ", romaji: "yu", displayOrder: 37, mnemonicHint: "A hook with a loop, angular version of ゆ." },
    { character: "ヨ", romaji: "yo", displayOrder: 38, mnemonicHint: "Three horizontal strokes like a flag on a pole — 'yo!' waving." },
    { character: "ラ", romaji: "ra", displayOrder: 39, mnemonicHint: "A hook with a short leg, angular version of ら." },
    { character: "リ", romaji: "ri", displayOrder: 40, mnemonicHint: "Two vertical strokes like chopsticks, angular version of り." },
    { character: "ル", romaji: "ru", displayOrder: 41, mnemonicHint: "A hook with a swirling tail, angular version of る." },
    { character: "レ", romaji: "re", displayOrder: 42, mnemonicHint: "A single swooping stroke like a ramp — 're' for a ramp." },
    { character: "ロ", romaji: "ro", displayOrder: 43, mnemonicHint: "A perfect square, like a rolled-up box — 'ro' for a box." },
    { character: "ワ", romaji: "wa", displayOrder: 44, mnemonicHint: "A hook with a small tail, angular version of わ." },
    { character: "ヲ", romaji: "wo", displayOrder: 45, mnemonicHint: "Rare — a hook with a flourish, only used as the particle 'wo/o'." },
    { character: "ン", romaji: "n", displayOrder: 46, mnemonicHint: "Two short strokes like a check mark — the only 'n' sound, quick and sharp." },
    { character: "ガ", romaji: "ga", displayOrder: 47, mnemonicHint: "Same as カ (ka) plus dakuten marks (゛) — buzzes into 'ga'." },
    { character: "ギ", romaji: "gi", displayOrder: 48, mnemonicHint: "Same as キ (ki) plus dakuten marks — buzzes into 'gi'." },
    { character: "グ", romaji: "gu", displayOrder: 49, mnemonicHint: "Same as ク (ku) plus dakuten marks — buzzes into 'gu'." },
    { character: "ゲ", romaji: "ge", displayOrder: 50, mnemonicHint: "Same as ケ (ke) plus dakuten marks — buzzes into 'ge'." },
    { character: "ゴ", romaji: "go", displayOrder: 51, mnemonicHint: "Same as コ (ko) plus dakuten marks — buzzes into 'go'." },
    { character: "ザ", romaji: "za", displayOrder: 52, mnemonicHint: "Same as サ (sa) plus dakuten marks — buzzes into 'za'." },
    { character: "ジ", romaji: "ji", displayOrder: 53, mnemonicHint: "Same as シ (shi) plus dakuten marks — buzzes into 'ji'." },
    { character: "ズ", romaji: "zu", displayOrder: 54, mnemonicHint: "Same as ス (su) plus dakuten marks — buzzes into 'zu'." },
    { character: "ゼ", romaji: "ze", displayOrder: 55, mnemonicHint: "Same as セ (se) plus dakuten marks — buzzes into 'ze'." },
    { character: "ゾ", romaji: "zo", displayOrder: 56, mnemonicHint: "Same as ソ (so) plus dakuten marks — buzzes into 'zo'." },
    { character: "ダ", romaji: "da", displayOrder: 57, mnemonicHint: "Same as タ (ta) plus dakuten marks — buzzes into 'da'." },
    { character: "デ", romaji: "de", displayOrder: 58, mnemonicHint: "Same as テ (te) plus dakuten marks — buzzes into 'de'." },
    { character: "ド", romaji: "do", displayOrder: 59, mnemonicHint: "Same as ト (to) plus dakuten marks — buzzes into 'do'." },
    { character: "バ", romaji: "ba", displayOrder: 60, mnemonicHint: "Same as ハ (ha) plus dakuten marks — buzzes into 'ba'." },
    { character: "ビ", romaji: "bi", displayOrder: 61, mnemonicHint: "Same as ヒ (hi) plus dakuten marks — buzzes into 'bi'." },
    { character: "ブ", romaji: "bu", displayOrder: 62, mnemonicHint: "Same as フ (fu) plus dakuten marks — buzzes into 'bu'." },
    { character: "ベ", romaji: "be", displayOrder: 63, mnemonicHint: "Same as ヘ (he) plus dakuten marks — buzzes into 'be'." },
    { character: "ボ", romaji: "bo", displayOrder: 64, mnemonicHint: "Same as ホ (ho) plus dakuten marks — buzzes into 'bo'." },
    { character: "パ", romaji: "pa", displayOrder: 65, mnemonicHint: "Same as ハ (ha) with a small circle (゜) — pops crisply into 'pa'." },
    { character: "ピ", romaji: "pi", displayOrder: 66, mnemonicHint: "Same as ヒ (hi) with a small circle (゜) — pops into 'pi'." },
    { character: "プ", romaji: "pu", displayOrder: 67, mnemonicHint: "Same as フ (fu) with a small circle (゜) — pops into 'pu'." },
    { character: "ペ", romaji: "pe", displayOrder: 68, mnemonicHint: "Same as ヘ (he) with a small circle (゜) — pops into 'pe'." },
    { character: "ポ", romaji: "po", displayOrder: 69, mnemonicHint: "Same as ホ (ho) with a small circle (゜) — pops into 'po'." },
  ];

  for (const k of katakana) {
    await prisma.japaneseCharacter.upsert({
      where: { character: k.character },
      create: { ...k, type: ContentType.KATAKANA },
      update: { mnemonicHint: k.mnemonicHint },
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
    { character: "日", onyomi: ["ニチ", "ジツ"], kunyomi: ["ひ", "-び", "-か"], meanings: ["sun", "day"], strokeCount: 4, jlptLevel: "N5", frequency: 100, radicals: ["日"], mnemonicHint: "A square with a line through it — a window with sunlight streaming across it." },
    { character: "月", onyomi: ["ゲツ", "ガツ"], kunyomi: ["つき"], meanings: ["moon", "month"], strokeCount: 4, jlptLevel: "N5", frequency: 99, radicals: ["月"], mnemonicHint: "A crescent moon shape with two strokes inside, like craters on its surface." },
    { character: "火", onyomi: ["カ"], kunyomi: ["ひ", "ほ-"], meanings: ["fire"], strokeCount: 4, jlptLevel: "N5", frequency: 95, radicals: ["火"], mnemonicHint: "Flames flickering upward from a base, like little tongues of fire." },
    { character: "水", onyomi: ["スイ"], kunyomi: ["みず"], meanings: ["water"], strokeCount: 4, jlptLevel: "N5", frequency: 98, radicals: ["水"], mnemonicHint: "A stream splitting into droplets flowing around a central current." },
    { character: "木", onyomi: ["モク", "ボク"], kunyomi: ["き", "こ-"], meanings: ["tree", "wood"], strokeCount: 4, jlptLevel: "N5", frequency: 97, radicals: ["木"], mnemonicHint: "A trunk with branches spreading out and roots reaching below." },
    { character: "金", onyomi: ["キン", "コン"], kunyomi: ["かね", "かな-"], meanings: ["gold", "money", "metal"], strokeCount: 8, jlptLevel: "N5", frequency: 96, radicals: ["金"], mnemonicHint: "A treasure mound capped with two nuggets buried in the earth." },
    { character: "土", onyomi: ["ド", "ト"], kunyomi: ["つち"], meanings: ["earth", "soil"], strokeCount: 3, jlptLevel: "N5", frequency: 93, radicals: ["土"], mnemonicHint: "A plant sprouting up out of the ground, with a line marking the soil level." },
    { character: "山", onyomi: ["サン"], kunyomi: ["やま"], meanings: ["mountain"], strokeCount: 3, jlptLevel: "N5", frequency: 92, radicals: ["山"], mnemonicHint: "Three peaks in a row, like a simple mountain range silhouette." },
    { character: "川", onyomi: ["セン"], kunyomi: ["かわ"], meanings: ["river"], strokeCount: 3, jlptLevel: "N5", frequency: 91, radicals: ["川"], mnemonicHint: "Three flowing vertical strokes, like three streams running in parallel." },
    { character: "人", onyomi: ["ジン", "ニン"], kunyomi: ["ひと"], meanings: ["person", "people"], strokeCount: 2, jlptLevel: "N5", frequency: 100, radicals: ["人"], mnemonicHint: "Two legs walking — a simple stick figure seen from the side." },
    { character: "口", onyomi: ["コウ", "ク"], kunyomi: ["くち"], meanings: ["mouth", "opening"], strokeCount: 3, jlptLevel: "N5", frequency: 97, radicals: ["口"], mnemonicHint: "A simple open square, like a mouth wide open or a speech bubble." },
    { character: "手", onyomi: ["シュ", "ズ"], kunyomi: ["て"], meanings: ["hand"], strokeCount: 4, jlptLevel: "N5", frequency: 96, radicals: ["手"], mnemonicHint: "A hand with fingers splayed, reaching upward." },
    { character: "目", onyomi: ["モク", "ボク"], kunyomi: ["め"], meanings: ["eye"], strokeCount: 5, jlptLevel: "N5", frequency: 95, radicals: ["目"], mnemonicHint: "A rectangle with lines inside, like an eye with visible lashes." },
    { character: "耳", onyomi: ["ジ"], kunyomi: ["みみ"], meanings: ["ear"], strokeCount: 6, jlptLevel: "N5", frequency: 90, radicals: ["耳"], mnemonicHint: "The outline of an ear's curled shape." },
    { character: "足", onyomi: ["ソク"], kunyomi: ["あし"], meanings: ["foot", "leg"], strokeCount: 7, jlptLevel: "N5", frequency: 94, radicals: ["足"], mnemonicHint: "A mouth (口) sitting on top of a leg — 'the mouth of the leg' walking." },
    { character: "一", onyomi: ["イチ", "イツ"], kunyomi: ["ひと-"], meanings: ["one"], strokeCount: 1, jlptLevel: "N5", frequency: 100, radicals: ["一"], mnemonicHint: "A single horizontal stroke — literally one line." },
    { character: "二", onyomi: ["ニ", "ジ"], kunyomi: ["ふた-"], meanings: ["two"], strokeCount: 2, jlptLevel: "N5", frequency: 99, radicals: ["二"], mnemonicHint: "Two horizontal strokes stacked — literally two lines." },
    { character: "三", onyomi: ["サン"], kunyomi: ["みっ-"], meanings: ["three"], strokeCount: 3, jlptLevel: "N5", frequency: 98, radicals: ["三"], mnemonicHint: "Three horizontal strokes stacked — literally three lines." },
    { character: "四", onyomi: ["シ"], kunyomi: ["よ-", "よん"], meanings: ["four"], strokeCount: 5, jlptLevel: "N5", frequency: 97, radicals: ["囗"], mnemonicHint: "A mouth (囗) with legs boxed inside — four sides enclosing a box." },
    { character: "五", onyomi: ["ゴ"], kunyomi: ["いつ-"], meanings: ["five"], strokeCount: 4, jlptLevel: "N5", frequency: 96, radicals: ["二"], mnemonicHint: "An X between two lines, like fingers crossing to count to five." },
    { character: "六", onyomi: ["ロク"], kunyomi: ["むっ-", "むい"], meanings: ["six"], strokeCount: 4, jlptLevel: "N5", frequency: 95, radicals: ["八"], mnemonicHint: "A roof over a small stand — imagine six people sheltering under one roof." },
    { character: "七", onyomi: ["シチ"], kunyomi: ["なな", "なな-"], meanings: ["seven"], strokeCount: 2, jlptLevel: "N5", frequency: 94, radicals: ["一"], mnemonicHint: "A cross with a hook, like a stitched, sharp seven-shaped cut." },
    { character: "八", onyomi: ["ハチ"], kunyomi: ["やっ-", "やつ"], meanings: ["eight"], strokeCount: 2, jlptLevel: "N5", frequency: 93, radicals: ["八"], mnemonicHint: "Two strokes splitting apart, like a pair of chopsticks parting." },
    { character: "九", onyomi: ["ク", "キュウ"], kunyomi: ["ここの-"], meanings: ["nine"], strokeCount: 2, jlptLevel: "N5", frequency: 92, radicals: ["乙"], mnemonicHint: "A hook shape like a bending elbow — one bend short of a perfect ten." },
    { character: "十", onyomi: ["ジュウ", "ジッ"], kunyomi: ["とお", "と"], meanings: ["ten"], strokeCount: 2, jlptLevel: "N5", frequency: 99, radicals: ["十"], mnemonicHint: "A perfect cross — ten fingers crossed together." },
    { character: "百", onyomi: ["ヒャク"], kunyomi: ["もも"], meanings: ["hundred"], strokeCount: 6, jlptLevel: "N5", frequency: 97, radicals: ["百"], mnemonicHint: "A white (白) sun above a single stroke — a hundred suns shining." },
    { character: "千", onyomi: ["セン"], kunyomi: ["ち"], meanings: ["thousand"], strokeCount: 3, jlptLevel: "N5", frequency: 96, radicals: ["十"], mnemonicHint: "A person standing on top of ten (十) — a thousand people stacked on ten." },
    { character: "万", onyomi: ["マン", "バン"], kunyomi: ["よろず"], meanings: ["ten-thousand"], strokeCount: 3, jlptLevel: "N5", frequency: 95, radicals: ["一"], mnemonicHint: "A scorpion-like hooked shape, symbolizing its countless legs — ten thousand of them." },
    { character: "上", onyomi: ["ジョウ", "ショウ"], kunyomi: ["うえ", "かみ", "あ-げる"], meanings: ["above", "up", "raise"], strokeCount: 3, jlptLevel: "N5", frequency: 98, radicals: ["一"], mnemonicHint: "A short stroke sitting above a horizontal line — literally 'up'." },
    { character: "下", onyomi: ["カ", "ゲ"], kunyomi: ["した", "しも", "さ-げる"], meanings: ["below", "down", "lower"], strokeCount: 3, jlptLevel: "N5", frequency: 97, radicals: ["一"], mnemonicHint: "A short stroke hanging below a horizontal line — literally 'down'." },
    { character: "中", onyomi: ["チュウ"], kunyomi: ["なか"], meanings: ["middle", "inside", "center"], strokeCount: 4, jlptLevel: "N5", frequency: 99, radicals: ["口"], mnemonicHint: "A box with a line straight through its center — right down the middle." },
    { character: "大", onyomi: ["ダイ", "タイ"], kunyomi: ["おお-", "おおきい"], meanings: ["big", "large", "great"], strokeCount: 3, jlptLevel: "N5", frequency: 99, radicals: ["大"], mnemonicHint: "A person standing with arms and legs stretched wide — as big as possible." },
    { character: "小", onyomi: ["ショウ"], kunyomi: ["ちい-さい", "こ-"], meanings: ["small", "little"], strokeCount: 3, jlptLevel: "N5", frequency: 98, radicals: ["小"], mnemonicHint: "Three small strokes clustered close together, tiny and compact." },
    { character: "年", onyomi: ["ネン"], kunyomi: ["とし"], meanings: ["year"], strokeCount: 6, jlptLevel: "N5", frequency: 99, radicals: ["干"], mnemonicHint: "A person carrying a bundle of rice on their back — one year's harvest." },
    { character: "国", onyomi: ["コク"], kunyomi: ["くに"], meanings: ["country", "nation"], strokeCount: 8, jlptLevel: "N5", frequency: 98, radicals: ["囗"], mnemonicHint: "A jewel enclosed inside a border — a nation's treasured land." },
    { character: "語", onyomi: ["ゴ"], kunyomi: ["かた-る"], meanings: ["language", "word", "talk"], strokeCount: 14, jlptLevel: "N5", frequency: 97, radicals: ["言"], mnemonicHint: "Words (言) spoken over and over through a mouth (口) — the sound of language." },
    { character: "本", onyomi: ["ホン"], kunyomi: ["もと"], meanings: ["book", "origin", "root"], strokeCount: 5, jlptLevel: "N5", frequency: 99, radicals: ["木"], mnemonicHint: "A tree (木) with an extra stroke at its root — the 'origin' or base of the tree." },
    { character: "学", onyomi: ["ガク"], kunyomi: ["まな-ぶ"], meanings: ["study", "learn"], strokeCount: 8, jlptLevel: "N5", frequency: 98, radicals: ["子"], mnemonicHint: "A child (子) under a roof, surrounded by scribbles — studying at a desk." },
    { character: "校", onyomi: ["コウ"], kunyomi: [], meanings: ["school"], strokeCount: 10, jlptLevel: "N5", frequency: 96, radicals: ["木"], mnemonicHint: "A tree (木) with intersecting strokes — wooden school buildings crossed with study." },
    { character: "先", onyomi: ["セン"], kunyomi: ["さき"], meanings: ["ahead", "previous", "tip"], strokeCount: 6, jlptLevel: "N5", frequency: 97, radicals: ["儿"], mnemonicHint: "A person (儿) walking ahead of everyone else — the one who goes first." },
    { character: "生", onyomi: ["セイ", "ショウ"], kunyomi: ["い-きる", "うま-れる", "なま"], meanings: ["life", "birth", "raw"], strokeCount: 5, jlptLevel: "N5", frequency: 100, radicals: ["生"], mnemonicHint: "A plant sprouting up out of the ground — new life growing." },
    { character: "東", onyomi: ["トウ"], kunyomi: ["ひがし"], meanings: ["east"], strokeCount: 8, jlptLevel: "N5", frequency: 97, radicals: ["木"], mnemonicHint: "The sun (日) rising behind a tree (木) — sunrise in the east." },
    { character: "西", onyomi: ["セイ", "サイ"], kunyomi: ["にし"], meanings: ["west"], strokeCount: 6, jlptLevel: "N5", frequency: 95, radicals: ["西"], mnemonicHint: "A bird settling into its nest as the sun sets in the west." },
    { character: "南", onyomi: ["ナン", "ナ"], kunyomi: ["みなみ"], meanings: ["south"], strokeCount: 9, jlptLevel: "N5", frequency: 94, radicals: ["十"], mnemonicHint: "A tent with poles — southern lands are warm, like camping under the sun." },
    { character: "北", onyomi: ["ホク"], kunyomi: ["きた"], meanings: ["north"], strokeCount: 5, jlptLevel: "N5", frequency: 93, radicals: ["匕"], mnemonicHint: "Two people standing back-to-back, facing away from each other — facing north." },
    { character: "駅", onyomi: ["エキ"], kunyomi: [], meanings: ["station"], strokeCount: 14, jlptLevel: "N5", frequency: 96, radicals: ["馬"], mnemonicHint: "A horse (馬) radical, since stations were historically where horses were exchanged." },
    { character: "電", onyomi: ["デン"], kunyomi: [], meanings: ["electricity", "electric"], strokeCount: 13, jlptLevel: "N5", frequency: 97, radicals: ["雨"], mnemonicHint: "Rain (雨) with a lightning bolt underneath — electricity like a lightning strike." },
    { character: "車", onyomi: ["シャ"], kunyomi: ["くるま"], meanings: ["car", "vehicle"], strokeCount: 7, jlptLevel: "N5", frequency: 98, radicals: ["車"], mnemonicHint: "A simple wheel viewed from above, with an axle running through the center." },
    { character: "店", onyomi: ["テン"], kunyomi: ["みせ"], meanings: ["store", "shop"], strokeCount: 8, jlptLevel: "N5", frequency: 96, radicals: ["广"], mnemonicHint: "A shelter (广) covering a plot of land — a sheltered place to sell goods." },
    { character: "食", onyomi: ["ショク", "ジキ"], kunyomi: ["た-べる", "く-う"], meanings: ["eat", "food"], strokeCount: 9, jlptLevel: "N5", frequency: 99, radicals: ["食"], mnemonicHint: "A lid over a covered dish, like a person bent over a bowl of rice." },
  ];

  for (const k of kanji) {
    await prisma.kanji.upsert({
      where: { character: k.character },
      create: k,
      update: { mnemonicHint: k.mnemonicHint },
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
