import type { Config } from "tailwindcss";

/**
 * Colours live once in `app/globals.css` as raw HSL triples and are surfaced
 * here through a helper, so each one supports Tailwind's alpha syntax
 * (`bg-coral/15`, `text-lime/70`) and the whole interface stays re-themable
 * from a single block.
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
        ink: {
          DEFAULT: token("ink"),
          deep: token("ink-deep"),
        },
        surface: {
          DEFAULT: token("surface"),
          raised: token("surface-raised"),
        },
        line: {
          DEFAULT: token("line"),
          strong: token("line-strong"),
        },
        // The app header's band — see globals.css.
        brand: { bar: token("brand-bar") },

        // The backdrop behind a modal. Its own token because the light theme
        // still wants a dark scrim, so it cannot just be the deepest ground.
        scrim: token("scrim"),
        text: {
          DEFAULT: token("text"),
          muted: token("text-muted"),
          subtle: token("text-subtle"),
        },

        // The cast. On the dark theme a `-deep` variant is the shade that hue
        // casts, not a fill; on the light theme it doubles as the darker fill.
        coral: { DEFAULT: token("coral"), deep: token("coral-deep") },
        lime: { DEFAULT: token("lime"), deep: token("lime-deep") },
        sun: { DEFAULT: token("sun"), deep: token("sun-deep") },
        sky: { DEFAULT: token("sky"), deep: token("sky-deep") },
        grape: { DEFAULT: token("grape"), deep: token("grape-deep") },
        blossom: { DEFAULT: token("blossom"), deep: token("blossom-deep") },
        rose: { DEFAULT: token("rose"), deep: token("rose-deep") },
        teal: { DEFAULT: token("teal"), deep: token("teal-deep") },

        on: {
          light: token("on-light"),
          dark: token("on-dark"),
          bright: token("on-bright"),
        },
      },
      borderRadius: {
        tile: "1.125rem",
        card: "1.5rem",
        blob: "2rem",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Oversized numerals and headlines carry a lot of this design, so the
        // big end of the scale is named rather than written as arbitrary values.
        hero: ["3.25rem", { lineHeight: "1.02", letterSpacing: "-0.035em" }],
        mega: ["4.5rem", { lineHeight: "0.95", letterSpacing: "-0.04em" }],
      },
      transitionTimingFunction: {
        bounce: "cubic-bezier(0.2, 0.9, 0.3, 1.2)",
      },
    },
  },
  plugins: [],
};

export default config;
