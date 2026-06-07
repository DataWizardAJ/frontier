"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Flame, Zap, Sparkles } from "lucide-react";
import { navItems } from "@/lib/nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { MobileNav } from "@/components/layout/mobile-nav";
import type { Progress } from "@/lib/types";

export function Topbar() {
  const pathname = usePathname();
  const [progress, setProgress] = useState<Progress | null>(null);

  // Refresh stats on navigation so finishing a drill is reflected app-wide.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/progress")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setProgress(d.progress);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const current =
    navItems.find((i) =>
      i.href === "/" ? pathname === "/" : pathname.startsWith(i.href)
    ) ??
    (pathname.startsWith("/settings")
      ? { label: "Settings", tagline: "Configure Frontier" }
      : navItems[0]);

  const streak = progress?.streak ?? 0;
  const xp = progress?.xp ?? 0;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/70 px-4 backdrop-blur-xl md:px-8">
      <MobileNav />

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[15px] font-semibold leading-tight tracking-tight">
          {current.label}
        </h1>
        <p className="truncate text-xs text-muted-foreground">
          {current.tagline}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium sm:flex">
          <Flame className="size-4 text-[var(--warning)]" />
          <span>{streak}</span>
          <span className="text-xs text-muted-foreground">day streak</span>
        </div>
        <div className="hidden items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium sm:flex">
          <Zap className="size-4 text-primary" />
          <span>{xp.toLocaleString()}</span>
          <span className="text-xs text-muted-foreground">XP</span>
        </div>

        <ThemeToggle />

        <Link
          href="/settings"
          className="flex size-9 items-center justify-center rounded-xl bg-[linear-gradient(135deg,var(--primary),var(--accent))] text-white shadow-lg shadow-primary/25"
          aria-label="Profile"
        >
          <Sparkles className="size-[18px]" />
        </Link>
      </div>
    </header>
  );
}
