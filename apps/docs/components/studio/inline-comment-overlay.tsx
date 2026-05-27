"use client";

/**
 * InlineCommentOverlay — Figma-style anchored composer.
 *
 * When the user picks an element in Comment mode, this card pops up
 * positioned right next to the element with a textarea + Post/Cancel
 * buttons. No tab switching, no hunting — write where you click.
 *
 * Positioning: the overlay is rendered inside the canvas container
 * (`position: relative` host) with `position: absolute` and a
 * (top, left) computed from the iframe's offset within the
 * container + the element's rect inside the iframe. We anchor just
 * below the element by default and flip above when there isn't
 * room.
 *
 * The composer body is self-contained — submit calls
 * `onSubmit(body)` and lets the parent handle storage + thread
 * creation. Cancel just dismisses.
 *
 * Auto-focuses the textarea on mount. Cmd/Ctrl-Enter sends.
 * Escape dismisses. Click-outside dismisses too.
 */

import * as React from "react";
import { Send, X } from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Textarea,
} from "@gradeui/ui";

import type { StudioSelection } from "@/lib/chat-sandpack";
import type { User } from "@/lib/studio-users";

interface InlineCommentOverlayProps {
  /** The selection the overlay is anchored to. Used both for the
   *  visual anchor (element rect) and the thread metadata
   *  (instanceId, elementLabel, componentName) on submit. */
  selection: StudioSelection;
  /** Offset of the iframe (or fast-frame root) within the canvas
   *  container in pixels. Combined with `selection.rect` to pin
   *  the overlay at the right spot. */
  iframeOffset: { left: number; top: number };
  /** Display avatar + name for the composer's "who's posting" row. */
  currentUser: User;
  /** Submit the comment body. The parent extracts instanceId / label
   *  from the selection and creates the thread. Returning a promise
   *  lets the overlay show a loading state during the round-trip. */
  onSubmit: (body: string) => Promise<void> | void;
  /** Close the overlay without creating a thread. */
  onCancel: () => void;
}

export function InlineCommentOverlay({
  selection,
  iframeOffset,
  currentUser,
  onSubmit,
  onCancel,
}: InlineCommentOverlayProps) {
  const [body, setBody] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  // Click-outside to dismiss. Skipped while submitting so a
  // misclick during the save doesn't blow away the in-flight
  // request. The capture-phase listener catches clicks that
  // happen on overlay-host children (e.g. the iframe).
  React.useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (submitting) return;
      const node = rootRef.current;
      if (!node) return;
      if (e.target instanceof Node && node.contains(e.target)) return;
      onCancel();
    }
    document.addEventListener("mousedown", onPointerDown, true);
    return () =>
      document.removeEventListener("mousedown", onPointerDown, true);
  }, [submitting, onCancel]);

  // Autofocus the textarea on mount. Use a microtask so the
  // browser's focus from the click that opened us doesn't fight
  // the focus call here.
  React.useEffect(() => {
    const id = window.setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  // Initials for the avatar fallback.
  const initials = React.useMemo(() => {
    const parts = currentUser.name.trim().split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
  }, [currentUser.name]);

  const canSubmit = body.trim().length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onSubmit(body.trim());
    } finally {
      setSubmitting(false);
    }
  };

  // Position the overlay just below the element by default. The
  // element's rect is iframe-internal; add the iframe's offset
  // within the canvas container so the absolute coords land on
  // the right pixel. 8px gap gives breathing room from the
  // selection ring.
  const top = iframeOffset.top + selection.rect.y + selection.rect.height + 8;
  const left = iframeOffset.left + selection.rect.x;

  const elementLabel = extractLabel(selection);

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-label={`New comment on ${elementLabel}`}
      className="absolute z-30 w-[20rem] max-w-[calc(100vw-2rem)] rounded-md border border-border bg-popover text-popover-foreground shadow-lg"
      style={{ top, left }}
      // Stop clicks inside the overlay from bubbling up to the
      // canvas's iframe handlers — without this, clicking the
      // textarea could be interpreted as a fresh comment-mode
      // pick on an underlying element.
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Header — element label + close affordance. */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-2 border-b border-border/60">
        <span className="flex-1 truncate text-[11px] font-medium text-foreground">
          New comment on <span className="font-semibold">{elementLabel}</span>
          {selection.componentName && (
            <Badge
              variant="secondary"
              className="ml-1.5 font-mono text-[10px] px-1.5 py-0"
            >
              {selection.componentName}
            </Badge>
          )}
        </span>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancel comment"
          className="h-5 w-5 inline-flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 [&_svg]:size-3"
        >
          <X />
        </button>
      </div>

      {/* Body — avatar + textarea. */}
      <div className="flex gap-2 px-3 pt-3">
        <Avatar className="h-7 w-7 shrink-0">
          {currentUser.avatarUrl && (
            <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
          )}
          <AvatarFallback className="text-[11px]">{initials}</AvatarFallback>
        </Avatar>
        <Textarea
          ref={textareaRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              (e.metaKey || e.ctrlKey) &&
              canSubmit
            ) {
              e.preventDefault();
              handleSubmit();
            } else if (e.key === "Escape") {
              e.preventDefault();
              onCancel();
            }
          }}
          placeholder="What's on your mind about this?"
          rows={3}
          className="flex-1 min-h-0 text-xs"
        />
      </div>

      {/* Footer — actions. Cmd/Ctrl-Enter hint stays subtle so it
          doesn't compete with the primary Send button. */}
      <div className="flex items-center justify-between gap-2 px-3 pb-3 pt-2">
        <span className="text-[10px] text-muted-foreground">
          ⌘↵ to send
        </span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            <Send className="h-3 w-3" />
            {submitting ? "Sending…" : "Post"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function extractLabel(selection: StudioSelection): string {
  const sel = selection as StudioSelection & { name?: string };
  return (
    sel.name ||
    selection.componentName ||
    selection.part ||
    selection.tag ||
    "element"
  );
}
