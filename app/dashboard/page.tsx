import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { ChevronRight, Flame, Lock, Zap } from "lucide-react";
import { getStartOfDayInTimezone, getAvatar } from "@/lib/utils";
import { getMasteredKana, filterUnlockedReviews, getUnlockedKanji } from "@/lib/progression";
import { Avatar, Card, Chip, ColorCard, ProgressBar, Ring, SectionLabel, buttonStyles, buttonVars } from "@/app/components/ui";

const LESSON_TYPE_SYMBOL: Record<string, string> = {
  HIRAGANA: "あ",
  KATAKANA: "ア",
  KANJI: "漢",
  VOCABULARY: "語",
  PHRASE: "話",
};

async function getDashboardData(userId: string, timeZone: string) {
  const todayStart = getStartOfDayInTimezone(timeZone);

  // Resolved first so the due-review list can be filtered against it: a lesson
  // only serves content the learner can read, so counting locked items as
  // "due" would promise work they can't actually be given.
  const masteredKana = await getMasteredKana(userId);

  const [profile, stats, progress, fetchedDueReviews, inProgressLesson, todayStudy, todayLessons] = await Promise.all([
    prisma.userProfile.findUnique({ where: { id: userId } }),
    prisma.userStatistics.findUnique({ where: { userId } }),
    prisma.userProgress.findMany({ where: { userId } }),
    prisma.review.findMany({
      where: { userId, nextReviewAt: { lte: new Date() }, srsLevel: { not: "MASTERED" } },
      select: { contentType: true, contentId: true },
      take: 100,
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

  const unlockedDue = await filterUnlockedReviews(fetchedDueReviews, masteredKana);
  const dueCountsByType: Record<string, number> = {};
  for (const r of unlockedDue) {
    dueCountsByType[r.contentType] = (dueCountsByType[r.contentType] ?? 0) + 1;
  }
  const reviewsDue = unlockedDue.length;
  const kanjiUnlocked = (await getUnlockedKanji(masteredKana)).length > 0;

  return { profile, stats, progress, reviewsDue, dueCountsByType, inProgressLesson, todayStudy, todayLessons, kanjiUnlocked };
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
  const { profile, progress, reviewsDue, dueCountsByType, inProgressLesson, todayStudy, todayLessons, kanjiUnlocked } = await getDashboardData(user.id, timeZone);
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
    travelScore >= 90 ? { name: "Near-native", tone: "var(--sun)", description: "Japan is practically a second home. Any situation, most signs, real conversations." } :
    travelScore >= 70 ? { name: "Seasoned traveller", tone: "var(--lime)", description: "Trains, restaurants, shops and conversations hold no mystery for you." } :
    travelScore >= 50 ? { name: "Confident explorer", tone: "var(--sky)", description: "Getting around, ordering food and asking for help are all within reach." } :
    travelScore >= 30 ? { name: "Tourist ready", tone: "var(--grape)", description: "Menus, directions and the usual tourist situations — you've got these." } :
    travelScore >= 15 ? { name: "Survival traveller", tone: "var(--coral)", description: "You can decode kana signs and manage basic exchanges. Hotspots are manageable." } :
    travelScore >= 5  ? { name: "Phonetic foundation", tone: "var(--blossom)", description: "Some characters, some basics. Translation apps are still doing the heavy lifting." } :
                        { name: "Complete beginner", tone: "var(--text-subtle)", description: "Day one. Even a little Japanese goes a long way in Japan." };

  const reviewLabel = reviewsDue > 0
    ? `${reviewsDue} review${reviewsDue !== 1 ? "s" : ""} due · plus new material`
    : "New material";

  const lessonHref = showContinue && inProgressLesson ? `/lesson/${inProgressLesson.id}` : "/lesson";
  const lessonTitle = showContinue && inProgressLesson ? "Continue lesson" : lessonOrdinal(todayLessons + 1);
  const lessonSubtitle = showContinue && inProgressLesson
    ? `${answeredCount} answered · ${unansweredCount} to go`
    : reviewLabel;

  // Which content type a lesson is "mostly" made of, to pick its icon glyph.
  // 漢 is only ever a valid fallback once some kanji is actually unlocked,
  // otherwise the icon would advertise content the lesson can't contain.
  const fallbackStage =
    masteredByStage("HIRAGANA", 71) < 0.9 ? "HIRAGANA" :
    masteredByStage("KATAKANA", 69) < 0.9 ? "KATAKANA" :
    (kanjiUnlocked && masteredByStage("ESSENTIAL_KANJI", 1500) < 0.9) ? "KANJI" :
    masteredByStage("CORE_VOCAB", 2000) < 0.9 ? "VOCABULARY" :
    "PHRASE";
  const lessonTypeCounts: Partial<Record<string, number>> = inProgressLesson
    ? inProgressLesson.items.reduce((acc, i) => {
        acc[i.contentType] = (acc[i.contentType] ?? 0) + 1;
        return acc;
      }, {} as Partial<Record<string, number>>)
    : dueCountsByType;
  const lessonSymbol = dominantLessonSymbol(lessonTypeCounts, fallbackStage);

  return (
    <div className="space-y-7">
      {/* Header */}
      <header className="flex items-center justify-between gap-3">
        <Link href="/settings" className="flex items-center gap-3 min-w-0 group">
          <Avatar avatar={avatar} size={46} />
          <span className="min-w-0">
            <span className="block text-[13px] text-text-subtle font-medium">{getGreeting()}</span>
            <span className="block font-display font-bold text-[19px] tracking-tight truncate">
              {profile.displayName || "Learner"}
            </span>
          </span>
        </Link>

        {/* Streak. A number worth looking at, so it gets the sun and a size. */}
        <Chip hue="var(--sun)" className="h-10 px-3.5 text-[15px]" >
          <Flame className="w-4 h-4" strokeWidth={2.5} fill="currentColor" />
          <span className="tnum">{profile.currentStreak}</span>
        </Chip>
      </header>

      {/* The one thing to do next, as a block of colour you cannot miss. */}
      <ColorCard hue="var(--coral)" ledgeHue="var(--coral-deep)" href={lessonHref} className="relative">
        {/* Oversized glyph bleeding off the edge — the app's own alphabet as
            ornament, instead of a stock illustration. */}
        <span
          className="jp absolute -right-3 -bottom-8 text-[9rem] leading-none font-bold pointer-events-none select-none"
          style={{ color: "hsl(var(--on-light) / 0.13)" }}
          aria-hidden="true"
        >
          {lessonSymbol}
        </span>

        <div className="relative p-5">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4" strokeWidth={2.5} fill="currentColor" />
            <span className="font-display font-bold text-[13px] uppercase tracking-[0.1em]">
              {showContinue ? "Pick up where you left off" : "Ready when you are"}
            </span>
          </div>
          <p className="font-display font-extrabold text-[26px] leading-tight tracking-tight max-w-[15ch]">
            {lessonTitle}
          </p>
          <p className="text-[14px] font-medium mt-1.5 opacity-80">{lessonSubtitle}</p>

          <span
            className="mt-4 inline-flex items-center gap-2 h-11 px-5 rounded-full font-display font-bold text-[15px] bg-on-light text-coral"
          >
            {showContinue ? "Keep going" : "Start"}
            <ChevronRight className="w-4 h-4" strokeWidth={3} />
          </span>
        </div>
      </ColorCard>

      {/* Today */}
      <Card className="p-5 flex items-center gap-5">
        <Ring value={goalPct} size={78} thickness={10} hue="var(--lime)">
          <span className="text-center leading-none">
            <span className="block font-display font-extrabold text-[22px] tnum">{todayMinutes}</span>
            <span className="block text-[10px] font-bold text-text-subtle uppercase tracking-wider mt-0.5">min</span>
          </span>
        </Ring>
        <div className="flex-1 min-w-0">
          <SectionLabel>Today</SectionLabel>
          <p className="text-[14px] text-text-muted mt-1.5 font-medium">
            {goalPct >= 100
              ? "Goal smashed. Anything more is a bonus."
              : `${goalMinutes - todayMinutes} min to hit your goal`}
          </p>
          <p className="text-[13px] text-text-subtle mt-1 font-medium">
            {reviewsDue > 0
              ? `${reviewsDue} review${reviewsDue !== 1 ? "s" : ""} waiting`
              : "All caught up on reviews"}
          </p>
        </div>
      </Card>

      {/* Tracks. Each owns a hue and keeps it everywhere in the app. */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <SectionLabel>Your tracks</SectionLabel>
          <Link
            href="/analytics"
            className="font-display font-bold text-[13px] text-text-subtle hover:text-text transition-colors"
          >
            See all
          </Link>
        </div>

        <div className="space-y-2.5 stagger">
          {tracks.map((track) => {
            const mastered = progressMap[track.stage]?.masteredItems ?? 0;
            const pct = Math.min(100, Math.round((mastered / track.total) * 100));

            // Kanji stays sealed — including its glyph — until at least one
            // kanji is readable, so no kanji character appears here early on.
            const locked = track.practiceType === "KANJI" && !kanjiUnlocked;
            const href = !locked && track.practiceType ? `/practice?type=${track.practiceType}` : null;

            const body = (
              <>
                <span
                  className="w-14 h-14 rounded-tile grid place-items-center shrink-0"
                  style={
                    locked
                      ? { background: "hsl(var(--ink-deep))" }
                      : { background: `hsl(${track.tone})`, color: "hsl(var(--on-light))" }
                  }
                >
                  {locked ? (
                    <Lock className="w-5 h-5 text-text-subtle" strokeWidth={2.5} />
                  ) : (
                    <span className="jp text-2xl font-bold leading-none">{track.glyph}</span>
                  )}
                </span>

                <span className="flex-1 min-w-0">
                  <span className="flex items-baseline justify-between gap-3 mb-2">
                    <span
                      className={`font-display font-bold text-[16px] tracking-tight ${locked ? "text-text-subtle" : ""}`}
                    >
                      {track.label}
                    </span>
                    <span className="text-[12px] font-bold text-text-subtle tnum shrink-0">
                      {locked ? "LOCKED" : `${mastered.toLocaleString()} / ${track.total.toLocaleString()}`}
                    </span>
                  </span>
                  <ProgressBar
                    value={locked ? 0 : pct}
                    hue={locked ? "var(--line)" : track.tone}
                  />
                </span>
              </>
            );

            const rowClass =
              "flex items-center gap-4 p-3.5 rounded-card border-2 border-line bg-surface card-ledge";

            return href ? (
              <Link
                key={track.label}
                href={href}
                className={`${rowClass} hover:border-line-strong transition-colors`}
              >
                {body}
              </Link>
            ) : (
              <div
                key={track.label}
                className={rowClass}
                title={locked ? "Master the kana used in a kanji\u2019s reading to unlock it" : undefined}
              >
                {body}
              </div>
            );
          })}
        </div>
      </section>

      {/* Travel readiness — the headline number, sized like one. */}
      <section className="space-y-3">
        <SectionLabel className="px-1">Travel readiness</SectionLabel>
        <Card className="p-5">
          <div className="flex items-end justify-between gap-4 mb-4">
            <div className="min-w-0">
              <p
                className="font-display font-extrabold text-[19px] tracking-tight"
                style={{ color: `hsl(${travelLevel.tone})` }}
              >
                {travelLevel.name}
              </p>
              <p className="text-[13px] text-text-muted mt-1.5 leading-relaxed font-medium">
                {travelLevel.description}
              </p>
            </div>
            <p
              className="font-display font-extrabold text-hero tnum leading-none shrink-0"
              style={{ color: `hsl(${travelLevel.tone})` }}
            >
              {travelScore}
              <span className="text-[22px] align-top">%</span>
            </p>
          </div>
          <ProgressBar value={travelScore} hue={travelLevel.tone} className="h-4" />
        </Card>
      </section>

      <Link
        href="/review/weakest"
        className={buttonStyles({ variant: "secondary", full: true, size: "lg" })}
        style={buttonVars("secondary")}
      >
        Drill my weakest items
      </Link>
    </div>
  );
}
