/**
 * Feedback button — REMOVED.
 *
 * The whole feedback feature was retired during the Supabase
 * cutover. It was tied to per-user GitHub OAuth + a "create issue
 * on the user's behalf" pattern that doesn't survive the move to
 * Supabase Auth (no per-user GitHub token).
 *
 * Keeping this file as a render-nothing tombstone so any stale
 * importer fails soft. Safe to delete entirely once no callers
 * reference it.
 */

export function FeedbackButton(): null {
  return null;
}
