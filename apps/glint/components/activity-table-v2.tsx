"use client";

/**
 * ActivityTableV2 (1 Oct 2026, the business portal v2 on glint-staging):
 * ActivityTable with the transaction detail moved onto SideDrawer, the one
 * drawer spec Buy and Sell share (Ali, 1 Oct): the header stays put, the
 * details scroll, and Done sits in the pinned footer. A fork, because the
 * live demo uses ActivityTable. TWIN: the Studio shared component
 * "ActivityTableV2" (cmupuqfhr5kmfa).
 *
 * NO AUTO-BUY ON STAGING (Ali, 2 Oct): the "Direct Gold" rows are past
 * auto-buy purchases, so with auto-buy off (StagingSwitches.useAutoBuy,
 * off unless ?autobuy=on) their method reads "Bought" instead, in the
 * table and in the detail. The rows themselves, their amounts and every
 * balance stay as they are. With ?autobuy=on they read "Direct Gold" again.
 * ASSUMPTION: only the method name changes. The description stays
 * "Exchange USD to Gold" and the reference keeps its DG prefix, which is
 * data, not wording; Ali to say if either should move too.
 *
 * THE DETAIL'S LARGE AMOUNT is the Web DS DisplayNumber, Size=md (2 Oct):
 * Raleway 700, lining tabular figures, the whole number 36 and the sign,
 * "$", fraction and unit 30.
 *
 * The notes below are ActivityTable's and still apply. It is ported from
 * the Studio shared component "ActivityTable" (cmsoq23o03cvf3). ONE component for every surface
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
 * COLUMNS (Ali, 11 Aug): Description, Amount, Status, Date. The TYPE
 * sits under the description rather than in its own column, where it
 * reads as what the row IS ("Direct Gold", "Wire transfer") instead of
 * a value to scan across. There
 * is no Account column and no account on the row: every wallet here
 * belongs to the same customer, and a wallet screen filters on `metal`.
 * The kind column ("Exchange") went too, because the description
 * already says "Exchange USD to Gold", and the description's subtitle
 * no longer repeats the method it sits next to.
 *
 * CLICKING ANYWHERE ON A ROW opens the item in a SIDE SHEET, the way Mercury opens
 * a transaction: the list stays put behind it, so you keep your place
 * and your scroll position. The panel mirrors the iOS transaction
 * detail screen field for field.
 *
 * The props are the surface differences, and nothing else:
 *   filters  the All / Money in / Money out tabs. The full history
 *            wants them; a recent list under a dashboard does not.
 *   hide     column keys to drop. A compact list drops status.
 *   limit    trims to the first N rows for a recent list.
 *   pageSize how many rows per page. Unset means no pagination, which is
 *            right for a wallet's short list; the full history sets it, so
 *            the table stops scrolling inside itself.
 *
 * WHY THE FULL HISTORY PAGINATES (Ali, 12 Aug: "bug on the main activity
 * page - seems we have set an explicit height and it does a weird crop
 * scroll"). It was not this module: DataView caps its own scroll box at
 * 28rem when stickyHeader is on, so a long table scrolled inside a cropped
 * frame. DataView now takes a pageSize and drops that cap while
 * paginating, which is the fix at the level the bug lives at. A wallet
 * screen passes no pageSize, because five rows do not need pages.
 *
 * CHECKBOX SELECTION is deliberately absent: DataView has an active row
 * but no multi-select today. Adding it means a leading checkbox column
 * plus TanStack rowSelection state inside the component.
 */

import * as React from "react";
import {
  DataView,
  PropertyList,
  Button,
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
import { SideDrawer } from "@/components/side-drawer";
import { DisplayNumber } from "@/components/display-number";
import { StagingSwitches } from "@/lib/staging-switches";
import { VaultsV2 } from "@/lib/vaults-v2";
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
  type TxMethod,
} from "@/lib/persona";

/* Method names while auto-buy is off on staging (see the header). Keyed
   on the stored method, like TX_METHOD_LABEL in lib/persona, which stays
   the source for every other method. */
