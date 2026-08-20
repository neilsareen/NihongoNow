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
      <label htmlFor={id} className="block text-[13px] font-medium text-text-muted">
        {label}
      </label>
      <input
        id={id}
        className={cn(
          "w-full h-10 px-3 rounded-lg text-sm",
          "bg-surface-sunken border border-line text-text placeholder:text-text-subtle",
          "transition-colors duration-150 ease-swift",
          "hover:border-line-strong focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent",
          className
        )}
        {...props}
      />
    </div>
  );
}
