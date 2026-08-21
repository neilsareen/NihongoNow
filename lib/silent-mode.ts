/* ===========================================================================
   Silent mode.
   ---------------------------------------------------------------------------
   A learner on a quiet train, in an open-plan office, or beside a sleeping
   baby can still study — but not out loud, and not with the phone talking
   back. Silent mode is a timed mute: for fifteen or thirty minutes no audio
   plays, and the two exercise types that depend on sound are asked a way that
   works in silence instead (see the substitution in the lesson player).

   It expires on its own. Nobody remembers to turn a mute back off, and a
   learner who forgot would silently lose listening and speaking practice for
   weeks — so the window is short and always ends by itself.

   The deadline lives in localStorage rather than on UserProfile, for the same
   reason the theme does: it is a property of where you are sitting right now,
   not of your account, and it has to survive a reload of the lesson you are
   halfway through.
   =========================================================================== */

export const SILENT_STORAGE_KEY = "ikou-silent-until";

/** Windows on offer, in minutes. Short enough that forgetting costs little. */
export const SILENT_DURATIONS = [15, 30] as const;
export type SilentDuration = (typeof SILENT_DURATIONS)[number];

export interface SilentState {
  /** Epoch ms at which sound comes back, or null when it is already on. */
  until: number | null;
}

/** One shared object for "sound is on", so snapshots stay reference-stable. */
const SOUND_ON: SilentState = { until: null };

export function silentMinutesLeft(until: number | null): number {
  if (until === null) return 0;
  return Math.max(0, Math.ceil((until - Date.now()) / 60_000));
}

function readStoredUntil(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SILENT_STORAGE_KEY);
    if (!raw) return null;
    const until = Number(raw);
    // A deadline in the past is over, and a garbled one never started.
    if (!Number.isFinite(until) || until <= Date.now()) return null;
    return until;
  } catch {
    // localStorage throws outright in some privacy modes.
    return null;
  }
}

function writeStoredUntil(until: number | null) {
  if (typeof window === "undefined") return;
  try {
    if (until === null) window.localStorage.removeItem(SILENT_STORAGE_KEY);
    else window.localStorage.setItem(SILENT_STORAGE_KEY, String(until));
  } catch {
    // The choice still holds for this tab.
  }
}

/**
 * Anything already being spoken stops mid-word. Waiting for the utterance to
 * finish would mean the phone talks for another second in a room where it just
 * been told not to — which is the whole reason the button was pressed.
 *
 * Inlined rather than called through lib/speech, which imports this module.
 */
function stopAnySpeech() {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
}

/* --- Store -----------------------------------------------------------------
   Same shape as the theme store: one global value, several writers React
   cannot see (another tab, the clock running out, a phone waking up), and no
   provider to wrap the tree in.
   --------------------------------------------------------------------------- */

let state: SilentState | null = null;
const listeners = new Set<() => void>();
let expiryTimer: ReturnType<typeof setTimeout> | null = null;

function toState(until: number | null): SilentState {
  return until === null ? SOUND_ON : { until };
}

function currentState(): SilentState {
  if (!state) {
    state = toState(readStoredUntil());
    scheduleExpiry(state.until);
  }
  return state;
}

/**
 * Wakes the store when the window runs out. A backgrounded tab may fire this
 * late — `isSilentNow` reads the clock directly for exactly that reason, so a
 * late timer delays the interface catching up, never the sound coming back.
 */
function scheduleExpiry(until: number | null) {
  if (expiryTimer !== null) {
    clearTimeout(expiryTimer);
    expiryTimer = null;
  }
  if (until === null || typeof window === "undefined") return;
  // A beat past the deadline, so the timer never fires a hair early and finds
  // the value still live.
  expiryTimer = setTimeout(() => {
    expiryTimer = null;
    refresh();
  }, Math.max(0, until - Date.now()) + 250);
}

function publish(next: SilentState) {
  if (currentState().until === next.until) return;
  state = next;
  scheduleExpiry(next.until);
  listeners.forEach((listener) => listener());
}

/** Re-derives the deadline from storage (another tab, or a lapsed window). */
function refresh() {
  publish(toState(readStoredUntil()));
}

/** Mute for `minutes` from now. Re-picking a window restarts the clock. */
export function startSilentMode(minutes: number) {
  const until = Date.now() + Math.max(1, minutes) * 60_000;
  writeStoredUntil(until);
  stopAnySpeech();
  publish({ until });
}

export function endSilentMode() {
  writeStoredUntil(null);
  publish(SOUND_ON);
}

/**
 * The clock, not the cached snapshot. Every audio call goes through this, so
 * it has to be right the instant the window lapses rather than whenever React
 * next re-renders.
 */
export function isSilentNow(): boolean {
  const { until } = currentState();
  return until !== null && until > Date.now();
}

export function getSilentSnapshot(): SilentState {
  return currentState();
}

export function getServerSilentSnapshot(): SilentState {
  return SOUND_ON;
}

let wired = false;

/**
 * The three things React cannot see: another tab changing the setting, the
 * window lapsing while this tab was asleep (phone in a pocket — timers there
 * are throttled or stopped outright), and the deadline passing.
 *
 * Wired once for the life of the document, not per subscriber, so a component
 * remounting cannot stack duplicate handlers.
 */
function wireExternalSources() {
  if (wired || typeof window === "undefined") return;
  wired = true;

  window.addEventListener("storage", (event) => {
    if (event.key === SILENT_STORAGE_KEY) refresh();
  });
  window.addEventListener("focus", refresh);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") refresh();
  });
}

export function subscribeToSilentMode(listener: () => void): () => void {
  wireExternalSources();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
