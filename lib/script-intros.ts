export interface ScriptIntro {
  id: string;
  title: string;
  body: string;
}

// One-time explainer cards shown the first time a learner is about to meet a
// new script or sound-modifier system, before any actual characters appear.
export const SCRIPT_INTROS: Record<"hiragana" | "katakana" | "dakuten", ScriptIntro> = {
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
};

export const SCRIPT_INTRO_LIST: ScriptIntro[] = Object.values(SCRIPT_INTROS);
