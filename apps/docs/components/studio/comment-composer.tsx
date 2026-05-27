"use client";

/**
 * CommentComposer — shared input surface for "new thread" + "reply".
 *
 * Renders a Textarea + Send button. Auto-focuses on mount (so the
 * canvas-pick → composer-open flow lands the caret in the field
 * with no extra click). Cmd/Ctrl-Enter submits; Escape cancels
 * (consumer wires the cancel handler if applicable).
 *
 * Composed from gradeui primitives only — no new DS atoms needed.
 */

import * as React from "react";
import { Send } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage, Button, Textarea } from "@gradeui/ui";

interface CommentComposerProps {
  /** Avatar + display name of the user submitting. Lets the
   *  composer show "posting as X" so the user can tell who
   *  they're acting as (especially under impersonation). */
  user: { name: string; avatarUrl?: string };
  /** Placeholder copy. Different for new thread vs reply. */
  placeholder?: string;
  /** Submit handler. Returning a promise lets the composer show a
   *  loading state during the round-trip. */
  onSubmit: (body: string) => Promise<void> | void;
  /** Optional cancel handler — when set, an Escape press calls it
   *  and a Cancel button shows next to Send. */
  onCancel?: () => void;
  /** Label for the submit button. Defaults to "Comment". */
  submitLabel?: string;
  /** Autofocus the textarea on mount. Default true. */
  autoFocus?: boolean;
}

export function CommentComposer({
  user,
  placeholder = "Add a comment…",
  onSubmit,
  onCancel,
  submitLabel = "Comment",
  autoFocus = true,
}: CommentComposerProps) {
  const [body, setBody] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const initials = React.useMemo(() => {
    const parts = user.name.trim().split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
  }, [user.name]);

  const canSubmit = body.trim().length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onSubmit(body.trim());
      setBody("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Avatar className="h-7 w-7 shrink-0">
        {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
        <AvatarFallback className="text-[11px]">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex flex-1 flex-col gap-2 min-w-0">
        <Textarea
          autoFocus={autoFocus}
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
            } else if (e.key === "Escape" && onCancel) {
              e.preventDefault();
              onCancel();
            }
          }}
          placeholder={placeholder}
          rows={2}
          className="min-h-0 text-xs"
        />
        <div className="flex items-center justify-end gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
            >
              Cancel
            </Button>
          )}
          <Button
            type="button"
            variant="default"
            size="sm"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            <Send className="h-3 w-3" />
            {submitting ? "Sending…" : submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
