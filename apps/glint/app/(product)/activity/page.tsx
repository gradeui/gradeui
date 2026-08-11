"use client";

// Promoted from Studio screen "Activity — history"
// (design dmsnba2xdvnc3, version 1786371183861). Registry: lib/screens.ts;
// re-promotion workflow: apps/glint/README.md.

import {
  Section,
  Container,
  Stack,
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
import { Persona, type ActivityRow, fmtTxDate, txMethodLabel } from "@/lib/persona";
import { accountLabel } from "@/lib/accounts";

// Glint Activity screen: the full activity history for the persona.
// The tabbed filters live HERE, not on the Dashboard (whose Activity
// section is a plain recent list with View all pointing at this
// screen). Rows come from Persona.DEFAULT.activity, the same source
// the Dashboard reads. The chrome comes from the (product) route
// layout with the Activity nav item active.

function TxTable({ rows }: { rows: ActivityRow[] }) {
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
          <TableRow key={`${fmtTxDate(tx.timestamp).day}-${tx.description}`}>
            <TableCell className="text-muted-foreground">{fmtTxDate(tx.timestamp).day}</TableCell>
            <TableCell>
              <span className="font-medium text-foreground">{tx.description}</span>
            </TableCell>
            <TableCell className="text-right font-medium text-foreground">
              {Persona.fmtSigned(tx.fiatAmount)}
            </TableCell>
            <TableCell className="text-muted-foreground">{accountLabel(tx.account)}</TableCell>
            <TableCell className="text-muted-foreground">{txMethodLabel(tx)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function ActivityPage() {
  const rows = Persona.DEFAULT.activity;
  return (
    <Section pad="none" className="py-8">
      <Container maxW="xl">
        <Stack gap="md">
          <h1 className="text-2xl font-semibold text-foreground">Activity</h1>
          <Tabs defaultValue="all">
            <Stack gap="md">
              <TabsList className="w-fit">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="in">Money in</TabsTrigger>
                <TabsTrigger value="out">Money out</TabsTrigger>
              </TabsList>
              <TabsContent value="all">
                <TxTable rows={rows} />
              </TabsContent>
              <TabsContent value="in">
                <TxTable rows={rows.filter((tx) => tx.fiatAmount > 0)} />
              </TabsContent>
              <TabsContent value="out">
                <TxTable rows={rows.filter((tx) => tx.fiatAmount < 0)} />
              </TabsContent>
            </Stack>
          </Tabs>
        </Stack>
      </Container>
    </Section>
  );
}
