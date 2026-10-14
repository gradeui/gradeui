// @ts-nocheck: a MECHANICAL twin (7 Oct 2026). The body is the Studio
// JSX byte for byte; only the imports and the export line are rewritten
// (scripts/mechanical-twin.py), so the pair cannot drift by
// hand-porting.
"use client";

// ActivityListV2 (7 Oct 2026): the business portal v2's activity, as the
// Web DS ListItem list "Glint - Web Portal - Full New" draws on Activity,
// the wallet pages and Bank accounts. It replaces ActivityTableV2's data
// table on staging; ActivityTableV2 stays for anything still using it.
//
// TWIN: the Studio shared component "ActivityListV2" (cmuygv8vydcydh). Editing one does
// not touch the other. Keep the pair in sync.
//
//   <ActivityListV2 rows={rows} lead="metal" />   metal over cash (Activity, Gold, Silver)
//   <ActivityListV2 rows={rows} lead="cash" />    cash over metal (USD)
//   <ActivityListV2.Table rows={rows} />          the Activity page's table
//
// THE TABLE (14 Oct, Ali: "Glint build + drawer"): the Glint build's
// transactions table, measured off its capture. Above it "Transactions"
// (Chivo SemiBold 18/28) with "1-20 of N" in 14/20 muted-foreground on the
// right. A header row (Description, Amount, Status, Date; Chivo Medium
// 14/20) over rows 12 above and below with a border under each: the
// TransactionIcon (a clock while pending), the description in SemiBold
// 14/20 over its type in muted-foreground; the amount right-aligned, metal
// in Medium over cash in muted-foreground (lead="cash" swaps them); the
// status in muted-foreground; the day in Chivo 16/24 over the time in
// 14/20 muted-foreground, right-aligned. 20 to a page, "Page 1 of N" with
// Previous and Next under it. A row opens the agreed detail drawer, which
// the Glint build does not have yet.
//
// EACH ROW (Web DS ListItem + TransactionIcon): the type's icon (a buy is
// Exchange to metal, a sell Exchange to money, a deposit Transfer in, a
// withdrawal Withdraw), the description, then the method, the vault and
// the day joined with " · " ("Market order · Zurich · Sep 30, 2026"), all
// composed from the row's ids, never stored as one string. On the right,
// the lead amount over the other leg. Figma's figures use a true minus
// (U+2212), so these do too.
//
// AUTO-BUY ROWS: a "direct-gold" purchase reads "Auto-buy" (Figma, Silver
// · Default), or "Bought" while ?autobuy=off.
//
// Pressing a row opens its detail in the SideDrawer (as ActivityTableV2
// did). Filters live on the page (Activity's All / Gold / Silver).
//
// THE DETAIL (14 Oct), Full New's Activity · Detail plus what Ali kept from
// the 7 Oct drawer: the row's description as the title (no line under
// it); for a metal trade the Web DS DisplayNumber md with the metal amount
// and the dollar leg under it in Chivo 14/20 muted-foreground, for cash
// the dollar amount alone; 16 under that, one Web DS Summary of inline
// DescriptionItems: Status, Type, Date, Vault (or From, for a deposit), a
// rule, Gold bought / sold (or Amount), Price, Fee, a rule, then Total paid
// or Total received in the total emphasis. No Done button, as Figma.
// Ali, 14 Oct: the header stays AND the rows repeat its figures; there is
// no Reference row, because the product has no transaction id.
// PROVISIONAL: Ali is checking these fields against the live Glint build,
// which the dev team is making separately. ASSUMPTIONS: a deposit's From
// is the linked account (Accounts' external, "account ending 4417"); a fee
// the row does not carry reads "Free"; Price is the row's rate per gram
// at 2dp, as Figma writes "$135.03 / g"; the vault is its short label.
import * as React from "react";
import { Persona } from "@/lib/persona";
import { PortalV2 } from "@/lib/portal-v2";
import { Accounts } from "@/lib/accounts";
import { VaultsV2 } from "@/lib/vaults-v2";
import { SideDrawer } from "@/components/side-drawer";
import { StagingSwitches } from "@/lib/staging-switches";
import { DisplayNumber } from "@/components/display-number";
import { WebDsV2 } from "@/components/web-ds-v2";

const MINUS = "−";
const FOCUS =
  "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--wds-ring)]";

/** "+$2,500.00" / "−$1,000.00". */
function money(n) {
  return `${n < 0 ? MINUS : "+"}${Persona.fmtMoney(n)}`;
}

/** "+9.4940 g" / "−100.0000 g". */
function grams(n) {
  return `${n < 0 ? MINUS : "+"}${Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  })} g`;
}

/** The method as this list names it (see AUTO-BUY ROWS). */
function methodLabel(row, autoBuy) {
  if (row.method === "direct-gold") return autoBuy ? "Auto-buy" : "Bought";
  return Persona.txMethodLabel(row);
}

