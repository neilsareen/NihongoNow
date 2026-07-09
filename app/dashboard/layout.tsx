import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PWAInstallBanner } from "./pwa-banner";
import { TimezoneSync } from "./timezone-sync";
import { BottomNav } from "./bottom-nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <TimezoneSync />
      <PWAInstallBanner />
      <main className="max-w-lg mx-auto px-4 pt-6 pb-28 safe-top">{children}</main>
      <BottomNav />
    </div>
  );
}
