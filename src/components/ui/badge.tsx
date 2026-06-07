import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "bg-muted text-muted-foreground",
        primary:
          "bg-[color-mix(in_srgb,var(--primary)_18%,transparent)] text-primary",
        accent:
          "bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] text-accent",
        success:
          "bg-[color-mix(in_srgb,var(--success)_18%,transparent)] text-[var(--success)]",
        warning:
          "bg-[color-mix(in_srgb,var(--warning)_20%,transparent)] text-[var(--warning)]",
        outline: "border border-[var(--border-strong)] text-muted-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
