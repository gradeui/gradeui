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

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, MousePointerClick } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatSettings } from "@/components/ai-elements/provider-picker";
import { STUDIO_TEMPLATES, type StudioTemplate } from "@/lib/studio-templates";
import { humanizeChatError } from "@/lib/chat-error";
import type { StudioSelection } from "@/lib/chat-sandpack";
import { useRotatingPhrase } from "@/lib/studio-loading-phrases";
import { SelectionInspector } from "@/components/studio/selection-inspector";
import { SelectionChip } from "@/components/studio/selection-chip";
import { AIChat, type ChatMessage } from "@/components/ui/ai-chat";
import {
  AIChatComposer,
  type ChatAttachment,
} from "@/components/ui/ai-chat-composer";

/**
 * The chat always iterates on whatever is currently in the tab it's attached
 * to. "Start a new design" used to be a dedicated intent here — a toggle that
 * wiped history and sent a fresh prompt — but once Studio grew the multi-
 * screen canvas that decision became a no-op: a new design means a new tab
 * (blank, reference-layout-seeded, or paste-seeded via the StarterPicker),
 * not a new conversation inside the same tab. The toggle was just asking
 * "do you want to erase the thing you can see?" — which is better expressed
 * by closing the tab and opening a new one.
 *
 * So the mode is now inferred from `currentCode`:
 *   - Non-null (scaffold seed OR prior assistant turn): inline the code as
 *     context and frame the prompt as a modification.
 *   - Null (truly blank tab): ship the user's prompt as-is — the model treats
 *     it as the component brief.
 */

/**
 * Hard ceiling on the prompt length. Keeps the outgoing request snug against
 * most provider input-token budgets and stops accidental paste-bombs (an
 * entire file gets pasted in, etc.) from burning tokens. Kept as a named
 * constant so the counter + the <textarea maxLength> agree. 1000 chars is
 * ~200 words — comfortable room to describe a multi-section layout ("hero
 * with shader background, pricing table below, testimonials, footer")
 * without hitting the wall mid-thought.
 */
const INPUT_CHAR_LIMIT = 1000;

