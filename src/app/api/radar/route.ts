import { NextResponse } from "next/server";
import { readRadar, writeRadar } from "@/lib/store";
import { researchTrends, MissingApiKeyError } from "@/lib/research";
import { hasApiKey } from "@/lib/config";
import type { RadarState } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET() {
  const state = readRadar();
  return NextResponse.json({ ...state, hasKey: hasApiKey() });
}

export async function POST() {
  try {
    const trends = await researchTrends();
    const state: RadarState = {
      trends,
      lastRefreshedAt: new Date().toISOString(),
    };
    writeRadar(state);
    return NextResponse.json({ ...state, hasKey: true });
  } catch (err) {
    if (err instanceof MissingApiKeyError) {
      return NextResponse.json(
        { error: "no_key", message: "No API key configured. Add one in Settings." },
        { status: 400 }
      );
    }
    const message =
      err instanceof Error ? err.message : "Something went wrong refreshing.";
    console.error("[radar] refresh failed:", err);
    return NextResponse.json({ error: "refresh_failed", message }, { status: 500 });
  }
}
