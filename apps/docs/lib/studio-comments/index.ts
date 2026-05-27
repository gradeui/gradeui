/**
 * Studio comments — public entry. Re-exports the type surface;
 * storage methods sit on `StudioStorage` itself (next to
 * projects, teams, users) rather than living in a separate
 * factory.
 */

export type {
  Comment,
  CommentReaction,
  CommentThread,
  CommentThreadStatus,
  CommentThreadWithMessages,
} from "./types";

/** Mint a short id for a thread or comment. Same shape pattern
 *  as the other id minters across the storage layer (short prefix
 *  + base36 timestamp + short random) so an `ct-...` reads as
 *  obviously a comment-thread, `cm-...` as a comment. */
export function nextThreadId(): string {
  return (
    "ct-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
  );
}

export function nextCommentId(): string {
  return (
    "cm-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
  );
}
