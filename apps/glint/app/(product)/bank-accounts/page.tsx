"use client";

// Promoted from Studio screen "Bank Accounts"
// (design dmsp02q871y5u, version 1786612882680). Registry: lib/screens.ts;
// re-promotion workflow: apps/glint/README.md.
// source-hash: 94d0078b116c
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
  CardDescription,
  CardContent,
  PropertyList,
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@gradeui/ui";
import { Persona } from "@/lib/persona";
import { Accounts } from "@/lib/accounts";
import { ActivityTable } from "@/components/activity-table";
import { AutoInvestToggle } from "@/components/auto-invest-toggle";
import { AccountDetails } from "@/components/account-details";
import { MoreHorizontal } from "lucide-react";

// Bank Accounts screen (Ali, 11 Aug 2026): the two accounts behind every
// dollar that moves, side by side. His words: "this is the users personal
// 'linked' bank account, and the glint sutton bank account".
//
// WHY ONE SCREEN AND NOT TWO. They are a pair, and the only thing anyone
// comes here to do is compare them: money leaves the account on the left
// and arrives in the account on the right. Splitting them would mean
// navigating between two halves of one fact. The nav link is PLURAL for
// the same reason (his second thought, and the right one).
//
// BOTH NUMBERS IN FULL (Ali, 11 Aug: "please display the full account
// number"). I had the linked account masked, on the grounds that an
// external account is the one number a product shows back to you only as
// its last four. He asked for both, and it is safe here because every
// number on this screen is minted: an account number addresses nothing
// without a routing number, and the routing numbers are invented too.
// The reasoning lives on the records in Accounts, not here.
//
// THE HOLDERS DIFFER: the customer holds the account on the left, and
// GLINT holds the one on the right. That is how a pooled fintech deposit
// account works, and it is why money has to move between the two at all.
// The holder name comes off the record, falling back to the customer's
// legal name where a record has none, which is every other account.
//
// NO ACTIONS (Ali, 11 Aug: "lets get rid of the link another account for
// now"). It was inert, and an affordance that does nothing earns its
// place only when the story needs it. This screen is a statement of
// record: two accounts, and what has moved between them.
//
// TRANSFERS, NOT ACTIVITY. The list below is the deposit rows only, the
// money that crossed between these two accounts. The purchases those
// deposits funded are a wallet's story and live on the wallet screens;
// here they would answer a question nobody asked on this page.
//
// A top-level rail destination, so no Back affordance: you arrive from
// the sidebar, not from a parent screen.

const GLINT = "fiat";
const LINKED = "external";

/* THE MARK TILE AND THE IDENTIFIER ROWS BOTH MOVED INTO AccountDetails,
   the shared component both this screen and the USD wallet now render, so
   the two cannot say different things about the same account. What stays
   here is what differs per card: the titles, the descriptions, the
   overflow menu, and the auto-buy row passed in as an extra. */

