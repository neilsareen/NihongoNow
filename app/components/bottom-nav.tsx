"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, GraduationCap, Home, Layers, Settings, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// A conventional five-slot tab bar. The previous design floated a pill with a
// raised "+" bubble punched through it — visually loud, and it hid the label
// for the app's primary action behind an icon users had to guess at.
// Each tab owns a colour, so the bar is a row of five distinct places rather
// than five grey icons that differ only in silhouette.
const ITEMS: {
  href: string; icon: LucideIcon; label: string; tone: string; match: (p: string) => boolean;
}[] = [
  { href: "/dashboard", icon: Home, label: "Home", tone: "var(--coral)", match: (p) => p === "/dashboard" },
  { href: "/lesson", icon: GraduationCap, label: "Learn", tone: "var(--lime)", match: (p) => p.startsWith("/lesson") },
  { href: "/practice", icon: Layers, label: "Drill", tone: "var(--sky)", match: (p) => p.startsWith("/practice") },
  { href: "/analytics", icon: BarChart3, label: "Progress", tone: "var(--grape)", match: (p) => p.startsWith("/analytics") },
  { href: "/settings", icon: Settings, label: "You", tone: "var(--blossom)", match: (p) => p.startsWith("/settings") },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 border-t border-line bg-ink/95 backdrop-blur-xl"
      aria-label="Primary"
    >
      <div className="max-w-lg mx-auto grid grid-cols-5 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {ITEMS.map(({ href, icon: Icon, label, tone, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className="flex flex-col items-center justify-center gap-1.5 h-14 rounded-tile group"
            >
              {/* The active tab's icon sits on a filled plate — unmissable at a
                  glance and at arm's length. */}
              <span
                className={cn(
                  "grid place-items-center rounded-full transition-all duration-150",
                  active ? "w-11 h-7" : "w-11 h-7"
                )}
                style={
                  active
                    ? { background: `hsl(${tone} / 0.2)`, color: `hsl(${tone})` }
                    : undefined
                }
              >
                <Icon
                  className={cn(
                    "w-[19px] h-[19px] transition-colors",
                    !active && "text-text-subtle group-hover:text-text-muted"
                  )}
                  strokeWidth={active ? 2.6 : 2}
                />
              </span>
              <span
                className={cn(
                  "font-display text-[10px] font-bold tracking-wide transition-colors",
                  !active && "text-text-subtle group-hover:text-text-muted"
                )}
                style={active ? { color: `hsl(${tone})` } : undefined}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