const AUTO_BUY_OFF_METHOD_LABEL: Partial<Record<TxMethod, string>> = {
  "direct-gold": "Bought",
};

/** The method as this table shows it: the persona's label, unless
 *  auto-buy is off and the row's method has a staging name. */
function methodLabel(row: ActivityRow, autoBuy: boolean): string {
  const staging = AUTO_BUY_OFF_METHOD_LABEL[row.method];
  if (!autoBuy && staging) return staging;
  return txMethodLabel(row);
}

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

function buildColumns(autoBuy: boolean): DataViewColumn<ActivityRow>[] {
  return [
    {
      key: "description",
      header: "Description",
      sortable: true,
      hideable: false,
      cell: (row: ActivityRow) => (
        <Stack gap="none">
          <span className="font-medium text-foreground">{row.description}</span>
          <span className="text-xs text-muted-foreground">
            {[
              methodLabel(row, autoBuy),
              row.vault ? VaultsV2.label(row.vault) : "",
              txPlace(row),
            ]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </Stack>
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
  autoBuy,
}: {
  row: ActivityRow | null;
  onClose: () => void;
  autoBuy: boolean;
}) {
  const d = row ? fmtTxDate(row.timestamp) : null;
  return (
    <SideDrawer open={Boolean(row)} onOpenChange={(o) => (o ? null : onClose())}>
      {row && (
        <>
          <SideDrawer.Header
            title={row.description}
            description={txPlace(row) || row.subtitle || methodLabel(row, autoBuy)}
          />
          <SideDrawer.Body>
          <Stack gap="lg">
            <Stack gap="xs">
              {/* "-$8,400.00" or "+59.8778 g", as fmtSigned and fmtGrams
                  write them, set as the Web DS figure. */}
              {row.metalAmount == null ? (
                <DisplayNumber
                  value={row.fiatAmount}
                  currency
                  sign
                  size="md"
                  className="text-foreground"
                />
              ) : (
                <DisplayNumber
                  value={row.metalAmount}
                  places={4}
                  suffix=" g"
                  sign
                  size="md"
                  className="text-foreground"
                />
              )}
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
                {methodLabel(row, autoBuy)}
              </PropertyList.Row>
              {/* The full city and country here, where there is room for
                  it. A cash row has no vault and drops the whole row
                  rather than showing an empty one. */}
              {row.vault && (
                <PropertyList.Row label="Vault">
                  {VaultsV2.location(row.vault)}
                </PropertyList.Row>
              )}
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
          </SideDrawer.Body>
          <SideDrawer.Footer>
            <Button size="lg" className="h-12" onClick={onClose}>
              Done
            </Button>
          </SideDrawer.Footer>
        </>
      )}
    </SideDrawer>
  );
}

export function ActivityTableV2({
  rows,
  filters = false,
  hide = [],
  limit,
  pageSize,
}: {
  rows: ActivityRow[];
  filters?: boolean;
  hide?: string[];
  limit?: number;
  /** Rows per page. Unset = no pagination. */
  pageSize?: number;
}) {
  /* activeId is CONTROLLED so closing the sheet clears it. DataView's
     click handler always sets the id and never toggles it off, so with
     uncontrolled state a row you just closed could not be reopened:
     the id would not change, onActiveChange would not fire, and the
     row would look dead. */
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState("all");
  const autoBuy = StagingSwitches.useAutoBuy();
  const columns = buildColumns(autoBuy).filter((c) => !hide.includes(c.key));

  const active = FILTERS.find((f) => f.value === filter) ?? FILTERS[0];
  const shown = rows.filter(active.test);
  const data = typeof limit === "number" ? shown.slice(0, limit) : shown;

  const open = data.find((r) => r.id === activeId) ?? null;

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
        pageSize={pageSize}
        data={data}
        columns={columns}
        views={["table"]}
        defaultSorting={[{ id: "timestamp", desc: true }]}
        activeId={activeId}
        onActiveChange={setActiveId}
        stickyHeader
        emptyMessage="Nothing here yet."
      />
      <TxSheet row={open} onClose={() => setActiveId(null)} autoBuy={autoBuy} />
    </Stack>
  );
}
