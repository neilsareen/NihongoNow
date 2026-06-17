"use client";

import { useEffect, useState } from "react";

export function PWAInstallBanner() {
  const [prompt, setPrompt] = useState<Event | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); setPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!prompt || dismissed) return null;

  return (
    <div className="mx-4 mt-3 bg-gray-900 border border-white/10 rounded-xl p-4 flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-white">Add to Home Screen</p>
        <p className="text-xs text-gray-500 mt-0.5">Install Nihongo Now for quick access</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => setDismissed(true)}
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
