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

ActivityListV2.money = money;
ActivityListV2.grams = grams;

/* Exported untyped: the body is plain JSX (see the header). */
const __ActivityListV2: any = ActivityListV2;
export { __ActivityListV2 as ActivityListV2 };
