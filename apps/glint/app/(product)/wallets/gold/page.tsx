"use client";

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
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@gradeui/ui";
import { AreaChart, Area, XAxis, YAxis } from "recharts";
import { Persona, type ActivityRow } from "@/lib/persona";
import { Market } from "@/lib/market";
import { METALS } from "@/components/wordmark";
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

const GOLD = METALS.gold;

const METAL_BUTTON: React.CSSProperties = {
  background: `linear-gradient(180deg, oklch(${GOLD[600]}) 0%, oklch(${GOLD[800]}) 100%)`,
  color: `oklch(${GOLD[50]})`,
  borderColor: `oklch(${GOLD[500]} / 0.45)`,
};

const CHART_CONFIG = {
  price: { label: "USD", color: `oklch(${GOLD[400]})` },
};

function TxTable({ rows }: { rows: ActivityRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-24">Date</TableHead>
          <TableHead>To/From</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead>Method</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((tx) => (
          <TableRow key={`${tx.date}-${tx.name}`}>
            <TableCell className="text-muted-foreground">{tx.date}</TableCell>
            <TableCell>
              <span className="font-medium text-foreground">{tx.name}</span>
            </TableCell>
            <TableCell className="text-right font-medium text-foreground">
              {Persona.fmtSigned(tx.amount)}
            </TableCell>
            <TableCell className="text-muted-foreground">{tx.method}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function GoldWalletPage() {
  const [amount] = Persona.useBalance("gold");
  const [unit] = Persona.usePreference("unit.gold");
  const meta = Persona.DEFAULT.balances.gold;
  const latest = Market.latest("gold");
  const price = unit === "oz" ? latest.usdPerOz : latest.usdPerG;
  /* Chart the month of auctions in the preferred unit, in the metal's
     own colour (the pinned ladder, not the theme primary). */
  const series = Market.gold.map(([d, usdPerG]) => ({
    d,
    price:
      Math.round((unit === "oz" ? usdPerG * Market.OZ : usdPerG) * 100) / 100,
  }));
  const goldActivity = Persona.DEFAULT.activity.filter((tx) =>
    tx.account === Persona.DEFAULT.balances.gold.account,
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
                    <Button
                      size="md"
                      className="rounded-full border"
                      style={METAL_BUTTON}
                    >
                      Buy Gold
                    </Button>
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
            <TxTable rows={goldActivity} />
          </Stack>
        </Container>
      </Section>
    </>
  );
}
