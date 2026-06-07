"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Flame,
  Zap,
  Radar as RadarIcon,
  Target,
  ArrowRight,
  FlaskConical,
  TrendingUp,
  Sparkles,
  KeyRound,
} from "lucide-react";
import { Reveal } from "@/components/reveal";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/cards/stat-card";
import { TrendCard } from "@/components/cards/trend-card";
import { SectionHeader } from "@/components/section-header";
import { SKILL_AREAS } from "@/lib/skills";
import type {
  Trend,
  Progress as ProgressT,
  SandboxSession,
} from "@/lib/types";
import { greeting, formatDate } from "@/lib/utils";

const XP_PER_LEVEL = 500;

export default function DashboardPage() {
  // Recomputed each render — slight SSR/CSR difference is suppressed below.
  const now = new Date();
  const [progress, setProgress] = useState<ProgressT | null>(null);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [sessions, setSessions] = useState<SandboxSession[]>([]);
  const [hasKey, setHasKey] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [prog, rad, sand] = await Promise.all([
          fetch("/api/progress").then((r) => r.json()),
          fetch("/api/radar").then((r) => r.json()),
          fetch("/api/sandbox").then((r) => r.json()),
        ]);
        setProgress(prog.progress);
        setHasKey(prog.hasKey ?? false);
        setTrends(rad.trends ?? []);
        setSessions(sand.sessions ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const xp = progress?.xp ?? 0;
  const level = progress?.level ?? 1;
  const streak = progress?.streak ?? 0;
  const xpIntoLevel = xp % XP_PER_LEVEL;
  const xpToNext = XP_PER_LEVEL - xpIntoLevel;
  const xpPct = (xpIntoLevel / XP_PER_LEVEL) * 100;
  const accuracy =
    progress && progress.totalAnswered > 0
      ? Math.round((progress.totalCorrect / progress.totalAnswered) * 100)
      : 0;
  const masteryOf = (id: string) => progress?.skills[id]?.mastery ?? 0;
  const recommended = [...SKILL_AREAS].sort(
    (a, b) => masteryOf(a.id) - masteryOf(b.id)
  )[0];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      {/* No key onboarding */}
      {!loading && !hasKey && (
        <Reveal>
          <Card className="gradient-border flex flex-col items-start gap-3 p-6">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <KeyRound className="size-4 text-primary" />
              Welcome to Frontier — let&apos;s connect your AI engine
            </div>
            <p className="text-sm text-muted-foreground">
              Add your Anthropic API key to unlock live trends, generated
              explainers, drills, and the sandbox.
            </p>
            <Link
              href="/settings"
              className="inline-flex h-9 items-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-all hover:brightness-110"
            >
              Connect API key
            </Link>
          </Card>
        </Reveal>
      )}

      {/* Hero */}
      <Reveal>
        <Card className="gradient-border relative overflow-hidden p-6 md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <p
                className="text-sm text-muted-foreground"
                suppressHydrationWarning
              >
                {formatDate(now)}
              </p>
              <h1
                className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl"
                suppressHydrationWarning
              >
                {greeting(now)}, let&apos;s push the{" "}
                <span className="gradient-text">frontier</span>.
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {streak > 0
                  ? `You're on a ${streak}-day streak. `
                  : "Start a streak today. "}
                Scan today&apos;s trends, sharpen a skill, then go experiment.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/radar"
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-[linear-gradient(120deg,var(--primary),var(--accent))] px-5 text-sm font-medium text-white shadow-lg shadow-primary/25 transition-all hover:brightness-110 active:scale-[0.98]"
                >
                  <RadarIcon className="size-4" />
                  Scan the Radar
                </Link>
                <Link
                  href="/drills"
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-[var(--border-strong)] px-5 text-sm font-medium transition-colors hover:bg-muted active:scale-[0.98]"
                >
                  <Target className="size-4" />
                  Today&apos;s drill
                </Link>
              </div>
            </div>

            {/* Level ring */}
            <div className="flex shrink-0 items-center gap-4 rounded-2xl border border-border bg-card/60 p-5">
              <div className="relative flex size-20 items-center justify-center">
                <svg className="size-20 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="var(--muted)" strokeWidth="9" />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="url(#grad)"
                    strokeWidth="9"
                    strokeLinecap="round"
                    strokeDasharray={`${(xpPct / 100) * 264} 264`}
                  />
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" />
                      <stop offset="100%" stopColor="var(--accent)" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-lg font-semibold leading-none">{level}</span>
                  <span className="text-[10px] text-muted-foreground">level</span>
                </div>
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-1.5 text-sm font-semibold">
                  <Sparkles className="size-4 text-primary" />
                  {xp.toLocaleString()} XP
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {xpToNext} XP to level {level + 1}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </Reveal>

      {/* Stats */}
      <Reveal delay={0.05}>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon={Flame} label="Day streak" value={streak} sub={streak > 0 ? "Keep it alive today" : "Begin today"} accent="warning" />
          <StatCard icon={Zap} label="Total XP" value={xp.toLocaleString()} sub={`Level ${level}`} accent="primary" />
          <StatCard icon={RadarIcon} label="Trends tracked" value={trends.length} sub={trends.length > 0 ? "On your Radar" : "Scan to populate"} accent="accent" />
          <StatCard icon={TrendingUp} label="Drill accuracy" value={`${accuracy}%`} sub={`${progress?.totalAnswered ?? 0} answered`} accent="success" />
        </div>
      </Reveal>

      {/* Main grid */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Radar */}
        <div className="lg:col-span-2">
          <Reveal delay={0.1}>
            <SectionHeader title="Today on the Radar" action="View all" href="/radar" />
            {loading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-44 animate-pulse rounded-2xl border border-border bg-card" />
                ))}
              </div>
            ) : trends.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {trends.slice(0, 4).map((t) => (
                  <TrendCard key={t.id} trend={t} />
                ))}
              </div>
            ) : (
              <Card className="flex flex-col items-center gap-2 p-8 text-center">
                <RadarIcon className="size-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No trends yet. Scan the Radar to see what&apos;s moving in AI.
                </p>
                <Link href="/radar" className="mt-1 inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-all hover:brightness-110">
                  <RadarIcon className="size-4" /> Open Radar
                </Link>
              </Card>
            )}
          </Reveal>
        </div>

        {/* Side */}
        <div className="flex flex-col gap-8">
          <Reveal delay={0.15}>
            <SectionHeader title="Continue learning" action="All drills" href="/drills" />
            {recommended && (
              <Card className="flex flex-col gap-4 p-5">
                <div>
                  <span className="flex items-center gap-1.5 text-xs font-medium text-primary">
                    <Sparkles className="size-3.5" /> Recommended
                  </span>
                  <h3 className="mt-1 text-[15px] font-semibold tracking-tight">
                    {recommended.name}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {recommended.description}
                  </p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Mastery</span>
                    <span className="font-medium">{masteryOf(recommended.id)}%</span>
                  </div>
                  <Progress value={masteryOf(recommended.id)} />
                </div>
                <Link
                  href="/drills"
                  className="mt-auto inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[linear-gradient(120deg,var(--primary),var(--accent))] text-sm font-medium text-white shadow-lg shadow-primary/20 transition-all hover:brightness-110 active:scale-[0.98]"
                >
                  <Target className="size-4" /> Start drill
                </Link>
              </Card>
            )}
          </Reveal>

          <Reveal delay={0.2}>
            <SectionHeader title="Skill mastery" />
            <Card className="flex flex-col gap-4 p-5">
              {SKILL_AREAS.map((s) => (
                <div key={s.id} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{s.name}</span>
                    <span className="text-xs text-muted-foreground">{masteryOf(s.id)}%</span>
                  </div>
                  <Progress value={masteryOf(s.id)} />
                </div>
              ))}
            </Card>
          </Reveal>
        </div>
      </div>

      {/* Sandbox */}
      <Reveal delay={0.1}>
        <SectionHeader title="Recent sandbox sessions" action="Open sandbox" href="/sandbox" />
        {sessions.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-3">
            {sessions.slice(0, 3).map((s) => (
              <Link key={s.id} href="/sandbox">
                <Card className="group flex h-full flex-col gap-3 p-5 transition-colors hover:border-[var(--border-strong)]">
                  <div className="flex items-center justify-between">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] text-accent">
                      <FlaskConical className="size-[18px]" />
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{s.title}</h3>
                  <div className="mt-auto text-xs text-muted-foreground">
                    {s.messages.length} messages
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="flex flex-col items-center gap-2 p-8 text-center">
            <FlaskConical className="size-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No experiments yet. Open the Sandbox to try a technique.
            </p>
            <Link href="/sandbox" className="mt-1 inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-all hover:brightness-110">
              <FlaskConical className="size-4" /> Open Sandbox
            </Link>
          </Card>
        )}
      </Reveal>
    </div>
  );
}
