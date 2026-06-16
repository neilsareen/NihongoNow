"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

const GOAL_OPTIONS = [10, 15, 20, 30, 45, 60];

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [studyGoal, setStudyGoal] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((d) => setStudyGoal(d.studyGoalMinutes ?? 20));
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

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-white/10 bg-gray-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="font-bold text-lg flex items-center gap-2">
            <span className="jp-char text-purple-400 text-xl">日</span>
            <span>Nihongo Now</span>
          </Link>
        </div>
      </nav>
      <main className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold">Settings</h1>

        <div className="bg-gray-900 border border-white/10 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-300">Daily Study Goal</h2>
            {saving && <span className="text-xs text-gray-500">Saving…</span>}
            {saved && <span className="text-xs text-green-400">Saved ✓</span>}
          </div>
          <p className="text-sm text-gray-500">
            Set a daily target to track your habit. Lessons are always ~10 minutes — your goal determines how many sessions to aim for.
          </p>
          <div className="grid grid-cols-3 gap-2">
            {GOAL_OPTIONS.map((min) => (
              <button
                key={min}
                onClick={() => handleGoalChange(min)}
                className={`py-2.5 rounded-lg border text-sm font-medium transition-all ${
                  studyGoal === min
                    ? "bg-purple-600 border-purple-400 text-white"
                    : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
                }`}
              >
                {min} min/day
              </button>
            ))}
          </div>
        </div>

        <div className="bg-gray-900 border border-white/10 rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-gray-300">Account</h2>
          <a
            href="/api/auth/signout"
            className="block w-full text-center bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 font-medium py-2.5 rounded-lg transition-colors"
          >
            Sign Out
          </a>
        </div>
      </main>
    </div>
  );
}
