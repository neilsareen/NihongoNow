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
    { character: "あ", romaji: "a", displayOrder: 1, mnemonicHint: "Ahh! — Looks like someone opening their mouth wide, exclaiming 'Ahh!' The shape has an open mouth at the bottom." },
    { character: "い", romaji: "i", displayOrder: 2, mnemonicHint: "Eels — Two eels swimming side by side. They squirm and squeak 'eee!' Picture them wriggling next to each other." },
    { character: "う", romaji: "u", displayOrder: 3, mnemonicHint: "Oooh — A little whistle shape. Pucker your lips into a circle and blow 'ooo!' The curved top is your puckered lips." },
    { character: "え", romaji: "e", displayOrder: 4, mnemonicHint: "Eh? — A surprised person throwing their arms up saying 'Eh?!' The crossing strokes look like arms flung wide in surprise." },
    { character: "お", romaji: "o", displayOrder: 5, mnemonicHint: "Oh! — An octopus reaching a tentacle out, saying 'Oh!' The long bottom stroke is the tentacle stretching out." },
    // K row
    { character: "か", romaji: "ka", displayOrder: 6, mnemonicHint: "Car — Looks like a stick figure sitting in a car with arms up. 'Ka-vroom!' The vertical line is the driver, the curved arm is the wheel." },
    { character: "き", romaji: "ki", displayOrder: 7, mnemonicHint: "Key — A fancy old key with prongs sticking out. 'Keep the kee-y!' The horizontal lines are the teeth of the key." },
    { character: "く", romaji: "ku", displayOrder: 8, mnemonicHint: "Cuckoo bird — An open bird beak pointing right, saying 'coo!' Picture a cuckoo clock beak swinging open." },
    { character: "け", romaji: "ke", displayOrder: 9, mnemonicHint: "Kettle — A kettle with a spout and handle. 'Keh... this kettle is hot!' The vertical stroke is the body, the top is the spout." },
    { character: "こ", romaji: "ko", displayOrder: 10, mnemonicHint: "Coil — Two lines stacked like coiled rope on the floor. 'Ko-il it up!' Imagine two loops of rope lying flat." },
    // S row
    { character: "さ", romaji: "sa", displayOrder: 11, mnemonicHint: "Samurai — Crossed blades of a samurai's sword. 'Sa-murai slice!' The crossing strokes look like two swords crossing in battle." },
    { character: "し", romaji: "shi", displayOrder: 12, mnemonicHint: "She — A fishhook curving like the letter J. 'A shiny fishhook!' Picture a gleaming hook ready to catch a fish." },
    { character: "す", romaji: "su", displayOrder: 13, mnemonicHint: "Sushi — A swirling sushi roll with a tail. 'Su-shi spins around!' Imagine a California roll spinning on a conveyor belt." },
    { character: "せ", romaji: "se", displayOrder: 14, mnemonicHint: "Set — A person setting something on a table, arms akimbo. 'Say... sit down and set the table!' The bottom stroke is the table surface." },
    { character: "そ", romaji: "so", displayOrder: 15, mnemonicHint: "Soccer — A leg kicking a soccer ball powerfully. 'So powerful!' The curving stroke is the leg mid-kick." },
    // T row
    { character: "た", romaji: "ta", displayOrder: 16, mnemonicHint: "Table — A table with sturdy legs underneath. 'Ta-ble time!' The horizontal lines are the tabletop and the strokes below are the legs." },
    { character: "ち", romaji: "chi", displayOrder: 17, mnemonicHint: "Cheerful dog — A chihuahua sitting up alert. 'Chee-ky little dog!' The curved top is its perky ears, the stroke below is its sitting body." },
    { character: "つ", romaji: "tsu", displayOrder: 18, mnemonicHint: "Tsunami — A rolling wave curling over itself. 'Tsu-nami!' The wide curving shape is a wave building before it crashes." },
    { character: "て", romaji: "te", displayOrder: 19, mnemonicHint: "Tea — A teacup handle. 'Teh... have some tea!' The hook at the bottom is the handle you grip when sipping." },
    { character: "と", romaji: "to", displayOrder: 20, mnemonicHint: "Toe — A big toe sticking up with a tiny nail on top. 'To-e!' The vertical stroke is the toe, the small hook at top is the toenail." },
    // N row
    { character: "な", romaji: "na", displayOrder: 21, mnemonicHint: "Nap — A person taking a nap, head drooping forward. Picture someone dozing off at their desk, head bent over their arms." },
    { character: "に", romaji: "ni", displayOrder: 22, mnemonicHint: "Needle — Two sharp, parallel needle strokes. 'Knee-dle sharp!' The two lines are a needle's sharp body, ready to sew." },
    { character: "ぬ", romaji: "nu", displayOrder: 23, mnemonicHint: "Noodles — A swirly, loopy noodle shape. 'Noo-dles in a bowl!' The curving loop looks like a noodle swirling in broth." },
    { character: "ね", romaji: "ne", displayOrder: 24, mnemonicHint: "Necktie — A flowing necktie hanging down with a knot at top. 'Tie your ne-cktie!' The shape traces from the knot down to the pointed tip." },
    { character: "の", romaji: "no", displayOrder: 25, mnemonicHint: "No! — A swirling vortex like a spinning 'NO' sign. 'Just say no!' The round spiral is emphatic — a firm, final no." },
    // H row
    { character: "は", romaji: "ha", displayOrder: 26, mnemonicHint: "Ha-ha — A laughing person with arms thrown wide. 'Ha ha ha!' The three main strokes are a body, outstretched arms, and the laughter itself." },
    { character: "ひ", romaji: "hi", displayOrder: 27, mnemonicHint: "Heel — A foot with a high heel curving behind it. 'Hee hee hee!' The long curved stroke is the elegant arch of a high-heeled shoe." },
    { character: "ふ", romaji: "fu", displayOrder: 28, mnemonicHint: "Funny face — Two bumps on top like a cartoonish smiling face. 'Foo — so funny!' The top strokes are eyes, the bottom is a wide grin." },
    { character: "へ", romaji: "he", displayOrder: 29, mnemonicHint: "Heap — A gentle hill or small heap of snow. 'Heh, what a heap!' The single peaked stroke is a mound rising and falling gently." },
    { character: "ほ", romaji: "ho", displayOrder: 30, mnemonicHint: "Ho-ho — Santa's round belly with a belt. 'Ho ho ho!' The shape with its center line looks just like Santa's jolly round belly." },
    // M row
    { character: "ま", romaji: "ma", displayOrder: 31, mnemonicHint: "Mama — A nurturing mama with arms curved around a baby. The horizontal lines are her embrace, the vertical stroke is the baby she holds." },
    { character: "み", romaji: "mi", displayOrder: 32, mnemonicHint: "Meander — Two strokes meandering like a winding river. 'Mee-ander!' Picture a river snaking lazily through a valley." },
    { character: "む", romaji: "mu", displayOrder: 33, mnemonicHint: "Moo — A cow's face with a horn poking up. 'Moo!' The curving top is the horn, and the loop at the bottom is the cow's nose." },
    { character: "め", romaji: "me", displayOrder: 34, mnemonicHint: "Medusa — Swirling snakes like Medusa's tangled hair. 'Meh-dusa!' The looping, intertwined strokes are her writhing serpent locks." },
    { character: "も", romaji: "mo", displayOrder: 35, mnemonicHint: "More hooks — A fishhook with extra notches for catching more fish. 'Mo-re fish!' Two hooks crossed over a line for maximum catching power." },
    // Y row
    { character: "や", romaji: "ya", displayOrder: 36, mnemonicHint: "Yacht — A small sailboat seen from the side. 'Yah, let's sail!' The angled stroke is the sail, the bottom line is the hull on the water." },
    { character: "ゆ", romaji: "yu", displayOrder: 37, mnemonicHint: "Yummy — A spoon dipping into a bowl of soup. 'Yoo-mm-y!' The curved top is the spoon bowl, the vertical stroke goes into the soup." },
    { character: "よ", romaji: "yo", displayOrder: 38, mnemonicHint: "Yo-yo — A yo-yo bouncing on a string. 'Yo!' The open top is the yo-yo, and the looping stroke below is the string in motion." },
    // R row
    { character: "ら", romaji: "ra", displayOrder: 39, mnemonicHint: "Rabbit — A rabbit sitting with one ear perked up. 'Rah!' The curved top stroke is the ear, and the bottom loop is the rabbit's body." },
    { character: "り", romaji: "ri", displayOrder: 40, mnemonicHint: "Reeds — Two tall reeds growing from the ground by a river. 'Ree-ds!' The two vertical strokes stand tall like reeds in the breeze." },
    { character: "る", romaji: "ru", displayOrder: 41, mnemonicHint: "Rooster — A rooster's curly tail feather. 'Roo-doo-doo!' The long curling stroke is the rooster's proud, spiraling tail plume." },
    { character: "れ", romaji: "re", displayOrder: 42, mnemonicHint: "Reindeer — A reindeer kicking up its hind leg. 'Reh-indeer!' The main stroke flows down and the kicked-up leg curls back." },
    { character: "ろ", romaji: "ro", displayOrder: 43, mnemonicHint: "Rope — A coiled rope spiral (like る without the tail). 'Row row row your boat!' The looping stroke is a length of rope coiled on the deck." },
    // W row + N
    { character: "わ", romaji: "wa", displayOrder: 44, mnemonicHint: "Water — A water swirl flowing gently around a stone. 'Wah!' The curved stroke with a loop traces the gentle eddy of flowing water." },
    { character: "を", romaji: "wo", displayOrder: 45, mnemonicHint: "Whoa — Like は (ha) but with an extra stroke showing great effort. 'Whoa — so much work!' This rarely-used particle takes real effort to write." },
    { character: "ん", romaji: "n", displayOrder: 46, mnemonicHint: "Nun — A nun bowing her head in quiet prayer. The curved stroke bends forward like a devout nun with head lowered." },
    // Dakuten G
    { character: "が", romaji: "ga", displayOrder: 47, mnemonicHint: "Garlic — か (ka) with a stinky dakuten mark. The two little ticks are wafts of garlic smell. 'Ga-rlic breath!'" },
    { character: "ぎ", romaji: "gi", displayOrder: 48, mnemonicHint: "Giraffe — き (ki) with a dakuten. The key grew a long giraffe neck. 'A gee-raffe-shaped key!'" },
    { character: "ぐ", romaji: "gu", displayOrder: 49, mnemonicHint: "Gooey — く (ku) with a dakuten. The cuckoo beak got gooey! 'Goo-ey beak!'" },
    { character: "げ", romaji: "ge", displayOrder: 50, mnemonicHint: "Get — け (ke) with a dakuten. 'Geh — get that kettle off the stove!'" },
    { character: "ご", romaji: "go", displayOrder: 51, mnemonicHint: "Go — こ (ko) with a dakuten. The coiled rope got the signal to go! 'Go go go!'" },
    // Z row
    { character: "ざ", romaji: "za", displayOrder: 52, mnemonicHint: "Zany — さ (sa) with a dakuten. The samurai went completely zany! 'Za-ny samurai slash!'" },
    { character: "じ", romaji: "ji", displayOrder: 53, mnemonicHint: "Jiggle — し (shi) with a dakuten. The fishhook started jiggling in the water. 'Ji-ggle it to catch fish!'" },
    { character: "ず", romaji: "zu", displayOrder: 54, mnemonicHint: "Zoo — す (su) with a dakuten. A sushi zoo! 'Zu-u full of sushi animals!'" },
    { character: "ぜ", romaji: "ze", displayOrder: 55, mnemonicHint: "Zebra — せ (se) with a dakuten. The table has zebra stripes! 'Ze-bra table!'" },
    { character: "ぞ", romaji: "zo", displayOrder: 56, mnemonicHint: "Zoo kick — そ (so) with a dakuten. A zoo animal kicking its legs. 'Zo-o animal kick!'" },
    // D row
    { character: "だ", romaji: "da", displayOrder: 57, mnemonicHint: "Dad — た (ta) with a dakuten. 'Da-d built this table!' The table got a dad upgrade with two extra marks." },
    { character: "ぢ", romaji: "ji2", displayOrder: 58, mnemonicHint: "Jeeze — ち (chi) with a dakuten. This rare character makes you say 'Jee-ze!' It's almost never used in modern Japanese." },
    { character: "づ", romaji: "zu2", displayOrder: 59, mnemonicHint: "Buzz — つ (tsu) with a dakuten. The tsunami wave started buzzing! 'Zu-zu-zum, hear the buzz!'" },
    { character: "で", romaji: "de", displayOrder: 60, mnemonicHint: "Deck — て (te) with a dakuten. A teacup sitting on a deck. 'De-ck party with tea!'" },
    { character: "ど", romaji: "do", displayOrder: 61, mnemonicHint: "Do — と (to) with a dakuten. The toe taps to the beat! 'Do re mi... do!' Tap your toe in rhythm." },
    // B row
    { character: "ば", romaji: "ba", displayOrder: 62, mnemonicHint: "Bah — は (ha) with a dakuten. The laughter turned into a 'Bah!' 'Ba-h! Ha turned bad!'" },
    { character: "び", romaji: "bi", displayOrder: 63, mnemonicHint: "Bee — ひ (hi) with a dakuten. A bee perched on the high heel! 'Bee on the heel — buzz!'" },
    { character: "ぶ", romaji: "bu", displayOrder: 64, mnemonicHint: "Bull — ふ (fu) with a dakuten. The funny face became a charging bull! 'Bu-ll charge!'" },
    { character: "べ", romaji: "be", displayOrder: 65, mnemonicHint: "Be — へ (he) with a dakuten. The heap became a mountain! 'Be a big heap!'" },
    { character: "ぼ", romaji: "bo", displayOrder: 66, mnemonicHint: "Bo — ほ (ho) with a dakuten. Santa changed his tune! 'Bo-ho-ho!'" },
    // P row
    { character: "ぱ", romaji: "pa", displayOrder: 67, mnemonicHint: "Pa — は (ha) with a handakuten circle. The little circle is a bubble that popped! 'Pa — pop! Pa came home!'" },
    { character: "ぴ", romaji: "pi", displayOrder: 68, mnemonicHint: "Pi — ひ (hi) with a handakuten circle. A bubble floating above the heel. 'Pi in the sky!'" },
    { character: "ぷ", romaji: "pu", displayOrder: 69, mnemonicHint: "Puff — ふ (fu) with a handakuten circle. A puff of air from the funny face. 'Pu-ff!' Blow out the candle." },
    { character: "ぺ", romaji: "pe", displayOrder: 70, mnemonicHint: "Pea — へ (he) with a handakuten circle. A pea rolling down the hill! 'Pe-a rolling pe-rfectly!'" },
    { character: "ぽ", romaji: "po", displayOrder: 71, mnemonicHint: "Pop — ほ (ho) with a handakuten circle. A bubble popping next to Santa's belly! 'Po-p goes Santa!'" },
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
    { character: "ア", romaji: "a", displayOrder: 1, mnemonicHint: "Angled A — Like a capital letter A that has been tilted sideways. 'Ah!' Imagine an A leaning back lazily in a chair." },
    { character: "イ", romaji: "i", displayOrder: 2, mnemonicHint: "Eeling over — A person leaning dramatically with a line keeping them up. 'Ee!' Picture someone saying 'ee!' as they tip sideways." },
    { character: "ウ", romaji: "u", displayOrder: 3, mnemonicHint: "U with a hat — A U shape wearing a little hat on top. 'Oo!' Put your hat on and say 'oooh!' The dot is the hat, the U is the face." },
    { character: "エ", romaji: "e", displayOrder: 4, mnemonicHint: "Elevator — Like the capital letter H with one arm removed, leaving an elevator shaft. 'Eh — the elevator!' Ride it up and down." },
    { character: "オ", romaji: "o", displayOrder: 5, mnemonicHint: "Oh! A crossword — Like a plus sign with an extra stroke. 'Oh! A crossword puzzle!' The crossed lines look like a crossword grid." },
    { character: "カ", romaji: "ka", displayOrder: 6, mnemonicHint: "Canoe paddle — A paddle blade with a handle. 'Ka-noe!' Picture yourself paddling a canoe — the two strokes are the blade and handle." },
    { character: "キ", romaji: "ki", displayOrder: 7, mnemonicHint: "Kite frame — Multiple crossing lines like a kite's structural frame. 'Kee-te flying!' Imagine the bamboo skeleton of a kite soaring above." },
    { character: "ク", romaji: "ku", displayOrder: 8, mnemonicHint: "Cool angle — Like an angle bracket '>'. 'Coo-l corner!' A sharp, cool geometric angle pointing to the right." },
    { character: "ケ", romaji: "ke", displayOrder: 9, mnemonicHint: "Key prongs — A key without a ring, just the serrated prongs. 'Ke-y teeth!' Picture just the cutting part of a house key." },
    { character: "コ", romaji: "ko", displayOrder: 10, mnemonicHint: "Corner — A right-angle bracket like a sharp corner. 'Ko-rner!' Two lines meeting at a right angle, like the corner of a room." },
    { character: "サ", romaji: "sa", displayOrder: 11, mnemonicHint: "Samurai cap — Three strokes like the outline of a samurai's helmet. 'Sa-murai!' The crossed top strokes are the helmet's crest." },
    { character: "シ", romaji: "shi", displayOrder: 12, mnemonicHint: "She-dot-dot — Three dots arranged like ': /' tilted sideways. 'Shee!' Three shining drops of water sliding down a surface." },
    { character: "ス", romaji: "su", displayOrder: 13, mnemonicHint: "Subway swirl — Like a backwards question mark going underground. 'Su-bway!' The curved stroke dips underground like subway tracks." },
    { character: "セ", romaji: "se", displayOrder: 14, mnemonicHint: "Set square — A cross with a swooping base, like a drafter's set square tool. 'Se-t square!' Picture an architectural drafting tool." },
    { character: "ソ", romaji: "so", displayOrder: 15, mnemonicHint: "Swooping bird — Two strokes like a bird diving from above. 'So-ar!' Picture a hawk swooping down, two wings cutting through air." },
    { character: "タ", romaji: "ta", displayOrder: 16, mnemonicHint: "Talon — Like a bird's curved talon gripping a branch. 'Ta-lon!' The hooked stroke is the sharp claw, the crossing line is the branch." },
    { character: "チ", romaji: "chi", displayOrder: 17, mnemonicHint: "Cheerleader — Arms raised in a victory cheer. 'Chee-r!' The top strokes are raised pompom arms, the bottom is the cheerleader's feet." },
    { character: "ツ", romaji: "tsu", displayOrder: 18, mnemonicHint: "Tsunami dots — Like シ (shi) rotated sideways with three dots in a row. 'Tsu-nami!' Both シ and ツ are waves — one horizontal, one vertical." },
    { character: "テ", romaji: "te", displayOrder: 19, mnemonicHint: "Telephone pole — A cross with a long antenna on top. 'Te-lephone!' Picture a telephone pole with wires strung across the top." },
    { character: "ト", romaji: "to", displayOrder: 20, mnemonicHint: "Totem pole — A vertical post with a notch or wing cut into it. 'To-tem!' A totem pole carved with a single outstretched wing." },
    { character: "ナ", romaji: "na", displayOrder: 21, mnemonicHint: "Nail — A cross with a downward stroke, like hammering a nail. 'Na-il!' The horizontal line is the hammer blow, the vertical line is the nail." },
    { character: "ニ", romaji: "ni", displayOrder: 22, mnemonicHint: "Knees — Two horizontal lines like two bent knees seen from the front. 'Knee! Knee!' Picture two parallel kneecaps side by side." },
    { character: "ヌ", romaji: "nu", displayOrder: 23, mnemonicHint: "Nudge — Two crossing strokes like elbowing someone. 'Nu-dge!' The crossing lines are two people's elbows making contact." },
    { character: "ネ", romaji: "ne", displayOrder: 24, mnemonicHint: "Necktie — Looks like a necktie hanging down with a knot at top. 'Ne-cktie!' The shape traces from the Windsor knot down to the pointed tip." },
    { character: "ノ", romaji: "no", displayOrder: 25, mnemonicHint: "No slash — A single diagonal slash, a firm decisive no. 'No!' Like a red line drawn through something to cancel it." },
    { character: "ハ", romaji: "ha", displayOrder: 26, mnemonicHint: "Happy legs — Two legs spread apart in a happy, open stance. 'Ha-ppy!' Picture someone landing with their legs spread wide, arms up in joy." },
    { character: "ヒ", romaji: "hi", displayOrder: 27, mnemonicHint: "Heel — Like a backwards F — a foot with a heel jutting back. 'Hi-gh heel!' Picture the side view of a shoe with a tall heel." },
    { character: "フ", romaji: "fu", displayOrder: 28, mnemonicHint: "Funny hook — Like a shepherd's crook or a funny-shaped hook. 'Fu-nny hook!' A curved hook with a flat top, like a shepherd tending sheep." },
    { character: "ヘ", romaji: "he", displayOrder: 29, mnemonicHint: "Heap — A small mountain peak — a gentle heap of earth. 'He-ap!' The single peaked stroke rises and falls like a small hill." },
    { character: "ホ", romaji: "ho", displayOrder: 30, mnemonicHint: "Holy cross — A cross shape with a base. 'Ho-ly!' Picture a cross in a snowy field during the holidays. 'Ho ho ho!'" },
    { character: "マ", romaji: "ma", displayOrder: 31, mnemonicHint: "Mark — Like a checkmark with a hook. 'Ma-rk!' Make your mark! The angled stroke is a swooping checkmark of approval." },
    { character: "ミ", romaji: "mi", displayOrder: 32, mnemonicHint: "Me me me — Three horizontal lines like a musical staff. 'Me me me!' Picture a singer rehearsing scales: 'me me me!'" },
    { character: "ム", romaji: "mu", displayOrder: 33, mnemonicHint: "Moo — Like a cow's lower face — a chin and nose seen from the front. 'Moo!' The shape is the outline of a cow's snout." },
    { character: "メ", romaji: "me", displayOrder: 34, mnemonicHint: "Meeting X — An X mark where two paths meet. 'Me-eting point!' Two lines crossing like roads intersecting at an X." },
    { character: "モ", romaji: "mo", displayOrder: 35, mnemonicHint: "More lines — Three horizontal lines with a hook wanting more. 'Mo-re!' Like a musical staff with an extra note asking for an encore." },
    { character: "ヤ", romaji: "ya", displayOrder: 36, mnemonicHint: "Yacht sail — Like the sail of a small yacht. 'Yah, let's sail!' The angled stroke is a sail billowing in the wind." },
    { character: "ユ", romaji: "yu", displayOrder: 37, mnemonicHint: "Yummy bowl — Like a square bowl with a base — a ramen bowl seen from the side. 'Yoo-mm-y!' Picture a steaming bowl of noodles." },
    { character: "ヨ", romaji: "yo", displayOrder: 38, mnemonicHint: "Yo backwards E — Like a capital E facing the wrong way. 'Yo — flip that E!' Imagine someone yelling 'Yo!' and flipping the letter E around." },
    { character: "ラ", romaji: "ra", displayOrder: 39, mnemonicHint: "Ramp — Like a leaning pillar with a notch — a skate ramp from the side. 'Ra-mp!' Picture a skateboard ramp with a flat top platform." },
    { character: "リ", romaji: "ri", displayOrder: 40, mnemonicHint: "Reeds — Two vertical strokes standing tall like reeds. 'Ree-ds!' Picture two bamboo reeds growing upright by a peaceful stream." },
    { character: "ル", romaji: "ru", displayOrder: 41, mnemonicHint: "Rule — Like a ruler or set square with a diagonal. 'Ru-le!' A carpenter's square lying flat, used to draw perfectly straight lines." },
    { character: "レ", romaji: "re", displayOrder: 42, mnemonicHint: "Reveal — A simple angle stroke, like a curtain being swept aside. 'Reh-veal!' One decisive stroke unveiling what was hidden." },
    { character: "ロ", romaji: "ro", displayOrder: 43, mnemonicHint: "Room — A perfect square — a room seen from above. 'Ro-om!' Imagine looking down at a bare square room from a bird's-eye view." },
    { character: "ワ", romaji: "wa", displayOrder: 44, mnemonicHint: "Water drop — Like a water droplet falling. 'Wa-ter!' The curved top is the rounded head of a drop, the point is where it falls." },
    { character: "ヲ", romaji: "wo", displayOrder: 45, mnemonicHint: "Work hard — Like ロ (room) but with extra effort strokes added. 'Wo-rk!' This rare particle shows extra dedication — more strokes, more work." },
    { character: "ン", romaji: "n", displayOrder: 46, mnemonicHint: "Night check — An upward checkmark, like checking something off at night. 'N for night!' Different from ソ (so) — this one tilts up, like raising your hand." },
    { character: "ガ", romaji: "ga", displayOrder: 47, mnemonicHint: "Garlic カ — カ (ka) with a stinky dakuten. Two tiny marks are wafts of garlic aroma floating off the paddle. 'Ga-rlic canoe!'" },
    { character: "ギ", romaji: "gi", displayOrder: 48, mnemonicHint: "Giant kite — キ (ki) with a dakuten. The kite grew giant and voiced! 'Gi-ant kee-te flying high!'" },
    { character: "グ", romaji: "gu", displayOrder: 49, mnemonicHint: "Gooey angle — ク (ku) with a dakuten. The cool angle got all gooey! 'Goo-ey corner!'" },
    { character: "ゲ", romaji: "ge", displayOrder: 50, mnemonicHint: "Get the key — ケ (ke) with a dakuten. 'Geh — get those key prongs!' The marks are urgent signals to grab the key." },
    { character: "ゴ", romaji: "go", displayOrder: 51, mnemonicHint: "Go around the corner — コ (ko) with a dakuten. 'Go! Turn the corner now!'" },
    { character: "ザ", romaji: "za", displayOrder: 52, mnemonicHint: "Zany samurai — サ (sa) with a dakuten. The samurai went zany! 'Za-ny helmet warrior!'" },
    { character: "ジ", romaji: "ji", displayOrder: 53, mnemonicHint: "Jingly dots — シ (shi) with a dakuten. The three dots started jingling! 'Ji-ngle jingle!'" },
    { character: "ズ", romaji: "zu", displayOrder: 54, mnemonicHint: "Zoo underground — ス (su) with a dakuten. The subway became a zoo! 'Zu-oo underground!'" },
    { character: "ゼ", romaji: "ze", displayOrder: 55, mnemonicHint: "Zebra square — セ (se) with a dakuten. The set square has zebra stripes! 'Ze-bra lines!'" },
    { character: "ゾ", romaji: "zo", displayOrder: 56, mnemonicHint: "Zooming bird — ソ (so) with a dakuten. The diving bird zooms even faster! 'Zo-om!'" },
    { character: "ダ", romaji: "da", displayOrder: 57, mnemonicHint: "Dad's talon — タ (ta) with a dakuten. 'Da-d grabbed it with his talon!'" },
    { character: "デ", romaji: "de", displayOrder: 58, mnemonicHint: "Decorated pole — テ (te) with a dakuten. The telephone pole got decorated! 'De-corated te-lephone!'" },
    { character: "ド", romaji: "do", displayOrder: 59, mnemonicHint: "Door of the totem — ト (to) with a dakuten. 'Do-or in the totem pole!' A door cut into the totem." },
    { character: "バ", romaji: "ba", displayOrder: 60, mnemonicHint: "Bang — ハ (ha) with a dakuten. The happy legs got a bang! 'Ba-ng! Happy legs explode!'" },
    { character: "ビ", romaji: "bi", displayOrder: 61, mnemonicHint: "Bee on the heel — ヒ (hi) with a dakuten. A bee stung the high heel! 'Bi-te! Bee!'" },
    { character: "ブ", romaji: "bu", displayOrder: 62, mnemonicHint: "Bull hook — フ (fu) with a dakuten. The funny hook became a bull's horn! 'Bu-ll charge!'" },
    { character: "ベ", romaji: "be", displayOrder: 63, mnemonicHint: "Big heap — ヘ (he) with a dakuten. The heap grew bigger! 'Be a big heap!'" },
    { character: "ボ", romaji: "bo", displayOrder: 64, mnemonicHint: "Bold cross — ホ (ho) with a dakuten. The holy cross got bold! 'Bo-ld and holy!'" },
    { character: "パ", romaji: "pa", displayOrder: 65, mnemonicHint: "Pa pop — ハ (ha) with a handakuten circle. The little circle is a soap bubble that goes pop! 'Pa — pop! Pa came home!'" },
    { character: "ピ", romaji: "pi", displayOrder: 66, mnemonicHint: "Pi bubble — ヒ (hi) with a handakuten circle. A bubble floating above the heel like a pi symbol. 'Pi in the sky!'" },
    { character: "プ", romaji: "pu", displayOrder: 67, mnemonicHint: "Puff hook — フ (fu) with a handakuten circle. A puff of air blowing out of the funny hook. 'Pu-ff!'" },
    { character: "ペ", romaji: "pe", displayOrder: 68, mnemonicHint: "Pea on the peak — ヘ (he) with a handakuten circle. A little pea balancing on top of the mountain peak. 'Pe-a on top!'" },
    { character: "ポ", romaji: "po", displayOrder: 69, mnemonicHint: "Pop the cross — ホ (ho) with a handakuten circle. A bubble popping next to the holy cross. 'Po-p goes the bubble!'" },
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
