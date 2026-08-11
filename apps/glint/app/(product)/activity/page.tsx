"use client";

// Promoted from Studio screen "Activity — history"
// (design dmsnba2xdvnc3, version 1786455705333). Registry: lib/screens.ts;
// re-promotion workflow: apps/glint/README.md.

import * as React from "react";
import type { DataViewColumn } from "@gradeui/ui";
import {
  Section,
  Container,
  Stack,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  DataView,
  PropertyList,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Callout,
  CalloutTitle,
  CalloutDescription,
} from "@gradeui/ui";
import { Info } from "lucide-react";
import {
  DEFAULT_PERSONA,
  fmtMoney,
  fmtSigned,
  fmtGrams,
  fmtRate,
  fmtTxDate,
  txMethodLabel,
  txPlace,
  TX_TYPE_LABEL,
  TX_STATUS_LABEL,
  type ActivityRow,
} from "@/lib/persona";
import { accountLabel } from "@/lib/accounts";

// Glint Activity screen (Ali, 10 Aug 2026): the full activity history
// for the persona, inside the AppChrome shell with the Activity nav
// item active. The tabbed filters live HERE, not on the Dashboard
// (whose Activity section is a plain recent list with View all
// pointing at this screen). Rows come from DEFAULT_PERSONA.activity,
// the same source the Dashboard reads.
//
// DATA TABLE (Ali, 11 Aug): this is DataView, the design system's
// TanStack-backed table, not a hand-rolled Table. Sorting comes free,
// and the same column list would drive card and grid views later.
//
// DATE IS ALWAYS ON THE RIGHT (Ali): last column, align "end". The cell
// stacks the day over the time, because the minute matters when two
// orders land on the same day.
//
// COMPOSITION, NOT CONCATENATION: rows store entities (account "gold",
// card { name, last4 }); cells compose display strings through
// Accounts.label and Persona.txMethodLabel. Type and status render
// through Persona's label maps, so re-wording any of them is one line
// in the Persona rather than a sweep across screens.
//
// CLICK THE DESCRIPTION to open the transaction detail, which mirrors
// the iOS "transaction details" screen field for field: Description,
// Date, Amount, Type, Rate, Status, plus the fee notice. PropertyList
// is the read-only record display, so the values a cell renders reuse
// straight into the detail rows. (Whole-row click via onActiveChange
// lands once the running validator picks up the regenerated contract.)
//
// CHECKBOX SELECTION is deliberately absent: DataView has an active row
// but no multi-select today. Adding it means a leading checkbox column
// plus TanStack rowSelection state inside the component.

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

function columns(
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
            <span className="text-xs text-muted-foreground">
              {txPlace(row) || row.subtitle || ""}
            </span>
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
      key: "type",
      header: "Type",
      sortable: true,
      cell: (row: ActivityRow) => (
        <span className="text-muted-foreground">
          {TX_TYPE_LABEL[row.type]}
        </span>
      ),
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
      key: "account",
      header: "Account",
      sortable: true,
      cell: (row: ActivityRow) => (
        <span className="text-muted-foreground">
          {accountLabel(row.account)}
        </span>
      ),
    },
    {
      key: "method",
      header: "Method",
      cell: (row: ActivityRow) => (
        <span className="text-muted-foreground">
          {txMethodLabel(row)}
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

/** The transaction detail, field for field with the iOS screen. */
function TxDetail({ row, onClose }: { row: ActivityRow | null; onClose: () => void }) {
  if (!row) return null;
  const d = fmtTxDate(row.timestamp);
  return (
    <Dialog open onOpenChange={(o) => (o ? null : onClose())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transaction details</DialogTitle>
          <DialogDescription>{accountLabel(row.account)}</DialogDescription>
        </DialogHeader>
        <Stack gap="md">
          <PropertyList>
            <PropertyList.Row label="Description">
              {row.description}
            </PropertyList.Row>
            <PropertyList.Row label="Date">{d.full}</PropertyList.Row>
            <PropertyList.Row label="Amount">
              {row.metalAmount == null
                ? fmtSigned(row.fiatAmount)
                : `${fmtGrams(row.metalAmount)} (${fmtSigned(row.fiatAmount)})`}
            </PropertyList.Row>
            <PropertyList.Row label="Type">
              {TX_TYPE_LABEL[row.type]}
            </PropertyList.Row>
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
            <PropertyList.Row label="Method">
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
        <DialogFooter>
          <Button
            variant="ghost"
            size="lg"
            className="rounded-full"
            onClick={onClose}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ActivityPage() {
  const rows = DEFAULT_PERSONA.activity;
  const [open, setOpen] = React.useState<ActivityRow | null>(null);
  const cols = columns(setOpen);
  return (
    <>
      <Section pad="none" className="py-8">
        <Container maxW="xl">
          <Stack gap="md">
            <h1 className="text-2xl font-semibold text-foreground">Activity</h1>
            <Tabs defaultValue="all">
              <Stack gap="md">
                <TabsList className="w-fit">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="in">Money in</TabsTrigger>
                  <TabsTrigger value="out">Money out</TabsTrigger>
                </TabsList>
                <TabsContent value="all">
                  <DataView data={rows} columns={cols} views={["table"]} stickyHeader />
                </TabsContent>
                <TabsContent value="in">
                  <DataView
                    data={rows.filter((tx: ActivityRow) => tx.fiatAmount > 0)}
                    columns={cols}
                    views={["table"]}
                    stickyHeader
                  />
                </TabsContent>
                <TabsContent value="out">
                  <DataView
                    data={rows.filter((tx: ActivityRow) => tx.fiatAmount < 0)}
                    columns={cols}
                    views={["table"]}
                    stickyHeader
                  />
                </TabsContent>
              </Stack>
            </Tabs>
          </Stack>
        </Container>
      </Section>
      <TxDetail row={open} onClose={() => setOpen(null)} />
    </>
  );
}
