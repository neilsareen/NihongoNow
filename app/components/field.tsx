import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

/**
 * A labelled text input. Every form control in the app comes from here so
 * focus, error and disabled states stay identical across screens — the old
 * build restated input classes inline on each page and they had already
 * started to drift.
 */
export function Field({
  label,
  id,
  className,
  ...props
}: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block font-display text-[12px] font-bold uppercase tracking-[0.08em] text-text-subtle"
      >
        {label}
      </label>
      <input
        id={id}
        className={cn(
          "w-full h-12 px-4 rounded-tile text-[15px] font-medium",
          "bg-ink-deep border border-line text-text placeholder:text-text-subtle",
          "transition-colors duration-150",
          "hover:border-line-strong focus:border-coral focus:outline-none",
          className
        )}
        {...props}
      />
    </div>
  );
}
