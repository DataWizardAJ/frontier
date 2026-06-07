"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function CopyButton({
  text,
  label = "Copy",
  className,
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          /* clipboard unavailable */
        }
      }}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-xl border border-[var(--border-strong)] px-3.5 text-sm font-medium transition-colors hover:bg-muted active:scale-[0.98]",
        className
      )}
    >
      {copied ? (
        <>
          <Check className="size-4 text-[var(--success)]" /> Copied
        </>
      ) : (
        <>
          <Copy className="size-4" /> {label}
        </>
      )}
    </button>
  );
}
