"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Moon, Sun, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  applyTheme,
  getServerThemeSnapshot,
  getThemeSnapshot,
  setThemeChoice,
  subscribeToTheme,
  type ThemeChoice,
} from "@/lib/theme";

/**
 * Reads the current theme. Backed by an external store rather than context, so
 * any screen can call it without the tree being wrapped in a provider.
 */
export function useTheme() {
  const { choice } = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerThemeSnapshot
  );
  return { choice, setTheme: setThemeChoice };
}

/**
 * Mounted once in the root layout. The blocking script in <head> paints the
 * right ground before first paint; this keeps it there — re-applying after
 * hydration and, through the store's subscription, when another tab changes
 * the setting.
 */
export function ThemeSync() {
  const { choice } = useTheme();

  useEffect(() => {
    applyTheme(choice);
  }, [choice]);

  return null;
}

const OPTIONS: { value: ThemeChoice; label: string; icon: LucideIcon; tone: string }[] = [
  { value: "light", label: "Light", icon: Sun, tone: "var(--sun)" },
  { value: "dark", label: "Dark", icon: Moon, tone: "var(--grape)" },
];

/** Two-up segmented control, built like the daily-goal picker so Settings reads as one screen. */
export function ThemeToggle() {
  const { choice, setTheme } = useTheme();

  return (
    <div className="grid grid-cols-2 gap-2" role="group" aria-label="Theme">
      {OPTIONS.map(({ value, label, icon: Icon, tone }) => {
        const isOn = choice === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            aria-pressed={isOn}
            className={cn(
              "h-[4.5rem] rounded-tile border elevated",
              "flex flex-col items-center justify-center gap-1.5",
              "font-display font-bold text-[13px]",
              "transition-colors duration-150",
              isOn
                ? "text-on-light"
                : "border-line bg-surface text-text-muted hover:border-line-strong hover:text-text"
            )}
            style={
              isOn
                ? { background: `hsl(${tone})`, borderColor: `hsl(${tone})` }
                : undefined
            }
          >
            <Icon className="w-[19px] h-[19px]" strokeWidth={2.5} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
