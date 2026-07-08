"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Stashes the browser's IANA timezone in a cookie so server components
// (which otherwise only know the server's own, usually UTC, clock) can
// compute "today" using the visitor's actual local day.
export function TimezoneSync() {
  const router = useRouter();

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const existing = document.cookie
      .split("; ")
      .find((c) => c.startsWith("tz="))
      ?.split("=")[1];
    if (existing !== tz) {
      document.cookie = `tz=${tz}; path=/; max-age=31536000; SameSite=Lax`;
      router.refresh();
    }
  }, [router]);

  return null;
}
