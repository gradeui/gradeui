"use client";

/**
 * ProviderPicker — tiny settings dropdown for the /chat page.
 *
 * Lets the user swap between LLM providers (Google / Groq / Cerebras /
 * OpenRouter / Anthropic / OpenAI), pick a model, and paste in a
 * "bring-your-own-key" API key. Everything is persisted to localStorage so
 * the choice survives reloads.
 *
 * Free-tier providers carry a `free: true` flag and render with a small
 * green dot in the picker + a "Free" pill in the trigger label, so the user
 * can see at a glance where they don't need to spend money.
 *
 * Default: Gemini 3.5 Flash — GA at I/O 2026, free-tier on Google AI
 * Studio, 4× faster than 2.5 Flash. We keep 2.5 Flash + variants in
 * the catalog as the well-trodden free fallback in case 3.5 starts
 * throttling or a user's key isn't whitelisted for the new tier yet.
 * 3.5 Pro is omitted until it lands in June 2026; 3.1 Pro Preview is
 * the current top-end Pro id.
 */

import { useEffect, useState } from "react";
import { Settings2, KeyRound, Eye, EyeOff, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export type ProviderId =
  | "google"
  | "anthropic"
  | "openai"
  | "groq"
  | "openrouter"
  | "cerebras";

export interface ChatSettings {
  provider: ProviderId;
  model: string;
  apiKey: string;
  /**
   * When true, the server appends a compact component-reference block
   * (variants/sizes/props for whichever components are name-matched in the
   * conversation) to the system prompt. Off = save a few hundred tokens per
   * request at the cost of the model occasionally guessing prop names.
   */
  includeComponentRefs: boolean;
}

interface ProviderEntry {
  label: string;
  /** Short label used inside the pill grid — first word of `label` is fine
   *  for most; free-tier providers set this explicitly so we can keep the
   *  pill text compact while the dropdown label stays descriptive. */
  shortLabel: string;
  keyName: string;
  keyHint: string;
  models: string[];
  /** Providers that expose a no-cost tier (either an always-free quota or
   *  free-tagged models within an aggregator). Rendered with a "Free" pill
   *  in the picker so the user knows where to go first. */
  free?: boolean;
}

/**
 * Model catalog. First item is the default for each provider. Defaults are
 * chosen to be cheap-or-free: Gemini 3.5 Flash is free-tier on Google AI
 * Studio (and now the default after Google I/O 2026), Groq / Cerebras /
 * OpenRouter all have generous free tiers, Claude Haiku and GPT-4o Mini
 * are the cheapest paid options.
 */
export const PROVIDER_CATALOG: Record<ProviderId, ProviderEntry> = {
  google: {
    label: "Google (Gemini)",
    shortLabel: "Gemini",
    keyName: "GOOGLE_GENERATIVE_AI_API_KEY",
    keyHint: "Get a free key at aistudio.google.com/apikey",
    // Order matters — first item is the default. 3.5 Flash leads; 2.5
    // Flash is retained as the proven free fallback in case the 3.5
    // tier throttles or the user's key isn't on the new quota yet.
    // 3.5 Pro is intentionally absent until its June 2026 GA — listing
    // it now would 404 the moment anyone clicked it.
    models: [
      "gemini-3.5-flash",
      "gemini-3.1-pro",
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
      "gemini-2.5-pro",
      "gemini-flash-latest",
    ],
    free: true,
  },
  groq: {
    label: "Groq (GPT-OSS / Llama / Qwen)",
    shortLabel: "Groq",
    keyName: "GROQ_API_KEY",
    keyHint:
      "Get a free key at console.groq.com/keys. For Studio, `openai/gpt-oss-120b` is the best balance — it reliably emits fenced JSX, which the smaller Llamas often skip. `llama-3.3-70b-versatile` is strong too but has a tight ~12K TPM free-tier cap that a single component-heavy request can trip. `llama-3.1-8b-instant` is the most generous on quota (~500K TPM) but frequently ignores the JSX-fence output rule.",
    models: [
      // Groq production catalog as of April 2026. `openai/gpt-oss-120b`
      // is the new default — a format-tuned open-weights model that
      // follows structural output rules (fenced code blocks, JSON mode)
      // far more reliably than any of the small Llamas. Kimi K2 / Gemma
      // / DeepSeek were removed from Groq's production list; we drop
      // them here rather than 404 when users click.
      "openai/gpt-oss-120b",
      "openai/gpt-oss-20b",
      "llama-3.3-70b-versatile",
      "llama-3.1-8b-instant",
      "qwen/qwen3-32b",
    ],
    free: true,
  },
  cerebras: {
    label: "Cerebras (Llama)",
    shortLabel: "Cerebras",
    keyName: "CEREBRAS_API_KEY",
    keyHint: "Get a free key at cloud.cerebras.ai — fastest inference on Llama models",
    models: [
      "llama-3.3-70b",
      "llama3.1-8b",
      "qwen-3-32b",
    ],
    free: true,
  },
  openrouter: {
    label: "OpenRouter (mixed)",
    shortLabel: "OpenRouter",
    keyName: "OPENROUTER_API_KEY",
    keyHint:
      "Get a key at openrouter.ai/keys — models with the `:free` suffix are no-cost",
    models: [
      "google/gemini-2.0-flash-exp:free",
      "meta-llama/llama-3.3-70b-instruct:free",
      "deepseek/deepseek-chat-v3.1:free",
      "qwen/qwen3-coder:free",
      "z-ai/glm-4.5-air:free",
    ],
    free: true,
  },
  anthropic: {
    label: "Anthropic (Claude)",
    shortLabel: "Claude",
    keyName: "ANTHROPIC_API_KEY",
    keyHint: "Get a key at console.anthropic.com (paid)",
    models: [
      "claude-haiku-4-5-20251001",
      "claude-sonnet-4-6",
      "claude-opus-4-6",
    ],
  },
  openai: {
    label: "OpenAI (GPT)",
    shortLabel: "GPT",
    keyName: "OPENAI_API_KEY",
    keyHint: "Get a key at platform.openai.com/api-keys (paid)",
    models: ["gpt-4o-mini", "gpt-4o", "gpt-4.1", "gpt-4.1-mini"],
  },
};

export const DEFAULT_SETTINGS: ChatSettings = {
  provider: "google",
  // 3.5 Flash is the new free-tier default since Google I/O 2026. The
  // self-heal block in `useChatSettings` below will silently migrate
  // anyone whose persisted model id has been pulled from the catalog,
  // so users mid-session on 2.5-flash stay on 2.5-flash (it's still
  // listed); only orphaned ids get bumped to the first catalog entry.
  model: "gemini-3.5-flash",
  apiKey: "",
  // On by default — the lazy keyword match in component-refs.ts keeps the
  // cost small (nothing ships unless the conversation actually names a
  // component) and the quality win is substantial.
  includeComponentRefs: true,
};

const STORAGE_KEY = "gds-chat-settings";

/**
 * Small hook that hydrates from localStorage on mount and persists every
 * update back. SSR-safe — returns DEFAULT_SETTINGS on the server.
 */
export function useChatSettings(): [
  ChatSettings,
  (update: Partial<ChatSettings>) => void,
  boolean, // hydrated
] {
  const [settings, setSettings] = useState<ChatSettings>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<ChatSettings>;
        setSettings((prev) => {
          const merged = { ...prev, ...parsed };
          // Self-heal: if the persisted model isn't in the current catalog
          // (provider may have deprecated the model — e.g. Groq pulled
          // Kimi K2 and Gemma from production), fall back to the
          // provider's first catalogued model instead of stranding the
          // user on an invalid id that 404s every send.
          const providerCatalog = PROVIDER_CATALOG[merged.provider];
          if (
            providerCatalog &&
            !providerCatalog.models.includes(merged.model)
          ) {
            merged.model = providerCatalog.models[0];
          }
          return merged;
        });
      }
    } catch {
      // fall back to defaults
    }
    setHydrated(true);
  }, []);

  const update = (patch: Partial<ChatSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      // If provider changed but model wasn't, reset model to that provider's
      // default — otherwise we'd send e.g. "gpt-4o" to Anthropic.
      if (patch.provider && !patch.model) {
        next.model = PROVIDER_CATALOG[patch.provider].models[0];
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // no-op — localStorage disabled or full
      }
      return next;
    });
  };

  return [settings, update, hydrated];
}

