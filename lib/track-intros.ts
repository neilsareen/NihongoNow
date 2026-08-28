import { SCRIPT_INTROS } from "./script-intros";

/**
 * Track introductions.
 *
 * The dashboard's track rows are the other way into content, and until now
 * tapping one dropped the learner straight into a stack of flashcards with no
 * word about what they were looking at. A beginner who taps Katakana before a
 * lesson has ever mentioned it deserves the same explanation the lesson would
 * have given them — so each track gets a one-time card, shown the first time
 * it is opened and never again.
 *
 * The "what is this?" paragraph is the same text the in-lesson script intro
 * uses, deliberately: there should be one canonical explanation of hiragana in
 * the app, not two that drift apart. What is added here is what the track
 * itself does — how it fills up, what a card looks like, what to do with it.
 */

export type TrackIntroKey =
  | "HIRAGANA"
  | "KATAKANA"
  | "KANJI"
  | "VOCABULARY"
  | "PHRASE"
  | "CONVERSATION"
  | "NUMBERS";

export interface TrackIntro {
  key: TrackIntroKey;
  /** The track's name, as the dashboard row says it. */
  label: string;
  glyph: string;
  /** The hue this track owns everywhere in the app. */
  tone: string;
  kicker: string;
  title: string;
  /** Paragraphs. The first answers "what is this?", the second "what happens here?". */
  body: string[];
  /** Short, concrete notes on how the drill actually behaves. */
  points: { label: string; text: string }[];
  /** Label on the button that starts the drill. */
  cta: string;
}

export const TRACK_INTROS: Record<TrackIntroKey, TrackIntro> = {
  HIRAGANA: {
    key: "HIRAGANA",
    label: "Hiragana",
    glyph: "あ",
    tone: "var(--track-hiragana)",
    kicker: "Before you begin",
    title: "What is Hiragana?",
    body: [
      SCRIPT_INTROS.hiragana.body,
      "This track holds all 71: the 46 basic characters, plus the ones built from them with sound marks (が ga, ぱ pa) and the small-ya combinations (きゃ kya). It is the foundation everything else waits on — kanji, words and phrases only unlock once you can read the kana inside them.",
    ],
    points: [
      { label: "Each card", text: "One character on its own. Say its sound out loud, then reveal and check yourself." },
      { label: "Getting it wrong", text: "Costs nothing. A missed card slides back into the stack a few later, so you meet it again while it still stings." },
      { label: "It counts", text: "Drilling here feeds the same review schedule your lessons use — this is real progress, not a warm-up." },
    ],
    cta: "Start drilling hiragana",
  },
  KATAKANA: {
    key: "KATAKANA",
    label: "Katakana",
    glyph: "ア",
    tone: "var(--track-katakana)",
    kicker: "Before you begin",
    title: "What is Katakana?",
    body: [
      SCRIPT_INTROS.katakana.body,
      "All 69 are here, sound marks and combinations included. Because the sounds are ones you already know, the whole job is the shapes — and they come quickly.",
    ],
    points: [
      { label: "The tricky ones", text: "シ shi against ツ tsu, ソ so against ン n. They differ by stroke angle alone, so slow down on those four." },
      { label: "Worth the effort", text: "Menus, station signs and half of what a traveller needs to read are katakana. It pays off faster on the ground than anything else you will drill." },
      { label: "It counts", text: "Every answer feeds the same review schedule your lessons use." },
    ],
    cta: "Start drilling katakana",
  },
  KANJI: {
    key: "KANJI",
    label: "Kanji",
    glyph: "漢",
    tone: "var(--track-kanji)",
    kicker: "Before you begin",
    title: "What is Kanji?",
    body: [SCRIPT_INTROS.kanji.body],
    points: [
      { label: "It fills up as you go", text: "Only kanji whose reading you can already sound out appear here, so the track grows with your kana rather than dropping the whole corpus on you. If it looks thin today, that is the gate doing its job." },
      { label: "Each card", text: "The character, what it means, the reading to learn now, and an example word or two once you reveal it." },
      { label: "You set the ceiling", text: "Kanji is banded — essential signage, numbers and transport first, then intermediate and advanced only if you want them. The band you pick is a hard filter: lessons and drills serve nothing beyond it." },
    ],
    cta: "Start drilling kanji",
  },
  VOCABULARY: {
    key: "VOCABULARY",
    label: "Vocabulary",
    glyph: "語",
    tone: "var(--track-vocab)",
    kicker: "Before you begin",
    title: "Real Words You Can Read",
    body: [SCRIPT_INTROS.vocabulary.body],
    points: [
      { label: "It grows with you", text: "A word joins the track the moment every kana in its reading is mastered, so it starts nearly empty and fills up on its own." },
      { label: "Each card", text: "Reveal, then be honest about whether you actually knew it. Guessing right is not the same as knowing." },
      { label: "Hear it back", text: "Reveal a word and the model reading is one tap away — the fastest way to catch a vowel you have been lengthening wrongly." },
    ],
    cta: "Start drilling vocabulary",
  },
  PHRASE: {
    key: "PHRASE",
    label: "Phrases",
    glyph: "話",
    tone: "var(--track-phrase)",
    kicker: "Before you begin",
    title: "Phrases You'll Actually Use",
    body: [
      SCRIPT_INTROS.phrases.body,
      "The gate is the same as vocabulary's: a phrase appears here once you can read every kana in it, so this track fills up as your reading does.",
    ],
    points: [
      { label: "Say them out loud", text: "A phrase you can only recognise is not one you can produce at a counter with someone waiting on you." },
      { label: "Each card", text: "The line as it is really written, its reading, and what it means. Reveal, then judge yourself honestly." },
      { label: "It counts", text: "Drilling here feeds the same review schedule your lessons use, so a phrase you clear now comes back just as it is about to slip." },
    ],
    cta: "Start drilling phrases",
  },
  NUMBERS: {
    key: "NUMBERS",
    label: "Numbers & money",
    glyph: "円",
    tone: "var(--track-numbers)",
    kicker: "Before you begin",
    title: "Numbers & Money: The Part You Can't Mime",
    body: [SCRIPT_INTROS.numbers.body],
    points: [
      { label: "Two ways to answer", text: "Some cards hand you four readings to choose between; on the rest you say it yourself, then reveal. Both are asking whether you can produce the number, not just recognise it." },
      { label: "Each card", text: "The figure as it is actually printed, how it reads, one line to use at the counter, and what comes back at you." },
      { label: "It counts", text: "Drilling here feeds the same review schedule your lessons use, so the figures you fumble are the ones that come back soonest." },
    ],
    cta: "Start drilling numbers",
  },
  CONVERSATION: {
    key: "CONVERSATION",
    label: "Conversation",
    glyph: "会",
    tone: "var(--track-conversation)",
    kicker: "Before you begin",
    title: "Conversation: Getting Through the Day",
    body: [
      "This is where recognition turns into being understood. Every line in the track is written in kana you can already read, so the work is no longer decoding — it is having the right thing ready while someone waits for an answer.",
      "Each card teaches one whole chunk rather than words to assemble under pressure, because that is how fluent speakers actually talk: in ready-made pieces. Politeness beats precision every time — すみません and おねがいします, said warmly, will carry you further than perfect grammar.",
    ],
    points: [
      { label: "The situation first", text: "Each card drops you into a real moment — a konbini counter, a taxi, a platform — and asks what you would say." },
      { label: "Two ways to answer", text: "Some cards offer four lines to choose between; on the rest you produce it yourself, then reveal. Being handed options every time would never make you say anything." },
      { label: "Then the reply", text: "You are shown what comes back at you too, because the half of a conversation that strands travellers is never their own line." },
      { label: "Swap words in", text: "Keep the pattern underneath, change the noun. That is how one rehearsed line covers a dozen situations." },
    ],
    cta: "Start rehearsing",
  },
};

