"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, GraduationCap, Home, Layers, Settings, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// A conventional five-slot tab bar. The previous design floated a pill with a
// raised "+" bubble punched through it — visually loud, and it hid the label
// for the app's primary action behind an icon users had to guess at.
const ITEMS: { href: string; icon: LucideIcon; label: string; match: (p: string) => boolean }[] = [
  { href: "/dashboard", icon: Home, label: "Home", match: (p) => p === "/dashboard" },
  { href: "/lesson", icon: GraduationCap, label: "Learn", match: (p) => p.startsWith("/lesson") },
  { href: "/practice", icon: Layers, label: "Practice", match: (p) => p.startsWith("/practice") },
  { href: "/analytics", icon: BarChart3, label: "Progress", match: (p) => p.startsWith("/analytics") },
  { href: "/settings", icon: Settings, label: "Settings", match: (p) => p.startsWith("/settings") },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 border-t border-line bg-canvas/90 backdrop-blur-xl"
      aria-label="Primary"
    >
      <div className="max-w-lg mx-auto grid grid-cols-5 px-2 pb-[env(safe-area-inset-bottom)]">
        {ITEMS.map(({ href, icon: Icon, label, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 h-16 rounded-lg",
                "transition-colors duration-150 ease-swift",
                active ? "text-accent" : "text-text-subtle hover:text-text-muted"
              )}
            >
              {/* A hairline above the active tab, rather than a coloured blob */}
              <span
                className={cn(
                  "absolute top-0 left-1/2 -translate-x-1/2 h-px w-8 rounded-full transition-opacity duration-150",
                  active ? "bg-accent opacity-100" : "opacity-0"
                )}
              />
              <Icon className="w-[18px] h-[18px]" strokeWidth={active ? 2.2 : 1.75} />
              <span className="text-[10px] font-medium tracking-wide">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
