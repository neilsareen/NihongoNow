import type { Metadata, Viewport } from "next";
import { Outfit, Plus_Jakarta_Sans, Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { PWAUpdateBanner } from "@/app/components/pwa-update-banner";
import { SimulationBanner } from "@/app/components/simulation-banner";
import { ThemeSync } from "@/app/components/theme";
import { THEME_COLOR, THEME_INIT_SCRIPT } from "@/lib/theme";

// Two faces with a clear division of labour. Outfit is geometric and gets
// heavy fast, so it carries headlines and big numerals where personality
// belongs; Plus Jakarta Sans is warm but quiet enough to read a paragraph in.
// The display face never runs at body size — that was what tipped the first
// build from friendly into childish.
const display = Outfit({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
  variable: "--font-display",
});

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-sans",
});

// Kana and kanji get a real webfont rather than whatever the device happens to
// have. Left to system fonts the same character arrives as Hiragino on Apple,
// Yu Gothic on Windows and Noto on Android — and Yu Gothic in particular draws
// kana narrow and tall, which is what made the flashcards look horizontally
// squashed. Noto Sans JP is drawn to fill the em square, so a lone kana at
// poster size reads as wide as it should.
//
// `subsets` is deliberately omitted: Google exposes no named "japanese" subset
// for this family, so asking for one would fetch the Latin ranges only. Without
// it we self-host every unicode-range chunk and the browser downloads just the
// handful it needs, which also means preload has to be off.
const japanese = Noto_Sans_JP({
  weight: ["400", "500", "700"],
  display: "swap",
  preload: false,
  variable: "--font-jp",
});

export const metadata: Metadata = {
  title: "Ikou — Japanese for travellers",
  description:
    "Learn the Japanese you'll actually use in Japan. Spaced repetition, built around real situations.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    // The one setting that makes an installed Ikou fill the display: the web
    // view is laid out behind the status bar instead of starting beneath it,
    // so the chrome band runs to the physical top edge. It only works
    // alongside `viewportFit: "cover"` below, and it hands every top bar the
    // job of insetting its own contents by `var(--safe-t)` — see
    // the `.top-chrome` block in globals.css.
    statusBarStyle: "black-translucent",
    title: "Ikou",
  },
  other: {
    // `appleWebApp.capable` above now emits only the unprefixed
    // `mobile-web-app-capable`. iOS reads the prefixed spelling, and it is the
    // gate on the status-bar style: without this tag an older iPhone ignores
    // `black-translucent` and hands the app a web view that starts below the
    // status bar, which is the whole thing we are trying to avoid.
    "apple-mobile-web-app-capable": "yes",
  },
  icons: {
    apple: "/icon-192.png",
    icon: "/icon-512.png",
  },
};

export const viewport: Viewport = {
  // Two entries so the browser chrome is right before any script runs; an
  // explicit choice in Settings then overwrites both (see `applyTheme`).
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: THEME_COLOR.light },
    { media: "(prefers-color-scheme: dark)", color: THEME_COLOR.dark },
  ],
  width: "device-width",
  initialScale: 1,
  // Lets the page extend into the display's rounded corners and under the
  // status bar and home indicator, and is what makes the `env(safe-area-inset-*)`
  // values non-zero so bars can hold their contents clear of them.
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Blocking, before first paint: sets the theme class on <html> so a
            light-theme learner never sees a flash of the dark ground. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className={`${sans.variable} ${display.variable} ${japanese.variable} ${sans.className} min-h-screen bg-ink text-text antialiased`}>
        <ThemeSync />
        <SimulationBanner />
        {children}
        <PWAUpdateBanner />
        <Script id="sw-register" strategy="afterInteractive">{`
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(()=>{});
          }
        `}</Script>
      </body>
    </html>
  );
}
