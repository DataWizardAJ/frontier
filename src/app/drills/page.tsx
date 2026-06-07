"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Flame,
  Zap,
  Target,
  CheckCircle2,
  XCircle,
  Loader2,
  Sparkles,
  X,
  ArrowRight,
  KeyRound,
  TrendingUp,
  PartyPopper,
} from "lucide-react";
import { Reveal } from "@/components/reveal";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SKILL_AREAS } from "@/lib/skills";
import type {
  Drill,
  Progress as ProgressT,
  GradeVerdict,
  CompleteResult,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const XP_PER_LEVEL = 500;
type Mode = "browse" | "loading" | "playing" | "results";

export default function DrillsPage() {
  const [progress, setProgress] = useState<ProgressT | null>(null);
  const [hasKey, setHasKey] = useState(true);
  const [mode, setMode] = useState<Mode>("browse");
  const [error, setError] = useState<string | null>(null);

  const [drill, setDrill] = useState<Drill | null>(null);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<number[]>([]);

  // current-question interaction
  const [picked, setPicked] = useState<number | null>(null);
  const [openText, setOpenText] = useState("");
  const [checked, setChecked] = useState(false);
  const [grading, setGrading] = useState(false);
  const [verdict, setVerdict] = useState<GradeVerdict | null>(null);
  const [feedback, setFeedback] = useState("");
  const [finishing, setFinishing] = useState(false);

  const [completion, setCompletion] = useState<CompleteResult | null>(null);
  const didInit = useRef(false);

  const loadProgress = useCallback(async () => {
    try {
      const data = await fetch("/api/progress").then((r) => r.json());
      setProgress(data.progress);
      setHasKey(data.hasKey ?? false);
    } catch {
      setError("Couldn't load progress.");
    }
  }, []);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    loadProgress();
  }, [loadProgress]);

  const resetQuestionState = () => {
    setPicked(null);
    setOpenText("");
    setChecked(false);
    setGrading(false);
    setVerdict(null);
    setFeedback("");
  };

  const startDrill = useCallback(async (skillId: string) => {
    setMode("loading");
    setError(null);
    try {
      const res = await fetch("/api/drills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillId }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "no_key") setHasKey(false);
        setError(data.message ?? "Couldn't build the drill.");
        setMode("browse");
        return;
      }
      setDrill(data.drill);
      setIndex(0);
      setResults([]);
      resetQuestionState();
      setMode("playing");
    } catch {
      setError("Couldn't reach the server.");
      setMode("browse");
    }
  }, []);

  const current = drill?.questions[index];
  const isLast = drill ? index === drill.questions.length - 1 : false;

  const checkMcq = () => {
    if (picked === null || !current) return;
    const correct = picked === current.correctIndex;
    setVerdict(correct ? "correct" : "incorrect");
    setChecked(true);
  };

  const submitOpen = async () => {
    if (!current) return;
    setGrading(true);
    try {
      const res = await fetch("/api/drills/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: current.prompt,
          idealAnswer: current.idealAnswer,
          userAnswer: openText,
        }),
      });
      const data = await res.json();
      const v: GradeVerdict = data.result?.verdict ?? "partial";
      setVerdict(v);
      setFeedback(data.result?.feedback ?? "");
    } catch {
      setVerdict("partial");
      setFeedback("Couldn't grade that one — counting it as partial.");
    } finally {
      setGrading(false);
      setChecked(true);
    }
  };

  const scoreForVerdict = (v: GradeVerdict | null): number =>
    v === "correct" ? 1 : v === "partial" ? 0.5 : 0;

  const next = async () => {
    const newResults = [...results, scoreForVerdict(verdict)];
    setResults(newResults);
    if (!isLast) {
      setIndex((i) => i + 1);
      resetQuestionState();
      return;
    }
    // finish
    if (!drill) return;
    setFinishing(true);
    const score = newResults.reduce((a, b) => a + b, 0);
    try {
      const res = await fetch("/api/drills/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skillId: drill.skillId,
          skillName: drill.skillName,
          score,
          total: drill.questions.length,
        }),
      });
      const data: CompleteResult = await res.json();
      setCompletion(data);
      setProgress(data.progress);
    } catch {
      /* keep going to results even if save failed */
    } finally {
      setFinishing(false);
      setMode("results");
    }
  };

  // ---------- BROWSE ----------
  if (mode === "browse" || mode === "loading") {
    const xpIntoLevel = progress ? progress.xp % XP_PER_LEVEL : 0;
    const levelPct = (xpIntoLevel / XP_PER_LEVEL) * 100;
    const accuracy =
      progress && progress.totalAnswered > 0
        ? Math.round((progress.totalCorrect / progress.totalAnswered) * 100)
        : 0;
    const masteryOf = (id: string) => progress?.skills[id]?.mastery ?? 0;
    const recommended = [...SKILL_AREAS].sort(
      (a, b) => masteryOf(a.id) - masteryOf(b.id)
    )[0];
    const loading = mode === "loading";

    return (
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        {!hasKey && (
          <Reveal>
            <Card className="flex flex-col items-start gap-3 p-6">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <KeyRound className="size-4 text-primary" />
                Connect your API key to start drilling
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

        {/* Header stats */}
        <Reveal>
          <Card className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--warning)_18%,transparent)] text-[var(--warning)]">
                <Flame className="size-6" />
              </div>
              <div>
                <div className="text-lg font-semibold tracking-tight">
                  {progress?.streak ?? 0}-day streak
                </div>
                <div className="text-sm text-muted-foreground">
                  {accuracy}% accuracy · {progress?.totalAnswered ?? 0} answered
                </div>
              </div>
            </div>
            <div className="w-full max-w-xs">
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-medium">
                  <Zap className="size-3.5 text-primary" /> Level {progress?.level ?? 1}
                </span>
                <span className="text-muted-foreground">
                  {XP_PER_LEVEL - xpIntoLevel} XP to next
                </span>
              </div>
              <Progress value={levelPct} />
            </div>
          </Card>
        </Reveal>

        {/* Recommended */}
        {recommended && (
          <Reveal delay={0.05}>
            <Card className="gradient-border flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-medium text-primary">
                  <Sparkles className="size-4" /> Recommended next
                </div>
                <h2 className="mt-1 text-lg font-semibold tracking-tight">
                  {recommended.name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {recommended.description}
                </p>
              </div>
              <button
                onClick={() => startDrill(recommended.id)}
                disabled={loading || !hasKey}
                className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-[linear-gradient(120deg,var(--primary),var(--accent))] px-6 text-sm font-medium text-white shadow-lg shadow-primary/25 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Building…
                  </>
                ) : (
                  <>
                    <Target className="size-4" /> Start drill
                  </>
                )}
              </button>
            </Card>
          </Reveal>
        )}

        {/* Skill grid */}
        <Reveal delay={0.1}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Train a skill
          </h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {SKILL_AREAS.map((s) => (
              <Card key={s.id} className="flex flex-col gap-4 p-5">
                <div>
                  <h3 className="text-[15px] font-semibold tracking-tight">
                    {s.name}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {s.description}
                  </p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Mastery</span>
                    <span className="font-medium">{masteryOf(s.id)}%</span>
                  </div>
                  <Progress value={masteryOf(s.id)} />
                </div>
                <button
                  onClick={() => startDrill(s.id)}
                  disabled={loading || !hasKey}
                  className="mt-auto inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[var(--border-strong)] text-sm font-medium transition-colors hover:bg-muted active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <>
                      <Target className="size-4" /> Practice
                    </>
                  )}
                </button>
              </Card>
            ))}
          </div>
        </Reveal>
      </div>
    );
  }

  // ---------- PLAYING ----------
  if (mode === "playing" && drill && current) {
    const total = drill.questions.length;
    const answeredPct = (index / total) * 100;
    const verdictColor =
      verdict === "correct"
        ? "var(--success)"
        : verdict === "partial"
          ? "var(--warning)"
          : "var(--danger)";

    return (
      <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col gap-6">
        {/* progress bar */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMode("browse")}
            className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-muted"
            aria-label="Quit drill"
          >
            <X className="size-4" />
          </button>
          <Progress value={answeredPct} className="h-2.5" />
          <span className="shrink-0 text-xs font-medium text-muted-foreground">
            {index + 1}/{total}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="primary">{drill.skillName}</Badge>
          <Badge variant="outline">
            {current.type === "mcq" ? "Multiple choice" : "Open answer"}
          </Badge>
        </div>

        <h2 className="text-lg font-medium leading-relaxed">{current.prompt}</h2>

        {/* MCQ */}
        {current.type === "mcq" && (
          <div className="flex flex-col gap-2.5">
            {current.options.map((opt, i) => {
              const isPicked = picked === i;
              const isCorrect = i === current.correctIndex;
              const show = checked && (isPicked || isCorrect);
              return (
                <button
                  key={i}
                  disabled={checked}
                  onClick={() => setPicked(i)}
                  className={cn(
                    "flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-all",
                    !checked &&
                      (isPicked
                        ? "border-primary bg-[color-mix(in_srgb,var(--primary)_12%,transparent)]"
                        : "border-border hover:border-[var(--border-strong)] hover:bg-muted"),
                    show && isCorrect &&
                      "border-[var(--success)] bg-[color-mix(in_srgb,var(--success)_14%,transparent)]",
                    show && isPicked && !isCorrect &&
                      "border-[var(--danger)] bg-[color-mix(in_srgb,var(--danger)_14%,transparent)]"
                  )}
                >
                  <span>{opt}</span>
                  {show && isCorrect && (
                    <CheckCircle2 className="size-5 text-[var(--success)]" />
                  )}
                  {show && isPicked && !isCorrect && (
                    <XCircle className="size-5 text-[var(--danger)]" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Open */}
        {current.type === "open" && (
          <textarea
            value={openText}
            onChange={(e) => setOpenText(e.target.value)}
            disabled={checked}
            rows={4}
            placeholder="Type your answer…"
            className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--border-strong)] focus:ring-2 focus:ring-[var(--ring)] disabled:opacity-70"
          />
        )}

        {/* Feedback */}
        {checked && (
          <Card className="flex flex-col gap-2 p-4">
            <div
              className="flex items-center gap-2 text-sm font-semibold"
              style={{ color: verdictColor }}
            >
              {verdict === "correct" ? (
                <CheckCircle2 className="size-4" />
              ) : verdict === "partial" ? (
                <TrendingUp className="size-4" />
              ) : (
                <XCircle className="size-4" />
              )}
              {verdict === "correct"
                ? "Correct"
                : verdict === "partial"
                  ? "Partly there"
                  : "Not quite"}
            </div>
            {current.type === "open" && feedback && (
              <p className="text-sm text-muted-foreground">{feedback}</p>
            )}
            {current.type === "open" && current.idealAnswer && (
              <p className="text-sm">
                <span className="font-medium">Model answer · </span>
                <span className="text-muted-foreground">{current.idealAnswer}</span>
              </p>
            )}
            {current.explanation && (
              <p className="text-sm text-muted-foreground">
                {current.explanation}
              </p>
            )}
          </Card>
        )}

        {/* Actions */}
        <div className="mt-auto flex justify-end">
          {!checked ? (
            current.type === "mcq" ? (
              <button
                onClick={checkMcq}
                disabled={picked === null}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-[linear-gradient(120deg,var(--primary),var(--accent))] px-6 text-sm font-medium text-white shadow-lg shadow-primary/25 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40"
              >
                Check
              </button>
            ) : (
              <button
                onClick={submitOpen}
                disabled={!openText.trim() || grading}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-[linear-gradient(120deg,var(--primary),var(--accent))] px-6 text-sm font-medium text-white shadow-lg shadow-primary/25 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40"
              >
                {grading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Grading…
                  </>
                ) : (
                  "Submit"
                )}
              </button>
            )
          ) : (
            <button
              onClick={next}
              disabled={finishing}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
            >
              {finishing ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Saving…
                </>
              ) : isLast ? (
                "Finish"
              ) : (
                <>
                  Next <ArrowRight className="size-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ---------- RESULTS ----------
  if (mode === "results" && drill) {
    const score = results.reduce((a, b) => a + b, 0);
    const total = drill.questions.length;
    const pct = Math.round((score / total) * 100);

    return (
      <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center gap-6 text-center">
        <Reveal>
          <div className="flex size-20 items-center justify-center rounded-3xl bg-[linear-gradient(135deg,var(--primary),var(--accent))] shadow-lg shadow-primary/30">
            {completion?.leveledUp ? (
              <PartyPopper className="size-10 text-white" />
            ) : (
              <Sparkles className="size-10 text-white" />
            )}
          </div>
        </Reveal>

        <Reveal delay={0.05}>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {completion?.leveledUp
                ? `Level ${completion.progress.level}! 🎉`
                : pct >= 80
                  ? "Sharp work."
                  : pct >= 50
                    ? "Nice progress."
                    : "Keep at it."}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              You scored {score % 1 === 0 ? score : score.toFixed(1)} / {total} on{" "}
              {drill.skillName}
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="grid w-full grid-cols-3 gap-3">
            <Stat label="Score" value={`${pct}%`} />
            <Stat label="XP earned" value={`+${completion?.xpEarned ?? 0}`} />
            <Stat label="Streak" value={`${completion?.progress.streak ?? 0}🔥`} />
          </div>
        </Reveal>

        {completion && (
          <Reveal delay={0.15}>
            <Card className="w-full p-5">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium">{drill.skillName} mastery</span>
                <span className="text-muted-foreground">
                  {completion.masteryBefore}% → {completion.masteryAfter}%
                </span>
              </div>
              <Progress value={completion.masteryAfter} />
            </Card>
          </Reveal>
        )}

        <Reveal delay={0.2}>
          <div className="flex gap-3">
            <button
              onClick={() => startDrill(drill.skillId)}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-[linear-gradient(120deg,var(--primary),var(--accent))] px-5 text-sm font-medium text-white shadow-lg shadow-primary/25 transition-all hover:brightness-110 active:scale-[0.98]"
            >
              <Target className="size-4" /> Practice again
            </button>
            <button
              onClick={() => {
                setMode("browse");
                setDrill(null);
                setCompletion(null);
                loadProgress();
              }}
              className="inline-flex h-11 items-center rounded-xl border border-[var(--border-strong)] px-5 text-sm font-medium transition-colors hover:bg-muted active:scale-[0.98]"
            >
              Back to drills
            </button>
          </div>
        </Reveal>
      </div>
    );
  }

  return null;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="flex flex-col items-center gap-1 p-4">
      <span className="text-xl font-semibold tracking-tight">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </Card>
  );
}
