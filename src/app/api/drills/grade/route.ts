import { NextResponse } from "next/server";
import { gradeOpenAnswer } from "@/lib/drills";
import { MissingApiKeyError } from "@/lib/research";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { prompt, idealAnswer, userAnswer } = body as {
      prompt?: string;
      idealAnswer?: string;
      userAnswer?: string;
    };
    if (!prompt) {
      return NextResponse.json(
        { error: "bad_request", message: "Missing question." },
        { status: 400 }
      );
    }
    const result = await gradeOpenAnswer(
      prompt,
      idealAnswer ?? "",
      userAnswer ?? ""
    );
    return NextResponse.json({ result });
  } catch (err) {
    if (err instanceof MissingApiKeyError) {
      return NextResponse.json(
        { error: "no_key", message: "No API key configured." },
        { status: 400 }
      );
    }
    const message = err instanceof Error ? err.message : "Grading failed.";
    console.error("[drills] grade failed:", err);
    return NextResponse.json({ error: "grade_failed", message }, { status: 500 });
  }
}
