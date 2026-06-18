"use client";
import { ComponentNav } from "@/components/component-nav";
import { SidecarBlock } from "@/components/sidecar-block";
import { InstallBlock } from "@/components/install-block";

import {
  DataView,
  useDataView,
  type DataViewColumn,
  type DataViewBadgeOption,
} from "@/components/ui/data-view";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Row } from "@/components/ui/row";
import { ComponentPreview } from "@/components/component-preview";
import { PropsTable } from "@/components/props-table";

const PEOPLE: Record<string, { name: string; initials: string }> = {
  eo: { name: "Elena Okafor", initials: "EO" },
  ml: { name: "Marcus Li", initials: "ML" },
  pd: { name: "Priya Devi", initials: "PD" },
  zc: { name: "Zoe Chen", initials: "ZC" },
  sk: { name: "Samir Khan", initials: "SK" },
};

const ROWS = [
  { id: "u-01", name: "Acme Corp", status: "Active", priority: "High", owner: "eo", arr: 84000, comments: 12 },
  { id: "u-02", name: "Kite Industries", status: "Trial", priority: "Medium", owner: "ml", arr: 32000, comments: 4 },
  { id: "u-03", name: "Folio Labs", status: "Active", priority: "High", owner: "pd", arr: 156000, comments: 21 },
  { id: "u-04", name: "Zen Software", status: "Churned", priority: "Low", owner: "zc", arr: 48000, comments: 7 },
  { id: "u-05", name: "Vega Systems", status: "Trial", priority: "Medium", owner: "sk", arr: 67000, comments: 9 },
];

const STATUS_OPTIONS: DataViewBadgeOption[] = [
  { value: "Active", variant: "success-soft" },
  { value: "Trial", variant: "warning-soft" },
  { value: "Churned", variant: "outline" },
];
const PRIORITY_OPTIONS: DataViewBadgeOption[] = [
  { value: "Low", variant: "secondary" },
  { value: "Medium", variant: "warning-soft" },
  { value: "High", variant: "destructive-soft" },
];

const COLUMNS: DataViewColumn<(typeof ROWS)[number]>[] = [
  { key: "name", header: "Account", role: "title", sortable: true },
  { key: "status", header: "Status", type: "badge", options: STATUS_OPTIONS, sortable: true },
  { key: "priority", header: "Priority", type: "badge", options: PRIORITY_OPTIONS, sortable: true },
  {
    key: "owner", header: "Owner",
    cell: (r) => (
      <Row gap="xs" align="center">
        <Avatar className="h-6 w-6"><AvatarFallback className="text-xs">{PEOPLE[r.owner].initials}</AvatarFallback></Avatar>
        <span>{PEOPLE[r.owner].name}</span>
      </Row>
    ),
  },
  { key: "arr", header: "ARR", type: "currency", align: "end", sortable: true },
  { key: "comments", header: "Comments", type: "number", align: "end", sortable: true },
];

const props = [
  { name: "data", type: "T[]", default: "-", description: "The rows." },
  { name: "columns", type: "DataViewColumn[]", default: "-", description: "The schema. One list drives the table, the cards, and the grid. Each column declares key, header, optional type / cell / role / sortable / pinned / width / align / hideable." },
  { name: "view / defaultView / onViewChange", type: '"table" | "cards" | "grid"', default: '"table"', description: "Controlled or uncontrolled view mode." },
  { name: "views", type: "DataViewMode[]", default: "all three", description: "Allowed views. One entry means a single view with no toggle." },
  { name: "activeId / onActiveChange", type: "string | null", default: "null", description: "The selected row. Clicking a row, card, or tile emits its id." },
  { name: "sorting / columnVisibility", type: "TanStack state", default: "-", description: "Controlled sort + which fields show. Pair with useDataView to externalise." },
  { name: "stickyHeader", type: "boolean", default: "false", description: "Freeze the header row on scroll (height via --gds-data-view-table-max-h)." },
  { name: "toolbar", type: "boolean", default: "false", description: "Render the built-in columns menu + view toggle above the view." },
  { name: "renderCard", type: "(row, { active }) => ReactNode", default: "-", description: "Override the card / grid tile." },
];

const columnProps = [
  { name: "key", type: "string", default: "-", description: "Accessor into the row + the column id." },
  { name: "type", type: '"badge" | "tags" | "number" | "currency" | "percent" | "date" | "boolean" | "url" | "text"', default: '"text"', description: "Built-in cell renderer. With type=\"badge\", pass options for per-value colour." },
  { name: "cell", type: "(row) => ReactNode", default: "-", description: "Render the cell yourself (avatars, relations). Overrides type." },
  { name: "role", type: '"title" | "meta"', default: "-", description: "title marks the primary field for card / grid layout." },
  { name: "sortable", type: "boolean", default: "false", description: "Click-to-sort on the header." },
  { name: "pinned", type: '"left"', default: "-", description: "Fix the column to the left. Give it a width so multi-pin offsets line up." },
  { name: "hideable", type: "boolean", default: "true", description: "Whether the user can hide it from the Columns menu." },
];

