"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { AVATAR_OPTIONS, cn, getAvatar } from "@/lib/utils";
import { Avatar, Card, SectionLabel, TopBar, buttonStyles } from "@/app/components/ui";
import { BottomNav } from "@/app/components/bottom-nav";

const GOAL_OPTIONS = [10, 15, 20, 30, 45, 60];

export default function SettingsPage() {
  const router = useRouter();

  const [studyGoal, setStudyGoal] = useState<number | null>(null);
  const [avatarKey, setAvatarKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((d) => {
        setStudyGoal(d.studyGoalMinutes ?? 20);
        setAvatarKey(getAvatar(d.avatarUrl).key);
      });
  }, []);

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
        backLabel="Dashboard"
        trailing={
          // A single quiet status slot, rather than a badge that jumps into the
          // heading row and shifts the layout as it appears.
          <span className="text-[11px] text-text-subtle" aria-live="polite">
            {saving ? "Saving…" : saved ? "Saved" : ""}
          </span>
        }
      />

      <main className="max-w-lg mx-auto px-4 py-8 space-y-8 pb-[calc(6rem+env(safe-area-inset-bottom))]">
        <section className="space-y-3">
          <div className="space-y-1">
            <SectionLabel>Avatar</SectionLabel>
            <p className="text-[13px] text-text-muted">
              Pick a kanji to represent you.
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
                      "aspect-square rounded-xl grid place-items-center border",
                      "transition-colors duration-150 ease-swift",
                      isOn
                        ? "border-accent bg-accent/[0.08]"
                        : "border-transparent hover:bg-surface-raised"
                    )}
                  >
                    <Avatar avatar={a} size={38} />
                  </button>
                );
              })}
            </div>
          </Card>
        </section>

        <section className="space-y-3">
          <div className="space-y-1">
            <SectionLabel>Daily study goal</SectionLabel>
            <p className="text-[13px] text-text-muted leading-relaxed">
              A target to track the habit against. Lessons are roughly ten minutes
              each, so the goal sets how many to aim for.
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
                    "h-11 rounded-lg border text-sm font-medium tnum",
                    "transition-colors duration-150 ease-swift",
                    isOn
                      ? "border-accent bg-accent text-accent-fg"
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
          <SectionLabel>Account</SectionLabel>
          <a href="/api/auth/signout" className={buttonStyles({ variant: "danger", full: true })}>
            <LogOut className="w-4 h-4" strokeWidth={1.75} />
            Sign out
          </a>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
