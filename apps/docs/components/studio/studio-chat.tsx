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
import { X, MousePointerClick } from "lucide-react";
import { GradeMark } from "@/components/grade-mark";
import { cn } from "@/lib/utils";
import type { ChatSettings } from "@/components/ai-elements/provider-picker";
import { STUDIO_TEMPLATES, type StudioTemplate } from "@/lib/studio-templates";
import { humanizeChatError } from "@/lib/chat-error";
import { stripSourceIds, type StudioSelection } from "@/lib/chat-sandpack";
import { transform as sucraseTransform } from "sucrase";
import { useRotatingPhrase } from "@/lib/studio-loading-phrases";
import { completePartialJsx } from "@/lib/studio-stream-draft";
import {
  extractEditBlocks,
  applyEditTurn,
} from "@/lib/studio-edit-blocks";
import { EDIT_MODE_PROMPT, MOTION_GUIDE } from "@gradeui/studio/playbook";
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
  /** Speculative live-preview channel. While a response streams (and
   *  `holdResponseUntilReady` is off), fires with an auto-closed draft
   *  of the still-open ```jsx fence so the preview can attempt a silent
   *  compile and draw the app as tokens arrive. Fires with `null` once
   *  the stream settles (the sealed source then arrives via
   *  `onLatestCode`). Never feeds undo history or persistence — drafts
   *  are render-only. */
  onDraftCode?: (code: string | null) => void;
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
 * Pull the model's reasoning ("thinking") out of a UIMessage's parts.
 * Reasoning parts stream in as `{ type: "reasoning", text }` when the
 * server enables emission (Gemini `includeThoughts`, Claude extended
 * thinking) or when the model emits it unconditionally (gpt-oss,
 * DeepSeek R1). Joined with blank lines — Gemini ships summaries as
 * multiple parts. Empty string when the turn carried no reasoning.
 */
function reasoningFromParts(
  parts: { type: string; text?: string }[] | undefined
): string {
  if (!parts) return "";
  return parts
    .filter((p) => p.type === "reasoning" && typeof p.text === "string")
    .map((p) => (p.text as string).trim())
    .filter(Boolean)
    .join("\n\n");
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
  // (?!-) keeps ```jsx-edit fences (STUDIO-EDITS blocks) out of this
  // matcher — without it, "jsx-edit" parses as tag "jsx" with "-edit"
  // leaking into the capture, and an edit turn would feed SEARCH/REPLACE
  // markers to the compiler as app source.
  const fence = opts.sealedOnly
    ? /```(?:jsx|tsx)(?!-)\s*\n?([\s\S]*?)```/g
    : /```(?:jsx|tsx)(?!-)\s*\n?([\s\S]*?)(?:```|$)/g;
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

/**
 * Syntax gate for edit-turn folds. A mis-anchored apply (model
 * renumbered attributes, paraphrased an edge line, etc.) can produce
 * structurally invalid JSX — committing that corrupts the durable
 * source and strands the preview on the failure panel. Run the same
 * sucrase transform Fast Frame compiles with; if it throws, the fold
 * is rejected and the turn is surfaced as failed (retry-as-regen chip)
 * instead of committed.
 */
