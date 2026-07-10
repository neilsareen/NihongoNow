import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { Bell, ChevronRight, Flame } from "lucide-react";
import { getStartOfDayInTimezone, getAvatar } from "@/lib/utils";

const LESSON_TYPE_SYMBOL: Record<string, string> = {
  HIRAGANA: "あ",
  KATAKANA: "ア",
  KANJI: "漢",
  VOCABULARY: "語",
  PHRASE: "話",
};

async function getDashboardData(userId: string, timeZone: string) {
  const todayStart = getStartOfDayInTimezone(timeZone);

  const [profile, stats, progress, dueReviewsByType, inProgressLesson, todayStudy, todayLessons] = await Promise.all([
    prisma.userProfile.findUnique({ where: { id: userId } }),
    prisma.userStatistics.findUnique({ where: { userId } }),
    prisma.userProgress.findMany({ where: { userId } }),
    prisma.review.groupBy({
      by: ["contentType"],
      where: { userId, nextReviewAt: { lte: new Date() }, srsLevel: { not: "MASTERED" } },
      _count: { _all: true },
    }),
    prisma.lesson.findFirst({
      where: { userId, completedAt: null },
      orderBy: { generatedAt: "desc" },
      include: { items: { select: { answeredAt: true, contentType: true }, orderBy: { displayOrder: "asc" } } },
    }),
    prisma.lesson.aggregate({
      where: { userId, completedAt: { gte: todayStart }, durationSeconds: { not: null } },
      _sum: { durationSeconds: true },
    }),
    prisma.lesson.count({ where: { userId, completedAt: { gte: todayStart } } }),
  ]);
  const reviewsDue = dueReviewsByType.reduce((sum, r) => sum + r._count._all, 0);
  return { profile, stats, progress, reviewsDue, dueReviewsByType, inProgressLesson, todayStudy, todayLessons };
}

