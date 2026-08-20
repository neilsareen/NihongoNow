import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PWAInstallBanner } from "./pwa-banner";
import { TimezoneSync } from "./timezone-sync";
import { BottomNav } from "@/app/components/bottom-nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-canvas text-text">
      <TimezoneSync />
      <PWAInstallBanner />
      {/* pb clears the 64px tab bar plus the home indicator inset */}
      <main className="max-w-lg mx-auto px-4 pt-5 pb-[calc(5.5rem+env(safe-area-inset-bottom))] safe-top">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
