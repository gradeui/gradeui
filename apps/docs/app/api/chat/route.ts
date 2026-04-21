/**
 * POST /api/chat — streaming chat endpoint for the /chat design page.
 *
 * Expected body:
 *   {
 *     messages: UIMessage[],              // AI SDK v6 useChat messages
 *     provider: "google" | "anthropic" | "openai" | "groq" | "openrouter" | "cerebras",
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
 *   - Groq, OpenRouter, and Cerebras all expose OpenAI-compatible chat-
 *     completion endpoints, so we reuse `createOpenAI` with a `baseURL`
 *     override rather than pulling in three extra SDK packages. As long as
 *     those endpoints keep their `/chat/completions` contract, we get
 *     streaming + tool-calling for free.
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

type ProviderId =
  | "google"
  | "anthropic"
  | "openai"
  | "groq"
  | "openrouter"
  | "cerebras";

/**
 * Env var + base URL lookup for the OpenAI-compatible providers. Keeps the
 * switch statements below trivial and ensures the picker's `keyName` stays in
 * sync with what the server actually reads.
 */
const OPENAI_COMPAT_CONFIG: Record<
  "groq" | "openrouter" | "cerebras",
  { envVar: string; baseURL: string }
> = {
  groq: {
    envVar: "GROQ_API_KEY",
    baseURL: "https://api.groq.com/openai/v1",
  },
  openrouter: {
    envVar: "OPENROUTER_API_KEY",
    baseURL: "https://openrouter.ai/api/v1",
  },
  cerebras: {
    envVar: "CEREBRAS_API_KEY",
    baseURL: "https://api.cerebras.ai/v1",
  },
};

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
    case "groq":
    case "openrouter":
    case "cerebras":
      return process.env[OPENAI_COMPAT_CONFIG[provider].envVar];
  }
}

function envVarFor(provider: ProviderId): string {
  switch (provider) {
    case "google":
      return "GOOGLE_GENERATIVE_AI_API_KEY";
    case "anthropic":
      return "ANTHROPIC_API_KEY";
    case "openai":
      return "OPENAI_API_KEY";
    case "groq":
    case "openrouter":
    case "cerebras":
      return OPENAI_COMPAT_CONFIG[provider].envVar;
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
    case "groq":
    case "openrouter":
    case "cerebras": {
      const { baseURL } = OPENAI_COMPAT_CONFIG[provider];
      // These three providers expose an OpenAI-compatible `/chat/completions`
      // endpoint, so we reuse @ai-sdk/openai with a baseURL override. `name`
      // is cosmetic — surfaces in stream error metadata so logs say "groq"
      // instead of "openai".
      //
      // CRITICAL: call `.chat(modelId)` rather than `compat(modelId)`.
      // In @ai-sdk/openai@2 the default `compat(id)` is `languageModel(id)`,
      // which routes through OpenAI's newer `/v1/responses` endpoint. The
      // compat providers mirror the shape of that URL (Groq exposes
      // `api.groq.com/openai/v1/responses`) but their input validator only
      // accepts the old chat/completions content format, so we get
      // "Input contains unsupported content types or unsupported content
      // fields" the moment the SDK serializes anything Responses-shaped.
      // `.chat(id)` targets `/v1/chat/completions` — the contract all three
      // of these providers actually implement end-to-end.
      // See @ai-sdk/openai dist/index.d.ts: `chat(): LanguageModelV2` at
      // line 369, `languageModel(): LanguageModelV2` at line 365.
      const compat = createOpenAI({ apiKey, baseURL, name: provider });
      return compat.chat(modelId);
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
        error: `No API key for ${provider}. Paste one into the provider picker or set the ${envVarFor(
          provider
        )} env var.`,
      },
      { status: 400 }
    );
  }

  try {
    // Strip non-text UI parts from the history before conversion.
    //
    // Reasoning models (e.g. Groq's `openai/gpt-oss-120b`) emit `reasoning`
    // parts alongside `text` during the assistant turn. Those parts get
    // cached in the UIMessage history and replayed on every follow-up.
    // `convertToModelMessages` passes them through to the model message,
    // and Groq's OpenAI-compatible endpoint then rejects the request with
    // "Input contains unsupported content types or unsupported content
    // fields" — it only accepts plain text (and image) content on input,
    // even though it happily emits reasoning on output.
    //
    // We're a text-only chat surface, so keeping only `text` parts is safe
    // across every provider and silently drops anything exotic a future
    // reasoning/tool-call model might introduce. If we ever add file
    // uploads, extend the allow-list with `"file"` / `"image"`.
    const sanitized = messages.map((m) => ({
      ...m,
      parts: (m.parts ?? []).filter(
        (p: { type?: string }) => p?.type === "text"
      ),
    })) as UIMessage[];
    const modelMessages = await convertToModelMessages(sanitized);

    // Build the component-reference block LAZILY from the current
    // conversation. We pull every message's text (the user's ask PLUS any
    // assistant-emitted code with its imports) and ask the refs loader
    // which components are actually in play. Unmentioned components pay
    // zero tokens — the first turn of a fresh "make me a login form" chat
    // will ship no refs at all; a follow-up "add a dialog" only brings in
    // Dialog's ref. Compare with the old behaviour that unconditionally
    // glued all ~2k tokens of refs onto every request.
    //
    // `relevant` is the canonical set of component names whose .md frontmatter
    // contributed to the system prompt for THIS request — we stamp it onto
    // the response metadata below so the chat UI can show "3 refs loaded:
    // Button, Dialog, Input" alongside each assistant turn. That makes the
    // token-vs-quality trade-off visible without needing server logs.
    const relevant = includeComponentRefs
      ? relevantComponentNames(textFromMessages(messages))
      : [];
    const refsBlock =
      relevant.length > 0
        ? renderComponentRefsBlock({ onlyFor: relevant })
        : "";
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

    // Surface per-call token usage + loaded refs to the client via UIMessage
    // metadata. The `finish` part of the UI message stream carries
    // `totalUsage` — we copy it into the message's metadata so
    // `message.metadata.usage` is readable from `useChat` on the browser
    // side. `refs` carries the component .md filenames (sans extension) that
    // were glued onto the system prompt for this turn, so the chat UI can
    // render a transparency chip next to the token badge.
    // See the TokenBadge + RefsChip readers in studio-chat.tsx for consumption.
    return result.toUIMessageStreamResponse({
      messageMetadata: ({ part }) => {
        if (part.type === "finish") {
          return {
            usage: {
              inputTokens: part.totalUsage?.inputTokens,
              outputTokens: part.totalUsage?.outputTokens,
              totalTokens: part.totalUsage?.totalTokens,
            },
            // Empty array when `includeComponentRefs` is off or when no
            // refs matched — the client shows a "no refs" state in that
            // case, which is what makes the toggle's effect legible.
            refs: relevant,
            refsIncluded: includeComponentRefs,
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
