"use client";

import * as React from "react";
import {
  LexicalComposer as LexicalRoot,
  type InitialConfigType,
} from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { PlainTextPlugin } from "@lexical/react/LexicalPlainTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  HeadingNode,
  QuoteNode,
  $createHeadingNode,
  $createQuoteNode,
  type HeadingTagType,
} from "@lexical/rich-text";
import {
  ListNode,
  ListItemNode,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from "@lexical/list";
import { LinkNode, AutoLinkNode } from "@lexical/link";
import { CodeNode, CodeHighlightNode } from "@lexical/code";
import { $setBlocksType } from "@lexical/selection";
import { mergeRegister } from "@lexical/utils";
import {
  $getRoot,
  $getSelection,
  $createParagraphNode,
  $createTextNode,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  KEY_ENTER_COMMAND,
  CLEAR_EDITOR_COMMAND,
  COMMAND_PRIORITY_HIGH,
  type TextFormatType,
  type LexicalEditor,
  type LexicalNode,
  type TextNode,
} from "lexical";
import {
  BeautifulMentionsPlugin,
  BeautifulMentionNode,
  $createBeautifulMentionNode,
  type BeautifulMentionsItem,
} from "lexical-beautiful-mentions";
import { AnimatePresence, motion } from "motion/react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code as CodeIcon,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  List as ListIcon,
  ListOrdered,
  Paperclip,
  Send,
  Square,
  X,
} from "lucide-react";
import {
  useScriptedDemo,
  BlinkingCursor,
  sleep,
  typeText,
  type DemoSpeed,
  type DemoTrigger,
} from "@/lib/demo";
import { cn } from "@/lib/utils";

/**
 * Composer — the generic text composition surface for the design system.
 *
 * The answer wherever a user is composing a message: AI chat input,
 * comment thread reply, post-body editor, future copilot panels.
 * Replaces the textarea-with-buttons pattern that hosts kept rolling
 * by hand.
 *
 * Built on Lexical (Meta's React-first editor framework) so it can do:
 *   - rich text formatting (B / I / U / S / code, headings, blockquote,
 *     pullquote, lists)
 *   - mentions and slash commands via lexical-beautiful-mentions, with
 *     a typeahead popover and theme-able tokens
 *   - image attachments (paperclip + clipboard paste) when opted in
 *   - scripted demo playback for marketing surfaces (types text, opens
 *     mention popovers, applies formatting, all via the same step
 *     vocabulary as <Code>)
 *
 * Slot-based composition for the action row: hosts that need custom
 * affordances (template picker, voice button, attach-document) pass
 * `leftActions` / `rightActions`. Default Send / Stop / paperclip
 * render only when the host hasn't replaced the slot.
 *
 * Hosts that want the canned "chat composer with paperclip + send"
 * preset should reach for `<AIChatComposer>` instead, which configures
 * this Composer with the right slots wired up.
 *
 * Scripted demos: same `speed` / `trigger` / `play` / `loop` vocabulary
 * as `<Code>`, sharing the underlying `useScriptedDemo` hook from
 * `lib/demo/`. The Composer adds its own verbs (`mention`, `format`,
 * `select`, `submit`) on top of the universal `type` / `wait` / `clear`.
 */

// ─── Public types ────────────────────────────────────────────────────

export type ComposerFormat =
  | "bold"
  | "italic"
  | "underline"
  | "strikethrough"
  | "code"
  | "h1"
  | "h2"
  | "h3"
  | "blockquote"
  | "pullquote"
  | "ul"
  | "ol";

export interface ComposerMentionItem {
  id: string;
  /** Display value (without the trigger char). */
  value: string;
  /** Optional secondary label shown in the suggester. */
  label?: string;
  /** Avatar URL or initials for the suggester row. */
  avatar?: string;
  /** Arbitrary payload the host can attach to the mention. */
  data?: Record<string, unknown>;
}

export interface ComposerTriggerConfig {
  /** The trigger character, eg. "@" or "/". */
  char: string;
  /**
   * Items to populate the suggester. Either a static array or a
   * resolver function (sync or async) that receives the typed query.
   * The plugin filters automatically when items is an array.
   */
  items:
    | ComposerMentionItem[]
    | ((query: string) => ComposerMentionItem[] | Promise<ComposerMentionItem[]>);
  /**
   * Whether to strip the trigger char on insert. Defaults: keep for
   * "@" (mentions read as "@alice"), strip for "/" (commands read as
   * "Insert image" not "/insert-image").
   */
  stripTrigger?: boolean;
}

export interface ComposerAttachmentConfig {
  /** Master enable. Set true on the prop to use defaults, or pass a config object. */
  enabled?: boolean;
  /** HTML accept attribute on the file input. Default "image/*". */
  accept?: string;
  /** Max number of attachments. Default 10. */
  maxItems?: number;
  /** Allow multiple selection in the file picker. Default true. */
  multiple?: boolean;
}

export interface ComposerAttachment {
  id: string;
  file: File;
  /** Object URL owned by the composer. Hosts must NOT revoke it. */
  previewUrl: string;
  name: string;
}

export interface ComposerContent {
  /** Plain text representation of the editor contents (whitespace preserved). */
  text: string;
  /** Lexical editor state serialised to JSON (for round-trip persistence). */
  json: string;
  /** Resolved mention tokens in document order. */
  mentions: Array<{ trigger: string; value: string; data?: Record<string, unknown> }>;
}

export interface ComposerHandle {
  /** Run a demo script imperatively (vs. via `steps` + `trigger="manual"`). */
  play: (steps: ComposerStep[]) => void;
  /** Cancel an in-flight demo. Idempotent. */
  stop: () => void;
  /**
   * One-shot replay of the configured `steps`. Cancels any in-flight
   * run, clears the editor, replays from step 0. Pass a delay (ms) to
   * schedule the replay (useful for chaining demos). Requires `steps`
   * to be configured.
   */
  restart: (delayMs?: number) => void;
  /** Move focus into the editor. */
  focus: () => void;
  /** Wipe the editor. */
  clear: () => void;
  /** Insert plain text at the current selection. */
  insert: (text: string) => void;
  /** Snapshot the current content + mentions. */
  getContent: () => ComposerContent;
  /** Direct access to the underlying Lexical editor (escape hatch). */
  getEditor: () => LexicalEditor | null;
}

