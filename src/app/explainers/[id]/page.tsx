import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  Lightbulb,
  ListChecks,
  AlertTriangle,
  CheckCircle2,
  FlaskConical,
  Target,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/copy-button";
import { getExplainer } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ExplainerDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const explainer = getExplainer(id);
  if (!explainer) notFound();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link
        href="/explainers"
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        All explainers
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Badge variant="primary">{explainer.category}</Badge>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3.5" />
            {explainer.readMinutes} min read
          </span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {explainer.title}
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {explainer.summary}
        </p>
      </div>

      {/* Overview */}
      <Card className="flex flex-col gap-2 p-6">
        <p className="leading-relaxed">{explainer.overview}</p>
        <div className="mt-2 flex items-start gap-2 rounded-xl bg-muted/60 p-3 text-sm">
          <Target className="mt-0.5 size-4 shrink-0 text-primary" />
          <span>
            <span className="font-medium">When to use it · </span>
            <span className="text-muted-foreground">{explainer.whenToUse}</span>
          </span>
        </div>
      </Card>

      {/* Prerequisites */}
      {explainer.prerequisites.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Before you start
          </h2>
          <ul className="flex flex-col gap-2">
            {explainer.prerequisites.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                <span className="text-muted-foreground">{p}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Steps */}
      <div className="flex flex-col gap-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <ListChecks className="size-4" />
          Step by step
        </h2>
        {explainer.steps.map((step, i) => (
          <Card key={i} className="flex flex-col gap-3 p-6">
            <div className="flex items-center gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--primary)_16%,transparent)] text-sm font-semibold text-primary">
                {i + 1}
              </span>
              <h3 className="font-semibold tracking-tight">{step.heading}</h3>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {step.body}
            </p>
            {step.example && step.example.trim() && (
              <pre className="overflow-x-auto rounded-xl border border-border bg-muted/60 p-4 text-xs leading-relaxed">
                <code className="font-mono">{step.example}</code>
              </pre>
            )}
          </Card>
        ))}
      </div>

      {/* Pitfalls */}
      {explainer.pitfalls.length > 0 && (
        <Card className="flex flex-col gap-3 p-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="size-4 text-[var(--warning)]" />
            Common pitfalls
          </h2>
          <ul className="flex flex-col gap-2">
            {explainer.pitfalls.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--warning)]" />
                <span className="text-muted-foreground">{p}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Takeaways */}
      {explainer.takeaways.length > 0 && (
        <Card className="flex flex-col gap-3 p-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Lightbulb className="size-4 text-primary" />
            Key takeaways
          </h2>
          <ul className="flex flex-col gap-2">
            {explainer.takeaways.map((t, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[var(--success)]" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Sandbox handoff */}
      <Card className="gradient-border flex flex-col gap-3 p-6">
        <div className="flex items-center gap-2">
          <FlaskConical className="size-4 text-accent" />
          <h2 className="text-sm font-semibold">Now try it yourself</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Paste this starter prompt into the Sandbox to put the technique into
          practice.
        </p>
        <pre className="overflow-x-auto rounded-xl border border-border bg-muted/60 p-4 text-xs leading-relaxed">
          <code className="font-mono whitespace-pre-wrap">
            {explainer.sandboxPrompt}
          </code>
        </pre>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/sandbox?prompt=${encodeURIComponent(explainer.sandboxPrompt)}`}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-[linear-gradient(120deg,var(--primary),var(--accent))] px-4 text-sm font-medium text-white shadow-lg shadow-primary/25 transition-all hover:brightness-110 active:scale-[0.98]"
          >
            <FlaskConical className="size-4" /> Open in Sandbox
          </Link>
          <CopyButton text={explainer.sandboxPrompt} label="Copy prompt" />
        </div>
      </Card>
    </div>
  );
}
