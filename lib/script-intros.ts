export interface ScriptIntro {
  id: string;
  /** Small label above the title. Defaults to "Before you begin". */
  kicker?: string;
  title: string;
  body: string;
}

export type ScriptIntroKey =
  | "welcome"
  | "hiragana"
  | "katakana"
  | "dakuten"
  | "kanji"
  | "vocabulary"
  | "phrases";

// One-time explainer cards. Each is shown the first time a learner is about to
// meet a new script, sound-modifier system, or kind of content — before any
// actual item of that kind appears, so nothing ever arrives unexplained.
export const SCRIPT_INTROS: Record<ScriptIntroKey, ScriptIntro> = {
  welcome: {
    id: "intro-welcome",
    kicker: "Start here",
    title: "Japanese Uses Three Scripts",
    body: "Written Japanese mixes three systems in a single sentence, and each has a job. Hiragana (ひらがな) is the phonetic base — grammar, endings, and native words. Katakana (カタカナ) covers the same sounds with different shapes, used for foreign words and names. Kanji (漢字) are meaning-characters borrowed from Chinese, standing in for whole words so text stays short and scannable. You'll learn them in that order, because each one rests on the last: kana first so you can pronounce anything, then kanji and vocabulary once you can read the sounds they're made of. Nothing is shown to you until you can sound it out.",
  },
  hiragana: {
    id: "intro-hiragana",
    title: "What is Hiragana?",
    body: "Hiragana (ひらがな) is Japan's core phonetic alphabet — 46 basic characters, each representing one sound (a, ka, shi...). It's used for native Japanese words, grammar particles, and verb endings, and every Japanese word can be spelled out in it. That's why it's the first script you'll learn — master these shapes and sounds, and you can read anything phonetically.",
  },
  katakana: {
    id: "intro-katakana",
    title: "What is Katakana?",
    body: "Katakana (カタカナ) is a second alphabet with the exact same sounds as hiragana, just sharper and more angular. It's used mainly for foreign loanwords (コーヒー kōhī = coffee), foreign names, onomatopoeia, and emphasis — similar to how English uses italics. You already know these sounds from hiragana, so this is really just learning new shapes for familiar sounds.",
  },
  dakuten: {
    id: "intro-dakuten",
    title: "Dakuten & Handakuten: Sound Modifiers",
    body: "Small marks added to a character change its sound. The dakuten (゛— two short strokes, nicknamed \"tenten\") voices a consonant: か ka → が ga, さ sa → ざ za, た ta → だ da, は ha → ば ba. The handakuten (゜— a small circle, nicknamed \"maru\") turns an 'h' sound crisp and plosive: は ha → ぱ pa. Same base shapes you already know — just a mark added on top for a new sound.",
  },
  kanji: {
    id: "intro-kanji",
    title: "What is Kanji?",
    body: "Kanji (漢字) are characters that carry meaning rather than sound. 山 means \"mountain\" — you can know what it means before you know how to say it. Most have two kinds of reading: kun'yomi, the native Japanese one used when the character stands alone (山 = やま yama), and on'yomi, the borrowed Chinese-style one used inside compounds (富士山 = ふじさん Fujisan). Don't try to memorise every reading now. Learn the meaning, learn the one reading you're shown, and let the rest arrive with real words. Each kanji here also comes with a mnemonic hint — a small story for the shape, which sticks far better than repetition alone.",
  },
  vocabulary: {
    id: "intro-vocabulary",
    kicker: "Something new",
    title: "Your First Real Words",
    body: "From here on, actual Japanese words start appearing between the characters — and you'll be able to read every one of them, because a word is only offered once you've mastered all the kana in its reading. Each word is shown three ways: the Japanese as it's really written, the kana reading, and the English. Say them out loud. Japanese has a small, steady sound inventory, so pronunciation gets easier fast, and hearing yourself is what moves a word from \"recognised\" to \"usable\".",
  },
  phrases: {
    id: "intro-phrases",
    kicker: "Something new",
    title: "Phrases You'll Actually Use",
    body: "Phrases are whole lines of Japanese tied to a situation — ordering, asking directions, apologising, thanking someone. They're taught as single units rather than word-by-word grammar, because that's how you'll need them at a counter or on a platform: complete and ready. Each phrase names the scenario it belongs to, so you learn where to use it, not just what it means. Politeness matters more than perfection here — a slightly clumsy です-form sentence delivered warmly lands just fine.",
  },
};

export const SCRIPT_INTRO_LIST: ScriptIntro[] = Object.values(SCRIPT_INTROS);