/**
 * Demo step vocabulary for Composer scripts. Shares `type` / `wait` /
 * `clear` with the universal `lib/demo` verbs; adds composer-specific
 * `mention`, `format`, `select`, `newline`, `submit` on top.
 */
export type ComposerStep =
  | { type: "type"; text: string; speed?: DemoSpeed }
  | { type: "wait"; ms: number }
  | { type: "clear" }
  | { type: "newline" }
  | { type: "submit" }
  | {
      type: "mention";
      /** Trigger char (must match a registered ComposerTriggerConfig.char). */
      trigger: string;
      /** Value to insert (without the trigger). Looks up the matching item by `value`. */
      value: string;
      /** Optional pre-typed query — the demo types this after the trigger char before "selecting" the value, to show the typeahead in action. */
      query?: string;
    }
  | { type: "format"; format: ComposerFormat }
  | {
      type: "select";
      /** Substring to find and select. First match wins. */
      text: string;
    };

export interface ComposerProps {
  /** Placeholder copy shown when empty. */
  placeholder?: string;
  /** Initial plain text content. For richer initial state, use `initialJson`. */
  initialText?: string;
  /** Initial Lexical state JSON (from a previous `onSubmit` round-trip). */
  initialJson?: string;
  /**
   * Available formats. Pass false to disable rich text entirely
   * (plain text mode, half the bundle weight, no toolbar). Default
   * enables a sensible set for most chat / comment surfaces.
   */
  formats?: ComposerFormat[] | false;
  /**
   * Render the formatting toolbar. Default false because most uses
   * are short-form. Set true (or "top") to show the toolbar above the
   * editor. "floating" is planned; not yet implemented.
   */
  toolbar?: boolean | "top";
  /**
   * Mention / slash command configs. Each entry registers one trigger
   * char and its items. Pass `[{ char: "@", items: people }, { char: "/", items: commands }]`
   * for the common chat-app setup.
   */
  triggers?: ComposerTriggerConfig[];
  /**
   * Image attachments (paperclip + clipboard paste). Pass true for
   * defaults, an object to customise, or omit/false to skip the
   * attachment plumbing entirely.
   */
  attachments?: boolean | ComposerAttachmentConfig;
  /** Fires when the user submits (Enter, click Send, or scripted `submit` step). */
  onSubmit?: (content: ComposerContent, attachments?: ComposerAttachment[]) => void;
  /**
   * Fires on every editor change with the current plain text. Use for
   * length validation, controlled-value bridges (eg. AIChatComposer
   * forwarding to a host's `value`/`onChange` pair), or live preview
   * surfaces. Cheap, called frequently; debounce if you need the
   * Lexical state JSON (use `getContent()` via ref instead).
   */
  onChange?: (text: string) => void;
  /**
   * Loading state — disables the editor + paperclip and swaps the
   * default Send button for Stop. Has no effect when `rightActions`
   * overrides the default Send.
   */
  isLoading?: boolean;
  /** Stop handler — required for Stop to be active when loading. */
  onStop?: () => void;
  /** Hard character cap. */
  maxLength?: number;
  /** Auto-focus the editor on mount. Default false. */
  autoFocus?: boolean;
  /** Whether Enter submits. Default true (Shift-Enter still inserts a newline). */
  submitOnEnter?: boolean;
  /**
   * Custom content for the left action slot. Replaces the default
   * paperclip button when `attachments` is enabled.
   */
  leftActions?: React.ReactNode;
  /**
   * Custom content for the right action slot. Replaces the default
   * Send / Stop button. Use the `useComposer()` hook inside to access
   * imperative methods.
   */
  rightActions?: React.ReactNode;
  /** Hide the default Send button without replacing it. */
  hideSend?: boolean;
  /** Scripted demo steps. */
  steps?: ComposerStep[];
  /** What kicks the script off. Defaults to "mount". */
  trigger?: DemoTrigger;
  /** For trigger="manual" — flip true to play. */
  play?: boolean;
  /** Animation feel. */
  speed?: DemoSpeed;
  /** Loop the script forever. */
  loop?: boolean;
  /**
   * Pause between loop iterations (ms). Defaults to 2000. Marketing
   * heroes that want the demo to breathe between repeats bump this
   * higher; tight inline demos drop it.
   */
  loopDelay?: number;
  /**
   * Fires once per loop cycle, AFTER the loopDelay pause and BEFORE
   * the script replays. Use to reset parent state that the script
   * mutated via onSubmit (e.g., wipe a messages list back to its
   * seed before the demo types into it again). The editor is cleared
   * automatically — you only need this hook if state outside the
   * Composer needs to reset too.
   */
  onLoopReset?: () => void;
  /**
   * Bare mode — strip the card chrome (border / bg / rounding). Use
   * when embedding inside an existing card or column layout.
   */
  bare?: boolean;
  /**
   * Read-only mode — disables editing AND focusability. Programmatic
   * updates (including scripted demo playback) still work. Use for
   * marketing surfaces that render a Composer purely for show, so the
   * scripted typing doesn't steal focus from other inputs on the page.
   * Hides the default Send / paperclip action row.
   */
  readOnly?: boolean;
  className?: string;
}

// ─── Plugins (internal) ──────────────────────────────────────────────

/**
 * SubmitPlugin — wires Enter to submit (Shift-Enter still inserts a
 * newline). Captures the editor command before the rich-text plugin
 * inserts a paragraph break.
 */
