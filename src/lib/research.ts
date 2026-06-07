import Anthropic from "@anthropic-ai/sdk";
import { getApiKey } from "@/lib/config";
import {
  TREND_CATEGORIES,
  type Trend,
  type TrendCategory,
  type TrendSource,
} from "@/lib/types";

const MODEL = "claude-opus-4-7";

// Stable, cacheable system prompt. Keep frozen — volatile bits (today's date,
// how many trends) go in the user message so the cache prefix stays intact.
const SYSTEM_PROMPT = `You are the research engine for "Frontier", a personal tool that keeps a busy operator at the cutting edge of applied AI.

Your job: find the most important, *currently relevant* trends, tools, techniques, and releases in AI, and distill each into a crisp, actionable card.

Quality bar:
- Favour what is genuinely moving right now over evergreen basics. Recency and momentum matter.
- Prefer practical, usable developments (new models, agent techniques, prompting methods, tooling, eval practices, cost/latency wins) over abstract research or hype.
- Each "why it matters" must be concrete and operator-focused: what it unlocks, who should care, what to do about it.
- Be accurate. Only include things you actually found in search results, and attach real source URLs.

Process — you MUST follow this order:
1. Use the web_search tool (multiple focused queries) to find current developments. Search for recent, dated material.
2. Synthesise what you found.
3. Call the emit_trends tool exactly once with the finished cards. Do not write the trends as prose — only deliver them through emit_trends.

Categorise each trend into exactly one of: ${TREND_CATEGORIES.join(", ")}.
Set "momentum" to your 0-100 estimate of how much attention/traction it has right now.
Set "isNew" to true if it broke or surged within roughly the last two weeks.
Set "readMinutes" to a realistic 3-10 minute estimate to get up to speed.
Provide 1-3 real source links per trend.`;

interface EmittedTrend {
  title: string;
  category: string;
  summary: string;
  whyItMatters: string;
  momentum: number;
  isNew: boolean;
  readMinutes: number;
  sources: TrendSource[];
}

const emitTrendsTool: Anthropic.Tool = {
  name: "emit_trends",
  description:
    "Deliver the finished set of AI trend cards. Call this exactly once, after researching with web_search.",
  // strict: guaranteed schema-conformant input
  strict: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      trends: {
        type: "array",
        description: "The synthesised trend cards, best/most important first.",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            title: { type: "string", description: "Short, punchy headline." },
            category: { type: "string", enum: [...TREND_CATEGORIES] },
            summary: {
              type: "string",
              description: "1-2 sentences on what it is.",
            },
            whyItMatters: {
              type: "string",
              description: "1-2 sentences, concrete and operator-focused.",
            },
            momentum: {
              type: "integer",
              description: "0-100 traction/attention estimate.",
            },
            isNew: { type: "boolean" },
            readMinutes: { type: "integer", description: "3-10." },
            sources: {
              type: "array",
              description: "1-3 real source links.",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  title: { type: "string" },
                  url: { type: "string" },
                },
                required: ["title", "url"],
              },
            },
          },
          required: [
            "title",
            "category",
            "summary",
            "whyItMatters",
            "momentum",
            "isNew",
            "readMinutes",
            "sources",
          ],
        },
      },
    },
    required: ["trends"],
  },
};

export class MissingApiKeyError extends Error {
  constructor() {
    super("No Anthropic API key configured.");
    this.name = "MissingApiKeyError";
  }
}

function clampMomentum(n: number): number {
  if (!Number.isFinite(n)) return 50;
  return Math.min(100, Math.max(0, Math.round(n)));
}

function normaliseCategory(c: string): TrendCategory {
  const match = TREND_CATEGORIES.find(
    (t) => t.toLowerCase() === c?.toLowerCase()
  );
  return match ?? "LLMs";
}

function toTrend(e: EmittedTrend, i: number): Trend {
  const links = Array.isArray(e.sources)
    ? e.sources.filter((s) => s && s.url).slice(0, 3)
    : [];
  return {
    id: `t-${Date.now()}-${i}`,
    title: String(e.title ?? "Untitled trend"),
    category: normaliseCategory(e.category),
    summary: String(e.summary ?? ""),
    whyItMatters: String(e.whyItMatters ?? ""),
    momentum: clampMomentum(Number(e.momentum)),
    isNew: Boolean(e.isNew),
    readMinutes: Math.min(15, Math.max(2, Math.round(Number(e.readMinutes) || 5))),
    sources: links.length,
    sourceLinks: links,
  };
}

export async function researchTrends(count = 8): Promise<Trend[]> {
  const apiKey = getApiKey();
  if (!apiKey) throw new MissingApiKeyError();

  const client = new Anthropic({ apiKey });
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const userPrompt = `Today is ${today}. Find about ${count} of the most important and currently-relevant AI trends, tools, and techniques from roughly the last 2-3 weeks. Aim for a spread across the categories. Research with web_search first, then call emit_trends.`;

  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: userPrompt },
  ];

  for (let i = 0; i < 6; i++) {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      // Low effort: web search does the heavy lifting; we just need fast, clean
      // synthesis. High effort here pushed refreshes past 4 min. Tunable.
      output_config: { effort: "low" },
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      tools: [
        { type: "web_search_20260209", name: "web_search", max_uses: 5 },
        emitTrendsTool,
      ],
      tool_choice: { type: "auto" },
      messages,
    });

    const emit = res.content.find(
      (b): b is Anthropic.ToolUseBlock =>
        b.type === "tool_use" && b.name === "emit_trends"
    );
    if (emit) {
      const input = emit.input as { trends?: EmittedTrend[] };
      const trends = Array.isArray(input.trends) ? input.trends : [];
      return trends.map(toTrend);
    }

    // Server tool loop hit its iteration cap — re-send to let it continue.
    if (res.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: res.content });
      continue;
    }

    // It stopped without emitting — nudge it once to call the tool.
    if (res.stop_reason === "end_turn") {
      messages.push({ role: "assistant", content: res.content });
      messages.push({
        role: "user",
        content: "Now call emit_trends with the trends you found.",
      });
      continue;
    }

    break;
  }

  throw new Error("The model finished without returning any trends. Try again.");
}
