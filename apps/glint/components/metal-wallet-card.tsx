"use client";

import * as React from "react";

/**
 * Glint metal wallet card (Ali, 11 Aug 2026). EXTRACTED alongside
 * MetalPriceCard: the gold and silver screens each carried a copy, and
 * the silver copy was a paste, so every metal-specific string here is
 * composed from the `metal` prop instead of typed.
 *
 * TWIN: this mirrors the Studio shared component "MetalWalletCard"
 * (id cmsottx8hjqk9k). Editing one does not touch the other, so a
 * change here needs the same change there. Keep the pair in sync.
 *
 * EVERY LABEL IS COMPOSED, NOT WRITTEN. The card title is the account's
 * own label ("Gold wallet") and the buy action is built from the asset
 * label ("Buy Gold"), both read from lib/accounts.ts and lib/persona.ts.
 * That is the point of the extraction: there is no longer a place where
 * a screen can say "Silver" in three headings and "Gold" in the fourth.
 *
 * NO ACCOUNT NUMBER (Ali, 11 Aug: "on the gold wallet page we can lose
 * the account number"). The card title already names the wallet, and a
 * custody position's number is not something anyone acts on from a
 * detail page. The USD wallet is the opposite case, and keeps its
 * routing and account numbers called out, because that is how money
 * actually gets into it.
 * This replaces a note that argued for exactly ONE account line, which
 * was fixing a doubled "Gold wallet ··5679 · Account ··5679". The line
 * is gone entirely now, so that argument no longer applies.
 *
 * TRADE FLOW: Buy and Sell both open TradeFlow (direction buy / sell);
 * a completed order moves the Persona balances and this card follows,
 * because the balance is a reactive read. Buy wears the MetalButton,
 * the shared polished face with the hover glint; Sell is a quiet ghost,
 * because selling your treasury should not be the loud button.
 *
 * CUSTODY, NOT DEPOSIT: metal wallets carry no routing number by design.
 * They are custody positions, so lib/accounts.ts holds no routing value
 * for them at all. Nothing on this card reads it now, but the
 * distinction is why: a vault, not a bank.
 */

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Stack,
  Row,
  Button,
} from "@gradeui/ui";
import {
  useBalance,
  usePreference,
  fmtMoney,
  useVaults,
  DEFAULT_PERSONA,
} from "@/lib/persona";
import { toQty, fmtQty, type MetalKey } from "@/lib/market";
import { ACCOUNTS, vaultLabel } from "@/lib/accounts";
import { Wordmark, metalSolid } from "@/components/wordmark";
import { MetalButton } from "@/components/metal-button";
import { TradeFlow } from "@/components/trade-flow";

