"use client";

// Promoted from Studio screen "Gold — wallet v2"
// (design dmuppmu4zpn8y, version 1790879475503). Registry: lib/screens.ts;
// re-promotion workflow: apps/glint/README.md.
// source-hash: a905f37d6c40
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
// "Gold — wallet", which stays untouched because the live demo is
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
// Glint Gold wallet screen (Ali, 10 Aug 2026; componentised 11 Aug):
// the desktop gold view. Holding card and price card side by side, then
// all gold activity.
//
// THIS SCREEN IS ONE LINE OF METAL (Ali, 11 Aug). Everything that was
// duplicated between the gold and silver screens now lives in
// MetalPriceCard and MetalWalletCard, so the two screens differ by the
// METAL const below and nothing else. Before this, silver was a paste of
// gold and had inherited gold's header comment, gold's Y-axis padding
// (which squashed the silver line into a tenth of the card) and gold's
// section comments. There is no longer anywhere for that to happen.
// Change the cards, not this file, for anything visual.
//
// WALLET CARD LEADS, ON THE LEFT (Ali, 11 Aug). The holding is what you
// came to the screen for; the price is context for it. The narrower card
// takes the left 7 columns (5 until 1 Oct) and the chart the right 5, so the page still
// reads as one asymmetric pair rather than two equal blocks.
//
// ACTIVITY: Persona.useActivity(METAL) is the shared wallet filter, so
// the three wallet screens cannot disagree about which rows belong to a
// wallet. It matches on the row's `account` and `counterAccount`, which
// is why the two Direct Gold purchases appear here: they are gold rows
// funded from USD. Filtering on `metal` instead, which this screen used
// to do, cannot express the cash wallet at all.
// The SHARED ActivityTable is the same component the Activity screen and
// the Dashboard use. No hide list: there has never been an "account"
// column, so the hide={["account"]} this screen used to pass did nothing.
//
// Reached from the dashboard's Gold card, or from Wallets in the rail;
// the toolbar leading slot carries the Back affordance.

const METAL = "gold";

export default function GoldWalletPage() {
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
