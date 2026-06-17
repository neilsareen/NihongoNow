import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center max-w-xl mx-auto w-full">
        <div className="mb-2 text-5xl jp-char font-bold text-white/90 tracking-tight">日本語</div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">Nihongo Now</h1>
        <p className="text-gray-300 text-base sm:text-lg mb-1">
          Built for adults who want to navigate Japan with confidence — not just survive it.
        </p>
        <p className="text-gray-500 text-sm mb-8">
          No prior knowledge needed. 10–15 minutes a day.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full justify-center mb-10">
          <Link
            href="/signup"
            className="bg-white text-gray-950 font-semibold py-3 px-8 rounded-lg hover:bg-gray-100 transition-colors text-base"
          >
            Start Learning Free
          </Link>
          <Link
            href="/login"
            className="border border-white/20 text-white font-semibold py-3 px-8 rounded-lg hover:bg-white/5 transition-colors text-base"
          >
            Sign In
          </Link>
        </div>

        <div className="w-full border-t border-white/5 pt-8 space-y-3 text-left">
          {[
            {
              title: "Designed for travelers",
              desc: "Every lesson is built around what you'll actually encounter — train stations, restaurants, shops, emergencies. You'll learn to read signs, order food, and ask for help.",
            },
            {
              title: "Learns with you",
              desc: "Spaced repetition shows you what you're forgetting before you forget it. Your session adapts daily based on what needs the most practice.",
            },
            {
              title: "Tracks your readiness",
              desc: "Your Travel Readiness score shows exactly where you are on the journey from complete beginner to confident Japan traveler.",
            },
          ].map((f) => (
            <div key={f.title} className="py-3 border-b border-white/5 last:border-0">
              <div className="font-medium text-white text-sm mb-1">{f.title}</div>
              <div className="text-gray-400 text-sm leading-relaxed">{f.desc}</div>
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
