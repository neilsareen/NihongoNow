import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  const features = [
    { emoji: "🚉", title: "Designed for travelers", desc: "Every lesson is built around what you'll actually encounter — train stations, restaurants, shops, emergencies. You'll learn to read signs, order food, and ask for help." },
    { emoji: "🧠", title: "Learns with you", desc: "Spaced repetition shows you what you're forgetting before you forget it. Your session adapts daily based on what needs the most practice." },
    { emoji: "🗾", title: "Tracks your readiness", desc: "Your Travel Readiness score shows exactly where you are on the journey from complete beginner to confident Japan traveler." },
  ];

  return (
    <main className="min-h-screen bg-gray-950 bg-ambient-glow text-white flex flex-col overflow-hidden">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center max-w-xl mx-auto w-full">
        <div className="mb-3 text-6xl jp-char font-bold text-sunset tracking-tight animate-float">行</div>
        <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight mb-3">Ikou</h1>
        <p className="text-gray-300 text-base sm:text-lg mb-1">
          Built for adults who want to navigate Japan with confidence — not just survive it.
        </p>
        <p className="text-gray-500 text-sm mb-8">
          No prior knowledge needed. 10–15 minutes a day. ✨
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full justify-center mb-10">
          <Link
            href="/signup"
            className="bg-sunset text-white font-semibold py-3 px-8 rounded-full shadow-glow-warm hover:scale-[1.03] active:scale-[0.98] transition-transform text-base"
          >
            Start Learning Free
          </Link>
          <Link
            href="/login"
            className="border border-white/20 text-white font-semibold py-3 px-8 rounded-full hover:bg-white/5 transition-colors text-base"
          >
            Sign In
          </Link>
        </div>

        <div className="w-full pt-4 space-y-3 text-left">
          {features.map((f) => (
            <div key={f.title} className="flex items-start gap-3 py-3.5 px-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors">
              <span className="text-2xl leading-none shrink-0 mt-0.5">{f.emoji}</span>
              <div>
                <div className="font-display font-semibold text-white text-sm mb-1">{f.title}</div>
                <div className="text-gray-400 text-sm leading-relaxed">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="py-6 text-center border-t border-white/5">
        <p className="text-gray-600 text-xs">
          Focused on travelers & expats · Covers hiragana, katakana, kanji, vocabulary & phrases
        </p>
      </div>
    </main>
  );
}
