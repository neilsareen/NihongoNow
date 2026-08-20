"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { buttonStyles } from "@/app/components/ui";

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
          <h1 className="text-lg font-semibold tracking-tight">Couldn&apos;t build a lesson</h1>
          <p className="text-[13px] text-text-muted max-w-xs leading-relaxed">{error}</p>
        </div>
        <Link href="/dashboard" className={buttonStyles({ variant: "secondary" })}>
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <div className="w-6 h-6 border-2 border-line-strong border-t-accent rounded-full animate-spin" />
      <p className="text-[13px] text-text-subtle">Assembling your lesson…</p>
    </div>
  );
}
