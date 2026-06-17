"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
          setError(data.error ?? "Could not start review session.");
        }
      })
      .catch(() => setError("Something went wrong. Please try again."));
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-gray-300">{error}</p>
        <a href="/dashboard" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
          Back to Dashboard
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4">
      <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      <p className="text-gray-500 text-sm">Finding your weakest items...</p>
    </div>
  );
}
