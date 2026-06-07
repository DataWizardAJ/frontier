"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Sparkles,
  Wand2,
  ArrowRight,
  Clock,
  Loader2,
  KeyRound,
  Radar as RadarIcon,
} from "lucide-react";
import { Reveal } from "@/components/reveal";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/section-header";
import type { Explainer, Trend } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function ExplainersPage() {
  const router = useRouter();
  const [explainers, setExplainers] = useState<Explainer[]>([]);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [hasKey, setHasKey] = useState(true);
  const [loading, setLoading] = useState(true);
  const [topic, setTopic] = useState("");
  const [generating, setGenerating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const didInit = useRef(false);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    (async () => {
      try {
        const [ex, rad] = await Promise.all([
          fetch("/api/explainers").then((r) => r.json()),
          fetch("/api/radar").then((r) => r.json()),
        ]);
        setExplainers(ex.explainers ?? []);
        setHasKey(ex.hasKey ?? false);
        setTrends(rad.trends ?? []);
      } catch {
        setError("Couldn't load explainers.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const generate = useCallback(
    async (key: string, body: Record<string, unknown>) => {
      setGenerating(key);
      setError(null);
      try {
        const res = await fetch("/api/explainers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) {
          if (data.error === "no_key") setHasKey(false);
          setError(data.message ?? "Generation failed.");
          setGenerating(null);
          return;
        }
        router.push(`/explainers/${data.explainer.id}`);
      } catch {
        setError("Couldn't reach the server.");
        setGenerating(null);
      }
    },
    [router]
  );

  const explainerForTrend = (trendId: string) =>
    explainers.find((e) => e.trendId === trendId);

  const busy = generating !== null;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <Reveal>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            From trend to working knowledge
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Turn anything into a practical, step-by-step guide — generated on
            demand and saved for instant access later.
          </p>
        </div>
      </Reveal>

      {!hasKey && (
        <Reveal>
          <Card className="flex flex-col items-start gap-3 p-6">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <KeyRound className="size-4 text-primary" />
              Connect your API key to generate guides
            </div>
            <Link
              href="/settings"
              className="inline-flex h-9 items-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-all hover:brightness-110"
            >
              Go to Settings
            </Link>
          </Card>
        </Reveal>
      )}

      {error && (
        <div className="rounded-2xl border border-[color-mix(in_srgb,var(--danger)_40%,transparent)] bg-[color-mix(in_srgb,var(--danger)_8%,transparent)] p-4 text-sm text-muted-foreground">
          {error}
        </div>
      )}

      {/* Explain any topic */}
      <Reveal delay={0.05}>
        <Card className="gradient-border flex flex-col gap-4 p-6">
          <div className="flex items-center gap-2">
            <Wand2 className="size-4 text-primary" />
            <h2 className="text-sm font-semibold">Explain any topic</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Name a technique, tool, or concept and Frontier will write you a
            hands-on guide.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && topic.trim() && !busy && hasKey)
                  generate("topic", { topic: topic.trim() });
              }}
              disabled={busy || !hasKey}
              placeholder="e.g. prompt caching, building a tool-use agent, evals…"
              className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--border-strong)] focus:ring-2 focus:ring-[var(--ring)] disabled:opacity-50"
            />
            <button
              onClick={() => generate("topic", { topic: topic.trim() })}
              disabled={!topic.trim() || busy || !hasKey}
              className="inline-flex h-[42px] items-center justify-center gap-2 rounded-xl bg-[linear-gradient(120deg,var(--primary),var(--accent))] px-5 text-sm font-medium text-white shadow-lg shadow-primary/25 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
            >
              {generating === "topic" ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Writing…
                </>
              ) : (
                <>
                  <Sparkles className="size-4" /> Generate
                </>
              )}
            </button>
          </div>
          {generating === "topic" && (
            <p className="text-xs text-muted-foreground">
              Writing your guide — this takes 20-40 seconds.
            </p>
          )}
        </Card>
      </Reveal>

      {/* From a trend */}
      <Reveal delay={0.1}>
        <div>
          <SectionHeader
            title="Turn a Radar trend into a guide"
            action="Open Radar"
            href="/radar"
          />
          {trends.length === 0 ? (
            <Card className="flex flex-col items-center gap-2 p-8 text-center">
              <RadarIcon className="size-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No trends yet — visit the Radar and refresh to pull some in.
              </p>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {trends.map((t) => {
                const existing = explainerForTrend(t.id);
                return (
                  <Card
                    key={t.id}
                    className="flex items-center justify-between gap-3 p-4"
                  >
                    <div className="min-w-0">
                      <Badge variant="outline">{t.category}</Badge>
                      <h3 className="mt-1.5 truncate text-sm font-medium">
                        {t.title}
                      </h3>
                    </div>
                    {existing ? (
                      <Link
                        href={`/explainers/${existing.id}`}
                        className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-[var(--border-strong)] px-3 text-xs font-medium transition-colors hover:bg-muted"
                      >
                        Open <ArrowRight className="size-3.5" />
                      </Link>
                    ) : (
                      <button
                        onClick={() =>
                          generate(t.id, {
                            trendId: t.id,
                            title: t.title,
                            category: t.category,
                            summary: t.summary,
                          })
                        }
                        disabled={busy || !hasKey}
                        className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-medium text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
                      >
                        {generating === t.id ? (
                          <>
                            <Loader2 className="size-3.5 animate-spin" /> Writing…
                          </>
                        ) : (
                          <>
                            <Sparkles className="size-3.5" /> Explain
                          </>
                        )}
                      </button>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </Reveal>

      {/* Library */}
      <Reveal delay={0.15}>
        <div>
          <SectionHeader title="Your library" />
          {loading ? (
            <div className="grid gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-40 animate-pulse rounded-2xl border border-border bg-card"
                />
              ))}
            </div>
          ) : explainers.length === 0 ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              No guides yet. Generate one above and it&apos;ll be saved here.
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {explainers.map((e) => (
                <Link key={e.id} href={`/explainers/${e.id}`}>
                  <Card
                    className={cn(
                      "group flex h-full flex-col gap-3 p-5 transition-colors hover:border-[var(--border-strong)]"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex size-9 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--primary)_16%,transparent)] text-primary">
                        <BookOpen className="size-[18px]" />
                      </div>
                      <Badge variant="outline">{e.category}</Badge>
                    </div>
                    <h3 className="text-[15px] font-semibold leading-snug tracking-tight">
                      {e.title}
                    </h3>
                    <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                      {e.summary}
                    </p>
                    <div className="mt-auto flex items-center justify-between pt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Clock className="size-3.5" />
                        {e.readMinutes} min · {e.steps.length} steps
                      </span>
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </Reveal>
    </div>
  );
}
