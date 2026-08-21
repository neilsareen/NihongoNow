"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GraduationCap, LogOut, RotateCcw } from "lucide-react";
import { AVATAR_OPTIONS, cn, getAvatar } from "@/lib/utils";
import { Avatar, Card, SectionLabel, TopBar, buttonStyles, buttonVars } from "@/app/components/ui";
import { BottomNav } from "@/app/components/bottom-nav";
import { ThemeToggle } from "@/app/components/theme";
import { SilentModeSettings } from "@/app/components/silent-mode";

const GOAL_OPTIONS = [10, 15, 20, 30, 45, 60];

interface SandboxSummary {
  exists: boolean;
  itemsSeen: number;
  itemsMastered: number;
  lessonsCompleted: number;
}

interface SimulationStatus {
  canSimulate: boolean;
  isSimulating: boolean;
  summary?: SandboxSummary;
}

export default function SettingsPage() {
  const router = useRouter();

  const [studyGoal, setStudyGoal] = useState<number | null>(null);
  const [avatarKey, setAvatarKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [simStatus, setSimStatus] = useState<SimulationStatus | null>(null);
  const [simBusy, setSimBusy] = useState(false);

  function refreshSimStatus() {
    fetch("/api/simulation")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setSimStatus(d));
  }

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((d) => {
        setStudyGoal(d.studyGoalMinutes ?? 20);
        setAvatarKey(getAvatar(d.avatarUrl).key);
      });
    refreshSimStatus();
  }, []);

  async function handleSimulationAction(action: "start" | "stop" | "reset") {
    setSimBusy(true);
    const res = await fetch("/api/simulation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) setSimStatus(await res.json());
    setSimBusy(false);
    if (action === "start") router.push("/dashboard");
  }

  async function handleGoalChange(goal: number) {
    setStudyGoal(goal);
    setSaving(true);
    setSaved(false);
    await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studyGoalMinutes: goal }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleAvatarChange(key: string) {
    setAvatarKey(key);
    setSaving(true);
    setSaved(false);
    await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatarUrl: key }),
    });
    setSaving(false);
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="min-h-screen">
      <TopBar
        title="Settings"
        trailing={
          // A single quiet status slot, rather than a badge that jumps into the
          // heading row and shifts the layout as it appears.
          <span
            className="font-display text-[11px] font-bold uppercase tracking-wider text-lime"
            aria-live="polite"
          >
            {saving ? "…" : saved ? "Saved" : ""}
          </span>
        }
      />

      <main className="max-w-lg mx-auto px-4 py-8 space-y-8 pb-[calc(6rem+env(safe-area-inset-bottom))]">
        <section className="space-y-3">
          <div className="space-y-1">
            <SectionLabel>Your mark</SectionLabel>
            <p className="text-[14px] text-text-muted font-medium">
              Pick a kanji. It shows up wherever you do.
            </p>
          </div>
          <Card className="p-4">
            <div className="grid grid-cols-5 gap-3">
              {AVATAR_OPTIONS.map((a) => {
                const isOn = avatarKey === a.key;
                return (
                  <button
                    key={a.key}
                    onClick={() => handleAvatarChange(a.key)}
                    title={`${a.label} — ${a.meaning}`}
                    aria-label={`${a.label} (${a.meaning})`}
                    aria-pressed={isOn}
                    className={cn(
                      "aspect-square rounded-full grid place-items-center transition-all",
                      // Unselected marks stay in full colour — dimming them to
                      // near-invisible turned the palette to mud. Selection is
                      // carried by a ring in the mark's own hue instead.
                      isOn ? "scale-105" : "opacity-80 hover:opacity-100"
                    )}
                    style={
                      isOn
                        ? { boxShadow: `0 0 0 3px hsl(${a.tone}), 0 0 0 6px hsl(var(--ink))` }
                        : undefined
                    }
                  >
                    <Avatar avatar={a} size={44} className="rounded-full" />
                  </button>
                );
              })}
            </div>
          </Card>
        </section>

        <section className="space-y-3">
          <div className="space-y-1">
            <SectionLabel>Daily goal</SectionLabel>
            <p className="text-[14px] text-text-muted leading-relaxed font-medium">
              Lessons run about ten minutes, so this sets how many to aim for.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {GOAL_OPTIONS.map((min) => {
              const isOn = studyGoal === min;
              return (
                <button
                  key={min}
                  onClick={() => handleGoalChange(min)}
                  aria-pressed={isOn}
                  className={cn(
                    "h-14 rounded-tile border-2 font-display font-bold text-[15px] tnum card-ledge",
                    "transition-colors duration-150",
                    isOn
                      ? "border-lime bg-lime text-on-light"
                      : "border-line bg-surface text-text-muted hover:border-line-strong hover:text-text"
                  )}
                >
                  {min} min
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-3">
          <div className="space-y-1">
            <SectionLabel>Silent mode</SectionLabel>
            <p className="text-[14px] text-text-muted leading-relaxed font-medium">
              For a quiet carriage or a sleeping flatmate. It also sits in the header
              of every lesson, for when the room goes quiet mid-session.
            </p>
          </div>
          <SilentModeSettings />
        </section>

        <section className="space-y-3">
          <div className="space-y-1">
            <SectionLabel>Appearance</SectionLabel>
            <p className="text-[14px] text-text-muted leading-relaxed font-medium">
              Dark for evening drills, light for a bright train platform.
            </p>
          </div>
          <ThemeToggle />
        </section>

        {simStatus?.canSimulate && (
          <section className="space-y-3">
            <div className="space-y-1">
              <SectionLabel>Beginner simulation</SectionLabel>
              <p className="text-[14px] text-text-muted leading-relaxed font-medium">
                See the app exactly as a brand-new learner would — the welcome
                and script intros, locked kanji, everything at zero. Your own
                progress is never touched.
              </p>
            </div>
            <Card className="p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-full grid place-items-center shrink-0"
                  style={{ background: "hsl(var(--sun) / 0.18)", color: "hsl(var(--sun))" }}
                >
                  <GraduationCap className="w-5 h-5" strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-[15px]">
                    {simStatus.isSimulating ? "Simulation is on" : "Simulate a beginner"}
                  </p>
                  {simStatus.summary?.exists ? (
                    <p className="text-[13px] text-text-subtle tnum">
                      {simStatus.summary.itemsSeen} seen · {simStatus.summary.itemsMastered} mastered ·{" "}
                      {simStatus.summary.lessonsCompleted} lessons done
                    </p>
                  ) : (
                    <p className="text-[13px] text-text-subtle">Not started yet</p>
                  )}
                </div>
              </div>

              <div className="flex gap-2.5">
                <button
                  onClick={() => handleSimulationAction(simStatus.isSimulating ? "stop" : "start")}
                  disabled={simBusy}
                  className={buttonStyles({
                    variant: simStatus.isSimulating ? "secondary" : "primary",
                    full: true,
                  })}
                  style={buttonVars(simStatus.isSimulating ? "secondary" : "primary")}
                >
                  {simStatus.isSimulating ? "Exit simulation" : "Start simulation"}
                </button>
                {simStatus.summary?.exists && (
                  <button
                    onClick={() => {
                      if (confirm("Reset the simulated beginner back to day one? This clears its lessons and progress.")) {
                        handleSimulationAction("reset");
                      }
                    }}
                    disabled={simBusy}
                    aria-label="Reset simulated progress"
                    title="Reset simulated progress"
                    className={buttonStyles({ variant: "secondary" })}
                    style={buttonVars("secondary")}
                  >
                    <RotateCcw className="w-[18px] h-[18px]" strokeWidth={2.5} />
                  </button>
                )}
              </div>
            </Card>
          </section>
        )}

        <section className="space-y-3">
          <SectionLabel>Account</SectionLabel>
          <a
            href="/api/auth/signout"
            className={buttonStyles({ variant: "secondary", full: true, size: "lg", className: "text-rose" })}
            style={buttonVars("secondary")}
          >
            <LogOut className="w-[18px] h-[18px]" strokeWidth={2.5} />
            Sign out
          </a>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
