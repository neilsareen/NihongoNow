import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="space-y-2">
          <div className="text-7xl font-bold text-white jp-char">日本語</div>
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Nihongo Now
          </h1>
          <p className="text-xl text-purple-200">
            Practical Japanese for life in Japan
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          {[
            {
              icon: "🎯",
              title: "Practical Focus",
              desc: "Learn what you actually need to live in Japan — signs, menus, trains, daily life",
            },
            {
              icon: "🧠",
              title: "Smart Repetition",
              desc: "Spaced repetition adapts to you, spending more time on what you find difficult",
            },
            {
              icon: "📱",
              title: "Works Anywhere",
              desc: "Mobile-first design, installable as an app, works offline",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-white/10 backdrop-blur rounded-xl p-4 text-white"
            >
              <div className="text-2xl mb-2">{f.icon}</div>
              <div className="font-semibold">{f.title}</div>
              <div className="text-sm text-purple-200 mt-1">{f.desc}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          {[
            { label: "Hiragana", char: "あ" },
            { label: "Katakana", char: "ア" },
            { label: "Kanji", char: "漢" },
            { label: "Phrases", char: "話" },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-white/5 rounded-xl p-3 border border-white/10"
            >
              <div className="text-3xl jp-char text-purple-300">{item.char}</div>
              <div className="text-xs text-gray-400 mt-1">{item.label}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/signup"
            className="bg-purple-600 hover:bg-purple-500 text-white font-semibold py-3 px-8 rounded-xl transition-colors text-lg"
          >
            Start Learning Free
          </Link>
          <Link
            href="/login"
            className="bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-8 rounded-xl transition-colors text-lg backdrop-blur"
          >
            Sign In
          </Link>
        </div>

        <p className="text-purple-300/60 text-sm">
          Designed for adults planning to live in Japan · No prior knowledge needed
        </p>
      </div>
    </main>
  );
}
