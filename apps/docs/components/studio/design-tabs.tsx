"use client";

/**
 * DesignTabs — thin strip of per-design tabs that sits above the three-column
 * studio workspace. Each tab represents an independent design slot; switching
 * tabs changes which chat + preview are active while leaving the working
 * theme untouched.
 *
 * Interaction model:
 *   - Click a tab → activate it.
 *   - Double-click the name → inline rename.
 *   - Hover → reveal an (×) close button (when there's more than one design).
 *   - Click the (+) on the right → new blank design, becomes active.
 *
 * Visual deliberately kept low-chrome. The whole strip is ~28px tall so the
 * three work columns still feel like the star of the show.
 */

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Copy, Pencil, Plus, X } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@gradeui/ui";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Design } from "@/lib/studio-designs";

interface DesignTabsProps {
  designs: Design[];
  activeId: string;
  onActivate: (id: string) => void;
  onAdd: () => void;
  onClose: (id: string) => void;
  onRename: (id: string, name: string) => void;
  /** Duplicate an existing design. Wiring-up at page level decides
   *  whether appSource is copied; the tabs component just routes the
   *  request. Optional so callers that don't want duplication can omit
   *  it — the icon will be hidden in that case. */
  onDuplicate?: (id: string) => void;
  /** Open the reference-layout / paste-code picker. When provided, a
   *  "Starters" affordance renders alongside "+ New" + "Duplicate"
   *  (they're all "add a screen" actions, so they belong together).
   *  Omit to hide the button entirely — the chrome stays clean when
   *  the host doesn't want the starter picker reachable from here. */
  onStartFromLayout?: () => void;
  /** Optional content rendered at the far-right of the strip
   *  (pushed via ml-auto). Used by the canvas to dock the viewport
   *  picker alongside the screen tabs, keeping mobile/tablet/desktop
   *  toggles close to the canvas they affect. */
  rightSlot?: React.ReactNode;
  /** False when the parent has hit its design cap. Disables the "New"
   *  and "Duplicate" affordances and surfaces a tooltip explaining
   *  why. */
  canAddMore?: boolean;
  className?: string;
}

