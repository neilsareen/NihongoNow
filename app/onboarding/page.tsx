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
  const router = useRouter();

  async function handleComplete() {
    if (!selectedLevel) return;
    setLoading(true);
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
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full space-y-8">
        <div className="text-center text-white">
          <Link href="/" className="text-4xl jp-char block mb-2">
            日本語
          </Link>
          <h1 className="text-2xl font-bold">
            Let&apos;s personalize your learning
          </h1>
          <p className="text-purple-200 mt-2 text-sm">
            We&apos;ll build a custom path just for you
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-white font-semibold">
            What&apos;s your current Japanese level?
          </h2>
          {LEVELS.map((level) => (
            <button
              key={level.id}
              onClick={() => setSelectedLevel(level.id)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                selectedLevel === level.id
                  ? "bg-purple-600/40 border-purple-400"
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
          <h2 className="text-white font-semibold">Daily study goal</h2>
          <div className="flex gap-3">
            {[10, 15, 20, 30].map((min) => (
              <button
                key={min}
                onClick={() => setStudyGoal(min)}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  studyGoal === min
                    ? "bg-purple-600 border-purple-400 text-white"
                    : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
                }`}
              >
                {min}m
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleComplete}
          disabled={!selectedLevel || loading}
          className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          {loading ? "Setting up your account..." : "Start Learning →"}
        </button>
      </div>
    </div>
  );
}
