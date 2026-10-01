"use client";

// Promoted from Studio screen "Dashboard — logged-in home v2"
// (design dmuppmsu1t19c, version 1790875936526). Registry: lib/screens.ts;
// re-promotion workflow: apps/glint/README.md.
// source-hash: 0d49c0fd942d
// (the drift guard's signature of the Studio source this page was
// built from, so check:promotions measures Studio against THIS copy
// and not against a baseline that --update can rewrite.)

import {
  Section,
  Container,
  Stack,
  Row,
  Grid,
  Button,
  ToggleGroup,
  ToggleGroupItem,
} from "@gradeui/ui";
import { AppChromeV2 } from "@/components/layouts/app-chrome-v2";
import { Persona, type AssetKey } from "@/lib/persona";
import { TradeFlowV2 } from "@/components/trade-flow-v2";
import { MetalButton } from "@/components/metal-button";
import { AutoInvestToggle } from "@/components/auto-invest-toggle";
import { MetalWalletCardV2 } from "@/components/metal-wallet-card-v2";
import { Plus } from "lucide-react";

// V2 (1 Oct 2026, the business portal v2 for staging): a copy of
// "Dashboard — logged-in home", which stays untouched because the live
// demo is promoted from it. What changed here, and only here:
//   - NO ACTIVITY TABLE and no transactions on this screen (Ali, 1 Oct):
//     the Activity page is where history lives. The page is the balance,
//     Auto-buy and three wallet cards of one design: Gold, Silver, USD.
//   - Buy Gold and Buy Silver open TradeFlowV2: paid from the USD
//     wallet, one amount field, shortfall to Deposit.
//   - Deposit goes to the USD wallet, where the Glint account details are,
//     the same place a short buy sends you.
//   - THE CARDS ARE MetalWalletCardV2 (Ali, 1 Oct: "matching our new Gold
//     and silver wallet cards"): the App DS metal face for Gold and
//     Silver, and the same card in its own non-metal treatment for USD,
//     each with its actions under it (Buy and Sell; Deposit for USD). The
//     card component owns all of that, including where the metal is held.
//   - The Gold and Silver cards lead to the v2 wallet screens.
//   - The chrome is AppChromeV2: no rail on mobile, a top bar instead.
//
// Mercury-pattern logged-in home, Glint-flavoured, for BUSINESS accounts.
// Routed at /wallets in the app; the nav item is WALLETS (Ali, 11 Aug).
// CHROME EXTRACTED (10 Aug 2026): the sidebar rail + sticky toolbar live
// in the AppChrome shared component; this screen supplies only the
// scrolling content sections.
// PERSONA-DRIVEN: identity, balances, activity and DISPLAY PREFERENCES
// come from Persona (Ridgeline Construction). A metal card states its
// holding in that metal's PREFERRED UNIT, Persona's unit.gold and
// unit.silver, which are both grams today (Ali, 11 Aug). Flip one to oz
// and only that card's quantity line changes, never its cash figure.
// No welcome greeting: the page opens on the action row.
// AUTO-INVEST sits BESIDE THE BALANCE (Ali, 11 Aug: "this is apparently
// the number one feature"), not buried in a settings screen. It is the
// autoInvest preference: money landing in the USD wallet converts to
// metal automatically, which is why Activity shows a deposit
// followed a minute later by a purchase nobody placed by hand. The
// control is live: it writes the preference through Persona, so it can
// be flipped in front of someone mid-demo.
// TOTAL BALANCE: "Balance" + the large combined number above the asset
// cards, summing the three reactive balances.
// TRADE FLOW: the Buy Gold / Buy Silver pills open TradeFlowV2, the one
// dialog that runs BOTH directions. This page offers the buy side only;
// Sell sits on the metal wallet screens. A completed order moves the
// Persona balances and every card here updates live.

const ASSET_ORDER: AssetKey[] = ["gold", "silver", "fiat"];

/* Card goto targets, keyed by asset. THE VALUES ARE STUDIO SCREEN
   NAMES: the goto bridge resolves them against the screen registry, so
   the long dash in each string is part of a name and has to match the
   screen character for character. It is not prose. */
const CARD_TARGETS = {
  gold: "Gold — wallet v2",
  /* ASSUMPTION (11 Aug): silver was missing here while the promoted app
     copy already wired it, so the silver tile was dead in Studio alone.
     Wired back alongside USD, because "no card here is inert" above is
     only true when all three lead somewhere. */
  silver: "Silver — wallet v2",
  fiat: "USD — wallet",
};

