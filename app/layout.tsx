import type { Metadata, Viewport } from "next";
import { Inter, Baloo_2 } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { PWAUpdateBanner } from "@/app/components/pwa-update-banner";

const inter = Inter({ subsets: ["latin"] });
const baloo = Baloo_2({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "Ikou",
  description: "Learn Japanese for your next trip to Japan",
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
  themeColor: "#0a0a0f",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} ${baloo.variable} min-h-screen bg-gray-950 text-white antialiased`}>
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
