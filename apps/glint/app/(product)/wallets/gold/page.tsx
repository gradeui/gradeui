"use client";

// Promoted from Studio screen "Gold — wallet v2"
// (design dmuppmu4zpn8y, version 1791399488228). Registry: lib/screens.ts;
// re-promotion workflow: apps/glint/README.md.
// source-hash: f5a80bfac8f4
// (the drift guard's signature of the Studio source this page was
// built from, so check:promotions measures Studio against THIS copy
// and not against a baseline that --update can rewrite.)

// Gold — wallet v2: the business portal's Gold page on staging. A copy of
// "Gold — wallet", which stays untouched because the live demo is promoted
// from it.
//
// 7 OCT, MATCHED TO "Glint - Web Portal - Full New", Silver · Default
// (the one metal page Figma draws; Gold is the same page with gold in it):
//   - breadcrumb "Wallets > Gold"; the title, Raleway Bold 24/32;
//   - the Gold WalletGroupCard (Subtle) and the Vaults card side by side,
//     24 apart (451 and 493 at 1280, kept as that ratio);
//   - "Gold activity" (Chivo SemiBold 18/28) over the Web DS activity list,
//     every row that touches the Gold wallet, metal over cash.
//   The LBMA price chart that sat beside the card is not on the page any
//   more: Figma has none.
//
// ASSUMPTION: the slide's title and card read "Gold" under a "Silver"
// breadcrumb and a "Silver activity" heading, a leftover from duplicating
// the Gold slide. The page here is all Gold.
import * as React from "react";
import { AppChromeV2 } from "@/components/layouts/app-chrome-v2";
import { Persona } from "@/lib/persona";
import { WalletGroupCardV2 } from "@/components/wallet-group-card-v2";
import { ActivityListV2 } from "@/components/activity-list-v2";

export default function GoldWalletPage() {
  const rows = Persona.useActivity("gold");
  return (
    <>
      <AppChromeV2.Main>
        <AppChromeV2.Title>Gold</AppChromeV2.Title>
        <div className="grid items-stretch gap-4 md:grid-cols-[451fr_493fr] md:gap-6">
          <WalletGroupCardV2 asset="gold" />
          <WalletGroupCardV2.Vaults asset="gold" />
        </div>
        <section className="flex flex-col gap-2">
          <AppChromeV2.Heading>Gold activity</AppChromeV2.Heading>
          <ActivityListV2 rows={rows} lead="metal" />
        </section>
      </AppChromeV2.Main>
    </>
  );
}
