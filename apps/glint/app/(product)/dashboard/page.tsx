"use client";

// Promoted from Studio screen "Dashboard — logged-in home"
// (design dmskex612bcy1, version 1786372281658). Registry: lib/screens.ts;
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
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@gradeui/ui";
import { Plus, ChevronRight } from "lucide-react";
import { Persona, type AssetKey } from "@/lib/persona";
import { Market } from "@/lib/market";
import { METALS } from "@/components/wordmark";

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
// ACTIVITY: plain recent list; the tabbed filters live on /activity.

const ASSET_ORDER: AssetKey[] = ["gold", "silver", "fiat"];

/* Card chevron targets — assets gain one as their screens are built. */
const CARD_TARGETS: Partial<Record<AssetKey, string>> = {
  gold: "Gold — wallet",
};

/* Self-contained metal treatments from the pinned ladders: gradient
   surface, pale-metal text, soft metal border. Inline style because
   the values are brand constants, deliberately outside the theme. */
const METAL_BUTTON: Record<"gold" | "silver", React.CSSProperties> = {
  gold: {
    background: `linear-gradient(180deg, oklch(${METALS.gold[600]}) 0%, oklch(${METALS.gold[800]}) 100%)`,
    color: `oklch(${METALS.gold[50]})`,
    borderColor: `oklch(${METALS.gold[500]} / 0.45)`,
  },
  silver: {
    background: `linear-gradient(180deg, oklch(${METALS.silver[500]}) 0%, oklch(${METALS.silver[700]}) 100%)`,
    color: `oklch(${METALS.silver[50]})`,
    borderColor: `oklch(${METALS.silver[400]} / 0.45)`,
  },
};

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
  /* Metals show the holding in the persona's preferred unit (gold in
     grams per the product); fiat keeps its account number. */
  const detail =
    asset === "fiat"
      ? meta.account
      : Market.fmtQty(Market.toQty(amount, asset, unit), unit);
  return (
    <Card>
      <CardHeader>
        <Row justify="between" align="center">
          <CardTitle>{meta.label}</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            aria-label={`Open ${meta.label}`}
            data-grade-goto={CARD_TARGETS[asset]}
          >
            <ChevronRight className="size-4" />
          </Button>
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
            <Button
              variant="secondary"
              size="md"
              className="rounded-full border"
              style={METAL_BUTTON.gold}
            >
              Buy Gold
            </Button>
            <Button
              variant="secondary"
              size="md"
              className="rounded-full border"
              style={METAL_BUTTON.silver}
            >
              Buy Silver
            </Button>
          </Row>
        </Container>
      </Section>

      {/* Balance — the combined figure above the asset cards */}
      <Section pad="sm">
        <Container maxW="xl">
          <Stack gap="lg">
            <TotalBalance />
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Date</TableHead>
                  <TableHead>To/From</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Method</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activity.map((tx) => (
                  <TableRow key={`${tx.date}-${tx.name}`}>
                    <TableCell className="text-muted-foreground">{tx.date}</TableCell>
                    <TableCell>
                      <span className="font-medium text-foreground">{tx.name}</span>
                    </TableCell>
                    <TableCell className="text-right font-medium text-foreground">
                      {Persona.fmtSigned(tx.amount)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{tx.account}</TableCell>
                    <TableCell className="text-muted-foreground">{tx.method}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Stack>
        </Container>
      </Section>
    </>
  );
}
