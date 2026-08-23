// Text-to-speech helpers shared by the lesson and practice screens.
//
// Browser TTS engines guess a reading from kanji, and a bare kanji gives them
// nothing to guess from: 薬 comes out as "hyaku" (百) instead of "kusuri" in
// several Android voices. Every play button routes its text through here so the
// utterance is built from the kana reading, which is unambiguous.

import { isSilentNow } from "./silent-mode";

export interface SpeechContent {
  character?: string;
  kana?: string;
  japanese?: string;
  onyomi?: string[];
  kunyomi?: string[];
}

// Kunyomi in the dataset carry okurigana markers ("-び", "ほ-", "た.べる").
// They belong on screen but would be read aloud as punctuation.
function stripOkuriganaMarkers(reading: string): string {
  return reading.replace(/[.・-]/g, "").trim();
}

// Readings without a marker stand alone; a marked one is only ever a fragment,
// so it is the last resort.
function pickReading(readings: string[] = []): string {
  const cleaned = readings.map((r) => r ?? "").filter(Boolean);
  const standalone = cleaned.find((r) => r === stripOkuriganaMarkers(r));
  return stripOkuriganaMarkers(standalone ?? cleaned[0] ?? "");
}

// The reading to speak for a single kanji: kunyomi first, since that is how a
// kanji is read on its own, then onyomi. The character itself is never spoken —
// that is the ambiguity this exists to avoid.
export function kanjiSpeechText(content: SpeechContent): string {
  return pickReading(content.kunyomi) || pickReading(content.onyomi) || "";
}

// Prepare any kana string (a kanji reading, a vocabulary reading) for speech.
export function readingSpeechText(kana: string): string {
  return stripOkuriganaMarkers(kana ?? "");
}

// The text to speak for a study item. Kana characters are already unambiguous;
// vocabulary and phrases carry a full kana reading; kanji fall back to a reading.
export function speechText(contentType: string, content: SpeechContent | null | undefined): string {
  if (!content) return "";
  if (contentType === "HIRAGANA" || contentType === "KATAKANA") {
    return content.character ?? "";
  }
  if (contentType === "KANJI") {
    return kanjiSpeechText(content) || content.character || "";
  }
  return readingSpeechText(content.kana ?? "") || content.japanese || "";
}

// Pick Japanese voices once, with variety across gender/accent.
// Speech synthesis is absent in some Android WebViews and privacy browsers, so
// every access is guarded — this module is evaluated while the route chunk
// loads, and a throw here would take down the whole page rather than just audio.
let _jpVoices: SpeechSynthesisVoice[] = [];

function loadJpVoices() {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  _jpVoices = window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith("ja"));
}

if (typeof window !== "undefined" && window.speechSynthesis) {
  window.speechSynthesis.addEventListener("voiceschanged", loadJpVoices);
  loadJpVoices();
}

// Index advances per speak() call to cycle through available voices
let _voiceIdx = 0;

export function speak(text: string, lang = "ja-JP", rate = 0.85) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  if (!text) return;
  // Silent mode is enforced here rather than at each call site: every play
  // button, autoplay and repeat in the app comes through this function, so one
  // guard covers the ones nobody remembered to think about.
  if (isSilentNow()) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = rate;
  if (_jpVoices.length > 0) {
    // Cycle through available Japanese voices for variety
    u.voice = _jpVoices[_voiceIdx % _jpVoices.length];
    _voiceIdx++;
  }
  window.speechSynthesis.speak(u);
}

/* ---------------------------------------------------------------------------
   Two-speaker playback.
   ---------------------------------------------------------------------------
   A dialogue is only followable if you can hear which side is talking, so the
   two roles are pinned to different voices rather than cycled like `speak`
   does. Where the device has two or more Japanese voices installed they get one
   each; where it has one (or none, and the engine falls back), they are pulled
   apart by pitch instead — a difference the ear reads as two people even when
   the timbre is identical.
   --------------------------------------------------------------------------- */

export type DialogueRole = "you" | "them";

const ROLE_PITCH: Record<DialogueRole, number> = { you: 0.92, them: 1.12 };

/**
 * Roughly how long a line will take to say, in milliseconds.
 *
 * Used two ways, both of which need it to err long rather than short: as the
 * pacing when nothing is actually speaking (silent mode, a device with no
 * synthesis), and as the watchdog behind a real utterance — `onend` is not
 * reliably delivered by every engine, and a dialogue that waits forever on an
 * event that never arrives looks like a crash.
 */
export function estimateSpeechMs(text: string, rate = 0.85): number {
  const chars = readingSpeechText(text).replace(/[、。！？\s]/g, "").length;
  return Math.max(1200, Math.round((chars * 190) / Math.max(0.3, rate)) + 550);
}

/**
 * Speak one line as one of two speakers.
 *
 * Returns `true` when an utterance was actually handed to the engine, so the
 * caller knows whether `onEnd` is coming. It returns `false` while muted or
 * without speech support — playback then has to run on `estimateSpeechMs`
 * instead, which is what keeps a dialogue watchable with the sound off.
 *
 * Deliberately does NOT call `cancel()` the way `speak` does: the caller owns
 * the sequence and cancels once when it stops, and cancelling here would race
 * with the queue on engines that report `onend` asynchronously.
 */
export function speakAs(
  text: string,
  role: DialogueRole,
  { rate = 0.85, onEnd }: { rate?: number; onEnd?: () => void } = {}
): boolean {
  if (typeof window === "undefined" || !window.speechSynthesis) return false;
  if (!text) return false;
  if (isSilentNow()) return false;

  const u = new SpeechSynthesisUtterance(text);
  u.lang = "ja-JP";
  u.rate = rate;
  u.pitch = ROLE_PITCH[role];

  if (_jpVoices.length > 1) {
    // Two voices, one per side. Index 0/1 rather than anything cleverer: the
    // list order is stable within a session, so a speaker keeps their voice
    // for the whole scene.
    u.voice = _jpVoices[role === "you" ? 0 : 1];
  } else if (_jpVoices.length === 1) {
    u.voice = _jpVoices[0];
  }

  // Fired for both outcomes: an engine that errors mid-line must not strand
  // the sequence on a line that has stopped making noise.
  if (onEnd) {
    u.onend = () => onEnd();
    u.onerror = () => onEnd();
  }

  window.speechSynthesis.speak(u);
  return true;
}

/** Stops anything this module has queued. */
export function stopSpeaking() {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
}
