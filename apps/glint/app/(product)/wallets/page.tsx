"use client";

// Promoted from Studio screen "Dashboard — logged-in home"
// (design dmskex612bcy1, version 1786530535089). Registry: lib/screens.ts;
// re-promotion workflow: apps/glint/README.md.
// source-hash: b8724701e90b
// (the drift guard's signature of the Studio source this page was
// built from, so check:promotions measures Studio against THIS copy
// and not against a baseline that --update can rewrite.)

import {
  Section,
  Container,
  Stack,
  Row,
  Grid,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  ToggleGroup,
  ToggleGroupItem,
} from "@gradeui/ui";
import { AppChrome } from "@/components/layouts/app-chrome";
import {
  Persona,
  type AssetKey,
  type PersonaPreferences,
} from "@/lib/persona";
import { Market, type MetalUnit } from "@/lib/market";
import { Wordmark } from "@/components/wordmark";
import { TradeFlow } from "@/components/trade-flow";
import { Accounts } from "@/lib/accounts";
import { MetalButton } from "@/components/metal-button";
import { ActivityTable } from "@/components/activity-table";
import { AutoInvestToggle } from "@/components/auto-invest-toggle";
import { Plus, ChevronRight } from "lucide-react";

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
// metal automatically, which is why the activity list shows a deposit
// followed a minute later by a purchase nobody placed by hand. The
// control is live: it writes the preference through Persona, so it can
// be flipped in front of someone mid-demo.
// TOTAL BALANCE: "Balance" + the large combined number above the asset
// cards, summing the three reactive balances.
// CARD MARKS (Ali, 11 Aug): every card leads its title with the Glint
// G at a larger title size, including USD, because that card is the
// customer's Glint wallet for fiat, not a foreign account. The metals
// wear the G in their FLAT brand colour (Wordmark tone="current" plus
// Wordmark.metalSolid). USD takes the action blue for now; a custom
// dollar mark drawn to match the G is coming.
// WHOLE CARD IS THE TARGET: Card `interactive` carries the goto, so the
// click target is the tile and not a 40px chevron. All three wallets
// have a screen now (see CARD_TARGETS), so no card here is inert. The
// chevron is DECORATION: aria-hidden, no handler of its own, and the DS
// lights it on card hover so the two read as one affordance.
// TRADE FLOW: the Buy Gold / Buy Silver pills open TradeFlow, the one
// modal that runs BOTH directions (buy by default, direction="sell"
// inverts the field order). There is no BuyFlow any more. This page
// offers the buy side only; the Sell action sits on the wallet screens.
// A completed order moves the Persona balances and every card here
// updates live.
// ACTIVITY: the SHARED ActivityTable, trimmed to a recent list.

const ASSET_ORDER: AssetKey[] = ["gold", "silver", "fiat"];

/* Card goto targets, keyed by asset. THE VALUES ARE STUDIO SCREEN
   NAMES: the goto bridge resolves them against the screen registry, so
   the long dash in each string is part of a name and has to match the
   screen character for character. It is not prose. */
const CARD_TARGETS = {
  gold: "Gold — wallet",
  /* ASSUMPTION (11 Aug): silver was missing here while the promoted app
     copy already wired it, so the silver tile was dead in Studio alone.
     Wired back alongside USD, because "no card here is inert" above is
     only true when all three lead somewhere. */
  silver: "Silver — wallet",
  fiat: "USD — wallet",
};

/** The Glint G in front of a card title, in the wallet's own colour:
 *  the flat metal for gold and silver, the action blue for fiat. */
function AssetMark({ asset }: { asset: AssetKey }) {
  const color =
    asset === "fiat" ? "oklch(var(--primary))" : Wordmark.metalSolid(asset);
  return (
    <Wordmark lockup="mark" tone="current" className="size-5" style={{ color }} />
  );
}

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

