import type { Config } from "tailwindcss";

/**
 * The palette is defined once in `app/globals.css` as raw HSL triples and
 * surfaced here through a helper so every colour supports Tailwind's alpha
 * syntax (`bg-surface/60`, `text-accent/70`). Nothing hard-codes a hex value
 * outside the token block, which keeps the whole interface re-themable from
 * one place.
 */
const token = (name: string) => `hsl(var(--${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: token("canvas"),
        surface: {
          DEFAULT: token("surface"),
          raised: token("surface-raised"),
          sunken: token("surface-sunken"),
        },
        line: {
          DEFAULT: token("line"),
          strong: token("line-strong"),
        },
        text: {
          DEFAULT: token("text"),
          muted: token("text-muted"),
          subtle: token("text-subtle"),
        },
        accent: {
          DEFAULT: token("accent"),
          hover: token("accent-hover"),
          fg: token("accent-fg"),
        },
        success: token("success"),
        danger: token("danger"),
        warning: token("warning"),
        track: {
          hiragana: token("track-hiragana"),
          katakana: token("track-katakana"),
          kanji: token("track-kanji"),
          vocab: token("track-vocab"),
          phrase: token("track-phrase"),
        },
      },
      borderRadius: {
        sm: "calc(var(--radius) - 4px)",
        md: "calc(var(--radius) - 2px)",
        lg: "var(--radius)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 10px)",
      },
      fontSize: {
        // A display step for the few places that need real presence — hero
        // headline, score readouts — without reaching for arbitrary values.
        display: ["2.5rem", { lineHeight: "1.1", letterSpacing: "-0.03em" }],
      },
      boxShadow: {
        // Neutral, low-spread elevation. No coloured glows: they were the
        // single largest source of the old "toy" impression.
        subtle: "0 1px 2px 0 rgb(0 0 0 / 0.35)",
        card: "0 1px 2px 0 rgb(0 0 0 / 0.3), 0 8px 24px -12px rgb(0 0 0 / 0.6)",
        lifted: "0 2px 4px 0 rgb(0 0 0 / 0.3), 0 16px 40px -16px rgb(0 0 0 / 0.7)",
      },
      transitionTimingFunction: {
        // Fast out, settled in — matches the platform curves users already
        // read as "responsive" rather than "springy".
        swift: "cubic-bezier(0.2, 0, 0, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
