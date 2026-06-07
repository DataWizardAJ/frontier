import {
  KeyRound,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  HardDrive,
  Cpu,
  AlertTriangle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SettingsExtras } from "@/components/settings-extras";
import {
  hasApiKey,
  getApiKey,
  maskKey,
  keyIsFromConfig,
} from "@/lib/config";
import { saveApiKeyAction, clearApiKeyAction } from "./actions";

export default function SettingsPage() {
  const connected = hasApiKey();
  const masked = connected ? maskKey(getApiKey()!) : null;
  const fromConfig = keyIsFromConfig();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect your AI engine and tune how Frontier works.
        </p>
      </div>

      {/* API connection */}
      <Card className="flex flex-col gap-5 p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <KeyRound className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Anthropic API key</h2>
          </div>
          {connected ? (
            <Badge variant="success">
              <CheckCircle2 className="size-3.5" /> Connected
            </Badge>
          ) : (
            <Badge variant="warning">
              <AlertTriangle className="size-3.5" /> Not connected
            </Badge>
          )}
        </div>

        {connected ? (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/50 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--success)] opacity-60" />
                <span className="relative inline-flex size-2.5 rounded-full bg-[var(--success)]" />
              </span>
              <code className="font-mono text-sm">{masked}</code>
            </div>
            <span className="text-xs text-muted-foreground">
              from {fromConfig ? "Settings" : ".env.local"}
            </span>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[var(--border-strong)] bg-muted/40 p-4">
            <p className="text-sm font-medium">Let&apos;s get you connected</p>
            <ol className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="font-semibold text-primary">1.</span> Open the
                Anthropic Console and sign in.
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-primary">2.</span> Create an
                API key (a few dollars of credit goes a long way).
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-primary">3.</span> Paste it
                below — it&apos;s stored only on your machine.
              </li>
            </ol>
            <a
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:opacity-80"
            >
              Get an API key <ExternalLink className="size-3.5" />
            </a>
          </div>
        )}

        <form action={saveApiKeyAction} className="flex flex-col gap-2">
          <label className="text-xs text-muted-foreground">
            {connected ? "Replace key" : "Paste your key"}
          </label>
          <div className="flex gap-2">
            <input
              type="password"
              name="apiKey"
              autoComplete="off"
              placeholder="sk-ant-api03-…"
              className="flex-1 rounded-xl border border-border bg-background px-3.5 py-2.5 font-mono text-sm outline-none transition-colors focus:border-[var(--border-strong)] focus:ring-2 focus:ring-[var(--ring)]"
            />
            <button
              type="submit"
              className="inline-flex h-[42px] items-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:brightness-110 active:scale-[0.98]"
            >
              Save
            </button>
          </div>
        </form>

        {fromConfig && (
          <form action={clearApiKeyAction}>
            <button
              type="submit"
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-[var(--danger)]"
            >
              Remove saved key (fall back to .env.local)
            </button>
          </form>
        )}

        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-[var(--success)]" />
          Your key never leaves this machine — it&apos;s stored locally and used
          only for server-side calls to Anthropic.
        </div>
      </Card>

      {/* Research + appearance */}
      <SettingsExtras />

      {/* Storage & model */}
      <Card className="flex flex-col gap-4 p-6">
        <div className="flex items-center gap-2">
          <HardDrive className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Storage &amp; model</h2>
        </div>
        <div className="flex items-center justify-between border-t border-border pt-4 text-sm">
          <span className="text-muted-foreground">Data location</span>
          <code className="font-mono text-xs">D:\frontier\.frontier</code>
        </div>
        <div className="flex items-center justify-between border-t border-border pt-4 text-sm">
          <span className="text-muted-foreground">Default model</span>
          <span className="flex items-center gap-1.5 font-medium">
            <Cpu className="size-3.5 text-primary" /> Claude Opus 4.7
          </span>
        </div>
      </Card>
    </div>
  );
}
