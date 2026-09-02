import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { cn, type AvatarKey } from "@/lib/utils";
import { AVATAR_ART } from "@/app/components/avatar-art";

/* ===========================================================================
   Shared interface primitives.
   ---------------------------------------------------------------------------
   Presentational only (no hooks, no handlers), so server and client pages can
   both import them. Everything chunky in this app comes from here, which is
   what keeps "playful" from drifting into "inconsistent".
   =========================================================================== */

/* --- Buttons -------------------------------------------------------------- */

type ButtonVariant =
  | "primary"   // coral — the one main action on a screen
  | "affirm"    // lime — "I knew it"
  | "reject"    // rose — "show me again"
  | "sun"
  | "grape"
  | "secondary" // raised surface, for anything supporting
  | "ghost";

type ButtonSize = "sm" | "md" | "lg";

/**
 * Filled variants carry their own shade colour via the `--shade` custom
 * property, which `.pressable` in globals.css reads, so a coral button drops a
 * coral-tinted shadow rather than a grey one. Label colour is a token
 * rather than a literal — `--on-light` is ink on the dark theme's bright
 * lime/sun fills and white on the light theme's darkened ones — so these
 * variants stay legible in both themes without a `dark:`/`light:` variant
 * anywhere in the app.
 */
const VARIANT: Record<ButtonVariant, { className: string; style?: CSSProperties }> = {
  primary: {
    className: "bg-coral text-on-dark hover:brightness-110",
    style: { ["--shade" as string]: "var(--coral-deep)" },
  },
  affirm: {
    className: "bg-lime text-on-light hover:brightness-110",
    style: { ["--shade" as string]: "var(--lime-deep)" },
  },
  reject: {
    className: "bg-rose text-on-dark hover:brightness-110",
    style: { ["--shade" as string]: "var(--rose-deep)" },
  },
  sun: {
    className: "bg-sun text-on-light hover:brightness-110",
    style: { ["--shade" as string]: "var(--sun-deep)" },
  },
  grape: {
    className: "bg-grape text-on-light hover:brightness-110",
    style: { ["--shade" as string]: "var(--grape-deep)" },
  },
  secondary: {
    className: "bg-surface-raised text-text border border-line hover:border-line-strong",
    style: { ["--shade" as string]: "var(--line)" },
  },
  ghost: {
    className: "text-text-muted hover:text-text hover:bg-surface-raised",
  },
};

const SIZE: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-[15px] gap-1.5",
  md: "h-12 px-6 text-[17px] gap-2",
  lg: "h-14 px-7 text-[18px] gap-2.5",
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
  const v = VARIANT[variant];
  return cn(
    "inline-flex items-center justify-center rounded-full select-none",
    "font-display font-bold tracking-tight",
    "transition-[filter,background-color,border-color] duration-100",
    "disabled:opacity-40 disabled:pointer-events-none",
    variant !== "ghost" && (size === "sm" ? "pressable-sm" : "pressable"),
    v.className,
    SIZE[size],
    full && "w-full",
    className
  );
}

/** Paired with `buttonStyles` — supplies the shade colour for filled variants. */
export function buttonVars(variant: ButtonVariant = "primary"): CSSProperties {
  return VARIANT[variant].style ?? {};
}

/* --- Surfaces ------------------------------------------------------------- */

export function Card({
  children,
  className,
  raised = true,
  as: As = "div",
}: {
  children: ReactNode;
  className?: string;
  /** The lit edge and the shade beneath. Off for nested or inline panels. */
  raised?: boolean;
  as?: "div" | "section" | "article";
}) {
  return (
    <As
      className={cn(
        "bg-surface border border-line rounded-card",
        raised && "elevated",
        className
      )}
    >
      {children}
    </As>
  );
}

/**
 * The card well on a drilling screen.
 *
 * A lesson or practice screen is a fixed frame (`.screen-fixed`): it never
 * scrolls, and the answer controls stay pinned at the bottom. Everything that
 * has to give is in here — the well takes whatever height is left and centres
 * the card in it, and only if the card genuinely cannot fit (a kanji card with
 * every reading and example word revealed, on a short phone) does it scroll
 * inside itself, so Reveal is never pushed below the fold.
 *
 * The centring is `m-auto` on the inner wrapper rather than `justify-center`
 * on the scroller: a flex child centred with `justify-content` that overgrows
 * its scroll container has its top edge clipped and unreachable, while auto
 * margins collapse to zero in that case and leave the whole thing scrollable.
 */
export function CardScroller({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex-1 min-h-0 overflow-y-auto flex flex-col", className)}>
      {/* py-1 keeps the cards' shade from being clipped by the scroll box. */}
      <div className="m-auto w-full flex flex-col gap-4 py-1">{children}</div>
    </div>
  );
}

/**
 * A card that IS a colour — the Headspace move. Used sparingly, for the one
 * thing on a screen that should be impossible to miss.
 */
