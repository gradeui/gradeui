"use client";

/**
 * StudioChat — the left column of /studio.
 *
 * A slim conversational surface. Same streaming AI SDK wiring as
 * /components/ai-elements/design-chat.tsx, but tuned for the three-column
 * studio:
 *   - No inline Sandpack inside each message (the preview lives in the
 *     middle column; showing it twice would double the render cost and
 *     thrash the iframe on every stream chunk).
 *   - Emits the latest sealed ```jsx block via `onLatestCode` so the
 *     preview column can render it.
 *   - Narrower bubbles / tighter typography for a sidebar feel.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Sparkles,
  User,
  Square,
  X,
  Code2,
  Pencil,
  FilePlus2,
  Gauge,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatSettings } from "@/components/ai-elements/provider-picker";
import { STUDIO_TEMPLATES, type StudioTemplate } from "@/lib/studio-templates";
import { humanizeChatError } from "@/lib/chat-error";

/**
 * Intent the user picks before sending a studio prompt:
 *
 *   - "iterate": modify the component currently in the preview. The current
 *     code gets inlined into the outgoing message so the model has a clear
 *     starting point. Chat history accumulates.
 *   - "new":     start a fresh design. We wipe the chat history first so the
 *     model isn't influenced by the previous component.
 */
export type StudioIntent = "iterate" | "new";

/**
 * Hard ceiling on the prompt length. Keeps the outgoing request snug against
 * most provider input-token budgets and stops accidental paste-bombs (an
 * entire file gets pasted in, etc.) from burning tokens. Kept as a named
 * constant so the counter + the <textarea maxLength> agree.
 */
const INPUT_CHAR_LIMIT = 500;

/** Auto-grow height ceiling for the prompt textarea. Above this, the
 *  textarea starts scrolling internally so the chat column can't be
 *  pushed off-screen by a long prompt. Chosen empirically: ~8 rows of
 *  text-sm. */
const INPUT_MAX_HEIGHT_PX = 160;

interface StudioChatProps {
  /** Stable chat id. Passed through to `useChat({ id })` so the AI SDK keeps
   *  each design's chat history separate in its internal store — switching
   *  designs in the parent simply re-mounts this component with a new id,
   *  and the SDK restores the right conversation.
   *
   *  NB: `useChat` in @ai-sdk/react@2 does NOT persist messages by id across
   *  remounts — it constructs a fresh `Chat` on every mount. That's why the
   *  parent also has to keep a cache and feed it back via `initialMessages`. */
  chatId: string;
  settings: ChatSettings;
  systemPrompt: string;
  /** Override the default set of starter templates. Mostly useful for tests
   *  and docs pages — leave unset to get the canonical STUDIO_TEMPLATES. */
  templates?: StudioTemplate[];
  /** Seed messages used when the underlying `Chat` is constructed (i.e. on
   *  mount). The parent is the source of truth for per-design history; we
   *  rehydrate from it whenever this component remounts on tab-switch. */
  initialMessages?: UIMessage[];
  /** Fires whenever the internal message list changes (new user send, each
   *  stream chunk, assistant completion). The parent should persist these
   *  into its per-design cache so switching back restores the conversation. */
  onMessagesChange?: (messages: UIMessage[]) => void;
  /** Fires when the chat starts or stops streaming a response. Lets the
   *  preview column show a "generating…" state alongside the iframe. */
  onStreamingChange?: (isStreaming: boolean) => void;
  /** Called every time we parse a sealed ```jsx block out of the latest
   *  assistant message. The preview column wires this to its Sandpack. */
  onLatestCode: (code: string | null) => void;
  /** The JSX currently rendered in the middle preview. Used by the
   *  "iterate" intent so the model can modify it in place. */
  currentCode: string | null;
  className?: string;
}

/** Extract a plain string from an AI SDK v6 UIMessage.parts[]. */
function textFromParts(parts: { type: string; text?: string }[] | undefined): string {
  if (!parts) return "";
  return parts
    .filter((p) => p.type === "text" && typeof p.text === "string")
    .map((p) => p.text as string)
    .join("");
}

