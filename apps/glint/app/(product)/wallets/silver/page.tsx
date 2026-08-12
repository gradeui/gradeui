"use client";

// Promoted from Studio screen "Silver — wallet"
// (design dmsoj5uvz94l3, version 1786532788454). Registry: lib/screens.ts;
// re-promotion workflow: apps/glint/README.md.
// source-hash: dc036fa15c70
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
import { MetalWalletCard } from "@/components/metal-wallet-card";
import { ActivityTable } from "@/components/activity-table";

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
// takes the left 5 columns and the chart the right 7, so the page still
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
        <Container maxW="xl" grid className="gap-6">
          <MetalWalletCard metal={METAL} className="col-span-12 lg:col-span-5" />
          <MetalPriceCard metal={METAL} className="col-span-12 lg:col-span-7" />
        </Container>
      </Section>

      {/* Every row that moves this wallet */}
      <Section pad="none" className="py-10">
        <Container maxW="xl">
          <Stack gap="md">
            <h2 className="text-lg font-semibold text-foreground">
              {label} activity
            </h2>
            <ActivityTable rows={Persona.useActivity(METAL)} />
          </Stack>
        </Container>
      </Section>
    </>
  );
}
