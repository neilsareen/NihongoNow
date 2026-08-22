import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

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
 * Filled variants carry their own ledge colour via the `--ledge` custom
 * property, which `.ledge` in globals.css reads. Label colour is a token
 * rather than a literal — `--on-light` is ink on the dark theme's bright
 * lime/sun fills and white on the light theme's darkened ones — so these
 * variants stay legible in both themes without a `dark:`/`light:` variant
 * anywhere in the app.
 */
const VARIANT: Record<ButtonVariant, { className: string; style?: CSSProperties }> = {
  primary: {
    className: "bg-coral text-on-dark hover:brightness-110",
    style: { ["--ledge" as string]: "var(--coral-deep)" },
  },
  affirm: {
    className: "bg-lime text-on-light hover:brightness-110",
    style: { ["--ledge" as string]: "var(--lime-deep)" },
  },
  reject: {
    className: "bg-rose text-on-dark hover:brightness-110",
    style: { ["--ledge" as string]: "var(--rose-deep)" },
  },
  sun: {
    className: "bg-sun text-on-light hover:brightness-110",
    style: { ["--ledge" as string]: "var(--sun-deep)" },
  },
  grape: {
    className: "bg-grape text-on-light hover:brightness-110",
    style: { ["--ledge" as string]: "var(--grape-deep)" },
  },
  secondary: {
    className: "bg-surface-raised text-text border-2 border-line hover:border-line-strong",
    style: { ["--ledge" as string]: "var(--line)" },
  },
  ghost: {
    className: "text-text-muted hover:text-text hover:bg-surface-raised",
  },
};

const SIZE: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-[13px] gap-1.5",
  md: "h-12 px-6 text-[15px] gap-2",
  lg: "h-14 px-7 text-base gap-2.5",
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
    variant !== "ghost" && (size === "sm" ? "ledge-sm" : "ledge"),
    v.className,
    SIZE[size],
    full && "w-full",
    className
  );
}

/** Paired with `buttonStyles` — supplies the ledge colour for filled variants. */
export function buttonVars(variant: ButtonVariant = "primary"): CSSProperties {
  return VARIANT[variant].style ?? {};
}

/* --- Surfaces ------------------------------------------------------------- */

export function Card({
  children,
  className,
  ledge = true,
  as: As = "div",
}: {
  children: ReactNode;
  className?: string;
  /** The solid block beneath the card. Off for nested or inline panels. */
  ledge?: boolean;
  as?: "div" | "section" | "article";
}) {
  return (
    <As
      className={cn(
        "bg-surface border-2 border-line rounded-card",
        ledge && "card-ledge",
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
      {/* py-1 keeps the cards' 4px ledge from being clipped by the scroll box. */}
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
  ledgeHue,
  children,
  className,
  href,
}: {
  /** HSL triple or var() reference for the fill. */
  hue: string;
  /**
   * The block beneath the card. Defaults to `--ledge-base`, the current
   * theme's shadow tone under any fill — pass a hue's own `-deep` token for a
   * tighter, more saturated stack.
   */
  ledgeHue?: string;
  children: ReactNode;
  className?: string;
  href?: string;
}) {
  const style = {
    background: `hsl(${hue})`,
    ["--ledge" as string]: ledgeHue ?? "var(--ledge-base)",
  } as CSSProperties;

  const cls = cn(
    "block rounded-card text-on-light overflow-hidden",
    href ? "ledge" : "card-ledge",
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
    <h2 className={cn("font-display font-bold text-[17px] tracking-tight", className)}>
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
        "font-display font-bold text-[13px] border-2",
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
        className="h-full rounded-full transition-[width] duration-700 ease-bounce"
        style={{
          width: `${pct}%`,
          background: `hsl(${hue ?? "var(--lime)"})`,
          // A light top edge reads as a rounded surface rather than a flat bar.
          boxShadow: "inset 0 2px 0 0 rgb(255 255 255 / 0.28)",
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
    <header className="sticky top-0 z-40 bg-ink/90 backdrop-blur-xl">
      <div className="max-w-lg mx-auto h-16 px-4 flex items-center gap-3">
        <Link
          href={backHref}
          aria-label="Back"
          className="w-10 h-10 -ml-1 rounded-full grid place-items-center bg-surface border-2 border-line text-text-muted hover:text-text hover:border-line-strong transition-colors shrink-0"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="2.2"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        {title && (
          <span className="flex-1 text-center font-display font-bold text-[17px] tracking-tight">
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
 * instead of an icon-plus-label pair.
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
    <span className={cn("inline-flex flex-col items-center", className)}>
      <span className={cn("inline-flex items-baseline", sm ? "gap-[5px]" : "gap-[7px]")}>
        <span className={cn("jp text-coral font-bold leading-none", sm ? "text-[22px]" : "text-[30px]")}>
          行
        </span>
        <span
          className={cn(
            "font-display font-extrabold tracking-tight leading-none",
            sm ? "text-[16px]" : "text-[21px]"
          )}
        >
          Ikou
        </span>
      </span>
      <span
        aria-hidden="true"
        className={cn("bg-coral rounded-full", sm ? "w-[54px] h-[2px] mt-1" : "w-[76px] h-[3px] mt-1.5")}
      />
    </span>
  );
}

/**
 * Profile avatar: either a learner's own uploaded photo, or a kanji on a
 * colour plate. The kanji plate reads as a considered mark at every size,
 * where a cartoon illustration turns to mud in a tab bar — but a real photo
 * is the whole point once someone uploads one, so that renders as-is.
 */
export function Avatar({
  avatar,
  size = 48,
  className,
}: {
  avatar: { glyph: string; label: string; tone: string } | { type: "image"; url: string };
  size?: number;
  className?: string;
}) {
  // Checked on "url" rather than "type": callers pass either a raw preset
  // ({glyph,label,tone}) or a full ResolvedAvatar (whose preset variant also
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
        className={cn("rounded-tile shrink-0 select-none card-ledge object-cover", className)}
        style={{ width: size, height: size, ["--ledge" as string]: "hsl(var(--line))" }}
      />
    );
  }

  return (
    <span
      className={cn("inline-grid place-items-center rounded-tile shrink-0 select-none card-ledge", className)}
      style={{
        width: size,
        height: size,
        background: `hsl(${avatar.tone})`,
        // Avatar tones are fixed rather than themed, and always bright, so the
        // glyph is always dark ink — `--on-light` flips to white in the light
        // theme and would disappear here.
        color: "hsl(var(--on-bright))",
        ["--ledge" as string]: `hsl(${avatar.tone} / 0.45)`,
      }}
      aria-hidden="true"
    >
      <span className="jp font-bold leading-none" style={{ fontSize: size * 0.46 }}>
        {avatar.glyph}
      </span>
    </span>
  );
}
