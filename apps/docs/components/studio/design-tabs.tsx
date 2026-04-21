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
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Design } from "@/lib/studio-designs";

interface DesignTabsProps {
  designs: Design[];
  activeId: string;
  onActivate: (id: string) => void;
  onAdd: () => void;
  onClose: (id: string) => void;
  onRename: (id: string, name: string) => void;
  className?: string;
}

export function DesignTabs({
  designs,
  activeId,
  onActivate,
  onAdd,
  onClose,
  onRename,
  className,
}: DesignTabsProps) {
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
          onClose={() => onClose(d.id)}
          onRename={(name) => onRename(d.id, name)}
        />
      ))}
      <button
        type="button"
        onClick={onAdd}
        className={cn(
          "ml-1 shrink-0 flex items-center gap-1 px-2 py-1 rounded text-[11px]",
          "text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
        )}
        aria-label="Add design"
        title="Add design"
      >
        <Plus className="h-3 w-3" />
        New
      </button>
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

  return (
    <div
      role="tab"
      aria-selected={active}
      onClick={onActivate}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setDraft(design.name);
        setEditing(true);
      }}
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
