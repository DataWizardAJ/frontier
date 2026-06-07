import Anthropic from "@anthropic-ai/sdk";
import { getApiKey } from "@/lib/config";
import { MissingApiKeyError } from "@/lib/research";
import type {
  Difficulty,
  GeneratedDrill,
  GradeResult,
  GradeVerdict,
} from "@/lib/types";

const MODEL = "claude-opus-4-7";
// Grading an open answer against a model answer is a simple, high-frequency
// classification — it runs on every submitted answer. Route it to the cheapest
// model (~5x cheaper per token than Opus) rather than the generation tier.
const GRADE_MODEL = "claude-haiku-4-5";

const GEN_SYSTEM = `You are the challenge engine for "Frontier", a Duolingo-style trainer that sharpens a capable operator's applied-AI skills.

Write a short, punchy quiz that tests real understanding — not trivia. Questions should reflect how practitioners actually apply AI in 2026.

Rules:
- Produce exactly 5 questions: roughly 3 multiple-choice and 2 open-ended.
- Multiple-choice: exactly 4 plausible options, exactly one correct. Set correctIndex (0-3), options filled, idealAnswer "".
- Open-ended: a question that needs a 1-3 sentence answer. Set type "open", options [], correctIndex -1, and idealAnswer to a concise model answer.
- Every question needs a clear "explanation" teaching why the answer is right.
- Calibrate to the requested difficulty. Keep prompts concise and unambiguous.

Return ONLY the structured object described by the schema.`;

const drillSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string", description: "Short quiz title." },
    questions: {
      type: "array",
      description: "Exactly 5 questions.",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          type: { type: "string", enum: ["mcq", "open"] },
          prompt: { type: "string" },
          options: {
            type: "array",
            items: { type: "string" },
            description: "4 options for mcq; empty array for open.",
          },
          correctIndex: {
            type: "integer",
            description: "0-3 for mcq; -1 for open.",
          },
          idealAnswer: {
            type: "string",
            description: "Model answer for open; empty string for mcq.",
          },
          explanation: { type: "string" },
        },
        required: [
          "type",
          "prompt",
          "options",
          "correctIndex",
          "idealAnswer",
          "explanation",
        ],
      },
    },
  },
  required: ["title", "questions"],
};

function client(): Anthropic {
  const apiKey = getApiKey();
  if (!apiKey) throw new MissingApiKeyError();
  return new Anthropic({ apiKey });
}

export async function generateDrill(
  skillName: string,
  skillDescription: string,
  difficulty: Difficulty
): Promise<GeneratedDrill> {
  const res = await client().messages.create({
    model: MODEL,
    max_tokens: 8000,
    thinking: { type: "adaptive" },
    output_config: {
      effort: "medium",
      format: { type: "json_schema", schema: drillSchema },
    },
    system: [
      { type: "text", text: GEN_SYSTEM, cache_control: { type: "ephemeral" } },
    ],
    messages: [
      {
        role: "user",
        content: `Create a ${difficulty} quiz on the skill "${skillName}" (${skillDescription}).`,
      },
    ],
  });

  const block = res.content.find(
    (b): b is Anthropic.TextBlock => b.type === "text"
  );
  if (!block) throw new Error("No drill returned. Try again.");
  const parsed = JSON.parse(block.text) as GeneratedDrill;

  // Light normalisation
  parsed.questions = (parsed.questions ?? []).map((q) => {
    const isMcq = q.type === "mcq";
    return {
      ...q,
      type: isMcq ? "mcq" : "open",
      options: isMcq ? (q.options ?? []) : [],
      correctIndex: isMcq
        ? Math.max(0, Math.min((q.options?.length ?? 1) - 1, q.correctIndex ?? 0))
        : -1,
      idealAnswer: isMcq ? "" : q.idealAnswer ?? "",
      explanation: q.explanation ?? "",
    };
  });

  return parsed;
}

const GRADE_SYSTEM = `You grade short free-text answers for an applied-AI quiz. Be fair and encouraging, like a good tutor.

- "correct": substantively right, even if phrased differently or briefer than the model answer.
- "partial": on the right track but missing a key point or partly wrong.
- "incorrect": wrong, off-topic, or empty.

Give one or two sentences of specific, constructive feedback — note what was good and what to add. Never be harsh.

Return ONLY the structured object described by the schema.`;

const gradeSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    verdict: { type: "string", enum: ["correct", "partial", "incorrect"] },
    feedback: { type: "string" },
  },
  required: ["verdict", "feedback"],
};

export async function gradeOpenAnswer(
  prompt: string,
  idealAnswer: string,
  userAnswer: string
): Promise<GradeResult> {
  if (!userAnswer.trim()) {
    return { verdict: "incorrect", feedback: "No answer given — give it a go!" };
  }

  const res = await client().messages.create({
    model: GRADE_MODEL,
    max_tokens: 1000,
    output_config: {
      effort: "low",
      format: { type: "json_schema", schema: gradeSchema },
    },
    system: [
      { type: "text", text: GRADE_SYSTEM, cache_control: { type: "ephemeral" } },
    ],
    messages: [
      {
        role: "user",
        content: `Question: ${prompt}\n\nModel answer: ${idealAnswer}\n\nLearner's answer: ${userAnswer}\n\nGrade the learner's answer.`,
      },
    ],
  });

  const block = res.content.find(
    (b): b is Anthropic.TextBlock => b.type === "text"
  );
  if (!block) return { verdict: "partial", feedback: "Couldn't grade that — moving on." };
  const parsed = JSON.parse(block.text) as { verdict: GradeVerdict; feedback: string };
  return { verdict: parsed.verdict, feedback: parsed.feedback };
}