export function ProviderPicker({
  settings,
  onChange,
  className,
}: {
  settings: ChatSettings;
  onChange: (update: Partial<ChatSettings>) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const catalog = PROVIDER_CATALOG[settings.provider];
  const keyPresent = Boolean(settings.apiKey);

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-sm",
          "hover:bg-muted transition-colors"
        )}
      >
        <Settings2 className="h-3.5 w-3.5" />
        <span className="font-medium">{catalog.label}</span>
        {catalog.free && (
          <span className="inline-flex items-center gap-1 rounded bg-success-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-success-deep">
            Free
          </span>
        )}
        <span className="text-muted-foreground">·</span>
        <span className="font-mono text-xs text-muted-foreground">
          {settings.model}
        </span>
        {!keyPresent && (
          <span className="ml-1 inline-flex items-center gap-1 rounded bg-warning/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warning">
            <KeyRound className="h-2.5 w-2.5" />
            Key needed
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border border-border bg-popover shadow-lg z-50 p-4 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <span>Provider</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-success-deep">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  Free tier
                </span>
              </label>
              <div className="grid grid-cols-3 gap-1">
                {(Object.keys(PROVIDER_CATALOG) as ProviderId[]).map((id) => {
                  const entry = PROVIDER_CATALOG[id];
                  const active = settings.provider === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => onChange({ provider: id })}
                      className={cn(
                        "relative rounded-md border px-2 py-1.5 text-xs transition-colors",
                        active
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      {entry.free && (
                        <span
                          aria-hidden
                          className={cn(
                            "absolute top-1 right-1 h-1.5 w-1.5 rounded-full",
                            active ? "bg-success-deep" : "bg-success"
                          )}
                        />
                      )}
                      {entry.shortLabel}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Model
              </label>
              <select
                value={settings.model}
                onChange={(e) => onChange({ model: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm font-mono"
              >
                {catalog.models.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                System prompt
              </label>
              <button
                type="button"
                role="switch"
                aria-checked={settings.includeComponentRefs}
                onClick={() =>
                  onChange({
                    includeComponentRefs: !settings.includeComponentRefs,
                  })
                }
                className={cn(
                  "w-full flex items-start gap-3 rounded-md border px-2.5 py-2 text-left transition-colors",
                  "hover:bg-muted",
                  settings.includeComponentRefs
                    ? "border-primary/40 bg-primary/5"
                    : "border-border bg-background"
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-4 w-7 items-center rounded-full px-0.5 transition-colors shrink-0",
                    settings.includeComponentRefs
                      ? "bg-primary justify-end"
                      : "bg-muted-foreground/30 justify-start"
                  )}
                  aria-hidden
                >
                  <span className="h-3 w-3 rounded-full bg-background shadow-sm" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                    <BookOpen className="h-3 w-3" />
                    Include component refs
                  </span>
                  <span className="block mt-0.5 text-[11px] text-muted-foreground leading-snug">
                    Injects variants, sizes and props for components named in
                    the conversation. Off = fewer tokens; the model may guess
                    prop names.
                  </span>
                </span>
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center justify-between">
                <span>API key ({catalog.keyName})</span>
                <button
                  type="button"
                  onClick={() => setShowKey((s) => !s)}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label={showKey ? "Hide key" : "Show key"}
                >
                  {showKey ? (
                    <EyeOff className="h-3 w-3" />
                  ) : (
                    <Eye className="h-3 w-3" />
                  )}
                </button>
              </label>
              <input
                type={showKey ? "text" : "password"}
                value={settings.apiKey}
                onChange={(e) => onChange({ apiKey: e.target.value })}
                placeholder="sk-…"
                className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs font-mono"
                autoComplete="off"
                spellCheck={false}
              />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {catalog.keyHint}. Stored only in your browser&rsquo;s
                localStorage &mdash; never sent anywhere except the provider.
              </p>
            </div>

            <div className="pt-1 text-[11px] text-muted-foreground border-t border-border">
              Leave blank to fall back to the server&rsquo;s env var (if
              configured).
            </div>
          </div>
        </>
      )}
    </div>
  );
}
