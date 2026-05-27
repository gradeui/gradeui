"use client";

/**
 * NewProjectDialog — replaces the old `window.prompt` flow with a
 * proper form. Two fields:
 *
 *   - Name (required) — autofocused on open; Enter in the input
 *     submits.
 *   - Description (optional) — single-paragraph free text. Shown in
 *     the Projects menu as the project's secondary line when set;
 *     falls back to the screen count when empty.
 *
 * Composed from gradeui Dialog + Input + Textarea + Label + Button
 * primitives. The parent owns the open state + the create handler;
 * this component just collects + validates input.
 */

import * as React from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Textarea,
} from "@gradeui/ui";

interface NewProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Submit handler — the parent does the storage write + the
   *  switch-to-the-new-project dance. Returns a promise so the
   *  dialog can show a loading state during the round-trip if we
   *  ever wire a slow backend. */
  onCreate: (input: { name: string; description?: string }) => Promise<void> | void;
}

export function NewProjectDialog({
  open,
  onOpenChange,
  onCreate,
}: NewProjectDialogProps) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  // Reset the form whenever the dialog reopens — closing without
  // saving discards. (If we ever want "draft survives close" we'd
  // hold these in the parent.)
  React.useEffect(() => {
    if (open) {
      setName("");
      setDescription("");
      setSubmitting(false);
    }
  }, [open]);

  const canSubmit = name.trim().length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onCreate({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New project</DialogTitle>
          <DialogDescription>
            Projects group your screens, chat history, and theme.
            You can rename or delete anytime from project settings.
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-col gap-4 py-2"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-project-name">Name</Label>
            <Input
              id="new-project-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Untitled project"
              maxLength={80}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-project-description">
              Description{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Textarea
              id="new-project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this project is for"
              maxLength={240}
              rows={2}
              className="min-h-0"
            />
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {submitting ? "Creating…" : "Create project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
