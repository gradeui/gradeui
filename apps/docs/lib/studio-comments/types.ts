/**
 * Studio Comments — types.
 *
 * Comment threads are positional: anchored to a specific element
 * inside a screen via the element's `data-gds-instance-id`. They
 * persist across `appSource` changes — when the screen regenerates,
 * any thread whose instance-id is still present in the live DOM
 * stays visible; threads whose element disappeared are kept in
 * storage (so they can come back if the user undoes) but hidden
 * from the panel until/unless the element returns.
 *
 * Threads belong to a screen (`designId`) and live inside a project
 * (`projectId`). Permission to read / write comments rides on the
 * project's `access` list via the standard `useCanAccess` resolver
 * — viewers can read every thread; only editors + owners can post.
 *
 * Replies are one-level. A `parentCommentId` of `undefined` means
 * top-level (the thread starter or a top-level follow-up); a
 * non-null parentCommentId means "reply to that". The renderer
 * indents replies once and rejects further nesting; that's a v1
 * scope decision, not a schema constraint — the field could
 * accommodate deeper trees later.
 *
 * Reactions (likert / yes-no / emoji) are stubbed on `Comment` but
 * have no UI today. They're an array rather than a map so the same
 * user can carry multiple reaction kinds (a thumbs-up AND a "agree"
 * on the same comment) — same shape Slack / Linear / Notion all
 * land on.
 */

/** A reaction on a comment. v1 has no UI for these; the field
 *  exists so the schema doesn't churn when likert / yes-no / emoji
 *  responses land. */
export interface CommentReaction {
  userId: string;
  /** "thumbs-up" | "thumbs-down" | "agree" | "disagree" | "yes" |
   *  "no" | a likert score (e.g. "likert:3" out of 5) — kept as a
   *  loose string so the catalogue can grow without a migration. */
  kind: string;
  createdAt: number;
}

export type CommentThreadStatus = "open" | "resolved";

/** Top-level conversation tied to one element on one screen. */
export interface CommentThread {
  id: string;
  /** Which screen this thread lives on. */
  designId: string;
  /** Which project the screen belongs to. Denormalised onto the
   *  thread so listing all of a project's comments doesn't require
   *  joining through designs. Real DB will likely keep the same
   *  denorm + add an index on (project_id, design_id). */
  projectId: string;
  /** The element this thread anchors to. Carries whichever stable
   *  identifier was available at create time:
   *
   *  - **`data-gds-source-id`** (preferred) — stamped on every
   *    PascalCase JSX node by `prepareAppSource`. Survives
   *    re-renders as long as the JSX shape doesn't change; the
   *    common case for "I commented on this Header".
   *  - **`data-gds-instance-id`** — stamped on per-iteration
   *    entries inside `.map()` loops. Used when sourceId is
   *    ambiguous (e.g. one JSX node renders N rows; instanceId
   *    differentiates them).
   *
   *  The matching `anchorKind` field tells the resolver which
   *  attribute to look up. Stale-detection scans the live
   *  appSource for the right attribute literal — present means
   *  thread shows, absent means thread surfaces under the Stale
   *  filter. */
  anchorId: string;
  /** Which attribute the anchor came from — drives stale-
   *  detection's attribute lookup. */
  anchorKind: "source" | "instance";
  /** Human-friendly label for the anchored element — typically
   *  the user-supplied `data-gds-name`, falling back to the
   *  component name (e.g. "Header / Button"). Stored at create
   *  time so the comments panel can still render a sensible row
   *  when the element is currently absent from the DOM. */
  elementLabel: string;
  /** Component tag at the time of creation. Useful when no
   *  data-gds-name is set; surfaces in the thread header as a
   *  monospace tag. */
  componentName?: string;
  status: CommentThreadStatus;
  /** Author of the thread (= author of the first Comment in it). */
  createdBy: string;
  createdAt: number;
  /** Set when status flips to `resolved`. Tracked separately so
   *  we know who resolved it (audit + filter UI). */
  resolvedBy?: string;
  resolvedAt?: number;
}

/** A single message inside a thread — including the thread's
 *  opening message. */
export interface Comment {
  id: string;
  threadId: string;
  /** Top-level comments in the thread (including the opener)
   *  carry `undefined`. Replies set this to the id of the
   *  comment they're replying to.
   *
   *  v1 enforces "one level of replies" at the UI level — render
   *  only opens-level + their direct replies, no nested deeper. */
  parentCommentId?: string;
  authorId: string;
  body: string;
  createdAt: number;
  /** Set on every body edit so the UI can show "edited" without
   *  diffing. Null on the original. */
  editedAt?: number;
  reactions?: CommentReaction[];
}

/** Convenience shape returned by `listThreads` — the thread row
 *  plus its messages, sorted by createdAt ascending. The storage
 *  adapter denormalises this so callers don't have to thread two
 *  queries through React state. */
export interface CommentThreadWithMessages {
  thread: CommentThread;
  comments: Comment[];
}
