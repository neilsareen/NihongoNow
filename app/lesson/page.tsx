"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { buttonStyles, buttonVars } from "@/app/components/ui";

export default function LessonPage() {
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
      }
    }
    startLesson();
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5 px-6 text-center">
        <div className="space-y-1.5">
          <h1 className="text-xl">Couldn&apos;t build a lesson</h1>
          <p className="text-[14px] text-text-muted max-w-xs leading-relaxed font-medium">{error}</p>
        </div>
        <Link href="/dashboard" className={buttonStyles({ variant: "secondary" })}
          style={buttonVars("secondary")}>
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <div className="w-8 h-8 border-4 border-surface-raised border-t-coral rounded-full animate-spin" />
      <p className="text-[14px] text-text-subtle font-medium">Assembling your lesson…</p>
    </div>
  );
}
