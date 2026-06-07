import Anthropic from "@anthropic-ai/sdk";
import { getApiKey } from "@/lib/config";
import { getModel } from "@/lib/sandbox-models";
import type { ChatMessage } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: Request) {
  const apiKey = getApiKey();
  if (!apiKey) {
    return Response.json(
      { error: "no_key", message: "No API key configured. Add one in Settings." },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const { model, system, messages, reasoning } = body as {
    model?: string;
    system?: string;
    messages?: ChatMessage[];
    reasoning?: boolean;
  };

  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json(
      { error: "bad_request", message: "No messages." },
      { status: 400 }
    );
  }

  const modelInfo = getModel(model ?? "");
  const useThinking = Boolean(reasoning) && modelInfo.supportsThinking;

  const client = new Anthropic({ apiKey });
  const encoder = new TextEncoder();

  const params: Anthropic.MessageStreamParams = {
    model: modelInfo.id,
    max_tokens: 8000,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  };
  if (system && system.trim()) params.system = system;
  if (useThinking) {
    params.thinking =
      modelInfo.id === "claude-opus-4-7"
        ? { type: "adaptive", display: "summarized" }
        : { type: "adaptive" };
  }

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      try {
        const ms = client.messages.stream(params);
        for await (const event of ms) {
          if (event.type === "content_block_delta") {
            if (event.delta.type === "text_delta") {
              send({ type: "text", text: event.delta.text });
            } else if (event.delta.type === "thinking_delta") {
              send({ type: "thinking", text: event.delta.thinking });
            }
          }
        }
        const final = await ms.finalMessage();
        send({
          type: "usage",
          inputTokens: final.usage.input_tokens,
          outputTokens: final.usage.output_tokens,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "The model request failed.";
        console.error("[sandbox] chat failed:", err);
        send({ type: "error", message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
