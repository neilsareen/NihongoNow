"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BarChart2, Settings, BookOpen, Plus, type LucideIcon } from "lucide-react";

const SIDE_ITEMS: { href: string; icon: LucideIcon; label: string }[] = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/analytics", icon: BarChart2, label: "Progress" },
];
const RIGHT_ITEMS: { href: string; icon: LucideIcon; label: string }[] = [
  { href: "/practice", icon: BookOpen, label: "Practice" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pointer-events-none">
      <div className="max-w-lg mx-auto relative pointer-events-auto">
        <div className="bg-gray-900/95 backdrop-blur border border-white/10 rounded-full h-16 flex items-center justify-between px-5 shadow-xl shadow-black/40">
          {SIDE_ITEMS.map((item) => (
            <NavIcon key={item.href} {...item} active={pathname === item.href} />
          ))}
          <div className="w-12 shrink-0" aria-hidden="true" />
          {RIGHT_ITEMS.map((item) => (
            <NavIcon key={item.href} {...item} active={pathname === item.href} />
          ))}
        </div>
        <Link
          href="/lesson"
          className="absolute left-1/2 -translate-x-1/2 -top-6 w-16 h-16 rounded-full bg-sunset shadow-glow-warm flex items-center justify-center active:scale-95 hover:scale-105 transition-transform border-4 border-gray-950"
          title="Start a lesson"
        >
          <Plus className="w-7 h-7 text-white" strokeWidth={2.5} />
        </Link>
      </div>
    </nav>
  );
}

function NavIcon({ href, icon: Icon, active }: { href: string; icon: LucideIcon; active: boolean }) {
  return (
    <Link href={href} className={`p-2.5 rounded-full transition-colors ${active ? "text-orange-400" : "text-gray-500 hover:text-gray-300"}`}>
      <Icon className="w-6 h-6" strokeWidth={active ? 2.5 : 2} />
    </Link>
  );
}