function ExternalChrome() {
  // The toggle + columns menu live in the header, the view lives below —
  // wired together only by the state useDataView holds.
  const dv = useDataView({ defaultView: "table", defaultActiveId: "u-01" });
  return (
    <div className="w-full space-y-3">
      <Row justify="between" align="center">
        <span className="text-sm text-muted-foreground">{ROWS.length} accounts</span>
        <Row gap="sm" align="center">
          <DataView.Columns columns={COLUMNS} visibility={dv.columnVisibility} onVisibilityChange={dv.setColumnVisibility} />
          <DataView.Toggle value={dv.view} onChange={dv.setView} views={dv.views} />
        </Row>
      </Row>
      <DataView
        data={ROWS}
        columns={COLUMNS}
        view={dv.view}
        activeId={dv.activeId}
        onActiveChange={dv.setActiveId}
        sorting={dv.sorting}
        onSortingChange={dv.setSorting}
        columnVisibility={dv.columnVisibility}
        onColumnVisibilityChange={dv.setColumnVisibility}
      />
    </div>
  );
}

export default function DataViewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">Data View</h1>
        <p className="text-lg text-muted-foreground mt-2">
          One dataset, drawn as a table, a list of cards, or a grid. Wraps
          TanStack Table so a page stops re-typing the sortable-header,
          flexRender, selection, and view-switch boilerplate. Hand it data and
          a columns schema; the same schema draws all three views.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">Installation</h2>
        <InstallBlock>{`import { DataView, useDataView } from "@gradeui/ui"`}</InstallBlock>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">Usage</h2>
        <p className="text-muted-foreground">
          Pass <code>toolbar</code> for the built-in column menu and view
          toggle. Switch between table, cards, and grid; sorting and visibility
          carry across all three.
        </p>
        <ComponentPreview
          code={`<DataView
  data={accounts}
  toolbar
  defaultActiveId="u-01"
  columns={[
    { key: "name", header: "Account", role: "title", sortable: true },
    { key: "status", header: "Status", type: "badge", options: statusOptions, sortable: true },
    { key: "owner", header: "Owner", cell: (r) => <OwnerCell row={r} /> },
    { key: "arr", header: "ARR", type: "currency", align: "end", sortable: true },
  ]}
/>`}
        >
          <DataView data={ROWS} columns={COLUMNS} toolbar defaultActiveId="u-01" />
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">Examples</h2>

        <h3 className="text-lg font-medium">Toggle outside the view (useDataView)</h3>
        <p className="text-muted-foreground">
          The view switch and column menu do not have to sit on top of the
          table. useDataView holds the state, so they can live in a page header
          (or anywhere) and drive a DataView placed elsewhere.
        </p>
        <ComponentPreview
          code={`const dv = useDataView({ defaultView: "table", defaultActiveId: "u-01" });

<Row justify="between">
  <span>{rows.length} accounts</span>
  <Row gap="sm">
    <DataView.Columns columns={columns} visibility={dv.columnVisibility} onVisibilityChange={dv.setColumnVisibility} />
    <DataView.Toggle value={dv.view} onChange={dv.setView} views={dv.views} />
  </Row>
</Row>
<DataView data={rows} columns={columns} view={dv.view} activeId={dv.activeId} onActiveChange={dv.setActiveId}
  sorting={dv.sorting} onSortingChange={dv.setSorting}
  columnVisibility={dv.columnVisibility} onColumnVisibilityChange={dv.setColumnVisibility} />`}
        >
          <ExternalChrome />
        </ComponentPreview>

        <h3 className="text-lg font-medium">Pinned column + sticky header</h3>
        <p className="text-muted-foreground">
          Mark a column <code>pinned=&quot;left&quot;</code> (give it a width)
          for a fixed column, and <code>stickyHeader</code> to freeze the header
          row. Scroll the table sideways and down.
        </p>
        <ComponentPreview
          code={`<DataView
  data={accounts}
  views={["table"]}
  stickyHeader
  columns={[
    { key: "name", header: "Account", role: "title", pinned: "left", width: 200 },
    ...
  ]}
/>`}
        >
          <DataView
            data={[...ROWS, ...ROWS.map((r) => ({ ...r, id: r.id + "-b" })), ...ROWS.map((r) => ({ ...r, id: r.id + "-c" }))]}
            views={["table"]}
            stickyHeader
            defaultActiveId="u-01"
            columns={[{ ...COLUMNS[0], pinned: "left", width: 200 }, ...COLUMNS.slice(1)]}
          />
        </ComponentPreview>

        <h3 className="text-lg font-medium">Single view — cards only</h3>
        <p className="text-muted-foreground">
          Pass a single entry to <code>views</code> (or just set
          <code>defaultView</code> with no toolbar) for one fixed presentation,
          no switch.
        </p>
        <ComponentPreview code={`<DataView data={accounts} columns={columns} defaultView="cards" views={["cards"]} />`}>
          <DataView data={ROWS} columns={COLUMNS} defaultView="cards" views={["cards"]} defaultActiveId="u-01" />
        </ComponentPreview>
      </div>

      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">Props</h2>
        <PropsTable props={props} />
        <h3 className="text-lg font-medium">Column schema</h3>
        <PropsTable props={columnProps} />
      </div>

      <SidecarBlock slug="data-view" />
      <ComponentNav currentHref="/components/data-view" />
    </div>
  );
}
