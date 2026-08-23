/* ===========================================================================
   Pre-rendered audio manifest.
   ---------------------------------------------------------------------------
   Device speech synthesis is the least predictable thing this app depends on.
   On iOS it is good; on Android the Japanese voice data is frequently not
   installed at all, in which case the engine accepts an utterance, makes no
   sound, and reports success. In a WKWebView (i.e. anything wrapped with
   Capacitor) it has historically been silent outright.

   So the reliable path is not to synthesise at run time but to ship the audio.
   The corpus is small enough for that to be realistic — the whole conversation
   and dialogue set is ~127 distinct readings — and a shipped clip is identical
   on every device, works offline, and cannot be defeated by a missing voice.

   Clips are looked up by the reading string itself rather than by a hash of
   it. The obvious alternative — hash in the generator, hash again in the
   browser — needs the same hash function implemented twice in two languages
   and staying identical forever; the day they drift, every lookup silently
   misses and the app quietly falls back to synthesis with no error anywhere.
   A generated map costs a few KB and cannot drift.

   The map is fetched rather than bundled so it stays off the JS payload as the
   corpus grows: 127 entries is nothing, 4,000 would not be.
   =========================================================================== */

export interface AudioManifest {
  version: number;
  /** File extension the clips were rendered to. */
  format: string;
  /** Which voice rendered them, for the record. */
  voice?: string;
  /** Reading (as `speechText` produces it) → filename within /audio/ja/. */
  clips: Record<string, string>;
}

const EMPTY: AudioManifest = { version: 0, format: "none", clips: {} };

const MANIFEST_URL = "/audio/manifest.json";

let manifest: AudioManifest | null = null;
let inFlight: Promise<AudioManifest> | null = null;

/**
 * Starts loading the manifest if it hasn't been. Safe to call repeatedly.
 *
 * A failure resolves to an empty manifest rather than rejecting, and is not
 * retried: with no clips every caller falls through to synthesis, which is
 * exactly the behaviour the app had before any of this existed.
 */
export function loadAudioManifest(): Promise<AudioManifest> {
  if (manifest) return Promise.resolve(manifest);
  if (inFlight) return inFlight;
  if (typeof window === "undefined") return Promise.resolve(EMPTY);

  inFlight = fetch(MANIFEST_URL)
    .then((r) => (r.ok ? r.json() : EMPTY))
    .then((m: AudioManifest) => {
      manifest = m && typeof m === "object" && m.clips ? m : EMPTY;
      return manifest;
    })
    .catch(() => {
      manifest = EMPTY;
      return manifest;
    });

  return inFlight;
}

/**
 * The clip URL for a reading, or null.
 *
 * Synchronous and non-blocking on purpose: it answers from whatever is already
 * loaded. Before the manifest arrives every reading looks like a miss, which
 * costs the first play of a session its clip and nothing else — far better
 * than making every play button wait on a network round trip.
 */
export function clipUrlFor(reading: string): string | null {
  if (!manifest) return null;
  const file = manifest.clips[reading];
  return file ? `/audio/ja/${file}` : null;
}

/** Whether any clips are available at all — for diagnostics and settings copy. */
export function audioClipCount(): number {
  return manifest ? Object.keys(manifest.clips).length : 0;
}
