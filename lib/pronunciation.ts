// Kana handling and pronunciation scoring for the speaking exercises.
//
// A speaking answer is graded by comparing what the browser's speech
// recogniser heard against the reading we expect. Neither side can be trusted
// to be literal: a ja-JP recogniser hands back the *written* form it thinks it
// heard (say みず and it returns 水), and a learner's accent lands somewhere
// near the target rather than on it. So two comparisons run side by side —
// one on the written form, one on a deliberately blunt phonetic spelling —
// and the better of the two wins.

/** Katakana → hiragana. Okurigana hyphens in the dataset are dropped. */
export function katakanaToHiragana(str: string): string {
  return str
    .replace(/[ァ-ヶ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 96))
    .replace(/-/g, "");
}

const ROMAJI: Record<string, string> = {
  "きゃ":"kya","きゅ":"kyu","きょ":"kyo","しゃ":"sha","しゅ":"shu","しょ":"sho",
  "ちゃ":"cha","ちゅ":"chu","ちょ":"cho","にゃ":"nya","にゅ":"nyu","にょ":"nyo",
  "ひゃ":"hya","ひゅ":"hyu","ひょ":"hyo","みゃ":"mya","みゅ":"myu","みょ":"myo",
  "りゃ":"rya","りゅ":"ryu","りょ":"ryo","ぎゃ":"gya","ぎゅ":"gyu","ぎょ":"gyo",
  "じゃ":"ja","じゅ":"ju","じょ":"jo","びゃ":"bya","びゅ":"byu","びょ":"byo",
  "ぴゃ":"pya","ぴゅ":"pyu","ぴょ":"pyo",
  "あ":"a","い":"i","う":"u","え":"e","お":"o",
  "か":"ka","き":"ki","く":"ku","け":"ke","こ":"ko",
  "さ":"sa","し":"shi","す":"su","せ":"se","そ":"so",
  "た":"ta","ち":"chi","つ":"tsu","て":"te","と":"to",
  "な":"na","に":"ni","ぬ":"nu","ね":"ne","の":"no",
  "は":"ha","ひ":"hi","ふ":"fu","へ":"he","ほ":"ho",
  "ま":"ma","み":"mi","む":"mu","め":"me","も":"mo",
  "や":"ya","ゆ":"yu","よ":"yo",
  "ら":"ra","り":"ri","る":"ru","れ":"re","ろ":"ro",
  "わ":"wa","を":"o","ん":"n",
  "が":"ga","ぎ":"gi","ぐ":"gu","げ":"ge","ご":"go",
  "ざ":"za","じ":"ji","ず":"zu","ぜ":"ze","ぞ":"zo",
  "だ":"da","ぢ":"ji","づ":"zu","で":"de","ど":"do",
  "ば":"ba","び":"bi","ぶ":"bu","べ":"be","ぼ":"bo",
  "ぱ":"pa","ぴ":"pi","ぷ":"pu","ぺ":"pe","ぽ":"po",
};

/** Kana → romaji, for display and as the input to phonetic comparison. */
export function kanaToRomaji(kana: string): string {
  const hira = katakanaToHiragana((kana ?? "").replace(/ー/g, ""));
  let result = "";
  let i = 0;
  while (i < hira.length) {
    if (hira[i] === "っ") {
      // Gemination: the sokuon doubles the consonant that follows it.
      const next = ROMAJI[hira.substring(i + 1, i + 3)] ?? ROMAJI[hira[i + 1]] ?? "";
      result += next[0] ?? "";
      i++;
      continue;
    }
    const two = ROMAJI[hira.substring(i, i + 2)];
    if (two) { result += two; i += 2; continue; }
    result += ROMAJI[hira[i]] ?? hira[i];
    i++;
  }
  return result;
}