// What symbol best represents the makeup of a lesson: for an in-progress
// lesson, whichever content type its items are mostly made of; for an
// upcoming one (not generated yet), whichever type dominates the reviews
// that'll fill it, falling back to the learner's least-mastered stage.
function dominantLessonSymbol(counts: Partial<Record<string, number>>, fallbackStage: string | null): string {
  let best: string | null = null;
  let bestCount = 0;
  for (const [type, count] of Object.entries(counts)) {
    if ((count ?? 0) > bestCount) {
      best = type;
      bestCount = count ?? 0;
    }
  }
  return LESSON_TYPE_SYMBOL[best ?? fallbackStage ?? "VOCABULARY"] ?? "行";
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

  const timeZone = (await cookies()).get("tz")?.value || "UTC";
  const { profile, stats, progress, reviewsDue, dueReviewsByType, inProgressLesson, todayStudy, todayLessons } = await getDashboardData(user.id, timeZone);
  if (!profile) redirect("/onboarding");

  const avatar = getAvatar(profile.avatarUrl);

  const accuracy = stats && stats.totalReviews > 0
    ? Math.round((stats.correctReviews / stats.totalReviews) * 100) : 0;

  const progressMap = Object.fromEntries(progress.map((p) => [p.stage, p]));

  const answeredCount = inProgressLesson?.items.filter((i) => i.answeredAt !== null).length ?? 0;
  const unansweredCount = inProgressLesson?.items.filter((i) => i.answeredAt === null).length ?? 0;
  const showContinue = answeredCount > 0 && unansweredCount > 0;

  const todayMinutes = Math.round((todayStudy._sum.durationSeconds ?? 0) / 60);
  const goalMinutes = profile.studyGoalMinutes;
  const goalPct = Math.min(100, goalMinutes > 0 ? Math.round((todayMinutes / goalMinutes) * 100) : 0);

  const ringItems = [
    { label: "Hiragana", stage: "HIRAGANA", practiceType: "HIRAGANA", total: 71, emoji: "あ", from: "#a78bfa", to: "#7c3aed" },
    { label: "Katakana", stage: "KATAKANA", practiceType: "KATAKANA", total: 69, emoji: "ア", from: "#fbbf24", to: "#d97706" },
    { label: "Kanji", stage: "ESSENTIAL_KANJI", practiceType: "KANJI", total: 1500, emoji: "漢", from: "#4ade80", to: "#16a34a" },
  ];
  const secondaryItems = [
    { label: "Vocabulary", stage: "CORE_VOCAB", total: 2000, emoji: "📖", bar: "from-sky-500 to-cyan-400" },
    { label: "Phrases", stage: "DAILY_CONVERSATION", total: 1000, emoji: "💬", bar: "from-rose-500 to-pink-400" },
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

  const lessonHref = showContinue && inProgressLesson ? `/lesson/${inProgressLesson.id}` : "/lesson";
  const lessonTitle = showContinue && inProgressLesson ? "Continue Lesson" : lessonOrdinal(todayLessons + 1);
  const lessonSubtitle = showContinue && inProgressLesson
    ? `${answeredCount} done · ${unansweredCount} remaining`
    : reviewLabel;

  // Which content type a lesson is "mostly" made of, to pick its icon glyph.
  const fallbackStage =
    masteredByStage("HIRAGANA", 71) < 0.9 ? "HIRAGANA" :
    masteredByStage("KATAKANA", 69) < 0.9 ? "KATAKANA" :
    masteredByStage("ESSENTIAL_KANJI", 1500) < 0.9 ? "KANJI" :
    masteredByStage("CORE_VOCAB", 2000) < 0.9 ? "VOCABULARY" :
    "PHRASE";
  const lessonTypeCounts: Partial<Record<string, number>> = inProgressLesson
    ? inProgressLesson.items.reduce((acc, i) => {
        acc[i.contentType] = (acc[i.contentType] ?? 0) + 1;
        return acc;
      }, {} as Partial<Record<string, number>>)
    : Object.fromEntries(dueReviewsByType.map((r) => [r.contentType, r._count._all]));
  const lessonSymbol = dominantLessonSymbol(lessonTypeCounts, fallbackStage);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/settings"
            className="w-12 h-12 rounded-full bg-black flex items-center justify-center text-2xl shrink-0"
            style={{ border: `2px solid ${avatar.to}` }}
            title="Change avatar"
          >
            {avatar.char}
          </Link>
          <div>
            <p className="text-gray-500 text-sm">{getGreeting()}</p>
            <p className="font-display font-bold text-lg leading-tight">{profile.displayName || "Learner"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 bg-gradient-to-br from-orange-500/15 to-pink-500/10 border border-orange-500/20 rounded-full pl-2.5 pr-3 h-11">
            <Flame className="w-4 h-4 text-orange-400 animate-wiggle" fill="currentColor" />
            <span className="font-display font-bold text-orange-400 text-sm">{profile.currentStreak}</span>
          </div>
          <div className="w-11 h-11 rounded-full bg-gray-900 border border-white/10 flex items-center justify-center">
            <Bell className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Today's progress ring */}
      <div className="bg-gray-900 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
        <div
          className="relative w-16 h-16 rounded-full grid place-items-center shrink-0"
          style={{ background: `conic-gradient(#fbbf24, #fb923c, #ec4899 ${goalPct}%, rgba(255,255,255,0.06) ${goalPct}%)` }}
        >
          <div className="absolute inset-1.5 rounded-full bg-gray-900 flex flex-col items-center justify-center">
            <span className="font-display text-base font-bold">{todayMinutes}</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-display font-semibold text-gray-300 text-sm">Today&apos;s Progress</div>
          <div className="text-gray-500 text-xs mt-0.5">{todayMinutes} of {goalMinutes} min today</div>
          <div className="text-gray-500 text-xs mt-0.5">
            {reviewsDue > 0 ? `${reviewsDue} review${reviewsDue !== 1 ? "s" : ""} due` : "All caught up ✨"}
          </div>
        </div>
      </div>

      {/* Ring stat cards */}
      <div className="grid grid-cols-3 gap-3">
        {ringItems.map((item) => {
          const p = progressMap[item.stage];
          const mastered = p?.masteredItems ?? 0;
          const pct = Math.min(100, Math.round((mastered / item.total) * 100));
          return (
            <Link
              key={item.label}
              href={`/practice?type=${item.practiceType}`}
              className="rounded-2xl p-3.5 flex flex-col items-center gap-2 hover:scale-[1.03] active:scale-[0.98] transition-transform"
              style={{ background: `linear-gradient(135deg, ${item.from}, ${item.to})` }}
            >
              <div
                className="relative w-14 h-14 rounded-full grid place-items-center shrink-0"
                style={{ background: `conic-gradient(rgba(255,255,255,0.95) ${pct}%, rgba(0,0,0,0.25) ${pct}%)` }}
              >
                <div className="absolute inset-1.5 rounded-full flex items-center justify-center text-[11px] font-display font-bold text-white" style={{ background: item.to }}>
                  {pct}%
                </div>
              </div>
              <span className="text-white text-xs font-semibold flex items-center gap-1">
                <span className="jp-char">{item.emoji}</span> {item.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Lesson CTA row */}
      <Link href={lessonHref} className="flex items-center gap-3 bg-gray-900 border border-white/10 rounded-2xl p-3.5 hover:border-white/20 transition-colors">
        <div className="w-12 h-12 rounded-xl bg-sunset flex items-center justify-center jp-char text-2xl font-bold text-white shrink-0">{lessonSymbol}</div>
        <div className="flex-1 min-w-0">
          <div className="font-display font-semibold text-white text-sm truncate">{lessonTitle}</div>
          <div className="text-gray-500 text-xs truncate">{lessonSubtitle}</div>
        </div>
        <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0">
          <ChevronRight className="w-5 h-5 text-white" />
        </div>
      </Link>

      {/* Vocabulary + Phrases */}
      <div className="bg-gray-900 border border-white/10 rounded-2xl p-5 space-y-4">
        {secondaryItems.map((item) => {
          const p = progressMap[item.stage];
          const mastered = p?.masteredItems ?? 0;
          const pct = Math.min(100, Math.round((mastered / item.total) * 100));
          return (
            <div key={item.label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="flex items-center gap-2 text-gray-300">
                  <span>{item.emoji}</span>
                  {item.label}
                </span>
                <span className="text-gray-600">{mastered}/{item.total}</span>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div className={`h-full bg-gradient-to-r ${item.bar} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Travel Readiness */}
      <div className="bg-gray-900 border border-white/10 rounded-2xl p-5 space-y-3">
        <h2 className="font-display font-semibold text-sm text-gray-300 tracking-wide">Travel Readiness 🗾</h2>
        <div className="flex items-center justify-between">
          <div className={`font-display font-semibold ${travelLevel.color}`}>{travelLevel.name}</div>
          <div className="text-gray-600 text-xs">{travelScore}%</div>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
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
    <Link href="/review/weakest" className="block text-center w-full py-3 border border-white/10 text-gray-400 hover:text-white hover:border-white/25 hover:bg-white/[0.03] rounded-full text-sm transition-colors">
      Review my weakest items →
    </Link>
  );
}
