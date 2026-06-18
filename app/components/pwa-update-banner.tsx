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
    <div className="fixed bottom-4 left-4 right-4 max-w-lg mx-auto bg-indigo-600 text-white rounded-xl p-4 flex items-center justify-between gap-3 z-50 shadow-xl">
      <div>
        <p className="text-sm font-semibold">App updated</p>
        <p className="text-xs opacity-80 mt-0.5">Refresh to get the latest version</p>
      </div>
      <button
        onClick={() => window.location.reload()}
        className="text-xs bg-white text-indigo-600 font-semibold px-3 py-1.5 rounded-lg shrink-0"
      >
        Refresh
      </button>
    </div>
  );
}
