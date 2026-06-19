import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

async function getDashboardData(userId: string) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [profile, stats, progress, reviewsDue, inProgressLesson, todayStudy, todayLessons] = await Promise.all([
    prisma.userProfile.findUnique({ where: { id: userId } }),
    prisma.userStatistics.findUnique({ where: { userId } }),
    prisma.userProgress.findMany({ where: { userId } }),
    prisma.review.count({
      where: { userId, nextReviewAt: { lte: new Date() }, srsLevel: { not: "MASTERED" } },
    }),
    prisma.lesson.findFirst({
      where: { userId, completedAt: null },
      orderBy: { generatedAt: "desc" },
      include: { items: { select: { answeredAt: true }, orderBy: { displayOrder: "asc" } } },
    }),
    prisma.lesson.aggregate({
      where: { userId, completedAt: { gte: todayStart }, durationSeconds: { not: null } },
      _sum: { durationSeconds: true },
    }),
    prisma.lesson.count({ where: { userId, completedAt: { gte: todayStart } } }),
  ]);
  return { profile, stats, progress, reviewsDue, inProgressLesson, todayStudy, todayLessons };
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function lessonOrdinal(n: number): string {
  if (n === 1) return "Today's Lesson";
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `Today's ${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]} Lesson`;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/api/auth/signout");

  const { profile, stats, progress, reviewsDue, inProgressLesson, todayStudy, todayLessons } = await getDashboardData(user.id);
  if (!profile) redirect("/onboarding");

  const accuracy = stats && stats.totalReviews > 0
    ? Math.round((stats.correctReviews / stats.totalReviews) * 100) : 0;

  const progressMap = Object.fromEntries(progress.map((p) => [p.stage, p]));

  const answeredCount = inProgressLesson?.items.filter((i) => i.answeredAt !== null).length ?? 0;
  const unansweredCount = inProgressLesson?.items.filter((i) => i.answeredAt === null).length ?? 0;
  const showContinue = answeredCount > 0 && unansweredCount > 0;

  const todayMinutes = Math.round((todayStudy._sum.durationSeconds ?? 0) / 60);
  const goalMinutes = profile.studyGoalMinutes;
  const goalPct = Math.min(100, goalMinutes > 0 ? Math.round((todayMinutes / goalMinutes) * 100) : 0);

  const progressItems = [
    { label: "Hiragana", stage: "HIRAGANA", total: 71, emoji: "あ" },
    { label: "Katakana", stage: "KATAKANA", total: 69, emoji: "ア" },
    { label: "Kanji", stage: "ESSENTIAL_KANJI", total: 1500, emoji: "漢" },
    { label: "Vocabulary", stage: "CORE_VOCAB", total: 2000, emoji: "📖" },
    { label: "Phrases", stage: "DAILY_CONVERSATION", total: 1000, emoji: "💬" },
  ];

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
    travelScore >= 90 ? { name: "Near-Native Traveler", color: "text-yellow-300", bar: "from-yellow-500 to-yellow-300", description: "Japan is practically your second home. You can handle any situation, read most signs, and connect deeply with locals." } :
    travelScore >= 70 ? { name: "Seasoned Traveler", color: "text-green-300", bar: "from-green-500 to-green-300", description: "You'll move through Japan with ease — trains, restaurants, shops, and conversations hold no mystery." } :
    travelScore >= 50 ? { name: "Confident Explorer", color: "text-blue-300", bar: "from-blue-500 to-blue-300", description: "You can navigate most everyday situations. Getting around, ordering food, and asking for help are all within reach." } :
    travelScore >= 30 ? { name: "Tourist Ready", color: "text-purple-300", bar: "from-purple-500 to-purple-300", description: "You're prepared for a comfortable trip. You can read menus, ask directions, and handle common tourist situations." } :
    travelScore >= 15 ? { name: "Survival Traveler", color: "text-orange-300", bar: "from-orange-500 to-orange-300", description: "You can decode hiragana and katakana signs and manage basic exchanges. Tourist hotspots will be manageable." } :
    travelScore >= 5  ? { name: "Phonetic Foundation", color: "text-red-300", bar: "from-red-500 to-red-300", description: "You know some characters and basics. Japan is exciting but you'll rely on translation apps for most things." } :
                        { name: "Complete Beginner", color: "text-gray-400", bar: "from-gray-600 to-gray-400", description: "Your journey is just starting! Keep at it — even a little Japanese goes a long way when visiting Japan." };

  const reviewLabel = reviewsDue > 0
    ? `${reviewsDue} review${reviewsDue !== 1 ? "s" : ""} due + new content`
    : "New content only";

  return (
    <div className="space-y-5">
      {/* Daily goal */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${goalPct}%` }} />
        </div>
        <span className="text-xs text-gray-500 shrink-0">{todayMinutes} / {goalMinutes} min today</span>
      </div>

      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{getGreeting()}, {profile.displayName || "Learner"}</h1>
          <p className="text-gray-500 mt-0.5 text-sm">
            {reviewsDue > 0 ? `${reviewsDue} review${reviewsDue !== 1 ? "s" : ""} due` : "All caught up on reviews"}
          </p>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-orange-400">🔥 {profile.currentStreak}</div>
          <div className="text-xs text-gray-600">day streak</div>
        </div>
      </div>

      {/* Lesson CTA */}
      {showContinue && inProgressLesson ? (
        <Link href={`/lesson/${inProgressLesson.id}`} className="block bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-xl p-5 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-white">Continue Lesson</div>
              <div className="text-gray-400 text-sm mt-0.5">{answeredCount} done · {unansweredCount} remaining</div>
            </div>
            <div className="text-2xl text-gray-400">▶</div>
          </div>
        </Link>
      ) : (
        <Link href="/lesson" className="block bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-xl p-5 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-white">{lessonOrdinal(todayLessons + 1)}</div>
              <div className="text-gray-400 text-sm mt-0.5">{reviewLabel}</div>
            </div>
            <div className="text-2xl text-gray-400">▶</div>
          </div>
        </Link>
      )}

      {/* Mastery Progress */}
      <div className="bg-gray-900 border border-white/10 rounded-xl p-5 space-y-4">
        <h2 className="font-medium text-sm text-gray-400 uppercase tracking-wide">Mastery Progress</h2>
        {progressItems.map((item) => {
          const p = progressMap[item.stage];
          const mastered = p?.masteredItems ?? 0;
          const pct = Math.min(100, Math.round((mastered / item.total) * 100));
          return (
            <div key={item.label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="flex items-center gap-2 text-gray-300">
                  <span className="jp-char">{item.emoji}</span>
                  {item.label}
                </span>
                <span className="text-gray-600">{mastered}/{item.total}</span>
              </div>
              <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Travel Readiness */}
      <div className="bg-gray-900 border border-white/10 rounded-xl p-5 space-y-3">
        <h2 className="font-medium text-sm text-gray-400 uppercase tracking-wide">Travel Readiness</h2>
        <div className="flex items-center justify-between">
          <div className={`font-semibold ${travelLevel.color}`}>{travelLevel.name}</div>
          <div className="text-gray-600 text-xs">{travelScore}%</div>
        </div>
        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div className={`h-full bg-gradient-to-r ${travelLevel.bar} rounded-full transition-all duration-500`} style={{ width: `${travelScore}%` }} />
        </div>
        <p className="text-gray-500 text-sm leading-relaxed">{travelLevel.description}</p>
      </div>

      <WeakestReviewButton />
    </div>
  );
}

function WeakestReviewButton() {
  return (
    <Link href="/review/weakest" className="block text-center w-full py-3 border border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/20 rounded-xl text-sm transition-colors">
      Review my weakest items →
    </Link>
  );
}
