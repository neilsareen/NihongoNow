import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowRight, ChevronRight, Flame, Lock } from "lucide-react";
import { getStartOfDayInTimezone, getAvatar } from "@/lib/utils";
import { hasMasteredAllKana, KANA_TYPES } from "@/lib/progression";
import { Avatar, Card, ProgressBar, Ring, SectionLabel, buttonStyles } from "@/app/components/ui";

const LESSON_TYPE_SYMBOL: Record<string, string> = {
  HIRAGANA: "あ",
  KATAKANA: "ア",
  KANJI: "漢",
  VOCABULARY: "語",
  PHRASE: "話",
};

async function getDashboardData(userId: string, timeZone: string) {
  const todayStart = getStartOfDayInTimezone(timeZone);

  // Resolved first so the review queries below can be scoped to it: while kana
  // is unmastered, lessons only serve kana, so counting locked kanji reviews
  // as "due" would promise work the learner can't actually be given.
  const kanaMastered = await hasMasteredAllKana(userId);
  const lockedTypeFilter = kanaMastered ? {} : { contentType: { in: KANA_TYPES } };

  const [profile, stats, progress, dueReviewsByType, inProgressLesson, todayStudy, todayLessons] = await Promise.all([
    prisma.userProfile.findUnique({ where: { id: userId } }),
    prisma.userStatistics.findUnique({ where: { userId } }),
    prisma.userProgress.findMany({ where: { userId } }),
    prisma.review.groupBy({
      by: ["contentType"],
      where: { userId, nextReviewAt: { lte: new Date() }, srsLevel: { not: "MASTERED" }, ...lockedTypeFilter },
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
  return { profile, stats, progress, reviewsDue, dueReviewsByType, inProgressLesson, todayStudy, todayLessons, kanaMastered };
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
  if (n === 1) return "Today's lesson";
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `Today's ${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]} lesson`;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/api/auth/signout");

  const timeZone = (await cookies()).get("tz")?.value || "UTC";
  const { profile, progress, reviewsDue, dueReviewsByType, inProgressLesson, todayStudy, todayLessons, kanaMastered } = await getDashboardData(user.id, timeZone);
  if (!profile) redirect("/onboarding");

  const avatar = getAvatar(profile.avatarUrl);

  const progressMap = Object.fromEntries(progress.map((p) => [p.stage, p]));

  const answeredCount = inProgressLesson?.items.filter((i) => i.answeredAt !== null).length ?? 0;
  const unansweredCount = inProgressLesson?.items.filter((i) => i.answeredAt === null).length ?? 0;
  const showContinue = answeredCount > 0 && unansweredCount > 0;

  const todayMinutes = Math.round((todayStudy._sum.durationSeconds ?? 0) / 60);
  const goalMinutes = profile.studyGoalMinutes;
  const goalPct = Math.min(100, goalMinutes > 0 ? Math.round((todayMinutes / goalMinutes) * 100) : 0);

  // One list for every content track, ordered the way the curriculum unlocks
  // them. The previous dashboard split these across three gradient tiles and a
  // separate card, which made two identical measurements look like two
  // different kinds of thing.
  const tracks = [
    { label: "Hiragana", stage: "HIRAGANA", total: 71, glyph: "あ", tone: "var(--track-hiragana)", practiceType: "HIRAGANA" },
    { label: "Katakana", stage: "KATAKANA", total: 69, glyph: "ア", tone: "var(--track-katakana)", practiceType: "KATAKANA" },
    { label: "Kanji", stage: "ESSENTIAL_KANJI", total: 1500, glyph: "漢", tone: "var(--track-kanji)", practiceType: "KANJI" },
    { label: "Vocabulary", stage: "CORE_VOCAB", total: 2000, glyph: "語", tone: "var(--track-vocab)", practiceType: null },
    { label: "Phrases", stage: "DAILY_CONVERSATION", total: 1000, glyph: "話", tone: "var(--track-phrase)", practiceType: null },
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
    travelScore >= 90 ? { name: "Near-native traveller", tone: "45 60% 58%", description: "Japan is practically a second home. You can handle any situation, read most signs, and connect deeply with locals." } :
    travelScore >= 70 ? { name: "Seasoned traveller", tone: "152 45% 50%", description: "You'll move through Japan with ease — trains, restaurants, shops and conversations hold no mystery." } :
    travelScore >= 50 ? { name: "Confident explorer", tone: "205 60% 58%", description: "You can navigate most everyday situations. Getting around, ordering food and asking for help are all within reach." } :
    travelScore >= 30 ? { name: "Tourist ready", tone: "268 46% 65%", description: "You're prepared for a comfortable trip: reading menus, asking directions and handling common tourist situations." } :
    travelScore >= 15 ? { name: "Survival traveller", tone: "28 62% 58%", description: "You can decode hiragana and katakana signs and manage basic exchanges. Tourist hotspots will be manageable." } :
    travelScore >= 5  ? { name: "Phonetic foundation", tone: "342 48% 62%", description: "You know some characters and basics. Japan is exciting, but you'll lean on translation apps for most things." } :
                        { name: "Complete beginner", tone: "220 9% 55%", description: "Your journey is just starting. Even a little Japanese goes a long way when visiting Japan." };

  const reviewLabel = reviewsDue > 0
    ? `${reviewsDue} review${reviewsDue !== 1 ? "s" : ""} due · plus new material`
    : "New material";

  const lessonHref = showContinue && inProgressLesson ? `/lesson/${inProgressLesson.id}` : "/lesson";
  const lessonTitle = showContinue && inProgressLesson ? "Continue lesson" : lessonOrdinal(todayLessons + 1);
  const lessonSubtitle = showContinue && inProgressLesson
    ? `${answeredCount} answered · ${unansweredCount} to go`
    : reviewLabel;

  // Which content type a lesson is "mostly" made of, to pick its icon glyph.
  // While kana is locked the lesson can only contain kana, so the icon must
  // never fall back to 漢 (or a word type, which is also written in kanji).
  const fallbackStage = !kanaMastered
    ? (masteredByStage("HIRAGANA", 71) <= masteredByStage("KATAKANA", 69) ? "HIRAGANA" : "KATAKANA")
    : masteredByStage("HIRAGANA", 71) < 0.9 ? "HIRAGANA" :
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
    <div className="space-y-6">
      {/* Header. The old build carried a bell icon that opened nothing; a
          control that does nothing is worse than no control. */}
      <header className="flex items-center justify-between gap-3">
        <Link href="/settings" className="flex items-center gap-3 min-w-0 group">
          <Avatar avatar={avatar} size={40} />
          <span className="min-w-0">
            <span className="block text-xs text-text-subtle">{getGreeting()}</span>
            <span className="block text-[15px] font-semibold truncate group-hover:text-text transition-colors">
              {profile.displayName || "Learner"}
            </span>
          </span>
        </Link>
        <div
          className="flex items-center gap-1.5 h-8 px-3 rounded-full border border-line bg-surface shrink-0"
          title={`${profile.currentStreak}-day streak`}
        >
          <Flame className="w-3.5 h-3.5 text-warning" strokeWidth={2} />
          <span className="text-[13px] font-semibold tnum">{profile.currentStreak}</span>
        </div>
      </header>

      {/* Primary action. Exactly one accent-filled element on the screen, so
          "what do I do next" needs no thought. */}
      <Link
        href={lessonHref}
        className="group flex items-center gap-4 rounded-xl border border-accent/30 bg-accent/[0.07] p-4 hover:bg-accent/[0.11] hover:border-accent/45 transition-colors duration-150 ease-swift"
      >
        <span className="w-12 h-12 rounded-lg bg-accent grid place-items-center shrink-0">
          <span className="jp text-2xl font-medium text-accent-fg leading-none">{lessonSymbol}</span>
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[15px] font-semibold truncate">{lessonTitle}</span>
          <span className="block text-[13px] text-text-muted truncate mt-0.5">{lessonSubtitle}</span>
        </span>
        <ArrowRight
          className="w-[18px] h-[18px] text-accent shrink-0 transition-transform duration-150 ease-swift group-hover:translate-x-0.5"
          strokeWidth={2}
        />
      </Link>

      {/* Today */}
      <Card className="p-4 flex items-center gap-4">
        <Ring value={goalPct} size={56} thickness={4}>
          <span className="text-[15px] font-semibold tnum leading-none">{todayMinutes}</span>
        </Ring>
        <div className="flex-1 min-w-0">
          <SectionLabel>Today</SectionLabel>
          <p className="text-sm mt-1.5">
            <span className="font-semibold tnum">{todayMinutes}</span>
            <span className="text-text-muted"> of {goalMinutes} min goal</span>
          </p>
          <p className="text-[13px] text-text-subtle mt-0.5">
            {reviewsDue > 0
              ? `${reviewsDue} review${reviewsDue !== 1 ? "s" : ""} waiting`
              : "No reviews due — you're caught up"}
          </p>
        </div>
      </Card>

      {/* Tracks */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-0.5">
          <SectionLabel>Your tracks</SectionLabel>
          <Link href="/analytics" className="text-[12px] text-text-subtle hover:text-text-muted transition-colors">
            Details
          </Link>
        </div>

        <Card className="divide-y divide-line">
          {tracks.map((track) => {
            const mastered = progressMap[track.stage]?.masteredItems ?? 0;
            const pct = Math.min(100, Math.round((mastered / track.total) * 100));

            // Kanji stays sealed until every kana is mastered — including its
            // glyph, so no kanji character appears on the dashboard at all.
            const locked = track.practiceType === "KANJI" && !kanaMastered;
            const href = !locked && track.practiceType ? `/practice?type=${track.practiceType}` : null;

            const body = (
              <>
                <span
                  className="w-9 h-9 rounded-lg grid place-items-center shrink-0 border"
                  style={
                    locked
                      ? { background: "hsl(var(--surface-raised))", borderColor: "hsl(var(--line))" }
                      : {
                          background: `hsl(${track.tone} / 0.12)`,
                          borderColor: `hsl(${track.tone} / 0.28)`,
                          color: `hsl(${track.tone})`,
                        }
                  }
                >
                  {locked ? (
                    <Lock className="w-4 h-4 text-text-subtle" strokeWidth={1.75} />
                  ) : (
                    <span className="jp text-base font-medium leading-none">{track.glyph}</span>
                  )}
                </span>

                <span className="flex-1 min-w-0">
                  <span className="flex items-baseline justify-between gap-3 mb-1.5">
                    <span className={`text-sm font-medium ${locked ? "text-text-subtle" : ""}`}>
                      {track.label}
                    </span>
                    <span className="text-[12px] text-text-subtle tnum shrink-0">
                      {locked ? "Locked" : `${mastered.toLocaleString()} / ${track.total.toLocaleString()}`}
                    </span>
                  </span>
                  <ProgressBar
                    value={locked ? 0 : pct}
                    className="h-1"
                    barStyle={locked ? undefined : { background: `hsl(${track.tone})` }}
                  />
                </span>

                {href && (
                  <ChevronRight className="w-4 h-4 text-text-subtle shrink-0 self-center" strokeWidth={1.75} />
                )}
              </>
            );

            const rowClass = "flex items-center gap-3 p-3.5 first:rounded-t-xl last:rounded-b-xl";

            return href ? (
              <Link
                key={track.label}
                href={href}
                className={`${rowClass} hover:bg-surface-raised transition-colors duration-150 ease-swift`}
              >
                {body}
              </Link>
            ) : (
              <div
                key={track.label}
                className={rowClass}
                title={locked ? "Master all hiragana and katakana to unlock kanji" : undefined}
              >
                {body}
              </div>
            );
          })}
        </Card>
      </section>

      {/* Travel readiness */}
      <section className="space-y-2.5">
        <SectionLabel className="px-0.5">Travel readiness</SectionLabel>
        <Card className="p-4 space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[15px] font-semibold" style={{ color: `hsl(${travelLevel.tone})` }}>
              {travelLevel.name}
            </span>
            <span className="text-sm text-text-muted tnum shrink-0">{travelScore}%</span>
          </div>
          <ProgressBar
            value={travelScore}
            className="h-1.5"
            barStyle={{ background: `hsl(${travelLevel.tone})` }}
          />
          <p className="text-[13px] text-text-muted leading-relaxed">{travelLevel.description}</p>
        </Card>
      </section>

      <Link href="/review/weakest" className={buttonStyles({ variant: "secondary", full: true })}>
        Review my weakest items
      </Link>
    </div>
  );
}