// (The auto-grow height ceiling now lives inside <AIChatComposer> —
//  see `max-h-[200px]` in the composer's textarea classes. The local
//  `INPUT_MAX_HEIGHT_PX` constant was removed when the composer was
//  extracted; 160px → 200px is a tiny upward bump and was accepted as
//  the price of sharing the primitive.)

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
  /** Element the user picked in the preview via the Select tool. When set,
   *  we render a chip above the prompt input and forward the captured
   *  outerHTML through to the model so it knows what to modify. */
  selection?: StudioSelection | null;
  /** Fires when the chip's × is clicked — parent drops its selection state. */
  onClearSelection?: () => void;
  /** Fires when the settings panel rewrites the current App source
   *  directly (no chat round-trip). Parent should push the new source
   *  into its per-design appSource map so the preview HMRs to it. When
   *  omitted, the settings panel still renders but controls become no-ops.
   *  The optional `label` tags the undo snapshot. */
  onSourceMutation?: (nextSource: string, label?: string) => void;
  /** When true, the parent is rendering the settings panel in a different
   *  location (typically docked in the right column). We skip the inline
   *  copy so the user isn't looking at two of the same panel. Defaults
   *  to false — panel renders inline under the selection chip. */
  settingsPanelDocked?: boolean;
  /** Fires when the inline panel's "Dock →" affordance is clicked. Parent
   *  should flip `settingsPanelDocked` to true. */
  onRequestSettingsDock?: () => void;
  // -----------------------------------------------------------------
  // AI Chat visual toggles — forwarded straight to <AIChat>. Studio's
  // settings sheet owns the state and threads it down. All optional;
  // sensible defaults preserve the current Studio look when a parent
  // chooses not to pass them.
  showUsage?: boolean;
  showRefs?: boolean;
  showActions?: boolean;
  showThinking?: boolean;
  showSteps?: boolean;
  showDuration?: boolean;
  assistantBubble?: boolean;
  /** When true (default), the currently-streaming assistant message
   *  is suppressed from the chat until the stream completes — the
   *  full response then appears in one go, in sync with the preview.
   *  When false, response text streams in token-by-token (the legacy
   *  behavior). The Settings Sheet exposes the inverse as a "Stream
   *  response text" Switch, defaulted off so the snappy hold behavior
   *  is the out-of-the-box experience. */
  holdResponseUntilReady?: boolean;
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
/**
 * Read a File as a data URL (base64-encoded). Used to convert
 * paperclip/paste image attachments into a shape the AI SDK can
 * forward to the model — `convertToModelMessages` accepts file
 * parts with either remote URLs or data URLs, and we don't yet
 * have a media bucket so data URLs it is. Rejects on read error
 * so the caller can fall back to text-only.
 */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") resolve(result);
      else reject(new Error("FileReader returned non-string result"));
    };
    reader.onerror = () =>
      reject(reader.error ?? new Error("FileReader error"));
    reader.readAsDataURL(file);
  });
}

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
  selection = null,
  onClearSelection,
  onSourceMutation,
  settingsPanelDocked = false,
  onRequestSettingsDock,
  // Defaults match what Studio used to hard-code before the settings
  // sheet existed: usage + refs on, actions on, bubble on.
  showUsage = true,
  showRefs = true,
  showActions = true,
  // Default off — the chat route doesn't yet emit reasoning or
  // step events (Layer 2 of the thinking/steps work). Flip these
  // on from the Settings Sheet to see the UI surface; once Layer 2
  // lands the data will start to appear automatically.
  showThinking = false,
  showSteps = false,
  // Default ON for Studio so users see "how long did that take" by
  // default. Toggleable from the Sheet for users who'd rather not.
  showDuration = true,
  assistantBubble = true,
  holdResponseUntilReady = true,
  className,
}: StudioChatProps) {
  const [input, setInput] = useState("");
  // Forwarded to <AIChatComposer> so we can focus + position the
  // caret when a template seeds the prompt. The composer owns the
  // underlying <textarea>.
  const composerRef = useRef<HTMLTextAreaElement>(null);
  // <AIChat> auto-scrolls on new messages (when the user is at the
  // bottom). The bespoke ScrollArea + scrollToBottom that lived here
  // before went away with the AIChat migration; if the user has
  // scrolled up to read history, sends no longer fling them back
  // down — that's by design.
  const phrase = useRotatingPhrase();

  // Per-turn wall-clock durations, keyed by assistant message id.
  // State is declared here, but the rising/falling-edge effect that
  // populates it lives further down — it needs `isStreaming` and
  // `messages` from useChat, which are constructed below.
  const [durationsByMessageId, setDurationsByMessageId] = useState<
    Record<string, number>
  >({});
  const turnStartRef = useRef<number | null>(null);

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
  // Selection is mutable per-send: stash it in a ref and snapshot it into the
  // outgoing body at request time. Keeping it out of the transport closure
  // (same reason as settings above — the transport captures once at mount)
  // means flipping selections doesn't re-seat the `Chat` instance.
  const settingsRef = useRef({ settings, systemPrompt });
  settingsRef.current = { settings, systemPrompt };
  const selectionRef = useRef<StudioSelection | null>(selection);
  selectionRef.current = selection;

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
            // The element the user pointed at in the preview (if any). The
            // server stitches this into a system-prompt stanza so the model
            // knows what to modify. Null when nothing is selected.
            selection: selectionRef.current,
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

  // Per-turn duration capture. Rising edge of `isStreaming` records
  // the start timestamp; falling edge stamps the elapsed time onto
  // whichever assistant message is newest. The chatMessages mapping
  // threads `durationsByMessageId[id]` into ChatMessage.duration, and
  // <AIChat> renders it as a "2.3s" pill when `showDuration` is on.
  // Must live below the useChat call — depends on `isStreaming` and
  // `messages` from there.
  const wasStreamingRef = useRef(isStreaming);
  useEffect(() => {
    const wasStreaming = wasStreamingRef.current;
    wasStreamingRef.current = isStreaming;
    if (!wasStreaming && isStreaming) {
      turnStartRef.current = Date.now();
      return;
    }
    if (wasStreaming && !isStreaming && turnStartRef.current !== null) {
      const elapsed = Date.now() - turnStartRef.current;
      turnStartRef.current = null;
      let lastAssistantId: string | null = null;
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === "assistant") {
          lastAssistantId = messages[i].id;
          break;
        }
      }
      if (lastAssistantId) {
        setDurationsByMessageId((prev) => ({
          ...prev,
          [lastAssistantId!]: elapsed,
        }));
      }
    }
  }, [isStreaming, messages]);

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
  //
  // IMPORTANT: we do NOT write `null` upward when the message list has no
  // assistant turn. Historically we did, as a "clear preview on empty chat"
  // convenience — but the chat isn't the only producer of `appSource` any
  // more. The StarterPicker (#45/#46) seeds a reference-layout scaffold or
  // pasted JSX directly into a fresh design's `appSource`, and that design's
  // chat history is empty by construction. Firing `onLatestCode(null)` on
  // mount for those designs wiped the scaffold the instant the preview was
  // supposed to render it (task #47: "editing code on a scaffold-loaded
  // screen gets reset" — same root cause, because /settings-panel edits
  // push the mutated source through `onSourceMutation` but an empty-chat
  // remount used to flatten it back to null). The `onLatestCode(null)` call
  // in handleSend's "new" intent branch still runs — that's the one
  // legitimate path where the chat decides the preview should clear, and
  // it's user-triggered rather than effect-driven.
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
  }, [messages, onLatestCode, isStreaming]);

  // The composer owns its own auto-grow + Enter-to-send. Studio used
  // to manage both inline; both moved when we extracted AIChatComposer.

  /**
   * Build the outgoing user text and ship it via `useChat`'s
   * `sendMessage`. Receives the raw composer payload — the composer
   * already trimmed the text and validated that there's something to
   * send, so we don't re-check here.
   *
   * Attachments (paperclip + clipboard paste, via AIChatComposer)
   * ARE forwarded end-to-end: each File is read as a data URL and
   * shipped as an AI SDK `file` part alongside the text. `/api/chat`
   * allow-lists `text` and `file` parts through `convertToModelMessages`,
   * so any vision-capable model in the catalog (Gemini 2.5/3.5 Flash
   * + Pro, Claude vision, GPT-4o, etc.) sees the image inline. A
   * non-vision model will surface the provider's error in the chat
   * banner rather than silently dropping the attachment.
   *
   * Trade-off: data URLs re-upload the same image on every turn until
   * we land a media bucket. Cheap for the v1 path; revisit when
   * follow-up turns get expensive.
   */
  const handleSend = async (
    text: string,
    attachments?: ChatAttachment[]
  ) => {
    if (isStreaming) return;

    // If the user selected an element in the preview, stamp a short marker
    // into the VISIBLE user text so the chat transcript is self-explanatory
    // ("<button> 'Sign in' ← Request: …"). The actual outerHTML travels out-
    // of-band in the request body (see selectionRef in the transport), where
    // the server glues it onto the system prompt. We deliberately DON'T inline
    // the outerHTML into the user turn — it would pollute the conversation
    // history and get replayed on every subsequent call, hurting cache hits.
    const sel = selectionRef.current;
    const selPrefix = sel
      ? `Selection: <${sel.tag}>${sel.text ? ` "${sel.text}"` : ""}\n\n`
      : "";

    // Inline the current code as modification context whenever the tab has
    // something on screen — scaffold-seeded, paste-seeded, or the product of
    // a prior assistant turn, they're all things-to-iterate-on from the
    // model's perspective. Blank tabs send the prompt as-is so the model
    // treats it as the component brief.
    const outgoing = currentCode
      ? [
          "Here is the current component. Modify it based on the request below.",
          "",
          "```jsx",
          currentCode.trim(),
          "```",
          "",
          selPrefix + "Request: " + text,
        ].join("\n")
      : selPrefix + text;

    if (attachments && attachments.length > 0) {
      // Convert each File to a data URL so the AI SDK can forward it
      // through `convertToModelMessages` to the active vision-capable
      // provider (Gemini, Claude vision, GPT-4o, etc). Data URLs are
      // simpler than blob storage for the v1 path — the trade is that
      // every turn re-uploads the image; we'll switch to remote URLs
      // once a media bucket lands.
      try {
        const fileParts = await Promise.all(
          attachments.map(async (a) => ({
            type: "file" as const,
            mediaType: a.file.type,
            url: await fileToDataUrl(a.file),
          }))
        );
        sendMessage({
          parts: [{ type: "text" as const, text: outgoing }, ...fileParts],
        });
      } catch (err) {
        // If a single attachment fails to read, fall back to a
        // text-only send rather than stranding the user mid-turn.
        // Surface the failure in the console — the user will notice
        // the image didn't make it from the chip strip not clearing.
        console.error(
          "[StudioChat] Failed to read attached images; sending text-only.",
          err
        );
        sendMessage({ text: outgoing });
      }
    } else {
      sendMessage({ text: outgoing });
    }

    // Chip is single-shot: once we've sent, forget the selection so the next
    // turn isn't accidentally pinned to the same element. The parent's state
    // is authoritative; we ask it to clear.
    onClearSelection?.();

    setInput("");
  };

  // Picking a template seeds the input and moves focus into the textarea so
  // the user can tweak the wording before sending (or just hit enter).
  // Templates only surface on truly blank tabs (see the EmptyState gate in
  // the render tree below), so there's no "clear the scaffold first" dance —
  // the absence of `currentCode` is the contract that makes a template
  // prompt the right starting shape.
  const handlePickTemplate = useCallback((template: StudioTemplate) => {
    setInput(template.prompt);
    requestAnimationFrame(() => {
      composerRef.current?.focus();
      const len = template.prompt.length;
      composerRef.current?.setSelectionRange(len, len);
    });
  }, []);

  // Map the AI SDK's UIMessage[] into the DS's ChatMessage[] shape.
  // - User prose has the "Here is the current component …" preamble
  //   peeled back via `displayUserText` so the transcript reads clean.
  // - Assistant prose has code fences stripped (the code is rendered
  //   in the preview column, not the chat bubble).
  // - `usage` and `refs` come from server-stamped metadata.
  // - When an assistant turn produced a jsx/tsx block we surface a
  //   "Rendered in preview →" action chip. It's a passive indicator
  //   today (no onClick), but the slot is in place for future wiring.
  const chatMessages = useMemo<ChatMessage[]>(() => {
    // Find the index of the newest assistant message — needed so we
    // can identify the one that's currently streaming (last assistant
    // + isStreaming === in-progress) and, when
    // `holdResponseUntilReady` is on, suppress it from the chat
    // until the stream completes.
    let lastAssistantIdx = -1;
    for (let i = (messages as UIMessage[]).length - 1; i >= 0; i--) {
      if (messages[i].role === "assistant") {
        lastAssistantIdx = i;
        break;
      }
    }

    const mapped: (ChatMessage | null)[] = (messages as UIMessage[]).map(
      (m, idx) => {
      const raw = textFromParts(m.parts as { type: string; text?: string }[]);
      const isAssistant = m.role === "assistant";
      const isInProgress =
        isAssistant && idx === lastAssistantIdx && isStreaming;
      // Hold the in-progress assistant turn until the stream
      // completes — the chat then snaps to the final response in
      // sync with the preview update, instead of streaming raw
      // tokens past the user. Loading dots below the list +
      // topbar live-elapsed counter keep "something's happening"
      // legible during the wait.
      if (isInProgress && holdResponseUntilReady) return null;
      const content = isAssistant ? stripCodeBlocks(raw) : displayUserText(raw);
      const usage = isAssistant ? usageFromMetadata(m.metadata) : null;
      const refsInfo = isAssistant ? refsFromMetadata(m.metadata) : null;
      // (The "Rendered in preview →" action chip was removed — it
      // restated the tool's whole purpose. `latestJsxBlock` is still
      // imported because the parent page consumes it for the preview
      // update, not for any chip.)

      return {
        id: m.id,
        role: m.role === "user" ? "user" : "assistant",
        content,
        timestamp: new Date(),
        usage: usage
          ? {
              input: usage.inputTokens,
              output: usage.outputTokens,
              total: usage.totalTokens,
            }
          : undefined,
        // Drop refs entirely when the toggle was off (no "0 refs"
        // chip in that case). When the toggle was on we always pass
        // the array — empty renders as "0 refs", populated renders
        // the comma list.
        refs:
          refsInfo && refsInfo.refsIncluded ? refsInfo.refs : undefined,
        duration: durationsByMessageId[m.id],
      };
      }
    );
    return mapped.filter((m): m is ChatMessage => m !== null);
  }, [messages, durationsByMessageId, isStreaming, holdResponseUntilReady]);

  // Header token total — sums input + output + total across every
  // assistant turn. Falls back to `input + output` when a provider
  // didn't return a `totalTokens` value. Hidden in the header when
  // no assistant turn has reported usage yet.
  const sessionTokens = useMemo<number | undefined>(() => {
    let inp = 0;
    let out = 0;
    let total = 0;
    let seen = false;
    for (const m of messages as UIMessage[]) {
      if (m.role !== "assistant") continue;
      const u = usageFromMetadata(m.metadata);
      if (!u) continue;
      seen = true;
      if (typeof u.inputTokens === "number") inp += u.inputTokens;
      if (typeof u.outputTokens === "number") out += u.outputTokens;
      if (typeof u.totalTokens === "number") total += u.totalTokens;
    }
    if (!seen) return undefined;
    return total || inp + out;
  }, [messages]);

  // Show the loading-dots indicator for the WHOLE stream, not just
  // pre-first-token. The dots render below the most recent message,
  // so during streaming they read as "more is coming" — without
  // them, the chat goes visibly silent once a few tokens land,
  // which felt dead during long turns. Named distinct from the
  // `showThinking` prop (which controls per-message reasoning
  // disclosures) so the two don't shadow each other.
  const showLoadingIndicator = isStreaming;

  return (
    // The whole panel is now <AIChat> from the DS. Studio supplies:
    //  - title + icon + headerTokens (running session total)
    //  - mapped chatMessages with usage / refs / per-turn actions
    //  - showUsage + showRefs flip the developer-transparency strips on
    //    (these will become user-toggleable from Studio's settings panel
    //    rather than always-on as they are today)
    //  - the empty state (StudioTemplate cards) when truly blank
    //  - the error banner via errorSlot
    //  - SelectionChip + SelectionInspector via composerAboveSlot
    //  - the composer itself (with maxLength + paste + Stop) via composerSlot
    //  - the disclaimer + char counter via composerBelowSlot
    <AIChat
      title="Ask Grade AI"
      headerTokens={sessionTokens}
      messages={chatMessages}
      isLoading={showLoadingIndicator}
      thinkingPhrase={`${phrase}…`}
      showUsage={showUsage}
      showRefs={showRefs}
      showActions={showActions}
      showThinking={showThinking}
      showSteps={showSteps}
      showDuration={showDuration}
      assistantBubble={assistantBubble}
      className={cn("h-full", className)}
      emptyStateSlot={
        messages.length === 0 && !currentCode ? (
          <EmptyState templates={templates} onPick={handlePickTemplate} />
        ) : null
      }
      errorSlot={
        error ? (
          <ErrorBanner
            error={error}
            provider={settings.provider}
            model={settings.model}
            onDismiss={() => setMessages(messages)}
          />
        ) : null
      }
      composerAboveSlot={
        <>
          {selection && (
            <SelectionChip
              selection={selection}
              onDismiss={() => onClearSelection?.()}
            />
          )}
          {selection?.componentName && !settingsPanelDocked && (
            <SelectionInspector
              selection={selection}
              appSource={currentCode}
              onSourceChange={(next) => onSourceMutation?.(next)}
              onRequestDock={onRequestSettingsDock}
            />
          )}
        </>
      }
      composerSlot={
        <AIChatComposer
          ref={composerRef}
          value={input}
          onChange={(next) => {
            // Belt-and-braces: <textarea maxLength> already blocks typing
            // past the limit, but a paste event can deliver more chars in
            // one go — slice here so the state never exceeds the limit.
            setInput(
              next.length > INPUT_CHAR_LIMIT
                ? next.slice(0, INPUT_CHAR_LIMIT)
                : next
            );
          }}
          onSend={handleSend}
          isLoading={isStreaming}
          onStop={() => stop()}
          placeholder={
            currentCode
              ? "Describe a change — e.g. 'make the button pill-shaped'"
              : "Describe a UI…"
          }
          maxLength={INPUT_CHAR_LIMIT}
          showHint={false}
        />
      }
      composerBelowSlot={
        <InputFooter charCount={input.length} limit={INPUT_CHAR_LIMIT} />
      }
    />
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
 * Little pill that shows the element the user picked in the preview's select
 * mode.
 *
 * Label strategy — two tiers, depending on whether the click landed inside a
 * DS component boundary:
 *
 *   1. **DS component hit** (`selection.componentName` is set) — show the
 *      component identifier in a bolder treatment: `◎ <ThreeScene> ×`. This
 *      is the common case once the DS is in full swing; the user nearly
 *      always means "edit THIS component", not "edit this internal div".
 *   2. **Bare DOM element** (no component name) — fall back to the tag
 *      plus trimmed innerText: `◎ <button> "Sign in" ×`. Preserves the
 *      pre-part behaviour for components that don't yet emit
 *      `data-gds-part`, and for any ad-hoc JSX the model produced.
 *
 * Never shows the raw outerHTML here — that's the model's concern, not the
 * user's. It rides through in the request body only.
 */
// SelectionChip moved to ./selection-chip.tsx — single canonical
// component shared across canvas toolbar + chat composer. See the
// docstring there for the rationale (three bespoke pills before
// the unification).