function BalanceCard({ asset }: { asset: AssetKey }) {
  const [amount] = Persona.useBalance(asset);
  /* fiat has no unit preference, so it borrows unit.gold and never reads
     the value: the cash card shows the auto-invest setting instead. The
     cast is the annotation promotion drops. */
  const unitKey = (asset === "fiat"
    ? "unit.gold"
    : `unit.${asset}`) as keyof PersonaPreferences;
  const [unit] = Persona.usePreference(unitKey);
  const meta = Persona.DEFAULT.balances[asset];
  /* Metals show the holding in the persona's preferred unit.
     THE CASH CARD SHOWS THE AUTO-INVEST SETTING (Ali, 11 Aug: "rather
     than displaying the routing number and account, lets display what the
     auto-invest setting is as this seems to be a big thing"). It is the
     one line on this card a customer would act on: the routing and
     account numbers are reference data, they belong on the USD wallet
     screen where you go to set up a transfer, and they are still there.
     Composed from the control's own labelFor, so the card and the toggle
     can never disagree about what "gold" is called. */
  const [autoInvest] = Persona.usePreference("autoInvest");
  const autoLabel = AutoInvestToggle.labelFor(autoInvest);
  /* WHERE IT IS STORED, after the quantity (Ali, 12 Aug: "our home cards
     need to reflect where the Gold or Silver is stored... an interpunct
     next to the amount, followed by the amount of vaults"). Reactive, so
     a purchase into a vault the persona never used takes the count from
     one to two in front of you. Cash has no vaults and says nothing:
     its line carries the auto-invest setting instead. */
  const vaults = Persona.useVaults(asset);
  const vaultCount =
    vaults.length === 1 ? "1 vault" : `${vaults.length} vaults`;
  const detail =
    asset === "fiat"
      ? autoInvest === "none"
        ? "Auto-invest off"
        : `Auto-invest to ${autoLabel}`
      : `${Market.fmtQty(
          Market.toQty(amount, asset, unit as MetalUnit),
          unit as MetalUnit,
        )} · ${vaultCount}`;
  const target = CARD_TARGETS[asset];
  return (
    <Card
      interactive={Boolean(target)}
      data-grade-goto={target}
      aria-label={target ? `Open ${meta.label}` : undefined}
    >
      {/* pt-4 not the default pt-6 (Ali, 11 Aug): the title sits
          closer to the card top so the figure below has the room. */}
      <CardHeader className="pb-2 pl-6 pt-4">
        <Row justify="between" align="center">
          <Row gap="sm" align="center">
            <AssetMark asset={asset} />
            <CardTitle className="text-lg">{meta.label}</CardTitle>
          </Row>
          {target && (
            <Button
              asChild
              variant="outline"
              size="lg"
              iconOnly
              raised={false}
              className="rounded-full"
            >
              <span aria-hidden="true">
                {/* Optical centring: a chevron's mass sits left of its
                    box, so nudge it back at rest. 1px, not 2 (Ali,
                    11 Aug): 2px overshot and read as off-centre the
                    other way. */}
                <ChevronRight className="size-4 translate-x-[1px]" />
              </span>
            </Button>
          )}
        </Row>
      </CardHeader>
      <CardContent>
        <Stack gap="xs">
          <span className="text-2xl font-semibold text-foreground">{Persona.fmtMoney(amount)}</span>
          <span className="text-sm text-muted-foreground">{detail}</span>
        </Stack>
      </CardContent>
    </Card>
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
  const activity = Persona.DEFAULT.activity;
  return (
    <>
      {/* THE ACTIONS RENDER IN THE TOOLBAR, not here. AppChrome.Slot
          registers them into the chrome and renders nothing in place, so
          they sit up top and stay there while this page scrolls.
          IT HAS TO BE A SLOT IN THE BODY, not a prop on AppChrome:
          promotion strips the wrapper and its props (the route layout
          supplies the chrome in the app), so a toolbarLeading set here
          would render in Studio and vanish in the app. That was tried. */}
      <AppChrome.Slot region="leading">
        <Row gap="sm">
          {/* NO variant ON A MetalButton: it sets background, color and
              borderColor as an INLINE style, and an inline style beats a
              variant's classes, so the pill renders the same metal face
              whichever variant is passed. Passing one only implied it did
              something. */}
          <TradeFlow metal="gold">
            <MetalButton metal="gold" size="sm">
              Buy Gold
            </MetalButton>
          </TradeFlow>
          <TradeFlow metal="silver">
            <MetalButton metal="silver" size="sm">
              Buy Silver
            </MetalButton>
          </TradeFlow>
          {/* Deposit IS a real Button, so `variant` is not dead here the
              way it is on a MetalButton: secondary demotes it behind the
              two metal pills. Inert, no deposit flow in the demo. */}
          <Button variant="secondary" size="sm" className="rounded-full">
            <Plus className="size-4" />
            Deposit
          </Button>
        </Row>
      </AppChrome.Slot>

      {/* Balance, with Auto-invest alongside it. pt-8 because this is
          the first band under the toolbar now that the actions have
          moved into the chrome. */}
      {/* pt-4, was pt-8 (Ali, 11 Aug: "quite large"). The actions are
          in the toolbar now, so this band sits directly under it and
          does not need a band-sized gap above it. */}
      <Section pad="sm" className="pt-4">
        <Container maxW="xl">
          <Stack gap="lg">
            <Row justify="between" align="end" wrap gap="md">
              <TotalBalance />
              <AutoInvestToggle />
            </Row>
            <Grid cols="3" gap="lg">
              {ASSET_ORDER.map((asset) => (
                <BalanceCard key={asset} asset={asset} />
              ))}
            </Grid>
          </Stack>
        </Container>
      </Section>

      {/* Activity: recent only; filters live on the Activity screen */}
      <Section pad="none" className="py-10">
        <Container maxW="xl">
          <Stack gap="md">
            <Row gap="sm" align="baseline">
              <h2 className="text-lg font-semibold text-foreground">Activity</h2>
              <Button
                variant="link"
                size="sm"
                data-grade-goto="Activity — history"
              >
                View all
                <ChevronRight className="size-4" />
              </Button>
            </Row>
            {/* hide takes REAL column keys, and only these: fiatAmount,
                status, timestamp (description is not hideable). "type"
                is NOT one of them. The method renders inside the
                description cell, so there has never been a column by
                that key and hiding it did nothing at all. Status goes
                because a recent list under a dashboard is a glance, not
                a ledger. */}
            <ActivityTable rows={activity} limit={5} hide={["status"]} />
          </Stack>
        </Container>
      </Section>
    </>
  );
}
