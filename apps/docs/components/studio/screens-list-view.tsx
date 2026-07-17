"use client";

/**
 * Screens-rail organisation views (STUDIO-TAGS T1).
 *
 * Two exports, both consumed by StudioCanvas's All view:
 *
 *   - `ScreensViewBar` — the thin control strip: grid ⇄ list toggle,
 *     group-by picker (single-cardinality tag types only — "folders"),
 *     and the faceted filter (OR within a type, AND across types),
 *     rendered as a menu + removable chips.
 *
 *   - `ScreensListView` — the compact list: text rows (name, tag chips,
 *     status badge), collapsible groups with counts, multi-select with
 *     a bulk-tag bar. NO live iframes — with 20+ screens this is also
 *     the memory fix: the thumbnail grid boots a renderer per tile,
 *     the list boots none.
 *
 * View state (view / groupBy / filters) is OWNED BY THE PAGE and
 * persisted per project (localStorage `grade-studio-view:<projectId>` +
 * `projects.view_prefs` jsonb) — these components are controlled.
 */

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { FastIframeHost } from "@/components/studio/fast-frame";
import { ExternalIframeHost } from "@/components/studio/external-ds-frame";
import { useActiveRegistry } from "@/lib/use-active-registry";
import type { GeneratedTheme } from "@/lib/themes";
import {
  Check,
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  ListFilter,
  Pencil,
  Plus,
  Rows3,
  Share2,
  Tags,
  X,
} from "lucide-react";
import type { ShareScope } from "@/lib/studio-storage";
import {
  Badge,
  Button,
  Checkbox,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@gradeui/ui";
import { cn } from "@/lib/utils";
import {
  designStatusLabel,
  formatTag,
  parseTagInput,
  type Design,
  type DesignTag,
} from "@/lib/studio-designs";
import {
  groupDesigns,
  tagTypeColor,
  type ProjectViewPrefs,
  type TagFacet,
  type ViewFilter,
} from "@/lib/studio-view-prefs";

// ─── View bar ─────────────────────────────────────────────────────────

interface ScreensViewBarProps {
  prefs: ProjectViewPrefs;
  onPrefsChange: (prefs: ProjectViewPrefs) => void;
  /** Open the tag manager (the single management surface). */
  onManageTags?: () => void;
  /** Observed facets across ALL designs (pre-filter) — drives both the
   *  group-by picker (single-cardinality types) and the filter menu. */
  facets: TagFacet[];
  /** Shown as "n of m" when filters hide screens. */
  totalCount: number;
  visibleCount: number;
  className?: string;
}

export function ScreensViewBar({
  prefs,
  onPrefsChange,
  onManageTags,
  facets,
  totalCount,
  visibleCount,
  className,
}: ScreensViewBarProps) {
  const groupable = facets.filter((f) => f.single);
  const hasFilter = (f: ViewFilter) =>
    prefs.filters.some((x) => x.type === f.type && x.value === f.value);
  const toggleFilter = (f: ViewFilter) => {
    onPrefsChange({
      ...prefs,
      filters: hasFilter(f)
        ? prefs.filters.filter((x) => !(x.type === f.type && x.value === f.value))
        : [...prefs.filters, f],
    });
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 flex-wrap border-b border-border bg-muted/20 px-3 py-1.5",
        className,
      )}
    >
      {/* Grid ⇄ list. Two explicit buttons rather than a ToggleGroup so
          the active state can't be deselected into "no view". */}
      <div className="flex items-center rounded-md border border-border overflow-hidden">
        {(
          [
            { value: "grid", icon: LayoutGrid, label: "Thumbnail grid" },
            { value: "list", icon: Rows3, label: "Compact list" },
          ] as const
        ).map(({ value, icon: Icon, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => onPrefsChange({ ...prefs, view: value })}
            aria-pressed={prefs.view === value}
            title={label}
            className={cn(
              "flex h-6 w-7 items-center justify-center transition-colors [&_svg]:size-3.5",
              prefs.view === value
                ? "bg-background text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
            )}
          >
            <Icon />
          </button>
        ))}
      </div>

      {/* Group by — folders as a view. Only offered for types where a
          screen carries at most one value; a multi-valued type has no
          single home per screen. List view only: the grid keeps its
          spatial flow. */}
      {prefs.view === "list" && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex items-center gap-1 rounded-md px-2 h-6 text-[11px] transition-colors",
                prefs.groupBy
                  ? "text-foreground bg-muted"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
              )}
            >
              <Tags className="size-3.5" />
              {prefs.groupBy ? `Group: ${prefs.groupBy}` : "Group by"}
              <ChevronDown className="size-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem
              onClick={() => onPrefsChange({ ...prefs, groupBy: null })}
            >
              {!prefs.groupBy && <Check className="size-3.5" />}
              None (position order)
            </DropdownMenuItem>
            {groupable.length > 0 && <DropdownMenuSeparator />}
            {groupable.map((f) => (
              <DropdownMenuItem
                key={f.type}
                onClick={() => onPrefsChange({ ...prefs, groupBy: f.type })}
              >
                {prefs.groupBy === f.type && <Check className="size-3.5" />}
                {f.type}
                <span className="ml-auto text-[10px] text-muted-foreground">
                  {f.values.length} value{f.values.length === 1 ? "" : "s"}
                </span>
              </DropdownMenuItem>
            ))}
            {groupable.length === 0 && (
              <DropdownMenuItem disabled>
                Tag screens to group them
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Filter — faceted. The menu lists every observed type:value with
          counts; active facets render as removable chips beside it. */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex items-center gap-1 rounded-md px-2 h-6 text-[11px] transition-colors",
              prefs.filters.length
                ? "text-foreground bg-muted"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
            )}
          >
            <ListFilter className="size-3.5" />
            Filter
            <ChevronDown className="size-3" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="max-h-80 overflow-auto">
          {facets.length === 0 && (
            <DropdownMenuItem disabled>
              Tag screens to filter them
            </DropdownMenuItem>
          )}
          {facets.map((f, i) => (
            <div key={f.type}>
              {i > 0 && <DropdownMenuSeparator />}
              <DropdownMenuLabel className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {f.type}
              </DropdownMenuLabel>
              {f.values.map(({ value, count }) => (
                <DropdownMenuCheckboxItem
                  key={value}
                  checked={hasFilter({ type: f.type, value })}
                  onCheckedChange={() => toggleFilter({ type: f.type, value })}
                  // Keep the menu open while composing a multi-facet
                  // filter — closing per click makes AND-across-types
                  // a chore.
                  onSelect={(e) => e.preventDefault()}
                >
                  {value}
                  <span className="ml-auto pl-3 text-[10px] text-muted-foreground">
                    {count}
                  </span>
                </DropdownMenuCheckboxItem>
              ))}
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Active facet chips. OR within a type, AND across — the chip
          groups read that way naturally (same-type chips adjacent). */}
      {prefs.filters.map((f) => (
        // Facet chips carry their type's chart-ramp accent. Chip BODY
        // click flips polarity (include ⇄ exclude — "not set:Friday"
        // hides an archived milestone from the working view); the ×
        // removes. Excluded chips read hollow + "not".
        <span
          key={`${f.type}:${f.value}`}
          className={cn(
            "group flex items-center gap-1.5 rounded-full px-2 h-5 text-[10px] text-foreground",
            f.exclude && "border border-dashed border-border text-muted-foreground",
          )}
          style={
            f.exclude
              ? undefined
              : {
                  backgroundColor: `color-mix(in oklab, ${tagTypeColor(f.type)} 14%, transparent)`,
                }
          }
        >
          <button
            type="button"
            onClick={() =>
              onPrefsChange({
                ...prefs,
                filters: prefs.filters.map((x) =>
                  x.type === f.type && x.value === f.value
                    ? { ...x, exclude: x.exclude ? undefined : true }
                    : x,
                ),
              })
            }
            className="flex items-center gap-1.5 hover:opacity-80"
            title={
              f.exclude
                ? "Excluding — click to include instead"
                : "Click to EXCLUDE screens with this tag"
            }
          >
            <span
              className={cn("size-1.5 rounded-full", f.exclude && "opacity-40")}
              style={{ backgroundColor: tagTypeColor(f.type) }}
            />
            {f.exclude ? `not ${formatTag(f)}` : formatTag(f)}
          </button>
          <button
            type="button"
            onClick={() => toggleFilter(f)}
            title="Remove filter"
            className="flex items-center"
          >
            <X className="size-2.5 opacity-50 hover:opacity-100" />
          </button>
        </span>
      ))}
      {prefs.filters.length > 0 && (
        <button
          type="button"
          onClick={() => onPrefsChange({ ...prefs, filters: [] })}
          className="text-[10px] text-muted-foreground hover:text-foreground"
        >
          Clear
        </button>
      )}
      <div className="ml-auto flex items-center gap-2">
        {prefs.filters.length > 0 && (
          <span className="text-[10px] text-muted-foreground">
            {visibleCount} of {totalCount}
          </span>
        )}
        {/* The tag manager — ONE place to see/rename/delete everything
            (the answer to "not really intuitive"). */}
        {onManageTags && (
          <button
            type="button"
            onClick={onManageTags}
            className="flex items-center gap-1 rounded-md px-2 h-6 text-[11px] text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/60"
            title="Manage tags — rename or delete across every screen"
          >
            <Tags className="size-3.5" />
            Manage
          </button>
        )}
      </div>
    </div>
  );
}