export function getTrackIntro(key: string | null | undefined): TrackIntro | null {
  if (!key) return null;
  return TRACK_INTROS[key.toUpperCase() as TrackIntroKey] ?? null;
}

// ---------------------------------------------------------------------------
// "Seen" state
// ---------------------------------------------------------------------------

/**
 * Kept in localStorage rather than on the learner's row: this is a one-time
 * nicety, not progress, and it is not worth a schema migration or a write on
 * the way into a drill.
 *
 * The scope keeps the beginner simulation honest. A simulator's sandbox
 * learner is meant to see the app exactly as a day-one account would, so its
 * intros are stored under their own key and reappear the moment simulation is
 * switched on — the real account's dismissals do not leak into it, or the
 * other way round.
 */
export type TrackIntroScope = "self" | "sim";

const STORAGE_PREFIX = "nn:track-intro:";

function storageKey(key: TrackIntroKey, scope: TrackIntroScope): string {
  return `${STORAGE_PREFIX}${scope}:${key}`;
}

export function hasSeenTrackIntro(key: TrackIntroKey, scope: TrackIntroScope): boolean {
  // localStorage throws outright in some privacy modes; an unreadable store
  // just means the intro is shown, which is the safe way to be wrong.
  try {
    return window.localStorage.getItem(storageKey(key, scope)) === "1";
  } catch {
    return false;
  }
}

export function markTrackIntroSeen(key: TrackIntroKey, scope: TrackIntroScope): void {
  try {
    window.localStorage.setItem(storageKey(key, scope), "1");
  } catch {
    // Nothing to do — the intro will simply be offered again next time.
  }
}

/** Forgets every dismissal in one scope, so its intros are offered again. */
export function clearSeenTrackIntros(scope: TrackIntroScope): void {
  try {
    for (const key of Object.keys(TRACK_INTROS) as TrackIntroKey[]) {
      window.localStorage.removeItem(storageKey(key, scope));
    }
  } catch {
    // As above.
  }
}
