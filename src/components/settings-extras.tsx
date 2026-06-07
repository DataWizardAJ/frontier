"use client";

import { useState } from "react";
import { RefreshCw, CalendarClock, Palette } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

function Toggle({
  on,
  onClick,
}: {
  on: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors",
        on ? "bg-primary" : "bg-muted"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 size-5 rounded-full bg-white shadow transition-all",
          on ? "left-[22px]" : "left-0.5"
        )}
      />
    </button>
  );
}

export function SettingsExtras() {
  const [onDemand, setOnDemand] = useState(true);
  const [digest, setDigest] = useState(true);

  return (
    <>
      <Card className="flex flex-col gap-1 p-6">
        <div className="mb-2 flex items-center gap-2">
          <CalendarClock className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Research</h2>
          <Badge variant="outline">Preview</Badge>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-border py-4">
          <div className="flex items-start gap-3">
            <RefreshCw className="mt-0.5 size-4 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium">On-demand scans</div>
              <div className="text-xs text-muted-foreground">
                A &ldquo;Refresh now&rdquo; button on the Radar to pull fresh
                trends whenever you want.
              </div>
            </div>
          </div>
          <Toggle on={onDemand} onClick={() => setOnDemand((v) => !v)} />
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-border py-4">
          <div className="flex items-start gap-3">
            <CalendarClock className="mt-0.5 size-4 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium">Daily digest</div>
              <div className="text-xs text-muted-foreground">
                Auto-refresh the Radar once a day so there&apos;s always
                something new waiting.
              </div>
            </div>
          </div>
          <Toggle on={digest} onClick={() => setDigest((v) => !v)} />
        </div>
      </Card>

      <Card className="flex items-center justify-between gap-4 p-6">
        <div className="flex items-center gap-2">
          <Palette className="size-4 text-muted-foreground" />
          <div>
            <h2 className="text-sm font-semibold">Appearance</h2>
            <p className="text-xs text-muted-foreground">
              Switch between dark and light.
            </p>
          </div>
        </div>
        <ThemeToggle />
      </Card>
    </>
  );
}
