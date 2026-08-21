"use client";

import { useEffect, useState } from "react";
import { GraduationCap, X } from "lucide-react";
import { cn } from "@/lib/utils";

// A persistent strip shown on every page while a simulator account is looking
// at the app as a fresh beginner would. It lives in the root layout rather
// than the dashboard shell, since practice and lesson screens run outside
// that shell but still read and write the sandbox learner's data — the
// person driving needs the reminder there too, not just on the dashboard.
export function SimulationBanner() {
  const [isSimulating, setIsSimulating] = useState(false);
  const [ending, setEnding] = useState(false);

  useEffect(() => {
    fetch("/api/simulation")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setIsSimulating(!!d?.isSimulating))
      .catch(() => {});
  }, []);

  if (!isSimulating) return null;

  async function stop() {
    setEnding(true);
    await fetch("/api/simulation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "stop" }),
    });
    window.location.href = "/settings";
  }

  return (
    <div
      className={cn(
        "sticky top-0 z-50 flex items-center justify-center gap-2 px-4 py-2",
        "text-[12px] font-display font-bold uppercase tracking-wider"
      )}
      style={{ background: "hsl(var(--sun))", color: "hsl(var(--on-light))" }}
    >
      <GraduationCap className="w-4 h-4 shrink-0" strokeWidth={2.5} />
      <span>Viewing as a beginner — your real progress is untouched</span>
      <button
        onClick={stop}
        disabled={ending}
        className="ml-1 flex items-center gap-1 rounded-full bg-black/10 hover:bg-black/20 px-2 py-0.5 transition-colors disabled:opacity-60"
      >
        <X className="w-3 h-3" strokeWidth={3} />
        Exit
      </button>
    </div>
  );
}
