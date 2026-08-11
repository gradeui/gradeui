"use client";

import * as React from "react";

// Promoted from Studio screen "Gold — wallet"
// (design dmsnbpdvrz1qa, version 1786435550819). Registry: lib/screens.ts;
// re-promotion workflow: apps/glint/README.md.

import {
  Section,
  Container,
  Stack,
  Row,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ToggleGroup,
  ToggleGroupItem,
} from "@gradeui/ui";
import { AreaChart, Area, XAxis, YAxis } from "recharts";
import { Persona, type ActivityRow, fmtTxDate, txMethodLabel } from "@/lib/persona";
import { Market, type Range } from "@/lib/market";
import { metalSolid } from "@/components/wordmark";
import { MetalButton } from "@/components/metal-button";
import { ActivityTable } from "@/components/activity-table";
import { accountIdentifiers } from "@/lib/accounts";
import { TradeFlow } from "@/components/trade-flow";

// Glint Gold wallet screen: the desktop gold view. Two cards up top:
// the LBMA gold price (latest per-ounce figure + the last month of
// settled auctions charted from lib/market, the shared price source)
// and the associated account (balance, holding, wallet number,
// metal-dressed Buy button). Below: all gold activity, the persona
// rows filtered to the gold wallet. The silver screen will be this
// shape with the other metal. The chrome (with the Back affordance in
// the toolbar leading slot) comes from the (product) route layout.

const CHART_CONFIG = {
  price: { label: "USD", color: metalSolid("gold") },
};

export default function GoldWalletPage() {
  /* RANGE (Ali, 11 Aug): 1M is the floor because LBMA publishes one
     auction price a day, so the app's 1D and 1W would be invented; 5Y
     is the ceiling he asked for. Market thins the points per range. */
  const [range, setRange] = React.useState<Range>("1M");
  const [amount] = Persona.useBalance("gold");
  const [unit] = Persona.usePreference("unit.gold");
  const meta = Persona.DEFAULT.balances.gold;
  const latest = Market.latest("gold");
  const price = unit === "oz" ? latest.usdPerOz : latest.usdPerG;
  /* Chart the month of auctions in the preferred unit, in the metal's
     own colour (the pinned ladder, not the theme primary). */
  const series = Market.series("gold", range).map(([d, usdPerG]: [string, number]) => ({
    d,
    price:
      Math.round((unit === "oz" ? usdPerG * Market.OZ : usdPerG) * 100) / 100,
  }));
  const goldActivity = Persona.DEFAULT.activity.filter((tx) =>
    tx.metal === "gold",
  );
  return (
    <>
      {/* Price + account, side by side */}
      <Section pad="none" className="pt-8">
        <Container maxW="xl" grid className="gap-6">
          <Card className="col-span-12 lg:col-span-7">
            <CardHeader>
              <CardTitle>Gold price</CardTitle>
            </CardHeader>
            <CardContent>
              <Stack gap="md">
                <Stack gap="none">
                  <span className="text-2xl font-semibold text-foreground">
                    {Persona.fmtMoney(price)}
                    <span className="text-sm font-normal text-muted-foreground"> /{unit}</span>
                  </span>
                  <span className="text-sm text-muted-foreground">
                    LBMA PM auction · {latest.date}
                  </span>
                </Stack>
                <ToggleGroup
                  type="single"
                  variant="segmented"
                  size="sm"
                  value={range}
                  onValueChange={(v) => v && setRange(v as Range)}
                  className="w-fit"
                >
                  {Market.RANGES.map((r) => (
                    <ToggleGroupItem key={r} value={r} className="min-w-12">
                      {Market.RANGE_LABEL[r]}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
                <ChartContainer config={CHART_CONFIG} className="h-[180px] w-full">
                  <AreaChart data={series} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="fillGoldPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-price)" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="var(--color-price)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="d" hide />
                    <YAxis hide domain={["dataMin - 2", "dataMax + 1"]} />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                    <Area
                      dataKey="price"
                      type="monotone"
                      stroke="var(--color-price)"
                      strokeWidth={2}
                      fill="url(#fillGoldPrice)"
                    />
                  </AreaChart>
                </ChartContainer>
              </Stack>
            </CardContent>
          </Card>

          <Card className="col-span-12 lg:col-span-5">
            <CardHeader>
              <CardTitle>Gold wallet</CardTitle>
            </CardHeader>
            <CardContent>
              <Stack gap="md">
                <Stack gap="xs">
                  <span className="text-2xl font-semibold text-foreground">{Persona.fmtMoney(amount)}</span>
                  <span className="text-sm text-muted-foreground">
                    {Market.fmtQty(Market.toQty(amount, "gold", unit), unit)} held
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {meta.account} · {accountIdentifiers("gold")}
                  </span>
                </Stack>
                <Row gap="sm">
                  <TradeFlow metal="gold">
                    <MetalButton metal="gold" size="md">
                      Buy Gold
                    </MetalButton>
                  </TradeFlow>
                  <TradeFlow metal="gold" direction="sell">
                    <Button variant="ghost" size="md" className="rounded-full">
                      Sell
                    </Button>
                  </TradeFlow>
                </Row>
              </Stack>
            </CardContent>
          </Card>
        </Container>
      </Section>

      {/* All gold activity */}
      <Section pad="none" className="py-10">
        <Container maxW="xl">
          <Stack gap="md">
            <h2 className="text-lg font-semibold text-foreground">Gold activity</h2>
            {/* The shared activity table. The account column is dropped: this
                screen IS the gold wallet, so repeating it every row is
                noise. */}
            <ActivityTable rows={goldActivity} hide={["account"]} />
          </Stack>
        </Container>
      </Section>
    </>
  );
}
