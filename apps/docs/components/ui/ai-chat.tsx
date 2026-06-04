"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  BookOpen,
  Brain,
  Check,
  ChevronDown,
  Circle,
  Clock,
  Gauge,
  Loader2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { AIChatComposer, type ChatAttachment } from "./ai-chat-composer";

// Icon-light by design (May 2026 refresh): no user-avatar circles, no
// sparkle decoration on the header / empty state / thinking indicator.
// Message rows differentiate user vs assistant via alignment + bubble
// colour only.
//
// AIChat is a flexible chat surface — header + scrollable message
// list + composer. The composer is a separate primitive (see
// <AIChatComposer>). Hosts wanting more than the canned shape (e.g.
// Studio's left-column chat) pass slot props: `emptyStateSlot`,
// `errorSlot`, `composerAboveSlot`, `composerBelowSlot`, and
// `composerSlot`. All optional — the default `<AIChat>` looks
// exactly as it did before these slots existed.

// ---------------------------------------------------------------------
// Public types

export type { ChatAttachment } from "./ai-chat-composer";

/** Per-turn token usage. Any field may be undefined on providers that
 *  don't report it; the renderer hides missing values cleanly. */
export interface ChatMessageUsage {
  input?: number;
  output?: number;
  total?: number;
}

/** Per-message action (e.g. "Rendered in preview →", "Copy"). Rendered
 *  as a chip-style button inside the assistant bubble. */
export interface ChatMessageAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}

/** One stage of a multi-step pipeline (e.g. "Reading refs",
 *  "Generating component"). Drives the live step timeline rendered
 *  above the assistant prose. Statuses are advisory: the renderer
 *  shows pending as muted, running as a spinner, done with a check,
 *  error with an alert glyph. `detail` (optional) is a short hint
 *  shown next to the label in the expanded view. */
export type ChatMessageStepStatus = "pending" | "running" | "done" | "error";

export interface ChatMessageStep {
  id: string;
  label: string;
  status: ChatMessageStepStatus;
  detail?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  /** Optional model-emitted reasoning ("thinking") content. Rendered
   *  in a disclosure above the assistant prose when `showThinking` is
   *  true on the parent <AIChat>. Parsed as markdown — providers emit
   *  structured summaries (Gemini bolds section headings, Claude
   *  paragraphs its reasoning). */
  thinking?: string;
  /** True while this message's reasoning is still streaming in. The
   *  disclosure auto-expands so thoughts read live as they arrive,
   *  then auto-collapses when the host flips it back to false (unless
   *  the user toggled it manually — their choice wins). */
  thinkingStreaming?: boolean;
  /** Optional pipeline-step timeline. Rendered above the assistant
   *  prose when `showSteps` is true on the parent <AIChat>.
   *  Collapsed view shows the current running step (or final summary);
   *  expanded view shows the full list with status glyphs. */
  steps?: ChatMessageStep[];
  /** Optional token usage for this turn. Rendered when `showUsage`
   *  is true on the parent <AIChat>. */
  usage?: ChatMessageUsage;
  /** Optional list of references (e.g. component .md files read into
   *  context). Rendered when `showRefs` is true on the parent
   *  <AIChat>. Empty array renders as "0 refs"; undefined renders
   *  nothing. */
  refs?: string[];
  /** Optional per-turn actions (e.g. "Rendered in preview →").
   *  Rendered when `showActions` is true (the default) and the
   *  message has at least one action. */
  actions?: ChatMessageAction[];
  /** Optional wall-clock duration for the turn in milliseconds (host
   *  measures it — start at request, stop at stream-end). Rendered
   *  when `showDuration` is true on the parent <AIChat>. */
  duration?: number;
}