// ─── List view ────────────────────────────────────────────────────────

interface ScreensListViewProps {
  /** Already filtered by the page/canvas (the bar's filters). */
  designs: Design[];
  groupBy: string | null;
  /** Facets over ALL designs — bulk apply needs cardinality (single
   *  types replace, multi append). */
  facets: TagFacet[];
  /** Open a screen (same action as clicking a grid tile). */
  onOpen: (id: string) => void;
  /** Bulk-apply a tag to the selected screens. */
  onBulkTag?: (ids: string[], tag: DesignTag, single: boolean) => void;
  /** Mint a scoped share (STUDIO-TAGS T2) — from a group header ("share
   *  this tag", members resolve live) or the multi-select ("share these
   *  two", frozen set). */
  onShareScope?: (
    scope: ShareScope,
    entryDesignId: string,
    label: string,
  ) => void;
  /** Rename a tag VALUE across every screen that carries it (the T1
   *  bulk-update path — group-header pencil). NOTE: shares scoped to
   *  the old value keep pointing at it until the T2 registry owns
   *  rename propagation. */
  onRenameTag?: (type: string, from: string, to: string) => void;
  /** Theme + mode for the row thumbnails (same treatment as the grid
   *  tiles). Omit both to render text-only rows. */
  theme?: GeneratedTheme;
  mode?: "light" | "dark";
  hidden?: boolean;
}

