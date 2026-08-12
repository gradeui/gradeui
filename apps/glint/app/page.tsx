"use client";

// Promoted from Studio screen "US Demo Landing"
// (design dmskhheytm163, version 1786540072968). Registry: lib/screens.ts;
// re-promotion workflow: apps/glint/README.md.
// source-hash: afb9c6f2336a
// (the drift guard's signature of the Studio source this page was
// built from, so check:promotions measures Studio against THIS copy
// and not against a baseline that --update can rewrite.)

import {
  Section,
  Container,
  Stack,
  Grid,
  Row,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Separator,
} from "@gradeui/ui";
import { Building2, Wallet, ArrowRight, MoreHorizontal, RotateCcw } from "lucide-react";
import { Wordmark } from "@/components/wordmark";
import { FlowStore } from "@/lib/flow-store";

// Glint US prototype demo landing, the jump-off hub for walking the
// prototype. TWO cards SIDE BY SIDE, one per half of the product: the CCO onboarding
// flow (section:OnboardingCCO) and the logged-in account. Each is a
// whole-card goto to its entry screen plus quick-jump pills per screen.
// The logged-in card came out on 8 Aug because that area was still being
// built, and went back in on 11 Aug at Ali's request now that all six of
// its screens exist ("we need dashboard, wallets (gold/silver/usd),
// activities and bank account links, all on a card"). The "Built from the CCO data-capture spec"
// badge, the footer note about section tags and the "Jump to a step"
// label were also removed at Ali's request (10 Aug). Keep goto targets
// in sync with screen names (matched case-insensitively on the trimmed
// name). Copy convention: no em or en dashes anywhere on this screen.
//
// "Onboarding flow" RESETS the FlowStore state so every demo run starts
// fresh; the jump pills and the card surface keep existing state so a
// mid-flow hop resumes where you left off.

/* GROUPED, not one long row (Ali, 12 Aug: "I'd also consider maybe
   grouping them tags a bit so they are less like tag soup - figure out the
   best grouping"). Ten pills in a single wrap read as a heap you have to
   scan; four named runs read as the shape of the journey, and the names are
   the phases a KYB application actually has:

     Apply      who you are and what the business is
     Ownership  the branch: one owner or several
     Checks     what the business does, evidenced and signed
     Submit     the hand-off, and where it goes afterwards

   Ownership earns its own group because it is the only FORK in the flow:
   4a and 4b are alternatives, not consecutive steps, and standing them
   together says so without a word of explanation. */
const ONBOARDING_GROUPS = [
  {
    caption: "Apply",
    jumps: [
      { label: "1 · Start", target: "US Onboarding — 1 Before you apply" },
      { label: "2 · Business type", target: "US Onboarding — 2 Business type" },
      { label: "3 · Details", target: "US Onboarding — 3 Business details" },
    ],
  },
  {
    caption: "Ownership",
    jumps: [
      { label: "4a · Single owner", target: "US Onboarding — 4a Owner identity" },
      { label: "4b · Multiple owners", target: "US Onboarding — 4b Owners & control" },
    ],
  },
  {
    caption: "Checks",
    jumps: [
      { label: "5 · Activity", target: "US Onboarding — 5 Expected activity" },
      { label: "6 · Docs", target: "US Onboarding — 6 Documents" },
      { label: "7 · Certify", target: "US Onboarding — 7 Certification" },
    ],
  },
  {
    caption: "Submit",
    jumps: [
      { label: "8 · Review", target: "US Onboarding — 8 Review & submit" },
      { label: "Status", target: "US Onboarding — Application status" },
    ],
  },
];

/* The logged-in screens, in the order you would walk them: the hub,
   then each wallet, then the two supporting screens. Labels are the
   customer's words for them, targets are the Studio screen names. */
/* The logged-in screens, in two runs for the same reason as above: the
   three wallets are one idea and the supporting screens are another. */
const PRODUCT_GROUPS = [
  {
    caption: "Wallets",
    jumps: [
      { label: "Dashboard", target: "Dashboard — logged-in home" },
      { label: "Gold", target: "Gold — wallet" },
      { label: "Silver", target: "Silver — wallet" },
      { label: "Glint USD", target: "USD — wallet" },
    ],
  },
  {
    caption: "Records",
    jumps: [
      { label: "Activity", target: "Activity — history" },
      { label: "Bank Accounts", target: "Bank Accounts" },
    ],
  },
];

/** One captioned run of jump pills. Caption on its own line above the row:
 *  beside them it would compete with the pills for the same scan. */
function JumpGroup({
  caption,
  jumps,
}: {
  caption: string;
  jumps: { label: string; target: string }[];
}) {
  return (
    <Stack gap="xs">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {caption}
      </span>
      <Row gap="xs" wrap>
        {jumps.map((j) => (
          <Button
            key={j.label}
            variant="outline"
            size="sm"
            className="rounded-full"
            data-grade-goto={j.target}
          >
            {j.label}
          </Button>
        ))}
      </Row>
    </Stack>
  );
}

