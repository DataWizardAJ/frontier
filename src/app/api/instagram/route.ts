import { NextResponse } from "next/server";
import { mergeRadarTrends } from "@/lib/store";
import { parseSavedExport, savedPostsToTrends } from "@/lib/instagram";
import { MissingApiKeyError } from "@/lib/research";
import { hasApiKey } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: Request) {
  try {
    const raw = await req.text();
    if (!raw.trim()) {
      return NextResponse.json(
        { error: "empty", message: "No file contents received." },
        { status: 400 }
      );
    }

    const posts = parseSavedExport(raw);
    if (posts.length === 0) {
      return NextResponse.json(
        {
          error: "no_posts",
          message:
            "Couldn't find any saved posts in that file. Make sure it's saved_posts.json (or liked_posts.json) from your Instagram export.",
        },
        { status: 400 }
      );
    }

    const trends = await savedPostsToTrends(posts);
    const state = mergeRadarTrends(trends);

    return NextResponse.json({
      scanned: posts.length,
      added: trends.length,
      trends: state.trends,
      lastRefreshedAt: state.lastRefreshedAt,
      hasKey: true,
    });
  } catch (err) {
    if (err instanceof MissingApiKeyError) {
      return NextResponse.json(
        { error: "no_key", message: "No API key configured. Add one in Settings." },
        { status: 400 }
      );
    }
    const message =
      err instanceof Error ? err.message : "Something went wrong importing.";
    console.error("[instagram] import failed:", err);
    return NextResponse.json({ error: "import_failed", message }, { status: 500 });
  }
}

export async function GET() {
  // Lightweight probe so the page can check whether a key is configured.
  return NextResponse.json({ hasKey: hasApiKey() });
}
