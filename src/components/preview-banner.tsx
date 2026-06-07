import { Wand2 } from "lucide-react";

export function PreviewBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-start gap-3 rounded-2xl border border-dashed border-[var(--border-strong)] bg-[color-mix(in_srgb,var(--primary)_7%,transparent)] p-4">
      <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--primary)_18%,transparent)] text-primary">
        <Wand2 className="size-4" />
      </div>
      <div className="text-sm leading-relaxed text-muted-foreground">
        <span className="font-medium text-foreground">Design preview.</span>{" "}
        {children}
      </div>
    </div>
  );
}