export function ColorCard({
  hue,
  shadeHue,
  children,
  className,
  href,
}: {
  /** HSL triple or var() reference for the fill. */
  hue: string;
  /**
   * The colour of the shade beneath the card. Defaults to `--shade-base`, the
   * theme's near-black violet — pass a hue's own `-deep` token to have the card
   * cast its own colour instead. Must be a bare HSL triple, not `hsl(...)`:
   * `.elevated` composes the alpha itself.
   */
  shadeHue?: string;
  children: ReactNode;
  className?: string;
  href?: string;
}) {
  const style = {
    background: `hsl(${hue})`,
    ["--shade" as string]: shadeHue ?? "var(--shade-base)",
  } as CSSProperties;

  const cls = cn(
    "block rounded-card text-on-light overflow-hidden",
    href ? "pressable" : "elevated",
    className
  );

  return href ? (
    <Link href={href} className={cls} style={style}>{children}</Link>
  ) : (
    <div className={cls} style={style}>{children}</div>
  );
}

/** Section heading. Big and confident rather than a whispered caption. */
export function SectionLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2 className={cn("font-display font-bold text-[18px] tracking-tight", className)}>
      {children}
    </h2>
  );
}

/** Rounded pill for counts and statuses. */
export function Chip({
  children,
  hue,
  className,
}: {
  children: ReactNode;
  /** HSL triple or var() reference; omit for a neutral chip. */
  hue?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 h-8 px-3 rounded-full",
        "font-display font-bold text-[15px] border",
        !hue && "bg-surface-raised border-line text-text",
        className
      )}
      style={
        hue
          ? {
              background: `hsl(${hue} / 0.18)`,
              borderColor: `hsl(${hue} / 0.45)`,
              color: `hsl(${hue})`,
            }
          : undefined
      }
    >
      {children}
    </span>
  );
}

/* --- Progress ------------------------------------------------------------- */

export function ProgressBar({
  value,
  hue,
  className,
  trackClassName,
}: {
  /** 0–100 */
  value: number;
  /** HSL triple or var() reference. Defaults to lime. */
  hue?: string;
  className?: string;
  trackClassName?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn("h-3 rounded-full overflow-hidden bg-ink-deep", trackClassName, className)}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full sheen transition-[width] duration-700 ease-bounce"
        style={{
          width: `${pct}%`,
          backgroundColor: `hsl(${hue ?? "var(--lime)"})`,
        }}
      />
    </div>
  );
}

/**
 * Thick stroked ring, in the spirit of the Fitness rings: heavy stroke, round
 * caps, a track dark enough that the arc reads as a solid object.
 */
export function Ring({
  value,
  size = 64,
  thickness = 8,
  hue = "var(--lime)",
  children,
  className,
}: {
  /** 0–100 */
  value: number;
  size?: number;
  thickness?: number;
  hue?: string;
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
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="hsl(var(--ink-deep))" strokeWidth={thickness} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={`hsl(${hue})`}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct / 100)}
          className="transition-[stroke-dashoffset] duration-1000 ease-bounce"
        />
      </svg>
      {children != null && (
        <div className="absolute inset-0 grid place-items-center">{children}</div>
      )}
    </div>
  );
}

/* --- Navigation ----------------------------------------------------------- */

export function TopBar({
  title,
  backHref = "/dashboard",
  trailing,
}: {
  title?: string;
  backHref?: string;
  trailing?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-40 top-chrome bg-ink/90 backdrop-blur-xl">
      <div className="max-w-lg mx-auto h-16 px-4 flex items-center gap-3">
        <Link
          href={backHref}
          aria-label="Back"
          className="w-10 h-10 -ml-1 rounded-full grid place-items-center bg-surface border border-line text-text-muted hover:text-text hover:border-line-strong transition-colors shrink-0"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="2.2"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        {title && (
          <span className="flex-1 text-center font-display font-bold text-[18px] tracking-tight">
            {title}
          </span>
        )}
        {/* Wide enough to balance the back button, but free to grow: a trailing
            control that carries a label (the silent-mode countdown) would
            otherwise spill out of a fixed 40px box. */}
        <div className="min-w-[2.5rem] flex justify-end items-center shrink-0">{trailing}</div>
      </div>
    </header>
  );
}

/**
 * The Ikou wordmark — the one brand lockup, used identically on every screen
 * that shows it (landing, auth, onboarding, the dashboard's app header).
 *
 * 行 sits directly beside the roman letters rather than boxed as a separate
 * icon, and a coral rule ties the two together underneath — one fused mark
 * instead of an icon-plus-label pair. That rule is a contrail: it fades in
 * out of nothing under 行, runs flat beneath the word, then banks up off the
 * final "u" and becomes an airliner climbing away to the right. 行こう is
 * "let's go", and this app is for people going to Japan, so the mark leaves.
 *
 * Three details keep it honest:
 *
 * - The flat run is a CSS gradient on a `w-full` bar, not an SVG path, so it
 *   measures itself against the letters above it. Outfit renders at different
 *   widths across platforms and weights; a hardcoded rule width would drift
 *   off the end of the word, and this cannot. It also means the fade needs no
 *   gradient id — this file is hook-free (no `useId`) so server pages can
 *   import it, and the landing page renders two wordmarks on one screen.
 * - The jet hangs off `left-full`, i.e. pinned to the bar's right edge, which
 *   is the word's right edge. Its diagonal starts at its own bottom-left
 *   corner at the bar's exact thickness, so the two meet as one stroke.
 * - It is positioned out of flow and the pill reserves its width in
 *   `pr-*` instead. The aircraft therefore costs the lockup no height: it
 *   flies through the empty space beside the word, not below it.
 *
 * The mark carries no plate at all — no fill, no border, nothing behind it.
 * It is coral and text ink on whatever ground it lands on, which is what lets
 * one lockup sit on the page, on the warmed `--brand-bar` and on the landing
 * footer without any of them showing a chip edge around it. Both grounds are
 * far enough from coral and from the text colour that the mark reads on them
 * unaided, so the plate was doing nothing but drawing its own outline.
 */
