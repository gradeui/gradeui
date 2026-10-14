"use client";

// Promoted from Studio screen "Dashboard — logged-in home v2"
// (design dmuppmsu1t19c, version 1792007390435). Registry: lib/screens.ts;
// re-promotion workflow: apps/glint/README.md.
// source-hash: 8b5a78321bc4
// (the drift guard's signature of the Studio source this page was
// built from, so check:promotions measures Studio against THIS copy
// and not against a baseline that --update can rewrite.)

// Dashboard — logged-in home v2: the business portal's Wallets page on
// staging. A copy of "Dashboard — logged-in home", which stays untouched
// because the live demo is promoted from it.
//
// 7 OCT, MATCHED TO "Glint - Web Portal - Full New", Wallets · Default
// (72:163336, Light and Dark) and Mobile:
//   - the Web DS AppShell (AppChromeV2), breadcrumb "Wallets";
//   - the title, Raleway Bold 24/32; then Balance (Chivo SemiBold 18/28
//     muted-foreground) over the DisplayNumber lg, the dollar total of the
//     three wallets;
//   - "Gold and Silver currencies" (Chivo SemiBold 18/28), the Gold and
//     Silver WalletGroupCards side by side, 16 apart, 16 under the heading;
//   - "Fiat currency", the USD card and the Auto-buy card beside it.
//   Blocks are 24 apart; on mobile 16, one card per row.
//
// AUTO-BUY IS ON BY DEFAULT ON STAGING NOW (Ali, 7 Oct, listing auto-buy
// among what staging needs). The card shows unless ?autobuy=off; see
// StagingSwitches.
//
// ASSUMPTION, MOBILE: the Mobile slide is older than the 7 Oct desktop
// (it still has a Buy and Sell row under each card as well as the card's
// own, and no section headings). Mobile here is the desktop page in one
// column, with the card's own actions only.

// 14 OCT, THE SYSTEM STATES on this page (StagingSwitches): ?announce=on
// puts Full New's announcement bar above the title (Announcement bar ·
// Default), dismissed for the tab by its X; its link opens nothing
// (ASSUMPTION: there is no "how it works" page). ?state=inline replaces
// the wallet cards with the Web DS EmptyState of Error · Inline ("We
// couldn't load your wallets", Try again back to the live page).
import * as React from "react";
import { AppChromeV2 } from "@/components/layouts/app-chrome-v2";
import { Persona } from "@/lib/persona";
import { DisplayNumber } from "@/components/display-number";
import { WalletGroupCardV2 } from "@/components/wallet-group-card-v2";
import { AutoBuyV2 } from "@/components/auto-buy-v2";
import { StagingSwitches } from "@/lib/staging-switches";
import { FlowStore } from "@/lib/flow-store";
import { WebDsV2 } from "@/components/web-ds-v2";

export default function WalletsPage() {
  const autoBuy = StagingSwitches.useAutoBuy();
  const [gold] = Persona.useBalance("gold");
  const [silver] = Persona.useBalance("silver");
  const [fiat] = Persona.useBalance("fiat");
  const announce = StagingSwitches.useAnnounce();
  const [dismissed, setDismissed] = FlowStore.useField("v2.announce.dismissed", false);
  const inline = StagingSwitches.useState() === "inline";

  return (
    <>
      <AppChromeV2.Main>
        {announce && !dismissed ? (
          <WebDsV2.AnnouncementBar
            message="New: Auto-buy puts every deposit into Gold or Silver."
            link="See how it works"
            onDismiss={() => setDismissed(true)}
          />
        ) : null}
        <AppChromeV2.Title>Wallets</AppChromeV2.Title>

        <div className="flex flex-col">
          <span className="text-sm font-semibold leading-5 text-muted-foreground md:text-lg md:leading-7">
            Balance
          </span>
          <DisplayNumber value={gold + silver + fiat} currency size="lg" className="text-foreground" />
        </div>

        {inline ? (
          <WebDsV2.EmptyState
            title="We couldn’t load your wallets"
            body="Check your connection and try again."
            actions={
              <WebDsV2.Button size="lg" onClick={AppChromeV2.backToLive}>
                Try again
              </WebDsV2.Button>
            }
          />
        ) : null}
        {inline ? null : (
        <>
        <section className="flex flex-col gap-4">
          <AppChromeV2.Heading>Gold and Silver currencies</AppChromeV2.Heading>
          <div className="grid gap-4 md:grid-cols-2">
            <WalletGroupCardV2 asset="gold" link="Gold — wallet v2" />
            <WalletGroupCardV2 asset="silver" link="Silver — wallet v2" />
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <AppChromeV2.Heading>Fiat currency</AppChromeV2.Heading>
          <div className="grid gap-4 md:grid-cols-2">
            <WalletGroupCardV2 asset="fiat" link="USD — wallet v2" />
            {autoBuy ? <AutoBuyV2.Card /> : null}
          </div>
        </section>
        </>
        )}
      </AppChromeV2.Main>
    </>
  );
}
