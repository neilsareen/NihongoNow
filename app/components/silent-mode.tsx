"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Volume2, VolumeX } from "lucide-react";
import {
  SILENT_DURATIONS,
  endSilentMode,
  getServerSilentSnapshot,
  getSilentSnapshot,
  silentMinutesLeft,
  startSilentMode,
  subscribeToSilentMode,
} from "@/lib/silent-mode";
import { cn } from "@/lib/utils";
import { Card, buttonStyles, buttonVars } from "./ui";

/* ===========================================================================
   Silent mode controls.
   ---------------------------------------------------------------------------
   One panel, shown two ways: behind a button in a session header, where it is
   needed the moment the carriage goes quiet, and open on the Settings screen,
   where it can be found on purpose. Both are the same control, so turning it
   on in one place reads correctly in the other.
   =========================================================================== */

/**
 * Reads the current mute. Backed by the external store rather than context, so
 * any screen — a lesson card, an audio button, the tab bar — can ask without
 * the tree being wrapped in a provider.
 */
export function useSilentMode() {
  const { until } = useSyncExternalStore(
    subscribeToSilentMode,
    getSilentSnapshot,
    getServerSilentSnapshot
  );
  return { until, active: until !== null && until > Date.now() };
}

/**
 * The remaining minutes, recounted as they tick down. Separate from
 * `useSilentMode` because only the panel showing a countdown should re-render
 * every half minute — an audio button deciding whether to exist should not.
 */
function useMinutesLeft(until: number | null): number {
  const [minutes, setMinutes] = useState(() => silentMinutesLeft(until));

  useEffect(() => {
    setMinutes(silentMinutesLeft(until));
    if (until === null) return;
    const id = setInterval(() => setMinutes(silentMinutesLeft(until)), 15_000);
    return () => clearInterval(id);
  }, [until]);

  return minutes;
}

/**
 * The control itself.
 *
 * `onChoose` lets the header dialog close itself once a choice is made; the
 * Settings copy stays put and has nothing to close.
 */
export function SilentModePanel({ onChoose }: { onChoose?: () => void }) {
  const { until, active } = useSilentMode();
  const minutesLeft = useMinutesLeft(active ? until : null);

  return (
    <div className="space-y-3">
      <p className="text-[14px] text-text-muted leading-relaxed font-medium">
        {active
          ? "Nothing will play out loud, and anything that asks you to listen or speak is being asked in writing instead."
          : "Somewhere you can’t talk? Mute the audio and swap listening and speaking cards for ones you can answer in your head."}
      </p>

      <div className="grid grid-cols-2 gap-2">
        {SILENT_DURATIONS.map((minutes) => (
          <button
            key={minutes}
            type="button"
            onClick={() => {
              startSilentMode(minutes);
              onChoose?.();
            }}
            className={cn(
              "h-14 rounded-tile border-2 bg-surface card-ledge",
              "font-display font-bold text-[15px] tnum transition-colors duration-150",
              "border-line text-text-muted hover:border-line-strong hover:text-text"
            )}
          >
            {active ? `Another ${minutes} min` : `${minutes} minutes`}
          </button>
        ))}
      </div>

      {/* Reserved rather than conditional, so the panel does not resize under
          the thumb the moment a window is picked. */}
      <div className="min-h-[3.5rem] flex flex-col items-center justify-center gap-2" aria-live="polite">
        {active ? (
          <>
            <p className="font-display font-bold text-[13px]" style={{ color: "hsl(var(--grape))" }}>
              Silent for {minutesLeft} more {minutesLeft === 1 ? "minute" : "minutes"}
            </p>
            <button
              type="button"
              onClick={() => {
                endSilentMode();
                onChoose?.();
              }}
              className={buttonStyles({ variant: "secondary", size: "sm" })}
              style={buttonVars("secondary")}
            >
              <Volume2 className="w-4 h-4" strokeWidth={2.5} />
              Turn sound back on
            </button>
          </>
        ) : (
          <p className="text-[13px] text-text-subtle font-medium text-center">
            Sound comes back on its own when the time is up.
          </p>
        )}
      </div>
    </div>
  );
}

/** The Settings screen's copy: the same panel, always open. */
export function SilentModeSettings() {
  return (
    <Card className="p-4">
      <SilentModePanel />
    </Card>
  );
}

/**
 * The in-session button. Sized and shaped like the other header controls, and
 * carrying the countdown when it is on so the state is legible without opening
 * anything.
 */
export function SilentModeButton({ className }: { className?: string }) {
  const { until, active } = useSilentMode();
  const minutesLeft = useMinutesLeft(active ? until : null);
  const [open, setOpen] = useState(false);

  // While the dialog is open it owns the keyboard. Captured before anything
  // else sees the key, because the screens this button sits on are driven by
  // bare keys — space reveals a card, 1 and 2 answer it — and those must not
  // fire at a lesson hidden behind an open dialog.
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      // Tab and typing still belong to whatever has focus inside the dialog.
      if (event.key === "Tab") return;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      event.stopPropagation();
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={active ? `Silent mode on, ${minutesLeft} minutes left` : "Turn on silent mode"}
        title={active ? `Silent for ${minutesLeft} more minutes` : "Can’t speak out loud?"}
        className={cn(
          "h-10 rounded-full grid grid-flow-col items-center gap-1.5 shrink-0 border-2 transition-colors",
          active
            ? "px-3 text-on-light"
            : "w-10 bg-surface border-line text-text-muted hover:text-text hover:border-line-strong",
          className
        )}
        style={
          active
            ? { background: "hsl(var(--grape))", borderColor: "hsl(var(--grape))" }
            : undefined
        }
      >
        <VolumeX className="w-[18px] h-[18px]" strokeWidth={2.5} />
        {active && (
          <span className="font-display font-bold text-[13px] tnum">{minutesLeft}m</span>
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center px-4 bg-scrim/70 backdrop-blur-sm animate-fade"
          role="dialog"
          aria-modal="true"
          aria-labelledby="silent-title"
          onClick={() => setOpen(false)}
        >
          <Card className="p-5 w-full max-w-sm animate-pop-in">
            {/* Clicks inside must not fall through to the backdrop dismiss. */}
            <div onClick={(event) => event.stopPropagation()}>
              <h2 id="silent-title" className="text-xl mb-2">
                {active ? "Silent mode is on" : "Can’t speak out loud?"}
              </h2>
              <SilentModePanel onChoose={() => setOpen(false)} />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className={buttonStyles({ variant: "ghost", full: true, className: "mt-1" })}
              >
                {active ? "Back to studying" : "Never mind"}
              </button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
