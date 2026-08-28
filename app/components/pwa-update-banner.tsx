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
    <div className="fixed left-1/2 -translate-x-1/2 bottom-[calc(5.5rem+var(--safe-b))] z-[60] w-[calc(100%-2rem)] max-w-sm animate-pop-in">
      <div className="bg-surface border border-line-strong rounded-card elevated px-4 py-3.5 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-[16px]">Ikou just updated</p>
          <p className="text-[13px] text-text-subtle mt-0.5 font-medium">Refresh for the latest.</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="font-display font-bold text-[16px] text-lime hover:brightness-110 transition-all shrink-0"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