function SubmitPlugin({
  onSubmit,
  enabled,
}: {
  onSubmit: () => void;
  enabled: boolean;
}) {
  const [editor] = useLexicalComposerContext();

  React.useEffect(() => {
    if (!enabled) return;
    return editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event) => {
        if (event && (event as KeyboardEvent).shiftKey) return false;
        event?.preventDefault();
        onSubmit();
        return true;
      },
      COMMAND_PRIORITY_HIGH,
    );
  }, [editor, enabled, onSubmit]);

  return null;
}

/**
 * PastePlugin — intercepts clipboard image pastes when attachments
 * are enabled, routes them to the attachment intake instead of
 * letting Lexical try to insert them as nodes.
 */
function PastePlugin({
  onImageFiles,
  enabled,
}: {
  onImageFiles: (files: File[]) => void;
  enabled: boolean;
}) {
  const [editor] = useLexicalComposerContext();

  React.useEffect(() => {
    if (!enabled) return;
    const rootElement = editor.getRootElement();
    if (!rootElement) return;
    const handler = (e: ClipboardEvent) => {
      const items = Array.from(e.clipboardData?.items ?? []);
      const imageFiles = items
        .filter((it) => it.kind === "file" && it.type.startsWith("image/"))
        .map((it) => it.getAsFile())
        .filter((f): f is File => f !== null);
      if (imageFiles.length > 0) {
        e.preventDefault();
        onImageFiles(imageFiles);
      }
    };
    rootElement.addEventListener("paste", handler);
    return () => rootElement.removeEventListener("paste", handler);
  }, [editor, enabled, onImageFiles]);

  return null;
}

/**
 * AutoFocusPlugin — focus the editor on mount when `autoFocus` is on.
 */
function AutoFocusPlugin({ enabled }: { enabled: boolean }) {
  const [editor] = useLexicalComposerContext();
  React.useEffect(() => {
    if (!enabled) return;
    editor.focus();
  }, [editor, enabled]);
  return null;
}

/**
 * RefBridgePlugin — exposes the LexicalEditor instance up to the
 * outer forwardRef so ComposerHandle methods can drive it.
 */
function RefBridgePlugin({
  onEditor,
}: {
  onEditor: (editor: LexicalEditor) => void;
}) {
  const [editor] = useLexicalComposerContext();
  React.useEffect(() => {
    onEditor(editor);
  }, [editor, onEditor]);
  return null;
}

// ─── Demo step interpreter ───────────────────────────────────────────

const FORMAT_TEXT_KEYS: Partial<Record<ComposerFormat, TextFormatType>> = {
  bold: "bold",
  italic: "italic",
  underline: "underline",
  strikethrough: "strikethrough",
  code: "code",
};

/**
 * Apply a block-level format to the current selection. Splits text
 * vs. block formats internally.
 */
function applyFormat(editor: LexicalEditor, format: ComposerFormat) {
  const textKey = FORMAT_TEXT_KEYS[format];
  if (textKey) {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, textKey);
    return;
  }
  if (format === "ul") {
    editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    return;
  }
  if (format === "ol") {
    editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    return;
  }
  // Block-level conversions go through $setBlocksType inside an update.
  editor.update(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return;
    if (format === "h1" || format === "h2" || format === "h3") {
      const tag = format as HeadingTagType;
      $setBlocksType(selection, () => $createHeadingNode(tag));
      return;
    }
    if (format === "blockquote" || format === "pullquote") {
      // Pullquote is a styled variant of blockquote: same node, plus a
      // data attribute the CSS targets. Lexical doesn't ship a custom
      // attribute API per quote, so we tag the DOM via theme below
      // and use a separate $createPullquoteNode if/when this graduates
      // into a custom node type.
      $setBlocksType(selection, () => {
        const node = $createQuoteNode();
        if (format === "pullquote") {
          // Best-effort marker so the theme can style it differently.
          // Stored on the element via a getter override later if we
          // need it round-trippable.
          (node as unknown as { __pullquote?: boolean }).__pullquote = true;
        }
        return node;
      });
    }
  });
}

/**
 * Insert a beautiful-mention node programmatically at the current
 * selection. Used by demo `mention` steps and the imperative
 * ComposerHandle.insert flow.
 */
function insertMentionNode(
  editor: LexicalEditor,
  trigger: string,
  value: string,
  data?: Record<string, unknown>,
) {
  editor.update(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return;
    // BeautifulMentionsItemData restricts to primitives (string | number
    // | boolean | null). Our public `data` is wider (Record<string,
    // unknown>) so callers can pass through richer payloads — but at the
    // node-creation boundary we cast since the plugin will JSON-roundtrip
    // it and anything non-primitive would silently drop anyway.
    const node = $createBeautifulMentionNode(
      trigger,
      value,
      data as Record<string, string | boolean | number | null> | undefined,
    );
    selection.insertNodes([node]);
    // Insert a trailing space so the caret sits ready for the next
    // word rather than glued to the mention pill.
    selection.insertText(" ");
  });
}

/**
 * Find a substring in the editor's plain text and set the selection
 * to it. Returns true on success, false if not found.
 */
function selectSubstring(editor: LexicalEditor, needle: string): boolean {
  let found = false;
  editor.update(() => {
    const root = $getRoot();
    const fullText = root.getTextContent();
    const idx = fullText.indexOf(needle);
    if (idx === -1) return;
    // Walk the text nodes to translate idx -> (node, offset).
    let cursor = 0;
    let startNode: TextNode | null = null;
    let startOffset = 0;
    let endNode: TextNode | null = null;
    let endOffset = 0;
    const walk = (node: LexicalNode) => {
      if (startNode && endNode) return;
      if (node.getType() === "text") {
        const tn = node as TextNode;
        const len = tn.getTextContentSize();
        const nodeStart = cursor;
        const nodeEnd = cursor + len;
        if (!startNode && idx >= nodeStart && idx < nodeEnd) {
          startNode = tn;
          startOffset = idx - nodeStart;
        }
        const endIdx = idx + needle.length;
        if (!endNode && endIdx > nodeStart && endIdx <= nodeEnd) {
          endNode = tn;
          endOffset = endIdx - nodeStart;
        }
        cursor = nodeEnd;
        return;
      }
      if ("getChildren" in node) {
        for (const child of (node as unknown as { getChildren: () => LexicalNode[] }).getChildren()) {
          walk(child);
        }
      } else {
        cursor += node.getTextContentSize();
      }
    };
    walk(root);
    // Cast inside the truthy branch. TS's control-flow analysis of a
    // let-with-`null`-initial mutated inside a closure narrows the
    // truthy-branch type to `never` (closure mutations aren't tracked
    // for flow purposes). The `as TextNode` tells TS we know better —
    // walk() either populated both or returned early.
    if (startNode && endNode) {
      const sn = startNode as TextNode;
      const en = endNode as TextNode;
      const selection = sn.select(startOffset, 0);
      selection.focus.set(en.getKey(), endOffset, "text");
      found = true;
    }
  });
  return found;
}

