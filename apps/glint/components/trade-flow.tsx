"use client";

/**
 * Glint trade flow, ported from the Studio shared component
 * "TradeFlow" (cmsoh3ieywgijq): the Buy / Sell modal, one component in
 * both directions, carrying the real Glint iOS app's information
 * order. Wrap the trigger button:
 *
 *   <TradeFlow metal="gold">                  // buy (default)
 *   <TradeFlow metal="gold" direction="sell"> // sell
 *
 * DIRECTION shapes the form, mirroring the two iOS screens:
 *   buy:  Amount, then Quantity.
 *   sell: Quantity FIRST with "x available" beneath it, then the
 *         Amount it pays out, plus the product's three-working-days
 *         clearing note. The metal is what you are spending, so it
 *         leads.
 *
 * RATES: buy is market +0.9%, sell is market -0.9% (Market.rateFor),
 * which is why the app's sell rate is visibly lower than its buy rate
 * at the same moment. The iOS screenshots are GBP; this demo is USD.
 *
 * FORM, top to bottom (matching the iOS app):
 *   - "Current rate" as a titled Callout showing the DEALING rate,
 *     with "incl. 0.9% fee" beneath it exactly as the app labels it.
 *     No source/date line: in the product the rate updates live, so a
 *     settlement date would read as staleness. No wallet row either
 *     (Ali, 11 Aug): both sides of the trade are the customer's own
 *     Glint wallets, and the amount available is already under the
 *     field that needs it.
 *   - LINKED FIELDS: Amount (USD) and Quantity (metal). Typing in
 *     either drives the other through the QUOTE. The field being typed
 *     in is never reformatted under the caret; only the derived one is
 *     rewritten.
 *   - Amount carries the spend headroom / over-balance warning;
 *     Quantity carries the current metal balance (the iOS app's
 *     "0.0000 g Balance" slot).
 *
 * THE QUOTE (11 Aug): every figure in the flow converts at `quote`, a
 * piece of state seeded from Market.rateFor(direction, metal, unit) and
 * refreshed every 30 seconds while the review step is open. The review
 * step shows the window draining as a Progress bar above the confirm
 * action. The app runs that bar inside its gold button; Ali wants it
 * separate, where a progress bar reads as a progress bar.
 *   - THE SEED IS DETERMINISTIC and every random step happens in an
 *     effect after mount. A Math.random() (or a clock read) during
 *     render gives the server pass a different number from the client
 *     pass, and React throws a hydration mismatch.
 *   - THE JITTER LIVES HERE, NEVER IN MARKET. Market's settled prices
 *     are what the activity rows reconcile against, so jittering there
 *     would corrupt figures across the whole demo.
 *
 * FEE: 0.9%, the product's real dealing fee, living INSIDE the quoted
 * rate (Market.BUY_FEE). Review spells it out as a sub-row under the
 * chosen amount so the recap is honest about what is being paid.
 *
 * REVIEW is a labelled list, not prose (Ali, 11 Aug, from the app):
 * Chosen amount (with the quantity beside it) / Fee included / Rate /
 * Total. From and To are gone: the title, the confirm action and the
 * rows themselves already name the direction and both wallets are the
 * customer's own.
 *
 * THE RECEIPT IS A SNAPSHOT, not a recomputation (bug, 11 Aug): the
 * done step used to derive its quantity from the live balances, and
 * `valid` re-checks "amount <= fiat", which is false once the order
 * has already been paid for. Spending $10,000 of $15,210 left $5,210,
 * the check failed, and the receipt read "You bought 0.00 g" even
 * though the balances had moved correctly. An executed order is
 * history: confirm() freezes it into `order`, the receipt renders only
 * from that, and the refresh timer stops the moment it exists, so a
 * refresh can never move what a completed order says.
 *
 * DONE: confirming MOVES THE PERSONA BALANCES through the reactive
 * setters, so the dashboard cards and the wallet screens update live.
 * Closing the dialog resets the flow.
 *
 * Keep in sync with the Studio component.
 */

import * as React from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Callout,
  CalloutTitle,
  CalloutDescription,
  Field,
  FieldLabel,
  FieldDescription,
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupInput,
  InputGroupButton,
  Progress,
  PropertyList,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Stack,
  Row,
} from "@gradeui/ui";
import { CheckCircle2, ChevronRight } from "lucide-react";
import { Persona } from "@/lib/persona";
import { Accounts, type VaultId } from "@/lib/accounts";
import { Market, type MetalKey, type TradeDirection } from "@/lib/market";
import { Wordmark, metalSolid } from "@/components/wordmark";
import { MetalButton } from "@/components/metal-button";

