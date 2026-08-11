"use client";

// Promoted from Studio screen "Dashboard — logged-in home"
// (design dmskex612bcy1, version 1786435743706). Registry: lib/screens.ts;
// re-promotion workflow: apps/glint/README.md.

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
import { Plus, ChevronRight } from "lucide-react";
import { Persona, type AssetKey, type AutoInvest } from "@/lib/persona";
import { Market } from "@/lib/market";
import { accountIdentifiers, accountLabel } from "@/lib/accounts";
import { MetalButton } from "@/components/metal-button";
import { ActivityTable } from "@/components/activity-table";
import { Wordmark, metalSolid } from "@/components/wordmark";
import { TradeFlow } from "@/components/trade-flow";

// Mercury-pattern logged-in home for BUSINESS accounts. The chrome
// comes from the (product) route layout; this page supplies only the
// scrolling content sections.
// PERSONA-DRIVEN: identity, balances and activity come from
// lib/persona (Ridgeline Construction, the CEO's construction-company
// ask). No welcome greeting: the page opens on the action row.
// TOTAL BALANCE: "Balance" + the large combined number above the asset
// cards, summing the three reactive balances. Card headers use
// CardTitle with a trailing chevron button (inert until the wallet
// screens join the app).
// METAL BUTTONS: Buy Gold / Buy Silver wear the pinned metal ladders
// as self-contained gradient pills; no icons.
// HOLDINGS: metal cards show troy ounces at the latest LBMA price.
// BUY FLOW: the metal pills open the BuyFlow modal; a completed
// order moves the Persona balances and every card here follows.
// ACTIVITY: plain recent list; the tabbed filters live on /activity.

const ASSET_ORDER: AssetKey[] = ["gold", "silver", "fiat"];

/* Card chevron targets — assets gain one as their screens are built. */
const CARD_TARGETS: Partial<Record<AssetKey, string>> = {
  gold: "Gold — wallet",
};

/** The Glint G in front of a card title, in the wallet's own colour:
 *  the flat metal for gold and silver, the action blue for fiat. USD
 *  carries the G too — that card is the customer's Glint wallet for
 *  fiat, not a foreign account. A custom dollar mark drawn to match
 *  the G is coming. */
function AssetMark({ asset }: { asset: AssetKey }) {
  const color =
    asset === "fiat" ? "oklch(var(--primary))" : metalSolid(asset);
  return (
    <Wordmark lockup="mark" tone="current" className="size-5" style={{ color }} />
  );
}

/* What a USD deposit does on arrival. Values are the autoInvest
   preference; "none" leaves the cash sitting in the USD wallet. */
const AUTO_INVEST: { value: AutoInvest; label: string }[] = [
  { value: "gold", label: "Gold" },
  { value: "silver", label: "Silver" },
  { value: "none", label: "Off" },
];

/** Direct Gold: the headline feature, on the page rather than behind a
 *  settings screen (Ali, 11 Aug: "this is apparently the number one
 *  feature"). Reads and writes the persona preference, so a demo can
 *  flip it live, and it is why the activity list shows a deposit
 *  followed a minute later by a purchase nobody placed by hand. */
function DirectInvest() {
  const [mode, setMode] = Persona.usePreference("autoInvest");
  return (
    /* Label to the LEFT of the control, no explainer line above it: the
       segment names the metal, so a sentence saying the same thing was
       just noise. The metal tint stays on the LABEL and never touches
       the track, which has its own surface. */
    <Row gap="sm" align="center">
      <span className="text-sm font-medium text-foreground">Direct Gold</span>
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
            /* The selected metal tints its LABEL with the flat brand
               colour rather than wearing the polished gradient face.
               The 45deg sweep is built for a 100px button; compressed
               into a 50px segment it loses its travel and reads as flat
               washed beige on the dark track. The flat colour says the
               same thing and stays legible. */
            style={
              mode === o.value && o.value !== "none"
                ? { color: metalSolid(o.value as "gold" | "silver") }
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
  /* Hooks run unconditionally; fiat reads unit.gold harmlessly (the
     value is unused on the fiat branch below). */
  const unitKey = (asset === "fiat" ? "unit.gold" : `unit.${asset}`) as
    | "unit.gold"
    | "unit.silver";
  const [unit] = Persona.usePreference(unitKey);
  const meta = Persona.DEFAULT.balances[asset];
  /* Metals show the holding in the persona's preferred unit; the cash
     account shows its routing and account numbers, which the CEO asked
     to have called out explicitly (11 Aug). */
  const detail =
    asset === "fiat"
      ? accountIdentifiers("fiat")
      : Market.fmtQty(Market.toQty(amount, asset, unit), unit);
  const target = CARD_TARGETS[asset];
  return (
    /* The WHOLE tile is the target (Ali, 11 Aug), not a 40px chevron.
       The DS lights the trailing button when the card is hovered, so
       the two read as one affordance. */
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
                    box, so a glyph mathematically centred in a circle
                    reads a couple of pixels left of centre. Nudged at
                    rest — not a hover effect. */}
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

export default function DashboardPage() {
  const activity = Persona.DEFAULT.activity;
  return (
    <>
      {/* Product actions (no Send/Transfer — not in the verb set;
          selling lives on the wallet screens) */}
      <Section pad="none" className="pt-8">
        <Container maxW="xl">
          <Row gap="sm">
            <Button size="md" className="rounded-full">
              <Plus className="size-4" />
              Deposit
            </Button>
            <TradeFlow metal="gold">
              <MetalButton metal="gold" variant="secondary" size="md">
                Buy Gold
              </MetalButton>
            </TradeFlow>
            <TradeFlow metal="silver">
              <MetalButton metal="silver" variant="secondary" size="md">
                Buy Silver
              </MetalButton>
            </TradeFlow>
          </Row>
        </Container>
      </Section>

      {/* Balance — the combined figure above the asset cards */}
      <Section pad="sm">
        <Container maxW="xl">
          <Stack gap="lg">
            <Row justify="between" align="end" wrap gap="md">
              <TotalBalance />
              <DirectInvest />
            </Row>
            <Grid cols="3" gap="lg">
              {ASSET_ORDER.map((asset) => (
                <BalanceCard key={asset} asset={asset} />
              ))}
            </Grid>
          </Stack>
        </Container>
      </Section>

      {/* Activity — recent only; filters live on /activity */}
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
            {/* The shared activity table, trimmed to a recent list: no
                filters (they live on /activity) and the narrower column
                set a dashboard wants. Clicking a row opens the same
                side sheet. */}
            <ActivityTable
              rows={activity}
              limit={5}
              hide={["type", "status"]}
            />
          </Stack>
        </Container>
      </Section>
    </>
  );
}
