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
}

/** Returns a friendly display object for a streaming-chat error. */
export function humanizeChatError(error: Error | null | undefined): HumanError {
  const msg = error?.message ?? "";
  const lower = msg.toLowerCase();

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

    return {
      title: "Rate limit reached",
      description: isFreeTier
        ? "You've hit the provider's free-tier quota."
        : "The provider is throttling requests for now.",
      hint: retryAfterSeconds
        ? `Wait ~${retryAfterSeconds}s and try again, or switch provider in the picker above.`
        : "Wait a minute and try again, or switch provider in the picker above.",
      retryAfterSeconds,
    };
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
    return {
      title: "Provider rejected the request",
      description:
        "Your API key is missing, invalid, or doesn't have access to this model.",
      hint: "Paste a valid key into the provider picker above.",
    };
  }

  // Context window overflow — when the conversation itself is too long.
  if (
    lower.includes("context length") ||
    lower.includes("context window") ||
    lower.includes("maximum context") ||
    lower.includes("too many tokens") ||
    (lower.includes("token") && lower.includes("limit"))
  ) {
    return {
      title: "Conversation too long",
      description: "This chat has outgrown the model's context window.",
      hint: "Start a new design, or switch to a model with a bigger window.",
    };
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
    return {
      title: "Network error",
      description: "Couldn't reach the provider from this session.",
      hint: "Check your connection and try again.",
    };
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
    return {
      title: "Model unavailable",
      description:
        "The selected model isn't accessible — it may require a paid plan or a different key.",
      hint: "Pick another model from the picker above.",
    };
  }

  // Fallback — keep the raw message but cap it so a URL-heavy payload
  // doesn't blow out the error banner.
  const trimmed = msg.trim();
  return {
    title: "Something went wrong",
    description:
      trimmed.length > 220 ? trimmed.slice(0, 220).trimEnd() + "…" : trimmed,
  };
}
