"use client";

/**
 * The Glint activity table, ported from the Studio shared component
 * "ActivityTable" (cmsoq23o03cvf3). ONE component for every surface
 * that lists transactions: the Activity screen, the Dashboard's recent
 * list, and a wallet's own activity. The columns, the filters and the
 * detail panel were about to be copy-pasted into three screens, which
 * is how three surfaces drift apart. Keep in sync with the Studio twin.
 *
 * DATA TABLE: DataView, the design system's TanStack-backed table.
 * Sorting comes free, and the same column list would drive card or grid
 * views later. The DS draws no outer frame, so a table reads as part of
 * the page rather than a card sitting on it; the row hairlines separate
 * the data.
 *
 * DATE IS ALWAYS ON THE RIGHT (Ali): last column, align "end", day
 * stacked over time, because the minute matters when two orders land on
 * the same day.
 *
 * COMPOSITION, NOT CONCATENATION: rows store entities (method
 * "market-order", card { name, last4 }); cells compose display strings
 * via txMethodLabel, and status renders through the label map, so
 * re-wording is one line in lib/persona.ts.
 *
 * COLUMNS (Ali, 11 Aug): Description, Amount, Status, Type, Date. There
 * is no Account column and no account on the row: every wallet here
 * belongs to the same customer, and a wallet screen filters on `metal`.
 * The kind column ("Exchange") went too, because the description
 * already says "Exchange USD to Gold", and the description's subtitle
 * no longer repeats the method it sits next to.
 *
 * CLICKING A ROW opens the item in a SIDE SHEET, the way Mercury opens
 * a transaction: the list stays put behind it, so you keep your place
 * and your scroll position. The panel mirrors the iOS transaction
 * detail screen field for field.
 *
 * The props are the surface differences, and nothing else:
 *   filters  the All / Money in / Money out tabs. The full history
 *            wants them; a recent list under a dashboard does not.
 *   hide     column keys to drop. A compact list drops status.
 *   limit    trims to the first N rows for a recent list.
 *
 * CHECKBOX SELECTION is deliberately absent: DataView has an active row
 * but no multi-select today. Adding it means a leading checkbox column
 * plus TanStack rowSelection state inside the component.
 */

import * as React from "react";
import {
  DataView,
  PropertyList,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  Stack,
  Tabs,
  TabsList,
  TabsTrigger,
  Callout,
  CalloutTitle,
  CalloutDescription,
  type DataViewColumn,
} from "@gradeui/ui";
import { Info } from "lucide-react";
import {
  fmtMoney,
  fmtSigned,
  fmtGrams,
  fmtRate,
  fmtTxDate,
  txMethodLabel,
  txPlace,
  TX_STATUS_LABEL,
  type ActivityRow,
} from "@/lib/persona";

/** Metal moved on top, cash underneath, the way the app reads.
 *  Cash-only rows show cash alone. */
function AmountCell({ row }: { row: ActivityRow }) {
  return (
    <Stack gap="none" className="items-end">
      <span className="font-medium text-foreground tabular-nums">
        {row.metalAmount == null
          ? fmtSigned(row.fiatAmount)
          : fmtGrams(row.metalAmount)}
      </span>
      {row.metalAmount != null && (
        <span className="text-xs text-muted-foreground tabular-nums">
          {fmtSigned(row.fiatAmount)}
        </span>
      )}
    </Stack>
  );
}

function buildColumns(
  onOpen: (row: ActivityRow) => void,
): DataViewColumn<ActivityRow>[] {
  return [
    {
      key: "description",
      header: "Description",
      sortable: true,
      hideable: false,
      cell: (row: ActivityRow) => (
        <button
          type="button"
          className="text-left"
          onClick={() => onOpen(row)}
          aria-label={`Open ${row.description}`}
        >
          <Stack gap="none">
            <span className="font-medium text-foreground hover:underline">
              {row.description}
            </span>
            {txPlace(row) && (
              <span className="text-xs text-muted-foreground">
                {txPlace(row)}
              </span>
            )}
          </Stack>
        </button>
      ),
    },
    {
      key: "fiatAmount",
      header: "Amount",
      align: "end",
      sortable: true,
      cell: (row: ActivityRow) => <AmountCell row={row} />,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      cell: (row: ActivityRow) => (
        <span
          className={
            row.status === "pending"
              ? "text-warning-deep"
              : "text-muted-foreground"
          }
        >
          {TX_STATUS_LABEL[row.status]}
        </span>
      ),
    },
    {
      key: "method",
      header: "Type",
      sortable: true,
      cell: (row: ActivityRow) => (
        <span className="text-muted-foreground">{txMethodLabel(row)}</span>
      ),
    },
    {
      key: "timestamp",
      header: "Date",
      align: "end",
      sortable: true,
      width: 140,
      cell: (row: ActivityRow) => {
        const d = fmtTxDate(row.timestamp);
        return (
          <Stack gap="none" className="items-end">
            <span className="text-foreground">{d.day}</span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {d.time}
            </span>
          </Stack>
        );
      },
    },
  ];
}

