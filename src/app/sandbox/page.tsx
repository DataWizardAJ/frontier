"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Send,
  Sparkles,
  Sliders,
  Bot,
  User,
  Plus,
  Loader2,
  Brain,
  KeyRound,
  MessageSquare,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SANDBOX_MODELS, getModel, TECHNIQUE_PRESETS } from "@/lib/sandbox-models";
import type { ChatMessage, SandboxSession } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Usage {
  inputTokens: number;
  outputTokens: number;
}

const DEFAULT_SYSTEM = "You are a helpful, direct assistant.";

function SandboxPageInner() {
  // Prefill from Explainer "Open in Sandbox" handoff (?prompt=, ?system=).
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get("prompt") ?? "";
  const initialSystem = searchParams.get("system") ?? DEFAULT_SYSTEM;

  const [sessions, setSessions] = useState<SandboxSession[]>([]);
  const [hasKey, setHasKey] = useState(true);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [title, setTitle] = useState("New session");
  const [model, setModel] = useState("claude-opus-4-7");
  const [system, setSystem] = useState(initialSystem);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reasoning, setReasoning] = useState(false);

  const [input, setInput] = useState(initialPrompt);
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [streamThinking, setStreamThinking] = useState("");
  const [usage, setUsage] = useState<Usage | null>(null);
  const [error, setError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const didInit = useRef(false);

  const modelInfo = getModel(model);

  const loadSessions = useCallback(async () => {
    try {
      const data = await fetch("/api/sandbox").then((r) => r.json());
      setSessions(data.sessions ?? []);
      setHasKey(data.hasKey ?? false);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamText, streamThinking]);

  const newSession = () => {
    setSessionId(null);
    setTitle("New session");
    setMessages([]);
    setUsage(null);
    setError(null);
    setStreamText("");
    setStreamThinking("");
  };

  const loadSession = (s: SandboxSession) => {
    setSessionId(s.id);
    setTitle(s.title);
    setModel(s.model);
    setSystem(s.system || DEFAULT_SYSTEM);
    setMessages(s.messages);
    setUsage(null);
    setError(null);
    setStreamText("");
    setStreamThinking("");
  };

  const persist = useCallback(
    async (id: string, t: string, msgs: ChatMessage[]) => {
      try {
        await fetch("/api/sandbox", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, title: t, model, system, messages: msgs }),
        });
        loadSessions();
      } catch {
        /* non-fatal */
      }
    },
    [model, system, loadSessions]
  );

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming || !hasKey) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setStreaming(true);
    setStreamText("");
    setStreamThinking("");
    setUsage(null);
    setError(null);

    const id = sessionId ?? `s-${Date.now()}`;
    if (!sessionId) setSessionId(id);
    const sessionTitle =
      messages.length === 0 ? text.slice(0, 50) : title;
    if (messages.length === 0) setTitle(sessionTitle);

    let acc = "";
    try {
      const res = await fetch("/api/sandbox/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          system,
          messages: newMessages,
          reasoning,
        }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        if (data.error === "no_key") setHasKey(false);
        setError(data.message ?? "Request failed.");
        setStreaming(false);
        setMessages(messages); // roll back the optimistic user msg
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let nl;
        while ((nl = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (!line) continue;
          const ev = JSON.parse(line);
          if (ev.type === "text") {
            acc += ev.text;
            setStreamText(acc);
          } else if (ev.type === "thinking") {
            setStreamThinking((t) => t + ev.text);
          } else if (ev.type === "usage") {
            setUsage({ inputTokens: ev.inputTokens, outputTokens: ev.outputTokens });
          } else if (ev.type === "error") {
            setError(ev.message);
          }
        }
      }

      const finalMessages: ChatMessage[] = [
        ...newMessages,
        { role: "assistant", content: acc },
      ];
      setMessages(finalMessages);
      setStreamText("");
      setStreamThinking("");
      persist(id, sessionTitle, finalMessages);
    } catch {
      setError("Connection lost during the response.");
    } finally {
      setStreaming(false);
    }
  }, [
    input,
    streaming,
    hasKey,
    messages,
    sessionId,
    title,
    model,
    system,
    reasoning,
    persist,
  ]);

  const applyPreset = (system: string, starter: string) => {
    setSystem(system);
    if (starter) setInput(starter);
  };

  const cost = usage
    ? (usage.inputTokens / 1e6) * modelInfo.inputPer1M +
      (usage.outputTokens / 1e6) * modelInfo.outputPer1M
    : 0;

  return (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_300px]">
      {/* Chat */}
      <Card className="flex h-[calc(100vh-8rem)] min-h-[520px] flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <Bot className="size-4 shrink-0 text-primary" />
            <span className="truncate text-sm font-medium">{title}</span>
            {reasoning && modelInfo.supportsThinking && (
              <Badge variant="accent">Reasoning</Badge>
            )}
          </div>
          <button
            onClick={newSession}
            className="flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Plus className="size-3.5" /> New
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {messages.length === 0 && !streaming && (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--primary),var(--accent))]">
                <Sparkles className="size-6 text-white" />
              </div>
              <p className="text-sm font-medium">Experiment with Claude</p>
              <p className="max-w-xs text-xs text-muted-foreground">
                Pick a technique, tweak the system prompt, and try a prompt. Your
                sessions are saved automatically.
              </p>
            </div>
          )}

          {messages.map((m, i) => (
            <Bubble key={i} role={m.role} content={m.content} />
          ))}

          {/* Streaming assistant */}
          {streaming && (
            <div className="flex gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[linear-gradient(135deg,var(--primary),var(--accent))] text-white">
                <Sparkles className="size-4" />
              </div>
              <div className="flex max-w-[80%] flex-col gap-2">
                {streamThinking && (
                  <div className="rounded-2xl border border-dashed border-[var(--border-strong)] bg-muted/40 px-4 py-2.5 text-xs leading-relaxed text-muted-foreground">
                    <div className="mb-1 flex items-center gap-1.5 font-medium">
                      <Brain className="size-3.5" /> Thinking
                    </div>
                    <span className="whitespace-pre-wrap">{streamThinking}</span>
                  </div>
                )}
                <div className="rounded-2xl bg-muted px-4 py-2.5 text-sm leading-relaxed">
                  {streamText ? (
                    <span className="whitespace-pre-wrap">{streamText}</span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <Loader2 className="size-3.5 animate-spin" /> thinking…
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-[color-mix(in_srgb,var(--danger)_40%,transparent)] bg-[color-mix(in_srgb,var(--danger)_8%,transparent)] px-4 py-2.5 text-sm text-muted-foreground">
              {error}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border p-4">
          {(usage || !hasKey) && (
            <div className="mb-2 px-1 text-xs text-muted-foreground">
              {!hasKey ? (
                <span className="flex items-center gap-1.5">
                  <KeyRound className="size-3.5" /> No API key —{" "}
                  <Link href="/settings" className="text-primary hover:opacity-80">
                    add one in Settings
                  </Link>
                </span>
              ) : (
                usage && (
                  <span>
                    {usage.inputTokens} in · {usage.outputTokens} out · ~$
                    {cost.toFixed(4)}
                  </span>
                )
              )}
            </div>
          )}
          <div className="flex items-end gap-2 rounded-xl border border-border bg-background px-3 py-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              disabled={streaming || !hasKey}
              rows={1}
              placeholder={hasKey ? "Try a prompt…  (Enter to send)" : "Add an API key to start"}
              className="max-h-40 flex-1 resize-none bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground disabled:opacity-60"
            />
            <button
              onClick={send}
              disabled={!input.trim() || streaming || !hasKey}
              className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[linear-gradient(120deg,var(--primary),var(--accent))] text-white shadow-md shadow-primary/25 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40"
            >
              {streaming ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
            </button>
          </div>
        </div>
      </Card>

      {/* Config */}
      <div className="flex flex-col gap-6">
        <Card className="flex flex-col gap-4 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Sliders className="size-4 text-muted-foreground" /> Configuration
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">Model</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-[var(--border-strong)]"
            >
              {SANDBOX_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">System prompt</label>
            <textarea
              value={system}
              onChange={(e) => setSystem(e.target.value)}
              rows={4}
              className="resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-[var(--border-strong)]"
            />
          </div>

          <button
            onClick={() => modelInfo.supportsThinking && setReasoning((r) => !r)}
            disabled={!modelInfo.supportsThinking}
            className="flex items-center justify-between gap-3 disabled:opacity-50"
          >
            <span className="flex items-center gap-2 text-sm">
              <Brain className="size-4 text-muted-foreground" /> Reasoning
            </span>
            <span
              className={cn(
                "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                reasoning && modelInfo.supportsThinking ? "bg-primary" : "bg-muted"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 size-5 rounded-full bg-white shadow transition-all",
                  reasoning && modelInfo.supportsThinking
                    ? "left-[22px]"
                    : "left-0.5"
                )}
              />
            </span>
          </button>
          {!modelInfo.supportsThinking && (
            <p className="-mt-2 text-xs text-muted-foreground">
              Reasoning isn&apos;t available on this model.
            </p>
          )}
        </Card>

        <Card className="flex flex-col gap-3 p-5">
          <div className="text-sm font-semibold">Technique presets</div>
          {TECHNIQUE_PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => applyPreset(p.system, p.starter)}
              className="rounded-xl border border-border p-3 text-left transition-colors hover:border-[var(--border-strong)] hover:bg-muted"
            >
              <div className="text-sm font-medium">{p.name}</div>
              <div className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                {p.description}
              </div>
            </button>
          ))}
        </Card>

        {sessions.length > 0 && (
          <Card className="flex flex-col gap-2 p-5">
            <div className="mb-1 text-sm font-semibold">Recent sessions</div>
            {sessions.slice(0, 6).map((s) => (
              <button
                key={s.id}
                onClick={() => loadSession(s)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-muted",
                  s.id === sessionId && "bg-muted"
                )}
              >
                <MessageSquare className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{s.title}</span>
              </button>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}

export default function SandboxPage() {
  // useSearchParams must live inside a Suspense boundary in Next 16
  // (otherwise the build flags it). fallback null keeps the page snappy.
  return (
    <Suspense fallback={null}>
      <SandboxPageInner />
    </Suspense>
  );
}

function Bubble({ role, content }: { role: "user" | "assistant"; content: string }) {
  const isUser = role === "user";
  return (
    <div className={cn("flex gap-3", isUser && "justify-end")}>
      {!isUser && (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[linear-gradient(135deg,var(--primary),var(--accent))] text-white">
          <Sparkles className="size-4" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted"
        )}
      >
        {content}
      </div>
      {isUser && (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground">
          <User className="size-4" />
        </div>
      )}
    </div>
  );
}
