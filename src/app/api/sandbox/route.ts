import { NextResponse } from "next/server";
import { readSandboxSessions, upsertSandboxSession } from "@/lib/store";
import { hasApiKey } from "@/lib/config";
import type { SandboxSession } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    sessions: readSandboxSessions(),
    hasKey: hasApiKey(),
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const session = body as Partial<SandboxSession>;
    if (!session.id || !Array.isArray(session.messages)) {
      return NextResponse.json(
        { error: "bad_request", message: "Invalid session." },
        { status: 400 }
      );
    }
    const full: SandboxSession = {
      id: session.id,
      title: session.title?.trim() || "Untitled session",
      model: session.model ?? "claude-opus-4-7",
      system: session.system ?? "",
      messages: session.messages,
      updatedAt: new Date().toISOString(),
    };
    upsertSandboxSession(full);
    return NextResponse.json({ ok: true, session: full });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save.";
    return NextResponse.json({ error: "save_failed", message }, { status: 500 });
  }
}
