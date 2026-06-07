import { NextResponse } from "next/server";
import { readProgress } from "@/lib/store";
import { hasApiKey } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ progress: readProgress(), hasKey: hasApiKey() });
}
