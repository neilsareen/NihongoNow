"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { GraduationCap, LogOut, RotateCcw, Upload, X } from "lucide-react";
import { AVATAR_OPTIONS, MAX_DISPLAY_NAME_LENGTH, cn, getAvatar } from "@/lib/utils";
import { Avatar, Card, SectionLabel, TopBar, buttonStyles, buttonVars } from "@/app/components/ui";
import { Field } from "@/app/components/field";
import { BottomNav } from "@/app/components/bottom-nav";
import { ThemeToggle } from "@/app/components/theme";
import { SilentModeSettings } from "@/app/components/silent-mode";
import { clearSeenTrackIntros } from "@/lib/track-intros";

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
  // `savedName` is the name on the profile, `name` what is in the box; they
  // differ only while the learner is mid-edit. Null until the profile lands,
  // which is also what holds the field disabled.
  const [name, setName] = useState("");
  const [savedName, setSavedName] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [avatarValue, setAvatarValue] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const avatar = getAvatar(avatarValue);

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
        setAvatarValue(d.avatarUrl ?? null);
        setName(d.displayName ?? "");
        setSavedName(d.displayName ?? "");
      });
    refreshSimStatus();
  }, []);

  async function handleSimulationAction(action: "start" | "stop" | "reset") {
    setSimBusy(true);
    // Day one means day one: the sandbox's dismissed track intros are kept in
    // this browser rather than on its row, so resetting has to clear them too
    // or the simulated beginner would silently skip them.
    if (action === "reset") clearSeenTrackIntros("sim");
    const res = await fetch("/api/simulation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) setSimStatus(await res.json());
    setSimBusy(false);
    if (action === "start") router.push("/dashboard");
  }

  // Committed on blur and on Enter rather than per keystroke: the same quiet
  // "Saved" slot the other settings use, without a request for every letter.
  async function handleNameCommit() {
    const trimmed = name.trim();
    if (savedName === null || trimmed === savedName) {
      setName(trimmed);
      setNameError(null);
      return;
    }
    if (!trimmed) {
      // The old name stays on the profile; the box keeps what they typed so
      // they can fix it rather than having the edit silently reverted.
      setNameError("Your name can't be empty");
      return;
    }

    setName(trimmed);
    setNameError(null);
    setSaving(true);
    setSaved(false);
    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: trimmed }),
    });
    setSaving(false);
    if (res.ok) {
      const profile = await res.json();
      setSavedName(profile.displayName ?? "");
      setName(profile.displayName ?? "");
      setSaved(true);
      // The greeting and the header are server-rendered, so they only pick up
      // the new name once this route's data is refetched.
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    } else {
      const body = await res.json().catch(() => null);
      setNameError(body?.error ?? "Couldn't save that name. Try again.");
    }
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
    setAvatarValue(key);
    setUploadError(null);
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

  async function handlePhotoSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploadError(null);
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/user/avatar", { method: "POST", body: formData });
    if (res.ok) {
      const profile = await res.json();
      setAvatarValue(profile.avatarUrl);
      router.refresh();
    } else {
      const body = await res.json().catch(() => null);
      setUploadError(body?.error ?? "Couldn't upload that photo. Try again.");
    }
    setUploading(false);
  }

  async function handleRemovePhoto() {
    setUploadError(null);
    setUploading(true);
    const res = await fetch("/api/user/avatar", { method: "DELETE" });
    if (res.ok) {
      const profile = await res.json();
      setAvatarValue(profile.avatarUrl);
      router.refresh();
    }
    setUploading(false);
  }

  return (
    <div className="min-h-screen">
      <TopBar
        title="Settings"
        trailing={
          // A single quiet status slot, rather than a badge that jumps into the
          // heading row and shifts the layout as it appears.
          <span
            className="font-display text-[12px] font-bold uppercase tracking-wider text-lime"
            aria-live="polite"
          >
            {saving ? "…" : saved ? "Saved" : ""}
          </span>
        }
      />

      <main className="max-w-lg mx-auto px-4 py-8 space-y-8 pb-[calc(6rem+var(--safe-b))]">
        <section className="space-y-3">
          <div className="space-y-1">
            <SectionLabel>Your name</SectionLabel>
            <p className="text-[16px] text-text-muted leading-relaxed font-medium">
              What the app calls you. Signing in with Google brings over the name
              on that account — write whatever you actually go by over it.
            </p>
          </div>
          <Card className="p-4 space-y-2">
            <Field
              id="display-name"
              label="First name"
              type="text"
              autoComplete="given-name"
              value={name}
              maxLength={MAX_DISPLAY_NAME_LENGTH}
              disabled={savedName === null}
              placeholder="Your name"
              aria-invalid={nameError ? true : undefined}
              aria-describedby="display-name-note"
              onChange={(e) => {
                setName(e.target.value);
                setNameError(null);
              }}
              onBlur={handleNameCommit}
              onKeyDown={(e) => {
                // Enter commits through the same blur path, so a phone keyboard's
                // "done" and tapping away behave identically.
                if (e.key === "Enter") e.currentTarget.blur();
              }}
            />
            {nameError ? (
              <p id="display-name-note" role="alert" className="text-[15px] text-rose font-medium">
                {nameError}
              </p>
            ) : (
              <p id="display-name-note" className="text-[15px] text-text-subtle font-medium">
                The dashboard greets you as {name.trim() || "Learner"}
                <span className="jp">さん</span>.
              </p>
            )}
          </Card>
        </section>

        <section className="space-y-3">
          <div className="space-y-1">
            <SectionLabel>Your mark</SectionLabel>
            <p className="text-[16px] text-text-muted font-medium">
              Upload a photo, or pick a character. It shows up wherever you do.
            </p>
          </div>

          <Card className="p-4 flex items-center gap-4">
            <Avatar avatar={avatar} size={56} className="rounded-full" />
            <div className="flex-1 min-w-0 space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handlePhotoSelected}
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className={buttonStyles({ variant: "secondary", size: "sm" })}
                  style={buttonVars("secondary")}
                >
                  <Upload className="w-4 h-4" strokeWidth={2.5} />
                  {uploading ? "Uploading…" : "Upload a photo"}
                </button>
                {avatar.type === "image" && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    disabled={uploading}
                    aria-label="Remove photo"
                    title="Remove photo"
                    className={buttonStyles({ variant: "ghost", size: "sm" })}
                  >
                    <X className="w-4 h-4" strokeWidth={2.5} />
                    Remove
                  </button>
                )}
              </div>
              {uploadError && <p className="text-[15px] text-rose font-medium">{uploadError}</p>}
            </div>
          </Card>

          <Card className="p-4">
            <div className="grid grid-cols-5 gap-3">
              {AVATAR_OPTIONS.map((a) => {
                const isOn = avatar.type === "preset" && avatar.key === a.key;
                return (
                  <button
                    key={a.key}
                    onClick={() => handleAvatarChange(a.key)}
                    title={`${a.label} — ${a.caption}`}
                    aria-label={`${a.label} (${a.caption})`}
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
            <p className="text-[16px] text-text-muted leading-relaxed font-medium">
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
                    "h-14 rounded-tile border font-display font-bold text-[17px] tnum elevated",
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
            <p className="text-[16px] text-text-muted leading-relaxed font-medium">
              For a quiet carriage or a sleeping flatmate. It also sits in the header
              of every lesson, for when the room goes quiet mid-session.
            </p>
          </div>
          <SilentModeSettings />
        </section>

        <section className="space-y-3">
          <div className="space-y-1">
            <SectionLabel>Appearance</SectionLabel>
            <p className="text-[16px] text-text-muted leading-relaxed font-medium">
              Dark for evening drills, light for a bright train platform.
            </p>
          </div>
          <ThemeToggle />
        </section>

        {simStatus?.canSimulate && (
          <section className="space-y-3">
            <div className="space-y-1">
              <SectionLabel>Beginner simulation</SectionLabel>
              <p className="text-[16px] text-text-muted leading-relaxed font-medium">
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
                  <p className="font-display font-bold text-[17px]">
                    {simStatus.isSimulating ? "Simulation is on" : "Simulate a beginner"}
                  </p>
                  {simStatus.summary?.exists ? (
                    <p className="text-[15px] text-text-subtle tnum">
                      {simStatus.summary.itemsSeen} seen · {simStatus.summary.itemsMastered} mastered ·{" "}
                      {simStatus.summary.lessonsCompleted} lessons done
                    </p>
                  ) : (
                    <p className="text-[15px] text-text-subtle">Not started yet</p>
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
