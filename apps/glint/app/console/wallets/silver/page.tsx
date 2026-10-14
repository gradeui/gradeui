"use client";

// Promoted from Studio screen "Silver — wallet v2"
// (design dmuppmv1xj9ju, version 1792006237904). Registry: lib/screens.ts;
// re-promotion workflow: apps/glint/README.md.
// source-hash: 679843ed9129
// (the drift guard's signature of the Studio source this page was
// built from, so check:promotions measures Studio against THIS copy
// and not against a baseline that --update can rewrite.)

// Silver — wallet v2: the business portal's Silver page on staging. A copy of
// "Silver — wallet", which stays untouched because the live demo is promoted
// from it.
//
// 14 OCT, MATCHED TO "Glint - Web Portal - Full New" (Silver · 2 vaults, 1
// vault, No holdings), measured off the slides:
//   - breadcrumb "Wallets > Silver"; the title, Raleway Bold 24/32;
//   - 24 under it, the Silver WalletGroupCard (Subtle) and the Vaults card
//     side by side, 24 apart (451 and 493 at 1280, kept as that ratio);
//   - 35 under them, the price card (MetalPriceCardV2), full width: the
//     LBMA chart is back, as Full New draws it;
//   - 36 under that, "Silver activity" (Chivo SemiBold 18/28) over the Web
//     DS activity list, every row that touches the Silver wallet, metal over
//     cash; with none, "No silver activity yet." in Chivo 14/20
//     muted-foreground, 8 under the heading.
//   The 35 and 36 are the slide's own gaps (the page's other blocks sit
//   24 apart), so they are set here on top of Main's 24.
//
// STATES: 2 vaults and 1 vault follow the holding (a Buy into a second
// vault makes 2); No holdings is ?state=empty (StagingSwitches).
import * as React from "react";
import { AppChromeV2 } from "@/components/layouts/app-chrome-v2";
import { Persona } from "@/lib/persona";
import { StagingSwitches } from "@/lib/staging-switches";
import { WalletGroupCardV2 } from "@/components/wallet-group-card-v2";
import { MetalPriceCardV2 } from "@/components/metal-price-card-v2";
import { ActivityListV2 } from "@/components/activity-list-v2";

export default function SilverWalletPage() {
  const live = Persona.useActivity("silver");
  const rows = StagingSwitches.useState() === "empty" ? [] : live;
  return (
    <>
      <AppChromeV2.Main>
        <AppChromeV2.Title>Silver</AppChromeV2.Title>
        <div className="grid items-stretch gap-4 md:grid-cols-[451fr_493fr] md:gap-6">
          <WalletGroupCardV2 asset="silver" />
          <WalletGroupCardV2.Vaults asset="silver" />
        </div>
        <MetalPriceCardV2 metal="silver" className="md:mt-[11px]" />
        <section className="flex flex-col gap-2 md:mt-3">
          <AppChromeV2.Heading>Silver activity</AppChromeV2.Heading>
          {rows.length ? (
            <ActivityListV2 rows={rows} lead="metal" />
          ) : (
            <p className="text-sm leading-5 text-[color:var(--wds-muted-foreground)]">No silver activity yet.</p>
          )}
        </section>
      </AppChromeV2.Main>
    </>
  );
}