interface AIChatProps {
  messages?: ChatMessage[];
  /**
   * Fires when the user submits via the default composer. Ignored if
   * `composerSlot` is set (hosts then own the composer wiring).
   */
  onSendMessage?: (message: string, attachments?: ChatAttachment[]) => void;
  isLoading?: boolean;
  placeholder?: string;
  /** Header title (default "AI Assistant"). */
  title?: string;
  /** Optional icon rendered before the title (e.g. <Sparkles/>). */
  titleIcon?: React.ReactNode;
  /** Optional session-level token total shown on the right of the
   *  header. Renders as "N tokens" with a small gauge icon. Hidden
   *  when undefined. */
  headerTokens?: number;
  /** Optional arbitrary content rendered after the header tokens,
   *  on the right of the header. */
  headerEnd?: React.ReactNode;
  /**
   * Show the per-turn token usage strip below the assistant bubble
   * when a message carries `usage`. Default false to preserve the
   * canned chat look; turn on for developer-facing chats.
   */
  showUsage?: boolean;
  /**
   * Show the per-turn refs strip below the assistant bubble when a
   * message carries `refs`. Default false.
   */
  showRefs?: boolean;
  /**
   * Show per-turn actions (chips like "Rendered in preview →") when
   * a message carries `actions`. Default true.
   */
  showActions?: boolean;
  /**
   * Show the per-turn wall-clock duration ("2.3s") below the
   * assistant bubble when a message carries `duration`. Default
   * false.
   */
  showDuration?: boolean;
  /**
   * Show the per-turn reasoning ("thinking") disclosure above the
   * assistant prose when a message carries `thinking`. Default
   * false. The disclosure is collapsed by default — the user
   * expands it to read the full reasoning content.
   */
  showThinking?: boolean;
  /**
   * Show the per-turn step timeline above the assistant prose when
   * a message carries `steps`. Default false. Collapsed view shows
   * the current running step (or a "N steps completed" summary);
   * expanded view shows the full vertical timeline with status
   * glyphs.
   */
  showSteps?: boolean;
  /** Override the "Thinking" label in the loading indicator. */
  thinkingPhrase?: string;
  /**
   * Suggested-prompt chips shown in the default empty state. Ignored
   * when `emptyStateSlot` is set.
   */
  suggestedPrompts?: Array<{ icon?: React.ReactNode; text: string }>;
  /**
   * Replace the default empty state entirely. Rendered inside the
   * scrollable message area when `messages` is empty AND `isLoading`
   * is false.
   */
  emptyStateSlot?: React.ReactNode;
  /** Optional content rendered after the messages list (typically an
   *  error banner). */
  errorSlot?: React.ReactNode;
  /** Optional content rendered between the messages and the composer
   *  (e.g. selection chip, settings panel). */
  composerAboveSlot?: React.ReactNode;
  /** Optional content rendered below the composer (e.g. a disclaimer
   *  + char counter). */
  composerBelowSlot?: React.ReactNode;
  /**
   * Full override of the composer. When provided, `onSendMessage`
   * and `placeholder` are unused — the host's composer is responsible
   * for its own state and submit handler.
   */
  composerSlot?: React.ReactNode;
  /**
   * Strip the outer chrome (background, border, rounded corners) so
   * the chat takes the surface of its container. Used by hosts that
   * embed the chat as a column of a larger layout (e.g. Studio's
   * left column). The internal section dividers — the header
   * `border-b` and the composer `border-t` — remain so the regions
   * still read as distinct.
   */
  bare?: boolean;
  /**
   * Whether assistant messages render with a bubble (background +
   * border + padding + rounded corners). Default `true`. Set to
   * `false` for a Claude.ai-style transcript where assistant text
   * sits on the surface with no chrome, and only user turns get
   * the bubble treatment. The metadata strip (usage / refs /
   * actions) still renders below the assistant text either way.
   */
  assistantBubble?: boolean;
  className?: string;
}

const DEFAULT_SUGGESTED_PROMPTS = [
  { text: "Ask me anything" },
  { text: "Quick summary" },
];

const formatThousands = (n: number) => new Intl.NumberFormat().format(n);

// ---------------------------------------------------------------------
// Per-message metadata renderers

