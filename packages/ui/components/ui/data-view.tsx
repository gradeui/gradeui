"use client";

/**
 * DataView — one dataset, drawn as a table, a list of cards, or a grid.
 *
 * Wraps TanStack Table so a page stops re-typing the same boilerplate
 * (sortable-header buttons, flexRender plumbing, selection wiring, the
 * view switch). You hand it `data` + a `columns` schema; it owns sorting,
 * column visibility, selection, and view switching.
 *
 *   <DataView data={rows} columns={cols} defaultView="table" />
 *
 * Schema-driven cells: each column declares a `type` (badge / tags /
 * number / currency / percent / date / boolean / url / text) and DataView
 * renders it. `cell` overrides per column for anything bespoke (avatars,
 * relations). `role: "title"` marks the primary field for card / grid.
 *
 * The view toggle can live ANYWHERE. `useDataView()` holds the state
 * (view / activeId / sorting / columnVisibility) so a `<DataViewToggle>`
 * or `<DataViewColumns>` placed in a page header drives a `<DataView>`
 * lower down. Or pass `toolbar` to let DataView render them inline.
 *
 * Single-view is first-class: pass `views={["table"]}` (or just
 * `defaultView` with no toolbar) and it's only ever a table / only cards /
 * only a grid, no switch.
 *
 * Table extras: mark a column `pinned="left"` for a fixed column (sticky,
 * give it a `width` so multi-pin offsets line up) and `stickyHeader` to
 * freeze the header row on scroll.
 *
 * Tunable via `--gds-data-view-*` (card / grid min column width, gap).
 */

import * as React from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
  type OnChangeFn,
  type Table as TanstackTable,
  type Header,
  type HeaderGroup,
  type Row as TanstackRow,
  type Cell,
  type Column,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  LayoutGrid,
  Rows3,
  Grid3x3,
  SlidersHorizontal,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Row } from "@/components/ui/row";
import { Stack } from "@/components/ui/stack";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";

// ── Types ──────────────────────────────────────────────────────────────

export type DataViewMode = "table" | "cards" | "grid";

export type DataViewCellType =
  | "text"
  | "badge"
  | "tags"
  | "number"
  | "currency"
  | "percent"
  | "date"
  | "boolean"
  | "url";

