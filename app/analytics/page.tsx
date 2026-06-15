import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profile, stats, lessonsCompleted] = await Promise.all([
    prisma.userProfile.findUnique({ where: { id: user.id } }),
    prisma.userStatistics.findUnique({ where: { userId: user.id } }),
    prisma.lesson.count({
      where: { userId: user.id, completedAt: { not: null } },
    }),
  ]);

  if (!profile) redirect("/onboarding");

  const accuracy =
    stats && stats.totalReviews > 0
      ? Math.round((stats.correctReviews / stats.totalReviews) * 100)
      : 0;

  const studyHours = Math.round((stats?.totalStudyTime ?? 0) / 3600 * 10) / 10;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-white/10 bg-gray-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="font-bold text-lg flex items-center gap-2">
            <span className="jp-char text-purple-400 text-xl">日</span>
            <span>Nihongo Now</span>
          </Link>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold">Your Progress</h1>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: "Total Reviews", value: stats?.totalReviews ?? 0, icon: "📝" },
            { label: "Correct Answers", value: stats?.correctReviews ?? 0, icon: "✅" },
            { label: "Accuracy", value: `${accuracy}%`, icon: "🎯" },
            { label: "Lessons Done", value: lessonsCompleted, icon: "📚" },
            { label: "Study Hours", value: `${studyHours}h`, icon: "⏱️" },
            { label: "Day Streak", value: `${profile.currentStreak} 🔥`, icon: "🔥" },
          ].map((s) => (
            <div key={s.label} className="bg-gray-900 border border-white/10 rounded-xl p-4">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-gray-500 text-sm">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="bg-gray-900 border border-white/10 rounded-xl p-6 text-center text-gray-500">
          <p>Detailed charts coming soon</p>
        </div>
      </main>
    </div>
  );
}
