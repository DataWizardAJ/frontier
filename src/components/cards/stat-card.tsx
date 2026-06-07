import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent = "primary",
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  accent?: "primary" | "accent" | "warning" | "success";
}) {
  const accentColor =
    accent === "warning"
      ? "var(--warning)"
      : accent === "success"
        ? "var(--success)"
        : accent === "accent"
          ? "var(--accent)"
          : "var(--primary)";

  return (
    <Card className="relative overflow-hidden p-5">
      <div
        className="absolute -right-6 -top-6 size-24 rounded-full opacity-[0.12] blur-2xl"
        style={{ background: accentColor }}
      />
      <div className="flex items-center gap-3">
        <div
          className="flex size-10 items-center justify-center rounded-xl"
          style={{
            background: `color-mix(in srgb, ${accentColor} 16%, transparent)`,
            color: accentColor,
          }}
        >
          <Icon className="size-5" />
        </div>
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
      </div>
      <div className="mt-4 text-3xl font-semibold tracking-tight">{value}</div>
      {sub && (
        <div className={cn("mt-1 text-xs text-muted-foreground")}>{sub}</div>
      )}
    </Card>
  );
}