// Recognisers punctuate ("水。"), and phrase results come back spaced. None of
// that is part of what was said.
const PUNCTUATION = /[\s　。、．，！？!?…‥・「」『』（）()"'’”､｡,.:;]/g;

/** The written form, stripped to what was actually pronounced. */
function normalizeWritten(text: string | null | undefined): string {
  if (!text) return "";
  return katakanaToHiragana(text.replace(PUNCTUATION, ""));
}

/**
 * A deliberately coarse phonetic spelling. Every distinction that a learner's
 * accent or a recogniser routinely blurs is collapsed, so that "close enough"
 * comes out as an exact match rather than as a handful of edits:
 * shi/si, chi/ti, tsu/tu, ji/zi, fu/hu, l/r, v/b, and vowel length.
 */
function foldPhonetic(romaji: string): string {
  let s = romaji.toLowerCase().replace(/[^a-z]/g, "");
  s = s
    .replace(/sh/g, "s")
    .replace(/ch/g, "t")
    .replace(/ts/g, "t")
    .replace(/j/g, "z")
    .replace(/f/g, "h")
    .replace(/l/g, "r")
    .replace(/v/g, "b");
  // Doubled letters cover both the sokuon (kitte/kite) and long vowels, which
  // English speakers rarely hold and recognisers rarely report.
  s = s.replace(/(.)\1+/g, "$1");
  s = s.replace(/ou/g, "o").replace(/ei/g, "e").replace(/wo/g, "o");
  return s.replace(/(.)\1+/g, "$1");
}

/** Kana (or a stray romaji string) → the folded spelling used for scoring. */
export function toPhonetic(text: string | null | undefined): string {
  if (!text) return "";
  return foldPhonetic(kanaToRomaji(text.replace(PUNCTUATION, "")));
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(
        prev[j] + 1,
        row[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    prev = row;
  }
  return prev[b.length];
}

function similarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const longest = Math.max(a.length, b.length);
  return Math.max(0, 1 - levenshtein(a, b) / longest);
}

export interface SpeechTarget {
  /** The written form on the card — may be kanji. */
  japanese?: string | null;
  /** The kana reading. Authoritative for pronunciation when present. */
  kana?: string | null;
  /** Romaji from the dataset, used when there is no kana reading. */
  romaji?: string | null;
}

export type PronunciationBand = "great" | "close" | "off";

export interface PronunciationGrade {
  /** 0–1. Shown as a percentage, so it needs to be honest at the low end too. */
  score: number;
  passed: boolean;
  band: PronunciationBand;
  /** The alternative that scored best — what we tell the learner we heard. */
  heard: string;
}

/** At or above this, the attempt is close enough to count. */
export const PASS_SCORE = 0.75;
const GREAT_SCORE = 0.92;
/** A score this high came from a match, not a resemblance. */
const CERTAIN_SCORE = 0.95;

/**
 * How many sound errors a word is allowed and still count, by its length.
 * Folding has already absorbed the differences that don't change meaning, so
 * what survives is a genuinely wrong sound — and one wrong sound in a
 * four-letter word is a different word (susu for sushi), while one in a long
 * phrase is an accent. One error per five sounds keeps both of those right.
 */
function allowedErrors(length: number): number {
  return Math.floor(length / 5);
}

function scoreOne(transcript: string, target: SpeechTarget): number {
  const heard = normalizeWritten(transcript);
  if (!heard) return 0;

  const written = normalizeWritten(target.japanese);
  const kana = normalizeWritten(target.kana);
  if (heard === written || heard === kana) return 1;

  // Recognisers pad short answers with particles and interjections ("水です").
  // The reading is in there, which is what was being asked for. A single kana
  // is too common a fragment to accept this way; a single kanji is not.
  for (const form of [written, kana]) {
    const informative = form.length >= 2 || /[^\u3040-\u309f]/.test(form);
    if (form.length >= 1 && informative && heard.includes(form)) return 0.95;
  }

  const expected = expectedPhonetic(target);
  const spoken = toPhonetic(transcript);
  if (!expected) return 0;
  if (spoken === expected) return 1;
  if (expected.length >= 2 && spoken.includes(expected)) return 0.95;

  return similarity(spoken, expected);
}

/** The folded spelling an attempt is measured against. */
function expectedPhonetic(target: SpeechTarget): string {
  return (
    toPhonetic(target.kana) ||
    foldPhonetic(target.romaji ?? "") ||
    toPhonetic(target.japanese)
  );
}

/**
 * Grade one spoken attempt. Recognisers return several alternatives ranked by
 * their own confidence, which is confidence in the Japanese *sentence*, not in
 * the word being drilled — the reading we want is often the second or third
 * guess, so every alternative is scored and the best one stands.
 */
export function gradePronunciation(
  transcripts: string[],
  target: SpeechTarget
): PronunciationGrade {
  const candidates = transcripts.map((t) => t ?? "").filter((t) => t.trim().length > 0);
  if (candidates.length === 0) {
    return { score: 0, passed: false, band: "off", heard: "" };
  }

  let best = { score: 0, heard: candidates[0] };
  for (const candidate of candidates) {
    const score = scoreOne(candidate, target);
    if (score > best.score) best = { score, heard: candidate };
  }

  // A high score already means the written form or the reading was matched
  // outright. Anything below that is a resemblance, and a resemblance only
  // counts while the sounds that differ stay within the word's error budget.
  const expected = expectedPhonetic(target);
  const distance = levenshtein(toPhonetic(best.heard), expected);
  const passed =
    best.score >= CERTAIN_SCORE ||
    (best.score >= PASS_SCORE && distance <= allowedErrors(expected.length));

  return {
    score: best.score,
    passed,
    band: best.score >= GREAT_SCORE ? "great" : best.score >= PASS_SCORE ? "close" : "off",
    heard: best.heard.trim(),
  };
}
