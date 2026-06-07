import Anthropic from "@anthropic-ai/sdk";
import { getApiKey } from "@/lib/config";
import { MissingApiKeyError } from "@/lib/research";
import {
  TREND_CATEGORIES,
  type GeneratedExplainer,
  type TrendCategory,
} from "@/lib/types";

const MODEL = "claude-opus-4-7";

const SYSTEM_PROMPT = `You are the explainer engine for "Frontier", a personal tool that helps a capable operator become world-class at applied AI.

Write a practical, hands-on guide that takes the reader from "heard of it" to "can actually use it". You are teaching a smart generalist, not a beginner — skip fluff, be concrete.

Principles:
- Lead with what it is and when to reach for it.
- Make the steps actionable. Where useful, include a real example prompt, snippet, or config in the "example" field (use "" when an example doesn't help).
- Call out the mistakes people actually make.
- End with a starter prompt the reader can paste straight into a sandbox to try it themselves.
- Be concise and high-signal. Prefer 4-7 focused steps over an exhaustive list.

Return ONLY the structured object the schema describes — no preamble.`;

const explainerSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string", description: "Clear, specific guide title." },
    category: { type: "string", enum: [...TREND_CATEGORIES] },
    summary: { type: "string", description: "One sentence on what this covers." },
    readMinutes: { type: "integer", description: "Realistic 4-12 minute estimate." },
    overview: {
      type: "string",
      description: "2-4 sentences: what it is and why it matters.",
    },
    whenToUse: {
      type: "string",
      description: "When to reach for this vs. alternatives.",
    },
    prerequisites: {
      type: "array",
      items: { type: "string" },
      description: "What the reader should know/have first. Can be empty.",
    },
    steps: {
      type: "array",
      description: "4-7 actionable steps.",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          heading: { type: "string" },
          body: { type: "string", description: "Concrete explanation of the step." },
          example: {
            type: "string",
            description: "A prompt/snippet/config, or empty string.",
          },
        },
        required: ["heading", "body", "example"],
      },
    },
    pitfalls: {
      type: "array",
      items: { type: "string" },
      description: "Common mistakes to avoid.",
    },
    takeaways: {
      type: "array",
      items: { type: "string" },
      description: "3-5 key things to remember.",
    },
    sandboxPrompt: {
      type: "string",
      description: "A ready-to-paste prompt to try the technique in a chat sandbox.",
    },
  },
  required: [
    "title",
    "category",
    "summary",
    "readMinutes",
    "overview",
    "whenToUse",
    "prerequisites",
    "steps",
    "pitfalls",
    "takeaways",
    "sandboxPrompt",
  ],
};

export interface ExplainerInput {
  title?: string;
  category?: string;
  summary?: string;
  topic?: string;
}

function normaliseCategory(c: string): TrendCategory {
  return TREND_CATEGORIES.find((t) => t.toLowerCase() === c?.toLowerCase()) ?? "LLMs";
}

export async function generateExplainer(
  input: ExplainerInput
): Promise<GeneratedExplainer> {
  const apiKey = getApiKey();
  if (!apiKey) throw new MissingApiKeyError();

  const client = new Anthropic({ apiKey });

  const userPrompt = input.topic
    ? `Write a practical explainer that teaches me how to actually use this in my work:\n\n"${input.topic}"`
    : `Write a practical explainer for this AI development, focused on how to actually use/apply it:\n\nTitle: ${input.title}\nCategory: ${input.category ?? "LLMs"}\nWhat it is: ${input.summary ?? ""}`;

  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    output_config: {
      effort: "medium",
      format: { type: "json_schema", schema: explainerSchema },
    },
    system: [
      { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
    ],
    messages: [{ role: "user", content: userPrompt }],
  });

  const textBlock = res.content.find(
    (b): b is Anthropic.TextBlock => b.type === "text"
  );
  if (!textBlock) throw new Error("No explainer returned. Try again.");

  const parsed = JSON.parse(textBlock.text) as GeneratedExplainer;
  return {
    ...parsed,
    category: normaliseCategory(parsed.category),
    readMinutes: Math.min(20, Math.max(3, Math.round(Number(parsed.readMinutes) || 6))),
    prerequisites: parsed.prerequisites ?? [],
    steps: parsed.steps ?? [],
    pitfalls: parsed.pitfalls ?? [],
    takeaways: parsed.takeaways ?? [],
  };
}