/** Row thumbnail — a LIVE mini render (Ali: "I didn't get my nice
 *  preview"). Lazy: mounts only once the row scrolls into view, and
 *  stays mounted after (boot is the expensive part). Fine at today's
 *  screen counts; STUDIO-CAPTURE posters replace the live mounts when
 *  projects grow. Non-interactive by design — the row handles clicks. */
const THUMB_W = 200;
const THUMB_H = 125;
const THUMB_VIEWPORT_W = 1280;
function RowThumb({
  appSource,
  theme,
  mode,
}: {
  appSource: string | null;
  theme?: GeneratedTheme;
  mode?: "light" | "dark";
}) {
  const registry = useActiveRegistry();
  const isExternal = registry.id !== "gradeui";
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setVisible(true);
      },
      { rootMargin: "160px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);

  const scale = THUMB_W / THUMB_VIEWPORT_W;
  const viewportH = THUMB_H / scale;
  const hostStyle: React.CSSProperties = {
    width: THUMB_VIEWPORT_W,
    height: viewportH,
    transform: `scale(${scale})`,
    transformOrigin: "top left",
  };
  return (
    <div
      ref={ref}
      className="pointer-events-none relative shrink-0 overflow-hidden rounded-lg bg-muted/40 ring-1 ring-border/60"
      style={{ width: THUMB_W, height: THUMB_H }}
      aria-hidden
    >
      {visible && appSource ? (
        isExternal ? (
          <ExternalIframeHost
            appSource={appSource}
            mode={mode ?? "light"}
            registryId={registry.id}
            className="block"
            style={hostStyle}
          />
        ) : theme ? (
          <FastIframeHost
            appSource={appSource}
            theme={theme}
            mode={mode ?? "light"}
            className="block"
            style={hostStyle}
          />
        ) : null
      ) : null}
      {!appSource && (
        <div className="flex h-full items-center justify-center text-[9px] text-muted-foreground">
          empty
        </div>
      )}
    </div>
  );
}

