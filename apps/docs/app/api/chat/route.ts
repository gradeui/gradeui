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

import {
  streamText,
  convertToModelMessages,
  type UIMessage,
  type JSONValue,
} from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
// Server-safe subpath. Importing `COMPONENT_CONTRACTS` from the main
// "@gradeui/ui" entry pulls in the whole bundled component code,
// which crashes Next's RSC boundary with "useEffect cannot be used
// in a Server Component." `@gradeui/ui/contracts` is the dedicated
// data-only entrypoint (Zod + per-component contract files, zero
// React).
import { COMPONENT_CONTRACTS } from "@gradeui/ui/contracts";
import {
  validateJsx,
  formatViolations,
  extractFencedJsxBlock,
} from "@/lib/qa/validate-jsx";
import {
  renderComponentRefsBlock,
  relevantComponentNames,
  ALLOWED_COMPONENTS,
  PINNED_COMPONENTS,
} from "@gradeui/studio/playbook";

// Fast-path membership check to filter ref matches down to the Studio-exposed
// allowlist. We build this once at module load because the allowlist is
// static. Example: rive-player.md has aliases like "animation"/"lottie", so a
// prompt mentioning "animation" would otherwise pull in RivePlayer's ref — but
// RivePlayer is deliberately NOT in ALLOWED_COMPONENTS right now, so we don't
// want to hint at a component the model can't actually emit.
const ALLOWED_COMPONENT_SET = new Set<string>(
  ALLOWED_COMPONENTS.map((n) => n.toLowerCase())
);

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

/**
 * Build the "TARGETED EDIT" system-prompt stanza for a user-picked element.
 *
 * Why a dedicated block and not just concatenation into the user turn:
 *   - The user's visible message already shows a short marker (e.g.
 *     `Selection: <button> "Sign in"`) — we don't need to repeat that
 *     machinery in-thread.
 *   - Putting the outerHTML in the SYSTEM slot means it doesn't get
 *     replayed on every follow-up turn — each request only sees the
 *     selection that matters *for this send*. Cleaner history, smaller
 *     downstream prompts.
 *   - The stanza speaks in imperatives the model will actually obey
 *     ("locate the element below in the current JSX"). Burying the same
 *     info in a user message produces fuzzier results in practice.
 */
function renderSelectionBlock(sel: RequestSelection | null | undefined): string {
  if (!sel || typeof sel !== "object") return "";
  const tag = (sel.tag || "").toString().slice(0, 30);
  const text = (sel.text || "").toString().slice(0, 120);
  const outer = (sel.outerHTML || "").toString().slice(0, 500);
  const componentName = (sel.componentName || "").toString().slice(0, 60);
  const part = (sel.part || "").toString().slice(0, 60);
  if (!tag && !outer && !componentName) return "";

  // When the selection resolved to a DS component boundary, lead with the
  // component identifier — that's the most actionable hint we can give the
  // model ("edit <ThreeScene>") and it maps 1:1 to a JSX node in the
  // generated source. The raw tag/outerHTML still rides along as extra
  // context but the model has been seen to ignore the component name when
  // it's buried below 500 chars of inner HTML, so we hoist it to the top.
  const header = componentName
    ? `TARGETED EDIT — the user is pointing at a <${componentName}> component in the current preview.`
    : "TARGETED EDIT — the user is pointing at a specific element in the current preview.";

  const instruction = componentName
    ? `Interpret the user's request AS AN EDIT TO THE <${componentName}> INSTANCE above. Find the matching <${componentName} ... /> JSX node in the current code and modify its props (or children) in place. Do not rewrite unrelated components in the composition. Still follow the OUTPUT RULES — regenerate the full component inside a single \`\`\`jsx fence; the targeted change is WHAT to modify, not HOW to format the response.`
    : "Interpret the user's request AS AN EDIT TO THIS ELEMENT specifically. Locate it inside the current JSX (by tag, text content, classes, and surrounding context) and modify it in place. Do not rewrite unrelated parts of the component. Still follow the OUTPUT RULES — regenerate the full component inside a single ```jsx fence; the targeted change is WHAT to modify, not HOW to format the response.";

  return [
    header,
    componentName ? `Component: <${componentName}>` : null,
    part ? `data-gds-part: "${part}"` : null,
    `Element tag: <${tag}>`,
    text ? `Element text: "${text}"` : null,
    outer ? `Element outerHTML (truncated):\n\`\`\`html\n${outer}\n\`\`\`` : null,
    "",
    instruction,
  ]
    .filter((l): l is string => l !== null)
    .join("\n");
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

/**
 * Element the studio user pointed at in the preview via the Select tool.
 * The iframe agent ships this shape back to the parent on click, the parent
 * forwards it through the chat transport body, and we glue a targeted-edit
 * stanza onto the system prompt so the model knows what to modify.
 *
 * Wire-compatible with {@link StudioSelection} in `lib/chat-sandpack.ts` —
 * duplicated here to keep the route importable from the server edge runtime
 * without pulling in the browser-only playground helpers.
 */
interface RequestSelection {
  tag: string;
  text: string;
  outerHTML: string;
  rect: { x: number; y: number; width: number; height: number };
  /** data-gds-part value of the nearest DS component ancestor, when the
   *  click landed inside one. Takes priority over `tag` for the model — it
   *  tells the agent the user meant "edit the ThreeScene", not "edit the
   *  inner <canvas>". Absent when the clicked element isn't inside a DS part. */
  part?: string;
  /** PascalCase component identifier derived from `part`. */
  componentName?: string;
}

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
  /** Element the user pointed at in the Sandpack preview. Null / absent when
   *  the user didn't use the Select tool for this turn — the model is then
   *  expected to interpret the prompt against the whole component, as before. */
  selection?: RequestSelection | null;
  /** True on iteration turns — the client appended the EDIT MODE
   *  stanza and expects SEARCH/REPLACE blocks (STUDIO-EDITS.md). Used
   *  server-side to cap output tokens: a healthy edit turn is tiny, so
   *  the ceiling only ever bites runaway repetition loops. */
  editMode?: boolean;
  /** Mirrors the "Show thinking" toggle in the Studio settings sheet.
   *  When true we ask the provider to EMIT reasoning (Gemini thought
   *  summaries via `includeThoughts`, Claude extended thinking). Off by
   *  default because reasoning costs extra output tokens on Anthropic.
   *  Models that emit reasoning unconditionally (Groq's gpt-oss,
   *  DeepSeek R1 via OpenRouter) stream it regardless of this flag —
   *  the client just won't render it while the toggle is off. */
  requestReasoning?: boolean;
}

