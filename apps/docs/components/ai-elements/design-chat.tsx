"use client";

/**
 * DesignChat — the chat surface for /chat.
 *
 * Uses the AI SDK v6 `useChat` hook with a DefaultChatTransport so we can
 * inject `provider`, `model`, and (optional) BYOK `apiKey` into every
 * request body. Assistant messages are scanned for ```jsx fenced blocks
 * and each block is rendered as a live Sandpack preview inline via
 * DesignPreview — exactly what the user's system prompt asked for:
 * "take inputs from a user and output designs using the system".
 *
 * Partial (still-streaming) code blocks show a placeholder so we don't
 * spam Sandpack with half-parsed JSX.
 */

import { useCallback, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, User, Square, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { DesignPreview } from "./design-preview";
import type { ChatSettings } from "./provider-picker";
import { humanizeChatError } from "@/lib/chat-error";

interface DesignChatProps {
  settings: ChatSettings;
  systemPrompt: string;
  suggestedPrompts?: { text: string; icon?: React.ReactNode }[];
  className?: string;
}

/**
 * Split `text` into alternating prose / jsx-block segments.
 *
 * A block is matched by ```jsx … ``` or ```tsx … ``` (the closing fence is
 * optional — if missing, we treat the trailing block as in-progress).
 *
 * Returns something like:
 *   [{ kind: 'text', value: 'Here is the login form:' },
 *    { kind: 'jsx', value: '<Card>…</Card>', complete: true }]
 */
type Segment =
  | { kind: "text"; value: string }
  | { kind: "jsx"; value: string; complete: boolean };

function parseSegments(text: string): Segment[] {
  const out: Segment[] = [];
  // Match ```jsx|tsx [optional language spec] \n …content… \n``` (closing optional)
  const fence = /```(?:jsx|tsx)\s*\n([\s\S]*?)(?:```|$)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = fence.exec(text)) !== null) {
    const before = text.slice(lastIndex, match.index);
    if (before) out.push({ kind: "text", value: before });

    const closedProperly = text.slice(match.index + match[0].length - 3, match.index + match[0].length) === "```";
    out.push({
      kind: "jsx",
      value: match[1],
      complete: closedProperly,
    });
    lastIndex = match.index + match[0].length;
  }

  const tail = text.slice(lastIndex);
  if (tail) out.push({ kind: "text", value: tail });
  return out;
}

/**
 * Extract a plain-text representation of a UIMessage (v6 parts[] model).
 * We concatenate all `text` parts in order. Other part types (tool calls,
 * reasoning, files) are ignored for now — we only use text generation.
 */
function textFromParts(parts: { type: string; text?: string }[] | undefined): string {
  if (!parts) return "";
  return parts
    .filter((p) => p.type === "text" && typeof p.text === "string")
    .map((p) => p.text as string)
    .join("");
}

