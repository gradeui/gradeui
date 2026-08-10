"use client";

// Promoted from Studio screen "Dashboard — logged-in home"
// (design dmskex612bcy1, version 1786370953143). Registry: lib/screens.ts;
// re-promotion workflow: apps/glint/README.md.

import {
  Section,
  Container,
  Stack,
  Row,
  Grid,
  Card,
  CardContent,
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@gradeui/ui";
import { Plus, Coins, Gem, ChevronRight } from "lucide-react";
import { Persona, type AssetKey } from "@/lib/persona";
import { Market } from "@/lib/market";

// Mercury-pattern logged-in home, Glint-flavoured, for BUSINESS accounts.
// The sidebar rail + sticky toolbar come from the route layout
// (app/(product)/layout.tsx hosting components/layouts/app-chrome.tsx);
// this page supplies only the scrolling content sections.
// PERSONA-DRIVEN: identity and balances come from lib/persona. Balance
// cards subscribe via Persona.useBalance, so future Buy/Sell flows can
// adjust an asset's balance and the cards follow live. Transactions
// stay local until those flows need to append to them.
// SIMPLIFIED at Ali's request (10 Aug 2026): plain balance cards (Gold,
// Silver, Fiat, his order, no charts); transaction rows carry no
// colourisation or glyphs. ASSUMPTION: the Accounts card was folded
// away because it duplicated the three balances; see the Studio
// screen's revision history to restore it.

const ASSET_ORDER: AssetKey[] = ["gold", "silver", "fiat"];

interface Tx {
  date: string;
  name: string;
  amount: number;
  account: string;
  method: string;
}

const TXS: Tx[] = [
  { date: "Aug 7", name: "Bought gold — 3.6 g", amount: -310.2, account: "Gold wallet ··5679", method: "Market order" },
  { date: "Aug 6", name: "Sold silver — 26 oz", amount: 1050, account: "Silver wallet ··4102", method: "Market order" },
  { date: "Aug 5", name: "USD deposit", amount: 8400, account: "Current ··2502", method: "Wire transfer" },
  { date: "Aug 4", name: "Bought silver — 46 oz", amount: -1862.1, account: "Silver wallet ··4102", method: "Market order" },
  { date: "Aug 2", name: "Bought gold — 14.4 g", amount: -1240.15, account: "Gold wallet ··5679", method: "Market order" },
  { date: "Aug 1", name: "USD deposit", amount: 3200, account: "Current ··2502", method: "ACH" },
];

function fmtSigned(n: number) {
  return `${n < 0 ? "−" : "+"}${Persona.fmtMoney(n)}`;
}

function BalanceCard({ asset }: { asset: AssetKey }) {
  const [amount] = Persona.useBalance(asset);
  const meta = Persona.DEFAULT.balances[asset];
  /* Metals show the holding at the latest LBMA price; fiat keeps its
     account number. */
  const detail =
    asset === "fiat"
      ? meta.account
      : Market.fmtOz(Market.toOunces(amount, asset));
  return (
    <Card>
      <CardContent className="pt-6">
        <Stack gap="xs">
          <span className="text-sm font-medium text-muted-foreground">{meta.label}</span>
          <span className="text-2xl font-semibold text-foreground">{Persona.fmtMoney(amount)}</span>
          <span className="text-sm text-muted-foreground">{detail}</span>
        </Stack>
      </CardContent>
    </Card>
  );
}

function TxTable({ rows }: { rows: Tx[] }) {
  return (
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
        {rows.map((tx) => (
          <TableRow key={`${tx.date}-${tx.name}`}>
            <TableCell className="text-muted-foreground">{tx.date}</TableCell>
            <TableCell>
              <span className="font-medium text-foreground">{tx.name}</span>
            </TableCell>
            <TableCell className="text-right font-medium text-foreground">
              {fmtSigned(tx.amount)}
            </TableCell>
            <TableCell className="text-muted-foreground">{tx.account}</TableCell>
            <TableCell className="text-muted-foreground">{tx.method}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function DashboardPage() {
  return (
    <>
      {/* Welcome + product actions (no Send/Transfer — not in the verb set;
          selling lives on the wallet screens) */}
      <Section pad="none" className="pt-8">
        <Container maxW="xl">
          <Stack gap="lg">
            <h1 className="text-2xl font-semibold text-foreground">
              Welcome, {Persona.DEFAULT.owner}
            </h1>
            <Row gap="sm">
              <Button size="md" className="rounded-full">
                <Plus className="size-4" />
                Deposit
              </Button>
              <Button variant="secondary" size="md" className="rounded-full">
                <Coins className="size-4" />
                Buy Gold
              </Button>
              <Button variant="secondary" size="md" className="rounded-full">
                <Gem className="size-4" />
                Buy Silver
              </Button>
            </Row>
          </Stack>
        </Container>
      </Section>

      {/* Balances — one plain card per asset, no charts, live off Persona */}
      <Section pad="sm">
        <Container maxW="xl">
          <Grid cols="3" gap="lg">
            {ASSET_ORDER.map((asset) => (
              <BalanceCard key={asset} asset={asset} />
            ))}
          </Grid>
        </Container>
      </Section>

      {/* Activity */}
      <Section pad="none" className="py-10">
        <Container maxW="xl">
          <Stack gap="md">
            <Row gap="sm" align="baseline">
              <h2 className="text-lg font-semibold text-foreground">Activity</h2>
              <Button variant="link" size="sm">
                View all
                <ChevronRight className="size-4" />
              </Button>
            </Row>
            <Tabs defaultValue="recent">
              <Stack gap="md">
                <TabsList className="w-fit">
                  <TabsTrigger value="recent">Recent</TabsTrigger>
                  <TabsTrigger value="in">Monthly money in</TabsTrigger>
                  <TabsTrigger value="out">Monthly money out</TabsTrigger>
                </TabsList>
                <TabsContent value="recent">
                  <TxTable rows={TXS} />
                </TabsContent>
                <TabsContent value="in">
                  <TxTable rows={TXS.filter((tx) => tx.amount > 0)} />
                </TabsContent>
                <TabsContent value="out">
                  <TxTable rows={TXS.filter((tx) => tx.amount < 0)} />
                </TabsContent>
              </Stack>
            </Tabs>
          </Stack>
        </Container>
      </Section>
    </>
  );
}
