"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { buttonStyles } from "@/app/components/ui";

export default function WeakestReviewPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/lesson/weakest", { method: "POST" })
      .then((r) => r.json())
      .then((data) => {
        if (data.lessonId) {
          router.replace(`/lesson/${data.lessonId}`);
        } else {
          setError(data.error ?? "Could not start a review session.");
        }
      })
      .catch(() => setError("Something went wrong. Please try again."));
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5 px-6 text-center">
        <p className="text-[13px] text-text-muted max-w-xs leading-relaxed">{error}</p>
        <Link href="/dashboard" className={buttonStyles({ variant: "secondary" })}>
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <div className="w-6 h-6 border-2 border-line-strong border-t-accent rounded-full animate-spin" />
      <p className="text-[13px] text-text-subtle">Finding your weakest items…</p>
    </div>
  );
}
