// Text-to-speech helpers shared by the lesson and practice screens.
//
// Browser TTS engines guess a reading from kanji, and a bare kanji gives them
// nothing to guess from: 薬 comes out as "hyaku" (百) instead of "kusuri" in
// several Android voices. Every play button routes its text through here so the
// utterance is built from the kana reading, which is unambiguous.

import { isSilentNow } from "./silent-mode";
import { clipUrlFor, loadAudioManifest } from "./audio-manifest";

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

/**
 * Play a reading. Fire-and-forget — for play buttons, which have nothing to do
 * with the outcome.
 *
 * Kept at its original signature so the call sites that predate the clip layer
 * did not have to change. It now goes through `playLine` like everything else,
 * so a shipped clip is preferred here too and only the fallback is synthesis.
 */
export function speak(text: string, lang = "ja-JP", rate = 0.85) {
  // `rate` was historically a raw synthesis rate whose neutral value was 0.85;
  // `playLine` speaks in multiples of natural pace instead. Converting here
  // keeps every existing caller sounding exactly as it did.
  void playLine(text, { speed: rate / TTS_BASE_RATE, lang });
}


/* ---------------------------------------------------------------------------
   Playback.
   ---------------------------------------------------------------------------
   One entry point, three possible engines, and a contract the callers can
   actually build on.

   The contract is: `playLine` ALWAYS resolves, never rejects, and never hangs.
   That is the whole point of it. Every engine underneath lies in a different
   way — a synthesis engine with no Japanese voice reports success and makes no
   sound; `onend` is simply never delivered by some Android WebViews; an
   <audio> element can stall forever on a truncated file — so each one gets a
   watchdog here rather than at every call site. What a caller gets back is how
   playback actually went, which is the one thing it needs to pace itself.

   Preferring a shipped clip over synthesis is what makes the app portable: it
   is the same audio on every device, it survives having no voice data
   installed, and it works offline. Synthesis stays as the fallback for
   anything not yet rendered — the 3,500 vocabulary and kanji readings, say,
   while only the conversation corpus has been generated.
   --------------------------------------------------------------------------- */

/** How playback actually went, for callers that pace themselves against it. */
export type PlaybackOutcome =
  | "clip" // a pre-rendered file played to completion — timing is exact
  | "tts" // device synthesis ran; it may or may not have made a sound
  | "silent" // muted by silent mode, deliberately
  | "unsupported"; // nothing on this device could play it

/**
 * The synthesis rate that reads as natural pace. Speeds elsewhere in the app
 * are multiples of this, so `speed: 1` means "normal" whether the line ends up
 * coming from a clip or from the synthesiser.
 */
const TTS_BASE_RATE = 0.85;

export interface PlayOptions {
  /** 1 is natural pace; 0.75 is slower, 1.25 faster. */
  speed?: number;
  /** Which side of a two-person exchange this is, so the voices differ. */
  role?: DialogueRole;
  lang?: string;
}

export type DialogueRole = "you" | "them";

const ROLE_PITCH: Record<DialogueRole, number> = { you: 0.92, them: 1.12 };

/**
 * Roughly how long a line takes to say, in milliseconds, at a given speed.
 *
 * Errs generous on purpose. It is the pacing whenever nothing is audible —
 * silent mode, or a device with no synthesis — where it has to be long enough
 * to read, and it is the watchdog behind everything else, where firing early
 * would cut a line off mid-word.
 */
export function estimateSpeechMs(text: string, speed = 1): number {
  const chars = readingSpeechText(text).replace(/[、。！？\s]/g, "").length;
  return Math.max(1200, Math.round((chars * 224) / Math.max(0.35, speed)) + 550);
}

/* Everything currently making noise, so `stopSpeaking` can end all of it and
   stale callbacks from a cancelled line can be told to shut up. The counter is
   what does the telling: a resolver checks the generation it was created in
   and does nothing if playback has moved on. */
let generation = 0;
let currentAudio: HTMLAudioElement | null = null;

/** Stops anything this module is playing, from either engine. */
export function stopSpeaking() {
  generation++;
  if (typeof window === "undefined") return;
  if (currentAudio) {
    currentAudio.pause();
    // Detaching the source stops a pending network fetch as well as playback.
    currentAudio.removeAttribute("src");
    currentAudio.load();
    currentAudio = null;
  }
  if (window.speechSynthesis) window.speechSynthesis.cancel();
}

/**
 * Warm the clip map.
 *
 * Called once when this module loads, which is the earliest useful moment:
 * every screen that can play audio imports it, and nothing else does. Without
 * this the first play of a session always misses its clip and falls back to
 * synthesis, because the lookup is deliberately synchronous.
 */
