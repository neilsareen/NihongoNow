"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LessonPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function startLesson() {
      try {
        const res = await fetch("/api/lesson", { method: "POST" });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Failed to generate lesson");
        }
        const lesson = await res.json();
        router.push(`/lesson/${lesson.id}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
        setLoading(false);
      }
    }
    startLesson();
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-red-400 font-medium">{error}</div>
          <Link href="/dashboard" className="text-purple-400 hover:underline text-sm">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="text-4xl jp-char animate-pulse">日</div>
        <div className="text-gray-400">Preparing your lesson...</div>
      </div>
    </div>
  );
}