export function ScreensListView({
  designs,
  groupBy,
  facets,
  onOpen,
  onBulkTag,
  onShareScope,
  onRenameTag,
  theme,
  mode,
  hidden = false,
}: ScreensListViewProps) {
  // Inline group-header rename (tag-value rewrite across members).
  const [renamingGroup, setRenamingGroup] = useState<{
    value: string;
    draft: string;
  } | null>(null);
  const groups = useMemo(
    () => groupDesigns(designs, groupBy),
    [designs, groupBy],
  );
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [tagDraft, setTagDraft] = useState("");
  // Bulk input autocompletes the project vocabulary (facets carry every
  // observed type:value) — exact-match discipline until the T2 registry
  // normalises spellings.
  const bulkListId = useId();
  const bulkSuggestions = useMemo(
    () =>
      facets
        .flatMap((f) => f.values.map(({ value }) => `${f.type}:${value}`))
        .sort(),
    [facets],
  );

  // Selection survives filter changes only for still-visible designs —
  // acting on hidden rows would be a silent surprise.
  const visibleSelected = useMemo(() => {
    const visible = new Set(designs.map((d) => d.id));
    return new Set([...selected].filter((id) => visible.has(id)));
  }, [designs, selected]);

  const toggleGroup = (key: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const toggleRow = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const commitBulk = () => {
    const tag = parseTagInput(tagDraft);
    if (!tag || !onBulkTag || visibleSelected.size === 0) return;
    const facet = facets.find((f) => f.type === tag.type);
    // Unknown type: single by default only for the built-in folder facet.
    const single = facet ? facet.single : tag.type === "section";
    onBulkTag([...visibleSelected], tag, single);
    setTagDraft("");
  };

  return (
    <div
      data-lenis-prevent
      className={cn(
        "flex-1 min-h-0 overflow-auto bg-muted/20 flex flex-col",
        hidden && "hidden",
      )}
      style={{ overscrollBehavior: "contain" }}
    >
      <div className="flex-1 p-2">
        {groups.map((g) => {
          const key = g.value ?? " untagged";
          const isCollapsed = groupBy ? collapsed.has(key) : false;
          // Share-this-tag entry point: the tag's entry-marked member
          // (flow tags carry `entry: true`) opens the link, else the
          // group's first screen. Untagged bucket has no tag to share.
          const groupEntry =
            groupBy &&
            (g.designs.find((d) =>
              (d.tags ?? []).some(
                (t) => t.type === groupBy && t.value === g.value && t.entry,
              ),
            ) ?? g.designs[0]);
          return (
            <div key={key} className="mb-1 group/section">
              {groupBy && (
                <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => toggleGroup(key)}
                  className="flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-left text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  aria-expanded={!isCollapsed}
                >
                  {isCollapsed ? (
                    <ChevronRight className="size-3" />
                  ) : (
                    <ChevronDown className="size-3" />
                  )}
                  {g.value && groupBy && (
                    <span
                      className="size-1.5 rounded-full"
                      style={{ backgroundColor: tagTypeColor(groupBy) }}
                    />
                  )}
                  {renamingGroup && renamingGroup.value === g.value ? (
                    <input
                      autoFocus
                      value={renamingGroup.draft}
                      onChange={(e) =>
                        setRenamingGroup({
                          value: g.value!,
                          draft: e.target.value,
                        })
                      }
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === "Enter") {
                          const to = renamingGroup.draft.trim();
                          if (to && to !== g.value && groupBy && onRenameTag) {
                            onRenameTag(groupBy, g.value!, to);
                          }
                          setRenamingGroup(null);
                        } else if (e.key === "Escape") {
                          setRenamingGroup(null);
                        }
                      }}
                      onBlur={() => setRenamingGroup(null)}
                      className="w-40 border-b border-primary bg-transparent text-[11px] outline-none"
                    />
                  ) : (
                    <span className={cn(!g.value && "italic")}>{g.label}</span>
                  )}
                  <span className="text-[10px] font-normal">
                    {g.designs.length}
                  </span>
                </button>
                {onRenameTag && g.value && (
                  <button
                    type="button"
                    onClick={() =>
                      setRenamingGroup({ value: g.value!, draft: g.value! })
                    }
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity group-hover/section:opacity-100 hover:bg-muted hover:text-foreground [&_svg]:size-3"
                    title={`Rename "${g.value}" on every tagged screen`}
                    aria-label={`Rename tag ${g.value}`}
                  >
                    <Pencil />
                  </button>
                )}
                {onShareScope && g.value && groupEntry && (
                  <button
                    type="button"
                    onClick={() =>
                      onShareScope(
                        { tag: { type: groupBy, value: g.value! } },
                        groupEntry.id,
                        `${groupBy}:${g.value}`,
                      )
                    }
                    className="mr-1 flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity group-hover/section:opacity-100 hover:bg-muted hover:text-foreground [&_svg]:size-3"
                    title={`Share ${groupBy}:${g.value} — members resolve live`}
                    aria-label={`Share the ${g.value} group`}
                  >
                    <Share2 />
                  </button>
                )}
                </div>
              )}
              {!isCollapsed &&
                g.designs.map((d) => (
                  <ScreenListRow
                    key={d.id}
                    design={d}
                    indent={Boolean(groupBy)}
                    selected={visibleSelected.has(d.id)}
                    selectable={Boolean(onBulkTag)}
                    onToggleSelect={() => toggleRow(d.id)}
                    onOpen={() => onOpen(d.id)}
                    theme={theme}
                    mode={mode}
                  />
                ))}
            </div>
          );
        })}
        {designs.length === 0 && (
          <div className="px-3 py-8 text-center text-xs text-muted-foreground">
            No screens match the active filters.
          </div>
        )}
      </div>

      {/* Bulk-tag bar — docks to the bottom of the list while a
          selection exists. type:value grammar, same parser as the
          inspector's Tags editor. */}
      {visibleSelected.size > 0 && onBulkTag && (
        <div className="sticky bottom-0 flex items-center gap-2 border-t border-border bg-background/95 px-3 py-2 backdrop-blur">
          <span className="text-[11px] text-muted-foreground shrink-0">
            {visibleSelected.size} selected
          </span>
          <input
            value={tagDraft}
            onChange={(e) => setTagDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitBulk();
              }
            }}
            placeholder="section:rankings — type:value, Enter to apply"
            className="h-6 flex-1 min-w-0 rounded border border-border bg-background px-2 text-[11px] outline-none focus:border-primary/50"
            list={bulkSuggestions.length ? bulkListId : undefined}
          />
          {bulkSuggestions.length > 0 && (
            <datalist id={bulkListId}>
              {bulkSuggestions.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          )}
          <Button
            size="sm"
            variant="secondary"
            className="h-6 px-2 text-[11px]"
            disabled={!parseTagInput(tagDraft)}
            onClick={commitBulk}
          >
            <Plus className="size-3" />
            Tag
          </Button>
          {onShareScope && (
            <Button
              size="sm"
              variant="secondary"
              className="h-6 px-2 text-[11px]"
              onClick={() => {
                // List order, not click order — the first visible
                // selected row is the entry screen the link opens on.
                const ordered = designs
                  .map((d) => d.id)
                  .filter((id) => visibleSelected.has(id));
                if (ordered.length === 0) return;
                onShareScope(
                  { screens: ordered },
                  ordered[0],
                  `${ordered.length} screen${ordered.length === 1 ? "" : "s"}`,
                );
              }}
            >
              <Share2 className="size-3" />
              Share
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-[11px]"
            onClick={() => setSelected(new Set())}
          >
            Clear
          </Button>
        </div>
      )}
    </div>
  );
}

