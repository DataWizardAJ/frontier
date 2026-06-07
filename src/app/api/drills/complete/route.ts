import { NextResponse } from "next/server";
import { updateProgressOnComplete } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { skillId, skillName, score, total } = body as {
      skillId?: string;
      skillName?: string;
      score?: number;
      total?: number;
    };
    if (!skillId || typeof score !== "number" || typeof total !== "number") {
      return NextResponse.json(
        { error: "bad_request", message: "Missing drill results." },
        { status: 400 }
      );
    }
    const result = updateProgressOnComplete(
      skillId,
      skillName ?? skillId,
      score,
      total
    );
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save progress.";
    console.error("[drills] complete failed:", err);
    return NextResponse.json({ error: "complete_failed", message }, { status: 500 });
  }
}
