import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function SectionHeader({
  title,
  action,
  href,
}: {
  title: string;
  action?: string;
  href?: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      {action && href && (
        <Link
          href={href}
          className="flex items-center gap-1 text-xs font-medium text-primary transition-opacity hover:opacity-80"
        >
          {action}
          <ArrowRight className="size-3.5" />
        </Link>
      )}
    </div>
  );
}
