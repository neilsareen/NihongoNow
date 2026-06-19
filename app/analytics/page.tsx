import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

const CULTURAL_NORMS = [
  {
    title: "No tipping",
    detail: "Tipping isn't expected and can confuse or mildly offend service staff. Good service in Japan is a given — it's part of omotenashi (hospitality culture), not something extra you pay for.",
    icon: "💴",
  },
  {
    title: "Shoes off indoors",
    detail: "A near-universal rule in homes, traditional inns (ryokan), and many restaurants. Look for a genkan — a lowered entryway where shoes come off. Slippers are often provided, including dedicated ones just for the bathroom.",
    icon: "👟",
  },
  {
    title: "Quiet on public transport",
    detail: "Phone calls are avoided, ringers are silenced, and loud conversations are frowned upon. Trains are genuinely quiet — keep your voice low and step off to take calls.",
    icon: "🚃",
  },
  {
    title: "'It's a bit difficult' means no",
    detail: "Japanese communication is indirect. If someone says 'chotto muzukashii' (it's a bit difficult) or seems to hesitate, they're almost certainly declining. Pushing further puts them in an uncomfortable position.",
    icon: "🤝",
  },
  {
    title: "Cash is still king",
    detail: "Despite Japan's tech-forward reputation, many small shops, temples, vending machines, and restaurants are cash-only. Always carry yen. 7-Eleven ATMs reliably accept foreign cards.",
    icon: "💰",
  },
  {
    title: "Bow, don't handshake",
    detail: "A brief nod is a casual greeting. A deeper bow (30–45°) signals respect or apology. Don't force a handshake — wait to see what the other person does and mirror them.",
    icon: "🙇",
  },
  {
    title: "Chopstick rules",
    detail: "Never stick chopsticks upright in a bowl of rice (it resembles incense at a funeral) and don't pass food chopstick-to-chopstick (same funeral association). Rest them on the chopstick holder or across your bowl.",
    icon: "🥢",
  },
  {
    title: "Konbini are a way of life",
    detail: "7-Eleven, FamilyMart, and Lawson convenience stores serve hot food, fresh rice balls, coffee, and more — all genuinely good. They're also where you pay bills, print documents, and send packages.",
    icon: "🏪",
  },
];

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profile, stats, progress, lessonsCompleted] = await Promise.all([
    prisma.userProfile.findUnique({ where: { id: user.id } }),
    prisma.userStatistics.findUnique({ where: { userId: user.id } }),
    prisma.userProgress.findMany({ where: { userId: user.id } }),
    prisma.lesson.count({ where: { userId: user.id, completedAt: { not: null } } }),
  ]);

  if (!profile) redirect("/onboarding");

  const accuracy = stats && stats.totalReviews > 0
    ? Math.round((stats.correctReviews / stats.totalReviews) * 100) : 0;

  const studyHours = Math.round((stats?.totalStudyTime ?? 0) / 3600 * 10) / 10;

  const progressMap = Object.fromEntries(progress.map((p) => [p.stage, p]));

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

  const hirPct = masteredByStage("HIRAGANA", 71);
  const katPct = masteredByStage("KATAKANA", 69);
  const vocPct = masteredByStage("CORE_VOCAB", 2000);
  const phrPct = masteredByStage("DAILY_CONVERSATION", 1000);
  const kanPct = masteredByStage("ESSENTIAL_KANJI", 1500);

  const travelScore = Math.round(hirPct * 25 + katPct * 20 + vocPct * 30 + phrPct * 20 + kanPct * 5);

  const travelLevel =
    travelScore >= 90 ? { name: "Near-Native Traveler", icon: "🏯", color: "text-yellow-300", bar: "from-yellow-500 to-yellow-300" } :
    travelScore >= 70 ? { name: "Seasoned Traveler", icon: "✈️", color: "text-green-300", bar: "from-green-500 to-green-300" } :
    travelScore >= 50 ? { name: "Confident Explorer", icon: "🗺️", color: "text-blue-300", bar: "from-blue-500 to-blue-300" } :
    travelScore >= 30 ? { name: "Tourist Ready", icon: "🎌", color: "text-purple-300", bar: "from-purple-500 to-purple-300" } :
    travelScore >= 15 ? { name: "Survival Traveler", icon: "🧭", color: "text-orange-300", bar: "from-orange-500 to-orange-300" } :
    travelScore >= 5  ? { name: "Phonetic Foundation", icon: "📖", color: "text-red-300", bar: "from-red-500 to-red-300" } :
                        { name: "Complete Beginner", icon: "🌱", color: "text-gray-400", bar: "from-gray-600 to-gray-400" };

  // Build a breakdown of what the user still needs
  const readinessBreakdown = [
    { label: "Hiragana", pct: Math.round(hirPct * 100), weight: 25, done: hirPct >= 0.9 },
    { label: "Katakana", pct: Math.round(katPct * 100), weight: 20, done: katPct >= 0.9 },
    { label: "Core Vocabulary", pct: Math.round(vocPct * 100), weight: 30, done: vocPct >= 0.5 },
    { label: "Phrases", pct: Math.round(phrPct * 100), weight: 20, done: phrPct >= 0.5 },
    { label: "Kanji", pct: Math.round(kanPct * 100), weight: 5, done: kanPct >= 0.3 },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-white/10 bg-gray-950/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="font-semibold flex items-center gap-1.5">
            <span className="jp-char text-white text-lg">行</span>
            <span className="text-sm">Ikou</span>
          </Link>
          <Link href="/dashboard" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">← Dashboard</Link>
        </div>
      </nav>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6 pb-12">
        <h1 className="text-xl font-semibold">Your Progress</h1>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Accuracy", value: `${accuracy}%`, icon: "🎯" },
            { label: "Lessons", value: lessonsCompleted, icon: "📚" },
            { label: "Study Time", value: `${studyHours}h`, icon: "⏱️" },
            { label: "Reviews", value: stats?.totalReviews ?? 0, icon: "📝" },
            { label: "Correct", value: stats?.correctReviews ?? 0, icon: "✓" },
            { label: "Streak", value: `${profile.currentStreak}d`, icon: "🔥" },
          ].map((s) => (
            <div key={s.label} className="bg-gray-900 border border-white/10 rounded-xl p-3 text-center">
              <div className="text-lg mb-0.5">{s.icon}</div>
              <div className="text-xl font-bold">{s.value}</div>
              <div className="text-gray-600 text-xs">{s.label}</div>
            </div>
          ))}
        </div>

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
                  <span className="text-gray-600">{mastered}/{item.total} mastered</span>
                </div>
                <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Travel Readiness - detailed */}
        <div className="bg-gray-900 border border-white/10 rounded-xl p-5 space-y-4">
          <h2 className="font-medium text-sm text-gray-400 uppercase tracking-wide">Travel Readiness</h2>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{travelLevel.icon}</span>
            <div>
              <div className={`font-semibold text-lg ${travelLevel.color}`}>{travelLevel.name}</div>
              <div className="text-gray-600 text-xs">{travelScore}% travel-ready</div>
            </div>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div className={`h-full bg-gradient-to-r ${travelLevel.bar} rounded-full transition-all duration-500`} style={{ width: `${travelScore}%` }} />
          </div>

          <div className="space-y-2 pt-1">
            <p className="text-xs text-gray-600 uppercase tracking-wide">Breakdown</p>
            {readinessBreakdown.map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full shrink-0 ${item.done ? "bg-green-500" : "bg-gray-700"}`} />
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className={item.done ? "text-gray-300" : "text-gray-500"}>{item.label}</span>
                    <span className="text-gray-600">{item.pct}% · {item.weight}% of score</span>
                  </div>
                  <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${item.done ? "bg-green-600" : "bg-gray-600"}`}
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-sm text-gray-500 leading-relaxed pt-1">
            {travelScore < 15 && "Focus on Hiragana first — it unlocks everything else. Once you can read hiragana, menus, signs, and apps all start to make sense."}
            {travelScore >= 15 && travelScore < 30 && "You can read the phonetic scripts. Now build vocabulary — especially food, transport, and shopping words. These will make a huge difference in daily Japan life."}
            {travelScore >= 30 && travelScore < 50 && "You're ready for a comfortable tourist trip. Keep stacking vocabulary and phrases to handle more situations independently."}
            {travelScore >= 50 && travelScore < 70 && "Japan is very manageable for you. Deepening your kanji and phrase knowledge will let you read more signs and connect more naturally with locals."}
            {travelScore >= 70 && travelScore < 90 && "You move through Japan with ease. Your remaining growth is nuance — reading native materials, understanding regional accents, and picking up on unspoken social cues."}
            {travelScore >= 90 && "You're operating at a near-native level for travel. Japan feels like a second home."}
          </div>
        </div>

        {/* Cultural norms */}
        <div className="space-y-3">
          <h2 className="font-medium text-sm text-gray-400 uppercase tracking-wide px-1">Japan Cultural Guide</h2>
          <p className="text-gray-500 text-sm px-1">Things that often surprise first-time visitors — knowing these will make you feel more at ease and less like a tourist.</p>
          <div className="space-y-2">
            {CULTURAL_NORMS.map((norm) => (
              <div key={norm.title} className="bg-gray-900 border border-white/10 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5 shrink-0">{norm.icon}</span>
                  <div>
                    <div className="font-medium text-white text-sm mb-1">{norm.title}</div>
                    <div className="text-gray-500 text-sm leading-relaxed">{norm.detail}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