/** How long a quote is held before it refreshes. The app's window is
 *  about half a minute. */
const QUOTE_WINDOW_MS = 30_000;
/** Tick fine enough that the bar drains smoothly rather than in steps. */
const QUOTE_TICK_MS = 250;
/** How far a refresh may move the rate: plus or minus 0.12%. On gold
 *  near $140/g that is about 17 cents, which lands in the cents of the
 *  rate and the fourth decimal of the quantity, so a refresh is visible
 *  without pretending the market lurches every 30 seconds. */
const QUOTE_DRIFT = 0.0012;

/** FIXED PANEL HEIGHT from sm up, one per direction, measured against
 *  the tallest step that direction has, which since the clearing note
 *  moved to the review step is the FORM in both directions, and both
 *  forms now hold the same three fields. Hence one figure for both. Review needs 362px and the receipt less, so those steps carry
 *  air above the footer, which is the price of a panel that does not
 *  resize under the pointer. A TradeFlow instance is only ever one
 *  direction, so two heights cannot make anything jump. The slack is
 *  deliberate: a font fallback that wraps the note one line further
 *  should not put a scrollbar in the normal case. */
const PANEL_HEIGHT: Record<TradeDirection, string> = {
  buy: "sm:h-[566px]",
  sell: "sm:h-[566px]",
};

/** The scrolling body of every step: it takes the space the pinned
 *  header and footer leave. The negative margin plus matching padding is
 *  a gutter for the inputs' focus ring, which an overflow container
 *  would otherwise clip. */
/* pt-2 (Ali, 12 Aug: "I also need some space between the card header and
   the card content"). DialogHeader sets no bottom space of its own, which
   only showed on the review step: the buy form's first child is a Callout
   with its own padding, so it looked fine, while a PropertyList row sat
   straight under the title. Here rather than per-step, so every step
   breathes the same. */
const BODY_CLASS =
  "sm:-mx-1 sm:min-h-0 sm:flex-1 sm:overflow-y-auto sm:px-1 pt-2";

/** The Glint G in the metal's flat brand colour, the same mark the
 *  wallet cards lead their titles with. */
function MetalMark({ metal }: { metal: MetalKey }) {
  return (
    <Wordmark
      lockup="mark"
      tone="current"
      className="size-5"
      style={{ color: metalSolid(metal) }}
    />
  );
}

/** THE VAULT CHOICES, in the order Ali named them (12 Aug: "Salt Lake
 *  City, Miami, Zurich"). Ids only: every label is composed through the
 *  Accounts directory, so a vault renamed there renames here too and
 *  nothing is typed twice. A vault added to the directory has to be added
 *  HERE as well, which is deliberate: the buy form offers a curated list,
 *  not a dump of the registry. */
const VAULT_CHOICES: VaultId[] = ["saltlake", "miami", "zurich"];

const METAL_LABEL: Record<MetalKey, string> = {
  gold: "Gold",
  silver: "Silver",
};

/** Derived-field formatting: money to 2dp, metal to 4dp (the iOS app
 *  shows 4dp grams). Empty in, empty out, so clearing one field clears
 *  the other. */
function fmtDerived(n: number, places: number): string {
  if (!Number.isFinite(n) || n <= 0) return "";
  return n.toFixed(places);
}


