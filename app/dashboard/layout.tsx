import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PWAInstallBanner } from "./pwa-banner";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="sticky top-0 z-50 px-4 pt-3 pb-2">
        <div className="max-w-lg mx-auto bg-gray-900/95 backdrop-blur-md border border-white/10 rounded-2xl px-4 h-14 flex items-center justify-between shadow-lg shadow-black/30">
          <Link href="/dashboard" className="font-semibold flex items-center gap-2">
            <span className="jp-char text-white text-xl leading-none">日</span>
            <span className="text-sm tracking-wide">Nihongo Now</span>
          </Link>
          <div className="flex items-center gap-0.5 bg-gray-800/60 rounded-full px-1.5 py-1.5">
            <Link href="/lesson" className="text-xs text-gray-400 hover:text-white transition-colors px-3 py-1 rounded-full hover:bg-white/10">
              Lesson
            </Link>
            <Link href="/analytics" className="text-xs text-gray-400 hover:text-white transition-colors px-3 py-1 rounded-full hover:bg-white/10">
              Progress
            </Link>
            <Link href="/practice" className="text-xs text-gray-400 hover:text-white transition-colors px-3 py-1 rounded-full hover:bg-white/10 jp-char">
              練
            </Link>
            <Link href="/settings" className="text-xs text-gray-400 hover:text-white transition-colors px-3 py-1 rounded-full hover:bg-white/10">
              Settings
            </Link>
          </div>
        </div>
      </nav>
      <PWAInstallBanner />
      <main className="max-w-lg mx-auto px-4 pt-6 pb-12 safe-top">{children}</main>
    </div>
  );
}
