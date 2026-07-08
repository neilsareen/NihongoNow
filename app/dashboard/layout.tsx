import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PWAInstallBanner } from "./pwa-banner";
import { TimezoneSync } from "./timezone-sync";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <TimezoneSync />
      <nav className="sticky top-0 z-50 bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 rounded-b-[2rem] shadow-lg shadow-orange-900/40">
        <div className="max-w-lg mx-auto px-5 h-20 flex items-center justify-between">
          <Link href="/dashboard" className="font-display font-bold text-white flex items-center gap-2.5">
            <span className="jp-char text-4xl leading-none animate-wiggle inline-block drop-shadow-sm">行</span>
            <span className="text-lg tracking-widest uppercase">Ikou</span>
          </Link>
          <div className="flex items-center gap-0.5 bg-black/15 rounded-full px-1.5 py-1.5">
            <Link href="/lesson" className="text-sm font-medium text-white/90 hover:text-white transition-colors px-3 py-1.5 rounded-full hover:bg-black/15">
              Lesson
            </Link>
            <Link href="/analytics" className="text-sm font-medium text-white/90 hover:text-white transition-colors px-3 py-1.5 rounded-full hover:bg-black/15">
              Progress
            </Link>
            <Link href="/practice" className="text-base text-white/90 hover:text-white transition-colors px-3 py-1.5 rounded-full hover:bg-black/15 jp-char">
              練
            </Link>
            <Link href="/settings" className="text-sm font-medium text-white/90 hover:text-white transition-colors px-3 py-1.5 rounded-full hover:bg-black/15">
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
