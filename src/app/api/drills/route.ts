import { NextResponse } from "next/server";
import { generateDrill } from "@/lib/drills";
import { MissingApiKeyError } from "@/lib/research";
import { getSkill } from "@/lib/skills";
import { hasApiKey } from "@/lib/config";
import type { Difficulty, Drill } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { skillId, difficulty } = body as {
      skillId?: string;
      difficulty?: Difficulty;
    };
    const skill = skillId ? getSkill(skillId) : undefined;
    if (!skill) {
      return NextResponse.json(
        { error: "bad_request", message: "Unknown skill." },
        { status: 400 }
      );
    }

    const diff: Difficulty = difficulty ?? "Intermediate";
    const generated = await generateDrill(skill.name, skill.description, diff);

    const drill: Drill = {
      id: `d-${Date.now()}`,
      skillId: skill.id,
      skillName: skill.name,
      difficulty: diff,
      title: generated.title,
      questions: generated.questions.map((q, i) => ({ ...q, id: `q-${i}` })),
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ drill, hasKey: true });
  } catch (err) {
    if (err instanceof MissingApiKeyError) {
      return NextResponse.json(
        { error: "no_key", message: "No API key configured. Add one in Settings." },
        { status: 400 }
      );
    }
    const message = err instanceof Error ? err.message : "Failed to build drill.";
    console.error("[drills] generate failed:", err);
    return NextResponse.json({ error: "generate_failed", message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ hasKey: hasApiKey() });
}
