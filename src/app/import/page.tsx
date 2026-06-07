"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import {
  Bookmark,
  Upload,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  KeyRound,
  ArrowRight,
} from "lucide-react";
import { Reveal } from "@/components/reveal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Status = "idle" | "reading" | "importing" | "done" | "error";

interface Result {
  scanned: number;
  added: number;
}

export default function ImportPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [noKey, setNoKey] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setStatus("reading");
    setError(null);
    setNoKey(false);
    setResult(null);
    setFileName(file.name);

    let text: string;
    try {
      text = await file.text();
    } catch {
      setError("Couldn't read that file.");
      setStatus("error");
      return;
    }

    setStatus("importing");
    try {
      const res = await fetch("/api/instagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: text,
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "no_key") setNoKey(true);
        setError(data.message ?? "Import failed.");
        setStatus("error");
        return;
      }
      setResult({ scanned: data.scanned, added: data.added });
      setStatus("done");
    } catch {
      setError("Couldn't reach the server. Is the dev server running?");
      setStatus("error");
    }
  }, []);

  const onPick = () => inputRef.current?.click();

  const busy = status === "reading" || status === "importing";

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8 sm:px-6">
      <Reveal>
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            <Bookmark className="size-5 text-primary" />
            Import from Instagram
          </h1>
          <p className="text-sm text-muted-foreground">
            Pull the AI-related posts out of your saved folder and onto your
            Radar.
          </p>
        </div>
      </Reveal>

      <Reveal delay={0.05}>
        <Card className="space-y-4 p-6">
          <h3 className="text-sm font-semibold">How to get your saved posts</h3>
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
            <li>
              In the Instagram app or on the web, open{" "}
              <span className="font-medium text-foreground">
                Settings → Accounts Center → Your information and permissions →
                Download your information
              </span>
              .
            </li>
            <li>
              Request a download of{" "}
              <span className="font-medium text-foreground">
                Saved
              </span>{" "}
              content in <span className="font-medium text-foreground">JSON</span>{" "}
              format. Instagram emails you a zip when it&apos;s ready.
            </li>
            <li>
              Unzip it and find{" "}
              <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
                saved_posts.json
              </span>{" "}
              (under <span className="font-mono text-xs">saved_collections/</span>{" "}
              or <span className="font-mono text-xs">your_activity/</span>).
              Upload it below.
            </li>
          </ol>
          <p className="rounded-xl bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground">
            Note: Instagram&apos;s export includes the account handle and post
            link, but not the caption. Frontier flags posts that look AI-related
            from the account and link, so this is a best-effort triage — open the
            post to read it in full. Nothing is scraped; this only reads the file
            Instagram gives you.
          </p>
        </Card>
      </Reveal>

      <Reveal delay={0.1}>
        <Card
          className="flex flex-col items-center justify-center gap-4 border-dashed p-10 text-center"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) handleFile(f);
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />

          {busy ? (
            <>
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                {status === "reading"
                  ? "Reading file…"
                  : "Scanning your saves for AI posts…"}
              </p>
            </>
          ) : (
            <>
              <Upload className="size-8 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  Drop saved_posts.json here, or
                </p>
                {fileName && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Last file: {fileName}
                  </p>
                )}
              </div>
              <Button variant="gradient" onClick={onPick}>
                Choose file
              </Button>
            </>
          )}
        </Card>
      </Reveal>

      {status === "done" && result && (
        <Reveal>
          <Card className="flex flex-col items-start gap-3 p-6">
            <div className="flex items-center gap-2 text-sm font-medium text-[var(--success)]">
              <CheckCircle2 className="size-5" />
              Import complete
            </div>
            <p className="text-sm text-muted-foreground">
              Scanned{" "}
              <span className="font-medium text-foreground">
                {result.scanned}
              </span>{" "}
              saved posts and added{" "}
              <span className="font-medium text-foreground">{result.added}</span>{" "}
              AI-related{" "}
              {result.added === 1 ? "card" : "cards"} to your Radar.
            </p>
            <Link href="/radar">
              <Button variant="primary">
                View on Radar <ArrowRight className="size-4" />
              </Button>
            </Link>
          </Card>
        </Reveal>
      )}

      {status === "error" && (
        <Reveal>
          <Card className="flex flex-col items-start gap-3 p-6">
            <div className="flex items-center gap-2 text-sm font-medium text-[var(--destructive,#ef4444)]">
              <AlertTriangle className="size-5" />
              {noKey ? "No API key" : "Import failed"}
            </div>
            <p className="text-sm text-muted-foreground">{error}</p>
            {noKey && (
              <Link href="/settings">
                <Button variant="outline">
                  <KeyRound className="size-4" /> Add a key in Settings
                </Button>
              </Link>
            )}
          </Card>
        </Reveal>
      )}
    </div>
  );
}
