import Anthropic from "@anthropic-ai/sdk";
import { getApiKey } from "@/lib/config";
import { MissingApiKeyError } from "@/lib/research";
import {
  TREND_CATEGORIES,
  type SavedPost,
  type Trend,
  type TrendCategory,
} from "@/lib/types";

// Classification is a cheap, high-volume task: route it to the smallest model
// rather than the Opus tier the research engine uses. ~5x cheaper per token.
const CLASSIFIER_MODEL = "claude-haiku-4-5";

const MAX_POSTS = 60; // bound the prompt size for a single import

/**
 * Parse an Instagram "Download Your Information" export.
 *
 * We accept the raw text of either `saved_posts.json` (key
 * `saved_saved_media`) or `liked_posts.json` (key `likes_media_likes`). Both
 * use the same `string_map_data` shape. This is the ToS-safe route: it reads a
 * file Instagram gives *you*, rather than scraping the app.
 */
export function parseSavedExport(raw: string): SavedPost[] {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(
      "That doesn't look like a valid Instagram JSON export. Upload saved_posts.json from your data download."
    );
  }

  const entries = extractEntries(data);
  const posts: SavedPost[] = [];

  for (const entry of entries) {
    if (!entry || typeof entry !== "object") continue;
    const e = entry as Record<string, unknown>;
    const handle = typeof e.title === "string" ? e.title : "unknown";

    const map = (e.string_map_data ?? {}) as Record<
      string,
      { href?: string; timestamp?: number }
    >;
    // The href/timestamp live under a single, oddly-named key ("Saved on",
    // "Liked on", etc.) — just take the first value present.
    const detail = Object.values(map)[0] ?? {};
    const url = typeof detail.href === "string" ? detail.href : "";
    if (!url) continue;

    const ts = typeof detail.timestamp === "number" ? detail.timestamp : null;
    posts.push({
      handle,
      url,
      savedAt: ts ? new Date(ts * 1000).toISOString() : null,
    });
  }

  // De-dupe by URL, newest first.
  const seen = new Set<string>();
  return posts
    .filter((p) => (seen.has(p.url) ? false : (seen.add(p.url), true)))
    .sort((a, b) => (b.savedAt ?? "").localeCompare(a.savedAt ?? ""));
}

function extractEntries(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    for (const key of ["saved_saved_media", "likes_media_likes"]) {
      if (Array.isArray(obj[key])) return obj[key] as unknown[];
    }
    // Fall back to the first array-valued property we find.
    const firstArray = Object.values(obj).find(Array.isArray);
    if (firstArray) return firstArray as unknown[];
  }
  return [];
}

const SYSTEM_PROMPT = `You triage a user's saved Instagram posts to surface ones about AI.

You are given a numbered list of saved posts. Instagram exports only include the account handle and the post URL — NOT the caption — so judge AI-relevance from the handle and any signal in the URL, plus what you know about well-known AI accounts.

For each post that is plausibly about AI / machine learning / LLMs / AI tooling, emit one card. Skip anything clearly unrelated (food, travel, fitness, memes, etc.). Be conservative: if a handle gives no AI signal at all, leave it out.

Because captions are unavailable, keep summaries honest and high-level (e.g. "Saved post from @handle — likely covers X based on the account"). Set "momentum" low-to-moderate (10-50): these are personal saves, not measured traction. Categorise into exactly one of: ${TREND_CATEGORIES.join(", ")}.

Call emit_picks exactly once with the AI-related posts. If none qualify, call it with an empty array.`;

const emitPicksTool: Anthropic.Tool = {
  name: "emit_picks",
  description:
    "Deliver the AI-related saved posts as cards. Call exactly once.",
  strict: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      picks: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            index: {
              type: "integer",
              description: "1-based index of the post from the input list.",
            },
            title: { type: "string", description: "Short headline." },
            category: { type: "string", enum: [...TREND_CATEGORIES] },
            summary: {
              type: "string",
              description: "1-2 sentences; be honest that this is from a saved post.",
            },
            whyItMatters: {
              type: "string",
              description: "1 sentence on why it's worth a look.",
            },
            momentum: { type: "integer", description: "10-50." },
          },
          required: [
            "index",
            "title",
            "category",
            "summary",
            "whyItMatters",
            "momentum",
          ],
        },
      },
    },
    required: ["picks"],
  },
};

interface Pick {
  index: number;
  title: string;
  category: string;
  summary: string;
  whyItMatters: string;
  momentum: number;
}

function normaliseCategory(c: string): TrendCategory {
  return (
    TREND_CATEGORIES.find((t) => t.toLowerCase() === c?.toLowerCase()) ?? "LLMs"
  );
}

/**
 * Turn parsed saved posts into Trend cards, keeping only the AI-related ones.
 * Returns [] if nothing qualifies.
 */
export async function savedPostsToTrends(posts: SavedPost[]): Promise<Trend[]> {
  const apiKey = getApiKey();
  if (!apiKey) throw new MissingApiKeyError();
  if (posts.length === 0) return [];

  const slice = posts.slice(0, MAX_POSTS);
  const list = slice
    .map((p, i) => `${i + 1}. @${p.handle} — ${p.url}`)
    .join("\n");

  const client = new Anthropic({ apiKey });
  const res = await client.messages.create({
    model: CLASSIFIER_MODEL,
    max_tokens: 4000,
    system: [
      { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
    ],
    tools: [emitPicksTool],
    tool_choice: { type: "tool", name: "emit_picks" },
    messages: [
      {
        role: "user",
        content: `Here are ${slice.length} saved posts:\n\n${list}\n\nTriage them and call emit_picks.`,
      },
    ],
  });

  const emit = res.content.find(
    (b): b is Anthropic.ToolUseBlock =>
      b.type === "tool_use" && b.name === "emit_picks"
  );
  if (!emit) return [];

  const picks = ((emit.input as { picks?: Pick[] }).picks ?? []).filter(
    (p) => p.index >= 1 && p.index <= slice.length
  );

  return picks.map((p, i) => {
    const post = slice[p.index - 1];
    return {
      id: `ig-${Date.now()}-${i}`,
      title: String(p.title || `Saved from @${post.handle}`),
      category: normaliseCategory(p.category),
      summary: String(p.summary || ""),
      whyItMatters: String(p.whyItMatters || ""),
      momentum: Math.min(100, Math.max(0, Math.round(Number(p.momentum) || 30))),
      isNew: false,
      sources: 1,
      readMinutes: 3,
      sourceLinks: [{ title: `@${post.handle} on Instagram`, url: post.url }],
      origin: "instagram" as const,
    };
  });
}