export interface DataViewBadgeOption {
  value: string;
  label?: string;
  variant?: BadgeProps["variant"];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface DataViewColumn<T = any> {
  /** Accessor key into the row + the column id. */
  key: string;
  /** Header content. */
  header: React.ReactNode;
  /** Built-in renderer to use for the value. Ignored when `cell` is set. */
  type?: DataViewCellType;
  /** For `type="badge"`: per-value label + colour. */
  options?: DataViewBadgeOption[];
  /** Render the cell yourself (avatars, relations, anything bespoke). */
  cell?: (row: T) => React.ReactNode;
  /** Hint for card / grid composition. `title` is the primary field. */
  role?: "title" | "meta";
  /** Allow click-to-sort on this column. */
  sortable?: boolean;
  /** Pin the column to the left (a fixed column). Give it `width` so
   *  multi-pin offsets line up. */
  pinned?: "left";
  /** Fixed width in px (used for pinned offsets + min sizing). */
  width?: number;
  /** Right-align the cell (numbers / currency). */
  align?: "start" | "end";
  /** Whether the user can hide it from the Columns menu. Default true. */
  hideable?: boolean;
  /** Start hidden. */
  defaultHidden?: boolean;
}

// ── Controllable state helper ────────────────────────────────────────────

function useControllable<V>(
  controlled: V | undefined,
  defaultValue: V,
  onChange?: (v: V) => void,
) {
  const [internal, setInternal] = React.useState<V>(defaultValue);
  const value = controlled !== undefined ? controlled : internal;
  const set = React.useCallback(
    (next: V | ((prev: V) => V)) => {
      const resolved =
        typeof next === "function"
          ? (next as (prev: V) => V)(value)
          : next;
      if (controlled === undefined) setInternal(resolved);
      onChange?.(resolved);
    },
    [controlled, onChange, value],
  );
  return [value, set] as const;
}

// ── useDataView — hold the state so the chrome can live anywhere ─────────

export interface UseDataViewOptions {
  defaultView?: DataViewMode;
  views?: DataViewMode[];
  defaultActiveId?: string | null;
  defaultSorting?: SortingState;
  defaultColumnVisibility?: VisibilityState;
}

export interface DataViewState {
  view: DataViewMode;
  setView: (v: DataViewMode) => void;
  views: DataViewMode[];
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  sorting: SortingState;
  setSorting: OnChangeFn<SortingState>;
  columnVisibility: VisibilityState;
  setColumnVisibility: OnChangeFn<VisibilityState>;
}

export function useDataView(options: UseDataViewOptions = {}): DataViewState {
  const {
    defaultView = "table",
    views = ["table", "cards", "grid"],
    defaultActiveId = null,
    defaultSorting = [],
    defaultColumnVisibility = {},
  } = options;
  const [view, setView] = React.useState<DataViewMode>(defaultView);
  const [activeId, setActiveId] = React.useState<string | null>(defaultActiveId);
  const [sorting, setSorting] = React.useState<SortingState>(defaultSorting);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(
    defaultColumnVisibility,
  );
  return {
    view,
    setView,
    views,
    activeId,
    setActiveId,
    sorting,
    setSorting,
    columnVisibility,
    setColumnVisibility,
  };
}

// ── Default cell renderers (generic shapes) ──────────────────────────────

const formatDate = (v: unknown) => {
  const d = new Date(v as string);
  return Number.isNaN(d.getTime())
    ? String(v)
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderCell(col: DataViewColumn, row: any): React.ReactNode {
  if (col.cell) return col.cell(row);
  const v = row[col.key];
  switch (col.type) {
    case "badge": {
      const opt = col.options?.find((o) => o.value === v);
      return <Badge variant={opt?.variant ?? "secondary"}>{opt?.label ?? v}</Badge>;
    }
    case "tags":
      return Array.isArray(v) ? (
        <Row gap="xs" wrap>
          {v.map((t) => (
            <Badge key={String(t)} variant="secondary">{t}</Badge>
          ))}
        </Row>
      ) : null;
    case "number":
      return <span className="tabular-nums">{v as React.ReactNode}</span>;
    case "currency":
      return <span className="tabular-nums">{"$" + Number(v).toLocaleString("en-US")}</span>;
    case "percent":
      return <span className="tabular-nums">{Math.round(Number(v) * 100) + "%"}</span>;
    case "date":
      return <span className="tabular-nums text-muted-foreground">{formatDate(v)}</span>;
    case "boolean":
      return <Badge variant={v ? "success-soft" : "outline"}>{v ? "Yes" : "No"}</Badge>;
    case "url":
      return (
        <a href={String(v)} className="text-primary underline-offset-2 hover:underline">
          {String(v).replace(/^https?:\/\//, "")}
        </a>
      );
    case "text":
    default:
      return <span>{v as React.ReactNode}</span>;
  }
}

// ── DataViewToggle — standalone, place it anywhere ───────────────────────

const VIEW_ICON: Record<DataViewMode, React.ComponentType<{ className?: string }>> = {
  table: Rows3,
  cards: LayoutGrid,
  grid: Grid3x3,
};
const VIEW_LABEL: Record<DataViewMode, string> = {
  table: "Table view",
  cards: "Card view",
  grid: "Grid view",
};

export interface DataViewToggleProps {
  value: DataViewMode;
  onChange: (v: DataViewMode) => void;
  views?: DataViewMode[];
  className?: string;
}

export function DataViewToggle({
  value,
  onChange,
  views = ["table", "cards", "grid"],
  className,
}: DataViewToggleProps) {
  if (views.length < 2) return null;
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => v && onChange(v as DataViewMode)}
      className={className}
      data-gds-part="data-view-toggle"
    >
      {views.map((v) => {
        const Icon = VIEW_ICON[v];
        return (
          <ToggleGroupItem key={v} value={v} aria-label={VIEW_LABEL[v]}>
            <Icon className="h-4 w-4" />
          </ToggleGroupItem>
        );
      })}
    </ToggleGroup>
  );
}

// ── DataViewColumns — the "choose what to display" menu ───────────────────

export interface DataViewColumnsProps {
  columns: DataViewColumn[];
  visibility: VisibilityState;
  onVisibilityChange: (next: VisibilityState) => void;
  label?: string;
  className?: string;
}

export function DataViewColumns({
  columns,
  visibility,
  onVisibilityChange,
  label = "Display",
  className,
}: DataViewColumnsProps) {
  const hideable = columns.filter((c) => c.hideable !== false);
  const isVisible = (key: string) => visibility[key] !== false;
  const toggle = (key: string) =>
    onVisibilityChange({ ...visibility, [key]: !isVisible(key) });
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={className} data-gds-part="data-view-columns">
          <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Show fields</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {hideable.map((c) => (
          <DropdownMenuCheckboxItem
            key={c.key}
            checked={isVisible(c.key)}
            onCheckedChange={() => toggle(c.key)}
            onSelect={(e) => e.preventDefault()}
          >
            {typeof c.header === "string" ? c.header : c.key}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ── DataView ─────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface DataViewProps<T = any> {
  data: T[];
  columns: DataViewColumn<T>[];
  getRowId?: (row: T, index: number) => string;
  view?: DataViewMode;
  defaultView?: DataViewMode;
  onViewChange?: (v: DataViewMode) => void;
  views?: DataViewMode[];
  activeId?: string | null;
  defaultActiveId?: string | null;
  onActiveChange?: (id: string | null) => void;
  sorting?: SortingState;
  defaultSorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  columnVisibility?: VisibilityState;
  defaultColumnVisibility?: VisibilityState;
  onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
  /** Freeze the header row on vertical scroll. */
  stickyHeader?: boolean;
  /** Render a built-in toolbar (columns menu + view toggle) above the view. */
  toolbar?: boolean;
  /** Override card / grid tile rendering. */
  renderCard?: (row: T, ctx: { active: boolean }) => React.ReactNode;
  emptyMessage?: React.ReactNode;
  className?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function DataView<T extends Record<string, any>>(props: DataViewProps<T>) {
  const {
    data,
    columns,
    getRowId = (row: T) => String((row as { id?: unknown }).id),
    view: viewProp,
    defaultView = "table",
    onViewChange,
    views = ["table", "cards", "grid"],
    activeId: activeIdProp,
    defaultActiveId = null,
    onActiveChange,
    sorting: sortingProp,
    defaultSorting = [],
    onSortingChange,
    columnVisibility: visibilityProp,
    defaultColumnVisibility,
    onColumnVisibilityChange,
    stickyHeader = false,
    toolbar = false,
    renderCard,
    emptyMessage = "Nothing to show.",
    className,
  } = props;

  const [view, setView] = useControllable(viewProp, defaultView, onViewChange);
  const [activeId, setActiveId] = useControllable<string | null>(
    activeIdProp,
    defaultActiveId,
    onActiveChange,
  );
  const [sorting, setSorting] = useControllable<SortingState>(
    sortingProp,
    defaultSorting,
    onSortingChange as ((v: SortingState) => void) | undefined,
  );
  const initialVisibility = React.useMemo<VisibilityState>(() => {
    const base: VisibilityState = { ...(defaultColumnVisibility ?? {}) };
    for (const c of columns) if (c.defaultHidden) base[c.key] ??= false;
    return base;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [columnVisibility, setColumnVisibility] = useControllable<VisibilityState>(
    visibilityProp,
    initialVisibility,
    onColumnVisibilityChange as ((v: VisibilityState) => void) | undefined,
  );

  const tableColumns = React.useMemo<ColumnDef<T>[]>(
    () =>
      columns.map((col) => ({
        id: col.key,
        accessorKey: col.key,
        header: () => col.header,
        enableSorting: !!col.sortable,
        enableHiding: col.hideable !== false,
        meta: col,
      })),
    [columns],
  );

  const table = useReactTable({
    data,
    columns: tableColumns,
    getRowId,
    state: { sorting, columnVisibility },
    onSortingChange: setSorting as OnChangeFn<SortingState>,
    onColumnVisibilityChange: setColumnVisibility as OnChangeFn<VisibilityState>,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // Precompute left offsets for pinned columns (in column order).
  const pinnedOffset = React.useMemo(() => {
    const map: Record<string, number> = {};
    let acc = 0;
    for (const c of columns) {
      if (c.pinned === "left") {
        map[c.key] = acc;
        acc += c.width ?? 0;
      }
    }
    return map;
  }, [columns]);

  const rows = table.getRowModel().rows;
  const isEmpty = rows.length === 0;

  return (
    <Stack gap="md" className={className} data-gds-part="data-view" data-view={view}>
      {toolbar && (
        <Row justify="end" align="center" gap="sm">
          <DataViewColumns
            columns={columns}
            visibility={columnVisibility}
            onVisibilityChange={(v) => setColumnVisibility(v)}
          />
          <DataViewToggle value={view} onChange={setView} views={views} />
        </Row>
      )}

      {view === "table" ? (
        <TableView
          table={table}
          activeId={activeId}
          onActivate={setActiveId}
          pinnedOffset={pinnedOffset}
          stickyHeader={stickyHeader}
          emptyMessage={emptyMessage}
          isEmpty={isEmpty}
        />
      ) : (
        <TileView
          table={table}
          mode={view}
          activeId={activeId}
          onActivate={setActiveId}
          renderCard={renderCard}
          emptyMessage={emptyMessage}
          isEmpty={isEmpty}
        />
      )}
    </Stack>
  );
}
DataView.displayName = "DataView";
DataView.Toggle = DataViewToggle;
DataView.Columns = DataViewColumns;

// ── Table view ───────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TableView<T>({
  table,
  activeId,
  onActivate,
  pinnedOffset,
  stickyHeader,
  emptyMessage,
  isEmpty,
}: {
  table: TanstackTable<T>;
  activeId: string | null;
  onActivate: (id: string | null) => void;
  pinnedOffset: Record<string, number>;
  stickyHeader: boolean;
  emptyMessage: React.ReactNode;
  isEmpty: boolean;
}) {
  const leafColumns = table.getVisibleLeafColumns();
  const pinnedStyle = (key: string, isHeader: boolean): React.CSSProperties | undefined => {
    if (!(key in pinnedOffset)) return undefined;
    return {
      position: "sticky",
      left: pinnedOffset[key],
      zIndex: isHeader ? 30 : 10,
      background: "var(--gds-data-view-pinned-bg, oklch(var(--background)))",
    };
  };

  return (
    <div
      /* NO OUTER FRAME (Ali, 11 Aug). The Table primitive this wraps has
         never drawn one, so the box was DataView's own invention and made
         a table look like a card sitting inside the page rather than part
         of it. The row hairlines already separate the data; the frame just
         boxed it in. */
      className="overflow-auto"
      data-gds-part="data-view-table"
      style={stickyHeader ? { maxHeight: "var(--gds-data-view-table-max-h, 28rem)" } : undefined}
    >
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg: HeaderGroup<T>) => (
            <TableRow key={hg.id}>
              {hg.headers.map((header: Header<T, unknown>) => {
                const col = header.column.columnDef.meta as DataViewColumn | undefined;
                const canSort = header.column.getCanSort();
                const sort = header.column.getIsSorted();
                const SortIcon = sort === "asc" ? ArrowUp : sort === "desc" ? ArrowDown : ArrowUpDown;
                const pinned = pinnedStyle(header.column.id, true);
                return (
                  <TableHead
                    key={header.id}
                    style={{
                      ...(col?.width ? { width: col.width, minWidth: col.width } : {}),
                      ...(stickyHeader
                        ? { position: "sticky", top: 0, zIndex: pinned ? 30 : 20, background: "var(--gds-data-view-header-bg, oklch(var(--background)))" }
                        : {}),
                      ...pinned,
                    }}
                    className={cn(
                      col?.align === "end" && "text-right",
                      header.column.id in pinnedOffset && "border-r border-border",
                    )}
                  >
                    {canSort ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-left font-medium hover:text-foreground"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {typeof col?.header !== "undefined" ? col.header : null}
                        <SortIcon className={sort ? "h-3 w-3 text-foreground" : "h-3 w-3 text-muted-foreground"} />
                      </button>
                    ) : (
                      col?.header ?? null
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isEmpty ? (
            <TableRow>
              <TableCell colSpan={leafColumns.length} className="py-12 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row: TanstackRow<T>) => {
              const active = row.id === activeId;
              return (
                <TableRow
                  key={row.id}
                  data-state={active ? "selected" : undefined}
                  className={active ? "cursor-pointer bg-muted" : "cursor-pointer"}
                  onClick={() => onActivate(row.id)}
                >
                  {row.getVisibleCells().map((cell: Cell<T, unknown>) => {
                    const col = cell.column.columnDef.meta as DataViewColumn;
                    const pinned = pinnedStyle(cell.column.id, false);
                    return (
                      <TableCell
                        key={cell.id}
                        style={{
                          ...(col?.width ? { width: col.width, minWidth: col.width } : {}),
                          // Pinned body cells inherit the row background on hover/active.
                          ...(pinned ? { ...pinned, background: active ? "var(--muted, oklch(var(--background)))" : pinned.background } : {}),
                        }}
                        className={cn(
                          col?.align === "end" && "text-right",
                          cell.column.id in pinnedOffset && "border-r border-border",
                        )}
                      >
                        {renderCell(col, row.original)}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

// ── Card / Grid view ─────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TileView<T>({
  table,
  mode,
  activeId,
  onActivate,
  renderCard,
  emptyMessage,
  isEmpty,
}: {
  table: TanstackTable<T>;
  mode: DataViewMode;
  activeId: string | null;
  onActivate: (id: string | null) => void;
  renderCard?: (row: T, ctx: { active: boolean }) => React.ReactNode;
  emptyMessage: React.ReactNode;
  isEmpty: boolean;
}) {
  const cols = table
    .getVisibleLeafColumns()
    .map((c: Column<T, unknown>) => c.columnDef.meta as DataViewColumn);
  const titleCol = cols.find((c: DataViewColumn) => c?.role === "title") ?? cols[0];
  const badgeCols = cols.filter(
    (c: DataViewColumn) => c && c !== titleCol && (c.type === "badge" || c.type === "tags"),
  );
  const metaCols = cols.filter(
    (c: DataViewColumn) => c && c !== titleCol && c.type !== "badge" && c.type !== "tags",
  );
  const compact = mode === "grid";
  const minVar = compact
    ? "var(--gds-data-view-grid-min, 11rem)"
    : "var(--gds-data-view-card-min, 18rem)";

  if (isEmpty) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      data-gds-part={compact ? "data-view-grid" : "data-view-cards"}
      style={{
        display: "grid",
        gap: "var(--gds-data-view-gap, 0.75rem)",
        gridTemplateColumns: `repeat(auto-fill, minmax(${minVar}, 1fr))`,
      }}
    >
      {table.getRowModel().rows.map((row: TanstackRow<T>) => {
        const active = row.id === activeId;
        if (renderCard) {
          return (
            <div key={row.id} onClick={() => onActivate(row.id)}>
              {renderCard(row.original, { active })}
            </div>
          );
        }
        return (
          <Card
            key={row.id}
            onClick={() => onActivate(row.id)}
            className={active ? "cursor-pointer ring-2 ring-primary" : "cursor-pointer hover:bg-muted/40"}
          >
            <Stack gap="sm" className={compact ? "p-3" : "p-4"}>
              <Row justify="between" align="start" gap="sm">
                {titleCol ? (
                  <span className="min-w-0 truncate font-medium">
                    {renderCell(titleCol, row.original)}
                  </span>
                ) : null}
              </Row>
              {badgeCols.length > 0 && (
                <Row gap="xs" wrap>
                  {badgeCols.map((c: DataViewColumn) => (
                    <React.Fragment key={c.key}>{renderCell(c, row.original)}</React.Fragment>
                  ))}
                </Row>
              )}
              {!compact && metaCols.length > 0 && (
                <Stack gap="xs">
                  {metaCols.slice(0, 3).map((c: DataViewColumn) => (
                    <Row key={c.key} justify="between" gap="sm" align="center">
                      <span className="text-xs text-muted-foreground">
                        {typeof c.header === "string" ? c.header : c.key}
                      </span>
                      <span className="text-sm">{renderCell(c, row.original)}</span>
                    </Row>
                  ))}
                </Stack>
              )}
            </Stack>
          </Card>
        );
      })}
    </div>
  );
}
