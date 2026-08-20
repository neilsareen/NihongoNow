import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  Banknote,
  BookOpen,
  CheckCircle2,
  Clock,
  Coins,
  Flame,
  Footprints,
  HandHeart,
  Lock,
  MessageSquareDashed,
  Store,
  Target,
  Utensils,
  VolumeX,
  type LucideIcon,
} from "lucide-react";
import { hasMasteredAllKana } from "@/lib/progression";
import { BottomNav } from "@/app/components/bottom-nav";
import { Card, ProgressBar, Ring, SectionLabel, TopBar } from "@/app/components/ui";

// Culture notes carry line icons rather than emoji: at this size emoji render
// differently on every platform and pull the page toward looking like a chat.
const CULTURAL_NORMS: { title: string; detail: string; icon: LucideIcon }[] = [
  {
    title: "No tipping",
    detail: "Tipping isn't expected and can confuse or mildly offend service staff. Good service in Japan is a given — it's part of omotenashi (hospitality culture), not something extra you pay for.",
    icon: Banknote,
  },
  {
    title: "Shoes off indoors",
    detail: "A near-universal rule in homes, traditional inns (ryokan), and many restaurants. Look for a genkan — a lowered entryway where shoes come off. Slippers are often provided, including dedicated ones just for the bathroom.",
    icon: Footprints,
  },
  {
    title: "Quiet on public transport",
    detail: "Phone calls are avoided, ringers are silenced, and loud conversations are frowned upon. Trains are genuinely quiet — keep your voice low and step off to take calls.",
    icon: VolumeX,
  },
  {
    title: "'It's a bit difficult' means no",
    detail: "Japanese communication is indirect. If someone says 'chotto muzukashii' (it's a bit difficult) or seems to hesitate, they're almost certainly declining. Pushing further puts them in an uncomfortable position.",
    icon: MessageSquareDashed,
  },
  {
    title: "Cash is still king",
    detail: "Despite Japan's tech-forward reputation, many small shops, temples, vending machines, and restaurants are cash-only. Always carry yen. 7-Eleven ATMs reliably accept foreign cards.",
    icon: Coins,
  },
  {
    title: "Bow, don't handshake",
    detail: "A brief nod is a casual greeting. A deeper bow (30–45°) signals respect or apology. Don't force a handshake — wait to see what the other person does and mirror them.",
    icon: HandHeart,
  },
  {
    title: "Chopstick rules",
    detail: "Never stick chopsticks upright in a bowl of rice (it resembles incense at a funeral) and don't pass food chopstick-to-chopstick (same funeral association). Rest them on the chopstick holder or across your bowl.",
    icon: Utensils,
  },
  {
    title: "Konbini are a way of life",
    detail: "7-Eleven, FamilyMart, and Lawson convenience stores serve hot food, fresh rice balls, coffee, and more — all genuinely good. They're also where you pay bills, print documents, and send packages.",
    icon: Store,
  },
];

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profile, stats, progress, lessonsCompleted, kanaMastered] = await Promise.all([
    prisma.userProfile.findUnique({ where: { id: user.id } }),
    prisma.userStatistics.findUnique({ where: { userId: user.id } }),
    prisma.userProgress.findMany({ where: { userId: user.id } }),
    prisma.lesson.count({ where: { userId: user.id, completedAt: { not: null } } }),
    hasMasteredAllKana(user.id),
  ]);

  if (!profile) redirect("/onboarding");

  const accuracy = stats && stats.totalReviews > 0
    ? Math.round((stats.correctReviews / stats.totalReviews) * 100) : 0;

  const studyHours = Math.round((stats?.totalStudyTime ?? 0) / 3600 * 10) / 10;

  const progressMap = Object.fromEntries(progress.map((p) => [p.stage, p]));

  // The kanji row is swapped for a padlock until every kana is mastered, so
  // the glyph itself stays hidden here too.
  const progressItems = [
    { label: "Hiragana", stage: "HIRAGANA", total: 71, glyph: "あ", tone: "var(--track-hiragana)", locked: false },
    { label: "Katakana", stage: "KATAKANA", total: 69, glyph: "ア", tone: "var(--track-katakana)", locked: false },
    { label: "Kanji", stage: "ESSENTIAL_KANJI", total: 1500, glyph: "漢", tone: "var(--track-kanji)", locked: !kanaMastered },
    { label: "Vocabulary", stage: "CORE_VOCAB", total: 2000, glyph: "語", tone: "var(--track-vocab)", locked: false },
    { label: "Phrases", stage: "DAILY_CONVERSATION", total: 1000, glyph: "話", tone: "var(--track-phrase)", locked: false },
  ];

  const masteredByStage = (stage: string, total: number) => {
    const p = progressMap[stage];
    return Math.min(1, (p?.masteredItems ?? 0) / total);
  };

  const hirPct = masteredByStage("HIRAGANA", 71);
  const katPct = masteredByStage("KATAKANA", 69);
  const vocPct = masteredByStage("CORE_VOCAB", 2000);
  const phrPct = masteredByStage("DAILY_CONVERSATION", 1000);
  const kanPct = masteredByStage("ESSENTIAL_KANJI", 1500);

  const travelScore = Math.round(hirPct * 25 + katPct * 20 + vocPct * 30 + phrPct * 20 + kanPct * 5);

  const travelLevel =
    travelScore >= 90 ? { name: "Near-native traveller", tone: "45 60% 58%" } :
    travelScore >= 70 ? { name: "Seasoned traveller", tone: "152 45% 50%" } :
    travelScore >= 50 ? { name: "Confident explorer", tone: "205 60% 58%" } :
    travelScore >= 30 ? { name: "Tourist ready", tone: "268 46% 65%" } :
    travelScore >= 15 ? { name: "Survival traveller", tone: "28 62% 58%" } :
    travelScore >= 5  ? { name: "Phonetic foundation", tone: "342 48% 62%" } :
                        { name: "Complete beginner", tone: "220 9% 55%" };

  // Build a breakdown of what the user still needs
  const readinessBreakdown = [
    { label: "Hiragana", pct: Math.round(hirPct * 100), weight: 25, done: hirPct >= 0.9 },
    { label: "Katakana", pct: Math.round(katPct * 100), weight: 20, done: katPct >= 0.9 },
    { label: "Core vocabulary", pct: Math.round(vocPct * 100), weight: 30, done: vocPct >= 0.5 },
    { label: "Phrases", pct: Math.round(phrPct * 100), weight: 20, done: phrPct >= 0.5 },
    { label: "Kanji", pct: Math.round(kanPct * 100), weight: 5, done: kanPct >= 0.3 },
  ];

  const guidance =
    travelScore < 15 ? "Focus on hiragana first — it unlocks everything else. Once you can read it, menus, signs and apps all start to make sense." :
    travelScore < 30 ? "You can read the phonetic scripts. Build vocabulary next, especially food, transport and shopping words — that's where daily life happens." :
    travelScore < 50 ? "You're ready for a comfortable tourist trip. Keep stacking vocabulary and phrases to handle more situations unaided." :
    travelScore < 70 ? "Japan is very manageable for you. Deeper kanji and phrase knowledge will open up more signs and more natural conversation." :
    travelScore < 90 ? "You move through Japan with ease. What's left is nuance — native materials, regional accents and unspoken social cues." :
                       "You're operating at a near-native level for travel. Japan feels like a second home.";

  const summaryStats: { label: string; value: string | number; icon: LucideIcon }[] = [
    { label: "Accuracy", value: `${accuracy}%`, icon: Target },
    { label: "Lessons", value: lessonsCompleted, icon: BookOpen },
    { label: "Study time", value: `${studyHours}h`, icon: Clock },
    { label: "Reviews", value: (stats?.totalReviews ?? 0).toLocaleString(), icon: CheckCircle2 },
    { label: "Correct", value: (stats?.correctReviews ?? 0).toLocaleString(), icon: CheckCircle2 },
    { label: "Streak", value: `${profile.currentStreak}d`, icon: Flame },
  ];

  return (
    <div className="min-h-screen">
      <TopBar title="Progress" backLabel="Dashboard" />

      <main className="max-w-lg mx-auto px-4 py-6 space-y-8 pb-[calc(6rem+env(safe-area-inset-bottom))]">
        {/* Headline: readiness is the number that matters, so it leads. */}
        <section className="space-y-3">
          <SectionLabel>Travel readiness</SectionLabel>
          <Card className="p-5 space-y-4">
            <div className="flex items-center gap-4">
              <Ring value={travelScore} size={64} thickness={5} color={`hsl(${travelLevel.tone})`}>
                <span className="text-base font-semibold tnum leading-none">{travelScore}</span>
              </Ring>
              <div className="min-w-0">
                <p className="text-lg font-semibold tracking-tight" style={{ color: `hsl(${travelLevel.tone})` }}>
                  {travelLevel.name}
                </p>
                <p className="text-[13px] text-text-muted mt-0.5">
                  {travelScore}% of the way to travelling unaided
                </p>
              </div>
            </div>

            <p className="text-[13px] text-text-muted leading-relaxed border-t border-line pt-4">
              {guidance}
            </p>
          </Card>
        </section>

        {/* Summary stats */}
        <section className="space-y-3">
          <SectionLabel>At a glance</SectionLabel>
          <div className="grid grid-cols-3 gap-px bg-line border border-line rounded-xl overflow-hidden">
            {summaryStats.map((s) => (
              <div key={s.label} className="bg-surface px-3 py-4">
                <s.icon className="w-4 h-4 text-text-subtle mb-2.5" strokeWidth={1.75} />
                <p className="text-lg font-semibold tnum leading-none">{s.value}</p>
                <p className="text-[11px] text-text-subtle mt-1.5">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Mastery per track */}
        <section className="space-y-3">
          <SectionLabel>Mastery by track</SectionLabel>
          <Card className="divide-y divide-line">
            {progressItems.map((item) => {
              const mastered = progressMap[item.stage]?.masteredItems ?? 0;
              const pct = Math.min(100, Math.round((mastered / item.total) * 100));
              return (
                <div key={item.label} className="flex items-center gap-3 p-3.5">
                  <span
                    className="w-9 h-9 rounded-lg grid place-items-center shrink-0 border"
                    style={
                      item.locked
                        ? { background: "hsl(var(--surface-raised))", borderColor: "hsl(var(--line))" }
                        : {
                            background: `hsl(${item.tone} / 0.12)`,
                            borderColor: `hsl(${item.tone} / 0.28)`,
                            color: `hsl(${item.tone})`,
                          }
                    }
                  >
                    {item.locked ? (
                      <Lock className="w-4 h-4 text-text-subtle" strokeWidth={1.75} />
                    ) : (
                      <span className="jp text-base font-medium leading-none">{item.glyph}</span>
                    )}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-3 mb-1.5">
                      <span className={`text-sm font-medium ${item.locked ? "text-text-subtle" : ""}`}>
                        {item.label}
                      </span>
                      <span className="text-[12px] text-text-subtle tnum shrink-0">
                        {item.locked
                          ? "Locked"
                          : `${mastered.toLocaleString()} / ${item.total.toLocaleString()}`}
                      </span>
                    </div>
                    <ProgressBar
                      value={item.locked ? 0 : pct}
                      className="h-1"
                      barStyle={item.locked ? undefined : { background: `hsl(${item.tone})` }}
                    />
                  </div>
                </div>
              );
            })}
          </Card>
        </section>

        {/* How the readiness score is composed */}
        <section className="space-y-3">
          <SectionLabel>What makes up the score</SectionLabel>
          <Card className="p-5 space-y-4">
            {readinessBreakdown.map((item) => (
              <div key={item.label}>
                <div className="flex items-baseline justify-between gap-3 mb-1.5">
                  <span className="text-[13px] flex items-center gap-2">
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{
                        background: item.done ? "hsl(var(--success))" : "hsl(var(--line-strong))",
                      }}
                    />
                    <span className={item.done ? "text-text" : "text-text-muted"}>{item.label}</span>
                  </span>
                  <span className="text-[12px] text-text-subtle tnum shrink-0">
                    {item.pct}% · {item.weight} pts
                  </span>
                </div>
                <ProgressBar
                  value={item.pct}
                  className="h-1"
                  barStyle={{
                    background: item.done ? "hsl(var(--success))" : "hsl(var(--line-strong))",
                  }}
                />
              </div>
            ))}
          </Card>
        </section>

        {/* Cultural guide */}
        <section className="space-y-3">
          <div className="space-y-1.5">
            <SectionLabel>Japan cultural guide</SectionLabel>
            <p className="text-[13px] text-text-muted leading-relaxed">
              The things that most often catch first-time visitors out.
            </p>
          </div>
          <Card className="divide-y divide-line">
            {CULTURAL_NORMS.map(({ title, detail, icon: Icon }) => (
              <div key={title} className="flex gap-3 p-4">
                <span className="w-8 h-8 rounded-lg bg-surface-raised border border-line grid place-items-center shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-text-muted" strokeWidth={1.75} />
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-medium mb-1">{title}</h3>
                  <p className="text-[13px] text-text-muted leading-relaxed">{detail}</p>
                </div>
              </div>
            ))}
          </Card>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