/**
 * Wipe the editor contents and leave a fresh empty paragraph with
 * a collapsed selection. Used wherever we need to "reset to empty" —
 * after submit, on imperative clear(), on loop reset, on restart().
 *
 * Why not `dispatchCommand(CLEAR_EDITOR_COMMAND)`: that command is
 * registered by RichTextPlugin / PlainTextPlugin and short-circuits
 * silently in some editor states (notably readOnly mode, but also
 * observed in some controlled flows). Explicit root mutation always
 * works because it bypasses the command layer entirely.
 */
function clearEditor(editor: LexicalEditor) {
  editor.update(() => {
    const root = $getRoot();
    root.clear();
    const para = $createParagraphNode();
    root.append(para);
    para.select();
  });
}

/**
 * Snapshot the current editor content into the ComposerContent shape
 * exposed to onSubmit and via ComposerHandle.getContent.
 */
function snapshotContent(editor: LexicalEditor): ComposerContent {
  let text = "";
  let json = "";
  const mentions: ComposerContent["mentions"] = [];
  editor.getEditorState().read(() => {
    text = $getRoot().getTextContent();
    json = JSON.stringify(editor.getEditorState().toJSON());
    const walk = (node: LexicalNode) => {
      if (node.getType() === "beautifulMention") {
        const m = node as unknown as {
          getTrigger: () => string;
          getValue: () => string;
          getData: () => Record<string, unknown> | undefined;
        };
        mentions.push({
          trigger: m.getTrigger(),
          value: m.getValue(),
          data: m.getData(),
        });
      }
      if ("getChildren" in node) {
        for (const child of (node as unknown as { getChildren: () => LexicalNode[] }).getChildren()) {
          walk(child);
        }
      }
    };
    walk($getRoot());
  });
  return { text, json, mentions };
}

// ─── Toolbar ─────────────────────────────────────────────────────────

const FORMAT_BUTTONS: Array<{
  format: ComposerFormat;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}> = [
  { format: "bold", icon: Bold, label: "Bold" },
  { format: "italic", icon: Italic, label: "Italic" },
  { format: "underline", icon: Underline, label: "Underline" },
  { format: "strikethrough", icon: Strikethrough, label: "Strikethrough" },
  { format: "code", icon: CodeIcon, label: "Inline code" },
  { format: "h1", icon: Heading1, label: "Heading 1" },
  { format: "h2", icon: Heading2, label: "Heading 2" },
  { format: "h3", icon: Heading3, label: "Heading 3" },
  { format: "blockquote", icon: Quote, label: "Blockquote" },
  { format: "ul", icon: ListIcon, label: "Bulleted list" },
  { format: "ol", icon: ListOrdered, label: "Numbered list" },
];

