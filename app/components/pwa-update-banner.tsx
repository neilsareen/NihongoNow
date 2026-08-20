"use client";

import { useEffect, useState } from "react";

export function PWAUpdateBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    // Only flag as an update if a SW was already in control when the page loaded.
    // (A fresh install also fires controllerchange, but there was no prior controller.)
    const hadController = !!navigator.serviceWorker.controller;
    if (!hadController) return;

    const onControllerChange = () => setShow(true);
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    return () =>
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
  }, []);

  if (!show) return null;

  return (
    // Sits above the tab bar rather than pinned to the very bottom edge, where
    // it used to cover the navigation on every screen that has one.
    <div className="fixed left-1/2 -translate-x-1/2 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[60] w-[calc(100%-2rem)] max-w-sm animate-enter">
      <div className="bg-surface-raised border border-line-strong rounded-xl shadow-lifted px-4 py-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium">Ikou has been updated</p>
          <p className="text-xs text-text-subtle mt-0.5">Refresh to load the latest version.</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="text-[13px] font-medium text-accent hover:text-accent-hover transition-colors shrink-0"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
