"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Images,
  Star,
  FolderOpen,
  Settings,
  ArrowLeft,
  Scissors,
  Wand2,
  HelpCircle,
} from "lucide-react";
import type { SessionUser } from "@/lib/auth";

const NAV_ITEMS = [
  { href: "/galleries", label: "Galleries", icon: Images },
  { href: "/cull", label: "Cull", icon: Scissors },
  { href: "/shoots", label: "Shoots", icon: FolderOpen },
  { href: "/imagen", label: "Imagen AI", icon: Wand2 },
  { href: "/portfolio", label: "Portfolio", icon: Star },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/guide", label: "Guide", icon: HelpCircle },
];

export function Sidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-56 flex-col border-r border-white/[0.07] bg-dark-bg">
      {/* Header */}
      <div className="flex h-14 items-center gap-2 border-b border-white/[0.07] px-4">
        <div className="h-7 w-7 rounded-full bg-gold/20 flex items-center justify-center">
          <span className="text-gold text-xs font-semibold">D</span>
        </div>
        <span className="text-sm font-semibold tracking-tight">Darkroom</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 p-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-gold/10 text-gold"
                  : "text-white/50 hover:bg-white/[0.04] hover:text-white/80"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer — back to SM */}
      <div className="border-t border-white/[0.07] p-2">
        <a
          href="https://sm.macalister.nz"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-white/40 hover:bg-white/[0.04] hover:text-white/60 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Studio Manager
        </a>
        <div className="px-3 py-1.5 text-xs text-white/25">
          {user.displayName}
        </div>
      </div>
    </aside>
  );
}
