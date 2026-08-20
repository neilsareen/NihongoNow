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
    { character: "あ", romaji: "a", displayOrder: 1, mnemonicHint: "🅰️ A capital A with a curl tied on — an ant hauling an apple. Say 'ah'." },
    { character: "い", romaji: "i", displayOrder: 2, mnemonicHint: "🐟 Two eels swimming side by side — 'ee' as in eel." },
    { character: "う", romaji: "u", displayOrder: 3, mnemonicHint: "🙇 A person hunched under a heavy load, groaning 'ooo'." },
    { character: "え", romaji: "e", displayOrder: 4, mnemonicHint: "🦢 An exotic bird standing tall with one fancy tail feather — 'e' for exotic." },
    { character: "お", romaji: "o", displayOrder: 5, mnemonicHint: "⛳ A golfer mid-swing beside the flag — the ball sails off and everyone yells 'Oh!' (あ has no dangling foot.)" },
    // K row
    { character: "か", romaji: "ka", displayOrder: 6, mnemonicHint: "🗡️ A katana with its handle crossing the blade — 'ka' for katana." },
    { character: "き", romaji: "ki", displayOrder: 7, mnemonicHint: "🔑 An old key with two teeth on the stem — 'ki' is literally 'key'." },
    { character: "く", romaji: "ku", displayOrder: 8, mnemonicHint: "🐦 A cuckoo bird's open beak, calling 'ku-ku'." },
    { character: "け", romaji: "ke", displayOrder: 9, mnemonicHint: "🍺 A beer keg with the tap sticking out the side — 'ke' for keg." },
    { character: "こ", romaji: "ko", displayOrder: 10, mnemonicHint: "🐟 Two koi swimming one above the other — 'ko' for koi." },
    // S row
    { character: "さ", romaji: "sa", displayOrder: 11, mnemonicHint: "🍶 A bottle tipping to pour sake into a cup — 'sa' for sake. (ち is its mirror image.)" },
    { character: "し", romaji: "shi", displayOrder: 12, mnemonicHint: "🎣 One long fishing line dangling in the water — she is patiently waiting. 'shi' sounds like 'she'." },
    { character: "す", romaji: "su", displayOrder: 13, mnemonicHint: "🍣 A sushi roll skewered on a stick — 'su' for sushi." },
    { character: "せ", romaji: "se", displayOrder: 14, mnemonicHint: "🤳 A face made of strokes: two eyes, a nose, and a wide grin — say 'seh' for the selfie." },
    { character: "そ", romaji: "so", displayOrder: 15, mnemonicHint: "🧵 A zig-zag of thread coming off a sewing machine — 'so' for sewing." },
    // T row
    { character: "た", romaji: "ta", displayOrder: 16, mnemonicHint: "🌮 A fork on the left, a taco on the right — 'ta' for taco." },
    { character: "ち", romaji: "chi", displayOrder: 17, mnemonicHint: "📣 A cheerleader mid-jump, ponytail flying — 'chi' for cheer. (Mirror image of さ.)" },
    { character: "つ", romaji: "tsu", displayOrder: 18, mnemonicHint: "🌊 One curling wave about to break — 'tsu' for tsunami." },
    { character: "て", romaji: "te", displayOrder: 19, mnemonicHint: "🐕 A dog's tail curling up as it wags — 'te' for tail." },
    { character: "と", romaji: "to", displayOrder: 20, mnemonicHint: "🦶 A toe with a thorn stuck in the side — ouch! 'to' for toe." },
    // N row
    { character: "な", romaji: "na", displayOrder: 21, mnemonicHint: "⛪ A nun kneeling beside a cross — 'na' for nun." },
    { character: "に", romaji: "ni", displayOrder: 22, mnemonicHint: "🦵 Someone kneeling: straight back, bent knees — 'ni' for knee." },
    { character: "ぬ", romaji: "nu", displayOrder: 23, mnemonicHint: "🍜 Chopsticks lifting a loop of noodles — 'nu' for noodles. (め has no loop.)" },
    { character: "ね", romaji: "ne", displayOrder: 24, mnemonicHint: "🐱 A cat sitting with its tail curled into a spiral — cat is 'neko'. 'ne'." },
    { character: "の", romaji: "no", displayOrder: 25, mnemonicHint: "🚭 The circle-and-slash of a no-smoking sign — 'no' means no." },
    // H row
    { character: "は", romaji: "ha", displayOrder: 26, mnemonicHint: "🏠 A house with a chimney, where you laugh 'ha ha' with the door shut." },
    { character: "ひ", romaji: "hi", displayOrder: 27, mnemonicHint: "😄 A wide grin seen from the side, laughing 'hee hee' — 'hi' sounds like 'hee'." },
    { character: "ふ", romaji: "fu", displayOrder: 28, mnemonicHint: "🗻 Mount Fuji with a cloud on either side — 'fu' for Fuji." },
    { character: "へ", romaji: "he", displayOrder: 29, mnemonicHint: "🌾 A haystack sitting in a field — 'heh' for haystack." },
    { character: "ほ", romaji: "ho", displayOrder: 30, mnemonicHint: "📡 The は house plus an antenna bar on the roof — now it's a proper home. 'ho'." },
    // M row
    { character: "ま", romaji: "ma", displayOrder: 31, mnemonicHint: "👩 Mama with her hair in a bun and her arms folded — 'ma' for mama." },
    { character: "み", romaji: "mi", displayOrder: 32, mnemonicHint: "🎶 A curly 21 that doubles as a music note — sing do-re-MI." },
    { character: "む", romaji: "mu", displayOrder: 33, mnemonicHint: "🐄 A cow's face with a snout and a tuft of hair — 'mu' for moo." },
    { character: "め", romaji: "me", displayOrder: 34, mnemonicHint: "👁️ An eye with one long lash and no loop on the end — 'me' (目) means eye. (ぬ is the one with the loop.)" },
    { character: "も", romaji: "mo", displayOrder: 35, mnemonicHint: "🎣 A hook with two worms on it — you want more fish. 'mo' for more." },
    // Y row
    { character: "や", romaji: "ya", displayOrder: 36, mnemonicHint: "⛵ A yacht's sail leaning into the breeze — 'ya' for yacht." },
    { character: "ゆ", romaji: "yu", displayOrder: 37, mnemonicHint: "🐡 A strange fish with a curled tail — 'yu' sounds like 'you': there's no fish quite like you." },
    { character: "よ", romaji: "yo", displayOrder: 38, mnemonicHint: "🪀 A yo-yo hanging off its string — 'yo' for yo-yo." },
    // R row
    { character: "ら", romaji: "ra", displayOrder: 39, mnemonicHint: "🐰 A rabbit sitting up with one ear flopped over — 'ra' for rabbit." },
    { character: "り", romaji: "ri", displayOrder: 40, mnemonicHint: "🎋 Two reeds standing in the shallows of a river — 'ri' for reeds." },
    { character: "る", romaji: "ru", displayOrder: 41, mnemonicHint: "🔁 A route that ends in a loop — 'ru' for route. (ろ has no loop.)" },
    { character: "れ", romaji: "re", displayOrder: 42, mnemonicHint: "🧘 A person leaning back to rest — 're' for rest." },
    { character: "ろ", romaji: "ro", displayOrder: 43, mnemonicHint: "🛣️ A road with one sharp bend and no loop at the end — 'ro' for road. (る is the looped one.)" },
    // W row + N
    { character: "わ", romaji: "wa", displayOrder: 44, mnemonicHint: "🌊 A wave curling over at the corner — 'wa' for wave. (ね's tail spirals, れ's kicks out.)" },
    { character: "を", romaji: "wo", displayOrder: 45, mnemonicHint: "🌪️ A person blown over by a whirlwind — said 'o', and only ever used as the object particle." },
    { character: "ん", romaji: "n", displayOrder: 46, mnemonicHint: "✍️ One loose squiggle, like a cursive n — the only kana that's a consonant all by itself." },
    // Dakuten G
    { character: "が", romaji: "ga", displayOrder: 47, mnemonicHint: "🗡️ ゛ The か katana plus two ticks — voice the k and it clangs into 'ga'." },
    { character: "ぎ", romaji: "gi", displayOrder: 48, mnemonicHint: "🔑 ゛ The き key plus two ticks — the k voices into 'gi'." },
    { character: "ぐ", romaji: "gu", displayOrder: 49, mnemonicHint: "🐦 ゛ The く cuckoo plus two ticks — the k voices into 'gu'." },
    { character: "げ", romaji: "ge", displayOrder: 50, mnemonicHint: "🍺 ゛ The け keg plus two ticks — the k voices into 'ge'." },
    { character: "ご", romaji: "go", displayOrder: 51, mnemonicHint: "🐟 ゛ The こ koi plus two ticks — the k voices into 'go'." },
    // Z row
    { character: "ざ", romaji: "za", displayOrder: 52, mnemonicHint: "🍶 ゛ The さ sake bottle plus two ticks — the s voices into 'za'." },
    { character: "じ", romaji: "ji", displayOrder: 53, mnemonicHint: "🎣 ゛ The し fishing line plus two ticks — 'shi' voices into 'ji'." },
    { character: "ず", romaji: "zu", displayOrder: 54, mnemonicHint: "🍣 ゛ The す sushi roll plus two ticks — the s voices into 'zu'." },
    { character: "ぜ", romaji: "ze", displayOrder: 55, mnemonicHint: "🤳 ゛ The せ selfie face plus two ticks — the s voices into 'ze'." },
    { character: "ぞ", romaji: "zo", displayOrder: 56, mnemonicHint: "🧵 ゛ The そ sewing thread plus two ticks — the s voices into 'zo'." },
    // D row
    { character: "だ", romaji: "da", displayOrder: 57, mnemonicHint: "🌮 ゛ The た taco plus two ticks — the t voices into 'da'." },
    { character: "ぢ", romaji: "ji2", displayOrder: 58, mnemonicHint: "📣 ゛ The ち cheerleader plus two ticks — rare, and said exactly like じ." },
    { character: "づ", romaji: "zu2", displayOrder: 59, mnemonicHint: "🌊 ゛ The つ wave plus two ticks — rare, and said exactly like ず." },
    { character: "で", romaji: "de", displayOrder: 60, mnemonicHint: "🐕 ゛ The て wagging tail plus two ticks — the t voices into 'de'." },
    { character: "ど", romaji: "do", displayOrder: 61, mnemonicHint: "🦶 ゛ The と stubbed toe plus two ticks — the t voices into 'do'." },
    // B row
    { character: "ば", romaji: "ba", displayOrder: 62, mnemonicHint: "🏠 ゛ The は house plus two ticks — the h voices into 'ba'." },
    { character: "び", romaji: "bi", displayOrder: 63, mnemonicHint: "😄 ゛ The ひ grin plus two ticks — the h voices into 'bi'." },
    { character: "ぶ", romaji: "bu", displayOrder: 64, mnemonicHint: "🗻 ゛ Mount Fuji ふ plus two ticks — the h voices into 'bu'." },
    { character: "べ", romaji: "be", displayOrder: 65, mnemonicHint: "🌾 ゛ The へ haystack plus two ticks — the h voices into 'be'." },
    { character: "ぼ", romaji: "bo", displayOrder: 66, mnemonicHint: "📡 ゛ The ほ home plus two ticks — the h voices into 'bo'." },
    // P row
    { character: "ぱ", romaji: "pa", displayOrder: 67, mnemonicHint: "🏠 ゜ The は house plus a small circle — the circle pops the sound into 'pa'." },
    { character: "ぴ", romaji: "pi", displayOrder: 68, mnemonicHint: "😄 ゜ The ひ grin plus a small circle — it pops into 'pi'." },
    { character: "ぷ", romaji: "pu", displayOrder: 69, mnemonicHint: "🗻 ゜ Mount Fuji ふ plus a small circle — it pops into 'pu'." },
    { character: "ぺ", romaji: "pe", displayOrder: 70, mnemonicHint: "🌾 ゜ The へ haystack plus a small circle — it pops into 'pe'." },
    { character: "ぽ", romaji: "po", displayOrder: 71, mnemonicHint: "📡 ゜ The ほ home plus a small circle — it pops into 'po'." },
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
    { character: "ア", romaji: "a", displayOrder: 1, mnemonicHint: "🪓 An axe with the blade angled off the top — 'a' for axe. (All corners; あ is the loopy one.)" },
    { character: "イ", romaji: "i", displayOrder: 2, mnemonicHint: "🦅 An eagle diving with one wing thrown out — 'ee' for eagle." },
    { character: "ウ", romaji: "u", displayOrder: 3, mnemonicHint: "🙇 The う person bowing, now with a roof for a hat — still groaning 'ooo'." },
    { character: "エ", romaji: "e", displayOrder: 4, mnemonicHint: "🏗️ A steel I-beam seen end-on — what an engineer builds with. 'e'." },
    { character: "オ", romaji: "o", displayOrder: 5, mnemonicHint: "⛳ The same golf swing as お, drawn with straight lines — 'Oh!' goes the ball." },
    { character: "カ", romaji: "ka", displayOrder: 6, mnemonicHint: "🗡️ The か katana with one stroke fewer — 'ka' for katana." },
    { character: "キ", romaji: "ki", displayOrder: 7, mnemonicHint: "🔑 A key with two teeth — the top half of き. 'ki' = key." },
    { character: "ク", romaji: "ku", displayOrder: 8, mnemonicHint: "🐦 The く cuckoo's open beak, sharpened into two strokes — 'ku'." },
    { character: "ケ", romaji: "ke", displayOrder: 9, mnemonicHint: "🍺 A keg tipped over on its side — 'ke' for keg, same as け." },
    { character: "コ", romaji: "ko", displayOrder: 10, mnemonicHint: "🐟 Two koi swimming, drawn as a square bracket — 'ko' for koi." },
    { character: "サ", romaji: "sa", displayOrder: 11, mnemonicHint: "🍶 A sake bottle and two cups lined up on the bar — 'sa' for sake." },
    { character: "シ", romaji: "shi", displayOrder: 12, mnemonicHint: "😀 A smiley tipped on its side: two eyes and a wide smile, all running sideways. 'shi' — she's smiling. (ツ points down.)" },
    { character: "ス", romaji: "su", displayOrder: 13, mnemonicHint: "🦸 Superman's suit hanging empty on a hook — where did he go? 'su' for suit." },
    { character: "セ", romaji: "se", displayOrder: 14, mnemonicHint: "🤳 The same selfie face as せ, squared off — 'se'." },
    { character: "ソ", romaji: "so", displayOrder: 15, mnemonicHint: "🧵 One needle stabbing straight down, thread trailing — sewing. Strokes point down. (ン runs sideways.)" },
    { character: "タ", romaji: "ta", displayOrder: 16, mnemonicHint: "🌮 A taco with a fold on the left — 'ta' for taco, same as た." },
    { character: "チ", romaji: "chi", displayOrder: 17, mnemonicHint: "📣 A cheerleader with pom-poms raised — 'chi' for cheer, same as ち." },
    { character: "ツ", romaji: "tsu", displayOrder: 18, mnemonicHint: "🌊 Two drops falling and a wave crashing down — 'tsu' for tsunami. (シ's strokes run sideways.)" },
    { character: "テ", romaji: "te", displayOrder: 19, mnemonicHint: "📡 A telephone pole with two crossbars — 'te' for telephone." },
    { character: "ト", romaji: "to", displayOrder: 20, mnemonicHint: "🦶 A toe with a thorn stuck in the side — 'to' for toe, same as と." },
    { character: "ナ", romaji: "na", displayOrder: 21, mnemonicHint: "⛪ The nun's cross from な with the nun gone — just the cross is left. 'na' for nun." },
    { character: "ニ", romaji: "ni", displayOrder: 22, mnemonicHint: "2️⃣ Two flat lines — and 'ni' (二) is the Japanese word for two." },
    { character: "ヌ", romaji: "nu", displayOrder: 23, mnemonicHint: "🍜 Chopsticks pulling noodles out of the bowl — 'nu' for noodles, the angular ぬ." },
    { character: "ネ", romaji: "ne", displayOrder: 24, mnemonicHint: "👔 A necktie hanging with the knot at the top — 'ne' for necktie." },
    { character: "ノ", romaji: "no", displayOrder: 25, mnemonicHint: "🚭 The slash off the no-smoking sign, all on its own — 'no'." },
    { character: "ハ", romaji: "ha", displayOrder: 26, mnemonicHint: "😂 Two strokes bursting apart like a mouth open wide: 'ha ha!'" },
    { character: "ヒ", romaji: "hi", displayOrder: 27, mnemonicHint: "😄 A person grinning from the side, laughing 'hee hee' — same face as ひ." },
    { character: "フ", romaji: "fu", displayOrder: 28, mnemonicHint: "🗻 One slope of Mount Fuji — just the left side of the mountain. 'fu' for Fuji." },
    { character: "ヘ", romaji: "he", displayOrder: 29, mnemonicHint: "🌾 The same haystack as hiragana へ — identical shape, identical sound." },
    { character: "ホ", romaji: "ho", displayOrder: 30, mnemonicHint: "📡 The ほ home with its roof antenna, squared off — 'ho'." },
    { character: "マ", romaji: "ma", displayOrder: 31, mnemonicHint: "👩 Mama with her arms folded over — 'ma' for mama, same as ま." },
    { character: "ミ", romaji: "mi", displayOrder: 32, mnemonicHint: "🎶 Three strings you strum for do-re-MI — 'mi'." },
    { character: "ム", romaji: "mu", displayOrder: 33, mnemonicHint: "🐄 A cow's snout seen head-on — 'mu' for moo, same as む." },
    { character: "メ", romaji: "me", displayOrder: 34, mnemonicHint: "🏥 A medical cross tipped onto its side — 'me' for medical. (It's also 目 'me', eye, with an X through it.)" },
    { character: "モ", romaji: "mo", displayOrder: 35, mnemonicHint: "🎣 The も fishhook straightened out — you still want more fish. 'mo'." },
    { character: "ヤ", romaji: "ya", displayOrder: 36, mnemonicHint: "⛵ A yacht's mast and sail leaning in the breeze — 'ya' for yacht." },
    { character: "ユ", romaji: "yu", displayOrder: 37, mnemonicHint: "🔤 Give it a quarter turn and there's a capital U — 'yu'. (コ stays a bracket however you turn it.)" },
    { character: "ヨ", romaji: "yo", displayOrder: 38, mnemonicHint: "🪀 A yo-yo's spool seen edge-on, three prongs — 'yo' for yo-yo." },
    { character: "ラ", romaji: "ra", displayOrder: 39, mnemonicHint: "🐰 The ら rabbit, ear flopped, in two clean strokes — 'ra' for rabbit." },
    { character: "リ", romaji: "ri", displayOrder: 40, mnemonicHint: "🎋 Two reeds standing in the water — 'ri' for reeds, same as り." },
    { character: "ル", romaji: "ru", displayOrder: 41, mnemonicHint: "🛣️ Two routes forking apart, the right one curling away — 'ru' for route." },
    { character: "レ", romaji: "re", displayOrder: 42, mnemonicHint: "✔️ A tick mark leaning back to rest — 're' for rest, same as れ." },
    { character: "ロ", romaji: "ro", displayOrder: 43, mnemonicHint: "🛣️ A road looping one square block, ending where it started — 'ro' for road." },
    { character: "ワ", romaji: "wa", displayOrder: 44, mnemonicHint: "🌊 A wave curling over the corner — 'wa' for wave. (ウ wears a hat; ク is missing the left leg.)" },
    { character: "ヲ", romaji: "wo", displayOrder: 45, mnemonicHint: "🌪️ ワ with a bar driven through it — the を whirlwind, squared off. Barely ever written." },
    { character: "ン", romaji: "n", displayOrder: 46, mnemonicHint: "✍️ One flick and a dot, both running sideways like シ — just 'n'. (ソ points down.)" },
    { character: "ガ", romaji: "ga", displayOrder: 47, mnemonicHint: "🗡️ ゛ The カ katana plus two ticks — the k voices into 'ga'." },
    { character: "ギ", romaji: "gi", displayOrder: 48, mnemonicHint: "🔑 ゛ The キ key plus two ticks — the k voices into 'gi'." },
    { character: "グ", romaji: "gu", displayOrder: 49, mnemonicHint: "🐦 ゛ The ク cuckoo beak plus two ticks — the k voices into 'gu'." },
    { character: "ゲ", romaji: "ge", displayOrder: 50, mnemonicHint: "🍺 ゛ The ケ keg plus two ticks — the k voices into 'ge'." },
    { character: "ゴ", romaji: "go", displayOrder: 51, mnemonicHint: "🐟 ゛ The コ koi plus two ticks — the k voices into 'go'." },
    { character: "ザ", romaji: "za", displayOrder: 52, mnemonicHint: "🍶 ゛ The サ sake bottle plus two ticks — the s voices into 'za'." },
    { character: "ジ", romaji: "ji", displayOrder: 53, mnemonicHint: "😀 ゛ The シ sideways smile plus two ticks — 'shi' voices into 'ji'." },
    { character: "ズ", romaji: "zu", displayOrder: 54, mnemonicHint: "🦸 ゛ The ス empty suit plus two ticks — the s voices into 'zu'." },
    { character: "ゼ", romaji: "ze", displayOrder: 55, mnemonicHint: "🤳 ゛ The セ selfie face plus two ticks — the s voices into 'ze'." },
    { character: "ゾ", romaji: "zo", displayOrder: 56, mnemonicHint: "🧵 ゛ The ソ sewing needle plus two ticks — the s voices into 'zo'." },
    { character: "ダ", romaji: "da", displayOrder: 57, mnemonicHint: "🌮 ゛ The タ taco plus two ticks — the t voices into 'da'." },
    { character: "デ", romaji: "de", displayOrder: 58, mnemonicHint: "📡 ゛ The テ telephone pole plus two ticks — the t voices into 'de'." },
    { character: "ド", romaji: "do", displayOrder: 59, mnemonicHint: "🦶 ゛ The ト stubbed toe plus two ticks — the t voices into 'do'." },
    { character: "バ", romaji: "ba", displayOrder: 60, mnemonicHint: "😂 ゛ The ハ laugh plus two ticks — the h voices into 'ba'." },
    { character: "ビ", romaji: "bi", displayOrder: 61, mnemonicHint: "😄 ゛ The ヒ grin plus two ticks — the h voices into 'bi'." },
    { character: "ブ", romaji: "bu", displayOrder: 62, mnemonicHint: "🗻 ゛ The フ Fuji slope plus two ticks — the h voices into 'bu'." },
    { character: "ベ", romaji: "be", displayOrder: 63, mnemonicHint: "🌾 ゛ The ヘ haystack plus two ticks — the h voices into 'be'." },
    { character: "ボ", romaji: "bo", displayOrder: 64, mnemonicHint: "📡 ゛ The ホ home plus two ticks — the h voices into 'bo'." },
    { character: "パ", romaji: "pa", displayOrder: 65, mnemonicHint: "😂 ゜ The ハ laugh plus a small circle — the circle pops it into 'pa'." },
    { character: "ピ", romaji: "pi", displayOrder: 66, mnemonicHint: "😄 ゜ The ヒ grin plus a small circle — it pops into 'pi'." },
    { character: "プ", romaji: "pu", displayOrder: 67, mnemonicHint: "🗻 ゜ The フ Fuji slope plus a small circle — it pops into 'pu'." },
    { character: "ペ", romaji: "pe", displayOrder: 68, mnemonicHint: "🌾 ゜ The ヘ haystack plus a small circle — it pops into 'pe'." },
    { character: "ポ", romaji: "po", displayOrder: 69, mnemonicHint: "📡 ゜ The ホ home plus a small circle — it pops into 'po'." },
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
    { character: "日", onyomi: ["ニチ", "ジツ"], kunyomi: ["ひ", "-び", "-か"], meanings: ["sun", "day"], strokeCount: 4, jlptLevel: "N5", frequency: 100, radicals: ["日"], mnemonicHint: "A square with a line through it — a window with sunlight streaming across it.", exampleWords: [{ word: "日本", reading: "にほん", meaning: "Japan" }, { word: "今日", reading: "きょう", meaning: "today" }, { word: "毎日", reading: "まいにち", meaning: "every day" }] },
    { character: "月", onyomi: ["ゲツ", "ガツ"], kunyomi: ["つき"], meanings: ["moon", "month"], strokeCount: 4, jlptLevel: "N5", frequency: 99, radicals: ["月"], mnemonicHint: "A crescent moon shape with two strokes inside, like craters on its surface.", exampleWords: [{ word: "月曜日", reading: "げつようび", meaning: "Monday" }, { word: "今月", reading: "こんげつ", meaning: "this month" }] },
    { character: "火", onyomi: ["カ"], kunyomi: ["ひ", "ほ-"], meanings: ["fire"], strokeCount: 4, jlptLevel: "N5", frequency: 95, radicals: ["火"], mnemonicHint: "Flames flickering upward from a base, like little tongues of fire.", exampleWords: [{ word: "火曜日", reading: "かようび", meaning: "Tuesday" }, { word: "花火", reading: "はなび", meaning: "fireworks" }] },
    { character: "水", onyomi: ["スイ"], kunyomi: ["みず"], meanings: ["water"], strokeCount: 4, jlptLevel: "N5", frequency: 98, radicals: ["水"], mnemonicHint: "A stream splitting into droplets flowing around a central current.", exampleWords: [{ word: "水曜日", reading: "すいようび", meaning: "Wednesday" }, { word: "水泳", reading: "すいえい", meaning: "swimming" }] },
    { character: "木", onyomi: ["モク", "ボク"], kunyomi: ["き", "こ-"], meanings: ["tree", "wood"], strokeCount: 4, jlptLevel: "N5", frequency: 97, radicals: ["木"], mnemonicHint: "A trunk with branches spreading out and roots reaching below.", exampleWords: [{ word: "木曜日", reading: "もくようび", meaning: "Thursday" }, { word: "木材", reading: "もくざい", meaning: "lumber, wood" }] },
    { character: "金", onyomi: ["キン", "コン"], kunyomi: ["かね", "かな-"], meanings: ["gold", "money", "metal"], strokeCount: 8, jlptLevel: "N5", frequency: 96, radicals: ["金"], mnemonicHint: "A treasure mound capped with two nuggets buried in the earth.", exampleWords: [{ word: "金曜日", reading: "きんようび", meaning: "Friday" }, { word: "お金", reading: "おかね", meaning: "money" }] },
    { character: "土", onyomi: ["ド", "ト"], kunyomi: ["つち"], meanings: ["earth", "soil"], strokeCount: 3, jlptLevel: "N5", frequency: 93, radicals: ["土"], mnemonicHint: "A plant sprouting up out of the ground, with a line marking the soil level.", exampleWords: [{ word: "土曜日", reading: "どようび", meaning: "Saturday" }, { word: "土地", reading: "とち", meaning: "land" }] },
    { character: "山", onyomi: ["サン"], kunyomi: ["やま"], meanings: ["mountain"], strokeCount: 3, jlptLevel: "N5", frequency: 92, radicals: ["山"], mnemonicHint: "Three peaks in a row, like a simple mountain range silhouette.", exampleWords: [{ word: "富士山", reading: "ふじさん", meaning: "Mt. Fuji" }, { word: "山道", reading: "やまみち", meaning: "mountain path" }] },
    { character: "川", onyomi: ["セン"], kunyomi: ["かわ"], meanings: ["river"], strokeCount: 3, jlptLevel: "N5", frequency: 91, radicals: ["川"], mnemonicHint: "Three flowing vertical strokes, like three streams running in parallel.", exampleWords: [{ word: "川岸", reading: "かわぎし", meaning: "riverbank" }, { word: "小川", reading: "おがわ", meaning: "stream" }] },
    { character: "人", onyomi: ["ジン", "ニン"], kunyomi: ["ひと"], meanings: ["person", "people"], strokeCount: 2, jlptLevel: "N5", frequency: 100, radicals: ["人"], mnemonicHint: "Two legs walking — a simple stick figure seen from the side.", exampleWords: [{ word: "日本人", reading: "にほんじん", meaning: "Japanese person" }, { word: "大人", reading: "おとな", meaning: "adult" }] },
    { character: "口", onyomi: ["コウ", "ク"], kunyomi: ["くち"], meanings: ["mouth", "opening"], strokeCount: 3, jlptLevel: "N5", frequency: 97, radicals: ["口"], mnemonicHint: "A simple open square, like a mouth wide open or a speech bubble.", exampleWords: [{ word: "入口", reading: "いりぐち", meaning: "entrance" }, { word: "出口", reading: "でぐち", meaning: "exit" }] },
    { character: "手", onyomi: ["シュ", "ズ"], kunyomi: ["て"], meanings: ["hand"], strokeCount: 4, jlptLevel: "N5", frequency: 96, radicals: ["手"], mnemonicHint: "A hand with fingers splayed, reaching upward.", exampleWords: [{ word: "手紙", reading: "てがみ", meaning: "letter" }, { word: "上手", reading: "じょうず", meaning: "skillful" }] },
    { character: "目", onyomi: ["モク", "ボク"], kunyomi: ["め"], meanings: ["eye"], strokeCount: 5, jlptLevel: "N5", frequency: 95, radicals: ["目"], mnemonicHint: "A rectangle with lines inside, like an eye with visible lashes.", exampleWords: [{ word: "目的", reading: "もくてき", meaning: "purpose, goal" }, { word: "目玉", reading: "めだま", meaning: "eyeball" }] },
    { character: "耳", onyomi: ["ジ"], kunyomi: ["みみ"], meanings: ["ear"], strokeCount: 6, jlptLevel: "N5", frequency: 90, radicals: ["耳"], mnemonicHint: "The outline of an ear's curled shape.", exampleWords: [{ word: "耳鼻科", reading: "じびか", meaning: "ENT clinic" }, { word: "早耳", reading: "はやみみ", meaning: "quick to hear news" }] },
    { character: "足", onyomi: ["ソク"], kunyomi: ["あし"], meanings: ["foot", "leg"], strokeCount: 7, jlptLevel: "N5", frequency: 94, radicals: ["足"], mnemonicHint: "A mouth (口) sitting on top of a leg — 'the mouth of the leg' walking.", exampleWords: [{ word: "満足", reading: "まんぞく", meaning: "satisfaction" }, { word: "足音", reading: "あしおと", meaning: "footstep sound" }] },
    { character: "一", onyomi: ["イチ", "イツ"], kunyomi: ["ひと-"], meanings: ["one"], strokeCount: 1, jlptLevel: "N5", frequency: 100, radicals: ["一"], mnemonicHint: "A single horizontal stroke — literally one line.", exampleWords: [{ word: "一番", reading: "いちばん", meaning: "number one, best" }, { word: "一日", reading: "いちにち", meaning: "one day" }] },
    { character: "二", onyomi: ["ニ", "ジ"], kunyomi: ["ふた-"], meanings: ["two"], strokeCount: 2, jlptLevel: "N5", frequency: 99, radicals: ["二"], mnemonicHint: "Two horizontal strokes stacked — literally two lines.", exampleWords: [{ word: "二人", reading: "ふたり", meaning: "two people" }, { word: "二月", reading: "にがつ", meaning: "February" }] },
    { character: "三", onyomi: ["サン"], kunyomi: ["みっ-"], meanings: ["three"], strokeCount: 3, jlptLevel: "N5", frequency: 98, radicals: ["三"], mnemonicHint: "Three horizontal strokes stacked — literally three lines.", exampleWords: [{ word: "三人", reading: "さんにん", meaning: "three people" }, { word: "三月", reading: "さんがつ", meaning: "March" }] },
    { character: "四", onyomi: ["シ"], kunyomi: ["よ-", "よん"], meanings: ["four"], strokeCount: 5, jlptLevel: "N5", frequency: 97, radicals: ["囗"], mnemonicHint: "A mouth (囗) with legs boxed inside — four sides enclosing a box.", exampleWords: [{ word: "四月", reading: "しがつ", meaning: "April" }, { word: "四季", reading: "しき", meaning: "four seasons" }] },
    { character: "五", onyomi: ["ゴ"], kunyomi: ["いつ-"], meanings: ["five"], strokeCount: 4, jlptLevel: "N5", frequency: 96, radicals: ["二"], mnemonicHint: "An X between two lines, like fingers crossing to count to five.", exampleWords: [{ word: "五月", reading: "ごがつ", meaning: "May" }, { word: "五人", reading: "ごにん", meaning: "five people" }] },
    { character: "六", onyomi: ["ロク"], kunyomi: ["むっ-", "むい"], meanings: ["six"], strokeCount: 4, jlptLevel: "N5", frequency: 95, radicals: ["八"], mnemonicHint: "A roof over a small stand — imagine six people sheltering under one roof.", exampleWords: [{ word: "六月", reading: "ろくがつ", meaning: "June" }, { word: "六時", reading: "ろくじ", meaning: "six o'clock" }] },
    { character: "七", onyomi: ["シチ"], kunyomi: ["なな", "なな-"], meanings: ["seven"], strokeCount: 2, jlptLevel: "N5", frequency: 94, radicals: ["一"], mnemonicHint: "A cross with a hook, like a stitched, sharp seven-shaped cut.", exampleWords: [{ word: "七月", reading: "しちがつ", meaning: "July" }, { word: "七五三", reading: "しちごさん", meaning: "Shichi-Go-San festival" }] },
    { character: "八", onyomi: ["ハチ"], kunyomi: ["やっ-", "やつ"], meanings: ["eight"], strokeCount: 2, jlptLevel: "N5", frequency: 93, radicals: ["八"], mnemonicHint: "Two strokes splitting apart, like a pair of chopsticks parting.", exampleWords: [{ word: "八月", reading: "はちがつ", meaning: "August" }, { word: "八百屋", reading: "やおや", meaning: "greengrocer" }] },
    { character: "九", onyomi: ["ク", "キュウ"], kunyomi: ["ここの-"], meanings: ["nine"], strokeCount: 2, jlptLevel: "N5", frequency: 92, radicals: ["乙"], mnemonicHint: "A hook shape like a bending elbow — one bend short of a perfect ten.", exampleWords: [{ word: "九月", reading: "くがつ", meaning: "September" }, { word: "九州", reading: "きゅうしゅう", meaning: "Kyushu" }] },
    { character: "十", onyomi: ["ジュウ", "ジッ"], kunyomi: ["とお", "と"], meanings: ["ten"], strokeCount: 2, jlptLevel: "N5", frequency: 99, radicals: ["十"], mnemonicHint: "A perfect cross — ten fingers crossed together.", exampleWords: [{ word: "十月", reading: "じゅうがつ", meaning: "October" }, { word: "十分", reading: "じゅうぶん", meaning: "enough, sufficient" }] },
    { character: "百", onyomi: ["ヒャク"], kunyomi: ["もも"], meanings: ["hundred"], strokeCount: 6, jlptLevel: "N5", frequency: 97, radicals: ["百"], mnemonicHint: "A white (白) sun above a single stroke — a hundred suns shining.", exampleWords: [{ word: "百円", reading: "ひゃくえん", meaning: "100 yen" }, { word: "百科事典", reading: "ひゃっかじてん", meaning: "encyclopedia" }] },
    { character: "千", onyomi: ["セン"], kunyomi: ["ち"], meanings: ["thousand"], strokeCount: 3, jlptLevel: "N5", frequency: 96, radicals: ["十"], mnemonicHint: "A person standing on top of ten (十) — a thousand people stacked on ten.", exampleWords: [{ word: "千円", reading: "せんえん", meaning: "1000 yen" }, { word: "千葉", reading: "ちば", meaning: "Chiba (place name)" }] },
    { character: "万", onyomi: ["マン", "バン"], kunyomi: ["よろず"], meanings: ["ten-thousand"], strokeCount: 3, jlptLevel: "N5", frequency: 95, radicals: ["一"], mnemonicHint: "A scorpion-like hooked shape, symbolizing its countless legs — ten thousand of them.", exampleWords: [{ word: "万年筆", reading: "まんねんひつ", meaning: "fountain pen" }, { word: "万一", reading: "まんいち", meaning: "just in case" }] },
    { character: "上", onyomi: ["ジョウ", "ショウ"], kunyomi: ["うえ", "かみ", "あ-げる"], meanings: ["above", "up", "raise"], strokeCount: 3, jlptLevel: "N5", frequency: 98, radicals: ["一"], mnemonicHint: "A short stroke sitting above a horizontal line — literally 'up'.", exampleWords: [{ word: "上手", reading: "じょうず", meaning: "skillful" }, { word: "上着", reading: "うわぎ", meaning: "jacket" }] },
    { character: "下", onyomi: ["カ", "ゲ"], kunyomi: ["した", "しも", "さ-げる"], meanings: ["below", "down", "lower"], strokeCount: 3, jlptLevel: "N5", frequency: 97, radicals: ["一"], mnemonicHint: "A short stroke hanging below a horizontal line — literally 'down'.", exampleWords: [{ word: "下着", reading: "したぎ", meaning: "underwear" }, { word: "地下", reading: "ちか", meaning: "underground" }] },
    { character: "中", onyomi: ["チュウ"], kunyomi: ["なか"], meanings: ["middle", "inside", "center"], strokeCount: 4, jlptLevel: "N5", frequency: 99, radicals: ["口"], mnemonicHint: "A box with a line straight through its center — right down the middle.", exampleWords: [{ word: "中心", reading: "ちゅうしん", meaning: "center" }, { word: "中学校", reading: "ちゅうがっこう", meaning: "middle school" }] },
    { character: "大", onyomi: ["ダイ", "タイ"], kunyomi: ["おお-", "おおきい"], meanings: ["big", "large", "great"], strokeCount: 3, jlptLevel: "N5", frequency: 99, radicals: ["大"], mnemonicHint: "A person standing with arms and legs stretched wide — as big as possible.", exampleWords: [{ word: "大学", reading: "だいがく", meaning: "university" }, { word: "大人", reading: "おとな", meaning: "adult" }] },
    { character: "小", onyomi: ["ショウ"], kunyomi: ["ちい-さい", "こ-"], meanings: ["small", "little"], strokeCount: 3, jlptLevel: "N5", frequency: 98, radicals: ["小"], mnemonicHint: "Three small strokes clustered close together, tiny and compact.", exampleWords: [{ word: "小学校", reading: "しょうがっこう", meaning: "elementary school" }, { word: "小さい", reading: "ちいさい", meaning: "small" }] },
    { character: "年", onyomi: ["ネン"], kunyomi: ["とし"], meanings: ["year"], strokeCount: 6, jlptLevel: "N5", frequency: 99, radicals: ["干"], mnemonicHint: "A person carrying a bundle of rice on their back — one year's harvest.", exampleWords: [{ word: "今年", reading: "ことし", meaning: "this year" }, { word: "去年", reading: "きょねん", meaning: "last year" }] },
    { character: "国", onyomi: ["コク"], kunyomi: ["くに"], meanings: ["country", "nation"], strokeCount: 8, jlptLevel: "N5", frequency: 98, radicals: ["囗"], mnemonicHint: "A jewel enclosed inside a border — a nation's treasured land.", exampleWords: [{ word: "外国", reading: "がいこく", meaning: "foreign country" }, { word: "国語", reading: "こくご", meaning: "national language" }] },
    { character: "語", onyomi: ["ゴ"], kunyomi: ["かた-る"], meanings: ["language", "word", "talk"], strokeCount: 14, jlptLevel: "N5", frequency: 97, radicals: ["言"], mnemonicHint: "Words (言) spoken over and over through a mouth (口) — the sound of language.", exampleWords: [{ word: "日本語", reading: "にほんご", meaning: "Japanese language" }, { word: "英語", reading: "えいご", meaning: "English language" }] },
    { character: "本", onyomi: ["ホン"], kunyomi: ["もと"], meanings: ["book", "origin", "root"], strokeCount: 5, jlptLevel: "N5", frequency: 99, radicals: ["木"], mnemonicHint: "A tree (木) with an extra stroke at its root — the 'origin' or base of the tree.", exampleWords: [{ word: "本当", reading: "ほんとう", meaning: "true, really" }, { word: "本屋", reading: "ほんや", meaning: "bookstore" }] },
    { character: "学", onyomi: ["ガク"], kunyomi: ["まな-ぶ"], meanings: ["study", "learn"], strokeCount: 8, jlptLevel: "N5", frequency: 98, radicals: ["子"], mnemonicHint: "A child (子) under a roof, surrounded by scribbles — studying at a desk.", exampleWords: [{ word: "学校", reading: "がっこう", meaning: "school" }, { word: "学生", reading: "がくせい", meaning: "student" }] },
    { character: "校", onyomi: ["コウ"], kunyomi: [], meanings: ["school"], strokeCount: 10, jlptLevel: "N5", frequency: 96, radicals: ["木"], mnemonicHint: "A tree (木) with intersecting strokes — wooden school buildings crossed with study.", exampleWords: [{ word: "学校", reading: "がっこう", meaning: "school" }, { word: "校長", reading: "こうちょう", meaning: "principal" }] },
    { character: "先", onyomi: ["セン"], kunyomi: ["さき"], meanings: ["ahead", "previous", "tip"], strokeCount: 6, jlptLevel: "N5", frequency: 97, radicals: ["儿"], mnemonicHint: "A person (儿) walking ahead of everyone else — the one who goes first.", exampleWords: [{ word: "先生", reading: "せんせい", meaning: "teacher" }, { word: "先週", reading: "せんしゅう", meaning: "last week" }] },
    { character: "生", onyomi: ["セイ", "ショウ"], kunyomi: ["い-きる", "うま-れる", "なま"], meanings: ["life", "birth", "raw"], strokeCount: 5, jlptLevel: "N5", frequency: 100, radicals: ["生"], mnemonicHint: "A plant sprouting up out of the ground — new life growing.", exampleWords: [{ word: "先生", reading: "せんせい", meaning: "teacher" }, { word: "学生", reading: "がくせい", meaning: "student" }] },
    { character: "東", onyomi: ["トウ"], kunyomi: ["ひがし"], meanings: ["east"], strokeCount: 8, jlptLevel: "N5", frequency: 97, radicals: ["木"], mnemonicHint: "The sun (日) rising behind a tree (木) — sunrise in the east.", exampleWords: [{ word: "東京", reading: "とうきょう", meaning: "Tokyo" }, { word: "東口", reading: "ひがしぐち", meaning: "east exit" }] },
    { character: "西", onyomi: ["セイ", "サイ"], kunyomi: ["にし"], meanings: ["west"], strokeCount: 6, jlptLevel: "N5", frequency: 95, radicals: ["西"], mnemonicHint: "A bird settling into its nest as the sun sets in the west.", exampleWords: [{ word: "西口", reading: "にしぐち", meaning: "west exit" }, { word: "関西", reading: "かんさい", meaning: "Kansai region" }] },
    { character: "南", onyomi: ["ナン", "ナ"], kunyomi: ["みなみ"], meanings: ["south"], strokeCount: 9, jlptLevel: "N5", frequency: 94, radicals: ["十"], mnemonicHint: "A tent with poles — southern lands are warm, like camping under the sun.", exampleWords: [{ word: "南口", reading: "みなみぐち", meaning: "south exit" }, { word: "南極", reading: "なんきょく", meaning: "Antarctica" }] },
    { character: "北", onyomi: ["ホク"], kunyomi: ["きた"], meanings: ["north"], strokeCount: 5, jlptLevel: "N5", frequency: 93, radicals: ["匕"], mnemonicHint: "Two people standing back-to-back, facing away from each other — facing north.", exampleWords: [{ word: "北口", reading: "きたぐち", meaning: "north exit" }, { word: "北海道", reading: "ほっかいどう", meaning: "Hokkaido" }] },
    { character: "駅", onyomi: ["エキ"], kunyomi: [], meanings: ["station"], strokeCount: 14, jlptLevel: "N5", frequency: 96, radicals: ["馬"], mnemonicHint: "A horse (馬) radical, since stations were historically where horses were exchanged.", exampleWords: [{ word: "駅前", reading: "えきまえ", meaning: "in front of the station" }, { word: "東京駅", reading: "とうきょうえき", meaning: "Tokyo Station" }] },
    { character: "電", onyomi: ["デン"], kunyomi: [], meanings: ["electricity", "electric"], strokeCount: 13, jlptLevel: "N5", frequency: 97, radicals: ["雨"], mnemonicHint: "Rain (雨) with a lightning bolt underneath — electricity like a lightning strike.", exampleWords: [{ word: "電車", reading: "でんしゃ", meaning: "train" }, { word: "電話", reading: "でんわ", meaning: "telephone" }] },
    { character: "車", onyomi: ["シャ"], kunyomi: ["くるま"], meanings: ["car", "vehicle"], strokeCount: 7, jlptLevel: "N5", frequency: 98, radicals: ["車"], mnemonicHint: "A simple wheel viewed from above, with an axle running through the center.", exampleWords: [{ word: "電車", reading: "でんしゃ", meaning: "train" }, { word: "自転車", reading: "じてんしゃ", meaning: "bicycle" }] },
    { character: "店", onyomi: ["テン"], kunyomi: ["みせ"], meanings: ["store", "shop"], strokeCount: 8, jlptLevel: "N5", frequency: 96, radicals: ["广"], mnemonicHint: "A shelter (广) covering a plot of land — a sheltered place to sell goods.", exampleWords: [{ word: "店員", reading: "てんいん", meaning: "shop clerk" }, { word: "売店", reading: "ばいてん", meaning: "kiosk, stand" }] },
    { character: "食", onyomi: ["ショク", "ジキ"], kunyomi: ["た-べる", "く-う"], meanings: ["eat", "food"], strokeCount: 9, jlptLevel: "N5", frequency: 99, radicals: ["食"], mnemonicHint: "A lid over a covered dish, like a person bent over a bowl of rice.", exampleWords: [{ word: "食べ物", reading: "たべもの", meaning: "food" }, { word: "食事", reading: "しょくじ", meaning: "meal" }] },
  ];

  for (const k of kanji) {
    await prisma.kanji.upsert({
      where: { character: k.character },
      create: k,
      update: { mnemonicHint: k.mnemonicHint, exampleWords: k.exampleWords },
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