function compilesCleanly(src: string): boolean {
  try {
    sucraseTransform(src, {
      transforms: ["jsx", "typescript", "imports"],
      jsxRuntime: "automatic",
      production: true,
      filePath: "/App.tsx",
    });
    return true;
  } catch {
    return false;
  }
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
  onDraftCode,
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
  const settingsRef = useRef({ settings, systemPrompt, showThinking });
  settingsRef.current = { settings, systemPrompt, showThinking };
  const selectionRef = useRef<StudioSelection | null>(selection);
  selectionRef.current = selection;
  // One-shot escape hatch: the edit-failure chip's "Retry as full
  // regenerate" sets this so the NEXT send skips edit mode (no
  // EDIT_MODE_PROMPT stanza → the model regenerates the whole
  // component). Consumed at request time.
  const forceFullRegenOnceRef = useRef(false);

  const transportRef = useRef<DefaultChatTransport<UIMessage>>(undefined);
  if (!transportRef.current) {
    transportRef.current = new DefaultChatTransport<UIMessage>({
      api: "/api/chat",
      prepareSendMessagesRequest: ({ id, messages, trigger, messageId }) => {
        const {
          settings: s,
          systemPrompt: sp,
          showThinking: thinkingOn,
        } = settingsRef.current;
        // EDIT MODE — iteration turns (current code on screen) switch
        // the model from full regeneration to anchored SEARCH/REPLACE
        // edit blocks (STUDIO-EDITS.md). Output shrinks from O(page)
        // to O(change). The retry-as-regen chip can force one full
        // regeneration via forceFullRegenOnceRef.
        const editMode =
          Boolean(
            currentCodeRef.current && currentCodeRef.current.trim() !== ""
          ) && !forceFullRegenOnceRef.current;
        forceFullRegenOnceRef.current = false;
        // MOTION GUIDE — same conditional-stanza pattern as edit mode,
        // keyed on content instead of turn shape: when the design on
        // screen is a Grade Motion (the source contains "<Motion"), the
        // model gets the Motion authoring guardrails (scene grammar,
        // the camera-belongs-to-the-screen rule, the completion
        // contract, pacing). New Motions are seeded with the Motion
        // starter, so fresh-build turns on a Motion design qualify too.
        // Ordinary screen turns never pay the tokens.
        const motionMode = Boolean(
          currentCodeRef.current && currentCodeRef.current.includes("<Motion")
        );
        let finalSystemPrompt = sp;
        if (motionMode) finalSystemPrompt += `\n\n${MOTION_GUIDE}`;
        if (editMode) finalSystemPrompt += `\n\n${EDIT_MODE_PROMPT}`;
        return {
          body: {
            id,
            messages,
            trigger,
            messageId,
            provider: s.provider,
            model: s.model,
            apiKey: s.apiKey || undefined,
            systemPrompt: finalSystemPrompt,
            // Server-side observability hook (STUDIO-EDITS X2) — the
            // route ignores it today.
            editMode,
            // Mirror the user's toggle through to the server. When false, the
            // chat route skips the component-reference block entirely —
            // saving tokens at the cost of the model occasionally guessing
            // prop names.
            includeComponentRefs: s.includeComponentRefs,
            // The element the user pointed at in the preview (if any). The
            // server stitches this into a system-prompt stanza so the model
            // knows what to modify. Null when nothing is selected.
            selection: selectionRef.current,
            // Ask the provider to EMIT reasoning only while the user's
            // "Show thinking" toggle is on — Anthropic bills thinking
            // tokens, so off must mean off. Gemini free tier supports
            // this (thought summaries via includeThoughts).
            requestReasoning: thinkingOn,
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
  // Did the CURRENT turn start with code already on screen? Drafts
  // (speculative live renders) are only worth it on a FRESH build —
  // an iteration regenerates the whole component, so live-drawing it
  // would visibly collapse the finished page to a half-page draft and
  // rebuild it top-down for one small change. Iteration turns hold the
  // existing render and snap when the sealed fence lands. Defaults to
  // true (= no drafts) so a remount mid-stream errs on the calm side;
  // the rising edge below stamps the real answer per turn.
  const turnStartedWithCodeRef = useRef(true);
  // Snapshot of the source at the moment the turn began — edit blocks
  // anchor against THIS, not against whatever intermediate state the
  // streaming applies produced, so block 3 always folds onto the same
  // document blocks 1–2 did (and a user's mid-turn Code-view edit
  // can't shear the anchors).
  const turnBaseSourceRef = useRef<string | null>(null);
  // How many sealed edit blocks this turn has already live-applied —
  // lets the streaming effect fold only when a NEW block seals.
  const appliedEditCountRef = useRef(0);
  useEffect(() => {
    const wasStreaming = wasStreamingRef.current;
    wasStreamingRef.current = isStreaming;
    if (!wasStreaming && isStreaming) {
      turnStartRef.current = Date.now();
      turnStartedWithCodeRef.current = Boolean(
        currentCodeRef.current && currentCodeRef.current.trim() !== ""
      );
      // Strip runtime source-id artifacts from the anchor base — the
      // model's context is stripped the same way at send time, so the
      // anchors line up even when a legacy screen still carries ids.
      turnBaseSourceRef.current = currentCodeRef.current
        ? stripSourceIds(currentCodeRef.current)
        : null;
      appliedEditCountRef.current = 0;
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
  // Has this chat instance settled once since (re)mount? StudioChat is
  // keyed `chat-${activeId}` and only mounts in screen view, so leaving to
  // the grid unmounts it and re-entering remounts it fresh. The id of the
  // last assistant message we've ALREADY applied to the preview — so a
  // re-render / re-hydration of the same message doesn't re-emit.
  const hydratedRef = useRef(false);
  const lastEmittedAssistantIdRef = useRef<string | null>(null);
  // Read currentCode through a ref so a manual edit (which changes
  // currentCode) doesn't re-run this effect — it's only consulted on the
  // first settle after mount.
  const currentCodeRef = useRef(currentCode);
  useEffect(() => {
    currentCodeRef.current = currentCode;
  }, [currentCode]);

  // Speculative-draft channel. Callback rides a ref (parent identity
  // churn shouldn't re-run the big effect below); `draftActiveRef`
  // guards the clear so we only emit `null` when a draft was actually
  // outstanding — otherwise every post-stream settle render would
  // setState the parent with a fresh map for no reason.
  const onDraftCodeRef = useRef(onDraftCode);
  useEffect(() => {
    onDraftCodeRef.current = onDraftCode;
  }, [onDraftCode]);
  const draftActiveRef = useRef(false);
  // Time-gate draft emission. The useChat throttle already caps UI
  // updates at ~20/s, but every draft is a full sandbox compile +
  // remount — at 20/s that's churn for no visual gain. 4/s reads
  // just as live and quarters the work (the double-buffered swap in
  // the sandbox hides the remounts either way).
  const lastDraftEmitAtRef = useRef(0);
  const emitDraft = (draft: string | null, opts?: { force?: boolean }) => {
    if (draft === null && !draftActiveRef.current) return;
    if (draft !== null && !opts?.force) {
      const now = Date.now();
      if (now - lastDraftEmitAtRef.current < 250) return;
      lastDraftEmitAtRef.current = now;
    }
    draftActiveRef.current = draft !== null;
    onDraftCodeRef.current?.(draft);
  };

  // Per-message edit-turn outcomes — drives the "⚡ N edits" /
  // "N of M edits applied" chip on the assistant message (and the
  // retry-as-regen affordance when some blocks missed their anchors).
  const [editResultsByMessageId, setEditResultsByMessageId] = useState<
    Record<string, { applied: number; failed: number }>
  >({});
  // Which assistant message's edit turn has been durably committed —
  // the settle path must fold exactly once per turn (re-renders and
  // remount hydrations must not re-apply).
  const settledEditMsgIdRef = useRef<string | null>(null);

  useEffect(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role !== "assistant") continue;
      const text = textFromParts(msg.parts as any);
      const code = latestJsxBlock(text, { sealedOnly: isStreaming });

      // ── Edit turns (STUDIO-EDITS) ─────────────────────────────────
      // The model answered with anchored SEARCH/REPLACE blocks instead
      // of a full fence. Streaming: each block live-applies the moment
      // it seals, morphing the preview through the draft lane (the
      // double-buffered swap repaints only the changed pixels because
      // the rest of the source is byte-identical). Settle: one durable
      // fold from the turn's base source → one undo snapshot, one
      // persistence write, plus the per-turn chip data.
      const editScan = extractEditBlocks(text, { sealedOnly: true });
      if (editScan.sawEditFence && !code) {
        const base = turnBaseSourceRef.current ?? currentCodeRef.current;
        if (isStreaming) {
          if (
            base &&
            !holdResponseUntilReady &&
            editScan.blocks.length > appliedEditCountRef.current
          ) {
            appliedEditCountRef.current = editScan.blocks.length;
            const folded = applyEditTurn(base, editScan.blocks);
            // Blocks seal rarely (once per edit, not per token) —
            // bypass the draft time-gate so each lands instantly.
            // Syntax-gated: a mis-anchored fold must never reach the
            // preview, even speculatively.
            if (folded.applied.length > 0 && compilesCleanly(folded.next))
              emitDraft(folded.next, { force: true });
          }
          lastEmittedAssistantIdRef.current = msg.id;
          hydratedRef.current = true;
          return;
        }
        // Settled edit turn.
        emitDraft(null);
        if (!hydratedRef.current) {
          // Remount hydration — the fold is already baked into the
          // durable source; never re-apply.
          hydratedRef.current = true;
          lastEmittedAssistantIdRef.current = msg.id;
          settledEditMsgIdRef.current = msg.id;
          return;
        }
        if (settledEditMsgIdRef.current !== msg.id) {
          settledEditMsgIdRef.current = msg.id;
          lastEmittedAssistantIdRef.current = msg.id;
          if (base) {
            const folded = applyEditTurn(base, editScan.blocks);
            // Syntax gate — the fold only commits if the RESULT
            // compiles. A mis-anchored apply that produces broken JSX
            // is treated as a wholly failed turn (chip + retry) and
            // the previous source stays untouched. This is what keeps
            // a bad edit from corrupting the durable appSource.
            const sound =
              folded.applied.length > 0 && compilesCleanly(folded.next);
            if (sound) onLatestCode(folded.next);
            setEditResultsByMessageId((prev) => ({
              ...prev,
              [msg.id]: sound
                ? {
                    applied: folded.applied.length,
                    failed: folded.failed.length,
                  }
                : { applied: 0, failed: editScan.blocks.length },
            }));
          }
        }
        return;
      }

      // Live generation — always flow sealed blocks through so the
      // preview updates as the model streams. Don't clobber a good
      // preview with an unsealed block (let the old render stay up).
      if (isStreaming) {
        if (code) {
          // A sealed fence supersedes any outstanding draft.
          emitDraft(null);
          onLatestCode(code);
        } else if (
          !holdResponseUntilReady &&
          // Fresh builds only. Full-regen iterations would live-draw a
          // collapse of the finished page to a half-page partial for
          // one small change — those turns keep the current render up
          // and snap on the sealed fence. (Edit turns get their own
          // live lane above.)
          !turnStartedWithCodeRef.current
        ) {
          // Speculative live render — auto-close the still-open fence
          // and let Fast Frame attempt a silent compile, so the app
          // draws top-down as tokens arrive. Gated on the same toggle
          // as text streaming ("Stream response text"): hold-mode users
          // keep the one-snap reveal.
          const partial = latestJsxBlock(text, { sealedOnly: false });
          const draft = partial ? completePartialJsx(partial) : null;
          if (draft) emitDraft(draft);
        }
        lastEmittedAssistantIdRef.current = msg.id;
        hydratedRef.current = true;
        return;
      }

      // Stream settled — retire any outstanding draft; the sealed
      // source takes over through onLatestCode below.
      emitDraft(null);

      // FIRST settle after (re)mount. This assistant message is already
      // baked into the durable `currentCode` (appSource) — PLUS any manual
      // text / padding / code edits the user layered on top of it. Record
      // it as the baseline and DO NOT emit: re-deriving the preview from
      // chat here is exactly what wiped manual edits when the user left the
      // screen and came back (the chat remounts and replays its last
      // message over the durable source). Only fall back to chat when there
      // is no durable source to show (recover an empty preview).
      if (!hydratedRef.current) {
        hydratedRef.current = true;
        lastEmittedAssistantIdRef.current = msg.id;
        const durable = currentCodeRef.current;
        if (!durable || durable.trim() === "") onLatestCode(code);
        return;
      }

      // Post-hydration: only a genuinely NEW assistant message (a fresh
      // generation) replaces the source. A re-render of the same last
      // message is a no-op, so manual edits survive.
      if (msg.id !== lastEmittedAssistantIdRef.current) {
        onLatestCode(code);
        lastEmittedAssistantIdRef.current = msg.id;
      }
      return;
    }
    // No assistant message at all (fresh design, user-only history) —
    // mark hydrated so the first real generation isn't mistaken for a
    // mount-time replay.
    hydratedRef.current = true;
    // emitDraft is stable by construction (refs only); deliberately not a dep.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, onLatestCode, isStreaming, holdResponseUntilReady]);

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
    // stripSourceIds: the inlined context must never carry the runtime
    // `data-gds-source-id` attributes — the model copies them back into
    // its output (polluting the stored source), renumbers them on edit
    // turns (shearing SEARCH anchors), and they cost ~10 tokens per
    // node, every turn, for nothing.
    const outgoing = currentCode
      ? [
          "Here is the current component. Modify it based on the request below.",
          "",
          "```jsx",
          stripSourceIds(currentCode).trim(),
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
  // Re-send the user's last request with edit mode forced OFF — the
  // failure chip's escape hatch when blocks miss their anchors. Reads
  // the clean request text back out of the last user turn (preamble
  // stripped) and routes it through handleSend so the current source
  // rides along as usual. Plain function (not memoized) so it always
  // closes over the freshest handleSend/messages.
  const retryAsFullRegen = () => {
    if (isStreaming) return;
    for (let i = (messages as UIMessage[]).length - 1; i >= 0; i--) {
      if (messages[i].role !== "user") continue;
      const raw = textFromParts(
        messages[i].parts as { type: string; text?: string }[]
      );
      const request = displayUserText(raw);
      if (request) {
        forceFullRegenOnceRef.current = true;
        void handleSend(request);
      }
      return;
    }
  };

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
      const thinking = isAssistant
        ? reasoningFromParts(m.parts as { type: string; text?: string }[])
        : "";
      // Hold the in-progress assistant turn until the stream
      // completes — the chat then snaps to the final response in
      // sync with the preview update, instead of streaming raw
      // tokens past the user. Loading dots below the list +
      // topbar live-elapsed counter keep "something's happening"
      // legible during the wait.
      //
      // EXCEPTION: reasoning. Thoughts are the "what's happening"
      // signal — holding them defeats their purpose. When the
      // in-progress turn carries thinking, emit a thinking-only
      // message (no prose, no meta) so the disclosure streams live;
      // the full response replaces it under the same id on settle.
      if (isInProgress && holdResponseUntilReady) {
        if (!thinking) return null;
        return {
          id: m.id,
          role: "assistant",
          content: "",
          thinking,
          thinkingStreaming: true,
          timestamp: new Date(),
        };
      }
      const content = isAssistant ? stripCodeBlocks(raw) : displayUserText(raw);
      const usage = isAssistant ? usageFromMetadata(m.metadata) : null;
      const refsInfo = isAssistant ? refsFromMetadata(m.metadata) : null;
      // Edit-turn chip — "⚡ 3 edits applied" (or the honest partial
      // "2 of 3 edits applied" + a retry-as-regen escape hatch when
      // blocks missed their anchors). Only present on edit turns.
      const editInfo = isAssistant
        ? editResultsByMessageId[m.id]
        : undefined;
      const editActions =
        editInfo !== undefined
          ? [
              {
                id: "edits-applied",
                label:
                  editInfo.failed > 0
                    ? `⚡ ${editInfo.applied} of ${
                        editInfo.applied + editInfo.failed
                      } edits applied`
                    : `⚡ ${editInfo.applied} ${
                        editInfo.applied === 1 ? "edit" : "edits"
                      } applied`,
              },
              ...(editInfo.failed > 0
                ? [
                    {
                      id: "retry-full-regen",
                      label: "Retry as full regenerate",
                      onClick: retryAsFullRegen,
                    },
                  ]
                : []),
            ]
          : undefined;

      return {
        id: m.id,
        role: m.role === "user" ? "user" : "assistant",
        content,
        // Model-emitted reasoning. AIChat renders the "Thoughts"
        // disclosure when `showThinking` is on — auto-expanded and
        // streaming live while the turn is in progress, collapsed
        // once it settles.
        thinking: thinking || undefined,
        thinkingStreaming: isInProgress || undefined,
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
        actions: editActions,
        duration: durationsByMessageId[m.id],
      };
      }
    );
    return mapped.filter((m): m is ChatMessage => m !== null);
    // retryAsFullRegen is deliberately not a dep — it's a fresh
    // closure each render; the memo re-evaluates on `messages` anyway.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    messages,
    durationsByMessageId,
    isStreaming,
    holdResponseUntilReady,
    editResultsByMessageId,
  ]);

  // (The header session-token total went away with the chat header —
  // per-message usage strips carry the numbers now.)

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
      // Headerless + frameless — Studio's shell owns the panel surface
      // (flat full-height column, rail-to-canvas) and the rail already
      // brands the app, so the "Ask Grade AI" strip was dead weight.
      // Session token totals live in the per-message usage strips.
      title={null}
      bare
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
        ) : messages.length === 0 && currentCode?.includes("<Motion") ? (
          // Motion-aware hints — a fresh Motion has code (the starter)
          // but no conversation; teach the moves instead of the blank
          // "how can I help".
          <MotionHints
            onPick={(prompt) => handlePickTemplate({ prompt } as StudioTemplate)}
          />
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
        <GradeMark className="h-7 w-7 text-foreground mb-2.5" />
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
 * Motion-aware empty state — prompt chips that teach the Motion moves.
 * Shown when the focused design is a Motion with no chat history yet.
 * Chips PREFILL the composer (same pattern as starter templates) so the
 * user can tweak the wording before sending.
 */
const MOTION_HINTS: { label: string; prompt: string }[] = [
  {
    label: "Add a stat scene",
    prompt:
      'Add a scene after the opening with a stat template — heading "4.2×", text "faster to ship".',
  },
  {
    label: "Slow mask wipe",
    prompt:
      "Make the closing scene arrive with a slow circular wipe (transition wipe-circle, about 1200ms).",
  },
  {
    label: "Film-level ticker",
    prompt:
      'Add a film-level ticker along the bottom that runs across every scene: "Grade Motion — live, themeable, yours".',
  },
  {
    label: "Broadcast lower-third",
    prompt:
      "Add a TV-style broadcast lower-third to the demo scene with my name and role.",
  },
  {
    label: "Mobile + desktop duo",
    prompt:
      "Add a scene showing the same product on a mobile and a desktop screen side by side, each with its own camera tour.",
  },
  {
    label: "Retheme the fills",
    prompt:
      "Recolour the scene fills to use my theme tokens (primary/background gradients) so the film re-themes with the project.",
  },
];

function MotionHints({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-start py-2"
      >
        <GradeMark className="h-7 w-7 text-foreground mb-2.5" />
        <h3 className="text-sm font-semibold text-foreground mb-0.5">
          Direct it
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          This is a Motion — ask for scenes, cuts, cameras, and overlays.
        </p>
        <div className="grid grid-cols-2 gap-1.5 w-full">
          {MOTION_HINTS.map((h) => (
            <button
              key={h.label}
              type="button"
              onClick={() => onPick(h.prompt)}
              title={h.prompt}
              className={cn(
                "rounded-md border border-border bg-card px-2.5 py-2",
                "text-left text-xs font-medium text-foreground",
                "hover:border-primary/40 hover:bg-muted transition-colors",
              )}
            >
              {h.label}
            </button>
          ))}
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


