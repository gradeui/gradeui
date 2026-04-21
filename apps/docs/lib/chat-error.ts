/**
 * Humanise errors surfaced by `useChat` from the AI SDK.
 *
 * Providers (Google, OpenAI, Anthropic, etc.) return quite chatty error
 * strings when something goes wrong — rate-limit payloads in particular
 * often include URLs, marketing copy, and the raw gRPC status name, all
 * of which overflow small side-panels. We parse the common cases here
 * into a compact `{ title, description, hint, retryAfterSeconds }` shape
 * the UI can render consistently.
 *
 * Adding a new case: match on keywords in `msg.toLowerCase()`, return a
 * `HumanError`. The fallback just passes the truncated raw message
 * through so nothing is silently swallowed.
 */

export interface HumanError {
  /** One-line title, 2–4 words. Shown bold. */
  title: string;
  /** Plain-English explanation. Keep under ~20 words. */
  description: string;
  /** Optional follow-up — what the user can do next. */
  hint?: string;
  /** If the provider told us when to retry, that many seconds. */
  retryAfterSeconds?: number;
  /** The provider id the chat is currently configured against — surfaced
   *  in the banner so the user can see whether it's Groq that's throttling
   *  or Google, without having to re-read the picker. */
  provider?: string;
  /** The model id in play at the time of the error. Same purpose as
   *  `provider` — rate-limit messages often apply per-model, not per-key,
   *  so this disambiguates which one tripped. */
  model?: string;
}

/** Optional context threaded in from the calling component so the banner
 *  can name the provider and model that produced the error. Both fields
 *  are optional — the rest of the humanise logic still works without them,
 *  they just get stamped onto the output for the UI to render. */
export interface ChatErrorContext {
  provider?: string;
  model?: string;
}

/** Map internal provider ids to the label used in the UI trigger button. */
const PROVIDER_DISPLAY: Record<string, string> = {
  google: "Google (Gemini)",
  anthropic: "Anthropic (Claude)",
  openai: "OpenAI (GPT)",
  groq: "Groq",
  cerebras: "Cerebras",
  openrouter: "OpenRouter",
};

/** Friendly label for a provider id — falls back to the raw id if we
 *  don't have a mapping for it. */
function providerLabel(provider?: string): string | undefined {
  if (!provider) return undefined;
  return PROVIDER_DISPLAY[provider] ?? provider;
}

/** Returns a friendly display object for a streaming-chat error. */
export function humanizeChatError(
  error: Error | null | undefined,
  context?: ChatErrorContext
): HumanError {
  const msg = error?.message ?? "";
  const lower = msg.toLowerCase();
  const providerName = providerLabel(context?.provider);
  const stamp = (h: HumanError): HumanError => ({
    ...h,
    provider: context?.provider,
    model: context?.model,
  });

  // Quota / rate limit — matches Gemini's RESOURCE_EXHAUSTED plus the usual
  // "429" and "rate limit" flavours from the other providers.
  if (
    lower.includes("quota") ||
    lower.includes("rate limit") ||
    lower.includes("rate_limit") ||
    lower.includes("resource_exhausted") ||
    lower.includes(" 429") ||
    lower.startsWith("429") ||
    lower.includes("too many requests")
  ) {
    // Try to extract "Please retry in 42.9s" — the Google SDK embeds this
    // as a helpful hint; others may not.
    const retryMatch = msg.match(/retry in\s+(\d+(?:\.\d+)?)\s*s/i);
    const retryAfterSeconds = retryMatch
      ? Math.ceil(parseFloat(retryMatch[1]))
      : undefined;

    const isFreeTier = lower.includes("free_tier") || lower.includes("free tier");
    const who = providerName ?? "the provider";

    return stamp({
      title: providerName
        ? `Rate limit reached — ${providerName}`
        : "Rate limit reached",
      description: isFreeTier
        ? `You've hit ${who}'s free-tier quota${context?.model ? ` on ${context.model}` : ""}.`
        : `${who} is throttling requests${context?.model ? ` on ${context.model}` : ""} for now.`,
      hint: retryAfterSeconds
        ? `Wait ~${retryAfterSeconds}s and try again, or switch provider in the picker above.`
        : "Wait a minute and try again, or switch provider in the picker above.",
      retryAfterSeconds,
    });
  }

  // Missing / invalid API key. Covers Google's API_KEY_INVALID, OpenAI's
  // "Incorrect API key provided", Anthropic's "invalid x-api-key", etc.
  if (
    lower.includes("api key") ||
    lower.includes("api_key") ||
    lower.includes("unauthorized") ||
    lower.includes("invalid_argument") ||
    lower.includes("invalid argument") ||
    lower.includes(" 401") ||
    lower.startsWith("401") ||
    lower.includes(" 403") ||
    lower.startsWith("403")
  ) {
    return stamp({
      title: providerName
        ? `${providerName} rejected the request`
        : "Provider rejected the request",
      description: `Your ${providerName ?? "provider"} API key is missing, invalid, or doesn't have access to ${context?.model ?? "this model"}.`,
      hint: "Paste a valid key into the provider picker above.",
    });
  }

  // Context window overflow — when the conversation itself is too long.
  if (
    lower.includes("context length") ||
    lower.includes("context window") ||
    lower.includes("maximum context") ||
    lower.includes("too many tokens") ||
    (lower.includes("token") && lower.includes("limit"))
  ) {
    return stamp({
      title: "Conversation too long",
      description: `This chat has outgrown ${context?.model ?? "the model"}'s context window${providerName ? ` on ${providerName}` : ""}.`,
      hint: "Start a new design, or switch to a model with a bigger window.",
    });
  }

  // Network / connectivity. Often surfaced as a plain `TypeError` from
  // fetch — we match on the well-known message shapes.
  if (
    lower.includes("failed to fetch") ||
    lower.includes("network") ||
    lower.includes("econnrefused") ||
    lower.includes("etimedout") ||
    lower.includes("enotfound")
  ) {
    return stamp({
      title: "Network error",
      description: `Couldn't reach ${providerName ?? "the provider"} from this session.`,
      hint: "Check your connection and try again.",
    });
  }

  // Model not found — happens if the user selects a model their key
  // doesn't have, or the provider renamed a model.
  if (
    lower.includes("model not found") ||
    lower.includes("model does not exist") ||
    lower.includes("not_found") ||
    lower.includes(" 404") ||
    lower.startsWith("404")
  ) {
    return stamp({
      title: "Model unavailable",
      description: `${context?.model ?? "The selected model"} isn't accessible${providerName ? ` on ${providerName}` : ""} — it may require a paid plan or a different key.`,
      hint: "Pick another model from the picker above.",
    });
  }

  // Fallback — keep the raw message but cap it so a URL-heavy payload
  // doesn't blow out the error banner.
  const trimmed = msg.trim();
  return stamp({
    title: providerName
      ? `Something went wrong — ${providerName}`
      : "Something went wrong",
    description:
      trimmed.length > 220 ? trimmed.slice(0, 220).trimEnd() + "…" : trimmed,
  });
}
