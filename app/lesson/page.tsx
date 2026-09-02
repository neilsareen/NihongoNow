"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { buttonStyles, buttonVars } from "@/app/components/ui";

interface LessonError {
  message: string;
  /** What actually went wrong, when the API could say — see lib/lesson-errors. */
  detail?: string;
}

export default function LessonPage() {
  const [error, setError] = useState<LessonError | null>(null);
  const [attempt, setAttempt] = useState(0);
  const router = useRouter();

  const retry = useCallback(() => {
    setError(null);
    setAttempt((n) => n + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function startLesson() {
      try {
        const res = await fetch("/api/lesson", { method: "POST" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw Object.assign(new Error(data.error ?? "Failed to generate lesson"), {
            detail: typeof data.detail === "string" ? data.detail : undefined,
          });
        }
        if (!cancelled) router.push(`/lesson/${data.id}`);
      } catch (e) {
        if (cancelled) return;
        setError({
          message: e instanceof Error ? e.message : "Something went wrong",
          detail: (e as { detail?: string })?.detail,
        });
      }
    }
    startLesson();
    return () => {
      cancelled = true;
    };
  }, [router, attempt]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5 px-6 text-center">
        <div className="space-y-1.5">
          <h1 className="text-xl">Couldn&apos;t build a lesson</h1>
          <p className="text-[16px] text-text-muted max-w-xs leading-relaxed font-medium">{error.message}</p>
          {error.detail && (
            <p className="text-[13px] text-text-subtle max-w-xs leading-relaxed pt-1">{error.detail}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={retry} className={buttonStyles({ variant: "primary" })}
            style={buttonVars("primary")}>
            Try again
          </button>
          <Link href="/dashboard" className={buttonStyles({ variant: "secondary" })}
            style={buttonVars("secondary")}>
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <div className="w-8 h-8 border-4 border-surface-raised border-t-coral rounded-full animate-spin" />
      <p className="text-[16px] text-text-subtle font-medium">Assembling your lesson…</p>
    </div>
  );
}
