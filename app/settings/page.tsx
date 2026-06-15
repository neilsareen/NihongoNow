"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-white/10 bg-gray-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="font-bold text-lg flex items-center gap-2">
            <span className="jp-char text-purple-400 text-xl">日</span>
            <span>Nihongo Now</span>
          </Link>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6 max-w-lg">
        <h1 className="text-2xl font-bold">Settings</h1>

        <div className="bg-gray-900 border border-white/10 rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-gray-300">Account</h2>
          <button
            onClick={handleSignOut}
            className="w-full bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 font-medium py-2.5 rounded-lg transition-colors"
          >
            Sign Out
          </button>
        </div>
      </main>
    </div>
  );
}
