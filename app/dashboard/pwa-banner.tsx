"use client";

import { useEffect, useState } from "react";
import { Share, X } from "lucide-react";
import { buttonStyles, buttonVars } from "@/app/components/ui";

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
  if (!prompt && !showIOSHint) return null;

  return (
    <div className="max-w-lg mx-auto px-4 pt-4">
      <div className="bg-surface border border-line rounded-card elevated p-4 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-[16px]">Put Ikou on your home screen</p>
          {prompt ? (
            <p className="text-[13px] text-text-subtle mt-0.5">Opens full screen and works offline.</p>
          ) : (
            <p className="text-[15px] text-text-muted mt-1 leading-relaxed inline-flex flex-wrap items-center gap-1">
              Tap
              <Share className="w-3.5 h-3.5 inline text-text" strokeWidth={1.75} aria-label="Share" />
              then <span className="text-text font-medium">Add to Home Screen</span>.
            </p>
          )}
        </div>

        {prompt && (
          <button
            onClick={() => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (prompt as any).prompt?.();
              setPrompt(null);
            }}
            className={buttonStyles({ variant: "primary", size: "sm" })}
            style={buttonVars("primary")}
          >
            Install
          </button>
        )}

        <button
          onClick={dismiss}
          className="w-7 h-7 -mr-1 -mt-0.5 rounded-md grid place-items-center text-text-subtle hover:text-text hover:bg-surface-raised transition-colors shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
