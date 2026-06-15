import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-white/10 bg-gray-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="font-bold text-lg flex items-center gap-2"
          >
            <span className="jp-char text-purple-400 text-xl">日</span>
            <span>Nihongo Now</span>
          </Link>
          <div className="flex items-center gap-1 sm:gap-4">
            <Link
              href="/lesson"
              className="text-sm text-gray-400 hover:text-white transition-colors px-2 py-1"
            >
              Lesson
            </Link>
            <Link
              href="/analytics"
              className="text-sm text-gray-400 hover:text-white transition-colors px-2 py-1"
            >
              Progress
            </Link>
            <Link
              href="/settings"
              className="text-sm text-gray-400 hover:text-white transition-colors px-2 py-1"
            >
              Settings
            </Link>
          </div>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