/**
 * Provider-specific options that switch reasoning emission ON for the
 * current call. Only Google + Anthropic need explicit opt-in:
 *
 * - Google: Gemini 2.5/3.5 models think internally by default but only
 *   return thought SUMMARIES when `includeThoughts` is set. Works on the
 *   free tier; summaries are not billed as extra output.
 * - Anthropic: extended thinking must be enabled with a token budget.
 *   `maxOutputTokens` is raised alongside so the budget can't eat the
 *   whole completion (the API rejects budgets >= max_tokens).
 * - OpenAI: the catalog only lists 4o/4.1-family models (no o-series),
 *   so there's nothing to enable.
 * - Groq / OpenRouter / Cerebras: reasoning models on those endpoints
 *   emit reasoning deltas on their own; no opt-in exists.
 */
function reasoningOptions(provider: ProviderId): {
  providerOptions?: Record<string, Record<string, JSONValue>>;
  maxOutputTokens?: number;
} {
  switch (provider) {
    case "google":
      return {
        providerOptions: {
          google: { thinkingConfig: { includeThoughts: true } },
        },
      };
    case "anthropic":
      return {
        providerOptions: {
          anthropic: {
            thinking: { type: "enabled", budgetTokens: 8000 },
          },
        },
        maxOutputTokens: 32000,
      };
    default:
      return {};
  }
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
    selection,
    requestReasoning = false,
    editMode = false,
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
    // Strip non-allowlisted UI parts from the history before conversion.
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
    // Allow-list: text (every provider) and file/image (vision-capable
    // providers — Anthropic, OpenAI 4o/4.1+, Google Gemini, etc.). File
    // parts come in as `{ type: "file", mediaType, url }` where `url`
    // is a data URL or remote URL; convertToModelMessages forwards them
    // unchanged. A provider that doesn't support vision will error on
    // the file part; that's the right failure mode (visible, not silent).
    const sanitized = messages.map((m) => ({
      ...m,
      parts: (m.parts ?? []).filter(
        (p: { type?: string }) =>
          p?.type === "text" || p?.type === "file"
      ),
    })) as UIMessage[];

    // History compaction — the input-token fix for long sessions.
    //
    // Every iteration turn inlines the FULL current component into the
    // user message, and every assistant build turn emits the FULL
    // component back. useChat replays the whole history per request, so
    // by turn N the prompt carries ~2N stale copies of the page and
    // input grows quadratically (real sessions were hitting 750k
    // cumulative tokens). All of those copies are SUPERSEDED: the only
    // source that matters is the one riding the LATEST user message.
    //
    // So: keep the last message intact, and in every earlier message
    // collapse large fenced code blocks to a short marker. Small fences
    // survive the size threshold — notably jsx-edit blocks from prior
    // edit turns, which are cheap and genuinely useful context ("what
    // did I just change"). Prose is never touched, so conversational
    // continuity is preserved.
    const FENCE_KEEP_CHARS = 400;
    const compactFences = (text: string): string =>
      text.replace(/```[^\n]*\n[\s\S]*?(?:```|$)/g, (fence) =>
        fence.length <= FENCE_KEEP_CHARS
          ? fence
          : "[earlier code omitted — the latest user message carries the current component]"
      );
    const lastIdx = sanitized.length - 1;
    const compacted = sanitized.map((m, i) => {
      if (i === lastIdx) return m;
      return {
        ...m,
        parts: (m.parts ?? []).map((p) =>
          (p as { type?: string }).type === "text" &&
          typeof (p as { text?: string }).text === "string"
            ? { ...p, text: compactFences((p as { text: string }).text) }
            : p
        ),
      };
    }) as UIMessage[];

    const modelMessages = await convertToModelMessages(compacted);

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
      ? Array.from(
          new Set([
            // Pin layout primitives up front. Order matters for the refs
            // block — the model reads top-down, so the structural choices
            // (Stack/Row/Grid/Flex) arrive before any component-specific
            // ref the retriever pulled in.
            ...PINNED_COMPONENTS.filter((n) =>
              ALLOWED_COMPONENT_SET.has(n.toLowerCase())
            ),
            ...relevantComponentNames(textFromMessages(messages)).filter((n) =>
              ALLOWED_COMPONENT_SET.has(n.toLowerCase())
            ),
          ])
        )
      : [];
    const refsBlock =
      relevant.length > 0
        ? renderComponentRefsBlock({ onlyFor: relevant })
        : "";

    // Targeted-edit stanza — appended to the system prompt when the user
    // used the Select tool in the preview. We paste the picked element's
    // outerHTML verbatim so the model has something concrete to locate in
    // the current JSX and modify, rather than having to guess which div
    // the user meant. The "regenerate the FULL component" rule from the
    // base system prompt still stands (this is v1 — full regen, not a
    // diff); the stanza just narrows the model's attention.
    const selectionBlock = renderSelectionBlock(selection);

    const parts = [systemPrompt, refsBlock, selectionBlock].filter(
      (s): s is string => Boolean(s && s.trim())
    );
    const finalSystem = parts.length > 0 ? parts.join("\n\n") : undefined;

    // Reasoning opt-in — only when the user's "Show thinking" toggle is
    // on, so default turns pay zero extra tokens. See reasoningOptions().
    const reasoning = requestReasoning ? reasoningOptions(provider) : {};

    // Output ceiling. Reasoning's explicit budget wins (Anthropic
    // needs max > thinking budget); otherwise edit turns get a tight
    // cap — a healthy edit response is a few hundred tokens, so 8192
    // exists purely to bound model repetition loops (the same runaway
    // the client-side block dedupe + cap contain visually).
    const maxOutputTokens =
      reasoning.maxOutputTokens ?? (editMode ? 8192 : undefined);

    const result = streamText({
      model: buildModel(provider, model, apiKey),
      system: finalSystem,
      messages: modelMessages,
      ...(reasoning.providerOptions
        ? { providerOptions: reasoning.providerOptions }
        : {}),
      ...(maxOutputTokens ? { maxOutputTokens } : {}),
      // QA pass — once the model finishes streaming, parse the emitted
      // JSX block out of the response and validate every <Component>
      // against the live contract registry. We log violations server-
      // side rather than failing the response — the user still gets
      // the preview (possibly broken), and the engineer reading server
      // logs sees exactly which props the model hallucinated. Surfacing
      // these back to the chat UI is a follow-up; the logging gives us
      // the data to know whether the validator is worth wiring further.
      onFinish: ({ text }) => {
        const jsx = extractFencedJsxBlock(text);
        if (!jsx) return;
        const validation = validateJsx(jsx, {
          contracts: COMPONENT_CONTRACTS,
        });
        // Always log — clean runs confirm the validator is alive; dirty
        // runs surface the actual drift. The summary line is enough to
        // grep for in production logs ("JSX validator: 2 issue(s)").
        // eslint-disable-next-line no-console
        console.log("[chat/qa]", formatViolations(validation));
      },
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
      // Explicit (not relying on SDK defaults): forward reasoning parts
      // to the client as `reasoning` UIMessage parts. studio-chat.tsx
      // maps them into ChatMessage.thinking; AIChat renders the
      // collapsible "Thoughts" disclosure when `showThinking` is on.
      sendReasoning: true,
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
