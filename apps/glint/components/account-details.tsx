"use client";

/**
 * One account's identity and identifiers (Ali, 11 Aug 2026: "the Glint
 * account details should be IDENTICAL on the wallet USD screen and the
 * Bank accounts screen"). They were two hand-built blocks saying the same
 * thing, which is exactly the shape that drifts: the USD screen's account
 * type row was reading the wallet's NAME while the bank screen read its
 * KIND. Identical by construction beats identical by inspection.
 *
 * TWIN: mirrors the Studio shared component "AccountDetails"
 * (id cmsp159ju88t1k). Editing one does not touch the other, so a change
 * here needs the same change there.
 *
 * WHAT IT RENDERS: the institution's mark and the account's name, then
 * holder, routing number, account number and account type. Extra rows go
 * in as children, which is how the linked account adds its auto-invest
 * line without this component knowing what auto-invest is.
 *
 * THE MARK IS A SQUARE TILE, small radius, hairline border, on a LIGHT
 * plate. Not an Avatar: that is round and it is for people, so a bank's
 * square logo arrived cropped into a circle. The plate is deliberately
 * not a theme surface, because bank marks are drawn for white headers
 * (Sutton's is navy on black and sank into the dark theme), so it stays
 * light in both modes. Falls back to the institution's initials where a
 * record has no logo file. See the provenance note in lib/accounts.ts.
 *
 * THE ACCOUNT NUMBER IS SHOWN IN FULL, and unbroken: ten digits grouped
 * in fours leave a two-digit orphan that reads as a rendering bug, so
 * tabular figures do the work of making a long run checkable. Every
 * number in this demo is minted; the reasoning lives on the records.
 *
 * HOLDER falls back to the customer's own legal name. Only Glint's own
 * account carries a `holder`, because a pooled fintech deposit account is
 * held by the operator for the customer's benefit.
 */

import * as React from "react";
import { Stack, Row, PropertyList } from "@gradeui/ui";
import { DEFAULT_PERSONA } from "@/lib/persona";
import {
  ACCOUNTS,
  accountNumberFull,
  type AccountRecord,
  type Institution,
} from "@/lib/accounts";

function InstitutionMark({ institution }: { institution: Institution }) {
  return (
    <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-white p-1">
      {institution.logo ? (
        <img
          src={institution.logo}
          alt={institution.name}
          className="size-full object-contain"
        />
      ) : (
        <span className="text-sm font-medium text-muted-foreground">
          {institution.initials}
        </span>
      )}
    </div>
  );
}

export function AccountDetails({
  id,
  children,
}: {
  id: AccountRecord["id"];
  /** Extra PropertyList.Row nodes, appended after the shared four. */
  children?: React.ReactNode;
}) {
  const account = ACCOUNTS[id];
  const company = DEFAULT_PERSONA.company;
  return (
    <Stack gap="lg">
      {/* The institution, above the numbers it issued. */}
      <Row gap="sm" align="center">
        <InstitutionMark institution={account.institution} />
        <Stack gap="none">
          <span className="text-sm font-medium text-foreground">
            {account.label}
          </span>
          <span className="text-xs text-muted-foreground">
            {account.institution.name}
          </span>
        </Stack>
      </Row>
      <PropertyList divider>
        <PropertyList.Row label="Account holder">
          {account.holder ?? company.legalName}
        </PropertyList.Row>
        <PropertyList.Row label="Routing number">
          <span className="tabular-nums">{account.routingNumber}</span>
        </PropertyList.Row>
        <PropertyList.Row label="Account number">
          <span className="tabular-nums">{accountNumberFull(id)}</span>
        </PropertyList.Row>
        <PropertyList.Row label="Account type">{account.type}</PropertyList.Row>
        {children}
      </PropertyList>
    </Stack>
  );
}
