"use client";

/**
 * ConfirmDeleteDialog — a focused, destructive-action confirmation.
 *
 * Built on the Dialog primitive (no AlertDialog in the kit yet). Used to
 * gate screen + project deletion in Studio so nothing is removed on a
 * single stray click. The `warning` slot carries the louder "this is
 * shared" message — deleting a shared screen breaks its live /s/ share and
 * any /e/ embeds, so that consequence is surfaced before the user commits.
 */

import * as React from "react";
import { TriangleAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface ConfirmDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  /** Optional prominent warning block (e.g. "this screen is shared"). */
  warning?: React.ReactNode;
  confirmLabel?: string;
  /** Disables the buttons + shows a working label while deletion runs. */
  busy?: boolean;
  onConfirm: () => void;
}

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  warning,
  confirmLabel = "Delete",
  busy = false,
  onConfirm,
}: ConfirmDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent layout="center" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {warning ? (
          <div className="flex gap-2.5 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <div className="text-foreground">{warning}</div>
          </div>
        ) : null}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={busy}>
            {busy ? "Deleting…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