/** Web DS TransactionIcon Type, from the row's kind and type. */
function iconFor(row) {
  if (row.status === "pending") return "pending";
  if (row.kind === "exchange-buy") return "exchange-to-metal";
  if (row.kind === "exchange-sell") return "exchange-to-money";
  if (row.type === "withdrawal") return "withdraw";
  if (row.kind === "deposit" || row.type === "deposit") return "transfer-in";
  if (row.type === "card") return "card-spend";
  return "transfer-out";
}

function subtitle(row, autoBuy) {
  return [
    methodLabel(row, autoBuy),
    row.vault ? VaultsV2.label(row.vault) : "",
    Persona.fmtTxDate(row.timestamp).day,
  ]
    .filter(Boolean)
    .join(" · ");
}

/** "$135.03 / g". */
function price(rate) {
  return `${Persona.fmtMoney(rate)} / g`;
}

/** The activity item in the side drawer (see THE DETAIL above). */
function TxSheet({ row, onClose, autoBuy }) {
  const d = row ? Persona.fmtTxDate(row.timestamp) : null;
  const metal = row && row.metalAmount != null;
  const bought = metal && row.metalAmount > 0;
  const metalName = row?.metal ? Persona.DEFAULT.balances[row.metal]?.label ?? "Metal" : "Metal";
  const deposit = row && (row.kind === "deposit" || row.type === "deposit");
  const fee = row?.fee ? Persona.fmtMoney(row.fee) : "Free";
  return (
    <SideDrawer open={Boolean(row)} onOpenChange={(o) => (o ? null : onClose())}>
      {row && (
        <>
          <SideDrawer.Header inset="sheet" title={row.description} />
          <SideDrawer.Body>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                {metal ? (
                  <DisplayNumber value={row.metalAmount} places={4} suffix=" g" sign size="md" className="text-[color:var(--wds-foreground)]" />
                ) : (
                  <DisplayNumber value={row.fiatAmount} currency sign size="md" className="text-[color:var(--wds-foreground)]" />
                )}
                {metal ? (
                  <span className="text-sm leading-5 text-[color:var(--wds-muted-foreground)]">{money(row.fiatAmount)}</span>
                ) : null}
              </div>
              <WebDsV2.Summary>
                <WebDsV2.DescriptionItem label="Status" value={Persona.TX_STATUS_LABEL[row.status]} />
                <WebDsV2.DescriptionItem label="Type" value={methodLabel(row, autoBuy)} />
                <WebDsV2.DescriptionItem label="Date" value={d?.full} />
                {row.vault ? <WebDsV2.DescriptionItem label="Vault" value={VaultsV2.label(row.vault)} /> : null}
                {deposit ? (
                  <WebDsV2.DescriptionItem
                    label="From"
                    value={`${PortalV2.business}, account ending ${Accounts.ALL.external.number.slice(-4)}`}
                  />
                ) : null}
                <WebDsV2.Divider />
                {metal ? (
                  <>
                    <WebDsV2.DescriptionItem
                      label={`${metalName} ${bought ? "bought" : "sold"}`}
                      value={grams(row.metalAmount).slice(1)}
                    />
                    {row.rate != null ? <WebDsV2.DescriptionItem label="Price" value={price(row.rate)} /> : null}
                  </>
                ) : (
                  <WebDsV2.DescriptionItem label="Amount" value={Persona.fmtMoney(row.fiatAmount)} />
                )}
                <WebDsV2.DescriptionItem label="Fee" value={fee} />
                <WebDsV2.Divider />
                <WebDsV2.DescriptionItem
                  label={row.type === "withdrawal" ? "Total sent" : row.fiatAmount < 0 ? "Total paid" : "Total received"}
                  value={Persona.fmtMoney(row.fiatAmount)}
                  emphasis="total"
                />
              </WebDsV2.Summary>
            </div>
          </SideDrawer.Body>
        </>
      )}
    </SideDrawer>
  );
}

function ActivityListV2({ rows = [], lead = "metal", limit, empty = "Nothing here yet." }) {
  const [openId, setOpenId] = React.useState(null);
  const autoBuy = StagingSwitches.useAutoBuy();
  const sorted = [...rows].sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
  const shown = typeof limit === "number" ? sorted.slice(0, limit) : sorted;
  const open = shown.find((r) => r.id === openId) ?? null;

  if (!shown.length) {
    return <p className="py-3 pl-4 text-sm leading-5 text-[color:var(--wds-muted-foreground)]">{empty}</p>;
  }
  return (
    <div className="flex flex-col">
      {shown.map((row) => {
        const metal = row.metalAmount != null ? grams(row.metalAmount) : null;
        const cash = money(row.fiatAmount);
        const value = lead === "cash" || metal == null ? cash : metal;
        const sub = metal == null ? null : lead === "cash" ? metal : cash;
        return (
          <WebDsV2.ListItem
            key={row.id}
            leading={<WebDsV2.TxIcon type={iconFor(row)} />}
            title={row.description}
            subtitle={subtitle(row, autoBuy)}
            value={value}
            subValue={sub}
            onClick={() => setOpenId(row.id)}
          />
        );
      })}
      <TxSheet row={open} onClose={() => setOpenId(null)} autoBuy={autoBuy} />
    </div>
  );
}

