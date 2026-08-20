"use client";

import { useEffect, useState } from "react";

// Guards against a reload loop: we only ever attempt one automatic recovery
// per tab, so a genuinely broken build shows the error instead of thrashing.
const RECOVERY_KEY = "ikou-sw-recovery-attempted";

async function clearAppCaches() {
  if ("serviceWorker" in navigator) {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((r) => r.unregister()));
  }
  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
  }
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [recovering, setRecovering] = useState(false);

  // A stale service worker can serve chunks that no longer exist, which surfaces
  // here as a chunk-load failure. Clearing the cache and reloading fixes it
  // without the user having to know what a service worker is.
  useEffect(() => {
    const message = `${error?.name ?? ""} ${error?.message ?? ""}`;
    const isChunkError = /ChunkLoadError|Loading chunk|dynamically imported module|Importing a module script failed/i.test(message);
    if (!isChunkError) return;
    if (sessionStorage.getItem(RECOVERY_KEY)) return;

    sessionStorage.setItem(RECOVERY_KEY, "1");
    setRecovering(true);
    clearAppCaches().finally(() => window.location.reload());
  }, [error]);

  async function handleManualReset() {
    setRecovering(true);
    await clearAppCaches().catch(() => {});
    window.location.reload();
  }

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0F1115] text-[#f5f6f8] antialiased">
        <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 gap-6">
          <div className="text-center space-y-2 max-w-sm">
            <h1 className="text-xl font-semibold tracking-tight">Something went wrong</h1>
            <p className="text-[#9aa0ae] text-[13px] leading-relaxed">
              {recovering
                ? "Clearing cached files and reloading…"
                : "The app hit an unexpected error. Reloading usually clears it up."}
            </p>
          </div>

          {!recovering && (
            <div className="flex flex-col gap-2.5 w-full max-w-xs">
              <button
                onClick={() => reset()}
                className="w-full h-10 rounded-lg bg-[#5566e8] hover:bg-[#6d7bec] text-white text-sm font-medium transition-colors"
              >
                Try again
              </button>
              <button
                onClick={handleManualReset}
                className="w-full h-10 rounded-lg border border-[#282c36] hover:border-[#3d4250] text-[#c7cbd4] text-sm font-medium transition-colors"
              >
                Clear cached data and reload
              </button>
            </div>
          )}

          {/* Surfaced so a failure on someone else's device can actually be
              diagnosed — the console isn't reachable on mobile. */}
          <details className="w-full max-w-xs text-left" open>
            <summary className="text-[#6b7280] text-xs cursor-pointer select-none">
              Error details
            </summary>
            <pre className="mt-2 p-3 bg-black/40 border border-[#282c36] rounded-lg text-[10px] font-mono text-[#e58b93] whitespace-pre-wrap break-words max-h-60 overflow-auto">
              {[
                error?.name && `${error.name}: ${error.message ?? ""}`,
                error?.digest && `digest: ${error.digest}`,
                error?.stack,
              ]
                .filter(Boolean)
                .join("\n\n") || "No error details available"}
            </pre>
          </details>
        </div>
      </body>
    </html>
  );
}