interface ScreenListRowProps {
  design: Design;
  indent: boolean;
  selected: boolean;
  selectable: boolean;
  onToggleSelect: () => void;
  onOpen: () => void;
  theme?: GeneratedTheme;
  mode?: "light" | "dark";
}

/** Rich row (Ali's spec): live thumbnail, double-stacked name +
 *  details, status — "really nice rows". Card-height targets also fix
 *  the clunky tap: the whole card opens, the checkbox zone is padded
 *  and always visible once anything is selected. */
function ScreenListRow({
  design,
  indent,
  selected,
  selectable,
  onToggleSelect,
  onOpen,
  theme,
  mode,
}: ScreenListRowProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className={cn(
        "group mb-1.5 flex cursor-pointer items-center gap-3 rounded-xl border bg-background p-2 pr-3 transition-colors",
        indent && "ml-4",
        selected
          ? "border-primary/50 bg-primary/5"
          : "border-border hover:border-primary/40",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
      )}
    >
      {selectable && (
        <span
          // Padded intercept zone — toggling must never open (the old
          // 14px hover-only checkbox was the clunk).
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          className={cn(
            "flex shrink-0 items-center justify-center self-stretch pl-1 pr-0.5 transition-opacity",
            selected ? "opacity-100" : "opacity-0 group-hover:opacity-100",
          )}
        >
          <Checkbox
            checked={selected}
            onCheckedChange={onToggleSelect}
            aria-label={`Select ${design.name}`}
          />
        </span>
      )}
      <RowThumb appSource={design.appSource} theme={theme} mode={mode} />
      {/* Stacked header + details. */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="truncate text-sm font-medium text-foreground">
          {design.name}
        </span>
        <div className="flex items-center gap-1.5 overflow-hidden">
          <Badge
            variant="outline"
            className="h-4 shrink-0 px-1.5 text-[9px] font-normal text-muted-foreground"
          >
            {designStatusLabel(design.status)}
          </Badge>
          {(design.tags ?? []).map((t) => (
            <span
              key={`${t.type}:${t.value}`}
              className="flex shrink-0 items-center gap-1 rounded-full px-1.5 py-px text-[9px] text-muted-foreground"
              style={{
                backgroundColor: `color-mix(in oklab, ${tagTypeColor(t.type)} 12%, transparent)`,
              }}
              title={formatTag(t)}
            >
              <span
                className="size-1 rounded-full"
                style={{ backgroundColor: tagTypeColor(t.type) }}
              />
              {formatTag(t)}
            </span>
          ))}
        </div>
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </div>
  );
}