export function Wordmark({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md";
}) {
  const sm = size === "sm";
  return (
    <span
      className={cn(
        "inline-flex flex-col items-start",
        // The only padding left is the runway the jet flies out into. With no
        // plate to inset from, a leading pad would just push the mark off the
        // container edge it is meant to line up with; the aircraft is
        // positioned out of flow, so this reserve costs the lockup no height.
        sm ? "pr-[40px]" : "pr-[54px]",
        className
      )}
    >
      <span className={cn("inline-flex items-baseline", sm ? "gap-[5px]" : "gap-[7px]")}>
        <span className={cn("jp text-coral font-bold leading-none", sm ? "text-[22px]" : "text-[30px]")}>
          行
        </span>
        <span
          className={cn(
            "font-display font-extrabold tracking-tight leading-none",
            sm ? "text-[17px]" : "text-[21px]"
          )}
        >
          Ikou
        </span>
      </span>

      {/* `w-full` is the whole trick: the contrail is exactly as wide as the
          letters above it whatever the face does, and the jet hangs off
          `left-full`, so the climb always begins on the final "u". */}
      <span
        aria-hidden="true"
        className={cn("relative w-full", sm ? "h-[1.5px] mt-1" : "h-[2px] mt-1.5")}
      >
        <span className="absolute inset-x-0 bottom-0 h-full rounded-l-full bg-gradient-to-r from-coral/0 to-coral" />
        <svg
          viewBox="0 0 38 17.91"
          fill="none"
          className={cn("absolute left-full bottom-0 text-coral", sm ? "w-[28px]" : "w-[38px]")}
        >
          <path
            d="M0 16.86 L22.57 6.88"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
          />
          <g fill="currentColor" transform="translate(29.51 3.9) rotate(-24) scale(0.66)">
            <path d="M12 0.2 C10.4 -1.3 7 -1.9 2.6 -1.95 L-3.4 -1.95 L-8.2 -7.0 L-10.4 -7.0 L-9.6 -2.0 L-12.4 -1.5 L-12.4 1.0 L-6 1.95 L3.4 1.9 C7.6 1.75 10.6 1.2 12 0.2 Z" />
            <path d="M4.2 1.4 L-3.2 6.6 L-7.4 6.6 L-2.2 1.4 Z" />
            <path d="M-9.2 0.3 L-13.2 3.0 L-14.8 3.0 L-11.4 0.3 Z" />
            <path d="M2.0 1.6 C4.0 1.6 4.2 3.9 2.0 3.9 L-1.6 3.9 C-3.4 3.9 -3.2 1.6 -1.6 1.6 Z" />
          </g>
        </svg>
      </span>
    </span>
  );
}

/**
 * Profile avatar: either a learner's own uploaded photo, or one of the preset
 * cartoons on its colour plate. The drawing is inline SVG on a 64x64 grid, so
 * the same mark stays crisp at 36px in the header and at 56px in settings; the
 * plate clips it, which is what lets the busts run off the bottom edge.
 */
export function Avatar({
  avatar,
  size = 48,
  className,
}: {
  avatar: { key: AvatarKey; label: string; tone: string } | { type: "image"; url: string };
  size?: number;
  className?: string;
}) {
  // Checked on "url" rather than "type": callers pass either a raw preset
  // ({key,label,tone}) or a full ResolvedAvatar (whose preset variant also
  // carries its own `type: "preset"` at runtime), so `"type" in avatar` would
  // misfire for that second shape. Only the image variant ever has a url.
  if ("url" in avatar) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatar.url}
        alt="Your profile photo"
        width={size}
        height={size}
        className={cn("rounded-tile shrink-0 select-none elevated object-cover", className)}
        style={{ width: size, height: size, ["--shade" as string]: "var(--line)" }}
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-grid place-items-center rounded-tile shrink-0 select-none elevated overflow-hidden",
        className
      )}
      style={{
        width: size,
        height: size,
        background: `hsl(${avatar.tone})`,
        // The plate casts its own colour, so a lime avatar sits over a lime
        // shade. `--shade` composes its own alpha, so this is the bare triple.
        ["--shade" as string]: avatar.tone,
      }}
      role="img"
      aria-label={avatar.label}
    >
      <svg viewBox="0 0 64 64" width={size} height={size} className="block">
        {AVATAR_ART[avatar.key]}
      </svg>
    </span>
  );
}