/** The filters, as data. Adding one is a row here, not a branch. */
const FILTERS: {
  value: string;
  label: string;
  test: (tx: ActivityRow) => boolean;
}[] = [
  { value: "all", label: "All", test: () => true },
  { value: "in", label: "Money in", test: (tx) => tx.fiatAmount > 0 },
  { value: "out", label: "Money out", test: (tx) => tx.fiatAmount < 0 },
];

/** The activity item in a side sheet, field for field with the iOS
 *  transaction detail screen. */
function TxSheet({
  row,
  onClose,
}: {
  row: ActivityRow | null;
  onClose: () => void;
}) {
  const d = row ? fmtTxDate(row.timestamp) : null;
  return (
    <Sheet open={Boolean(row)} onOpenChange={(o) => (o ? null : onClose())}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        {row && (
          <Stack gap="lg">
            <SheetHeader>
              <SheetTitle>{row.description}</SheetTitle>
              <SheetDescription>
                {txPlace(row) || row.subtitle || txMethodLabel(row)}
              </SheetDescription>
            </SheetHeader>

            <Stack gap="xs">
              <span className="text-3xl font-semibold text-foreground tabular-nums">
                {row.metalAmount == null
                  ? fmtSigned(row.fiatAmount)
                  : fmtGrams(row.metalAmount)}
              </span>
              {row.metalAmount != null && (
                <span className="text-sm text-muted-foreground tabular-nums">
                  {fmtSigned(row.fiatAmount)}
                </span>
              )}
            </Stack>

            <PropertyList divider>
              <PropertyList.Row label="Date">{d?.full}</PropertyList.Row>
              {row.rate != null && (
                <PropertyList.Row label="Rate">
                  {fmtRate(row.rate)}
                </PropertyList.Row>
              )}
              {row.fee != null && (
                <PropertyList.Row label="Fee">
                  {fmtMoney(row.fee)}
                </PropertyList.Row>
              )}
              <PropertyList.Row label="Type">
                {txMethodLabel(row)}
              </PropertyList.Row>
              <PropertyList.Row label="Status">
                {TX_STATUS_LABEL[row.status]}
              </PropertyList.Row>
              {row.reference && (
                <PropertyList.Row label="Reference">
                  {row.reference}
                </PropertyList.Row>
              )}
            </PropertyList>

            {row.feeNote && (
              <Callout variant="info">
                <Info />
                <CalloutTitle>Notice</CalloutTitle>
                <CalloutDescription>{row.feeNote}</CalloutDescription>
              </Callout>
            )}
          </Stack>
        )}
      </SheetContent>
    </Sheet>
  );
}

export function ActivityTable({
  rows,
  filters = false,
  hide = [],
  limit,
}: {
  rows: ActivityRow[];
  filters?: boolean;
  hide?: string[];
  limit?: number;
}) {
  const [open, setOpen] = React.useState<ActivityRow | null>(null);
  const [filter, setFilter] = React.useState("all");
  const columns = buildColumns(setOpen).filter((c) => !hide.includes(c.key));

  const active = FILTERS.find((f) => f.value === filter) ?? FILTERS[0];
  const shown = rows.filter(active.test);
  const data = typeof limit === "number" ? shown.slice(0, limit) : shown;

  return (
    <Stack gap="md">
      {filters && (
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList className="w-fit">
            {FILTERS.map((f) => (
              <TabsTrigger key={f.value} value={f.value}>
                {f.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}
      <DataView
        data={data}
        columns={columns}
        views={["table"]}
        defaultSorting={[{ id: "timestamp", desc: true }]}
        stickyHeader
        emptyMessage="Nothing here yet."
      />
      <TxSheet row={open} onClose={() => setOpen(null)} />
    </Stack>
  );
}
