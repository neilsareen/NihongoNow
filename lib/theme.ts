/* ===========================================================================
   Theme selection.
   ---------------------------------------------------------------------------
   Two choices — "light", "dark" — each its own ground. The choice is a
   `light`/`dark` class on <html>, which is what the token blocks in
   globals.css key off.

   The preference lives in localStorage rather than on UserProfile: it is a
   property of the device you are reading on (a phone in bright sun, a laptop
   at night), not of the account, and it has to be applied on the very first
   paint — before any session lookup could have returned.

   A learner who has never chosen gets the device's OS preference as a
   one-time default, checked once at that first paint — not tracked as an
   ongoing "system" choice, and not re-checked if the OS preference later
   changes. Once someone picks Light or Dark, that's it until they pick again.
   =========================================================================== */

export type ThemeChoice = "light" | "dark";

export const THEME_STORAGE_KEY = "ikou-theme";

/** Browser chrome colour per ground, mirroring `--ink`. */
export const THEME_COLOR: Record<ThemeChoice, string> = {
  dark: "#130C1F",
  light: "#F5F1FB",
};

export const THEME_CHOICES: ThemeChoice[] = ["light", "dark"];

function isChoice(value: unknown): value is ThemeChoice {
  return value === "light" || value === "dark";
}

function osDefault(): ThemeChoice {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

/**
 * Runs blocking in <head>, before first paint, so a light-theme learner never
 * sees a flash of the dark ground. Deliberately dependency-free and wrapped in
 * a try/catch: localStorage throws outright in some privacy modes, and a theme
 * preference is never worth failing the page load over.
 *
 * Kept in sync with `applyTheme` below — the two do the same four things.
 */
export const THEME_INIT_SCRIPT = `(function(){try{
var c=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
var r=(c==="light"||c==="dark")?c:(window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark");
var e=document.documentElement;
e.classList.toggle("light",r==="light");
e.classList.toggle("dark",r==="dark");
e.dataset.theme=r;
e.style.colorScheme=r;
}catch(_){}})();`;

function readStoredChoice(): ThemeChoice {
  if (typeof window === "undefined") return "dark";
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isChoice(stored) ? stored : osDefault();
  } catch {
    return "dark";
  }
}

/** Puts a ground on the document. Idempotent. */
export function applyTheme(choice: ThemeChoice, { animate = false } = {}) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const changed = root.dataset.theme !== choice;

  if (changed) {
    // Only cross-fade a real change — the first mount re-applies whatever the
    // init script already painted, and that should not flicker.
    if (animate) {
      root.classList.add("theme-switching");
      window.setTimeout(() => root.classList.remove("theme-switching"), 260);
    }

    root.classList.toggle("light", choice === "light");
    root.classList.toggle("dark", choice === "dark");
    root.dataset.theme = choice;
    root.style.colorScheme = choice;
  }

  // Always re-stamped, even when the ground is unchanged: the layout ships two
  // media-scoped theme-color tags, so on first mount the OS-matching one can
  // still disagree with an explicit choice. Giving both the same value makes
  // the choice win.
  document
    .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
    .forEach((tag) => {
      tag.content = THEME_COLOR[choice];
    });
}

/* --- Store -----------------------------------------------------------------
   A minimal external store rather than a context provider: the preference is
   global, has exactly one writer, and needs to react to one thing React knows
   nothing about — another tab changing the setting.
   --------------------------------------------------------------------------- */

export type ThemeState = { choice: ThemeChoice };

const SERVER_STATE: ThemeState = { choice: "dark" };

let state: ThemeState | null = null;
const listeners = new Set<() => void>();

function currentState(): ThemeState {
  if (!state) {
    state = { choice: readStoredChoice() };
  }
  return state;
}

function publish(next: ThemeState) {
  const prev = currentState();
  if (prev.choice === next.choice) return;
  state = next;
  listeners.forEach((listener) => listener());
}

/** Re-derives the choice from storage (a tab change). */
function refresh(animate: boolean) {
  const choice = readStoredChoice();
  applyTheme(choice, { animate });
  publish({ choice });
}

export function setThemeChoice(choice: ThemeChoice) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, choice);
  } catch {
    // Private mode — the choice still applies for this session.
  }
  applyTheme(choice, { animate: true });
  publish({ choice });
}

export function getThemeSnapshot(): ThemeState {
  return currentState();
}

export function getServerThemeSnapshot(): ThemeState {
  return SERVER_STATE;
}

let wired = false;

/**
 * Wires the one source React cannot see: another tab changing the setting.
 * Done once for the life of the document rather than per subscriber, so a
 * component mounting and unmounting (or Strict Mode double-invoking) cannot
 * stack duplicate handlers.
 */
function wireExternalSources() {
  if (wired || typeof window === "undefined") return;
  wired = true;

  window.addEventListener("storage", (event) => {
    if (event.key === THEME_STORAGE_KEY) refresh(true);
  });
}

export function subscribeToTheme(listener: () => void): () => void {
  wireExternalSources();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