/**
 * Shape the server stamps onto `UIMessage.metadata` in `/api/chat/route.ts`.
 * The provider-native names (inputTokens / outputTokens) match the AI SDK's
 * `LanguageModelUsage` vocabulary; we forward them untouched. Any field may
 * be undefined on providers that don't report usage.
 */
interface MessageUsage {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}

function usageFromMetadata(meta: unknown): MessageUsage | null {
  if (!meta || typeof meta !== "object") return null;
  const usage = (meta as { usage?: MessageUsage }).usage;
  if (!usage || typeof usage !== "object") return null;
  // Only show the badge once at least one token field has arrived — prevents
  // an empty "0 in · 0 out" pill from flashing mid-stream.
  if (
    usage.inputTokens == null &&
    usage.outputTokens == null &&
    usage.totalTokens == null
  ) {
    return null;
  }
  return usage;
}

/**
 * Shape of the server-stamped "which component .md files were read" payload.
 *
 *   - `refs`: the canonical component names whose frontmatter was glued onto
 *     the system prompt for this turn — surfaced so the chat UI can show
 *     exactly what reference material the model saw.
 *   - `refsIncluded`: whether the includeComponentRefs toggle was ON for
 *     this request. Distinguishes "toggle off → zero refs by design" from
 *     "toggle on but no component names detected in the conversation" — the
 *     UI renders a different chip for each so the user can tell whether
 *     their toggle is actually doing what they think.
 */
interface RefsInfo {
  refs: string[];
  refsIncluded: boolean;
}

function refsFromMetadata(meta: unknown): RefsInfo | null {
  if (!meta || typeof meta !== "object") return null;
  const refsRaw = (meta as { refs?: unknown }).refs;
  const includedRaw = (meta as { refsIncluded?: unknown }).refsIncluded;
  // The metadata hasn't landed yet (mid-stream `start` part) — skip.
  if (refsRaw === undefined && includedRaw === undefined) return null;
  const refs = Array.isArray(refsRaw)
    ? refsRaw.filter((r): r is string => typeof r === "string")
    : [];
  // Default to "true" if the server forgot to stamp the flag — older route
  // responses won't carry it, and assuming ON matches the route's default.
  const refsIncluded = includedRaw === false ? false : true;
  return { refs, refsIncluded };
}

/** Return the code of the last ```jsx / ```tsx block in `text`.
 *
 *  When `sealedOnly` is true (the default during streaming) we only match
 *  fences that have a closing ``` — otherwise partial, mid-token JSX gets
 *  fed to Sandpack and it flashes compile errors on every chunk. Once the
 *  stream finishes we fall back to `sealedOnly: false` so a response that
 *  was stopped mid-fence still shows whatever it managed to produce. */
function latestJsxBlock(
  text: string,
  opts: { sealedOnly: boolean } = { sealedOnly: true }
): string | null {
  const fence = opts.sealedOnly
    ? /```(?:jsx|tsx)\s*\n?([\s\S]*?)```/g
    : /```(?:jsx|tsx)\s*\n?([\s\S]*?)(?:```|$)/g;
  let match: RegExpExecArray | null;
  let latest: string | null = null;
  while ((match = fence.exec(text)) !== null) {
    // Skip empty captures that happen when the fence has only just opened
    // — Sandpack can't do anything useful with an empty file yet.
    if (match[1].trim()) latest = match[1];
  }
  return latest;
}

/** Strip fenced code blocks from prose so the chat column only shows the
 *  narrative — the code lives in the preview column, not in the bubble. */
function stripCodeBlocks(text: string): string {
  return text.replace(/```[\s\S]*?(?:```|$)/g, "").trim();
}