/** The Activity page's table (see THE TABLE above). */
function ActivityTable({ rows = [], lead = "metal", pageSize = 20 }) {
  const [openId, setOpenId] = React.useState(null);
  const [page, setPage] = React.useState(0);
  const autoBuy = StagingSwitches.useAutoBuy();
  const sorted = [...rows].sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const at = Math.min(page, pages - 1);
  const shown = sorted.slice(at * pageSize, at * pageSize + pageSize);
  const open = sorted.find((r) => r.id === openId) ?? null;
  React.useEffect(() => setPage(0), [rows.length]);
  const first = sorted.length ? at * pageSize + 1 : 0;
  const last = at * pageSize + shown.length;
  const COLS = "grid grid-cols-[minmax(0,1fr)_140px_104px_116px] items-start gap-4";
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold leading-7 text-[color:var(--wds-foreground)]">Transactions</h2>
        <span className="text-sm leading-5 text-[color:var(--wds-muted-foreground)]">
          {first}-{last} of {sorted.length}
        </span>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          <div className={`${COLS} border-b border-[color:var(--wds-border)] px-2 py-2.5 text-sm font-medium leading-5 text-[color:var(--wds-foreground)]`}>
            <span>Description</span>
            <span className="text-right">Amount</span>
            <span>Status</span>
            <span className="text-right">Date</span>
          </div>
          {shown.length ? (
            shown.map((row) => {
              const metal = row.metalAmount != null ? grams(row.metalAmount) : null;
              const cash = money(row.fiatAmount);
              const top = lead === "cash" || metal == null ? cash : metal;
              const under = metal == null ? null : lead === "cash" ? metal : cash;
              const d = Persona.fmtTxDate(row.timestamp);
              return (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => setOpenId(row.id)}
                  className={`${COLS} w-full cursor-pointer border-b border-[color:var(--wds-border)] px-2 py-3 text-left transition-colors hover:bg-[var(--wds-accent)] ${FOCUS}`}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <WebDsV2.TxIcon type={iconFor(row)} />
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-semibold leading-5 text-[color:var(--wds-foreground)]">{row.description}</span>
                      <span className="truncate text-sm leading-5 text-[color:var(--wds-muted-foreground)]">
                        {Persona.TX_TYPE_LABEL[row.type] ?? methodLabel(row, autoBuy)}
                      </span>
                    </span>
                  </span>
                  <span className="flex flex-col items-end">
                    <span className="whitespace-nowrap text-sm font-medium leading-5 text-[color:var(--wds-foreground)]">{top}</span>
                    {under ? <span className="whitespace-nowrap text-sm leading-5 text-[color:var(--wds-muted-foreground)]">{under}</span> : null}
                  </span>
                  <span className="text-sm leading-5 text-[color:var(--wds-muted-foreground)]">{Persona.TX_STATUS_LABEL[row.status]}</span>
                  <span className="flex flex-col items-end">
                    <span className="whitespace-nowrap text-base leading-6 text-[color:var(--wds-foreground)]">{d.day}</span>
                    <span className="text-sm leading-5 text-[color:var(--wds-muted-foreground)]">{d.time}</span>
                  </span>
                </button>
              );
            })
          ) : (
            <p className="px-2 py-4 text-sm leading-5 text-[color:var(--wds-muted-foreground)]">No transactions in this wallet yet.</p>
          )}
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 pt-2">
        <span className="text-sm leading-5 text-[color:var(--wds-muted-foreground)]">
          Page {at + 1} of {pages}
        </span>
        <WebDsV2.Button variant="outline" size="sm" disabled={at === 0} onClick={() => setPage(at - 1)}>
          Previous
        </WebDsV2.Button>
        <WebDsV2.Button variant="outline" size="sm" disabled={at >= pages - 1} onClick={() => setPage(at + 1)}>
          Next
        </WebDsV2.Button>
      </div>
      <TxSheet row={open} onClose={() => setOpenId(null)} autoBuy={autoBuy} />
    </div>
  );
}

ActivityListV2.Table = ActivityTable;
ActivityListV2.money = money;
ActivityListV2.grams = grams;

/* Exported untyped: the body is plain JSX (see the header). */
const __ActivityListV2: any = ActivityListV2;
export { __ActivityListV2 as ActivityListV2 };
