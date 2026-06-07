import { ArrowUpRight, FileText, Clock, TrendingUp, ExternalLink, Bookmark } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Trend } from "@/lib/types";

export function TrendCard({ trend }: { trend: Trend }) {
  return (
    <Card className="group flex flex-col gap-3 p-5 transition-colors hover:border-[var(--border-strong)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="primary">{trend.category}</Badge>
          {trend.isNew && <Badge variant="accent">New</Badge>}
          {trend.origin === "instagram" && (
            <span
              title="Imported from your Instagram saves"
              className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
            >
              <Bookmark className="size-3" />
              Saved
            </span>
          )}
        </div>
        <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
      </div>

      <div>
        <h3 className="text-[15px] font-semibold leading-snug tracking-tight">
          {trend.title}
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          {trend.summary}
        </p>
      </div>

      <div className="rounded-xl bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground">
        <span className="font-medium text-foreground">Why it matters · </span>
        {trend.whyItMatters}
      </div>

      <div className="mt-auto flex items-center gap-4 pt-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <TrendingUp className="size-3.5 text-[var(--success)]" />
          {trend.momentum}% momentum
        </span>
        <span className="flex items-center gap-1.5">
          <FileText className="size-3.5" />
          {trend.sources} sources
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="size-3.5" />
          {trend.readMinutes} min
        </span>
      </div>

      {trend.sourceLinks && trend.sourceLinks.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-t border-border pt-3">
          {trend.sourceLinks.slice(0, 3).map((s, i) => (
            <a
              key={i}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              title={s.title}
              className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:border-[var(--border-strong)] hover:text-foreground"
            >
              <ExternalLink className="size-3" />
              <span className="max-w-[120px] truncate">{hostname(s.url)}</span>
            </a>
          ))}
        </div>
      )}
    </Card>
  );
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "source";
  }
}
