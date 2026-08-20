import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ===========================================================================
   Shared interface primitives.
   ---------------------------------------------------------------------------
   Every screen composes from this file rather than restating paddings, radii
   and states inline. These are all presentational (no hooks, no handlers), so
   server and client pages can both import them.
   =========================================================================== */

/* --- Buttons -------------------------------------------------------------- */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success";
type ButtonSize = "sm" | "md" | "lg";

const VARIANT: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-accent-fg hover:bg-accent-hover shadow-subtle disabled:hover:bg-accent",
  secondary:
    "bg-surface-raised text-text border border-line hover:border-line-strong hover:bg-surface-raised/70",
  ghost:
    "text-text-muted hover:text-text hover:bg-surface-raised",
  danger:
    "bg-danger/10 text-danger border border-danger/25 hover:bg-danger/16 hover:border-danger/40",
  success:
    "bg-success/10 text-success border border-success/25 hover:bg-success/16 hover:border-success/40",
};

const SIZE: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[13px] rounded-md gap-1.5",
  md: "h-10 px-4 text-sm rounded-lg gap-2",
  lg: "h-12 px-5 text-[15px] rounded-lg gap-2",
};

export function buttonStyles({
  variant = "primary",
  size = "md",
  full = false,
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  full?: boolean;
  className?: string;
} = {}) {
  return cn(
    "inline-flex items-center justify-center font-medium select-none",
    "transition-colors duration-150 ease-swift",
    // A 1px press translation reads as a physical button without the cartoon
    // scale-bounce the old design used.
    "active:translate-y-px disabled:opacity-45 disabled:pointer-events-none",
    VARIANT[variant],
    SIZE[size],
    full && "w-full",
    className
  );
}

/* --- Surfaces ------------------------------------------------------------- */

export function Card({
  children,
  className,
  as: As = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article";
}) {
  return (
    <As className={cn("bg-surface border border-line rounded-xl shadow-subtle", className)}>
      {children}
    </As>
  );
}

/** Small uppercase caption that opens a section. Sets rhythm across screens. */
export function SectionLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={cn(
        "text-[11px] font-semibold uppercase tracking-[0.09em] text-text-subtle",
        className
      )}
    >
      {children}
    </h2>
  );
}

/* --- Progress ------------------------------------------------------------- */

export function ProgressBar({
  value,
  className,
  barClassName,
  trackClassName,
  barStyle,
}: {
  /** 0–100 */
  value: number;
  className?: string;
  barClassName?: string;
  trackClassName?: string;
  /** For per-track hues that come from data rather than a fixed class. */
  barStyle?: CSSProperties;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn("h-1.5 rounded-full overflow-hidden bg-surface-raised", trackClassName, className)}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn("h-full rounded-full bg-accent transition-[width] duration-500 ease-swift", barClassName)}
        style={{ width: `${pct}%`, ...barStyle }}
      />
    </div>
  );
}

/**
 * A stroked SVG ring. The old build drew these with `conic-gradient`, which
 * aliases badly on the arc edge and cannot round its cap; a stroked circle is
 * crisp at any size and animates cleanly.
 */
export function Ring({
  value,
  size = 56,
  thickness = 4,
  color = "hsl(var(--accent))",
  trackColor = "hsl(var(--line))",
  children,
  className,
}: {
  /** 0–100 */
  value: number;
  size?: number;
  thickness?: number;
  color?: string;
  trackColor?: string;
  children?: ReactNode;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  const r = (size - thickness) / 2;
  const circumference = 2 * Math.PI * r;

  return (
    <div
      className={cn("relative shrink-0 grid place-items-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={trackColor}
          strokeWidth={thickness}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct / 100)}
          className="transition-[stroke-dashoffset] duration-700 ease-swift"
        />
      </svg>
      {children != null && (
        <div className="absolute inset-0 grid place-items-center">{children}</div>
      )}
    </div>
  );
}

/* --- Navigation ----------------------------------------------------------- */

/**
 * Sticky page header used by every full-screen route outside the tab bar.
 * Keeps the back affordance, title and optional trailing slot in one place so
 * headers don't drift apart screen to screen.
 */
export function TopBar({
  title,
  backHref = "/dashboard",
  backLabel = "Back",
  trailing,
}: {
  title?: string;
  backHref?: string;
  backLabel?: string;
  trailing?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur-xl">
      <div className="max-w-lg mx-auto h-14 px-4 flex items-center gap-3">
        <Link
          href={backHref}
          className="text-[13px] text-text-muted hover:text-text transition-colors -ml-1 px-1 py-1 rounded"
        >
          ← {backLabel}
        </Link>
        {title && (
          <span className="flex-1 text-center text-[13px] font-medium text-text">
            {title}
          </span>
        )}
        <div className="min-w-[3.5rem] flex justify-end items-center">{trailing}</div>
      </div>
    </header>
  );
}

/** The 行 wordmark, used on auth and marketing screens. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="w-8 h-8 rounded-lg bg-accent/12 border border-accent/25 grid place-items-center">
        <span className="jp text-accent text-[15px] font-semibold leading-none">行</span>
      </span>
      <span className="font-semibold tracking-tight">Ikou</span>
    </span>
  );
}

/**
 * Profile avatar: a single kanji set on a tinted plate. Each option carries its
 * own hue so the mark stays recognisable at tab-bar size, where an illustration
 * would just be mud.
 */
export function Avatar({
  avatar,
  size = 40,
  className,
}: {
  avatar: { glyph: string; label: string; tone: string };
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-grid place-items-center rounded-full border shrink-0 select-none",
        className
      )}
      style={{
        width: size,
        height: size,
        background: `hsl(${avatar.tone} / 0.14)`,
        borderColor: `hsl(${avatar.tone} / 0.32)`,
        color: `hsl(${avatar.tone})`,
      }}
      aria-hidden="true"
    >
      <span className="jp font-medium leading-none" style={{ fontSize: size * 0.46 }}>
        {avatar.glyph}
      </span>
    </span>
  );
}