/* THE AUTO-INVEST CONTROL LIVES IN ITS OWN SHARED COMPONENT NOW (Ali,
   11 Aug: "I'd extract the toggle group as a shared component on its
   own"). It was defined here, and the Glint USD wallet card needed the
   same control, so a second use would have been a paste. AutoInvestToggle
   reads and writes the preference itself, so both surfaces show one value.
   Its OPTIONS / labelFor statics are where the labels live. */

/** The combined holdings figure, reactive across all three assets. */
function TotalBalance() {
  const [gold] = Persona.useBalance("gold");
  const [silver] = Persona.useBalance("silver");
  const [fiat] = Persona.useBalance("fiat");
  return (
    <Stack gap="xs">
      <span className="text-sm font-medium text-muted-foreground">Balance</span>
      <span className="text-4xl font-semibold text-foreground">
        {Persona.fmtMoney(gold + silver + fiat)}
      </span>
    </Stack>
  );
}

export default function WalletsPage() {
  /* ORDER IS BUY GOLD, BUY SILVER, THEN DEPOSIT (Ali, 11 Aug). The
     metals are what the product is for; funding is the thing you do so
     you can do them, so Deposit is secondary and comes last. It led the
     row before, which read as "fund your account" being the point.

     THE ACTIONS CANNOT LIVE IN THE TOOLBAR, though Ali asked whether they
     could and it was tried. The toolbar belongs to the CHROME, and the
     chrome is shared: promotion strips the <AppChrome> wrapper from this
     screen because apps/glint/app/(product)/layout.tsx supplies it, and
     `--unwrap` takes the wrapper's PROPS with it by design. So a
     toolbarLeading set here renders in Studio and vanishes in the app.
     Supplying them from the route layout instead would mean authoring the
     same three buttons twice, once in this screen and once in app-only
     glue with no Studio twin, which is exactly the drift that has bitten
     this project. If they should ever be sticky, the honest fix is a real
     page-actions slot on AppChrome that the layout can forward, not a
     second copy. */
  return (
    <>
      {/* THE ACTIONS RENDER IN THE TOOLBAR, not here. AppChrome.Slot
          registers them into the chrome and renders nothing in place, so
          they sit up top and stay there while this page scrolls.
          IT HAS TO BE A SLOT IN THE BODY, not a prop on AppChrome:
          promotion strips the wrapper and its props (the route layout
          supplies the chrome in the app), so a toolbarLeading set here
          would render in Studio and vanish in the app. That was tried. */}
      <AppChromeV2.Slot region="leading">
        <Row gap="sm">
          {/* NO variant ON A MetalButton: it sets background, color and
              borderColor as an INLINE style, and an inline style beats a
              variant's classes, so the pill renders the same metal face
              whichever variant is passed. Passing one only implied it did
              something. */}
          <TradeFlowV2 metal="gold">
            <MetalButton metal="gold" size="sm">
              Buy Gold
            </MetalButton>
          </TradeFlowV2>
          <TradeFlowV2 metal="silver">
            <MetalButton metal="silver" size="sm">
              Buy Silver
            </MetalButton>
          </TradeFlowV2>
          {/* Deposit IS a real Button, so `variant` is not dead here the
              way it is on a MetalButton: secondary demotes it behind the
              two metal pills. V2: it goes to the USD wallet, where the
              Glint account details a deposit is sent to are shown. There
              is no deposit flow in the demo; the transfer happens at the
              business's own bank. */}
          <Button
            variant="secondary"
            size="sm"
            className="rounded-full"
            data-grade-goto="USD — wallet"
          >
            <Plus className="size-4" />
            Deposit
          </Button>
        </Row>
      </AppChromeV2.Slot>

      {/* Balance, with Auto-buy alongside it. pt-8 because this is
          the first band under the toolbar now that the actions have
          moved into the chrome. */}
      {/* pt-4, was pt-8 (Ali, 11 Aug: "quite large"). The actions are
          in the toolbar now, so this band sits directly under it and
          does not need a band-sized gap above it. */}
      {/* py-6 ON BOTH BANDS (Ali, 12 Aug). Section's own scale has no 6
          (pad="sm" is py-8 md:py-12), so this is pad="none" plus the
          class. The top band was pad="sm" with pt-4 and the activity band
          py-10, which put a different gap above and below the cards; one
          value for both is what makes the page read as evenly spaced. */}
      <Section pad="none" className="py-6">
        <Container maxW="xl">
          <Stack gap="lg">
            <Row justify="between" align="end" wrap gap="md">
              <TotalBalance />
              <AutoInvestToggle />
            </Row>
            <Grid cols="3" gap="lg">
              {ASSET_ORDER.map((asset) => (
                <MetalWalletCardV2
                  key={asset}
                  asset={asset}
                  link={CARD_TARGETS[asset]}
                />
              ))}
            </Grid>
          </Stack>
        </Container>
      </Section>
    </>
  );
}
