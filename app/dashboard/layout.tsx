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
      <nav className="sticky top-0 z-50 shadow-2xl shadow-black/60">
        <div className="relative bg-[#0d1929] overflow-hidden" style={{ borderRadius: "0 0 1.5rem 1.5rem" }}>
          {/* Japan red accent stripe */}
          <div className="h-[3px] bg-gradient-to-r from-transparent via-[#BC002D] to-transparent" />

          <div className="max-w-lg mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#BC002D] flex items-center justify-center shadow-lg shadow-red-900/60">
                <span className="jp-char text-white text-sm font-bold">日</span>
              </div>
              <div className="flex flex-col -space-y-0.5">
                <span className="font-bold text-white text-sm leading-tight">Nihongo Now</span>
                <span className="jp-char text-[#E8334A] text-[10px] leading-tight tracking-widest">日本語</span>
              </div>
            </Link>

            <div className="flex items-center gap-0.5">
              <Link href="/lesson" className="text-xs text-gray-400 hover:text-white hover:bg-[#BC002D]/15 transition-all px-2.5 py-1.5 rounded-md">
                Lesson
              </Link>
              <Link href="/analytics" className="text-xs text-gray-400 hover:text-white hover:bg-[#BC002D]/15 transition-all px-2.5 py-1.5 rounded-md">
                Progress
              </Link>
              <Link href="/practice" className="text-xs text-gray-400 hover:text-white hover:bg-[#BC002D]/15 transition-all px-2.5 py-1.5 rounded-md jp-char">
                練
              </Link>
              <Link href="/settings" className="text-xs text-gray-400 hover:text-white hover:bg-[#BC002D]/15 transition-all px-2.5 py-1.5 rounded-md">
                Settings
              </Link>
            </div>
          </div>

          {/* Subtle crimson bottom border */}
          <div className="h-px bg-gradient-to-r from-transparent via-[#BC002D]/30 to-transparent" />
        </div>
      </nav>
      <PWAInstallBanner />
      <main className="max-w-lg mx-auto px-4 pt-6 pb-12 safe-top">{children}</main>
    </div>
  );
}
