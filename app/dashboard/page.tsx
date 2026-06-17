import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

async function getDashboardData(userId: string) {
  const [profile, stats, progress, reviewsDue, inProgressLesson] = await Promise.all([
    prisma.userProfile.findUnique({ where: { id: userId } }),
    prisma.userStatistics.findUnique({ where: { userId } }),
    prisma.userProgress.findMany({ where: { userId } }),
    prisma.review.count({
      where: {
        userId,
        nextReviewAt: { lte: new Date() },
        srsLevel: { not: "MASTERED" },
      },
    }),
    prisma.lesson.findFirst({
      where: { userId, completedAt: null },
      orderBy: { generatedAt: "desc" },
      include: {
        items: { select: { answeredAt: true }, orderBy: { displayOrder: "asc" } },
      },
    }),
  ]);
  return { profile, stats, progress, reviewsDue, inProgressLesson };
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) redirect("/api/auth/signout");

  const { profile, stats, progress, reviewsDue, inProgressLesson } = await getDashboardData(
    user.id
  );

  if (!profile) redirect("/onboarding");

  const accuracy =
    stats && stats.totalReviews > 0
      ? Math.round((stats.correctReviews / stats.totalReviews) * 100)
      : 0;

  const progressMap = Object.fromEntries(progress.map((p) => [p.stage, p]));

  const answeredCount = inProgressLesson?.items.filter((i) => i.answeredAt !== null).length ?? 0;
  const unansweredCount = inProgressLesson?.items.filter((i) => i.answeredAt === null).length ?? 0;
  const showContinue = answeredCount > 0 && unansweredCount > 0;

  const progressItems = [
    { label: "Hiragana", stage: "HIRAGANA", total: 71, emoji: "あ" },
    { label: "Katakana", stage: "KATAKANA", total: 69, emoji: "ア" },
    { label: "Kanji", stage: "ESSENTIAL_KANJI", total: 1500, emoji: "漢" },
    { label: "Vocabulary", stage: "CORE_VOCAB", total: 2000, emoji: "📖" },
    { label: "Phrases", stage: "DAILY_CONVERSATION", total: 1000, emoji: "💬" },
  ];

  // Weighted travel readiness score (hiragana+katakana are gatekeepers, vocab+phrases drive fluency)
  const masteredByStage = (stage: string, total: number) => {
    const p = progressMap[stage];
    return Math.min(1, (p?.masteredItems ?? 0) / total);
  };
  const travelScore = Math.round(
    masteredByStage("HIRAGANA", 71) * 25 +
    masteredByStage("KATAKANA", 69) * 20 +
    masteredByStage("CORE_VOCAB", 2000) * 30 +
    masteredByStage("DAILY_CONVERSATION", 1000) * 20 +
    masteredByStage("ESSENTIAL_KANJI", 1500) * 5
  );

  const travelLevel =
    travelScore >= 90 ? { name: "Near-Native Traveler", icon: "🏯", color: "text-yellow-300", bar: "from-yellow-500 to-yellow-300", description: "Japan is practically your second home. You can handle any situation, read most signs, and connect deeply with locals." } :
    travelScore >= 70 ? { name: "Seasoned Traveler", icon: "✈️", color: "text-green-300", bar: "from-green-500 to-green-300", description: "You'll move through Japan with ease — trains, restaurants, shops, and conversations hold no mystery." } :
    travelScore >= 50 ? { name: "Confident Explorer", icon: "🗺️", color: "text-blue-300", bar: "from-blue-500 to-blue-300", description: "You can navigate most everyday situations. Getting around, ordering food, and asking for help are all within reach." } :
    travelScore >= 30 ? { name: "Tourist Ready", icon: "🎌", color: "text-purple-300", bar: "from-purple-500 to-purple-300", description: "You're prepared for a comfortable trip. You can read menus, ask directions, and handle common tourist situations." } :
    travelScore >= 15 ? { name: "Survival Traveler", icon: "🧭", color: "text-orange-300", bar: "from-orange-500 to-orange-300", description: "You can decode hiragana and katakana signs and manage basic exchanges. Tourist hotspots will be manageable." } :
    travelScore >= 5  ? { name: "Phonetic Foundation", icon: "📖", color: "text-red-300", bar: "from-red-500 to-red-300", description: "You know some characters and basics. Japan is exciting but you'll rely on translation apps for most things." } :
                        { name: "Complete Beginner", icon: "🌱", color: "text-gray-400", bar: "from-gray-600 to-gray-400", description: "Your journey is just starting! Keep at it — even a little Japanese goes a long way when visiting Japan." };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {getGreeting()}, {profile.displayName || "Learner"}
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            {reviewsDue > 0
              ? `${reviewsDue} review${reviewsDue !== 1 ? "s" : ""} due today`
              : "You're all caught up on reviews"}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-orange-400">
            🔥 {profile.currentStreak}
          </div>
          <div className="text-xs text-gray-500">day streak</div>
        </div>
      </div>

      <div className="bg-gray-900 border border-white/10 rounded-2xl px-5 py-3 flex items-center justify-between text-sm">
        <span className="text-gray-400">Daily goal</span>
        <span className="text-gray-300">0 min studied / {profile.studyGoalMinutes} min goal</span>
      </div>

      {showContinue && inProgressLesson ? (
        <Link
          href={`/lesson/${inProgressLesson.id}`}
          className="block bg-gradient-to-r from-purple-700 to-purple-500 hover:from-purple-600 hover:to-purple-400 rounded-2xl p-6 transition-all hover:scale-[1.01] active:scale-[0.99]"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xl font-bold">Continue Lesson</div>
              <div className="text-purple-200 text-sm mt-1">
                {answeredCount} done · {unansweredCount} remaining
              </div>
            </div>
            <div className="text-4xl opacity-80">▶</div>
          </div>
        </Link>
      ) : (
        <Link
          href="/lesson"
          className="block bg-gradient-to-r from-purple-700 to-purple-500 hover:from-purple-600 hover:to-purple-400 rounded-2xl p-6 transition-all hover:scale-[1.01] active:scale-[0.99]"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xl font-bold">Start Today&apos;s Lesson</div>
              <div className="text-purple-200 text-sm mt-1">
                {reviewsDue} reviews + new content · ~{profile.studyGoalMinutes} min
              </div>
            </div>
            <div className="text-4xl opacity-80">▶</div>
          </div>
        </Link>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "XP", value: profile.xp.toLocaleString(), icon: "⚡" },
          { label: "Level", value: profile.level, icon: "🎖️" },
          { label: "Accuracy", value: `${accuracy}%`, icon: "🎯" },
          { label: "Due", value: reviewsDue, icon: "📚" },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-gray-900 border border-white/10 rounded-xl p-4"
          >
            <div className="text-xl mb-1">{s.icon}</div>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-gray-500 text-xs">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 space-y-5">
        <h2 className="font-semibold">Mastery Progress</h2>
        {progressItems.map((item) => {
          const p = progressMap[item.stage];
          const mastered = p?.masteredItems ?? 0;
          const pct = Math.min(100, Math.round((mastered / item.total) * 100));
          return (
            <div key={item.label}>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="flex items-center gap-2 text-gray-300">
                  <span className="jp-char">{item.emoji}</span>
                  {item.label}
                </span>
                <span className="text-gray-500">
                  {mastered}/{item.total}
                </span>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold">Travel Readiness</h2>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{travelLevel.icon}</span>
          <div>
            <div className={`font-semibold text-base ${travelLevel.color}`}>{travelLevel.name}</div>
            <div className="text-gray-400 text-xs mt-0.5">{travelScore}% travel-ready</div>
          </div>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${travelLevel.bar} rounded-full transition-all duration-500`}
            style={{ width: `${travelScore}%` }}
          />
        </div>
        <p className="text-gray-400 text-sm leading-relaxed">{travelLevel.description}</p>
      </div>
    </div>
  );
}
