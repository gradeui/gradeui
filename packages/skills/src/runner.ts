/**
 * Skill runner — invokes a `ComposeSkill` against a typed input and returns
 * the typed output.
 *
 * Uses the Vercel AI SDK's `generateObject` for structured output: the skill's
 * `outputSchema` is passed as the response shape, so the model is constrained
 * to return well-formed JSON. The runner validates the result against the same
 * schema before returning it — defense in depth against off-spec model output.
 *
 * Provider resolution order (highest priority first):
 *   1. `opts.provider` (caller override) — but if `GRADE_FREE_TIER_ONLY=1` is
 *      set and the override is a paid provider, the runner THROWS rather than
 *      silently spending money. See "free-tier safety" below.
 *   2. `skill.frontmatter.defaultProvider` — only if that provider's key is
 *      configured. Skill preferences are advisory: a skill that prefers
 *      Anthropic happily runs on Google when only the Google key exists.
 *   3. Env-based fallback — first provider with a key set. Order biases to
 *      Google FIRST (best free tier — `gemini-2.5-flash` is a generous-quota
 *      vision-capable model) so users on free keys are never silently moved
 *      onto a paid provider.
 *
 * Free-tier safety:
 *   Set `GRADE_FREE_TIER_ONLY=1` in env to lock the runner to Google only.
 *   Paid providers are refused as resolutions and as overrides — the runner
 *   throws with a clear error rather than running anything that would bill.
 *   Recommended during testing / local development.
 *
 * Model resolution:
 *   1. `opts.model` — explicit override
 *   2. `skill.frontmatter.defaultModel` — skill-pinned model
 *   3. Provider default — vision-capable when `frontmatter.vision === true`
 */

import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { generateObject, type LanguageModel } from "ai";
import type { ComposeSkill, ProviderId } from "./types";

export interface RunSkillOptions<I> {
  input: I;
  /** Override the resolved model entirely. */
  model?: LanguageModel;
  /** Override the provider — runner picks an appropriate default model. */
  provider?: ProviderId;
}

/** Default models per provider. Tuned for structured-output reliability. */
const DEFAULTS = {
  text: {
    anthropic: "claude-sonnet-4-6",
    google: "gemini-2.5-flash",
    openai: "gpt-4o-mini",
  },
  vision: {
    anthropic: "claude-sonnet-4-6",
    google: "gemini-2.5-flash",
    openai: "gpt-4o",
  },
} as const;

/** Per-provider env var that holds the API key. */
const PROVIDER_KEY_ENV: Record<ProviderId, string> = {
  anthropic: "ANTHROPIC_API_KEY",
  google: "GOOGLE_GENERATIVE_AI_API_KEY",
  openai: "OPENAI_API_KEY",
};

/** Providers that have a usable free tier today. */
const FREE_TIER_PROVIDERS: ReadonlySet<ProviderId> = new Set(["google"]);

function hasKey(provider: ProviderId): boolean {
  return Boolean(process.env[PROVIDER_KEY_ENV[provider]]);
}

function isFreeTierOnly(): boolean {
  const v = process.env.GRADE_FREE_TIER_ONLY;
  return v === "1" || v === "true";
}

function resolveProvider(
  skill: ComposeSkill<unknown, unknown>,
  override?: ProviderId,
): ProviderId {
  const freeOnly = isFreeTierOnly();

  // 1. Explicit caller override. Under free-tier mode, refuse paid providers.
  if (override) {
    if (freeOnly && !FREE_TIER_PROVIDERS.has(override)) {
      throw new Error(
        `[@gradeui/skills] GRADE_FREE_TIER_ONLY=1 is set — refusing to use paid provider "${override}". Unset the flag or override with "google".`,
      );
    }
    return override;
  }

  // 2. Skill's preferred provider — only if (a) its key is configured AND
  //    (b) free-tier mode permits it. Otherwise fall through.
  const preferred = skill.frontmatter.defaultProvider;
  if (
    preferred &&
    hasKey(preferred) &&
    (!freeOnly || FREE_TIER_PROVIDERS.has(preferred))
  ) {
    return preferred;
  }

  // 3. Env-based fallback. **Google first** so users on free keys are never
  //    silently moved onto a paid provider. Under free-tier mode, paid
  //    providers are skipped entirely.
  if (hasKey("google")) return "google";
  if (!freeOnly) {
    if (hasKey("anthropic")) return "anthropic";
    if (hasKey("openai")) return "openai";
  }

  throw new Error(
    freeOnly
      ? "[@gradeui/skills] GRADE_FREE_TIER_ONLY=1 is set but GOOGLE_GENERATIVE_AI_API_KEY is not configured. Set the key or unset the flag."
      : "[@gradeui/skills] No provider configured. Set GOOGLE_GENERATIVE_AI_API_KEY (free), ANTHROPIC_API_KEY, or OPENAI_API_KEY in your environment.",
  );
}

function resolveModel(
  skill: ComposeSkill<unknown, unknown>,
  provider: ProviderId,
): LanguageModel {
  const isVision = skill.frontmatter.vision === true;
  const explicitId = skill.frontmatter.defaultModel;
  const id = explicitId ?? (isVision ? DEFAULTS.vision[provider] : DEFAULTS.text[provider]);

  switch (provider) {
    case "anthropic":
      return anthropic(id);
    case "google":
      return google(id);
    case "openai":
      return openai(id);
  }
}

export async function runSkill<I, O>(
  skill: ComposeSkill<I, O>,
  opts: RunSkillOptions<I>,
): Promise<O> {
  // 1. Validate input against the skill's schema before paying for a model call.
  const input = skill.inputSchema.parse(opts.input);

  // 2. Resolve provider + model.
  const provider = resolveProvider(skill, opts.provider);
  const model = opts.model ?? resolveModel(skill, provider);

  // 3. Format input. Default behavior: stringify so the schema fields appear
  //    as a structured block in the user message.
  const formatted = skill.formatInput
    ? skill.formatInput(input)
    : JSON.stringify(input, null, 2);

  const messages =
    typeof formatted === "string"
      ? [{ role: "user" as const, content: formatted }]
      : [{ role: "user" as const, content: formatted }];

  // 4. Generate.
  const { object } = await generateObject({
    model,
    system: skill.systemPrompt,
    messages,
    schema: skill.outputSchema,
  });

  // 5. Defense in depth — re-validate the output too.
  return skill.outputSchema.parse(object) as O;
}