function ComposerToolbar({ formats }: { formats: ComposerFormat[] }) {
  const [editor] = useLexicalComposerContext();
  const [activeFormats, setActiveFormats] = React.useState<Set<TextFormatType>>(
    () => new Set(),
  );

  React.useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) return;
          const next = new Set<TextFormatType>();
          for (const fmt of ["bold", "italic", "underline", "strikethrough", "code"] as TextFormatType[]) {
            if (selection.hasFormat(fmt)) next.add(fmt);
          }
          setActiveFormats(next);
        });
      }),
    );
  }, [editor]);

  const visible = FORMAT_BUTTONS.filter((b) => formats.includes(b.format));

  return (
    <div
      data-gds-part="composer-toolbar"
      className={cn(
        "flex flex-wrap items-center gap-0.5",
        // No bottom border — the toolbar sits inside the same card
        // as the editor and the action row. Internal dividers were
        // reading as too many seams; let the surface flow as one.
        "px-2 py-1",
      )}
    >
      {visible.map(({ format, icon: Icon, label }) => {
        const textKey = FORMAT_TEXT_KEYS[format];
        const isActive = textKey ? activeFormats.has(textKey) : false;
        return (
          <button
            key={format}
            type="button"
            aria-label={label}
            title={label}
            data-gds-part="composer-toolbar-button"
            data-gds-active={isActive ? "true" : "false"}
            onClick={() => applyFormat(editor, format)}
            className={cn(
              "h-7 w-7 inline-flex items-center justify-center rounded",
              "text-[var(--gds-composer-toolbar-fg)]",
              "hover:bg-[var(--gds-composer-toolbar-hover-bg)]",
              "focus:outline-none focus:ring-2 focus:ring-primary",
              isActive && "bg-[var(--gds-composer-toolbar-active-bg)] text-[var(--gds-composer-toolbar-active-fg)]",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}

// ─── Attachment chip row ─────────────────────────────────────────────

function AttachmentChips({
  attachments,
  onRemove,
}: {
  attachments: ComposerAttachment[];
  onRemove: (id: string) => void;
}) {
  return (
    <AnimatePresence initial={false}>
      {attachments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.18 }}
          className="overflow-hidden"
        >
          <div
            data-gds-part="composer-attachments"
            className="flex flex-wrap gap-2 px-2 py-2"
          >
            {attachments.map((att) => (
              <div key={att.id} className="relative group">
                {att.file.type.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={att.previewUrl}
                    alt={att.name}
                    className="h-14 w-14 rounded-md object-cover border border-[var(--gds-composer-border)]"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-md border border-[var(--gds-composer-border)] flex items-center justify-center text-xs px-1 text-center text-[var(--gds-composer-muted-fg)]">
                    {att.name.slice(0, 18)}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => onRemove(att.id)}
                  aria-label={`Remove ${att.name}`}
                  className={cn(
                    "absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full",
                    "bg-[var(--gds-composer-chip-remove-bg)]",
                    "text-[var(--gds-composer-chip-remove-fg)]",
                    "flex items-center justify-center",
                    "opacity-0 group-hover:opacity-100 focus:opacity-100",
                    "focus:outline-none focus:ring-2 focus:ring-primary",
                    "transition-opacity",
                  )}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Inner component (inside LexicalRoot) ────────────────────────────

interface InnerProps extends Omit<
  ComposerProps,
  "initialJson" | "initialText" | "readOnly" | "attachments"
> {
  readOnly: boolean;
  /**
   * Bridge for the outer forwardRef to surface useScriptedDemo's
   * `restart()` on ComposerHandle. The inner component populates
   * this; the outer reads from it inside useImperativeHandle.
   */
  restartRef: React.MutableRefObject<(delayMs?: number) => void>;
  /** Resolved + normalised. */
  triggers: ComposerTriggerConfig[];
  attachmentsCfg: Required<ComposerAttachmentConfig> | null;
  formatList: ComposerFormat[];
  showToolbar: boolean;
  handleEditorReady: (editor: LexicalEditor) => void;
  /** Used by the demo player to drive submission. */
  submitRef: React.MutableRefObject<() => void>;
  /** Internal attachment state lifted up so the rightActions Send
   *  button + the demo's submit step both see it. */
  attachments: ComposerAttachment[];
  setAttachments: React.Dispatch<React.SetStateAction<ComposerAttachment[]>>;
  /** Image intake callback (shared by paperclip + paste). */
  ingestImages: (files: File[]) => void;
}

function ComposerInner({
  placeholder,
  triggers,
  attachmentsCfg,
  formatList,
  showToolbar,
  isLoading,
  onStop,
  maxLength,
  autoFocus,
  submitOnEnter = true,
  leftActions,
  rightActions,
  hideSend,
  steps,
  trigger = "mount",
  play,
  speed = "normal",
  loop = false,
  loopDelay,
  onLoopReset,
  bare,
  className,
  onSubmit,
  onChange,
  readOnly,
  handleEditorReady,
  submitRef,
  restartRef,
  attachments,
  setAttachments,
  ingestImages,
}: InnerProps) {
  const [editor] = useLexicalComposerContext();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Send-button enable state — driven by editor content.
  const [hasContent, setHasContent] = React.useState(false);

  React.useEffect(() => {
    handleEditorReady(editor);
  }, [editor, handleEditorReady]);

  // Read-only toggle — flips Lexical's editable flag. The contenteditable
  // element becomes non-focusable so a scripted demo running in this
  // composer can't steal focus from other inputs on the page.
  // editor.update() still applies, so demo playback continues to work.
  React.useEffect(() => {
    editor.setEditable(!readOnly);
  }, [editor, readOnly]);

  // Stable ref for onChange so the update listener doesn't re-register
  // every render. Read via ref so inline arrow functions don't churn it.
  const onChangeRef = React.useRef(onChange);
  onChangeRef.current = onChange;

  React.useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const text = $getRoot().getTextContent();
        setHasContent(text.trim().length > 0);
        onChangeRef.current?.(text);
      });
    });
  }, [editor]);

  // ── Submit handler — shared by Enter, Send button, demo "submit" step.
  const handleSubmit = React.useCallback(() => {
    if (isLoading) return;
    const content = snapshotContent(editor);
    const hasText = content.text.trim().length > 0;
    const hasAttachments = attachments.length > 0;
    if (!hasText && !hasAttachments) return;
    onSubmit?.(content, hasAttachments ? attachments : undefined);
    // Reset for the next message. Explicit root.clear() rather than
    // CLEAR_EDITOR_COMMAND so it works reliably in every state
    // (readOnly, controlled-value flows, etc) — the command path
    // short-circuits silently in some configurations.
    clearEditor(editor);
    attachments.forEach((a) => URL.revokeObjectURL(a.previewUrl));
    setAttachments([]);
  }, [editor, isLoading, attachments, onSubmit, setAttachments]);

  // Keep submitRef pointing at the latest closure for the demo player.
  submitRef.current = handleSubmit;

  // ── Demo player ────────────────────────────────────────────────────
  //
  // The interpret callback runs Lexical updates per step. Typing
  // splits into per-character updates so the user sees the text
  // appear; mention inserts the node directly (we could open the
  // popover UI, but for v1 keep it simple); format dispatches the
  // matching command; submit calls handleSubmit; select walks text
  // nodes to set a range.
  const { restart: demoRestart } = useScriptedDemo<ComposerStep>({
    steps,
    speed,
    trigger,
    play,
    loop,
    loopDelay,
    containerRef,
    onLoopReset: () => {
      clearEditor(editor);
      // Consumer-provided callback fires after the editor clear so
      // any external state (parent messages list, etc.) resets in
      // the same tick before the script replays.
      onLoopReset?.();
    },
    interpret: async (step, ctx) => {
      const signal = ctx.signal;
      if (step.type === "wait") return sleep(step.ms, signal);
      if (step.type === "clear") {
        clearEditor(editor);
        return sleep(120, signal);
      }
      if (step.type === "newline") {
        editor.update(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) return;
          selection.insertParagraph();
        });
        return sleep(60, signal);
      }
      if (step.type === "submit") {
        handleSubmit();
        return sleep(120, signal);
      }
      if (step.type === "format") {
        applyFormat(editor, step.format);
        // Collapse the selection to its end so the next type step
        // appends instead of replacing the (still-selected) text.
        // Without this, scripted "select word → format italic → type
        // more" sequences would have the new typing wipe out the
        // formatted word. Lexical selection has no direct collapse
        // method, but anchor.set() with the focus's key/offset/type
        // produces a zero-width range at the end of the selection.
        editor.update(() => {
          const sel = $getSelection();
          if (!$isRangeSelection(sel) || sel.isCollapsed()) return;
          const focus = sel.focus;
          sel.anchor.set(focus.key, focus.offset, focus.type);
        });
        return sleep(80, signal);
      }
      if (step.type === "select") {
        selectSubstring(editor, step.text);
        return sleep(120, signal);
      }
      if (step.type === "mention") {
        // Optional pre-typed query — shows the typeahead in flight.
        if (step.query) {
          editor.update(() => {
            const sel = $getSelection();
            if ($isRangeSelection(sel)) sel.insertText(step.trigger);
          });
          await typeText(
            step.query,
            (partial) => {
              editor.update(() => {
                const root = $getRoot();
                const text = root.getTextContent();
                // Replace the trailing trigger + partial query each tick.
                const head = text.slice(0, text.length - step.trigger.length - (partial.length - 1));
                root.clear();
                const p = $createParagraphNode();
                if (head) p.append($createTextNode(head));
                p.append($createTextNode(step.trigger + partial));
                root.append(p);
              });
            },
            ctx.speed.tokenStagger,
            signal,
          );
          await sleep(180, signal);
          // Now strip the trigger + query and insert the mention.
          editor.update(() => {
            const root = $getRoot();
            const text = root.getTextContent();
            const stripLen = step.trigger.length + step.query!.length;
            const head = text.slice(0, text.length - stripLen);
            root.clear();
            const p = $createParagraphNode();
            if (head) p.append($createTextNode(head));
            root.append(p);
            p.select();
          });
        }
        insertMentionNode(editor, step.trigger, step.value);
        return sleep(120, signal);
      }
      // type — append one char per tick. Lexical wants its own update
      // transaction per insert, so we can't use typeText() directly
      // (that's a setter-style API for components that own a string
      // buffer). Run our own cancellable loop here instead.
      const stagger = step.speed
        ? { slow: 70, normal: 22, fast: 8 }[step.speed]
        : ctx.speed.tokenStagger;
      for (let i = 0; i < step.text.length; i++) {
        if (signal.aborted) return;
        const char = step.text[i];
        editor.update(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) {
            // No active selection (eg. initial mount before the user
            // focused). Anchor at the end of the doc so the demo can
            // still type.
            $getRoot().selectEnd();
            const sel2 = $getSelection();
            if ($isRangeSelection(sel2)) sel2.insertText(char);
            return;
          }
          selection.insertText(char);
        });
        if (i < step.text.length - 1) await sleep(stagger, signal);
      }
    },
  });

  // Bridge useScriptedDemo's restart() up to the outer ComposerHandle.
  // Wrap it so the inner component also wipes the editor before the
  // new run begins (otherwise the replay's first type step would
  // append to the leftover text).
  React.useEffect(() => {
    restartRef.current = (delayMs?: number) => {
      clearEditor(editor);
      demoRestart(delayMs);
    };
  }, [editor, demoRestart, restartRef]);

  // ── Action row ─────────────────────────────────────────────────────

  // Read-only composers (marketing demos) shouldn't render the action
  // row — there's no user input to send, no attachments to attach.
  const showDefaultSend = !readOnly && !rightActions && !hideSend;
  const showDefaultAttach = !readOnly && !leftActions && attachmentsCfg !== null;
  const showActionRow = !readOnly && (showDefaultAttach || leftActions || showDefaultSend || rightActions);

  return (
    <div
      ref={containerRef}
      data-gds-part="composer"
      data-gds-loading={isLoading ? "true" : "false"}
      className={cn(
        "w-full",
        // Match Input's chrome — rounded-md + border-input + shadow-sm
        // + softer focus ring. The Composer reads as a heavier sibling
        // of Input (multi-line, toolbar, attachments) and should sit
        // in the same form rhythm without looking like a different
        // family of control.
        !bare && [
          "rounded-md",
          "bg-transparent",
          "border border-input",
          "shadow-sm",
          "focus-within:outline-none focus-within:ring-1 focus-within:ring-ring",
          "transition-colors",
        ],
        className,
      )}
    >
      {showToolbar && <ComposerToolbar formats={formatList} />}

      {attachmentsCfg && (
        <AttachmentChips
          attachments={attachments}
          onRemove={(id) => {
            setAttachments((prev) => {
              const target = prev.find((a) => a.id === id);
              if (target) URL.revokeObjectURL(target.previewUrl);
              return prev.filter((a) => a.id !== id);
            });
          }}
        />
      )}

      <div className="relative">
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              data-gds-part="composer-editor"
              className={cn(
                "outline-none",
                "px-3 sm:px-4 py-3",
                "text-sm text-[var(--gds-composer-fg)]",
                "min-h-[44px] max-h-[300px] overflow-y-auto",
                "[&_p]:m-0 [&_p+p]:mt-2",
                "[&_h1]:text-xl [&_h1]:font-semibold [&_h1]:mt-2",
                "[&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-2",
                "[&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-2",
                "[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5",
                "[&_blockquote]:border-l-2 [&_blockquote]:border-[var(--gds-composer-border)] [&_blockquote]:pl-3 [&_blockquote]:italic",
                "[&_code]:bg-[var(--gds-composer-toolbar-active-bg)] [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono",
                isLoading && "opacity-60 pointer-events-none",
              )}
              aria-placeholder={placeholder ?? ""}
              placeholder={
                <div
                  data-gds-part="composer-placeholder"
                  className="absolute top-3 left-3 sm:left-4 text-sm text-[var(--gds-composer-muted-fg)] pointer-events-none select-none"
                >
                  {placeholder}
                </div>
              }
              spellCheck
            />
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <ListPlugin />
        <LinkPlugin />
        <OnChangePlugin onChange={() => {}} />
        <AutoFocusPlugin enabled={Boolean(autoFocus)} />
        <SubmitPlugin onSubmit={handleSubmit} enabled={submitOnEnter} />
        {attachmentsCfg && (
          <PastePlugin onImageFiles={ingestImages} enabled={true} />
        )}
        {triggers.length > 0 && (
          <BeautifulMentionsPlugin
            items={triggers.reduce<Record<string, BeautifulMentionsItem[]>>(
              (acc, t) => {
                // Resolver functions are deferred to v2 — for now only
                // static arrays are wired into the plugin. The shape
                // here is intentionally minimal: just `value`. The
                // plugin spreads each item's extra props onto the DOM
                // (which is how it warns "React does not recognize the
                // `foo` prop"), so anything richer than primitives
                // needs the plugin's own custom-component slot to
                // render properly. Keep the surface narrow until we
                // need richer items.
                if (typeof t.items === "function") return acc;
                acc[t.char] = t.items.map((item) => ({
                  value: item.value,
                })) as BeautifulMentionsItem[];
                return acc;
              },
              {},
            )}
          />
        )}
      </div>

      {/* Action row — paperclip on the left, send/stop on the right.
          Slots win when supplied; defaults render otherwise. Hidden
          entirely in readOnly mode. */}
      {showActionRow && (
        <div
          data-gds-part="composer-actions"
          className="flex items-center justify-between gap-2 px-2 pb-2 pt-1"
        >
          <div className="flex items-center gap-1">
            {leftActions ?? (
              showDefaultAttach && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  aria-label="Attach image"
                  title="Attach image"
                  className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center",
                    "text-[var(--gds-composer-action-fg)]",
                    "hover:text-[var(--gds-composer-fg)]",
                    "hover:bg-[var(--gds-composer-toolbar-hover-bg)]",
                    "focus:outline-none focus:ring-2 focus:ring-primary",
                    "transition-colors",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                  )}
                >
                  <Paperclip className="w-4 h-4" />
                </button>
              )
            )}
          </div>

          {rightActions ??
            (showDefaultSend && (
              <button
                type="button"
                onClick={isLoading ? onStop : handleSubmit}
                disabled={
                  isLoading
                    ? !onStop
                    : !hasContent && attachments.length === 0
                }
                aria-label={isLoading ? "Stop" : "Send"}
                className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center transition-colors flex-shrink-0",
                  "focus:outline-none focus:ring-2 focus:ring-primary",
                  isLoading
                    ? "bg-red-500 hover:bg-red-600 text-white disabled:opacity-50"
                    : hasContent || attachments.length > 0
                      ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                      : "bg-[var(--gds-composer-toolbar-active-bg)] text-[var(--gds-composer-muted-fg)] cursor-not-allowed",
                )}
              >
                {isLoading ? (
                  <Square className="w-3.5 h-3.5" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
              </button>
            ))}

          {/* Hidden file input wired to the paperclip. */}
          {attachmentsCfg && (
            <input
              ref={fileInputRef}
              type="file"
              accept={attachmentsCfg.accept}
              multiple={attachmentsCfg.multiple}
              onChange={(e) => {
                if (e.target.files) ingestImages(Array.from(e.target.files));
                e.target.value = "";
              }}
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
            />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Outer component ────────────────────────────────────────────────

export const Composer = React.forwardRef<ComposerHandle, ComposerProps>(
  function Composer(props, forwardedRef) {
    const {
      initialText,
      initialJson,
      formats,
      toolbar,
      triggers,
      attachments: attachmentsProp,
      ...rest
    } = props;

    // Resolve formats — false means plain text, undefined means defaults.
    const formatList: ComposerFormat[] = React.useMemo(() => {
      if (formats === false) return [];
      return (
        formats ?? [
          "bold",
          "italic",
          "underline",
          "strikethrough",
          "code",
          "h1",
          "h2",
          "blockquote",
          "ul",
          "ol",
        ]
      );
    }, [formats]);

    const showToolbar = toolbar === true || toolbar === "top";

    // Resolve attachments config — true means defaults, object merges.
    const attachmentsCfg = React.useMemo<Required<ComposerAttachmentConfig> | null>(() => {
      if (!attachmentsProp) return null;
      const obj = attachmentsProp === true ? {} : attachmentsProp;
      if (obj.enabled === false) return null;
      return {
        enabled: true,
        accept: obj.accept ?? "image/*",
        maxItems: obj.maxItems ?? 10,
        multiple: obj.multiple ?? true,
      };
    }, [attachmentsProp]);

    const [attachments, setAttachments] = React.useState<ComposerAttachment[]>(
      [],
    );
    const attachmentsRef = React.useRef(attachments);
    attachmentsRef.current = attachments;

    // Revoke any outstanding object URLs on unmount.
    React.useEffect(() => {
      return () => {
        attachmentsRef.current.forEach((a) => URL.revokeObjectURL(a.previewUrl));
      };
    }, []);

    const ingestImages = React.useCallback(
      (files: File[]) => {
        if (!attachmentsCfg) return;
        const candidates = files.filter((f) => {
          if (!attachmentsCfg.accept) return true;
          if (attachmentsCfg.accept === "image/*") return f.type.startsWith("image/");
          // Coarse check — full accept-attribute matching is more
          // permissive than we need for v1.
          return attachmentsCfg.accept.split(",").some((tok) => {
            const t = tok.trim();
            if (t.endsWith("/*")) return f.type.startsWith(t.slice(0, -1));
            return f.type === t || f.name.toLowerCase().endsWith(t);
          });
        });
        if (candidates.length === 0) return;
        setAttachments((prev) => {
          const room = attachmentsCfg.maxItems - prev.length;
          if (room <= 0) return prev;
          const next = candidates.slice(0, room).map((file) => ({
            id: `${file.name}-${file.size}-${Date.now()}-${Math.random()
              .toString(36)
              .slice(2, 8)}`,
            file,
            previewUrl: URL.createObjectURL(file),
            name: file.name,
          }));
          return [...prev, ...next];
        });
      },
      [attachmentsCfg],
    );

    // Editor ref bridged via the inner plugin.
    const editorRef = React.useRef<LexicalEditor | null>(null);
    const submitRef = React.useRef<() => void>(() => {});
    // restart() is wired by the inner component (which owns the
    // useScriptedDemo state). Outer keeps a ref pointer it forwards
    // through ComposerHandle so callers can `ref.current.restart()`.
    const restartRef = React.useRef<(delayMs?: number) => void>(() => {});

    const handleEditorReady = React.useCallback((editor: LexicalEditor) => {
      editorRef.current = editor;
    }, []);

    // Expose imperative handle.
    React.useImperativeHandle(
      forwardedRef,
      (): ComposerHandle => ({
        play: (_steps) => {
          // For imperative play, we re-mount with a manual trigger.
          // V1: log + recommend using the `steps` prop with manual
          // trigger. The plumbing for hot-swapping a fresh script is
          // tracked as a follow-up.
          // eslint-disable-next-line no-console
          console.warn(
            "[Composer] handle.play(steps) is not wired in v1 — pass `steps` + `trigger=\"manual\"` and toggle `play` instead.",
          );
        },
        stop: () => {},
        restart: (delayMs) => restartRef.current(delayMs),
        focus: () => editorRef.current?.focus(),
        clear: () => {
          const editor = editorRef.current;
          if (editor) clearEditor(editor);
        },
        insert: (text) => {
          editorRef.current?.update(() => {
            const sel = $getSelection();
            if ($isRangeSelection(sel)) sel.insertText(text);
          });
        },
        getContent: () =>
          editorRef.current
            ? snapshotContent(editorRef.current)
            : { text: "", json: "", mentions: [] },
        getEditor: () => editorRef.current,
      }),
      [],
    );

    // Lexical theme classes — kept light so most of the styling
    // happens via Tailwind on the parent. The theme bridge is here
    // so consumers can override individual node classes via CSS
    // variables without forking the component.
    const lexicalTheme = React.useMemo(
      () => ({
        paragraph: "gds-composer-paragraph",
        quote: "gds-composer-quote",
        heading: {
          h1: "gds-composer-h1",
          h2: "gds-composer-h2",
          h3: "gds-composer-h3",
        },
        list: {
          ul: "gds-composer-ul",
          ol: "gds-composer-ol",
          listitem: "gds-composer-li",
        },
        text: {
          bold: "font-semibold",
          italic: "italic",
          underline: "underline",
          strikethrough: "line-through",
          code: "gds-composer-code",
        },
        beautifulMentions: {
          // Tailwind utilities so the pill styling works without
          // requiring consumers to load @gradeui/ui/styles.css. The
          // gds-composer-mention* tokens in globals.css are still
          // available for hosts that want to retheme without forking
          // — they layer over these defaults via class precedence.
          "@": "gds-composer-mention px-1.5 py-0.5 mx-0.5 rounded bg-primary/10 text-primary font-medium",
          "/": "gds-composer-mention px-1.5 py-0.5 mx-0.5 rounded bg-violet-500/15 text-violet-600 dark:text-violet-400 font-medium",
        },
      }),
      [],
    );

    // Initial config for LexicalRoot. Note nodes registration —
    // every custom node we use anywhere (BeautifulMentionNode for
    // mentions, HeadingNode/QuoteNode/etc for formatting) MUST be
    // declared here or Lexical throws at first paint.
    const initialConfig: InitialConfigType = React.useMemo(
      () => ({
        namespace: "gds-composer",
        theme: lexicalTheme,
        onError: (error: Error) => {
          // eslint-disable-next-line no-console
          console.error("[Composer]", error);
        },
        nodes: [
          HeadingNode,
          QuoteNode,
          ListNode,
          ListItemNode,
          LinkNode,
          AutoLinkNode,
          CodeNode,
          CodeHighlightNode,
          BeautifulMentionNode,
        ],
        editorState: initialJson
          ? initialJson
          : initialText
            ? (editor: LexicalEditor) => {
                const root = $getRoot();
                const p = $createParagraphNode();
                p.append($createTextNode(initialText));
                root.append(p);
              }
            : undefined,
      }),
      [lexicalTheme, initialJson, initialText],
    );

    const richMode = formatList.length > 0;
    const { readOnly = false, ...innerRest } = rest;

    return (
      <LexicalRoot
        initialConfig={{
          ...initialConfig,
          editable: !readOnly,
        }}
      >
        <ComposerInner
          {...innerRest}
          readOnly={readOnly}
          triggers={triggers ?? []}
          attachmentsCfg={readOnly ? null : attachmentsCfg}
          formatList={formatList}
          showToolbar={showToolbar && richMode && !readOnly}
          handleEditorReady={handleEditorReady}
          submitRef={submitRef}
          restartRef={restartRef}
          attachments={attachments}
          setAttachments={setAttachments}
          ingestImages={ingestImages}
        />
      </LexicalRoot>
    );
  },
);

// ─── ComposerReply — preset for the reply use case ───────────────────
//
// Wraps Composer with sensible defaults for comment threads and
// reply boxes: plain text only (no toolbar), no attachments, the
// "Write a reply…" placeholder. Surfaced from playground use — three
// scaffolds (comments, chat, hero preview) all reached for the same
// shape and re-passed the same props.
//
// All defaults are overridable — pass `formats=[...]` to enable a
// toolbar, `attachments` to allow uploads, etc. ComposerReply is
// a starting point, not a lock-in.

export const ComposerReply = React.forwardRef<ComposerHandle, ComposerProps>(
  function ComposerReply(props, ref) {
    return (
      <Composer
        ref={ref}
        placeholder="Write a reply…"
        formats={false}
        submitOnEnter={false}
        {...props}
      />
    );
  },
);