export function preloadAudio() {
  void loadAudioManifest();
}

if (typeof window !== "undefined") preloadAudio();

/**
 * Speak one line, resolving when it has finished.
 *
 * Resolves — always. See the contract at the top of this section.
 */
export function playLine(text: string, opts: PlayOptions = {}): Promise<PlaybackOutcome> {
  const { speed = 1, role, lang = "ja-JP" } = opts;

  if (!text) return Promise.resolve("unsupported");
  // Enforced here rather than at each call site: every play button, autoplay
  // and repeat in the app comes through this function, so one guard covers the
  // ones nobody remembered to think about.
  if (isSilentNow()) return Promise.resolve("silent");
  if (typeof window === "undefined") return Promise.resolve("unsupported");

  stopSpeaking();
  const mine = generation;

  const clip = clipUrlFor(readingSpeechText(text));
  if (clip) {
    return playClip(clip, speed, mine).then((outcome) => {
      // A clip that 404s or will not decode leaves the line unheard, which is
      // worse than an imperfect voice — so a failed clip falls through to the
      // device rather than being treated as played. Guarded on the generation
      // so a clip cancelled by the next line does not resurrect itself here.
      if (outcome === "unsupported" && generation === mine && !isSilentNow()) {
        return playSynthesis(text, lang, speed, role);
      }
      return outcome;
    });
  }

  // Nothing rendered for this line yet, so fall back to the device.
  void loadAudioManifest();
  return playSynthesis(text, lang, speed, role);
}

function playClip(url: string, speed: number, mine: number): Promise<PlaybackOutcome> {
  return new Promise((resolve) => {
    let settled = false;
    // Declared before `finish` so there is no window in which clearing it
    // would touch a binding that does not exist yet.
    let watchdog: ReturnType<typeof setTimeout> | undefined;

    const finish = (outcome: PlaybackOutcome) => {
      if (settled) return;
      settled = true;
      if (watchdog !== undefined) clearTimeout(watchdog);
      if (generation === mine) currentAudio = null;
      resolve(outcome);
    };

    const audio = new Audio(url);
    audio.playbackRate = speed;
    currentAudio = audio;

    audio.addEventListener("ended", () => finish("clip"));
    // A missing or undecodable file reports "unsupported", which sends the
    // caller back to synthesis rather than leaving the line silent.
    audio.addEventListener("error", () => finish("unsupported"));

    // Backstop for a stall that never errors. `duration` is unknown until
    // metadata loads, so this starts generous and tightens once it is known.
    watchdog = setTimeout(() => finish("unsupported"), 20_000);
    audio.addEventListener("loadedmetadata", () => {
      if (settled || !Number.isFinite(audio.duration)) return;
      if (watchdog !== undefined) clearTimeout(watchdog);
      watchdog = setTimeout(
        () => finish("clip"),
        (audio.duration * 1000) / Math.max(0.35, speed) + 2000
      );
    });

    audio.play().catch(() => {
      // Autoplay policy, or no codec support. Either way it made no sound.
      finish("unsupported");
    });
  });
}

function playSynthesis(
  text: string,
  lang: string,
  speed: number,
  role: DialogueRole | undefined
): Promise<PlaybackOutcome> {
  if (!window.speechSynthesis) return Promise.resolve("unsupported");

  return new Promise((resolve) => {
    let settled = false;

    // Generous, because it is a backstop and not the pacing: it should only
    // ever fire on an engine that has gone quiet without saying so. Scheduled
    // above `finish` so it can be a const; the timer cannot possibly fire
    // before the next statement has run.
    const watchdog = setTimeout(() => finish("tts"), estimateSpeechMs(text, speed) * 2 + 4000);

    const finish = (outcome: PlaybackOutcome) => {
      if (settled) return;
      settled = true;
      clearTimeout(watchdog);
      resolve(outcome);
    };

    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = TTS_BASE_RATE * speed;

    if (role) {
      // Two speakers need to sound like two people. Where the device has two
      // Japanese voices they get one each; where it has one, pitch alone has
      // to carry the distinction.
      u.pitch = ROLE_PITCH[role];
      if (_jpVoices.length > 1) u.voice = _jpVoices[role === "you" ? 0 : 1];
      else if (_jpVoices.length === 1) u.voice = _jpVoices[0];
    } else if (_jpVoices.length > 0) {
      u.voice = _jpVoices[_voiceIdx % _jpVoices.length];
      _voiceIdx++;
    }

    u.onend = () => finish("tts");
    u.onerror = () => finish("tts");

    window.speechSynthesis.speak(u);
  });
}
