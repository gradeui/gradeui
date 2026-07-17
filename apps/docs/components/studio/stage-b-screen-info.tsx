"use client";

/**
 * StageBScreenInfo — metadata view for the right column's Stage B.
 *
 * Replaces the old `StageBInspector` component-list as the DEFAULT
 * surface when a design has content but nothing is selected. The
 * inventory wasn't bad data, just wrong tone for the default: the
 * panel read as a developer / data-engineering view rather than
 * "details about this screen". This file owns the new top-of-panel
 * experience; the inventory is still reachable inside the
 * "Component inventory" accordion below the metadata.
 *
 * Surfaced metadata:
 *   - Name        — Design.name
 *   - Status      — editable select, draft / in_progress /
 *                   in_review / done; persists on Design.status
 *   - Project     — read-only label, project the screen belongs to
 *   - Revisions   — undo-history snapshot count
 *   - Created     — Design.createdAt (absolute date)
 *   - Updated     — Design.updatedAt (relative, "5 minutes ago")
 *
 * Everything is token-driven (CSS variables on muted-foreground /
 * border / etc); no hard-coded greys.
 */

import * as React from "react";
import { formatDistanceToNow } from "date-fns";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PropertyList } from "@/components/ui/property-list";
import { cn } from "@/lib/utils";

import {
  DESIGN_STATUSES,
  designStatusLabel,
  formatTag,
  parseTagInput,
  sameTag,
  type DesignStatus,
  type DesignTag,
} from "@/lib/studio-designs";

import { ComponentInventory } from "./stage-b-inspector";

export interface StageBScreenInfoProps {
  /** Active design's JSX source — passed straight to the inventory
   *  accordion. */
  appSource: string | null;
  /** Display name for the screen. */
  designName: string;
  /** Active design id. The Flow link chip copies the screen:<id> form —
   *  ids survive renames (screens WILL be renamed) and stay unique
   *  across same-named screens/projects. */
  designId?: string;
  /** Creation timestamp in epoch ms. Optional for legacy designs
   *  pre-dating the field. */
  createdAt?: number;
  /** Last mutation timestamp in epoch ms. Optional for legacy
   *  designs. */
  updatedAt?: number;
  /** Current lifecycle status — undefined normalises to "draft". */
  status?: DesignStatus;
  /** Snapshot count from the undo history hook. */
  revisions: number;
  /** Owning project's display name. Read-only on this surface;
   *  project metadata lives in the project settings sheet. */
  projectName: string;
  /** Patch status on the active design. Empty / no-op handler is
   *  fine — the select stays controlled either way. */
  onStatusChange: (status: DesignStatus) => void;
  /** Typed tags on the active design (STUDIO-TAGS T0). */
  tags?: DesignTag[];
  /** Project-wide tag vocabulary ("type:value" strings) — feeds the
   *  input's datalist so existing spellings autocomplete instead of
   *  drifting ("40 spellings of ranking"). The T2 registry replaces
   *  this with normalisation; until then, exact-match discipline via
   *  suggestion. */
  tagSuggestions?: string[];
  /** Replace the active design's tag set. Same persist path as
   *  onStatusChange (setDesigns → autosave). */
  onTagsChange?: (tags: DesignTag[]) => void;
  /** Free-form screen description — persists like status/tags (patch
   *  the design, autosave carries it). Shown in the rich list rows. */
  description?: string;
  onDescriptionChange?: (description: string) => void;
  className?: string;
}

/** Locale-aware, SSR-safe absolute date. Format is fixed (avoids
 *  relying on the runtime's default locale) so the rendered string
 *  matches on first paint and after hydration. */
