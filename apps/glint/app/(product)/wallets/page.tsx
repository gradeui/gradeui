"use client";

// Promoted from Studio screen "Dashboard — logged-in home"
// (design dmskex612bcy1, version 1786463799728). Registry: lib/screens.ts;
// re-promotion workflow: apps/glint/README.md.
// source-hash: f626c9d9c231
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
import { Persona, type AssetKey, type AutoInvest } from "@/lib/persona";
import { Market } from "@/lib/market";
import { Wordmark } from "@/components/wordmark";
import { TradeFlow } from "@/components/trade-flow";
import { Accounts } from "@/lib/accounts";
import { MetalButton } from "@/components/metal-button";
import { ActivityTable } from "@/components/activity-table";
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

/* What a USD deposit does on arrival. Values are the autoInvest
   preference; "none" leaves the cash sitting in the USD wallet. */
const AUTO_INVEST = [
  { value: "gold", label: "Gold" },
  { value: "silver", label: "Silver" },
  { value: "none", label: "Off" },
];

/** The Glint G in front of a card title, in the wallet's own colour:
 *  the flat metal for gold and silver, the action blue for fiat. */
function AssetMark({ asset }: { asset: AssetKey }) {
  const color =
    asset === "fiat" ? "oklch(var(--primary))" : Wordmark.metalSolid(asset);
  return (
    <Wordmark lockup="mark" tone="current" className="size-5" style={{ color }} />
  );
}

/** Auto-invest: the headline feature, on the page rather than behind a
 *  settings screen. Reads and writes the persona preference, so a demo
 *  can flip it live.
 *
 *  CALLED "Auto-invest" (Ali, 11 Aug, his pick over the "Direct Invest"
 *  I proposed). The label used to read "Direct Gold" while the control
 *  offers Gold, Silver and Off, so choosing Silver left a label naming
 *  the other metal. "Auto-invest" is metal-agnostic and matches the
 *  preference key, which is already autoInvest.
 *  TWO NAMES DO NOT MOVE WITH IT: the autoInvest preference key, and
 *  Persona's TX_METHOD_LABEL mapping of "direct-gold" to "Direct Gold".
 *  That second one is the name of the METHOD on an activity row, the
 *  thing that converted a deposit, and it keeps its product name. */
function AutoInvest() {
  const [mode, setMode] = Persona.usePreference("autoInvest");
  return (
    /* Label to the LEFT of the control, no explainer line above it: the
       segment names the metal, so a sentence saying the same thing was
       just noise. The metal tint stays on the LABEL and never touches
       the track, which has its own surface. */
    <Row gap="sm" align="center">
      <span className="text-sm font-medium text-foreground">Auto-invest</span>
      <ToggleGroup
        type="single"
        variant="segmented"
        size="sm"
        value={mode}
        onValueChange={(v) => v && setMode(v as AutoInvest)}
      >
        {AUTO_INVEST.map((o) => (
          <ToggleGroupItem
            key={o.value}
            value={o.value}
            /* Equal width so the control does not jitter as the label
               changes: "Off" is half the width of "Silver", and a
               segmented control whose segments resize reads as broken. */
            className="min-w-16"
            /* The selected metal tints its LABEL with the flat brand
               colour rather than wearing the polished gradient face.
               The 45deg sweep is built for a 100px button; compressed
               into a 50px segment it loses its travel and reads as flat
               washed beige on the dark track. */
            style={
              mode === o.value && o.value !== "none"
                ? { color: Wordmark.metalSolid(o.value) }
                : undefined
            }
          >
            {o.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </Row>
  );
}

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
  /* ASSUMPTION (annotation, not a rewrite): the template literal widens
     to "unit.fiat", which is not a preference key, so the key is cast
     rather than branched. That keeps the call exactly what Studio emits:
     fiat asks for an absent key, gets undefined, and never reads it (the
     fiat branch below shows routing and account numbers, not a unit). */
  const [unit] = Persona.usePreference(
    `unit.${asset}` as "unit.gold" | "unit.silver",
  );
  const meta = Persona.DEFAULT.balances[asset];
  /* Metals show the holding in the persona's preferred unit; the cash
     account calls out its routing and account numbers. */
  const detail =
    asset === "fiat"
      ? Accounts.identifiers("fiat")
      : Market.fmtQty(Market.toQty(amount, asset, unit), unit);
  const target = CARD_TARGETS[asset];
  return (
    <Card
      interactive={Boolean(target)}
      data-grade-goto={target}
      aria-label={target ? `Open ${meta.label}` : undefined}
    >
      <CardHeader className="pb-2 pl-6">
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
                    box, so nudge it back at rest. */}
                <ChevronRight className="size-4 translate-x-[2px]" />
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
  const activity = Persona.DEFAULT.activity;
  return (
    <>
      {/* Product actions (no Send/Transfer, not in the verb set;
          selling lives on the wallet screens) */}
      <Section pad="none" className="pt-8">
        <Container maxW="xl">
          <Row gap="sm">
            <Button size="md" className="rounded-full">
              <Plus className="size-4" />
              Deposit
            </Button>
            {/* NO variant ON A MetalButton: it sets background, color
                and borderColor as an INLINE style, and an inline style
                beats a variant's classes, so the pill renders the same
                metal face whichever variant is passed. Passing one only
                implied it did something. */}
            <TradeFlow metal="gold">
              <MetalButton metal="gold" size="md">
                Buy Gold
              </MetalButton>
            </TradeFlow>
            <TradeFlow metal="silver">
              <MetalButton metal="silver" size="md">
                Buy Silver
              </MetalButton>
            </TradeFlow>
          </Row>
        </Container>
      </Section>

      {/* Balance, with Auto-invest alongside it */}
      <Section pad="sm">
        <Container maxW="xl">
          <Stack gap="lg">
            <Row justify="between" align="end" wrap gap="md">
              <TotalBalance />
              <AutoInvest />
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
