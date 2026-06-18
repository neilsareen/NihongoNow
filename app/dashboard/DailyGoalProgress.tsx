"use client";

import { useEffect, useState } from "react";

interface Props {
  goalMinutes: number;
}

export default function DailyGoalProgress({ goalMinutes }: Props) {
  const [todayMinutes, setTodayMinutes] = useState<number | null>(null);

  useEffect(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    fetch(`/api/user/today-minutes?from=${encodeURIComponent(todayStart.toISOString())}`)
      .then((r) => r.json())
      .then((data) => setTodayMinutes(data.todayMinutes ?? 0));
  }, []);

  const minutes = todayMinutes ?? 0;
  const goalPct = Math.min(100, goalMinutes > 0 ? Math.round((minutes / goalMinutes) * 100) : 0);

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-white rounded-full transition-all duration-500"
          style={{ width: `${goalPct}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 shrink-0">
        {todayMinutes === null ? "—" : minutes} / {goalMinutes} min today
      </span>
    </div>
  );
}