export function DesignTabs({
  designs,
  activeId,
  onActivate,
  onAdd,
  onClose,
  onRename,
  onDuplicate,
  onStartFromLayout,
  rightSlot,
  canAddMore = true,
  className,
}: DesignTabsProps) {
  // Confirm-before-close lives here (rather than at page level) so the
  // delete contract stays a single `onClose(id)` call from parent's
  // perspective. `pendingDeleteId` holds the tab the user clicked ×
  // on; the dialog resolves it either by invoking the parent's
  // onClose (confirm) or dropping it (cancel). A design that cannot
  // be closed (last one) never reaches here — DesignTab's × only
  // renders when `canClose` is true.
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const pendingDesign =
    pendingDeleteId === null
      ? null
      : (designs.find((d) => d.id === pendingDeleteId) ?? null);

  const confirmDelete = () => {
    if (pendingDeleteId) onClose(pendingDeleteId);
    setPendingDeleteId(null);
  };

  return (
    <div
      className={cn(
        "flex items-center gap-1 border-b border-border bg-muted/30 px-3 overflow-x-auto",
        className
      )}
      role="tablist"
      aria-label="Designs"
    >
      {designs.map((d) => (
        <DesignTab
          key={d.id}
          design={d}
          active={d.id === activeId}
          canClose={designs.length > 1}
          onActivate={() => onActivate(d.id)}
          onClose={() => setPendingDeleteId(d.id)}
          onRename={(name) => onRename(d.id, name)}
        />
      ))}
      <button
        type="button"
        onClick={onAdd}
        disabled={!canAddMore}
        className={cn(
          "ml-1 shrink-0 flex items-center gap-1 px-2 py-1 rounded text-[11px]",
          "text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors",
          "disabled:opacity-40 disabled:pointer-events-none"
        )}
        aria-label="Add design"
        title={canAddMore ? "Add design" : "Design cap reached"}
      >
        <Plus className="h-3 w-3" />
        New
      </button>
      {onDuplicate && (
        <button
          type="button"
          onClick={() => onDuplicate(activeId)}
          disabled={!canAddMore}
          className={cn(
            "shrink-0 flex items-center gap-1 px-2 py-1 rounded text-[11px]",
            "text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors",
            "disabled:opacity-40 disabled:pointer-events-none"
          )}
          aria-label="Duplicate active design"
          title={
            canAddMore
              ? "Duplicate active design — copies JSX, fresh chat"
              : "Design cap reached"
          }
        >
          <Copy className="h-3 w-3" />
          Duplicate
        </button>
      )}
      {onStartFromLayout && (
        <button
          type="button"
          onClick={onStartFromLayout}
          disabled={!canAddMore}
          className={cn(
            "shrink-0 flex items-center gap-1 px-2 py-1 rounded text-[11px]",
            "text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors",
            "disabled:opacity-40 disabled:pointer-events-none"
          )}
          aria-label="Start from a reference layout"
          title={
            canAddMore
              ? "Start a new screen from a reference layout or pasted JSX"
              : "Design cap reached"
          }
        >
          <Sparkles className="h-3 w-3" />
          Starters
        </button>
      )}
      {rightSlot && (
        // ml-auto pushes the slot to the far right of the flex row.
        // The wrapping div lets the slot host whatever it wants
        // (a ToggleGroup for viewport width, a button cluster,
        // anything) without leaking flex assumptions into the slot.
        <div className="ml-auto flex items-center shrink-0">
          {rightSlot}
        </div>
      )}

      {/* Delete-confirm modal. Reused across every tab because only
          one can be in flight at a time (you can't × two tabs
          simultaneously). Open state is derived from
          `pendingDesign !== null` — clean tri-state with cancel/close
          just clearing the id. */}
      <Dialog
        open={pendingDesign !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteId(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" aria-hidden />
              Delete {pendingDesign?.name ?? "design"}?
            </DialogTitle>
            <DialogDescription>
              This will discard the screen and its chat history. The
              working theme stays untouched. You can{"\u2019"}t undo
              this.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPendingDeleteId(null)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface DesignTabProps {
  design: Design;
  active: boolean;
  canClose: boolean;
  onActivate: () => void;
  onClose: () => void;
  onRename: (name: string) => void;
}

function DesignTab({
  design,
  active,
  canClose,
  onActivate,
  onClose,
  onRename,
}: DesignTabProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(design.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== design.name) onRename(trimmed);
    else setDraft(design.name);
    setEditing(false);
  };

  const beginRename = () => {
    setDraft(design.name);
    setEditing(true);
  };

  return (
    <div
      role="tab"
      aria-selected={active}
      onClick={onActivate}
      onDoubleClick={(e) => {
        e.stopPropagation();
        beginRename();
      }}
      // A title tooltip is the cheapest way to make "double-click to
      // rename" discoverable without adding permanent chrome to every
      // tab. The Pencil affordance inside reinforces the hint on hover
      // for users who don't pause long enough to trigger the title.
      title={
        editing
          ? undefined
          : active
            ? "Double-click to rename"
            : `${design.name} — click to activate, double-click to rename`
      }
      className={cn(
        "group shrink-0 flex items-center gap-1 px-2.5 py-1 text-[11px] rounded-t-md border-t border-x border-transparent cursor-pointer",
        "-mb-px", // overlap the bottom border of the strip on the active tab
        active
          ? "bg-background text-foreground border-border"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
      )}
    >
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            } else if (e.key === "Escape") {
              e.preventDefault();
              setDraft(design.name);
              setEditing(false);
            }
          }}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "bg-transparent border-b border-primary outline-none",
            "w-[120px] text-[11px]"
          )}
        />
      ) : (
        <span className="max-w-[180px] truncate">{design.name}</span>
      )}
      {!editing && (
        // Rename affordance — hidden by default, appears on hover/focus
        // within the tab so the tab strip stays low-chrome. Clicking it
        // is functionally identical to double-clicking the label; we
        // expose both because power users expect dbl-click and casual
        // users expect a visible icon.
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            beginRename();
          }}
          className={cn(
            "h-3.5 w-3.5 rounded-sm flex items-center justify-center",
            "opacity-0 group-hover:opacity-70 hover:!opacity-100 hover:bg-muted transition-opacity",
            "focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40"
          )}
          aria-label={`Rename ${design.name}`}
          title="Rename"
        >
          <Pencil className="h-2.5 w-2.5" />
        </button>
      )}
      {canClose && !editing && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className={cn(
            "h-3.5 w-3.5 rounded-sm flex items-center justify-center",
            "opacity-0 group-hover:opacity-100 hover:bg-muted transition-opacity",
            active && "opacity-70"
          )}
          aria-label={`Close ${design.name}`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
