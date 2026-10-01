"use client";

// Promoted from Studio screen "Silver — wallet v2"
// (design dmuppmv1xj9ju, version 1790879477005). Registry: lib/screens.ts;
// re-promotion workflow: apps/glint/README.md.
// source-hash: 962cd1c14735
// (the drift guard's signature of the Studio source this page was
// built from, so check:promotions measures Studio against THIS copy
// and not against a baseline that --update can rewrite.)

import {
  Section,
  Container,
  Stack,
  Button,
} from "@gradeui/ui";
import { Persona } from "@/lib/persona";
import { MetalPriceCard } from "@/components/metal-price-card";
import { MetalWalletCardV2 } from "@/components/metal-wallet-card-v2";
import { ActivityTableV2 } from "@/components/activity-table-v2";

// V2 (1 Oct 2026, the business portal v2 for staging): a copy of
// "Silver — wallet", which stays untouched because the live demo is
// promoted from it. The only changes: the wallet card is
// MetalWalletCardV2, so Buy and Sell open TradeFlowV2 (from and to
// the USD wallet, selling this wallet's metal), and Back returns to the
// v2 Wallets screen. Later the same day (Ali, 1 Oct): the card is the
// App DS metal face with Buy and Sell under it and the vault table below,
// and the chrome is AppChromeV2, with no rail on mobile. Then: a page
// title, and ActivityTableV2 (the transaction detail is the shared
// SideDrawer). And the split now favours the wallet: 7 columns for the
// card and vaults, 5 for the price (Ali, 1 Oct).
//
// Glint Silver wallet screen (Ali, 11 Aug 2026): the desktop silver
// view. Holding card and price card side by side, then all silver
// activity.
//
// THIS SCREEN IS ONE LINE OF METAL (Ali, 11 Aug). It is now identical to
// the Gold wallet screen apart from the METAL const below, which is the
// point: this file used to be a paste of the gold one and still carried
// gold's header comment ("the desktop gold view", "the LBMA gold price",
// "all gold activity"), gold's Y-axis padding, which squashed the silver
// line into a tenth of the card height with the axis running below zero,
// and a {/* All gold activity */} comment over the silver table. All of
// that lived in the duplication. Change MetalPriceCard or
// MetalWalletCard, not this file, for anything visual.
//
// WALLET CARD LEADS, ON THE LEFT (Ali, 11 Aug). The holding is what you
// came to the screen for; the price is context for it. The narrower card
// takes the left 7 columns (5 until 1 Oct) and the chart the right 5, so the page still
// reads as one asymmetric pair rather than two equal blocks.
//
// ACTIVITY: Persona.useActivity(METAL) is the shared wallet filter, so
// the three wallet screens cannot disagree about which rows belong to a
// wallet. Silver has exactly ONE row today, the 6 Aug sale into USD; if
// this list needs to look busier for a demo the fix is more silver rows
// in Persona, not anything here.
// The SHARED ActivityTable is the same component the Activity screen and
// the Dashboard use. No hide list: there has never been an "account"
// column, so the hide={["account"]} this screen used to pass did nothing.
//
// Reached from the dashboard's Silver card, or from Wallets in the rail;
// the toolbar leading slot carries the Back affordance.

const METAL = "silver";

export default function SilverWalletPage() {
  const label = Persona.DEFAULT.balances[METAL].label;
  return (
    <>
      {/* Holding + price, side by side */}
      <Section pad="none" className="pt-8">
        {/* THE PAGE TITLE (Ali, 1 Oct): an h1 on every page, the style
            Activity set, 16 above the content. */}
        <Container maxW="xl" className="pb-4">
          <h1 className="text-2xl font-semibold text-foreground">{label}</h1>
        </Container>
        <Container maxW="xl" grid className="gap-6">
          <MetalWalletCardV2 asset={METAL} vaults className="col-span-12 lg:col-span-7" />
          <MetalPriceCard metal={METAL} className="col-span-12 lg:col-span-5" />
        </Container>
      </Section>

      {/* Every row that moves this wallet */}
      <Section pad="none" className="py-10">
        <Container maxW="xl">
          <Stack gap="md">
            <h2 className="text-lg font-semibold text-foreground">
              {label} activity
            </h2>
            <ActivityTableV2 rows={Persona.useActivity(METAL)} />
          </Stack>
        </Container>
      </Section>
    </>
  );
}
