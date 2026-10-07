// @ts-nocheck: a MECHANICAL twin (7 Oct 2026). The body is the Studio
// JSX byte for byte; only the imports and the export line are rewritten
// (scripts/mechanical-twin.py), so the pair cannot drift by
// hand-porting.
"use client";

// AccountCardV2 (7 Oct 2026): a bank account's details as one card, for
// the business portal v2 on staging, as "Glint - Web Portal - Full New"
// draws it on USD · Default ("Account details") and Bank accounts ·
// Default ("Linked account", "Glint account").
//
// TWIN: the Studio shared component "AccountCardV2" (cmuygvhi97p6fd). Editing one does
// not touch the other. Keep the pair in sync.
//
//   <AccountCardV2 account="fiat" title="Account details" subtitle="Glint USD" note copy />
//   <AccountCardV2 account="external" title="Linked account"
//     subtitle="Where deposits come from." institution autoBuy />
//
// VALUE FOR VALUE: 20 all round, 4 between, 16 corners, card with a
// border. The header is Chivo SemiBold 18/28 over a 14/20 muted line, 8
// (12 on Bank accounts) under it. An institution block, when asked for,
// is the account's name in SemiBold 16/24 over its bank in 14/20 muted.
// Then Web DS DescriptionItems (inline): Account holder, Routing number,
// Account number, Account type, and on the linked account Auto-buy. The
// Glint account's routing and account numbers carry the copy icon. The
// note under the Glint account is 14/20 muted.
//
// Every value comes from Accounts and Persona (entities), never typed in:
// the holder is the company's legal name, the numbers are the account's
// own, the Auto-buy line is the autoInvest preference.
import * as React from "react";
import { Accounts } from "@/lib/accounts";
import { Persona } from "@/lib/persona";
import { AutoBuyV2 } from "@/components/auto-buy-v2";
import { WebDsV2 } from "@/components/web-ds-v2";

const NOTE = "Send a domestic wire or ACH to these details to fund your USD wallet.";

function AccountCardV2({
  account = "fiat",
  title,
  subtitle,
  institution = false,
  copy = false,
  note = false,
  autoBuy = false,
  className,
}) {
  const a = Accounts.ALL[account];
  const s = AutoBuyV2.useSettings();
  const holder = Persona.DEFAULT.company?.legalName ?? Persona.DEFAULT.business;
  return (
    <div
      className={`flex flex-col gap-1 rounded-[16px] border border-[color:var(--wds-border)] bg-[var(--wds-card)] p-5 ${className ?? ""}`}
    >
      <div className={`flex flex-col gap-0.5 ${institution ? "pb-3" : "pb-2"}`}>
        <span className="text-lg font-semibold leading-7 text-[color:var(--wds-foreground)]">{title}</span>
        {subtitle ? (
          <span className="text-sm leading-5 text-[color:var(--wds-muted-foreground)]">{subtitle}</span>
        ) : null}
      </div>
      {institution ? (
        <div className="flex flex-col pb-1">
          <span className="text-base font-semibold leading-6 text-[color:var(--wds-foreground)]">{a.label}</span>
          {a.institution?.name && account !== "fiat" ? (
            <span className="text-sm leading-5 text-[color:var(--wds-muted-foreground)]">{a.institution.name}</span>
          ) : null}
        </div>
      ) : null}
      <WebDsV2.DescriptionItem label="Account holder" value={holder} />
      <WebDsV2.DescriptionItem label="Routing number" value={a.routingNumber} copy={copy ? a.routingNumber : undefined} />
      <WebDsV2.DescriptionItem
        label="Account number"
        value={Accounts.numberFull(account)}
        copy={copy ? Accounts.numberFull(account) : undefined}
      />
      <WebDsV2.DescriptionItem label="Account type" value={a.type} />
      {autoBuy ? (
        <WebDsV2.DescriptionItem label="Auto-buy" value={s.on ? `To ${AutoBuyV2.METAL_LABEL[s.metal]}` : "Off"} />
      ) : null}
      {note ? <p className="text-sm leading-5 text-[color:var(--wds-muted-foreground)]">{NOTE}</p> : null}
    </div>
  );
}
AccountCardV2.NOTE = NOTE;

/* Exported untyped: the body is plain JSX (see the header). */
const __AccountCardV2: any = AccountCardV2;
export { __AccountCardV2 as AccountCardV2 };
