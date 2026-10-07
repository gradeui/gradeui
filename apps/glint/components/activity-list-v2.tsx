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
import * as React from "react";
import { PropertyList, Callout, CalloutTitle, CalloutDescription } from "@gradeui/ui";
import { Info } from "lucide-react";
import { Persona } from "@/lib/persona";
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

/** The activity item in the side drawer, field for field with the iOS
 *  transaction detail screen (carried over from ActivityTableV2). */
function TxSheet({ row, onClose, autoBuy }) {
  const d = row ? Persona.fmtTxDate(row.timestamp) : null;
  return (
    <SideDrawer open={Boolean(row)} onOpenChange={(o) => (o ? null : onClose())}>
      {row && (
        <>
          <SideDrawer.Header title={row.description} description={methodLabel(row, autoBuy)} />
          <SideDrawer.Body>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                {row.metalAmount == null ? (
                  <DisplayNumber value={row.fiatAmount} currency sign size="md" className="text-foreground" />
                ) : (
                  <DisplayNumber value={row.metalAmount} places={4} suffix=" g" sign size="md" className="text-foreground" />
                )}
                {row.metalAmount != null && (
                  <span className="text-sm text-muted-foreground">{money(row.fiatAmount)}</span>
                )}
              </div>
              <PropertyList divider>
                <PropertyList.Row label="Date">{d?.full}</PropertyList.Row>
                {row.rate != null && <PropertyList.Row label="Rate">{Persona.fmtRate(row.rate)}</PropertyList.Row>}
                {row.fee != null && <PropertyList.Row label="Fee">{Persona.fmtMoney(row.fee)}</PropertyList.Row>}
                <PropertyList.Row label="Type">{methodLabel(row, autoBuy)}</PropertyList.Row>
                {row.vault && <PropertyList.Row label="Vault">{VaultsV2.location(row.vault)}</PropertyList.Row>}
                <PropertyList.Row label="Status">{Persona.TX_STATUS_LABEL[row.status]}</PropertyList.Row>
                {row.reference && <PropertyList.Row label="Reference">{row.reference}</PropertyList.Row>}
              </PropertyList>
              {row.feeNote && (
                <Callout variant="info">
                  <Info />
                  <CalloutTitle>Notice</CalloutTitle>
                  <CalloutDescription>{row.feeNote}</CalloutDescription>
                </Callout>
              )}
            </div>
          </SideDrawer.Body>
          <SideDrawer.Footer>
            <WebDsV2.Button size="xl" className="w-full" onClick={onClose}>
              Done
            </WebDsV2.Button>
          </SideDrawer.Footer>
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
