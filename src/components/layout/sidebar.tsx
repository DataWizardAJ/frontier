"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, Sparkles } from "lucide-react";
import { navItems } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 flex-col border-r border-border bg-card/40 px-4 py-5 backdrop-blur-xl lg:flex">
      {/* Brand */}
      <Link href="/" className="mb-8 flex items-center gap-3 px-2">
        <div className="flex size-9 items-center justify-center rounded-xl bg-[linear-gradient(135deg,var(--primary),var(--accent))] shadow-lg shadow-primary/30">
          <Sparkles className="size-5 text-white" />
        </div>
        <div className="leading-tight">
          <div className="text-base font-semibold tracking-tight">Frontier</div>
          <div className="text-[11px] text-muted-foreground">
            AI operator cockpit
          </div>
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {active && (
                <span
                  className="absolute inset-0 rounded-xl bg-[color-mix(in_srgb,var(--primary)_14%,transparent)] ring-1 ring-inset ring-[color-mix(in_srgb,var(--primary)_30%,transparent)]"
                />
              )}
              <Icon
                className={cn(
                  "relative size-[18px] shrink-0 transition-colors",
                  active && "text-primary"
                )}
              />
              <span className="relative">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mt-4 flex flex-col gap-1 border-t border-border pt-4">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
            pathname.startsWith("/settings")
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Settings className="size-[18px]" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