export function DesignChat({
  settings,
  systemPrompt,
  suggestedPrompts = DEFAULT_PROMPTS,
  className,
}: DesignChatProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Rebuild the transport whenever settings change so the latest provider /
  // model / apiKey flow through on the next sendMessage call. Using a ref
  // would keep a stale closure, so we keep it in a const inside the render.
  const transport = new DefaultChatTransport({
    api: "/api/chat",
    body: {
      provider: settings.provider,
      model: settings.model,
      apiKey: settings.apiKey || undefined,
      systemPrompt,
      // Honour the same toggle on /chat that /studio exposes.
      includeComponentRefs: settings.includeComponentRefs,
    },
  });

  // `DefaultChatTransport` from `ai@6` has the right runtime shape but a
  // slightly different `UIMessageChunk` type than the one `@ai-sdk/react@2`
  // still expects (via its internal `ai@5` pin). The difference is
  // `providerMetadata`'s `SharedV3ProviderMetadata` vs `SharedV2ProviderMetadata`
  // — structural only; the wire format matches.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { messages, sendMessage, status, stop, error, setMessages } = useChat({
    transport: transport as any,
  });

  const isStreaming = status === "streaming" || status === "submitted";

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }, []);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    sendMessage({ text: trimmed });
    setInput("");
    scrollToBottom();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-background border border-border rounded-lg overflow-hidden",
        className
      )}
    >
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto" data-lenis-prevent>
        <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
          {messages.length === 0 && !isStreaming && (
            <EmptyState
              suggestedPrompts={suggestedPrompts}
              onPick={(t) => setInput(t)}
            />
          )}

          {messages.map((msg) => {
            const text = textFromParts(msg.parts as any);
            return (
              <MessageRow
                key={msg.id}
                role={msg.role as "user" | "assistant"}
                text={text}
              />
            );
          })}

          {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
            <ThinkingIndicator />
          )}

          {error && (
            <ChatErrorBanner
              error={error}
              onDismiss={() => setMessages(messages)}
            />
          )}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border p-3 md:p-4 bg-card">
        <div className="max-w-3xl mx-auto flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe a UI — e.g. 'login form with remember-me'"
            disabled={isStreaming}
            rows={1}
            className={cn(
              "flex-1 resize-none rounded-md border border-input bg-background px-3 py-2",
              "text-sm text-foreground placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-ring",
              "disabled:opacity-50"
            )}
            style={{ minHeight: 40, maxHeight: 160 }}
          />
          {isStreaming ? (
            <button
              type="button"
              onClick={() => stop()}
              className="h-10 px-3 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 flex items-center gap-1.5 text-sm"
            >
              <Square className="h-3.5 w-3.5" />
              Stop
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim()}
              className={cn(
                "h-10 w-10 rounded-md flex items-center justify-center transition-colors",
                input.trim()
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function MessageRow({
  role,
  text,
}: {
  role: "user" | "assistant";
  text: string;
}) {
  const segments = role === "assistant" ? parseSegments(text) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex gap-3",
        role === "user" && "flex-row-reverse"
      )}
    >
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
          role === "user" ? "bg-primary" : "bg-muted"
        )}
      >
        {role === "user" ? (
          <User className="h-4 w-4 text-primary-foreground" />
        ) : (
          <Sparkles className="h-4 w-4 text-primary" />
        )}
      </div>

      <div
        className={cn(
          "min-w-0 flex-1 rounded-2xl border px-4 py-3",
          role === "user"
            ? "bg-primary text-primary-foreground border-primary rounded-tr-sm max-w-[80%] ml-auto"
            : "bg-card border-border rounded-tl-sm"
        )}
      >
        {role === "user" ? (
          <p className="text-sm whitespace-pre-wrap">{text}</p>
        ) : (
          <div className="space-y-2">
            {segments!.map((seg, i) =>
              seg.kind === "text" ? (
                seg.value.trim() ? (
                  <div
                    key={i}
                    className="prose prose-sm dark:prose-invert max-w-none [&_pre]:bg-muted [&_code]:text-foreground"
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {seg.value}
                    </ReactMarkdown>
                  </div>
                ) : null
              ) : (
                <DesignPreview
                  key={i}
                  code={seg.value}
                  streaming={!seg.complete}
                />
              )
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ThinkingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
        <Sparkles className="h-4 w-4 text-primary" />
      </div>
      <div className="rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xs italic text-muted-foreground">Thinking</span>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                className="w-1.5 h-1.5 rounded-full bg-primary"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  suggestedPrompts,
  onPick,
}: {
  suggestedPrompts: { text: string; icon?: React.ReactNode }[];
  onPick: (text: string) => void;
}) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-12 text-center"
      >
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
          <Sparkles className="h-7 w-7 text-primary-foreground" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-1">
          Design with Grade DS
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mb-6">
          Describe a UI in plain English. I&rsquo;ll respond with a live
          preview built from real Grade components, plus the JSX you can copy.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full">
          {suggestedPrompts.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onPick(p.text)}
              className={cn(
                "flex items-start gap-2 rounded-lg border border-border bg-card px-3 py-2",
                "text-left text-sm text-foreground",
                "hover:bg-muted transition-colors"
              )}
            >
              {p.icon}
              <span>{p.text}</span>
            </button>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Friendly error card for provider failures in the chat stream.
 *
 * Provider errors (especially Gemini's free-tier rate-limit payload) can
 * balloon to 400+ characters of prose + URLs. We pipe them through
 * `humanizeChatError` so the user sees a short, useful message, and use
 * `[overflow-wrap:anywhere]` on the fallback text so a raw URL can't blow
 * the banner out past the chat column's width.
 */
function ChatErrorBanner({
  error,
  onDismiss,
}: {
  error: Error;
  onDismiss: () => void;
}) {
  const human = humanizeChatError(error);
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3 rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3"
      role="alert"
    >
      <div className="shrink-0 mt-0.5 text-destructive">
        <AlertTriangle className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-foreground">{human.title}</p>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss error"
            className="h-6 w-6 -mr-1 -mt-1 shrink-0 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        {human.description && (
          <p className="mt-0.5 text-sm text-muted-foreground break-words [overflow-wrap:anywhere]">
            {human.description}
          </p>
        )}
        {human.hint && (
          <p className="mt-1.5 text-xs text-muted-foreground/90 break-words [overflow-wrap:anywhere]">
            {human.hint}
          </p>
        )}
      </div>
    </motion.div>
  );
}

const DEFAULT_PROMPTS = [
  { text: "Design a login form with email, password, and a remember-me checkbox." },
  { text: "Show a pricing card with three tiers and a highlighted recommended plan." },
  { text: "Create an alert stack showing success, warning, and error states." },
  { text: "Build a settings panel with sections for profile, notifications, and billing." },
];
