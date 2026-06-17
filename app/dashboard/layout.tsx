import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-white/10 bg-gray-950/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="font-semibold flex items-center gap-1.5">
            <span className="jp-char text-white text-lg">日</span>
            <span className="text-sm">Nihongo Now</span>
          </Link>
          <div className="flex items-center gap-1">
            <Link href="/lesson" className="text-xs text-gray-400 hover:text-white transition-colors px-2.5 py-1.5 rounded-md hover:bg-white/5">
              Lesson
            </Link>
            <Link href="/analytics" className="text-xs text-gray-400 hover:text-white transition-colors px-2.5 py-1.5 rounded-md hover:bg-white/5">
              Progress
            </Link>
            <Link href="/review/weakest" className="text-xs text-gray-400 hover:text-white transition-colors px-2.5 py-1.5 rounded-md hover:bg-white/5">
              Review
            </Link>
            <Link href="/settings" className="text-xs text-gray-400 hover:text-white transition-colors px-2.5 py-1.5 rounded-md hover:bg-white/5">
              Settings
            </Link>
          </div>
        </div>
      </nav>
      <main className="max-w-lg mx-auto px-4 pt-6 pb-12 safe-top">{children}</main>
    </div>
  );
}
