"use client";

/**
 * TagManagerDialog — the single tag-management surface (v1 of the
 * STUDIO-TAGS registry editor, built the night Ali said "not really
 * intuitive but I suppose they work").
 *
 * One panel, every tag in the project: types with their cardinality and
 * chart-ramp colour, values with usage counts, inline rename for BOTH
 * (value rename = the same bulk rewrite as the group-header pencil;
 * type rename rewrites the facet across every screen), and
 * delete-everywhere. v1 manages what EXISTS — pure operations over the
 * designs array, no `projects.tag_defs` storage yet. When the T2
 * registry lands (descriptions, strict values, milestone semantics,
 * rename propagation into share scopes) it slots in here.
 */

import { useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import {
  Badge,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@gradeui/ui";
import type { Design } from "@/lib/studio-designs";
import { collectTagFacets, tagTypeColor } from "@/lib/studio-view-prefs";

interface TagManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  designs: Design[];
  /** Rename a VALUE across every carrying screen (single types dedupe
   *  when the target already exists). Same handler as the group-header
   *  pencil. */
  onRenameValue: (type: string, from: string, to: string) => void;
  /** Rename a TYPE (the whole facet) across every carrying screen. */
  onRenameType?: (from: string, to: string) => void;
  /** Remove a type:value from every carrying screen. */
  onDeleteValue: (type: string, value: string) => void;
}

type EditTarget =
  | { kind: "value"; type: string; value: string }
  | { kind: "type"; type: string }
  | null;

export function TagManagerDialog({
  open,
  onOpenChange,
  designs,
  onRenameValue,
  onRenameType,
  onDeleteValue,
}: TagManagerDialogProps) {
  const facets = useMemo(() => collectTagFacets(designs), [designs]);
  const [editing, setEditing] = useState<EditTarget>(null);
  const [draft, setDraft] = useState("");

  const beginEdit = (target: Exclude<EditTarget, null>, current: string) => {
    setEditing(target);
    setDraft(current);
  };
  const commitEdit = () => {
    const to = draft.trim();
    if (editing && to) {
      if (editing.kind === "value" && to !== editing.value) {
        onRenameValue(editing.type, editing.value, to);
      } else if (
        editing.kind === "type" &&
        onRenameType &&
        to !== editing.type
      ) {
        // Types are lowercase by the parse grammar — keep the invariant.
        onRenameType(editing.type, to.toLowerCase());
      }
    }
    setEditing(null);
    setDraft("");
  };

  const inlineInput = (
    <input
      autoFocus
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          commitEdit();
        } else if (e.key === "Escape") {
          setEditing(null);
        }
      }}
      onBlur={commitEdit}
      className="min-w-0 flex-1 border-b border-primary bg-transparent text-xs outline-none"
    />
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Tags</DialogTitle>
          <DialogDescription>
            Every tag in this project. Rename a value or a whole type and
            it rewrites on every screen; delete removes it everywhere.
            Add tags from the screen info panel or the list view&apos;s
            bulk bar (<code className="text-[11px]">type:value</code> —
            a bare word becomes a general label).
          </DialogDescription>
        </DialogHeader>

        <div className="flex max-h-[55vh] flex-col gap-4 overflow-y-auto pr-1">
          {facets.length === 0 && (
            <p className="py-6 text-center text-xs text-muted-foreground">
              No tags yet. Tag a screen and it appears here.
            </p>
          )}
          {facets.map((facet) => (
            <div key={facet.type} className="flex flex-col gap-1">
              {/* Type row — colour dot, name (inline-renameable except
                  the default label bucket), cardinality. */}
              <div className="group flex h-7 items-center gap-2 border-b border-border pb-1">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: tagTypeColor(facet.type) }}
                />
                {editing?.kind === "type" && editing.type === facet.type ? (
                  inlineInput
                ) : (
                  <span className="text-xs font-semibold text-foreground">
                    {facet.type}
                  </span>
                )}
                <Badge
                  variant="outline"
                  className="h-4 px-1.5 text-[9px] font-normal text-muted-foreground"
                >
                  {facet.single ? "one per screen" : "multiple per screen"}
                </Badge>
                {onRenameType &&
                  facet.type !== "label" &&
                  !(editing?.kind === "type" && editing.type === facet.type) && (
                    <button
                      type="button"
                      onClick={() =>
                        beginEdit({ kind: "type", type: facet.type }, facet.type)
                      }
                      className="ml-auto flex h-5 w-5 items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-muted hover:text-foreground [&_svg]:size-3"
                      title={`Rename the "${facet.type}" type on every screen`}
                    >
                      <Pencil />
                    </button>
                  )}
              </div>

              {/* Value rows — name, count, rename, delete. */}
              {facet.values.map(({ value, count }) => {
                const isEditing =
                  editing?.kind === "value" &&
                  editing.type === facet.type &&
                  editing.value === value;
                return (
                  <div
                    key={value}
                    className="group flex h-7 items-center gap-2 rounded px-1 hover:bg-muted/50"
                  >
                    {isEditing ? (
                      inlineInput
                    ) : (
                      <span className="min-w-0 flex-1 truncate text-xs text-foreground">
                        {value}
                      </span>
                    )}
                    <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                      {count} screen{count === 1 ? "" : "s"}
                    </span>
                    {!isEditing && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            beginEdit(
                              { kind: "value", type: facet.type, value },
                              value,
                            )
                          }
                          className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-muted hover:text-foreground [&_svg]:size-3"
                          title="Rename on every screen"
                        >
                          <Pencil />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteValue(facet.type, value)}
                          className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-muted hover:text-destructive [&_svg]:size-3"
                          title="Remove from every screen"
                        >
                          <Trash2 />
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <p className="text-[10px] leading-relaxed text-muted-foreground">
          Renames and deletes don&apos;t follow into existing share links
          scoped to a tag — regenerate those links after renaming (the
          T2 registry will propagate automatically).
        </p>
      </DialogContent>
    </Dialog>
  );
}
