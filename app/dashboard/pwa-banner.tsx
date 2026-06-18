"use client";

import { useEffect, useState } from "react";

const DISMISSED_KEY = "pwa-install-dismissed";

export function PWAInstallBanner() {
  const [prompt, setPrompt] = useState<Event | null>(null);
  const [showIOSHint, setShowIOSHint] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY)) return;

    // Android / Chrome: capture the native install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // iOS: Safari doesn't fire beforeinstallprompt; detect manually
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true;
    if (isIOS && !isStandalone) {
      setShowIOSHint(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "1");
    setDismissed(true);
    setPrompt(null);
    setShowIOSHint(false);
  };

  if (dismissed) return null;

  if (prompt) {
    return (
      <div className="mx-4 mt-3 bg-gray-900 border border-white/10 rounded-xl p-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-white">Add to Home Screen</p>
          <p className="text-xs text-gray-500 mt-0.5">Install Nihongo Now for quick access</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={dismiss}
            className="text-xs text-gray-600 hover:text-gray-400 px-2 py-1"
          >
            Not now
          </button>
          <button
            onClick={() => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (prompt as any).prompt?.();
              setPrompt(null);
            }}
            className="text-xs bg-white text-gray-950 font-semibold px-3 py-1.5 rounded-lg"
          >
            Install
          </button>
        </div>
      </div>
    );
  }

  if (showIOSHint) {
    return (
      <div className="mx-4 mt-3 bg-gray-900 border border-white/10 rounded-xl p-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-white">Add to Home Screen</p>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
            Tap the <span className="text-white font-medium">Share</span> button then{" "}
            <span className="text-white font-medium">&ldquo;Add to Home Screen&rdquo;</span> to install.
          </p>
        </div>
        <button
          onClick={dismiss}
          className="text-xs text-gray-600 hover:text-gray-400 px-2 py-1 shrink-0"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    );
  }

  return null;
}