function MessageActions({ actions }: { actions: ChatMessageAction[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {actions.map((a) => (
        <button
          key={a.id}
          type="button"
          onClick={a.onClick}
          disabled={!a.onClick}
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px]",
            "bg-gds-gray-100 dark:bg-[#1a1a1a] text-gds-gray-700 dark:text-gds-gray-300",
            "border border-gds-gray-200 dark:border-[#252525]",
            a.onClick && "hover:bg-gds-gray-200 dark:hover:bg-[#252525] transition-colors",
            !a.onClick && "cursor-default"
          )}
        >
          {a.icon}
          {a.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Format milliseconds as a compact duration string: "240ms" for
 * sub-second turns, "3.2s" otherwise. Sub-minute we stay in
 * seconds — chat turns longer than a minute are unusual and the
 * exact value matters more than tidy formatting at that point.
 */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function DurationRow({ duration }: { duration: number }) {
  return (
    <div
      className="flex items-center gap-1 text-[11px] text-gds-gray-500 dark:text-gds-gray-400"
      title={`Turn took ${formatDuration(duration)}`}
    >
      <Clock className="w-3 h-3" />
      <span>{formatDuration(duration)}</span>
    </div>
  );
}

function UsageRow({ usage }: { usage: ChatMessageUsage }) {
  const inp = typeof usage.input === "number" ? formatThousands(usage.input) : null;
  const out = typeof usage.output === "number" ? formatThousands(usage.output) : null;
  const total = typeof usage.total === "number" ? formatThousands(usage.total) : null;
  return (
    <div
      className="flex items-center flex-wrap gap-1 text-[11px] text-gds-gray-500 dark:text-gds-gray-400"
      title={`Input: ${inp ?? "?"} · Output: ${out ?? "?"} · Total: ${total ?? "?"}`}
    >
      <Gauge className="w-3 h-3" />
      {inp != null && <span>{inp} in</span>}
      {inp != null && out != null && <span aria-hidden>·</span>}
      {out != null && <span>{out} out</span>}
      {total != null && (inp != null || out != null) && (
        <span aria-hidden className="opacity-60">({total} total)</span>
      )}
      {total != null && inp == null && out == null && <span>{total} tokens</span>}
    </div>
  );
}

/**
 * Inline step glyph driven by status. Sized to match `text-[11px]`
 * adjacent labels so the row reads as one strip.
 */
function StepIcon({ status }: { status: ChatMessageStepStatus }) {
  switch (status) {
    case "done":
      return <Check className="w-3 h-3 text-primary shrink-0" />;
    case "running":
      return (
        <Loader2 className="w-3 h-3 text-primary animate-spin shrink-0" />
      );
    case "error":
      return <AlertCircle className="w-3 h-3 text-red-500 shrink-0" />;
    case "pending":
    default:
      return (
        <Circle className="w-3 h-3 text-gds-gray-400 dark:text-gds-gray-600 shrink-0" />
      );
  }
}

/**
 * Collapsible "Thoughts" panel — shown above the assistant prose
 * when a message carries `thinking`.
 *
 * Streaming behaviour: while `streaming` is true the panel is
 * auto-expanded so reasoning reads live as it arrives, and the label
 * reads "Thinking…". When the host flips `streaming` back to false the
 * panel auto-collapses to its one-line "Thoughts" summary — unless the
 * user toggled it manually mid-stream, in which case their choice
 * sticks. Content is parsed as markdown (providers emit structured
 * summaries — bold headings, paragraphs), rendered at disclosure scale.
 */
function ThinkingDisclosure({
  thinking,
  streaming = false,
}: {
  thinking: string;
  streaming?: boolean;
}) {
  // null = user hasn't touched it → follow `streaming`. A manual
  // toggle pins the user's choice for the rest of the message's life.
  const [userToggled, setUserToggled] = useState<boolean | null>(null);
  const expanded = userToggled ?? streaming;
  return (
    <div className="rounded-md border border-gds-gray-200 dark:border-[#252525] bg-gds-gray-50 dark:bg-[#141414] overflow-hidden">
      <button
        type="button"
        onClick={() => setUserToggled(!expanded)}
        aria-expanded={expanded}
        className="flex w-full items-center gap-2 px-2.5 py-1.5 text-[11px] text-gds-gray-700 dark:text-gds-gray-300 hover:bg-gds-gray-100 dark:hover:bg-[#1a1a1a] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
      >
        <Brain
          className={cn(
            "w-3.5 h-3.5 text-gds-gray-500 dark:text-gds-gray-400 shrink-0",
            streaming && "animate-pulse text-primary"
          )}
        />
        <span className="flex-1 text-left font-medium">
          {streaming ? "Thinking…" : "Thoughts"}
        </span>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 text-gds-gray-500 dark:text-gds-gray-400 transition-transform shrink-0",
            expanded && "rotate-180"
          )}
        />
      </button>
      {expanded && (
        <div className="px-3 py-2 border-t border-gds-gray-200 dark:border-[#252525] text-[11px] text-gds-gray-600 dark:text-gds-gray-400 leading-relaxed prose prose-sm dark:prose-invert max-w-none [&_p]:my-1 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_strong]:text-gds-gray-700 dark:[&_strong]:text-gds-gray-300 [&_*]:text-[11px]">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{thinking}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

/**
 * Collapsible step timeline — shown above the assistant prose when
 * a message carries `steps`. Collapsed view shows the most relevant
 * step at a glance (running first; otherwise error; otherwise the
 * "all done" summary; otherwise next pending). Expanded view lists
 * every step with its status glyph + optional detail.
 */
function StepsDisclosure({ steps }: { steps: ChatMessageStep[] }) {
  const [expanded, setExpanded] = useState(false);
  const running = steps.find((s) => s.status === "running");
  const error = steps.find((s) => s.status === "error");
  const allDone = steps.length > 0 && steps.every((s) => s.status === "done");

  let summaryStatus: ChatMessageStepStatus;
  let summaryLabel: string;
  if (error) {
    summaryStatus = "error";
    summaryLabel = error.label;
  } else if (running) {
    summaryStatus = "running";
    summaryLabel = running.label;
  } else if (allDone) {
    summaryStatus = "done";
    summaryLabel = `${steps.length} ${steps.length === 1 ? "step" : "steps"} completed`;
  } else {
    const next = steps.find((s) => s.status === "pending") ?? steps[0];
    summaryStatus = next.status;
    summaryLabel = next.label;
  }

  return (
    <div className="rounded-md border border-gds-gray-200 dark:border-[#252525] bg-gds-gray-50 dark:bg-[#141414] overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex w-full items-center gap-2 px-2.5 py-1.5 text-[11px] text-gds-gray-700 dark:text-gds-gray-300 hover:bg-gds-gray-100 dark:hover:bg-[#1a1a1a] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
      >
        <StepIcon status={summaryStatus} />
        <span className="flex-1 text-left truncate">{summaryLabel}</span>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 text-gds-gray-500 dark:text-gds-gray-400 transition-transform shrink-0",
            expanded && "rotate-180"
          )}
        />
      </button>
      {expanded && (
        <ol className="px-3 py-2 border-t border-gds-gray-200 dark:border-[#252525] space-y-1.5 text-[11px]">
          {steps.map((s) => (
            <li
              key={s.id}
              className="flex items-start gap-2 text-gds-gray-700 dark:text-gds-gray-300"
            >
              <span className="mt-0.5">
                <StepIcon status={s.status} />
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className={cn(
                    "leading-snug",
                    s.status === "done" &&
                      "text-gds-gray-500 dark:text-gds-gray-500"
                  )}
                >
                  {s.label}
                </div>
                {s.detail && (
                  <div className="text-[10px] text-gds-gray-500 dark:text-gds-gray-500 leading-snug mt-0.5">
                    {s.detail}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function RefsRow({ refs }: { refs: string[] }) {
  const fmt = new Intl.NumberFormat();
  if (refs.length === 0) {
    return (
      <div className="flex items-center gap-1 text-[11px] text-gds-gray-500 dark:text-gds-gray-400">
        <BookOpen className="w-3 h-3" />
        <span>0 refs</span>
      </div>
    );
  }
  return (
    <div
      className="flex flex-wrap items-baseline gap-x-1 gap-y-0 text-[11px] text-gds-gray-500 dark:text-gds-gray-400 leading-relaxed"
      title={`${fmt.format(refs.length)} ${refs.length === 1 ? "ref" : "refs"}:\n  ${refs.join(", ")}`}
    >
      <BookOpen className="w-3 h-3 shrink-0 self-center" />
      <span className="font-medium">
        {fmt.format(refs.length)} {refs.length === 1 ? "ref" : "refs"}
      </span>
      <span aria-hidden className="opacity-60">:</span>
      <span className="opacity-90 break-words">{refs.join(", ")}</span>
    </div>
  );
}

// ---------------------------------------------------------------------
// AIChat

export function AIChat({
  messages = [],
  onSendMessage,
  isLoading = false,
  placeholder = "Ask a question...",
  title = "AI Assistant",
  titleIcon,
  headerTokens,
  headerEnd,
  showUsage = false,
  showRefs = false,
  showActions = true,
  showThinking = false,
  showSteps = false,
  showDuration = false,
  thinkingPhrase = "Thinking",
  suggestedPrompts = DEFAULT_SUGGESTED_PROMPTS,
  emptyStateSlot,
  errorSlot,
  composerAboveSlot,
  composerBelowSlot,
  composerSlot,
  bare = false,
  assistantBubble = true,
  className,
}: AIChatProps) {
  const [query, setQuery] = useState("");
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(messages.length);

  // Track scroll position
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setIsScrolledUp(scrollTop < scrollHeight - clientHeight - 50);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-scroll: follow NEW messages and STREAMED growth of the last
  // message (content + thinking lengthen on every chunk without the
  // message count changing — the old count-only check left the chat
  // stuck at the top during a streamed turn). Pinned-to-bottom only:
  // once the user scrolls up to read history, we stop following.
  // Streaming growth scrolls with `auto` (instant) — smooth-scrolling
  // 20×/sec lags behind the content; new messages keep the smooth glide.
  const lastMsg = messages[messages.length - 1];
  const lastContentSig = lastMsg
    ? lastMsg.content.length + (lastMsg.thinking?.length ?? 0)
    : 0;
  const prevContentSigRef = useRef(lastContentSig);
  useEffect(() => {
    const grewCount = messages.length > prevMessagesLengthRef.current;
    const grewContent = lastContentSig > prevContentSigRef.current;
    if (!isScrolledUp && (grewCount || grewContent)) {
      chatEndRef.current?.scrollIntoView({
        behavior: grewCount ? "smooth" : "auto",
      });
    }
    prevMessagesLengthRef.current = messages.length;
    prevContentSigRef.current = lastContentSig;
  }, [messages, lastContentSig, isScrolledUp]);

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden",
        !bare &&
          "bg-white dark:bg-[#141414] rounded-lg border border-gds-gray-200 dark:border-[#252525]",
        className
      )}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-2 px-4 py-3 border-b border-gds-gray-200 dark:border-[#252525]"
      >
        <span className="text-sm font-medium text-gds-gray-900 dark:text-white flex items-center gap-1.5 min-w-0">
          {titleIcon}
          <span className="truncate">{title}</span>
        </span>
        {(headerTokens !== undefined || headerEnd) && (
          <div className="flex items-center gap-2 shrink-0">
            {headerTokens !== undefined && (
              <span
                className="flex items-center gap-1 text-[11px] text-gds-gray-500 dark:text-gds-gray-400"
                title={`Session total: ${formatThousands(headerTokens)} tokens`}
              >
                <Gauge className="w-3 h-3" />
                {formatThousands(headerTokens)} tokens
              </span>
            )}
            {headerEnd}
          </div>
        )}
      </motion.div>

      {/* Messages Area */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto relative" data-lenis-prevent>
        {/* Scroll fade gradient */}
        <AnimatePresence>
          {isScrolledUp && messages.length > 3 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-white dark:from-[#141414] to-transparent pointer-events-none z-10"
            />
          )}
        </AnimatePresence>

        <div className="p-4 space-y-4">
          {/* Empty state — host override OR built-in suggested prompts */}
          {messages.length === 0 && !isLoading && (
            emptyStateSlot ? (
              <>{emptyStateSlot}</>
            ) : (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center justify-center py-10 text-center"
                >
                  <h3 className="text-lg font-semibold text-gds-gray-900 dark:text-white mb-2">
                    How can I help?
                  </h3>
                  <p className="text-sm text-gds-gray-500 dark:text-gds-gray-400 max-w-xs mb-6">
                    Ask a question or pick a prompt to get started.
                  </p>

                  {/* Suggested prompts */}
                  <div className="flex flex-wrap gap-2 justify-center">
                    {suggestedPrompts.map((prompt, i) => (
                      <motion.button
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.05 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setQuery(prompt.text)}
                        className={cn(
                          "px-3 py-2 rounded-xl",
                          "bg-gds-gray-100 dark:bg-[#1a1a1a]",
                          "text-sm text-gds-gray-700 dark:text-gds-gray-300",
                          "hover:bg-gds-gray-200 dark:hover:bg-[#252525]",
                          "border border-gds-gray-200 dark:border-[#252525]",
                          "transition-colors duration-200"
                        )}
                      >
                        {prompt.text}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            )
          )}

          {/* Chat messages */}
          {messages.map((message) => {
            const hasActions =
              showActions && message.actions && message.actions.length > 0;
            const hasUsage = showUsage && !!message.usage;
            const hasRefs = showRefs && message.refs !== undefined;
            const hasDuration =
              showDuration && typeof message.duration === "number";
            const hasThinking =
              showThinking && !!message.thinking && message.thinking.length > 0;
            const hasSteps =
              showSteps && !!message.steps && message.steps.length > 0;
            const hasMeta =
              message.role === "assistant" &&
              (hasActions || hasUsage || hasRefs || hasDuration);

            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("flex", message.role === "user" && "justify-end")}
              >
                <div
                  className={cn(
                    // User turns always wear the bubble: bg, border,
                    // padding, rounded — right-aligned, narrow.
                    message.role === "user" &&
                      "rounded-2xl rounded-tr-sm px-4 py-3 border max-w-[80%] bg-primary text-primary-foreground border-primary",
                    // Assistant turns fill the row width. The bubble
                    // (bg + border + padding + rounded corners) is
                    // opt-out via `assistantBubble={false}` so hosts
                    // can pick a Claude.ai-style chromeless transcript
                    // where assistant text sits on the surface.
                    message.role === "assistant" && "w-full",
                    message.role === "assistant" &&
                      assistantBubble &&
                      "rounded-2xl rounded-tl-sm px-4 py-3 border bg-gds-gray-100 dark:bg-[#1a1a1a] border-gds-gray-200 dark:border-[#252525]"
                  )}
                >
                  {message.role === "assistant" ? (
                    <div className="space-y-2">
                      {/* Steps come first — they're the live "what's
                          happening now" timeline. Thinking sits below
                          because it's reflective, not procedural. Both
                          render above the prose so the answer arrives
                          beneath the process. */}
                      {hasSteps && (
                        <StepsDisclosure steps={message.steps!} />
                      )}
                      {hasThinking && (
                        <ThinkingDisclosure
                          thinking={message.thinking!}
                          streaming={message.thinkingStreaming}
                        />
                      )}
                      {message.content && (
                        // `text-sm` to match the user bubble; tight
                        // paragraph margins so prose-sm's defaults
                        // don't make multi-paragraph assistant turns
                        // feel taller than user turns.
                        <div className="prose prose-sm dark:prose-invert max-w-none text-sm [&_p]:my-1.5 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      )}
                      {hasMeta && (
                        <div className="space-y-1.5 pt-2 border-t border-gds-gray-200/60 dark:border-[#252525]/80">
                          {hasActions && <MessageActions actions={message.actions!} />}
                          {hasDuration && (
                            <DurationRow duration={message.duration!} />
                          )}
                          {hasUsage && <UsageRow usage={message.usage!} />}
                          {hasRefs && <RefsRow refs={message.refs!} />}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>
              </motion.div>
            );
          })}

          {/* AI Thinking Indicator */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex"
              >
                <div className="bg-gds-gray-100 dark:bg-[#1a1a1a] rounded-2xl rounded-tl-sm px-4 py-3 border border-gds-gray-200 dark:border-[#252525]">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gds-gray-500">{thinkingPhrase}</span>
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{
                            y: [0, -4, 0],
                            opacity: [0.4, 1, 0.4],
                          }}
                          transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            delay: i * 0.15,
                          }}
                          className="w-1.5 h-1.5 rounded-full bg-primary"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error slot — host renders its own banner here. */}
          {errorSlot}

          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Composer area — above slot → composer → below slot */}
      <div className="border-t border-gds-gray-200 dark:border-[#252525] p-3 sm:p-4 space-y-2">
        {composerAboveSlot}
        {composerSlot ?? (
          <AIChatComposer
            value={query}
            onChange={setQuery}
            onSend={(text, attachments) => {
              onSendMessage?.(text, attachments);
              setQuery("");
            }}
            isLoading={isLoading}
            placeholder={placeholder}
          />
        )}
        {composerBelowSlot}
      </div>
    </div>
  );
}