export function TradeFlow({
  metal = "gold",
  direction = "buy",
  children,
}: {
  metal?: MetalKey;
  direction?: TradeDirection;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [step, setStep] = React.useState<"form" | "review" | "done">("form");
  const [amountRaw, setAmountRaw] = React.useState("");
  const [qtyRaw, setQtyRaw] = React.useState("");
  /** The executed order, frozen at confirm. The receipt reads ONLY
   *  this. See the note at the top of this file. */
  const [order, setOrder] = React.useState<{
    qty: number;
    cash: number;
    fee: number;
    nextMetal: number;
    nextFiat: number;
    vault: VaultId;
  } | null>(null);
  const [fiat, setFiat] = Persona.useBalance("fiat");
  const [metalBal, setMetalBal] = Persona.useBalance(metal);
  const [unit] = Persona.usePreference(
    metal === "gold" ? "unit.gold" : "unit.silver"
  );
  /* THE VAULT THIS PURCHASE LANDS IN. Two values on purpose:
     `prefVault` is the standing preference, read reactively, and
     `vaultChoice` is this dialog's override, which starts unset.
     A CHANGE HERE MUST NOT WRITE THE PREFERENCE (Ali, 12 Aug: "changing
     this only applies for this purchase"), so the setter is local state
     and the preference is never touched. reset() clears the override, so
     reopening the dialog starts from the default again.
     Reading through the hook rather than getPreference() also keeps the
     first render identical on the server and the client, which is the
     same hydration rule the balances follow. */
  /* The per-vault balances for this metal: `credit` is how a buy
     lands in one vault. The total it exposes is the same number
     useBalance(metal) returns, so nothing double-counts. */
  const vaults = Persona.useMetalVaults(metal);
  /* Where a completed order gets written into the history. */
  const { add: addActivity } = Persona.useLiveActivity();
  const [prefVault] = Persona.usePreference("vault");
  const [vaultChoice, setVaultChoice] = React.useState<VaultId | null>(null);

  const selling = direction === "sell";
  const label = METAL_LABEL[metal];
  const verb = selling ? "Sell" : "Buy";
  /** The dealing fee for this direction, as the labels write it. */
  const feePct = ((selling ? Market.SELL_FEE : Market.BUY_FEE) * 100).toFixed(
    1
  );
  const amount = Number.parseFloat(amountRaw);
  const qtyTyped = Number.parseFloat(qtyRaw);
  /* WHICH VAULT THIS TRADE TOUCHES, and it means two different things:
       BUY  the vault the metal lands in, any of the three, defaulting to
            the standing preference.
       SELL the vault the metal comes OUT of (Ali, 12 Aug: "we would have
            to allow them to choose which vault to sell from - spread
            evenly across all is complicated"). He is right, and it
            replaced a pro-rata debit I had assumed. Choices are only the
            vaults that actually hold this metal, and the FIELD ONLY
            APPEARS WHEN THERE IS MORE THAN ONE ("the sell from a vault
            will only be an option if there is more than one valut for
            that metal"): with a single vault there is no choice to make,
            so the sale simply comes from there.
     A sell defaults to the preferred vault when it holds some of this
     metal, and otherwise to the largest holding, which is the first row.
     Nothing held at all leaves it undefined, and the form is invalid
     anyway, so no label reads off it. */
  const sellRows = vaults.rows;
  const sellDefault =
    sellRows.find((row) => row.vault === prefVault)?.vault ??
    sellRows[0]?.vault;
  const vault = vaultChoice ?? (selling ? sellDefault : prefVault);
  const vaultChoices = selling ? sellRows.map((row) => row.vault) : VAULT_CHOICES;
  const showVaultField = selling ? sellRows.length > 1 : true;
  /** What the chosen vault holds, which is the ceiling on a sale. */
  const vaultUsd = sellRows.find((row) => row.vault === vault)?.amount ?? 0;
  /* HELD, and for a SELL the ceiling is the CHOSEN VAULT rather than the
     whole wallet: you cannot sell 40g out of a vault holding 17. With one
     vault the two are the same figure. */
  const held = Market.toQty(selling ? vaultUsd : metalBal, metal, unit);
  const heldQty = Market.fmtQty(held, unit);
  /** The whole holding, for the buy form's "balance" line. */
  const walletQty = Market.fmtQty(Market.toQty(metalBal, metal, unit), unit);

  /* The settled dealing rate for this direction, and the live quote the
     flow actually converts at. The quote is seeded from the settled rate
     so the first render is identical on the server and the client. */
  const baseRate = Market.rateFor(direction, metal, unit);
  const [quote, setQuote] = React.useState(baseRate);
  const [quoteMsLeft, setQuoteMsLeft] = React.useState(QUOTE_WINDOW_MS);
  /** Bumped by each refresh, which is what starts the next window. */
  const [quoteWindow, setQuoteWindow] = React.useState(0);

  /* Re-seed when the settled rate changes under us: the unit
     preference can flip from grams to ounces while the modal is
     mounted, and a per-gram quote labelled "oz" would be a lie. Setting
     the same value is a no-op in React, so on mount this does nothing. */
  React.useEffect(() => {
    setQuote(baseRate);
    setQuoteMsLeft(QUOTE_WINDOW_MS);
  }, [baseRate]);

  /* Buy is limited by cash, sell by metal. */
  const overBalance = selling
    ? Number.isFinite(qtyTyped) && qtyTyped > held
    : Number.isFinite(amount) && amount > fiat;
  const valid = selling
    ? Number.isFinite(qtyTyped) && qtyTyped > 0 && qtyTyped <= held
    : Number.isFinite(amount) && amount > 0 && amount <= fiat;

  /* Both directions are the same two conversions through the quote: the
     direction is already baked into the rate, so `amount / quote` IS
     Market.buyQty for a buy and `qtyTyped * quote` IS
     Market.sellProceeds for a sell. Going through the quote rather than
     those helpers is what lets a refresh move the figures. */
  const qty = !valid ? 0 : selling ? qtyTyped : amount / quote;
  const cash = !valid ? 0 : selling ? qtyTyped * quote : amount;
  /* The fee, 0.9%, taken out of the quoted rate. A BUY's fee is a share
     of the cash and does not move when the rate refreshes:
     Market.buyFee(amount) = amount * (1 - 1/1.009). A SELL's fee is
     charged on the gross, so it has to follow the quote: Market.sellFee
     restated in terms of the proceeds is cash * f / (1 - f), the same
     figure Market computes while the quote sits on the settled rate. */
  const fee = !valid
    ? 0
    : selling
    ? (cash * Market.SELL_FEE) / (1 - Market.SELL_FEE)
    : Market.buyFee(amount);

  /* Linked fields, both converting at the quote. */
  const onAmount = (v: string) => {
    setAmountRaw(v);
    setQtyRaw(fmtDerived(Number.parseFloat(v) / quote, 4));
  };
  const onQty = (v: string) => {
    setQtyRaw(v);
    setAmountRaw(fmtDerived(Number.parseFloat(v) * quote, 2));
  };

  /* THE COUNTDOWN, one window per `quoteWindow`. It runs only while an
     unplaced order is on the review step: nothing should tick behind
     the form, and an executed order is history, so the timer stops the
     moment `order` exists.
     The window is a DEADLINE, not a tally of ticks. Browsers throttle
     timers in a background tab, so counting 120 ticks of 250ms makes a
     30 second hold last two minutes on a tab nobody is looking at.
     Reading the clock here is fine, and reading it in render is not:
     it is the same hydration hazard as Math.random(). */
  React.useEffect(() => {
    if (step !== "review" || order) return;
    const endsAt = Date.now() + QUOTE_WINDOW_MS;
    setQuoteMsLeft(QUOTE_WINDOW_MS);
    const id = window.setInterval(() => {
      setQuoteMsLeft(Math.max(0, endsAt - Date.now()));
    }, QUOTE_TICK_MS);
    return () => window.clearInterval(id);
  }, [step, order, quoteWindow]);

  /* THE REFRESH, and the only randomness in the flow. It jitters off
     the SETTLED rate rather than off the last quote, so a modal left
     open for ten minutes does not random-walk away from the market. */
  React.useEffect(() => {
    if (quoteMsLeft > 0 || step !== "review" || order) return;
    const next = baseRate * (1 + (Math.random() * 2 - 1) * QUOTE_DRIFT);
    setQuote(next);
    setQuoteWindow((n) => n + 1);
    /* Keep the form's derived field honest, so stepping Back does not
       show a quantity priced at the previous quote. */
    if (selling) setAmountRaw(fmtDerived(qtyTyped * next, 2));
    else setQtyRaw(fmtDerived(amount / next, 4));
  }, [quoteMsLeft, step, order, baseRate, selling, qtyTyped, amount]);

  const reset = () => {
    setStep("form");
    setAmountRaw("");
    setQtyRaw("");
    setOrder(null);
    /* Back to the standing default: an override belongs to one purchase. */
    setVaultChoice(null);
    /* Back to the settled rate with a full bar, so reopening the dialog
       never flashes the last order's quote or a drained window. */
    setQuote(baseRate);
    setQuoteMsLeft(QUOTE_WINDOW_MS);
  };

  const confirm = () => {
    /* Buy: USD falls by the amount and the wallet gains the QUANTITY
       bought, valued at the MARKET rate. The fee is Glint's, so it
       does not land in the customer's wallet, and crediting the
       quantity is what makes the wallet's grams rise by exactly the
       grams on the receipt. (While the quote sits on the settled rate
       that is identical to amount - fee; once a refresh has moved it,
       the grams are what the customer was promised.)
       Sell: the metal leaves at MARKET value, USD rises by the
       proceeds. Freeze the receipt BEFORE the balances move. */
    const nextMetal = selling
      ? metalBal - Market.toUsd(qtyTyped, metal, unit)
      : metalBal + Market.toUsd(qty, metal, unit);
    const nextFiat = selling ? fiat + cash : fiat - amount;
    setOrder({ qty, cash, fee, nextMetal, nextFiat, vault });
    /* A BUY LANDS IN THE CHOSEN VAULT (Ali, 12 Aug: the picker, and
       "buying and doing transactions should reflect in the UI"), so it
       credits that one vault rather than setting a total. The wallet
       card's vault table and its headline figure are both made from these
       per-vault balances, so the row for this vault grows by exactly what
       the receipt says and the two stay reconciled.
       A SELL has no vault picker, so it sets the total and Persona
       distributes the fall pro rata across the vaults that hold the
       metal. That rule is an assumption, documented where it lives. */
    const moved = Market.toUsd(selling ? qtyTyped : qty, metal, unit);
    vaults.credit(vault, selling ? -moved : moved);
    setFiat(nextFiat);
    /* AND IT GOES INTO THE HISTORY (Ali, 12 Aug: "let's make things appear
       in activity"). A full ActivityRow, not a lighter shape, so it flows
       through the same table, detail sheet and Money in / Money out
       filters as the seeded rows.
       SIGNS follow the seeded convention: metalAmount is negative on a
       sale, fiatAmount negative when money leaves the cash wallet.
       metalAmount is in GRAMS whatever unit the form was in, which is why
       it is converted back through the market value rather than taken
       from the input. The timestamp is shifted by the timezone offset so
       it reads as the wall clock, matching the seeded rows' local format
       rather than landing an hour out in UTC. Date.now() here is fine: it
       is a click handler, not a render. */
    const at = Date.now();
    const stamped = new Date(at - new Date(at).getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 19);
    /* ROUNDED TO 4dp, the precision every gram figure in the app is
       displayed at. The conversion goes qty -> USD -> grams, which for a
       2.0000 g order comes back as 1.9999913, and while nothing renders
       that, storing it would put a lie in the row's data. */
    const grams = Math.round(Market.toQty(moved, metal, "g") * 1e4) / 1e4;
    addActivity({
      id: `tx-live-${at}`,
      kind: selling ? "exchange-sell" : "exchange-buy",
      description: selling
        ? `Exchange ${label} to USD`
        : `Exchange USD to ${label}`,
      timestamp: stamped,
      metalAmount: selling ? -grams : grams,
      metal,
      fiatAmount: selling ? cash : -cash,
      rate: quote,
      type: "exchange",
      status: "completed",
      account: metal,
      counterAccount: "fiat",
      vault,
      method: "market-order",
      /* Cents, like the seeded rows: the live figure carries the full
         float of a 0.9% share. */
      fee: Math.round(fee * 100) / 100,
      reference: `GX-${String(at).slice(-8, -4)}-${String(at).slice(-4)}`,
    });

    setStep("done");
  };

  const rateCallout = (
    <Callout>
      <CalloutTitle>Current rate</CalloutTitle>
      <CalloutDescription>
        1 {unit} = {Persona.fmtMoney(quote)}
        <span className="text-muted-foreground"> incl. {feePct}% fee</span>
      </CalloutDescription>
    </Callout>
  );

  /* THE FIGURE SITS ON THE LABEL LINE (Ali, 12 Aug). It was under the
     field in the description, then briefly in a block-end addon INSIDE
     the field, which he read as "quite a large place to put it -
     especially with all the decinal places". He is right: a full-width
     row inside the border is a lot of furniture for one number. The label
     line is free space, and label-left / value-right is how every
     transfer form states a balance.
     text-sm, matching the LABEL beside it (Ali, 12 Aug: "make this text
     bigger please"). It was text-xs, the size a description under a field
     takes, which is the wrong size once the figure has moved up to sit
     level with a 14px label: it read as a footnote attached to the label
     rather than as the other half of the line.
     The description now only carries what it is for, which is telling you
     when something is wrong. */
  const amountField = (
    <Field>
      <Row justify="between" align="center" gap="sm">
        <FieldLabel>Amount</FieldLabel>
        {!selling && (
          <span className="text-sm tabular-nums text-muted-foreground">
            {Persona.fmtMoney(fiat)} available
          </span>
        )}
      </Row>
      <InputGroup size="lg">
        <InputGroupAddon align="inline-start">
          <InputGroupText>$</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput
          placeholder="0.00"
          inputMode="decimal"
          value={amountRaw}
          onChange={(e) => onAmount(e.target.value)}
        />
      </InputGroup>
      {!selling && overBalance ? (
        <FieldDescription className="text-xs">
          That is more than your USD balance.
        </FieldDescription>
      ) : null}
    </Field>
  );

  /* SELL ALL (Ali, 12 Aug: "we might in sell the ability to Sell All"),
     compact and INSIDE the field beside the unit, where a max action
     belongs. It empties the CHOSEN vault and no other, which is why the
     figure beside the label is that vault's holding: the vault select
     sits directly above, so the label line does not repeat its name.
     It fills the field through onQty, the same path typing takes, so the
     amount follows and the review step sees an ordinary order. 4dp is
     what the field shows, and the vault lands at zero because the gram
     figure and the vault's dollars are derived from each other. */
  const quantityField = (
    <Field>
      <Row justify="between" align="center" gap="sm">
        <FieldLabel>Quantity</FieldLabel>
        <span className="text-sm tabular-nums text-muted-foreground">
          {selling ? `${heldQty} available` : `${walletQty} held`}
        </span>
      </Row>
      <InputGroup size="lg">
        <InputGroupInput
          placeholder="0.0000"
          inputMode="decimal"
          value={qtyRaw}
          onChange={(e) => onQty(e.target.value)}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupText>{unit}</InputGroupText>
          {selling && held > 0 ? (
            /* SECONDARY at the addon's OWN size and shape (Ali, 12 Aug:
               "feels a bit hidden... it would have to be like secondary or
               something not ghost", then "I preferred the hover
               proviously, and the shape").
               So: the variant changed and nothing else did. It defaulted
               to variant="ghost", which is text with no surface, and
               beside the unit affix that read as a label. `secondary`
               gives it a surface (and keeps a hover, bg-secondary/80).
               The size and radius are back to InputGroupButton's own xs:
               h-6 with the addon's tighter corner. I had pushed it to sm
               and rounded-full, which made it a pill competing with the
               dialog's real buttons, and that is the shape he wanted back.
               NOT `default`: that is the primary fill, and the loudest
               thing in a sell dialog should be the Sell button, not a
               convenience that fills in a number. */
            <InputGroupButton
              variant="secondary"
              onClick={() => onQty(held.toFixed(4))}
            >
              Sell all
            </InputGroupButton>
          ) : null}
        </InputGroupAddon>
      </InputGroup>
      {selling && overBalance ? (
        <FieldDescription className="text-xs">
          {`That is more ${label.toLowerCase()} than ${
            vault ? Accounts.vaultLabel(vault) : "that vault"
          } holds.`}
        </FieldDescription>
      ) : null}
    </Field>
  );

  /* The rate hold, shown above the confirm action. */
  /* WHERE THE METAL GOES. Buy only: a sell takes metal OUT, and which
     vault it leaves is a different question with a different answer (and
     one Ali has not asked for), so the sell form does not pretend to
     offer the choice. */
  const vaultField = (
    <Field>
      <FieldLabel>Vault</FieldLabel>
      <Select value={vault} onValueChange={(v) => v && setVaultChoice(v as VaultId)}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {vaultChoices.map((id) => (
            <SelectItem key={id} value={id}>
              {Accounts.vaultLocation(id)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FieldDescription className="text-xs">
        {selling
          ? "The sale comes out of this vault."
          : `Applies to this purchase only. Your default stays ${Accounts.vaultLabel(prefVault)}.`}
      </FieldDescription>
    </Field>
  );

  const quoteTimer = (
    /* No mt-auto here any more: on the review step this sits inside the
       bottom block below, which does the pinning for the whole group. */
    <Stack gap="xs">
      <Row justify="between" align="center">
        <span className="text-xs text-muted-foreground">Rate held for</span>
        <span className="text-xs font-medium text-foreground">
          {Math.ceil(quoteMsLeft / 1000)}s
        </span>
      </Row>
      {/* ACCENT (Ali, 11 Aug), matching the onboarding progress bar. The
          countdown is context for the rate above it, not an action, so it
          should not carry the same weight as the Buy button under it. */}
      <Progress
        value={(quoteMsLeft / QUOTE_WINDOW_MS) * 100}
        tone="accent"
        className="h-1"
        aria-label="Time left on this rate"
      />
    </Stack>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        /* RESET ON OPEN, NOT ON CLOSE (Ali, 12 Aug: "once I've bought and
           I go back to buy gold, the modal is still the order complete
           state"). Two things were wrong. The Done button calls setOpen
           directly, which never reaches onOpenChange, so a close through
           Done skipped the reset entirely and the next open showed the
           last receipt. And resetting on close would blank the receipt
           while the panel is still animating out. Resetting as it OPENS
           fixes both: every entry starts at the form, whichever way the
           last one ended. */
        if (o) reset();
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      {/* FIXED HEIGHT FROM sm UP so the panel stops resizing between
          steps: header and footer are shrink-0, the body takes the rest
          and scrolls itself. See PANEL_HEIGHT for the measurements.
          Below sm the panel is the DS full-screen sheet and every one of
          these classes is off, which is the right shape on a phone.
          bordered={false} is the DS prop, not a border-0 override. */}
      <DialogContent
        bordered={false}
        className={`sm:flex sm:max-w-md sm:flex-col ${PANEL_HEIGHT[direction]}`}
      >
        {step === "form" && (
          <>
            <DialogHeader className="shrink-0">
              <DialogTitle>
                <Row gap="sm" align="center">
                  <MetalMark metal={metal} />
                  {verb} {label}
                </Row>
              </DialogTitle>
            </DialogHeader>
            <Stack gap="md" className={BODY_CLASS}>
              {rateCallout}
              {selling ? (
                <>
                  {/* VAULT FIRST on a sell: it decides how much there is
                      to sell, so asking for the quantity before the
                      source would be asking against the wrong limit. */}
                  {showVaultField ? vaultField : null}
                  {quantityField}
                  {amountField}
                  {/* THE CLEARING NOTE MOVED TO THE REVIEW STEP (Ali,
                      12 Aug). It is a consequence of confirming, not
                      something you need while deciding how much to sell,
                      and on the form it sat under the fields competing
                      with their own descriptions. */}
                </>
              ) : (
                <>
                  {amountField}
                  {quantityField}
                  {showVaultField ? vaultField : null}
                </>
              )}
            </Stack>
            {/* No Cancel (Ali, 11 Aug): DialogContent already renders a
                close target, and two ways to dismiss one modal is one
                too many. Back on the review step stays, because that is
                navigation, not dismissal. */}
            <DialogFooter className="shrink-0">
              <Button
                size="lg"
                className="rounded-full"
                disabled={!valid}
                onClick={() => setStep("review")}
              >
                Review
                <ChevronRight className="size-4" />
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "review" && (
          <>
            {/* ONE HEADER FOR THE WHOLE FLOW (Ali, 12 Aug: "I think the
                main modal header should stay the same - so lets figure that
                out"). It is the same mark and the same title on all three
                steps now, so the panel never re-labels itself while you
                move through it, and WHERE you are is said by the body: the
                order rows here, the tick and "Order complete" on the
                receipt. This step used to own the title with "Review
                order", which is the line that moved into the body below. */}
            <DialogHeader className="shrink-0">
              <DialogTitle>
                <Row gap="sm" align="center">
                  <MetalMark metal={metal} />
                  {verb} {label}
                </Row>
              </DialogTitle>
            </DialogHeader>
            <Stack gap="md" className={BODY_CLASS}>
              {/* No icon, unlike the receipt's tick: a review is a state you
                  are passing through, not an outcome worth marking. */}
              <span className="text-base font-medium text-foreground">
                Review order
              </span>
              {/* The app's Review sheet is a labelled list, so these are
                  PropertyList rows (a real dl) rather than a sentence.
                  "Fee included" STAYS INSIDE the same list: it is
                  another property of the same order, and a nested list
                  would be announced as a second record. Its second tier
                  is type, indent and a tightened top margin, not
                  structure. */}
              <PropertyList labelWidth="8.5rem">
                <PropertyList.Row
                  label={selling ? "Chosen quantity" : "Chosen amount"}
                >
                  <span className="font-medium text-foreground">
                    {selling ? Market.fmtQty(qty, unit) : Persona.fmtMoney(cash)}
                  </span>{" "}
                  <span className="text-muted-foreground">
                    {`(${
                      selling ? Persona.fmtMoney(cash) : Market.fmtQty(qty, unit)
                    })`}
                  </span>
                </PropertyList.Row>
                <PropertyList.Row
                  className="-mt-1.5"
                  /* NO INDENT (Ali, 12 Aug: "looks crap"). It was pl-3,
                     trying to show the fee as a child of the row above it.
                     A PropertyList is a two-column dl, so nudging one
                     label right just breaks the column edge every other
                     row keeps; the smaller type already says it is a
                     second tier. */
                  label={<span className="text-xs">Fee included</span>}
                  value={
                    <span className="text-xs text-muted-foreground">
                      {`${Persona.fmtMoney(fee)} (${feePct}%)`}
                    </span>
                  }
                />
                {vault ? (
                  <PropertyList.Row
                    label={selling ? "Sold from" : "Vault"}
                    value={Accounts.vaultLabel(vault)}
                  />
                ) : null}
                <PropertyList.Row
                  label="Rate"
                  value={`${Persona.fmtMoney(quote)}/${unit}`}
                />
                <PropertyList.Row
                  label="Total"
                  value={
                    <span className="font-medium text-foreground">
                      {Persona.fmtMoney(cash)}
                    </span>
                  }
                />
              </PropertyList>
              {/* THE SMALL PRINT SITS WITH THE BUTTON (Ali, 12 Aug: "we'd
                  probably also have the By clicking line next to the
                  button, or the rate timer"). mt-auto on the GROUP, so the
                  authorisation, the clearing note and the rate bar all
                  drop to the bottom of the panel together, directly above
                  the footer they are about, instead of hanging under the
                  order rows with a void beneath them.
                  The clearing note is sells only, and it is HERE rather
                  than on the form because it is what happens after you
                  commit. The receipt repeats it, which is right: once the
                  order is placed it stops being a warning and becomes the
                  status of your money. */}
              <Stack gap="md" className="mt-auto">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  By clicking &ldquo;{verb} {label}&rdquo;, you authorise Glint
                  to execute the market order detailed above.
                </p>
                {selling && (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    It can take up to three working days for funds to clear in
                    your wallet when you sell.
                  </p>
                )}
                {quoteTimer}
              </Stack>
            </Stack>
            <DialogFooter className="shrink-0">
              <Button
                variant="ghost"
                size="lg"
                className="rounded-full"
                onClick={() => setStep("form")}
              >
                Back
              </Button>
              <MetalButton metal={metal} size="lg" onClick={confirm}>
                {verb} {label}
              </MetalButton>
            </DialogFooter>
          </>
        )}

        {step === "done" && order && (
          <>
            {/* THE HEADER DOES NOT CHANGE (Ali, 12 Aug: the order complete
                screens "should maintain the same Title and icon - so should
                always have the Glint gold of silver. We would then move the
                rest of the content (Order complete etc) onto the content").
                So all three steps wear the metal's Glint mark and the flow's
                own name, and the panel stops re-labelling itself under the
                pointer: what changes is the body, which is where the state
                of an order belongs. The green tick moved into the content
                with the "Order complete" line. */}
            <DialogHeader className="shrink-0">
              <DialogTitle>
                <Row gap="sm" align="center">
                  <MetalMark metal={metal} />
                  {verb} {label}
                </Row>
              </DialogTitle>
            </DialogHeader>
            <Stack gap="md" className={BODY_CLASS}>
              <Stack gap="xs">
                <Row gap="sm" align="center">
                  <CheckCircle2 className="size-5 text-success" />
                  <span className="text-base font-medium text-foreground">
                    Order complete
                  </span>
                </Row>
                {/* THE HEADLINE (Ali, 12 Aug, with a shot of the real app:
                    "the headline should have a bigger font, and nicer
                    formatting. We should probably say You bought 48.2137 g
                    of Silver for $100.00. It will be vaulted in Salt Lake
                    City (Always capitalise the metal)").
                    text-lg, and the three facts a customer checks are lifted
                    out of the muted sentence: the QUANTITY and the PRICE in
                    full foreground, and the METAL in its own flat brand
                    colour, which is the app's own treatment. The rest stays
                    muted so those three read first.
                    CAPITALISED: it was label.toLowerCase(), which turned
                    Glint's product names into common nouns. `label` is
                    already "Gold" / "Silver".
                    The vault sentence is buy-only. A sale does not get
                    vaulted anywhere, so it says where it came from instead,
                    and the property list no longer repeats either: the
                    sentence is the better place for it. */}
                <DialogDescription className="text-lg leading-snug">
                  You {selling ? "sold" : "bought"}{" "}
                  <span className="font-medium text-foreground">
                    {Market.fmtQty(order.qty, unit)}
                  </span>{" "}
                  of{" "}
                  <span
                    className="font-medium"
                    style={{ color: metalSolid(metal) }}
                  >
                    {label}
                  </span>{" "}
                  for{" "}
                  <span className="font-medium text-foreground">
                    {Persona.fmtMoney(order.cash)}
                  </span>
                  .
                  {order.vault ? (
                    <>
                      {selling ? " Sold out of " : " It will be vaulted in "}
                      <span className="font-medium text-foreground">
                        {Accounts.vaultLabel(order.vault)}
                      </span>
                      .
                    </>
                  ) : null}
                </DialogDescription>
              </Stack>
              <PropertyList labelWidth="10.5rem">
                <PropertyList.Row label={`New ${label} balance`}>
                  <span className="font-medium text-foreground">
                    {Persona.fmtMoney(order.nextMetal)}
                  </span>{" "}
                  <span className="text-muted-foreground">
                    {`(${Market.fmtQty(
                      Market.toQty(order.nextMetal, metal, unit),
                      unit
                    )})`}
                  </span>
                </PropertyList.Row>
                <PropertyList.Row
                  label="New USD balance"
                  value={
                    <span className="font-medium text-foreground">
                      {Persona.fmtMoney(order.nextFiat)}
                    </span>
                  }
                />
              </PropertyList>
              {/* Bottom of the panel here too (Ali, 12 Aug: "small print
                  should always be at the bottom - on buy as well"). The
                  review step pins its group for both directions already,
                  since that step is shared; this is the receipt's own
                  note, which was sitting under the balances. */}
              {selling && (
                <p className="mt-auto text-sm leading-relaxed text-muted-foreground">
                  Funds can take up to three working days to clear.
                </p>
              )}
            </Stack>
            <DialogFooter className="shrink-0">
              <Button
                size="lg"
                className="rounded-full"
                onClick={() => setOpen(false)}
              >
                Done
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
