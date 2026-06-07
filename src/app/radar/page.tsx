"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { RefreshCw, Clock, KeyRound, AlertTriangle, Sparkles } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { Card } from "@/components/ui/card";
import { TrendCard } from "@/components/cards/trend-card";
import { TREND_CATEGORIES, type Trend } from "@/lib/types";
import { cn } from "@/lib/utils";

type Status = "loading" | "idle" | "refreshing" | "error";

const STALE_MS = 24 * 60 * 60 * 1000;
const FILTERS: string[] = ["All", ...TREND_CATEGORIES];

function relativeTime(iso: string | null): string {
  if (!iso) return "never";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

export default function RadarPage() {
  const [trends, setTrends] = useState<Trend[]>([]);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string | null>(null);
  const [hasKey, setHasKey] = useState(true);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("All");
  const didInit = useRef(false);

  const refresh = useCallback(async () => {
    setStatus("refreshing");
    setError(null);
    try {
      const res = await fetch("/api/radar", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "no_key") setHasKey(false);
        setError(data.message ?? "Refresh failed.");
        setStatus("error");
        return;
      }
      setTrends(data.trends ?? []);
      setLastRefreshedAt(data.lastRefreshedAt ?? null);
      setHasKey(true);
      setStatus("idle");
    } catch {
      setError("Couldn't reach the server. Is the dev server running?");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    (async () => {
      try {
        const res = await fetch("/api/radar");
        const data = await res.json();
        setTrends(data.trends ?? []);
        setLastRefreshedAt(data.lastRefreshedAt ?? null);
        setHasKey(data.hasKey ?? false);
        setStatus("idle");
        // Daily digest: auto-refresh if we have a key and data is stale/empty.
        const stale =
          !data.lastRefreshedAt ||
          Date.now() - new Date(data.lastRefreshedAt).getTime() > STALE_MS;
        if (data.hasKey && stale) refresh();
      } catch {
        setError("Couldn't reach the server.");
        setStatus("error");
      }
    })();
  }, [refresh]);

  const refreshing = status === "refreshing";
  const visible =
    filter === "All" ? trends : trends.filter((t) => t.category === filter);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      {/* Header */}
      <Reveal>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              What&apos;s moving in AI
            </h1>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="size-3.5" />
              {refreshing ? "Scanning now…" : `Last scan · ${relativeTime(lastRefreshedAt)}`}
            </p>
          </div>
          <button
            onClick={refresh}
            disabled={refreshing || !hasKey}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[linear-gradient(120deg,var(--primary),var(--accent))] px-4 text-sm font-medium text-white shadow-lg shadow-primary/25 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
          >
            <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
            {refreshing ? "Scanning…" : "Refresh now"}
          </button>
        </div>
      </Reveal>

      {/* No key */}
      {!hasKey && (
        <Reveal>
          <Card className="flex flex-col items-start gap-3 p-6">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <KeyRound className="size-4 text-primary" />
              Connect your API key to go live
            </div>
            <p className="text-sm text-muted-foreground">
              The Radar uses Claude&apos;s web search to find current AI trends.
              Add your Anthropic API key and it&apos;ll start pulling real data.
            </p>
            <Link
              href="/settings"
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98]"
            >
              Go to Settings
            </Link>
          </Card>
        </Reveal>
      )}

      {/* Error */}
      {error && status === "error" && (
        <div className="flex items-start gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--danger)_40%,transparent)] bg-[color-mix(in_srgb,var(--danger)_8%,transparent)] p-4 text-sm">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[var(--danger)]" />
          <div>
            <div className="font-medium">Couldn&apos;t refresh</div>
            <div className="text-muted-foreground">{error}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      {trends.length > 0 && (
        <Reveal delay={0.05}>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                  filter === f
                    ? "border-transparent bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </Reveal>
      )}

      {/* Scanning state (no existing trends) */}
      {refreshing && trends.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--primary)_16%,transparent)] text-primary">
            <Sparkles className="size-6 animate-pulse" />
          </div>
          <div className="text-sm font-medium">Searching the web &amp; synthesising…</div>
          <div className="max-w-sm text-xs text-muted-foreground">
            Claude is scanning current sources and building your trend cards. This
            usually takes 1–2 minutes.
          </div>
          <div className="mt-2 grid w-full gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-44 animate-pulse rounded-2xl border border-border bg-card"
              />
            ))}
          </div>
        </div>
      )}

      {/* Trends */}
      {visible.length > 0 && (
        <Reveal delay={0.1}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((t) => (
              <TrendCard key={t.id} trend={t} />
            ))}
          </div>
        </Reveal>
      )}

      {/* Empty (have key, not refreshing, no trends) */}
      {hasKey &&
        status === "idle" &&
        trends.length === 0 &&
        !refreshing && (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <p className="text-sm font-medium">No trends yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Hit <span className="font-medium text-foreground">Refresh now</span> to
              pull the latest AI trends from the web.
            </p>
          </div>
        )}

      {/* Filtered-empty */}
      {trends.length > 0 && visible.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No trends in this category — try another filter.
        </div>
      )}
    </div>
  );
}
