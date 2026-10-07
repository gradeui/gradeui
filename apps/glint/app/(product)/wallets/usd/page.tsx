"use client";

// Promoted from Studio screen "USD — wallet v2"
// (design dmupum94g8tuz, version 1791399531273). Registry: lib/screens.ts;
// re-promotion workflow: apps/glint/README.md.
// source-hash: 264413e8dcd7
// (the drift guard's signature of the Studio source this page was
// built from, so check:promotions measures Studio against THIS copy
// and not against a baseline that --update can rewrite.)

// USD — wallet v2: the business portal's USD page on staging. A copy of
// "USD — wallet", which stays untouched because the live demo is promoted
// from it.
//
// 7 OCT, MATCHED TO "Glint - Web Portal - Full New", USD · Default:
//   - breadcrumb "Wallets > USD"; the title, Raleway Bold 24/32;
//   - the USD WalletGroupCard (Solid) beside the Account details card
//     (Glint USD: holder, routing and account numbers with copy, type, and
//     the funding note), 24 apart (456 and 488 at 1280, kept as that
//     ratio);
//   - "USD activity" over the Web DS activity list, cash over metal.
//
// ASSUMPTIONS (the USD slide is older than the 7 Oct Wallets slide):
//   - its card footer reads "Auto-buy to Gold"; the newer Wallets slide's
//     USD card reads "$X available" with auto-buy Active, so the card says
//     the same thing on both pages;
//   - it also has a full-width outline "Withdraw" under the card, beside
//     the card's own Withdraw; one Withdraw is kept, the card's.
import * as React from "react";
import { AppChromeV2 } from "@/components/layouts/app-chrome-v2";
import { Persona } from "@/lib/persona";
import { WalletGroupCardV2 } from "@/components/wallet-group-card-v2";
import { AccountCardV2 } from "@/components/account-card-v2";
import { ActivityListV2 } from "@/components/activity-list-v2";

export default function UsdWalletPage() {
  const rows = Persona.useActivity("fiat");
  return (
    <>
      <AppChromeV2.Main>
        <AppChromeV2.Title>USD</AppChromeV2.Title>
        <div className="grid items-start gap-4 md:grid-cols-[456fr_488fr] md:gap-6">
          <WalletGroupCardV2 asset="fiat" />
          <AccountCardV2 account="fiat" title="Account details" subtitle="Glint USD" copy note />
        </div>
        <section className="flex flex-col gap-2">
          <AppChromeV2.Heading>USD activity</AppChromeV2.Heading>
          <ActivityListV2 rows={rows} lead="cash" />
        </section>
      </AppChromeV2.Main>
    </>
  );
}
