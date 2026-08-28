"use client";

import { useState, type ReactNode } from "react";
import { Lock } from "lucide-react";

/**
 * A locked track row. It isn't a link — there's nowhere to go — so a tap has
 * to do something other than nothing: it reveals why the track is sealed
 * instead of just sitting there looking broken.
 */
export function LockedTrack({
  message,
  children,
}: {
  message: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-4 p-3.5 rounded-card border border-line bg-surface elevated text-left"
      >
        {children}
      </button>
      {open && (
        <div
          role="status"
          className="mt-2 flex items-start gap-2.5 p-3.5 rounded-card border border-line bg-surface-raised animate-rise"
        >
          <Lock className="w-4 h-4 mt-0.5 shrink-0 text-text-subtle" strokeWidth={2.5} />
          <p className="text-[15px] text-text-muted font-medium leading-relaxed">{message}</p>
        </div>
      )}
    </div>
  );
}
