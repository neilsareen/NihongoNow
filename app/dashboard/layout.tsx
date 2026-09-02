import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAvatar, currentStreakAsOf } from "@/lib/utils";
import { cookies } from "next/headers";
import { PWAInstallBanner } from "./pwa-banner";
import { TimezoneSync } from "./timezone-sync";
import { AppHeader } from "@/app/components/app-header";
import { BottomNav } from "@/app/components/bottom-nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Only what the header wears. A learner mid-onboarding has no profile row
  // yet — the page redirects them out, and until it does the header renders
  // as the brand alone rather than as an empty avatar.
  const profile = await prisma.userProfile.findUnique({
    where: { id: user.id },
    select: { avatarUrl: true, currentStreak: true, lastStudiedAt: true },
  });

  // The stored streak is only written when a lesson completes, so it has to be
  // aged against the learner's local today before it goes on screen — otherwise
  // a run they broke weeks ago is still burning in the header.
  const timeZone = (await cookies()).get("tz")?.value || "UTC";

  return (
    <div className="min-h-screen bg-ink text-text">
      <TimezoneSync />
      <AppHeader
        avatar={profile ? getAvatar(profile.avatarUrl) : null}
        streak={profile ? currentStreakAsOf(profile, timeZone) : undefined}
      />
      <PWAInstallBanner />
      {/* pb clears the 64px tab bar plus the home indicator inset */}
      <main className="max-w-lg mx-auto px-4 pt-6 pb-[calc(5.5rem+var(--safe-b))]">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
