"use client";

// Promoted from Studio screen "Bank Accounts"
// (design dmsp02q871y5u, version 1786474192541). Registry: lib/screens.ts;
// re-promotion workflow: apps/glint/README.md.
// source-hash: d75c87bd4639
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
import { Accounts, type AccountRecord } from "@/lib/accounts";
import { ActivityTable } from "@/components/activity-table";
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

/** The institution's mark: a SQUARE tile, small radius, hairline border
 *  (Ali, 11 Aug, and "those avatars should be a little bigger"). It was
 *  an Avatar, which is the wrong primitive twice over: Avatar is round
 *  and it is for PEOPLE, so a bank's square logo arrived cropped into a
 *  circle. A tile is what every banking app shows an institution in.
 *
 *  Falls back to the institution's initials when a record has no logo
 *  file, which is how it looked before the real artwork landed and how it
 *  will look for any bank added later. Both marks are the banks' own site
 *  icons; see the provenance note in Accounts, including the trademark
 *  caveat. object-contain, so a logo of any aspect fits inside the square
 *  rather than being stretched to it. */
function BankMark({ account }: { account: AccountRecord }) {
  const { logo, name, initials } = account.institution;
  return (
    /* A LIGHT PLATE, deliberately not a theme surface. Bank marks are
       drawn for print and for white headers: Sutton's is navy on black,
       which on this dark theme sank into the tile and read as a smudge.
       Every banking app puts third-party logos on a light plate for
       exactly this reason, so the plate is part of the mark, not part of
       the theme, and it stays light in both modes. */
    <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-white p-1">
      {logo ? (
        <img src={logo} alt={name} className="size-full object-contain" />
      ) : (
        <span className="text-sm font-medium text-muted-foreground">
          {initials}
        </span>
      )}
    </div>
  );
}

/** Routing + account number + type, the three rows both cards share, so
 *  the pair cannot drift into two different orders or two different
 *  labels. The rows ABOVE and BELOW differ per card: that is the point. */
function AccountRows({ id }: { id: AccountRecord["id"] }) {
  const account = Accounts.ALL[id];
  return (
    <>
      <PropertyList.Row label="Routing number">
        <span className="tabular-nums">{account.routingNumber}</span>
      </PropertyList.Row>
      <PropertyList.Row label="Account number">
        {/* Unbroken: ten digits grouped in fours leave a two-digit orphan
            that reads as a rendering bug, so tabular figures do the work
            of making a long run checkable instead. */}
        <span className="tabular-nums">{Accounts.numberFull(id)}</span>
      </PropertyList.Row>
      <PropertyList.Row label="Account type">{account.type}</PropertyList.Row>
    </>
  );
}

export default function BankAccountsPage() {
  const linked = Accounts.ALL[LINKED];
  const glint = Accounts.ALL[GLINT];
  const company = Persona.DEFAULT.company;
  /* Deposits only: see TRANSFERS above. activityFor("fiat") returns both
     legs of every cash movement, so the filter is what makes this list
     the transfers rather than the wallet's history. */
  const transfers = Persona.activityFor(GLINT).filter(
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
              {/* The institution, above the numbers it issued. */}
              <Row gap="sm" align="center" className="pb-4">
                <BankMark account={linked} />
                <Stack gap="none">
                  {/* NO LAST FOUR HERE (Ali, 11 Aug: "redundant as we
                      have them explictly listed anyway"). The full number
                      is four rows below, so the masked form was the same
                      fact stated worse, twice on one card. */}
                  <span className="text-sm font-medium text-foreground">
                    {linked.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {linked.institution.name}
                  </span>
                </Stack>
              </Row>
              <PropertyList divider>
                <PropertyList.Row label="Account holder">
                  {company.legalName}
                </PropertyList.Row>
                <AccountRows id={LINKED} />
                {/* Guarded because `linkedOn` is optional on the record:
                    only an external account has one. A TS-only guard, and
                    so one of the annotations a re-promotion drops. */}
                {linked.linkedOn ? (
                  <PropertyList.Row label="Linked">
                    {Persona.fmtTxDate(linked.linkedOn).day}
                  </PropertyList.Row>
                ) : null}
              </PropertyList>
            </CardContent>
          </Card>

          {/* GLINT'S OWN ACCOUNT, on the right because it is where the
              money lands. The Glint G in the action blue, the same mark
              the USD wallet and its dashboard tile wear, so the two
              screens name the same account the same way. */}
          <Card className="col-span-12 flex flex-col lg:col-span-6">
            <CardHeader>
              <Stack gap="xs">
                <CardTitle>Glint Account</CardTitle>
                <CardDescription>Held by Glint for your business.</CardDescription>
              </Stack>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              {/* SUTTON'S MARK, not Glint's (Ali, 11 Aug: "the glint
                  account would actually have the sutton bank logo").
                  Right: the account is Glint's product, but the bank
                  holding the money is Sutton, and the mark answers the
                  same question on both cards, which bank the numbers
                  below belong to. The Glint G is on the card title's
                  wording and all over the rest of the app. */}
              <Row gap="sm" align="center" className="pb-4">
                <BankMark account={glint} />
                <Stack gap="none">
                  {/* NO LAST FOUR HERE (Ali, 11 Aug: "redundant as we
                      have them explictly listed anyway"). The full number
                      is four rows below, so the masked form was the same
                      fact stated worse, twice on one card. */}
                  <span className="text-sm font-medium text-foreground">
                    {glint.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {glint.institution.name}
                  </span>
                </Stack>
              </Row>
              {/* Flex column so the funding line sits at the BOTTOM of the
                  card, level with the last row of the taller list beside
                  it, rather than floating in the middle. */}
              <Stack gap="lg" justify="between" className="flex-1">
                <PropertyList divider>
                  <PropertyList.Row label="Account holder">
                    {/* The holder off the record, which for this account
                        is Glint rather than the customer. It carried a
                        second "for the benefit of" line naming the
                        customer, the FBO wording a pooled account
                        normally shows; Ali cut it (11 Aug: "I didnt ask
                        for that"). The holder name is the fact; the
                        arrangement behind it is not this card's job. */}
                    {glint.holder ?? company.legalName}
                  </PropertyList.Row>
                  <AccountRows id={GLINT} />
                </PropertyList>
                <p className="text-xs text-muted-foreground">
                  Send a domestic wire or ACH to these details to fund your
                  Glint USD wallet.
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
