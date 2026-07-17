"use client";

/**
 * CommentsTab — Comments tab content inside StudioRightTabs.
 *
 * Lists every thread on the active screen, plus a composer at the
 * top that appears when there's a current element selection (from
 * the canvas's Select mode). The composer creates a new thread
 * anchored to that element's instanceId.
 *
 * v1 surfaces:
 *
 *   - Filter toggle: open / resolved / stale. Defaults to "open".
 *   - "Comment on selected element" composer when a selection
 *     exists and the user has write access.
 *   - Empty state guidance when there's nothing to show.
 *
 * Permission gating: viewers (read-only) see threads + replies but
 * not the composer or any mutating affordances. The card's overflow
 * menu also hides for them.
 *
 * Stale detection: a thread is "stale" when its anchored
 * instanceId no longer appears in the current appSource. We don't
 * delete stale threads — they reappear if the user undoes to a
 * version where the element is back — but they hide from the
 * default filter so the visible list reflects the live screen.
 */

import * as React from "react";
import { MessageSquarePlus, MousePointerClick } from "lucide-react";

import {
  Button,
  ToggleGroup,
  ToggleGroupItem,
} from "@gradeui/ui";

import type { StudioSelection } from "@/lib/chat-sandpack";
import type { CommentThreadWithMessages } from "@/lib/studio-storage";
import type { User } from "@/lib/studio-users";

import { CommentComposer } from "./comment-composer";
import { CommentThreadCard } from "./comment-thread-card";

/** Two-state filter. A thread is either open (active conversation)
 *  or resolved (wrapped up). "Stale" used to be a third state —
 *  threads whose anchored element wasn't in the rendered DOM — but
 *  the detection was fragile (string-matching against the RAW
 *  appSource, which doesn't contain the compile-time-stamped
 *  data-gds-source-id attributes, so every thread looked stale).
 *  Staleness now surfaces naturally on the canvas: the pin
 *  overlay queries iframe DOM and simply doesn't render a pin
 *  when the element is gone. */
type CommentsFilter = "open" | "resolved";

interface CommentsTabProps {
  /** Threads for the active screen, pre-sorted (newest-first by
   *  the storage adapter). */
  threads: CommentThreadWithMessages[];
  /** Live appSource for the active screen. Used to detect which
   *  threads still have their anchored element in the DOM. Null
   *  while loading. */
  appSource: string | null;
  /** Current canvas selection (from Select mode). When present +
   *  the user can write, the composer renders at the top of the
   *  tab pre-anchored to that element. */
  selection: StudioSelection | null;
  /** Lookup user metadata by id. Used by thread cards for author
   *  avatars + display names. */
  getUser: (id: string) => User | undefined;
  /** Current effective user (impersonation-aware). */
  currentUser: User;
  /** Whether the user has write access on the active project.
   *  Drives composer visibility and any mutating affordance. */
  canWrite: boolean;
  /**
   * Monotonic counter that triggers auto-open of the new-thread
   * composer. Bumped by the page when a Comment-mode pick lands
   * — the tab watches the value via an effect, and each new tick
   * (paired with a valid writeable selection) flips composing on.
   * Using a counter rather than a boolean lets a second pick
   * re-open the composer without the consumer having to reset
   * the flag.
   */
  composerOpenTrigger?: number;

  // Handlers — parent owns storage writes + state refresh.
  onCreateThread: (input: {
    anchorId: string;
    anchorKind: "source" | "instance";
    elementLabel: string;
    componentName?: string;
    body: string;
  }) => Promise<void>;
  onReply: (
    threadId: string,
    parentCommentId: string | undefined,
    body: string,
  ) => Promise<void>;
  onResolve: (threadId: string) => void;
  onReopen: (threadId: string) => void;
  onDeleteThread: (threadId: string) => void;
  onDeleteComment: (commentId: string) => void;
  /** Optional — focus an element in the canvas by instanceId.
   *  When wired, thread cards' element label becomes a button that
   *  recalls the element. */
  onFocusElement?: (instanceId: string) => void;
}

