// Text-to-speech helpers shared by the lesson and practice screens.
//
// Browser TTS engines guess a reading from kanji, and a bare kanji gives them
// nothing to guess from: 薬 comes out as "hyaku" (百) instead of "kusuri" in
// several Android voices. Every play button routes its text through here so the
// utterance is built from the kana reading, which is unambiguous.

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