export function MetalWalletCard({
  metal = "gold",
  className,
}: {
  metal?: MetalKey;
  /** The screen owns the layout: it sets the grid span. */
  className?: string;
}) {
  const [amount] = useBalance(metal);
  /* The ternary, not a template literal: usePreference is keyed on the
     flat PersonaPreferences union, and the two literals keep the key
     typed rather than widening to string. */
  const [unit] = usePreference(metal === "gold" ? "unit.gold" : "unit.silver");
  const label = DEFAULT_PERSONA.balances[metal].label;
  /* REACTIVE, not the persona seed (Ali, 12 Aug: "buying and doing
     transactions should reflect in the UI", and "totals should always be
     computed"). These rows and the headline figure above them are made
     from the same three per-vault balances, so a purchase moves both and
     they cannot disagree. It used to read vaultsFor(metal), the static
     seed, which is how the card came to show 51.2991 g held above three
     rows adding to 47.7350. */
  const vaults = useVaults(metal);
  /* Share of the holding per vault. Computed from the USD slices against
     the metal's own total, NOT from the displayed gram figures, so the
     column sums to 100% instead of drifting with display rounding. */
  const vaultTotal = vaults.reduce((sum, v) => sum + v.amount, 0);

  return (
    /* FLEX COLUMN so CardContent can grow and pin the actions to the
       bottom (Ali, 11 Aug). The card's height is set by the price card
       beside it via the grid, so without this the buttons floated
       directly under the vault list and left dead space below them. */
    <Card className={`flex flex-col ${className ?? ""}`}>
      <CardHeader>
        {/* THE GLINT MARK LEADS THE TITLE (Ali, 11 Aug), the same treatment
            the dashboard tiles use: the G in the wallet's own flat metal
            colour. Rendered from Wordmark rather than an asset file so the
            mark cannot drift from the brand, and tone="current" with the
            colour set here so one component serves both metals. */}
        {/* HEADER HEIGHT IS A CONTRACT BETWEEN THE TWO CARDS (Ali, 11 Aug:
            "could do with the card titles and the big numbers lining up
            visually"). These two sit side by side, so whichever header is
            taller pushes its whole card down and the pair stops reading as
            a row. The price card's header holds a size="sm" ToggleGroup, and
            that control measures 36px, not the 28px of its items: the
            segmented track wraps them in p-0.5. Taller than this card's 20px mark, which left the titles
            8px apart and the big figures 16px apart. min-h-9 is that 36px,
            floored in BOTH headers so neither can drift. Change one, change
            the other. */}
        <Row gap="sm" align="center" className="min-h-9">
          <Wordmark
            lockup="mark"
            tone="current"
            className="size-5"
            style={{ color: metalSolid(metal) }}
          />
          <CardTitle>{ACCOUNTS[metal].label}</CardTitle>
        </Row>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <Stack gap="md" justify="between" className="flex-1">
          <Stack gap="xs">
            {/* HEADLINE SIZE IS DELIBERATE AND SHARED (Ali, 11 Aug: "on
                the cards we need the numbers to be bigger"). text-4xl is
                the figure size on all three wallet screens, Gold, Silver
                and USD, and the USD screen sets it inline because it does
                not use this component. Change one, change all three, or
                the set stops reading as one family. The secondary lines
                below stay at text-sm: they are the context, not the
                number. */}
            <span className="text-4xl font-semibold tabular-nums text-foreground">
              {fmtMoney(amount)}
            </span>
            <span className="text-sm tabular-nums text-muted-foreground">
              {fmtQty(toQty(amount, metal, unit), unit)} held
            </span>
          </Stack>
          {/* 4dp ON BOTH THE TOTAL AND THE SLICES (Ali, 11 Aug: "do 4dp
              grams, thats what the app does"). At the 2dp default the three
              slices rounded independently to 23.87 + 14.32 + 9.55 against a
              47.73 total, so the breakdown visibly failed to add up. Moving
              only one of the two would put the contradiction straight back,
              which is why they are changed together and noted here. */}
          {vaults.length > 0 && (
            <Stack gap="xs">
              {/* A real sub-heading, not a caption (Ali, 11 Aug: "the header
                  Vaults is too small"). text-sm on the foreground reads as
                  a heading for the table under it; at text-xs and muted it
                  sat below the row labels it was meant to head. */}
              <span className="text-sm font-medium text-foreground">
                Vaults
              </span>
              {/* City alone: the fuller "Zurich, Switzerland" is for the
                  transaction sheet, which has the width for it. Each
                  slice is stored in USD, the unit a balance is stored in,
                  and converts here because "how much gold is in Zurich"
                  is the question this answers. */}
              {/* FULL-WIDTH ROWS, VALUE HARD RIGHT (Ali, 11 Aug: "we want
                  those key values to run right across the page, values
                  anchored to the right"). Deliberately not the DS property
                  list here: its label column is a fixed width, so the value
                  sits beside the label rather than at the card's edge, which
                  is the opposite of what is wanted. */}
              {/* A THREE-COLUMN TABLE (Ali, 11 Aug: "in the vaults this is
                  kind of a table"), so the shares and the quantities each
                  line up in their own column rather than ragging against
                  variable-length city names. An explicit grid template
                  rather than the Grid primitive, which spreads equal
                  columns: here the name should take the slack and the two
                  figures should hug their content on the right. */}
              {/* HAIRLINES BETWEEN ROWS (Ali, 11 Aug: without them it
                  "kind of looks unfinished"). The border lives on every
                  CELL rather than on a row wrapper, because the alignment
                  depends on all three rows sharing ONE grid: wrap each row
                  in its own element and the auto columns size per row, so
                  the figures stop lining up. Adjacent cells touch, so the
                  per-cell borders read as one continuous rule, which is
                  why the column spacing is padding here and not gap-x.
                  No rule under the last row: it would read as a footer
                  edge rather than a separator. */}
              <div className="grid grid-cols-[1fr_auto_auto]">
                {vaults.map((v, i) => {
                  const rule =
                    i === vaults.length - 1 ? "" : "border-b border-border";
                  return (
                    <React.Fragment key={v.vault}>
                      <span
                        className={`py-1.5 pr-4 text-sm text-muted-foreground ${rule}`}
                      >
                        {vaultLabel(v.vault)}
                      </span>
                      <span
                        className={`py-1.5 pr-4 text-right text-sm tabular-nums text-muted-foreground ${rule}`}
                      >
                        {vaultTotal
                          ? ((v.amount / vaultTotal) * 100).toFixed(1)
                          : "0.0"}
                        %
                      </span>
                      <span
                        className={`py-1.5 text-right text-sm tabular-nums text-foreground ${rule}`}
                      >
                        {fmtQty(toQty(v.amount, metal, unit), unit)}
                      </span>
                    </React.Fragment>
                  );
                })}
              </div>
            </Stack>
          )}

          <Row gap="sm">
            <TradeFlow metal={metal}>
              <MetalButton metal={metal} size="md">
                Buy {label}
              </MetalButton>
            </TradeFlow>
            <TradeFlow metal={metal} direction="sell">
              <Button variant="ghost" size="md" className="rounded-full">
                Sell
              </Button>
            </TradeFlow>
          </Row>
        </Stack>
      </CardContent>
    </Card>
  );
}
