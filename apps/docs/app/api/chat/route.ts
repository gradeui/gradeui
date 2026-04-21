/**
 * POST /api/chat — streaming chat endpoint for the /chat design page.
 *
 * Expected body:
 *   {
 *     messages: UIMessage[],              // AI SDK v6 useChat messages
 *     provider: "google" | "anthropic" | "openai",
 *     model: string,                      // model id, e.g. "gemini-2.5-flash"
 *     apiKey?: string,                    // BYOK override from the browser
 *     systemPrompt?: string               // injected from the client
 *   }
 *
 * BYOK resolution order:
 *   1. `apiKey` from the request body (user typed it in the provider picker)
 *   2. Provider-specific env var on the server
 *   3. Otherwise → 400, since the SDK would otherwise fail deep in a stream.
 *
 * Notes:
 *   - We instantiate a fresh provider per request so the apiKey override is
 *     honoured. The createX() factories accept a config object.
 *   - `convertToModelMessages` strips UI-only metadata from parts before the
 *     SDK sends them upstream.
 */

import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import {
  renderComponentRefsBlock,
  relevantComponentNames,
} from "@/lib/component-refs";

/**
 * Pull text out of a UIMessage's parts array. Mirrors the small helper in
 * studio-chat.tsx — we scan every message (user AND assistant) because the
 * assistant's prior turns contain the existing component source, whose
 * imports tell us which refs to surface on the next iteration.
 */
function textFromMessages(messages: UIMessage[]): string {
  const chunks: string[] = [];
  for (const m of messages) {
    for (const p of m.parts ?? []) {
      if (p.type === "text" && typeof (p as { text?: string }).text === "string") {
        chunks.push((p as { text: string }).text);
      }
    }
  }
  return chunks.join("\n");
}

export const runtime = "nodejs";
export const maxDuration = 60;

type ProviderId = "google" | "anthropic" | "openai";

interface ChatRequestBody {
  messages: UIMessage[];
  provider: ProviderId;
  model: string;
  apiKey?: string;
  systemPrompt?: string;
  /** When truthy (default), the compact component-reference block from
   *  `components/ui/*.md` gets appended to the system prompt so the model
   *  sees every component's variants/props at once. Callers that don't want
   *  the DS context (e.g. non-design surfaces) can pass `false`. */
  includeComponentRefs?: boolean;
}

function resolveApiKey(provider: ProviderId, override?: string): string | undefined {
  if (override && override.trim()) return override.trim();
  switch (provider) {
    case "google":
      return (
        process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
        process.env.GOOGLE_API_KEY ||
        undefined
      );
    case "anthropic":
      return process.env.ANTHROPIC_API_KEY;
    case "openai":
      return process.env.OPENAI_API_KEY;
  }
}

function buildModel(provider: ProviderId, modelId: string, apiKey: string) {
  switch (provider) {
    case "google": {
      const google = createGoogleGenerativeAI({ apiKey });
      return google(modelId);
    }
    case "anthropic": {
      const anthropic = createAnthropic({ apiKey });
      return anthropic(modelId);
    }
    case "openai": {
      const openai = createOpenAI({ apiKey });
      return openai(modelId);
    }
  }
}

export async function POST(req: Request) {
  let body: ChatRequestBody;
  try {
    body = (await req.json()) as ChatRequestBody;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    messages,
    provider,
    model,
    apiKey: overrideKey,
    systemPrompt,
    includeComponentRefs = true,
  } = body;

  if (!messages || !Array.isArray(messages)) {
    return Response.json({ error: "`messages` is required" }, { status: 400 });
  }
  if (!provider || !model) {
    return Response.json(
      { error: "`provider` and `model` are required" },
      { status: 400 }
    );
  }

  const apiKey = resolveApiKey(provider, overrideKey);
  if (!apiKey) {
    return Response.json(
      {
        error: `No API key for ${provider}. Paste one into the provider picker or set the ${
          provider === "google"
            ? "GOOGLE_GENERATIVE_AI_API_KEY"
            : provider === "anthropic"
              ? "ANTHROPIC_API_KEY"
              : "OPENAI_API_KEY"
        } env var.`,
      },
      { status: 400 }
    );
  }

  try {
    const modelMessages = await convertToModelMessages(messages);

    // Build the component-reference block LAZILY from the current
    // conversation. We pull every message's text (the user's ask PLUS any
    // assistant-emitted code with its imports) and ask the refs loader
    // which components are actually in play. Unmentioned components pay
    // zero tokens — the first turn of a fresh "make me a login form" chat
    // will ship no refs at all; a follow-up "add a dialog" only brings in
    // Dialog's ref. Compare with the old behaviour that unconditionally
    // glued all ~2k tokens of refs onto every request.
    let refsBlock = "";
    if (includeComponentRefs) {
      const relevant = relevantComponentNames(textFromMessages(messages));
      if (relevant.length > 0) {
        refsBlock = renderComponentRefsBlock({ onlyFor: relevant });
      }
    }
    const finalSystem = refsBlock
      ? systemPrompt
        ? `${systemPrompt}\n\n${refsBlock}`
        : refsBlock
      : systemPrompt;

    const result = streamText({
      model: buildModel(provider, model, apiKey),
      system: finalSystem,
      messages: modelMessages,
    });

    // Surface per-call token usage to the client via UIMessage metadata.
    // The `finish` part of the UI message stream carries `totalUsage` — we
    // copy it into the message's metadata so `message.metadata.usage` is
    // readable from `useChat` on the browser side. See the TokenBadge
    // reader in studio-chat.tsx for consumption.
    return result.toUIMessageStreamResponse({
      messageMetadata: ({ part }) => {
        if (part.type === "finish") {
          return {
            usage: {
              inputTokens: part.totalUsage?.inputTokens,
              outputTokens: part.totalUsage?.outputTokens,
              totalTokens: part.totalUsage?.totalTokens,
            },
          };
        }
        return undefined;
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
