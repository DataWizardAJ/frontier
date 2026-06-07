import { NextResponse } from "next/server";
import {
  readExplainers,
  addExplainer,
  findExplainerByTrend,
} from "@/lib/store";
import { generateExplainer } from "@/lib/explain";
import { MissingApiKeyError } from "@/lib/research";
import { hasApiKey } from "@/lib/config";
import type { Explainer } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET() {
  return NextResponse.json({
    explainers: readExplainers(),
    hasKey: hasApiKey(),
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { trendId, title, category, summary, topic } = body as {
      trendId?: string;
      title?: string;
      category?: string;
      summary?: string;
      topic?: string;
    };

    if (!topic && !title) {
      return NextResponse.json(
        { error: "bad_request", message: "Provide a trend or a topic." },
        { status: 400 }
      );
    }

    // Reuse a cached explainer for a trend instead of regenerating.
    if (trendId) {
      const existing = findExplainerByTrend(trendId);
      if (existing) return NextResponse.json({ explainer: existing, cached: true });
    }

    const generated = await generateExplainer({ title, category, summary, topic });
    const explainer: Explainer = {
      ...generated,
      id: `e-${Date.now()}`,
      trendId,
      createdAt: new Date().toISOString(),
    };
    addExplainer(explainer);
    return NextResponse.json({ explainer, cached: false });
  } catch (err) {
    if (err instanceof MissingApiKeyError) {
      return NextResponse.json(
        { error: "no_key", message: "No API key configured. Add one in Settings." },
        { status: 400 }
      );
    }
    const message =
      err instanceof Error ? err.message : "Failed to generate explainer.";
    console.error("[explainers] generate failed:", err);
    return NextResponse.json({ error: "generate_failed", message }, { status: 500 });
  }
}