export function StudioChat({
  chatId,
  settings,
  systemPrompt,
  templates = STUDIO_TEMPLATES,
  initialMessages,
  onMessagesChange,
  onStreamingChange,
  onLatestCode,
  currentCode,
  className,
}: StudioChatProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Default to "iterate" once there's something on screen — otherwise "new"
  // is the only sensible start. The user can always flip manually.
  const [intent, setIntent] = useState<StudioIntent>("new");
  const scrollRef = useRef<HTMLDivElement>(null);

  // CRITICAL: `useChat` builds its internal `Chat` (and captures the transport)
  // ONCE at mount via `useRef`. Any transport we construct on subsequent
  // renders gets discarded — so a literal `body: {...}` on the transport
  // would pin provider/model to whatever was in the picker at mount, and
  // subsequent picker changes wouldn't propagate.
  //
  // Fix: use `prepareSendMessagesRequest`, which the AI SDK invokes at
  // REQUEST time (inside `transport.sendMessages`) — not at render time.
  // We stash the live settings in a ref, and the hook reads `settingsRef.current`
  // on each send. That keeps:
  //   - the transport stable (one `Chat` instance per mount → no re-captures)
  //   - the render chain pristine (no per-call body, no cascading deps on
  //     `settings` / `systemPrompt` that would otherwise churn effects and
  //     risk "Maximum update depth exceeded")
  //   - picker changes live (the next send picks up the latest provider/model
  //     from the ref, no matter how stale `useChat`'s cached transport is).
  const settingsRef = useRef({ settings, systemPrompt });
  settingsRef.current = { settings, systemPrompt };

  const transportRef = useRef<DefaultChatTransport<UIMessage>>(undefined);
  if (!transportRef.current) {
    transportRef.current = new DefaultChatTransport<UIMessage>({
      api: "/api/chat",
      prepareSendMessagesRequest: ({ id, messages, trigger, messageId }) => {
        const { settings: s, systemPrompt: sp } = settingsRef.current;
        return {
          body: {
            id,
            messages,
            trigger,
            messageId,
            provider: s.provider,
            model: s.model,
            apiKey: s.apiKey || undefined,
            systemPrompt: sp,
            // Mirror the user's toggle through to the server. When false, the
            // chat route skips the component-reference block entirely —
            // saving tokens at the cost of the model occasionally guessing
            // prop names.
            includeComponentRefs: s.includeComponentRefs,
          },
        };
      },
    });
  }
  const transport = transportRef.current;

  // Freeze the seed messages at mount. If the parent's cache updates while
  // this chat is live (the common case — we ARE the producer of those
  // updates), we must not feed the mutation back in or `Chat` would loop.
  // Re-seeding only happens when the whole component remounts on tab switch,
  // which is exactly what the `key={chat-${activeId}}` in /studio does.
  const seedRef = useRef(initialMessages);

  // `DefaultChatTransport` from `ai@6` has the right runtime shape but a
  // slightly different `UIMessageChunk` type than the one `@ai-sdk/react@2`
  // still expects (via its internal `ai@5` pin). The difference is
  // `providerMetadata`'s `SharedV3ProviderMetadata` vs `SharedV2ProviderMetadata`
  // — structural only; the wire format matches. See also design-chat.tsx.
  // We also pass `messages: seedRef.current` so tab-switches restore history
  // (useChat otherwise recreates an empty `Chat` on mount even with the same id).
  const { messages, sendMessage, status, stop, error, setMessages } = useChat({
    id: chatId,
    // Throttle the messages callback. Without this, fast providers (Groq,
    // Cerebras) emit tokens quickly enough that every chunk triggers a
    // render cascade: `ReactChatState.replaceMessage` makes a fresh array
    // AND `structuredClone`s every message on every token, then fires the
    // `useSyncExternalStore` subscriber, which re-runs our `onMessagesChange`
    // / `onLatestCode` effects, which setState on the parent. React's
    // nested-update guard trips at ~50 deep and we get "Maximum update
    // depth exceeded". Gemini was slow enough per-chunk that the cascade
    // completed before the next token arrived, so it never tripped.
    // 50ms gives us ~20 UI updates/sec — still feels live, but the depth
    // guard never sees a pile-up. See @ai-sdk/react dist index.mjs line 61:
    // `throttleWaitMs ? throttle(onChange, throttleWaitMs) : onChange`.
    experimental_throttle: 50,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    messages: seedRef.current as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transport: transport as any,
  });

  const isStreaming = status === "streaming" || status === "submitted";

  // Tell the parent so it can show a loader in the preview column alongside
  // the chat's own indicator. Firing on every status change is cheap —
  // React bails out of the parent render if the boolean is unchanged.
  useEffect(() => {
    onStreamingChange?.(isStreaming);
  }, [isStreaming, onStreamingChange]);

  // Once a design first lands on screen, nudge the default intent to
  // "iterate" — that's almost always what the user wants next (tweak the
  // current thing, not throw it away). Guarded by a ref so the flip only
  // happens ONCE per chat lifetime; otherwise the effect fights the user
  // whenever they manually click "New design" (intent → "new" →effect
  // re-runs → snaps straight back to "iterate"). After the first auto-flip
  // the toggle is purely user-driven.
  const autoFlippedRef = useRef(false);
  useEffect(() => {
    if (autoFlippedRef.current) return;
    if (currentCode && intent === "new" && messages.length > 0) {
      setIntent("iterate");
      autoFlippedRef.current = true;
    }
  }, [currentCode, intent, messages.length]);

  // Report the full message list up to the parent on every change. The
  // parent caches these keyed by designId so that switching tabs — which
  // remounts this component — can restore the right conversation from the
  // cache via `initialMessages`. Fires on every stream chunk; the parent's
  // setState is a shallow merge so that's effectively one ref update per tick.
  useEffect(() => {
    onMessagesChange?.(messages as UIMessage[]);
  }, [messages, onMessagesChange]);

  // Surface the freshest ```jsx block from the newest assistant message up
  // to the parent. While the response is still streaming we require a SEALED
  // fence — if we fed Sandpack every intermediate state it would try to
  // compile half-typed JSX on every token and flash a sea of red compile
  // errors until the closing ``` finally arrives. Once the stream finishes
  // we relax that and accept a partial fence too, so a response stopped
  // mid-fence (user hit Stop, network blip) doesn't strand the preview
  // empty.
  useEffect(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role !== "assistant") continue;
      const text = textFromParts(msg.parts as any);
      const code = latestJsxBlock(text, { sealedOnly: isStreaming });
      // While streaming, don't clobber a previously-good preview just
      // because the current block hasn't sealed yet — let the old render
      // stay up until the new sealed block overwrites it.
      if (code || !isStreaming) onLatestCode(code);
      return;
    }
    if (!isStreaming) onLatestCode(null);
  }, [messages, onLatestCode, isStreaming]);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }, []);

  // Auto-grow the prompt textarea up to INPUT_MAX_HEIGHT_PX, then let it
  // scroll internally. Reset to "auto" first so the measurement reflects
  // the current content rather than the previously-set explicit height
  // (otherwise the textarea would only ever grow, never shrink on delete).
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const next = Math.min(el.scrollHeight, INPUT_MAX_HEIGHT_PX);
    el.style.height = next + "px";
  }, [input]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    // "new" wipes the conversation so the model isn't nudged by the previous
    // design. We also kill the preview immediately so the middle column
    // doesn't linger on a stale component while the new one streams.
    if (intent === "new") {
      setMessages([]);
      onLatestCode(null);
      sendMessage({ text: trimmed });
    } else {
      // "iterate" — inline the current code so the model has explicit context
      // about what it's modifying. Fall back to a plain message if there's
      // nothing on screen yet (defensive; the UI picks "new" by default then).
      const text = currentCode
        ? [
            "Here is the current component. Modify it based on the request below.",
            "",
            "```jsx",
            currentCode.trim(),
            "```",
            "",
            "Request: " + trimmed,
          ].join("\n")
        : trimmed;
      sendMessage({ text });
    }

    setInput("");
    scrollToBottom();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Picking a template seeds the input and moves focus into the textarea so
  // the user can tweak the wording before sending (or just hit enter).
  const handlePickTemplate = useCallback((template: StudioTemplate) => {
    setInput(template.prompt);
    // Flip to "new" — templates are starting points, not iteration hints.
    setIntent("new");
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      const len = template.prompt.length;
      textareaRef.current?.setSelectionRange(len, len);
    });
  }, []);

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-background border border-border rounded-lg overflow-hidden",
        className
      )}
    >
      <div className="px-3 py-2 border-b border-border bg-muted/30 shrink-0 flex items-center justify-between gap-2">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
          <Sparkles className="h-3 w-3" />
          Design chat
        </h2>
        <SessionTokenTotal messages={messages as UIMessage[]} />
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto" data-lenis-prevent>
        <div className="p-3 md:p-4 space-y-4">
          {messages.length === 0 && !isStreaming && (
            <EmptyState
              templates={templates}
              onPick={handlePickTemplate}
            />
          )}

          {messages.map((msg) => {
            const raw = textFromParts(msg.parts as any);
            const usage = usageFromMetadata(msg.metadata);
            const refsInfo = refsFromMetadata(msg.metadata);
            return (
              <MessageRow
                key={msg.id}
                role={msg.role as "user" | "assistant"}
                text={raw}
                usage={usage}
                refsInfo={refsInfo}
              />
            );
          })}

          {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
            <ThinkingIndicator />
          )}

          {error && (
            <ErrorBanner
              error={error}
              provider={settings.provider}
              model={settings.model}
              onDismiss={() => setMessages(messages)}
            />
          )}
        </div>
      </div>

      <div className="border-t border-border p-2.5 bg-card shrink-0 space-y-2">
        <IntentToggle
          intent={intent}
          onChange={setIntent}
          hasCurrent={Boolean(currentCode)}
        />
        {/* When the user is starting a new design mid-session, surface the
            templates again. We skip this on first load — the full-height
            EmptyState above already shows them. */}
        {intent === "new" && messages.length > 0 && (
          <TemplateChips templates={templates} onPick={handlePickTemplate} />
        )}
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              // Belt-and-braces: <textarea maxLength> already blocks typing
              // past the limit, but a paste event can deliver more chars in
              // one go — slice here so the state never exceeds the limit.
              const next = e.target.value;
              setInput(
                next.length > INPUT_CHAR_LIMIT
                  ? next.slice(0, INPUT_CHAR_LIMIT)
                  : next
              );
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              intent === "iterate" && currentCode
                ? "Describe a change — e.g. 'make the button pill-shaped'"
                : "Describe a UI…"
            }
            disabled={isStreaming}
            rows={1}
            maxLength={INPUT_CHAR_LIMIT}
            className={cn(
              "flex-1 resize-none rounded-md border border-input bg-background px-2.5 py-2",
              "text-sm text-foreground placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-ring",
              "disabled:opacity-50 overflow-y-auto"
            )}
            style={{ minHeight: 36, maxHeight: INPUT_MAX_HEIGHT_PX }}
          />
          {isStreaming ? (
            <button
              type="button"
              onClick={() => stop()}
              className="h-9 px-2.5 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 flex items-center gap-1 text-xs"
            >
              <Square className="h-3 w-3" />
              Stop
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim()}
              className={cn(
                "h-9 w-9 rounded-md flex items-center justify-center transition-colors",
                input.trim()
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
              aria-label="Send message"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <InputFooter charCount={input.length} limit={INPUT_CHAR_LIMIT} />
      </div>
    </div>
  );
}

/**
 * Disclaimer + character counter strip directly under the prompt input.
 *
 * The disclaimer sets expectations: Studio is a preview surface, its model
 * output can be wrong / syntactically broken / visually off — we'd rather
 * the user know that up-front than feel misled when a generation trips.
 *
 * The counter goes amber as we approach the ceiling and red once we've hit
 * it. Both numbers come through CSS variables via `text-muted-foreground`
 * / `text-warning-deep` / `text-destructive` so the colours respond to the
 * active theme rather than pinning a hard hex.
 */
function InputFooter({ charCount, limit }: { charCount: number; limit: number }) {
  const nearLimit = charCount >= Math.floor(limit * 0.9);
  const atLimit = charCount >= limit;
  return (
    <div className="flex items-center justify-between gap-2 pt-0.5 text-[10px] text-muted-foreground">
      <span className="italic leading-tight">
        This is a chat preview, and may be prone to error.
      </span>
      <span
        className={cn(
          "font-mono tabular-nums shrink-0",
          nearLimit && !atLimit && "text-warning-deep",
          atLimit && "text-destructive"
        )}
        aria-live="polite"
      >
        {charCount}/{limit}
      </span>
    </div>
  );
}

/**
 * If a user message starts with the "Here is the current component…" preamble
 * that `handleSend` injects when iterating, peel it back to the original
 * prompt for display. Keeps the chat scroll readable — the scaffolding is
 * machine context, not something the human wants to re-read.
 */
function displayUserText(text: string): string {
  const m = text.match(/Request:\s*([\s\S]+)$/);
  if (m && text.startsWith("Here is the current component")) return m[1].trim();
  return text;
}

function MessageRow({
  role,
  text,
  usage,
  refsInfo,
}: {
  role: "user" | "assistant";
  text: string;
  usage: MessageUsage | null;
  refsInfo: RefsInfo | null;
}) {
  const prose = role === "assistant" ? stripCodeBlocks(text) : text;
  const hasCode = role === "assistant" && /```(?:jsx|tsx)/.test(text);
  const isIterate = role === "user" && text.startsWith("Here is the current component");

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex gap-2", role === "user" && "flex-row-reverse")}
    >
      <div
        className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center shrink-0",
          role === "user" ? "bg-primary" : "bg-muted"
        )}
      >
        {role === "user" ? (
          <User className="h-3 w-3 text-primary-foreground" />
        ) : (
          <Sparkles className="h-3 w-3 text-primary" />
        )}
      </div>

      <div
        className={cn(
          "min-w-0 flex-1 rounded-xl border px-3 py-2",
          role === "user"
            ? "bg-primary text-primary-foreground border-primary rounded-tr-sm max-w-[85%] ml-auto"
            : "bg-card border-border rounded-tl-sm"
        )}
      >
        {role === "user" ? (
          <div className="space-y-1">
            {isIterate && (
              <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide opacity-75">
                <Pencil className="h-2.5 w-2.5" />
                Iteration
              </div>
            )}
            <p className="text-xs whitespace-pre-wrap">
              {displayUserText(text)}
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {prose ? (
              <div className="prose prose-sm dark:prose-invert max-w-none text-xs [&_p]:my-1 [&_pre]:bg-muted [&_code]:text-foreground">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {prose}
                </ReactMarkdown>
              </div>
            ) : null}
            {hasCode && (
              <div className="flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-[11px] text-muted-foreground">
                <Code2 className="h-3 w-3" />
                Rendered in preview →
              </div>
            )}
            {(usage || refsInfo) && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                {usage && <TokenBadge usage={usage} />}
                {refsInfo && <RefsChip info={refsInfo} />}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Header-level running total across every assistant message in the active
 * conversation. Sums input/output/total independently so partial reports
 * (e.g. a provider that only returns `totalTokens`) still contribute.
 */
function SessionTokenTotal({ messages }: { messages: UIMessage[] }) {
  let inp = 0;
  let out = 0;
  let total = 0;
  let seen = false;
  for (const m of messages) {
    if (m.role !== "assistant") continue;
    const u = usageFromMetadata(m.metadata);
    if (!u) continue;
    seen = true;
    if (typeof u.inputTokens === "number") inp += u.inputTokens;
    if (typeof u.outputTokens === "number") out += u.outputTokens;
    if (typeof u.totalTokens === "number") total += u.totalTokens;
  }
  if (!seen) return null;
  const fmt = new Intl.NumberFormat();
  return (
    <span
      className="flex items-center gap-1 text-[10px] font-normal normal-case tracking-normal text-muted-foreground"
      title={`Session totals — Input: ${fmt.format(inp)} · Output: ${fmt.format(out)} · Total: ${fmt.format(total)}`}
    >
      <Gauge className="h-2.5 w-2.5" />
      {fmt.format(total || inp + out)} tokens
    </span>
  );
}

/**
 * Compact per-call token readout. Renders as a text-only row so it doesn't
 * compete with the message bubble's own chrome. Numbers are grouped with
 * `Intl.NumberFormat` for legibility at larger context windows.
 *
 * Uses semantic tokens (`text-muted-foreground`) rather than hard colours so
 * the badge inherits the current Grade theme — same story as the rest of the
 * studio sidebar.
 */
function TokenBadge({ usage }: { usage: MessageUsage }) {
  const fmt = (n: number | undefined) =>
    typeof n === "number" ? new Intl.NumberFormat().format(n) : null;
  const inp = fmt(usage.inputTokens);
  const out = fmt(usage.outputTokens);
  const total = fmt(usage.totalTokens);
  return (
    <div
      className="flex items-center gap-1 pt-0.5 text-[10px] text-muted-foreground"
      title={`Input: ${inp ?? "?"} · Output: ${out ?? "?"} · Total: ${total ?? "?"}`}
    >
      <Gauge className="h-2.5 w-2.5" />
      {inp != null && <span>{inp} in</span>}
      {inp != null && out != null && <span aria-hidden>·</span>}
      {out != null && <span>{out} out</span>}
      {total != null && (inp != null || out != null) && (
        <span aria-hidden className="opacity-60">
          ({total} total)
        </span>
      )}
      {total != null && inp == null && out == null && <span>{total} tokens</span>}
    </div>
  );
}

/**
 * Compact "which component .md files did we read" readout — a sibling of
 * TokenBadge. Shows alongside the token count so the user can answer two
 * questions at a glance: "how much did this cost?" and "what reference
 * material did the model see?".
 *
 * Three rendered states, matching server meaning:
 *   - toggle OFF         → muted "refs off" chip. Confirms the toggle is
 *                          doing what the user expects (no token spend on
 *                          refs) even when the answer is nominally good.
 *   - toggle ON, 0 hits  → "0 refs" chip. Most common on first-turn prompts
 *                          like "make me a login form" where no component
 *                          name has been mentioned yet; useful signal that
 *                          the next iteration might see refs once the
 *                          assistant's code introduces component names.
 *   - toggle ON, N hits  → "N refs: Button, Dialog, …" with a tooltip
 *                          listing every file that was pulled in verbatim.
 *
 * Intentionally monochrome (muted-foreground) so it doesn't compete with
 * the message content — this is a developer transparency affordance, not a
 * status badge.
 */
function RefsChip({ info }: { info: RefsInfo }) {
  const { refs, refsIncluded } = info;
  const fmt = new Intl.NumberFormat();
  if (!refsIncluded) {
    return (
      <div
        className="flex items-center gap-1 pt-0.5 text-[10px] text-muted-foreground opacity-70"
        title="Component reference toggle is OFF — no .md files were appended to the system prompt for this turn."
      >
        <BookOpen className="h-2.5 w-2.5" />
        <span>refs off</span>
      </div>
    );
  }
  if (refs.length === 0) {
    return (
      <div
        className="flex items-center gap-1 pt-0.5 text-[10px] text-muted-foreground"
        title="No component .md files matched this turn — the conversation didn't mention any component names yet."
      >
        <BookOpen className="h-2.5 w-2.5" />
        <span>0 refs</span>
      </div>
    );
  }
  // Render every loaded ref inline. The list can get long on rich prompts
  // but transparency beats tidiness here — the whole point of the chip is
  // to show exactly which .md files paid tokens. `flex-wrap` on the outer
  // container handles overflow by line-breaking rather than clipping.
  return (
    <div
      className="flex flex-wrap items-center gap-x-1 gap-y-0 pt-0.5 text-[10px] text-muted-foreground leading-relaxed"
      title={`Loaded ${fmt.format(refs.length)} component .md ${
        refs.length === 1 ? "file" : "files"
      } for this turn:\n  ${refs.join(", ")}`}
    >
      <BookOpen className="h-2.5 w-2.5 shrink-0" />
      <span>
        {fmt.format(refs.length)} {refs.length === 1 ? "ref" : "refs"}
      </span>
      <span aria-hidden className="opacity-60">
        :
      </span>
      <span className="opacity-80 break-words">{refs.join(", ")}</span>
    </div>
  );
}

/**
 * Presentational error banner used by the chat column. Pulls the raw
 * SDK error through `humanizeChatError` so rate-limit / quota / 401s get
 * a friendly title + hint instead of the provider's 400-character
 * payload. Long messages wrap and cap at a scrollable region so the
 * banner can't push the chat out of its column.
 */
function ErrorBanner({
  error,
  provider,
  model,
  onDismiss,
}: {
  error: Error;
  provider?: string;
  model?: string;
  onDismiss: () => void;
}) {
  const human = humanizeChatError(error, { provider, model });
  return (
    <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-2.5 text-xs text-destructive min-w-0">
      <X className="h-3.5 w-3.5 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0 space-y-1">
        <p className="font-medium leading-tight">{human.title}</p>
        <p className="text-[11px] opacity-90 leading-snug break-words [overflow-wrap:anywhere]">
          {human.description}
        </p>
        {human.hint && (
          <p className="text-[11px] opacity-70 leading-snug break-words [overflow-wrap:anywhere]">
            {human.hint}
          </p>
        )}
        {(human.provider || human.model) && (
          <p className="pt-0.5 text-[10px] font-mono opacity-60 leading-snug">
            {[human.provider, human.model].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="text-[11px] underline shrink-0 self-start hover:opacity-80"
      >
        Dismiss
      </button>
    </div>
  );
}

function ThinkingIndicator() {
  return (
    <div className="flex gap-2">
      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
        <Sparkles className="h-3 w-3 text-primary" />
      </div>
      <div className="rounded-xl rounded-tl-sm border border-border bg-card px-3 py-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] italic text-muted-foreground">
            Thinking
          </span>
          <div className="flex gap-0.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ y: [0, -3, 0], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                className="w-1 h-1 rounded-full bg-primary"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  templates,
  onPick,
}: {
  templates: StudioTemplate[];
  onPick: (template: StudioTemplate) => void;
}) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-start py-2"
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center mb-2.5 shadow">
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </div>
        <h3 className="text-sm font-semibold text-foreground mb-0.5">
          Design it, then theme it
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          Pick a starter template or describe a component yourself.
        </p>

        <div className="grid grid-cols-2 gap-1.5 w-full">
          {templates.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onPick(t)}
                title={t.description}
                className={cn(
                  "group flex items-start gap-2 rounded-md border border-border bg-card px-2.5 py-2",
                  "text-left text-xs text-foreground",
                  "hover:border-primary/40 hover:bg-muted transition-colors"
                )}
              >
                <Icon className="h-3.5 w-3.5 mt-0.5 text-muted-foreground group-hover:text-primary shrink-0" />
                <div className="min-w-0">
                  <div className="font-medium leading-tight">{t.label}</div>
                  <div className="text-[10.5px] text-muted-foreground leading-tight mt-0.5 line-clamp-2">
                    {t.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * A compact horizontal chip row surfacing the same templates during a session
 * — used when the user flips back to "New design" after already building
 * something. Horizontally scrollable so it never pushes the textarea out.
 */
function TemplateChips({
  templates,
  onPick,
}: {
  templates: StudioTemplate[];
  onPick: (template: StudioTemplate) => void;
}) {
  return (
    <div className="-mx-0.5 overflow-x-auto" data-lenis-prevent>
      <div className="flex items-center gap-1 px-0.5 pb-0.5">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground shrink-0 pr-1">
          Start from
        </span>
        {templates.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onPick(t)}
              title={t.description}
              className={cn(
                "flex items-center gap-1 rounded-full border border-border bg-background",
                "px-2 py-0.5 text-[11px] text-foreground shrink-0",
                "hover:border-primary/40 hover:bg-muted transition-colors"
              )}
            >
              <Icon className="h-3 w-3 text-muted-foreground" />
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Segmented control letting the user choose whether the next prompt iterates
 * on what's currently on screen or starts a brand-new design. Disabled
 * options show a helpful hint — iterate is unavailable until there's
 * something to iterate against.
 */
function IntentToggle({
  intent,
  onChange,
  hasCurrent,
}: {
  intent: StudioIntent;
  onChange: (i: StudioIntent) => void;
  hasCurrent: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Design intent"
      className="inline-flex items-center rounded-md border border-border bg-background p-0.5 text-[11px]"
    >
      <button
        type="button"
        role="radio"
        aria-checked={intent === "iterate"}
        onClick={() => hasCurrent && onChange("iterate")}
        disabled={!hasCurrent}
        title={hasCurrent ? "Modify the current design" : "Generate a design first"}
        className={cn(
          "flex items-center gap-1 px-2 py-1 rounded transition-colors",
          intent === "iterate"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground",
          !hasCurrent && "opacity-40 cursor-not-allowed hover:text-muted-foreground"
        )}
      >
        <Pencil className="h-3 w-3" />
        Update current
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={intent === "new"}
        onClick={() => onChange("new")}
        className={cn(
          "flex items-center gap-1 px-2 py-1 rounded transition-colors",
          intent === "new"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <FilePlus2 className="h-3 w-3" />
        New design
      </button>
    </div>
  );
}

