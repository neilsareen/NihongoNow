import type { Metadata, Viewport } from "next";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { PWAUpdateBanner } from "@/app/components/pwa-update-banner";

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

export const metadata: Metadata = {
  title: "Ikou — Japanese for travellers",
  description:
    "Learn the Japanese you'll actually use in Japan. Spaced repetition, built around real situations.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Ikou",
  },
  icons: {
    apple: "/icon-192.png",
    icon: "/icon-512.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#130C1F",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sans.variable} ${display.variable} ${sans.className} min-h-screen bg-ink text-text antialiased`}>
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
