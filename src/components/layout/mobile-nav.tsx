"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, Settings, Sparkles } from "lucide-react";
import { navItems } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <button
        aria-label="Open menu"
        onClick={() => setOpen(true)}
        className="flex size-9 items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-muted lg:hidden"
      >
        <Menu className="size-5" />
      </button>

      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            className="frontier-overlay fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
          />
          <aside
            className="frontier-drawer fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col border-r border-border bg-card px-4 py-5 lg:hidden"
          >
              <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-[linear-gradient(135deg,var(--primary),var(--accent))]">
                    <Sparkles className="size-5 text-white" />
                  </div>
                  <span className="text-base font-semibold">Frontier</span>
                </div>
                <button
                  aria-label="Close menu"
                  onClick={() => setOpen(false)}
                  className="flex size-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted"
                >
                  <X className="size-5" />
                </button>
              </div>

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
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                        active
                          ? "bg-[color-mix(in_srgb,var(--primary)_14%,transparent)] text-foreground"
                          : "text-muted-foreground hover:bg-muted"
                      )}
                    >
                      <Icon
                        className={cn("size-[18px]", active && "text-primary")}
                      />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              <Link
                href="/settings"
                onClick={() => setOpen(false)}
                className="mt-4 flex items-center gap-3 rounded-xl border-t border-border px-3 py-2.5 pt-4 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                <Settings className="size-[18px]" />
                Settings
              </Link>
          </aside>
        </>
      )}
    </>
  );
}
