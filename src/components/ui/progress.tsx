import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number;
  className?: string;
  barClassName?: string;
  gradient?: boolean;
}

export function Progress({
  value,
  className,
  barClassName,
  gradient = true,
}: ProgressProps) {
  return (
    <div
      className={cn(
        "h-2 w-full overflow-hidden rounded-full bg-muted",
        className
      )}
    >
      <div
        className={cn(
          "h-full rounded-full transition-all duration-700 ease-out",
          gradient
            ? "bg-[linear-gradient(90deg,var(--primary),var(--accent))]"
            : "bg-primary",
          barClassName
        )}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
