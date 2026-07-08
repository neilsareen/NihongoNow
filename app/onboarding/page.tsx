"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const LEVELS = [
  {
    id: "complete_beginner",
    label: "Complete Beginner",
    desc: "I know zero Japanese",
    emoji: "🌱",
  },
  {
    id: "know_hiragana",
    label: "Know Hiragana",
    desc: "I can read hiragana",
    emoji: "🌿",
  },
  {
    id: "know_kana",
    label: "Know Kana",
    desc: "I know hiragana + katakana",
    emoji: "🌳",
  },
  {
    id: "some_kanji",
    label: "Some Kanji",
    desc: "I know some kanji and vocabulary",
    emoji: "🎋",
  },
  {
    id: "intermediate",
    label: "Intermediate",
    desc: "JLPT N4–N3 level",
    emoji: "⛩️",
  },
];

export default function OnboardingPage() {
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [studyGoal, setStudyGoal] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleComplete() {
    if (!selectedLevel) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nativeLevel: selectedLevel,
          studyGoalMinutes: studyGoal,
        }),
      });
      if (res.ok) {
        router.push("/dashboard");
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || `Error ${res.status} — please try again`);
        setLoading(false);
      }
    } catch (e) {
      setError("Network error — please try again");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 bg-ambient-glow flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full space-y-8">
        <div className="text-center text-white">
          <Link href="/" className="text-5xl jp-char block mb-3 animate-float">
            日本語
          </Link>
          <h1 className="font-display text-2xl font-bold">
            Let&apos;s personalize your learning
          </h1>
          <p className="text-gray-400 mt-2 text-sm">
            We&apos;ll build a custom path just for you ✨
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="font-display text-white font-semibold">
            What&apos;s your current Japanese level?
          </h2>
          {LEVELS.map((level) => (
            <button
              key={level.id}
              onClick={() => setSelectedLevel(level.id)}
              className={`w-full text-left p-4 rounded-2xl border transition-all ${
                selectedLevel === level.id
                  ? "bg-sunset-soft border-orange-400/60 shadow-glow-warm scale-[1.01]"
                  : "bg-white/5 border-white/10 hover:bg-white/10"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{level.emoji}</span>
                <div>
                  <div className="font-medium text-white">{level.label}</div>
                  <div className="text-sm text-gray-400">{level.desc}</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <h2 className="font-display text-white font-semibold">Daily study goal</h2>
          <div className="flex gap-3">
            {[10, 15, 20, 30].map((min) => (
              <button
                key={min}
                onClick={() => setStudyGoal(min)}
                className={`flex-1 py-2.5 rounded-2xl border text-sm font-medium transition-all ${
                  studyGoal === min
                    ? "bg-sunset border-transparent text-white shadow-glow-warm"
                    : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
                }`}
              >
                {min}m
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/30 text-red-200 rounded-2xl p-3 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleComplete}
          disabled={!selectedLevel || loading}
          className="w-full bg-sunset disabled:opacity-40 text-white font-display font-semibold py-3 rounded-full shadow-glow-warm hover:scale-[1.015] active:scale-[0.98] transition-transform"
        >
          {loading ? "Setting up your account..." : "Start Learning →"}
        </button>
      </div>
    </div>
  );
}