export default function BankAccountsPage() {
  /* No account record read here any more: AccountDetails takes an id and
     reads its own. Live preference, not the persona default: the toggle on two other screens writes
     this, and a stale line here would contradict them. Gold by default. */
  const [autoInvest] = Persona.usePreference("autoInvest");
  /* Deposits only: see TRANSFERS above. useActivity("fiat") returns both
     legs of every cash movement, so the filter is what makes this list
     the transfers rather than the wallet's history. */
  const transfers = Persona.useActivity(GLINT).filter(
    (row) => row.type === "deposit",
  );

  return (
    <>
      <Section pad="none" className="pt-8">
        <Container maxW="xl" grid className="gap-6">
          {/* THE CUSTOMER'S OWN ACCOUNT, on the left because it is where
              the money starts. */}
          <Card className="col-span-12 lg:col-span-6">
            <CardHeader>
              {/* WHAT THE CARD IS, not whose bank it is (Ali, 11 Aug:
                  "the left hand card would be Linked Account and the
                  right hand card would be Glint Account"). The bank's
                  own name and mark moved into the body, where they are
                  the answer to "which account", not the heading. Each
                  title carries a description, so the two headers are the
                  same height without a min-h floor propping them up. */}
              <Row gap="sm" align="start" justify="between">
                {/* gap="xs", not none (Ali, 11 Aug: "we need some room
                    between the header and the dscription"). Card's own
                    header stacks them flush, which suits a title with a
                    long paragraph under it and not a short one-liner.
                    BOTH descriptions are one line and stay one line: two
                    lines here pushed this card's property list a row
                    below its pair and the two stopped reading as a set. */}
                <Stack gap="xs">
                  <CardTitle>Linked Account</CardTitle>
                  <CardDescription>Where deposits come from.</CardDescription>
                </Stack>
                {/* NO VERIFIED BADGE (Ali, 11 Aug: "that is probably done
                    by just linking it"). Right: an account you cannot use
                    until it verifies is not a linked account, so the badge
                    was labelling the only state this card can be in. The
                    `verified` flag stays on the record for a future
                    pending state to read. */}
                <Row gap="xs" align="center">
                  {/* WHERE LINKING LIVES (Ali, 11 Aug: an overflow menu
                      "essentially hides how we link it up"). The screen
                      is a statement of record, so the verbs that change
                      the connection sit behind the dots instead of
                      competing with the numbers. Inert: none of these
                      flows exist in the demo, and the menu is the story.
                      It is also the answer to the Link another account
                      button he cut, which was the same idea shouting. */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        iconOnly
                        aria-label="Linked account options"
                      >
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Link another account</DropdownMenuItem>
                      <DropdownMenuItem>Re-verify this account</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>Unlink account</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </Row>
              </Row>
            </CardHeader>
            <CardContent>
              <AccountDetails id={LINKED}>
                {/* WHAT HAPPENS TO THE MONEY, not when the account was
                    connected (Ali, 11 Aug: "we dont need to know when the
                    Linked account was linked, so instead let's put in what
                    the auto-invest is"). Right: the link date is filing,
                    while auto-buy is the setting that decides what a
                    deposit pulled from this account turns into. Read live
                    off the preference, so flipping the toggle on the
                    dashboard or the USD wallet moves this line too, and
                    named by the control's own labelFor so the two cannot
                    disagree. An EXTRA row, passed as children, so
                    AccountDetails stays a statement of the account and
                    knows nothing about auto-buy.
                    AUTO-BUY, WAS AUTO-INVEST (Glint's CEO, 12 Aug, via
                    Ali). The stored preference key is still `autoInvest`,
                    because it is session state and renaming it would
                    orphan every demo run already holding a value. */}
                <PropertyList.Row label="Auto-buy">
                  {autoInvest === "none"
                    ? "Off"
                    : `To ${AutoInvestToggle.labelFor(autoInvest)}`}
                </PropertyList.Row>
              </AccountDetails>
            </CardContent>
          </Card>

          {/* GLINT'S OWN ACCOUNT, on the right because it is where the
              money lands. Its tile carries the Glint wordmark glyph, set
              on the institution record, so this card and the USD wallet's
              details block mark the account the same way. */}
          <Card className="col-span-12 flex flex-col lg:col-span-6">
            <CardHeader>
              <Stack gap="xs">
                <CardTitle>Glint Account</CardTitle>
                {/* THE FBO STRUCTURE, SAID OUT LOUD (Glint, 13 Aug 2026,
                    via Ali). It read "Held by Glint for your business",
                    which described the same arrangement without the two
                    things a US business customer actually wants to know:
                    that the deposit is FDIC covered, and that the benefit
                    is theirs. Full stop kept, because the card opposite
                    ends its description with one. */}
                <CardDescription>
                  FDIC account held for the benefit of your business.
                </CardDescription>
              </Stack>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              {/* Flex column so the funding line sits at the BOTTOM of the
                  card, level with the last row of the taller list beside
                  it, rather than floating in the middle. */}
              <Stack gap="lg" justify="between" className="flex-1">
                <AccountDetails id={GLINT} />
                {/* THE SPONSOR BANK, NAMED IN THE SMALL PRINT. Glint's
                    mark replaced Sutton's on the tile above, and Ali's
                    note asked whether "Sutton Bank" should go entirely.
                    Not entirely: the description above now claims FDIC
                    coverage, and that claim is only true THROUGH Sutton,
                    so the bank has to be named somewhere for the sentence
                    to be honest. This is where partner-bank programmes
                    put it. Read off the institution record, so the bank
                    is named once in data and printed wherever it is due.
                    "your USD wallet", not "your Glint USD wallet": the
                    wallet is USD, the account is Glint USD. */}
                <p className="text-xs text-muted-foreground">
                  Send a domestic wire or ACH to these details to fund your
                  USD wallet. Deposits are held at{" "}
                  {Accounts.ALL[GLINT].institution.sponsor}, Member FDIC.
                </p>
              </Stack>
            </CardContent>
          </Card>
        </Container>
      </Section>

      {/* What has actually crossed between the two */}
      <Section pad="none" className="py-10">
        <Container maxW="xl">
          <Stack gap="md">
            <h2 className="text-lg font-semibold text-foreground">Transfers</h2>
            <ActivityTable rows={transfers} />
          </Stack>
        </Container>
      </Section>
    </>
  );
}
