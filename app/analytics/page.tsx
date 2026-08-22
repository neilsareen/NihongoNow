import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/simulation";
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
import { hasAnyUnlockedKanji, getConversationGate } from "@/lib/progression";
import { CULTURAL_TIPS } from "@/lib/cultural-tips";
import { CONVERSATIONS } from "@/lib/conversations";
import { BottomNav } from "@/app/components/bottom-nav";
import { Card, ColorCard, ProgressBar, Ring, SectionLabel, TopBar } from "@/app/components/ui";

// Culture notes carry line icons rather than emoji: at this size emoji render
// differently on every platform and pull the page toward looking like a chat.
const CULTURE_TONES = [
  "var(--lime)",
  "var(--sky)",
  "var(--sun)",
  "var(--grape)",
  "var(--coral)",
  "var(--blossom)",
];

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
  const session = await getSessionUser();
  if (!session) redirect("/login");
  const { userId } = session;

  const [profile, stats, progress, lessonsCompleted, kanjiUnlocked, conversationGate] = await Promise.all([
    prisma.userProfile.findUnique({ where: { id: userId } }),
    prisma.userStatistics.findUnique({ where: { userId } }),
    prisma.userProgress.findMany({ where: { userId } }),
    prisma.lesson.count({ where: { userId, completedAt: { not: null } } }),
    hasAnyUnlockedKanji(userId),
    getConversationGate(userId),
  ]);

  if (!profile) redirect("/onboarding");

  const accuracy = stats && stats.totalReviews > 0
    ? Math.round((stats.correctReviews / stats.totalReviews) * 100) : 0;

  const studyHours = Math.round((stats?.totalStudyTime ?? 0) / 3600 * 10) / 10;

  const progressMap = Object.fromEntries(progress.map((p) => [p.stage, p]));

  // The kanji row shows a padlock until at least one kanji is readable, so the
  // glyph itself stays hidden until the learner can actually meet it.
  const progressItems = [
    { label: "Hiragana", stage: "HIRAGANA", total: 71, glyph: "あ", tone: "var(--track-hiragana)", locked: false },
    { label: "Katakana", stage: "KATAKANA", total: 69, glyph: "ア", tone: "var(--track-katakana)", locked: false },
    { label: "Kanji", stage: "ESSENTIAL_KANJI", total: 1500, glyph: "漢", tone: "var(--track-kanji)", locked: !kanjiUnlocked },
    { label: "Vocabulary", stage: "CORE_VOCAB", total: 2000, glyph: "語", tone: "var(--track-vocab)", locked: false },
    { label: "Phrases", stage: "DAILY_CONVERSATION", total: 1000, glyph: "話", tone: "var(--track-phrase)", locked: false },
    { label: "Culture", stage: "CULTURE", total: CULTURAL_TIPS.length, glyph: "礼", tone: "var(--sun)", locked: false },
    { label: "Conversation", stage: "CONVERSATION", total: CONVERSATIONS.length, glyph: "会", tone: "var(--track-conversation)", locked: !conversationGate.unlocked },
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
    travelScore >= 90 ? { name: "Near-native", tone: "var(--sun)", glyph: "極" } :
    travelScore >= 70 ? { name: "Seasoned traveller", tone: "var(--lime)", glyph: "達" } :
    travelScore >= 50 ? { name: "Confident explorer", tone: "var(--sky)", glyph: "旅" } :
    travelScore >= 30 ? { name: "Tourist ready", tone: "var(--grape)", glyph: "観" } :
    travelScore >= 15 ? { name: "Survival traveller", tone: "var(--coral)", glyph: "歩" } :
    travelScore >= 5  ? { name: "Phonetic foundation", tone: "var(--blossom)", glyph: "音" } :
                        { name: "Complete beginner", tone: "var(--text-subtle)", glyph: "初" };

  // Build a breakdown of what the user still needs
  const readinessBreakdown = [
    { label: "Hiragana", pct: Math.round(hirPct * 100), weight: 25, done: hirPct >= 0.9, tone: "var(--track-hiragana)" },
    { label: "Katakana", pct: Math.round(katPct * 100), weight: 20, done: katPct >= 0.9, tone: "var(--track-katakana)" },
    { label: "Core vocabulary", pct: Math.round(vocPct * 100), weight: 30, done: vocPct >= 0.5, tone: "var(--track-vocab)" },
    { label: "Phrases", pct: Math.round(phrPct * 100), weight: 20, done: phrPct >= 0.5, tone: "var(--track-phrase)" },
    { label: "Kanji", pct: Math.round(kanPct * 100), weight: 5, done: kanPct >= 0.3, tone: "var(--track-kanji)" },
  ];

  const guidance =
    travelScore < 15 ? "Focus on hiragana first — it unlocks everything else. Once you can read it, menus, signs and apps all start to make sense." :
    travelScore < 30 ? "You can read the phonetic scripts. Build vocabulary next, especially food, transport and shopping words — that's where daily life happens." :
    travelScore < 50 ? "You're ready for a comfortable tourist trip. Keep stacking vocabulary and phrases to handle more situations unaided." :
    travelScore < 70 ? "Japan is very manageable for you. Deeper kanji and phrase knowledge will open up more signs and more natural conversation." :
    travelScore < 90 ? "You move through Japan with ease. What's left is nuance — native materials, regional accents and unspoken social cues." :
                       "You're operating at a near-native level for travel. Japan feels like a second home.";

  // Each stat gets its own hue so the grid reads as a set of six things rather
  // than one grey block of numbers.
  const summaryStats: { label: string; value: string | number; icon: LucideIcon; tone: string }[] = [
    { label: "Accuracy", value: `${accuracy}%`, icon: Target, tone: "var(--lime)" },
    { label: "Day streak", value: profile.currentStreak, icon: Flame, tone: "var(--sun)" },
    { label: "Lessons", value: lessonsCompleted, icon: BookOpen, tone: "var(--sky)" },
    { label: "Hours", value: studyHours, icon: Clock, tone: "var(--grape)" },
    { label: "Reviews", value: (stats?.totalReviews ?? 0).toLocaleString(), icon: CheckCircle2, tone: "var(--blossom)" },
    { label: "Correct", value: (stats?.correctReviews ?? 0).toLocaleString(), icon: CheckCircle2, tone: "var(--coral)" },
  ];

  return (
    <div className="min-h-screen">
      <TopBar title="Progress" />

      <main className="max-w-lg mx-auto px-4 py-6 space-y-8 pb-[calc(6rem+env(safe-area-inset-bottom))]">
        {/* Readiness leads, as a block of its own colour. */}
        <section className="space-y-3">
          <ColorCard hue={travelLevel.tone} className="relative">
            <span
              className="jp absolute -right-3 -bottom-10 text-[10rem] leading-none font-bold select-none pointer-events-none"
              style={{ color: "hsl(var(--on-light) / 0.13)" }}
              aria-hidden="true"
            >
              {travelLevel.glyph}
            </span>
            <div className="relative p-5">
              <p className="font-display font-bold text-[12px] uppercase tracking-[0.12em] opacity-75">
                Travel readiness
              </p>
              <div className="flex items-end gap-3 mt-1">
                <p className="font-display font-extrabold text-mega tnum leading-none">
                  {travelScore}
                  <span className="text-3xl align-top">%</span>
                </p>
              </div>
              <p className="font-display font-extrabold text-[21px] tracking-tight mt-1">
                {travelLevel.name}
              </p>
              <p className="text-[14px] font-medium mt-2 opacity-85 leading-relaxed max-w-[36ch]">
                {guidance}
              </p>
            </div>
          </ColorCard>
        </section>

        {/* Six stats, six colours */}
        <section className="space-y-3">
          <SectionLabel>By the numbers</SectionLabel>
          <div className="grid grid-cols-3 gap-2.5 stagger">
            {summaryStats.map((s) => (
              <div
                key={s.label}
                className="rounded-tile border border-line bg-surface elevated p-3.5"
              >
                <s.icon
                  className="w-[18px] h-[18px] mb-2.5"
                  strokeWidth={2.5}
                  style={{ color: `hsl(${s.tone})` }}
                />
                <p
                  className="font-display font-extrabold text-[22px] tnum leading-none"
                  style={{ color: `hsl(${s.tone})` }}
                >
                  {s.value}
                </p>
                <p className="text-[11px] font-bold text-text-subtle mt-1.5 leading-tight">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Mastery per track */}
        <section className="space-y-3">
          <SectionLabel>Mastery by track</SectionLabel>
          <div className="space-y-2.5 stagger">
            {progressItems.map((item) => {
              const mastered = progressMap[item.stage]?.masteredItems ?? 0;
              const pct = Math.min(100, Math.round((mastered / item.total) * 100));
              return (
                <div
                  key={item.label}
                  className="flex items-center gap-4 p-3.5 rounded-card border border-line bg-surface elevated"
                >
                  <span
                    className="w-14 h-14 rounded-tile grid place-items-center shrink-0"
                    style={
                      item.locked
                        ? { background: "hsl(var(--ink-deep))" }
                        : { background: `hsl(${item.tone})`, color: "hsl(var(--on-light))" }
                    }
                  >
                    {item.locked ? (
                      <Lock className="w-5 h-5 text-text-subtle" strokeWidth={2.5} />
                    ) : (
                      <span className="jp text-2xl font-bold leading-none">{item.glyph}</span>
                    )}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-3 mb-2">
                      <span
                        className={`font-display font-bold text-[16px] tracking-tight ${item.locked ? "text-text-subtle" : ""}`}
                      >
                        {item.label}
                      </span>
                      <span className="text-[12px] font-bold text-text-subtle tnum shrink-0">
                        {item.locked
                          ? "LOCKED"
                          : `${mastered.toLocaleString()} / ${item.total.toLocaleString()}`}
                      </span>
                    </div>
                    <ProgressBar
                      value={item.locked ? 0 : pct}
                      hue={item.locked ? "var(--line)" : item.tone}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* How the readiness score is composed */}
        <section className="space-y-3">
          <SectionLabel>What builds the score</SectionLabel>
          <Card className="p-5 space-y-4">
            {readinessBreakdown.map((item) => (
              <div key={item.label}>
                <div className="flex items-baseline justify-between gap-3 mb-2">
                  <span className="text-[14px] font-semibold flex items-center gap-2">
                    {item.done && (
                      <CheckCircle2
                        className="w-4 h-4 shrink-0 text-lime"
                        strokeWidth={2.5}
                      />
                    )}
                    <span className={item.done ? "text-text" : "text-text-muted"}>
                      {item.label}
                    </span>
                  </span>
                  <span className="text-[12px] font-bold text-text-subtle tnum shrink-0">
                    {item.pct}% · {item.weight} pts
                  </span>
                </div>
                <ProgressBar
                  value={item.pct}
                  hue={item.done ? item.tone : `${item.tone} / 0.5`}
                  className="h-2.5"
                />
              </div>
            ))}
          </Card>
        </section>

        {/* Cultural guide */}
        <section className="space-y-3">
          <div className="space-y-1.5">
            <SectionLabel>Don&apos;t be that tourist</SectionLabel>
            <p className="text-[14px] text-text-muted leading-relaxed font-medium">
              Eight things that catch first-timers out.
            </p>
          </div>
          <div className="space-y-2.5">
            {CULTURAL_NORMS.map(({ title, detail, icon: Icon }, i) => {
              // Cycling the cast keeps a long list from turning into a wall.
              const tone = CULTURE_TONES[i % CULTURE_TONES.length];
              return (
                <div
                  key={title}
                  className="flex gap-3.5 p-4 rounded-card border border-line bg-surface elevated"
                >
                  <span
                    className="w-11 h-11 rounded-tile grid place-items-center shrink-0 text-on-light"
                    style={{ background: `hsl(${tone})` }}
                  >
                    <Icon className="w-5 h-5" strokeWidth={2.5} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-display font-bold text-[16px] tracking-tight mb-1">
                      {title}
                    </h3>
                    <p className="text-[13px] text-text-muted leading-relaxed font-medium">
                      {detail}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </main>

      <BottomNav />
    </div>
  );
}