function formatCreated(epoch: number): string {
  // 27 May 2026, 14:32
  return new Date(epoch).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Relative time, e.g. "5 minutes ago". date-fns is already pulled
 *  in via the date-picker; no extra dep. Wrapped in a try/catch
 *  because formatDistanceToNow throws on invalid dates and we'd
 *  rather render "—" than crash the panel. */
function formatRelative(epoch: number): string {
  try {
    return formatDistanceToNow(new Date(epoch), { addSuffix: true });
  } catch {
    return "—";
  }
}

export function StageBScreenInfo({
  appSource,
  designName,
  designId,
  createdAt,
  updatedAt,
  status,
  revisions,
  projectName,
  onStatusChange,
  tags,
  onTagsChange,
  description,
  onDescriptionChange,
  tagSuggestions,
  className,
}: StageBScreenInfoProps) {
  const effectiveStatus: DesignStatus = status ?? "draft";

  // Datalist id for the tag input's project-vocabulary autocomplete —
  // useId so multiple mounts (panel + future surfaces) don't collide.
  const tagListId = React.useId();
  // Suggest only what this design doesn't already carry.
  const applied = new Set((tags ?? []).map((t) => formatTag(t)));
  const openSuggestions = (tagSuggestions ?? []).filter(
    (s) => !applied.has(s),
  );

  // Description — draft-buffered (commit on blur / Cmd+Enter) so every
  // keystroke doesn't hit the autosave signature. Re-seeds on screen
  // switch via the key on the textarea below.
  const [descDraft, setDescDraft] = React.useState(description ?? "");
  React.useEffect(() => {
    setDescDraft(description ?? "");
  }, [designId, description]);
  const commitDesc = () => {
    if (!onDescriptionChange) return;
    const next = descDraft.trim();
    if (next !== (description ?? "")) onDescriptionChange(next);
  };

  // Tags editor (STUDIO-TAGS T0) — chips + a small add input.
  // "type:value" syntax ("section:rankings", "flow:walkthrough");
  // bare words land in the general "label" facet. Enter/comma commits.
  const [tagDraft, setTagDraft] = React.useState("");
  const commitTagDraft = () => {
    const parsed = parseTagInput(tagDraft);
    if (!parsed || !onTagsChange) return;
    const cur = tags ?? [];
    if (!cur.some((t) => sameTag(t, parsed))) {
      onTagsChange([...cur, parsed]);
    }
    setTagDraft("");
  };
  const removeTag = (tag: DesignTag) => {
    if (!onTagsChange) return;
    onTagsChange((tags ?? []).filter((t) => !sameTag(t, tag)));
  };

  // Brief "Copied ✓" feedback for the Flow link chip.
  const [copiedFlowLink, setCopiedFlowLink] = React.useState(false);

  // Tick the "updated X ago" string every minute so the panel
  // stays fresh while the user lingers. Cheap — one setInterval
  // bumping a render counter.
  const [, force] = React.useReducer((x: number) => x + 1, 0);
  React.useEffect(() => {
    const id = window.setInterval(() => force(), 60_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* Screen identity — quiet eyebrow + name, on the same section
          rhythm (border-/60) as the Display section above it. */}
      <section className="shrink-0 border-b border-border/60 px-3 pt-2.5 pb-2.5">
        <p className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">
          Screen
        </p>
        <h2 className="truncate text-sm font-semibold text-foreground">
          {designName}
        </h2>
      </section>

      <div className="flex-1 overflow-y-auto">
        {/* Metadata — the shared PropertyList primitive (read-only
            label/value), so it matches every other detail surface and
            drops the per-row dividers that made this read busy. */}
        <section className="px-3 py-3">
          <PropertyList density="compact" labelWidth="6rem">
            <PropertyList.Row label="Status">
              <Select
                value={effectiveStatus}
                onValueChange={(v) => onStatusChange(v as DesignStatus)}
              >
                <SelectTrigger
                  size="xs"
                  className="w-auto min-w-[120px] border-transparent bg-transparent hover:bg-muted focus:bg-muted"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent size="xs" position="item-aligned">
                  {DESIGN_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {designStatusLabel(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </PropertyList.Row>

            <PropertyList.Row label="Project">
              <Badge variant="outline" className="max-w-full font-normal">
                <span className="truncate">{projectName}</span>
              </Badge>
            </PropertyList.Row>

            {/* STUDIO-FLOWS: the screen's link handle. Clicking copies a
                ready-to-paste goto prop/attribute — wire it onto a card
                (goto prop) or any element (data-grade-goto) on ANOTHER
                screen and shares/embeds navigate here. ID form on
                purpose: ids survive renames (screens WILL be renamed);
                hand-typed names still resolve. */}
            <PropertyList.Row label="Flow link">
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard
                    ?.writeText(`goto="screen:${designId ?? designName}"`)
                    .then(() => {
                      setCopiedFlowLink(true);
                      window.setTimeout(() => setCopiedFlowLink(false), 1500);
                    });
                }}
                title={`Copy goto="screen:${designId ?? designName}" (${designName}) — paste onto a card or element on another screen to link here`}
                className="max-w-full truncate rounded border border-border/60 bg-muted/40 px-1.5 py-0.5 font-mono text-2xs text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {copiedFlowLink ? "Copied ✓" : `screen:${designId ?? designName}`}
              </button>
            </PropertyList.Row>

            {/* Description — what this screen is / the decision it
                carries. Feeds the rich list rows' detail line. */}
            {onDescriptionChange && (
              <PropertyList.Row label="Description">
                <textarea
                  key={designId}
                  value={descDraft}
                  onChange={(e) => setDescDraft(e.target.value)}
                  onBlur={commitDesc}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      commitDesc();
                    }
                  }}
                  rows={2}
                  placeholder="What this screen shows…"
                  className="w-full resize-none rounded-md border border-border/60 bg-transparent px-2 py-1 text-xs text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary/50"
                />
              </PropertyList.Row>
            )}

            {/* Tags (STUDIO-TAGS T0) — typed facets. Chips show
                type:value; click ✕ to remove; the input adds on
                Enter/comma. Group-by/filter views land in T1. */}
            {onTagsChange && (
              <PropertyList.Row label="Tags">
                <div className="flex max-w-full flex-wrap items-center gap-1">
                  {(tags ?? []).map((t) => (
                    <Badge
                      key={`${t.type}:${t.value}`}
                      variant="outline"
                      className="max-w-full gap-1 pr-1 font-normal"
                    >
                      <span className="truncate">
                        {t.type !== "label" && (
                          <span className="text-muted-foreground">{t.type}:</span>
                        )}
                        {t.value}
                      </span>
                      <button
                        type="button"
                        aria-label={`Remove tag ${formatTag(t)}`}
                        onClick={() => removeTag(t)}
                        className="rounded-sm text-muted-foreground hover:text-foreground"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                  <input
                    value={tagDraft}
                    onChange={(e) => setTagDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        commitTagDraft();
                      } else if (
                        e.key === "Backspace" &&
                        !tagDraft &&
                        (tags?.length ?? 0) > 0
                      ) {
                        removeTag(tags![tags!.length - 1]);
                      }
                    }}
                    onBlur={commitTagDraft}
                    placeholder={tags?.length ? "add…" : "section:rankings"}
                    className="min-w-[72px] flex-1 bg-transparent px-1 py-0.5 text-xs text-foreground outline-none placeholder:text-muted-foreground/60"
                    list={openSuggestions.length ? tagListId : undefined}
                  />
                  {openSuggestions.length > 0 && (
                    <datalist id={tagListId}>
                      {openSuggestions.map((s) => (
                        <option key={s} value={s} />
                      ))}
                    </datalist>
                  )}
                </div>
              </PropertyList.Row>
            )}

            <PropertyList.Row label="Revisions" value={revisions} />

            <PropertyList.Row
              label="Created"
              value={createdAt ? formatCreated(createdAt) : "—"}
            />

            <PropertyList.Row
              label="Updated"
              value={updatedAt ? formatRelative(updatedAt) : "—"}
            />
          </PropertyList>
        </section>

        {/* Component inventory — collapsible, on the section divider
            rhythm so it reads as one more block, not a tacked-on extra. */}
        <section className="border-t border-border/60 px-3">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="inventory" className="border-b-0">
              <AccordionTrigger className="py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:no-underline">
                Component inventory
              </AccordionTrigger>
              <AccordionContent className="pb-2 pt-1">
                <ComponentInventory appSource={appSource} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>
      </div>
    </div>
  );
}

