/* ===========================================================================
   Theme selection.
   ---------------------------------------------------------------------------
   Three choices — "system", "light", "dark" — resolving to one of two grounds.
   The resolved ground is a `light`/`dark` class on <html>, which is what the
   token blocks in globals.css key off.

   The preference lives in localStorage rather than on UserProfile: it is a
   property of the device you are reading on (a phone in bright sun, a laptop
   at night), not of the account, and it has to be applied on the very first
   paint — before any session lookup could have returned.
   =========================================================================== */

export type ThemeChoice = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "ikou-theme";

/** Browser chrome colour per ground, mirroring `--ink`. */
export const THEME_COLOR: Record<ResolvedTheme, string> = {
  dark: "#130C1F",
  light: "#F5F1FB",
};

export const THEME_CHOICES: ThemeChoice[] = ["light", "dark", "system"];

function isChoice(value: unknown): value is ThemeChoice {
  return value === "system" || value === "light" || value === "dark";
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
if(c!=="light"&&c!=="dark")c="system";
var r=c==="system"?(window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"):c;
var e=document.documentElement;
e.classList.toggle("light",r==="light");
e.classList.toggle("dark",r==="dark");
e.dataset.theme=r;
e.style.colorScheme=r;
}catch(_){}})();`;

export function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function resolveTheme(choice: ThemeChoice): ResolvedTheme {
  return choice === "system" ? getSystemTheme() : choice;
}

function readStoredChoice(): ThemeChoice {
  if (typeof window === "undefined") return "system";
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isChoice(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

/** Puts a resolved ground on the document. Idempotent. */
export function applyTheme(resolved: ResolvedTheme, { animate = false } = {}) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const changed = root.dataset.theme !== resolved;

  if (changed) {
    // Only cross-fade a real change — the first mount re-applies whatever the
    // init script already painted, and that should not flicker.
    if (animate) {
      root.classList.add("theme-switching");
      window.setTimeout(() => root.classList.remove("theme-switching"), 260);
    }

    root.classList.toggle("light", resolved === "light");
    root.classList.toggle("dark", resolved === "dark");
    root.dataset.theme = resolved;
    root.style.colorScheme = resolved;
  }

  // Always re-stamped, even when the ground is unchanged: the layout ships two
  // media-scoped theme-color tags, so on first mount the OS-matching one can
  // still disagree with an explicit choice. Giving both the same value makes
  // the choice win.
  document
    .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
    .forEach((tag) => {
      tag.content = THEME_COLOR[resolved];
    });
}

/* --- Store -----------------------------------------------------------------
   A minimal external store rather than a context provider: the preference is
   global, has exactly one writer, and needs to react to two things React knows
   nothing about — the OS switching appearance, and another tab changing the
   setting. `useSyncExternalStore` covers all of it without wrapping the tree.
   --------------------------------------------------------------------------- */

export type ThemeState = { choice: ThemeChoice; resolved: ResolvedTheme };

const SERVER_STATE: ThemeState = { choice: "system", resolved: "dark" };

let state: ThemeState | null = null;
const listeners = new Set<() => void>();

function currentState(): ThemeState {
  if (!state) {
    const choice = readStoredChoice();
    state = { choice, resolved: resolveTheme(choice) };
  }
  return state;
}

function publish(next: ThemeState) {
  const prev = currentState();
  if (prev.choice === next.choice && prev.resolved === next.resolved) return;
  state = next;
  listeners.forEach((listener) => listener());
}

/** Re-derives the resolved ground from the stored choice (OS or tab change). */
function refresh(animate: boolean) {
  const choice = readStoredChoice();
  const resolved = resolveTheme(choice);
  applyTheme(resolved, { animate });
  publish({ choice, resolved });
}

export function setThemeChoice(choice: ThemeChoice) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, choice);
  } catch {
    // Private mode — the choice still applies for this session.
  }
  const resolved = resolveTheme(choice);
  applyTheme(resolved, { animate: true });
  publish({ choice, resolved });
}

export function getThemeSnapshot(): ThemeState {
  return currentState();
}

export function getServerThemeSnapshot(): ThemeState {
  return SERVER_STATE;
}

let wired = false;

/**
 * Wires the two sources React cannot see: the OS appearance switching while
 * the choice is "system", and another tab changing the setting. Done once for
 * the life of the document rather than per subscriber, so a component
 * mounting and unmounting (or Strict Mode double-invoking) cannot stack
 * duplicate handlers.
 */
function wireExternalSources() {
  if (wired || typeof window === "undefined") return;
  wired = true;

  window
    .matchMedia("(prefers-color-scheme: light)")
    .addEventListener("change", () => refresh(true));

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
