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
 * the account holder, routing number, account number and account type.
 * Extra rows go in as children, which is how the linked account adds its
 * auto-buy line without this component knowing what auto-buy is.
 *
 * THE MARK IS A SQUARE TILE, small radius, hairline border, on a LIGHT
 * plate. Not an Avatar: that is round and it is for people, so a bank's
 * square logo arrived cropped into a circle. The plate is deliberately
 * not a theme surface, because bank marks are drawn for white headers
 * (Sutton's is navy on black and sank into the dark theme), so it stays
 * light in both modes. Falls back to the institution's initials where a
 * record has no logo file. See the provenance note in lib/accounts.ts.
 *
 * GLINT'S OWN ACCOUNTS WEAR THE WORDMARK GLYPH, not a logo file
 * (`mark: "glint"` on the institution), and suppress the institution name
 * under the account name: "Glint USD" over "Glint" is a stutter. Vector,
 * so it stays crisp at any tile size and follows the theme, where a PNG
 * of our own mark would be a second copy of the identity to keep in step.
 *
 * THE ACCOUNT NUMBER IS SHOWN IN FULL, and unbroken: ten digits grouped
 * in fours leave a two-digit orphan that reads as a rendering bug, so
 * tabular figures do the work of making a long run checkable. Every
 * number in this demo is minted; the reasoning lives on the records.
 *
 * THE HOLDER IS ALWAYS THE CUSTOMER'S LEGAL NAME. Glint's USD account
 * used to override it with the operator entity, which is the legal truth
 * of an FBO structure and the wrong thing to show a customer; Glint asked
 * for the business (13 Aug 2026). One string, one place: the persona.
 */

import * as React from "react";
import { Stack, Row, PropertyList } from "@gradeui/ui";
import { DEFAULT_PERSONA } from "@/lib/persona";
import { Wordmark } from "@/components/wordmark";
import {
  ACCOUNTS,
  accountNumberFull,
  type AccountRecord,
  type Institution,
} from "@/lib/accounts";

function InstitutionMark({ institution }: { institution: Institution }) {
  return (
    <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-white p-1">
      {institution.mark === "glint" ? (
        /* cut="metal" is the light-surface cut of the gold ladder: this
           plate stays white in both modes, so the champagne cut meant
           for dark chrome would wash out on it.
           size-8, not the 7 I first set: a bank PNG fills its tile edge
           to edge, and a 28px glyph in a 44px plate read as a smaller
           mark than the ZB monogram sitting next to it on Bank Accounts.
           Optical weight, matched by eye against that tile. */
        <Wordmark lockup="mark" cut="metal" className="size-8" />
      ) : institution.logo ? (
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
          {account.institution.mark === "glint" ? null : (
            <span className="text-xs text-muted-foreground">
              {account.institution.name}
            </span>
          )}
        </Stack>
      </Row>
      <PropertyList divider>
        <PropertyList.Row label="Account holder">
          {company.legalName}
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
