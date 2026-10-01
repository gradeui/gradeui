"use client";

// Promoted from Studio screen "USD — wallet v2"
// (design dmupum94g8tuz, version 1790888611592). Registry: lib/screens.ts;
// re-promotion workflow: apps/glint/README.md.
// source-hash: e94b4e27b6c6
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
import { ActivityTableV2 } from "@/components/activity-table-v2";
import { Wordmark } from "@/components/wordmark";
import { AutoInvestToggle } from "@/components/auto-invest-toggle";
import { AccountDetails } from "@/components/account-details";

// V2 (1 Oct 2026, the business portal v2 for staging): a copy of
// "USD — wallet", which stays untouched because the live demo is promoted
// from it. Changes: AppChromeV2 (no rail on mobile), ActivityTableV2 (the
// transaction detail is the shared SideDrawer), a page title, and Back to the v2 Wallets.
//
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
// V2, 1 Oct: NO ACTIONS on this card (Ali: no Deposit anywhere in v2,
// because depositing happens offline at the business's own bank; and
// Withdraw went too, because it was inert rather than going to support).
// The Glint account details beside it are how money gets in. The note
// below is the history.
// ACTIONS WERE DEPOSIT AND WITHDRAW (Ali, 11 Aug), pinned to the bottom
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
        {/* THE PAGE TITLE (Ali, 1 Oct): an h1 on every page, the style
            Activity set, 24 above the content
            (Figma wins, 1 Oct). Raleway 700 through the theme's heading
            tokens, so no weight class here. */}
        <Container maxW="xl" className="pb-6">
          <h1 className="text-2xl text-foreground">{Persona.DEFAULT.balances[ASSET].label}</h1>
        </Container>
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
                  THE TITLE IS THE WALLET'S NAME, NOT THE ACCOUNT'S (Ali,
                  12 Aug: "the /wallet/usd should just be USD, not Glint
                  USD - to match the wallets homepage"). It read the
                  account record's label, which is "Glint USD" because
                  that is what the account at Sutton Bank is called. This
                  card is the WALLET though, and the wallet is called USD
                  on the wallets homepage, so the two disagreed about the
                  same thing. It now reads the same source the homepage
                  tile reads, so they cannot drift apart again.
                  The account keeps its own name on the details card
                  beside this one and on Bank Accounts, where naming the
                  account is the point. */}
              <Row gap="sm" align="center" className="min-h-9">
                <Wordmark
                  lockup="mark"
                  tone="current"
                  className="size-5"
                  style={{ color: "oklch(var(--primary))" }}
                />
                <CardTitle>{Persona.DEFAULT.balances[ASSET].label}</CardTitle>
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
            <ActivityTableV2 rows={Persona.useActivity(ASSET)} filters />
          </Stack>
        </Container>
      </Section>
    </>
  );
}
