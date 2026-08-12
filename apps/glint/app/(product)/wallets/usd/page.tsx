"use client";

// Promoted from Studio screen "USD — wallet"
// (design dmsou6g4wxv0l, version 1786541739473). Registry: lib/screens.ts;
// re-promotion workflow: apps/glint/README.md.
// source-hash: f5c3f796604c
// (the drift guard's signature of the Studio source this page was
// built from, so check:promotions measures Studio against THIS copy
// and not against a baseline that --update can rewrite.)

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
} from "@gradeui/ui";
import { Persona } from "@/lib/persona";
import { Accounts } from "@/lib/accounts";
import { ActivityTable } from "@/components/activity-table";
import { Wordmark } from "@/components/wordmark";
import { AutoInvestToggle } from "@/components/auto-invest-toggle";
import { AccountDetails } from "@/components/account-details";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";

// Glint USD wallet screen (Ali, 11 Aug 2026): the cash side of the three
// wallets, built to the shape of the Gold and Silver screens so the set
// reads as one family. Holding card leads on the left, detail on the
// right, activity below.
//
// NO PRICE CARD: dollars have no LBMA price and no chart, so the wide
// right card carries the ACCOUNT DETAILS instead. That is the card the
// CEO asked for (11 Aug): routing and account number called out
// explicitly, on the screen, not buried in a settings page. Every value
// is read from Accounts, so a real routing number replaces the minted
// one in exactly one place.
//
// THE ACCOUNT NUMBER IS SHOWN IN FULL, not masked (Ali, 11 Aug: "can we
// show the full account number"). This is the screen you would read the
// details off to set up a transfer, so masking defeats the card's whole
// purpose. It comes from Accounts.numberFull(ASSET), which returns the
// number UNBROKEN: ten digits grouped in fours leaves a two-digit orphan
// that reads as a rendering bug, so tabular figures do the work of
// making a long digit run checkable instead. The number is minted, like
// the routing number above it, and safe to show for the reason Accounts
// records: an account number addresses nothing without a routing number,
// and the routing number it pairs with is invented.
//
// AND IT IS NOT REPEATED (Ali: "we dont need to duplicate it in the left
// hand card"). The balance card used to carry "Checking ··2502" under the
// figure. With the account called out beside it, repeating the masked
// form was the same fact stated worse.
//
// ACTIVITY, BOTH LEGS. Persona.useActivity("fiat") matches a row on
// either `account` or `counterAccount`, and every exchange here is paid
// from or into the USD wallet, so this list is the two deposits PLUS the
// purchases those deposits funded. Filtering on `account` alone would
// show the deposits and hide the Direct Gold conversions that spent
// them, which is the story of this wallet; it would also leave the Money
// in / Money out tabs testing the sign of a figure whose other half is
// missing. Filtering on `metal` cannot express this wallet at all: cash
// rows have metal null. This is the screen that forced the wallet key.
//
// ACTIONS ARE DEPOSIT AND WITHDRAW (Ali, 11 Aug), pinned to the bottom
// of the card as on the metal wallets. They are INERT, which Ali
// confirmed is fine: neither flow exists in the demo, and the dashboard
// Deposit button is already the same kind of affordance, so this matches
// an existing precedent rather than inventing a new dead end. The card
// previously offered Buy Gold and Buy Silver, which were real TradeFlow
// modals; those belong on the metal wallets, and a cash account's own
// verbs are moving money in and out.
//
// Reached from the dashboard's USD card, or from Wallets in the rail;
// the toolbar leading slot carries the Back affordance.

const ASSET = "fiat";

export default function UsdWalletPage() {
  const [amount] = Persona.useBalance(ASSET);
  const acct = Accounts.ALL[ASSET];
  return (
    <>
      {/* Balance + account details, side by side */}
      <Section pad="none" className="pt-8">
        <Container maxW="xl" grid className="gap-6">
          {/* FLEX COLUMN so the content can grow and pin the actions to
              the bottom, the same construct the metal wallet card uses.
              Without it the buttons float under the balance and leave
              dead space beneath them, because the card's height is set by
              the taller details card beside it. */}
          <Card className="col-span-12 flex flex-col lg:col-span-5">
            <CardHeader>
              {/* THE GLINT MARK LEADS THE TITLE (Ali, 11 Aug: this page
                  "should be the same header as the previous screen"), the
                  treatment the gold and silver wallet cards use. The mark
                  is in the ACTION BLUE rather than a metal, the same
                  colour this wallet's dashboard tile wears, because
                  dollars have no metal of their own.
                  The title now reads "Glint USD" because an account's
                  label is its NAME; the KIND of account ("Checking") is
                  its type, and that shows in the details card beside
                  this one. */}
              <Row gap="sm" align="center" className="min-h-9">
                <Wordmark
                  lockup="mark"
                  tone="current"
                  className="size-5"
                  style={{ color: "oklch(var(--primary))" }}
                />
                <CardTitle>{acct.label}</CardTitle>
              </Row>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              <Stack gap="md" justify="between" className="flex-1">
                <Stack gap="lg">
                  <span className="text-4xl font-semibold tabular-nums text-foreground">
                    {Persona.fmtMoney(amount)}
                  </span>
                  {/* AUTO-BUY INSIDE THE CARD (Ali, 11 Aug: "this
                      should also have the auto-invest toggle inside the
                      card"). It is the setting that decides what happens
                      to this balance, so it belongs on the balance, not
                      only on the dashboard. Same shared control as the
                      dashboard, reading one preference, so flipping it
                      either place moves both. */}
                  <AutoInvestToggle />
                </Stack>
                <Row gap="sm">
                  <Button size="md" className="rounded-full">
                    <ArrowDownToLine className="size-4" />
                    Deposit
                  </Button>
                  <Button variant="ghost" size="md" className="rounded-full">
                    <ArrowUpFromLine className="size-4" />
                    Withdraw
                  </Button>
                </Row>
              </Stack>
            </CardContent>
          </Card>

          <Card className="col-span-12 lg:col-span-7">
            <CardHeader>
              <Row gap="sm" align="center" className="min-h-9">
                <CardTitle>Account details</CardTitle>
              </Row>
            </CardHeader>
            <CardContent>
              {/* IDENTICAL TO THE BANK ACCOUNTS SCREEN, by construction
                  (Ali, 11 Aug: "the Glint account details should be
                  IDENTICAL on the wallet USD screen and the Bank accounts
                  screen"). This card used to hand-build the same block, and
                  the two had already drifted: this one showed the wallet's
                  NAME in the account type row. One component, both screens. */}
              <AccountDetails id={ASSET} />
            </CardContent>
          </Card>
        </Container>
      </Section>

      {/* Every row that moves this wallet, with the cash-account tabs */}
      <Section pad="none" className="py-10">
        <Container maxW="xl">
          <Stack gap="md">
            <h2 className="text-lg font-semibold text-foreground">
              {Persona.DEFAULT.balances[ASSET].label} activity
            </h2>
            <ActivityTable rows={Persona.useActivity(ASSET)} filters />
          </Stack>
        </Container>
      </Section>
    </>
  );
}