export default function DemoLandingPage() {
  return (
    <Section pad="lg" className="min-h-screen">
      <Container maxW="lg">
        <Stack gap="lg">
          <Stack gap="md" align="center" className="pt-4 text-center">
            <Wordmark cut="metal" className="h-8" />
            <Stack gap="xs" align="center">
              <h1 className="text-3xl font-medium text-foreground">US Business Accounts Demo</h1>
              <p className="max-w-xl text-muted-foreground">A demo of the Glint US business account experience.</p>
            </Stack>
          </Stack>

          {/* SIDE BY SIDE (Ali, 11 Aug: "I dont see the extra box on the
              demo homepage"). It was there, one card below the other, and
              the hero plus the first card filled the viewport, so the
              second half of the product was a scroll away on the one
              screen everybody opens first. Two columns from md, stacked
              below it, and the hero gives back the padding it was
              hoarding. */}
          {/* EQUAL HEIGHTS (Ali, 12 Aug: "can we also make sure the cards
              are the same height"). items-start was making each card its own
              natural height, which left the shorter one floating. Stretch is
              the grid default, so dropping the override is the fix; each card
              then becomes a flex column and pins its action to the bottom, so
              the two CTAs line up as a row. */}
          <Grid cols="2" gap="lg">
          <Card
            data-grade-goto="US Onboarding — 1 Before you apply"
            className="flex cursor-pointer flex-col transition-colors hover:border-primary/40"
          >
            <CardHeader>
              <Row gap="md" align="center">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Building2 className="h-5 w-5" />
                </div>
                {/* gap="xs", was none (Ali, 12 Aug: "the top Title and small
                    description are far to close togther"). */}
                <Stack gap="xs">
                  <CardTitle>Open a business account</CardTitle>
                  <CardDescription>The onboarding application</CardDescription>
                </Stack>
              </Row>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              {/* NOT justify="between" (Ali, 12 Aug: "weird gaps - only the
                  button should be at the bottom"). Spreading the whole
                  stack pushed air between the synopsis, the rule and the
                  pill groups as well, so the shorter card grew gaps
                  everywhere instead of one gap above the action. The stack
                  now packs from the top and the ACTION ROW takes mt-auto,
                  which is the only thing that should hug the bottom. */}
              <Stack gap="md" className="flex-1 gap-4">
                <p className="text-sm text-muted-foreground">
                  The eight-step KYB journey: PATRIOT Act notice, business
                  type, ownership, expected activity, documents,
                  certification and submission.
                </p>
                <Separator />
                <Stack gap="md">
                  {ONBOARDING_GROUPS.map((g) => (
                    <JumpGroup key={g.caption} {...g} />
                  ))}
                </Stack>
                {/* pt-2 above the action (Ali: "a bit more padding above
                    them") on top of the stack's own gap, and mt-auto so it
                    is the one thing pinned to the foot of the card. */}
                <Row className="mt-auto flex flex-row items-center justify-start pt-2">
                  <Button
                    className="rounded-full"
                    data-grade-goto="US Onboarding — 1 Before you apply"
                    onPointerDown={() => FlowStore.reset()}
                  size="lg">
                    Onboarding flow
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Row>
              </Stack>
            </CardContent>
          </Card>

          {/* THE LOGGED-IN HALF: a line on what is in there, a pill per
              screen, and the reset (Ali, 12 Aug: "could we have a three
              dots overflow menu item on the logged in account card, with a
              reset activity").
              NO WHOLE-CARD GOTO ANY MORE, and that is a mechanism decision
              rather than a taste one: both goto bridges listen in the
              CAPTURE phase and call preventDefault + stopPropagation for
              any click inside a [data-grade-goto] element, so a menu inside
              a clickable card is dead on arrival in Studio. "Open the
              account" and the pills are still gotos, so nothing here became
              unreachable; the card just stopped being one big link.
              The onboarding card opposite keeps its whole-card goto,
              because it has no controls of its own to swallow. */}
          <Card className="flex flex-col">
            <CardHeader>
              <Row gap="md" align="start" justify="between">
                <Row gap="md" align="center">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <Stack gap="xs">
                    <CardTitle>Approved Business Account</CardTitle>
                    <CardDescription>Wallets, activity and banking</CardDescription>
                  </Stack>
                </Row>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      iconOnly
                      aria-label="Demo data options"
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {/* RESET, and it clears EVERY override rather than only
                        the activity rows: balances, vaults, preferences and
                        the wizard's answers all live in the same store, and
                        an empty activity list beside a moved balance would
                        be a demo contradicting itself. Labelled the way Ali
                        asked, because "reset activity" is what a demo runner
                        is actually trying to undo. */}
                    <DropdownMenuItem onSelect={() => FlowStore.reset()}>
                      <RotateCcw className="size-4" />
                      Reset activity
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </Row>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              {/* NOT justify="between" (Ali, 12 Aug: "weird gaps - only the
                  button should be at the bottom"). Spreading the whole
                  stack pushed air between the synopsis, the rule and the
                  pill groups as well, so the shorter card grew gaps
                  everywhere instead of one gap above the action. The stack
                  now packs from the top and the ACTION ROW takes mt-auto,
                  which is the only thing that should hug the bottom. */}
              <Stack gap="md" className="flex-1 gap-4">
                {/* Shortened (Ali: "its a bit verby"). It listed every
                    screen, which the pill groups below already do. */}
                <p className="text-sm text-muted-foreground">
                  Gold, silver and dollars held by an approved business,
                  with the vaults and history behind them.
                </p>
                <Separator />
                <Stack gap="md">
                  {PRODUCT_GROUPS.map((g) => (
                    <JumpGroup key={g.caption} {...g} />
                  ))}
                </Stack>
                <Row className="mt-auto flex flex-row items-center justify-start pt-2">
                  <Button
                    className="rounded-full"
                    data-grade-goto="Dashboard — logged-in home"
                    size="lg"
                  >
                    Go to account
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Row>
              </Stack>
            </CardContent>
          </Card>
          </Grid>
        </Stack>
      </Container>
    </Section>
  );
}
