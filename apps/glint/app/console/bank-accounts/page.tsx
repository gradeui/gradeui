"use client";

// Promoted from Studio screen "Bank Accounts v2"
// (design dmupume7sb1e7, version 1791399543880). Registry: lib/screens.ts;
// re-promotion workflow: apps/glint/README.md.
// source-hash: 3a108c45a62d
// (the drift guard's signature of the Studio source this page was
// built from, so check:promotions measures Studio against THIS copy
// and not against a baseline that --update can rewrite.)

// Bank Accounts v2: the business portal's Bank accounts page on staging.
// A copy of "Bank Accounts", which stays untouched because the live demo
// is promoted from it.
//
// 7 OCT, MATCHED TO "Glint - Web Portal - Full New", Bank accounts ·
// Default:
//   - breadcrumb and title "Bank accounts" (sentence case, as Figma);
//   - Linked account ("Where deposits come from.": Business checking at
//     Zions Bank, holder, routing and account numbers, type, Auto-buy) and
//     Glint account ("FDIC account held for the benefit of your
//     business.": Glint USD, with copy on the numbers and the funding
//     note), side by side, 24 apart;
//   - "Transfers" over the Web DS list of the USD wallet's deposits and
//     withdrawals, cash first.
//
// ASSUMPTION: the 7 Oct sidebar has no Bank accounts item, so this page
// is reachable by its address only until Ali says where it belongs.
import * as React from "react";
import { AppChromeV2 } from "@/components/layouts/app-chrome-v2";
import { Persona } from "@/lib/persona";
import { AccountCardV2 } from "@/components/account-card-v2";
import { ActivityListV2 } from "@/components/activity-list-v2";
import { StagingSwitches } from "@/lib/staging-switches";

export default function BankAccountsPage() {
  const autoBuy = StagingSwitches.useAutoBuy();
  const rows = Persona.useActivity("fiat").filter((r) => r.type === "deposit" || r.type === "withdrawal");
  return (
    <>
      <AppChromeV2.Main>
        <AppChromeV2.Title>Bank accounts</AppChromeV2.Title>
        <div className="grid items-start gap-4 md:grid-cols-2 md:gap-6">
          <AccountCardV2
            account="external"
            title="Linked account"
            subtitle="Where deposits come from."
            institution
            autoBuy={autoBuy}
          />
          <AccountCardV2
            account="fiat"
            title="Glint account"
            subtitle="FDIC account held for the benefit of your business."
            institution
            copy
            note
          />
        </div>
        <section className="flex flex-col gap-2">
          <AppChromeV2.Heading>Transfers</AppChromeV2.Heading>
          <ActivityListV2 rows={rows} lead="cash" />
        </section>
      </AppChromeV2.Main>
    </>
  );
}
