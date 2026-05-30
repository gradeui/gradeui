/**
 * Feedback dialog — REMOVED.
 *
 * See feedback-button.tsx for context. Tombstone kept so stale
 * imports type-check; renders nothing.
 */

interface FeedbackDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function FeedbackDialog(_props: FeedbackDialogProps): null {
  return null;
}