export function CommentsTab({
  threads,
  appSource,
  selection,
  getUser,
  currentUser,
  canWrite,
  composerOpenTrigger,
  onCreateThread,
  onReply,
  onResolve,
  onReopen,
  onDeleteThread,
  onDeleteComment,
  onFocusElement,
}: CommentsTabProps) {
  const [filter, setFilter] = React.useState<CommentsFilter>("open");
  const [composing, setComposing] = React.useState(false);

  // Resolve the anchor for the current selection — prefer the
  // stable sourceId (set on every PascalCase JSX node) and fall
  // back to instanceId for templated array entries. Memoised so
  // the gate effects + the composer render compare against a
  // stable value.
  const selectionAnchor = React.useMemo(
    () => resolveAnchor(selection),
    [selection],
  );

  // Auto-open the composer whenever the parent bumps the trigger
  // (= Comment mode picked an element). Guarded on having a
  // writeable selection with an anchor — so an early trigger
  // before the selection state lands doesn't open a composer
  // with nothing anchored.
  React.useEffect(() => {
    if (composerOpenTrigger === undefined) return;
    if (composerOpenTrigger === 0) return; // initial mount, not a real bump
    if (!canWrite || !selectionAnchor) return;
    setComposing(true);
    setFilter("open");
  }, [composerOpenTrigger, canWrite, selectionAnchor]);

  const filtered = React.useMemo(
    () => threads.filter((t) => t.thread.status === filter),
    [threads, filter],
  );

  const openCount = threads.filter(
    (t) => t.thread.status === "open",
  ).length;
  const resolvedCount = threads.filter(
    (t) => t.thread.status === "resolved",
  ).length;

  return (
    <div
      className="flex flex-col h-full overflow-y-auto"
      data-lenis-prevent
    >
      <div className="flex flex-col gap-3 p-3">
        {/* Filter strip. Counts in parens so the user knows what's
            hidden behind each bucket. */}
        <ToggleGroup
          type="single"
          size="sm"
          value={filter}
          onValueChange={(v: string) => {
            if (v === "open" || v === "resolved") setFilter(v);
          }}
          className="self-start"
        >
          <ToggleGroupItem value="open">
            Open {openCount > 0 && `(${openCount})`}
          </ToggleGroupItem>
          <ToggleGroupItem value="resolved">
            Resolved {resolvedCount > 0 && `(${resolvedCount})`}
          </ToggleGroupItem>
        </ToggleGroup>

        {/* Always-visible "start a thread" entry point. Three
            states:
              1. Read-only user → muted banner explaining viewer
                 access. No composer.
              2. Writer, no selection → entry shows "Select an
                 element to comment on" with a Select-mode hint.
                 Clicking it is a no-op (we don't own the canvas
                 from here) but the copy tells the user where to go.
              3. Writer with selection (with instanceId) → click
                 the entry to open the composer, anchored to that
                 element.
            Making this always visible (rather than gating the
            whole entry on selection) means the user sees SOMETHING
            actionable in the Comments tab the first time they
            land on it. */}
        {!canWrite ? (
          <p className="text-[11px] text-muted-foreground rounded-md border border-border/60 bg-muted/30 px-2.5 py-1.5">
            You have read-only access — you can read threads but
            can't add comments.
          </p>
        ) : composing && selection && selectionAnchor ? (
          <NewThreadComposer
            currentUser={currentUser}
            selection={selection}
            onSubmit={async (body) => {
              await onCreateThread({
                anchorId: selectionAnchor.id,
                anchorKind: selectionAnchor.kind,
                elementLabel: extractLabel(selection),
                componentName: selection.componentName,
                body,
              });
              setComposing(false);
            }}
            onCancel={() => setComposing(false)}
          />
        ) : selection && selectionAnchor ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setComposing(true)}
            className="justify-start"
          >
            <MessageSquarePlus className="h-3.5 w-3.5" />
            Comment on <SelectionPill selection={selection} />
          </Button>
        ) : (
          <div className="flex items-start gap-2 rounded-md border border-dashed border-border bg-muted/30 px-3 py-2.5">
            <MousePointerClick
              className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <div className="flex-1 text-[11px] text-muted-foreground">
              <p className="font-medium text-foreground">
                Pick an element to comment on.
              </p>
              <p className="mt-0.5">
                Click <span className="font-medium text-foreground">Select</span>{" "}
                in the canvas toolbar, then click any component on the
                screen. Its label appears here and the composer opens.
              </p>
            </div>
          </div>
        )}

        {filtered.length === 0 ? (
          <EmptyState
            filter={filter}
            hasSelection={!!selection?.instanceId}
            canWrite={canWrite}
          />
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((data) => (
              <CommentThreadCard
                key={data.thread.id}
                data={data}
                getUser={getUser}
                currentUser={currentUser}
                canWrite={canWrite}
                onReply={onReply}
                onResolve={onResolve}
                onReopen={onReopen}
                onDeleteThread={onDeleteThread}
                onDeleteComment={onDeleteComment}
                onFocusElement={onFocusElement}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Wraps the composer with a header that surfaces the anchor —
 *  the user can visually confirm "I'm commenting on Button" before
 *  hitting Send. */
function NewThreadComposer({
  currentUser,
  selection,
  onSubmit,
  onCancel,
}: {
  currentUser: User;
  selection: StudioSelection;
  onSubmit: (body: string) => Promise<void>;
  onCancel: () => void;
}) {
  return (
    <div className="rounded-md border border-primary/40 bg-primary/5 p-3 flex flex-col gap-2">
      <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
        <MessageSquarePlus className="h-3 w-3 text-primary" />
        Comment on <SelectionPill selection={selection} />
      </div>
      <CommentComposer
        user={currentUser}
        placeholder="What's on your mind about this element?"
        submitLabel="Post"
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    </div>
  );
}

/** Inline pill showing which element a new comment is anchored to.
 *  Used twice — once on the empty composer trigger, once inside
 *  the active composer. Keeps the label consistent between both. */
function SelectionPill({ selection }: { selection: StudioSelection }) {
  const label = extractLabel(selection);
  return (
    <span className="font-medium text-foreground">
      {label}
      {selection.componentName && (
        <span className="ml-1 font-mono text-[10px] text-muted-foreground">
          &lt;{selection.componentName}&gt;
        </span>
      )}
    </span>
  );
}

/** Resolve the best stable anchor for a selection. Prefers
 *  `sourceId` (stamped on every PascalCase JSX node by
 *  `prepareAppSource`) because it survives re-renders even when
 *  the model touches surrounding markup. Falls back to
 *  `instanceId` (per-iteration id inside `.map()` loops). Returns
 *  null when the selection has neither — e.g. an ad-hoc click on
 *  a plain `<div>` that the walker didn't stamp. */
function resolveAnchor(
  selection: StudioSelection | null,
): { id: string; kind: "source" | "instance" } | null {
  if (!selection) return null;
  if (selection.sourceId !== undefined) {
    return { id: selection.sourceId, kind: "source" };
  }
  if (selection.instanceId !== undefined) {
    return { id: selection.instanceId, kind: "instance" };
  }
  // Nearest-ancestor fallback (registry-module screens): DS internals
  // carry no id of their own — anchor the thread to the enclosing
  // module component (the sidebar itself, the header) instead of
  // silently refusing the composer. Comment-only; never drives edits.
  const anchor = (
    selection as StudioSelection & { anchorSourceId?: string }
  ).anchorSourceId;
  if (anchor !== undefined) {
    return { id: anchor, kind: "source" };
  }
  return null;
}

function extractLabel(selection: StudioSelection): string {
  // Try the user-supplied data-gds-name first, then fall back to
  // the component tag, then to a generic "element" so the row is
  // never empty.
  const sel = selection as StudioSelection & { name?: string };
  return (
    sel.name ||
    selection.componentName ||
    selection.part ||
    "element"
  );
}

function EmptyState({
  filter,
}: {
  filter: CommentsFilter;
  hasSelection: boolean;
  canWrite: boolean;
}) {
  // The "no selection" guidance lives in the always-visible entry
  // point above the thread list; this empty state is just about
  // the current filter bucket being empty.
  const copy =
    filter === "open"
      ? "No open comments on this screen."
      : "No resolved comments yet.";
  return (
    <div className="rounded-md border border-dashed border-border bg-muted/10 px-3 py-6 text-center text-xs text-muted-foreground">
      {copy}
    </div>
  );
}
