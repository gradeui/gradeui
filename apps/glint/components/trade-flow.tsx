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
 *  the tallest step that direction has: the buy form needs 551px (455
 *  before the vault field, which adds a label, a 36px trigger and a
 *  description) and the sell form 517px, which has no vault field and
 *  carries the three-working-days clearing note instead. Review needs 362px and the receipt less, so those steps carry
 *  air above the footer, which is the price of a panel that does not
 *  resize under the pointer. A TradeFlow instance is only ever one
 *  direction, so two heights cannot make anything jump. The slack is
 *  deliberate: a font fallback that wraps the note one line further
 *  should not put a scrollbar in the normal case. */
const PANEL_HEIGHT: Record<TradeDirection, string> = {
  buy: "sm:h-[566px]",
  sell: "sm:h-[530px]",
};

/** The scrolling body of every step: it takes the space the pinned
 *  header and footer leave. The negative margin plus matching padding is
 *  a gutter for the inputs' focus ring, which an overflow container
 *  would otherwise clip. */
const BODY_CLASS = "sm:-mx-1 sm:min-h-0 sm:flex-1 sm:overflow-y-auto sm:px-1";

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
  const [prefVault] = Persona.usePreference("vault");
  const [vaultChoice, setVaultChoice] = React.useState<VaultId | null>(null);
  const vault = vaultChoice ?? prefVault;

  const selling = direction === "sell";
  const label = METAL_LABEL[metal];
  const verb = selling ? "Sell" : "Buy";
  /** The dealing fee for this direction, as the labels write it. */
  const feePct = ((selling ? Market.SELL_FEE : Market.BUY_FEE) * 100).toFixed(
    1
  );
  const amount = Number.parseFloat(amountRaw);
  const qtyTyped = Number.parseFloat(qtyRaw);
  const held = Market.toQty(metalBal, metal, unit);
  const heldQty = Market.fmtQty(held, unit);

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
    if (selling) setMetalBal(nextMetal);
    else vaults.credit(vault, Market.toUsd(qty, metal, unit));
    setFiat(nextFiat);
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

  const amountField = (
    <Field>
      <FieldLabel>Amount</FieldLabel>
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
      <FieldDescription className="text-xs">
        {selling
          ? `${Persona.fmtMoney(fiat)} balance`
          : overBalance
          ? "That is more than your USD balance."
          : `Up to ${Persona.fmtMoney(fiat)} available`}
      </FieldDescription>
    </Field>
  );

  const quantityField = (
    <Field>
      <FieldLabel>Quantity</FieldLabel>
      <InputGroup size="lg">
        <InputGroupInput
          placeholder="0.0000"
          inputMode="decimal"
          value={qtyRaw}
          onChange={(e) => onQty(e.target.value)}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupText>{unit}</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
      <FieldDescription className="text-xs">
        {selling && overBalance
          ? `That is more ${label.toLowerCase()} than you hold.`
          : `${heldQty} ${selling ? "available" : "balance"}`}
      </FieldDescription>
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
          {VAULT_CHOICES.map((id) => (
            <SelectItem key={id} value={id}>
              {Accounts.vaultLocation(id)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FieldDescription className="text-xs">
        Applies to this purchase only. Your default stays{" "}
        {Accounts.vaultLabel(prefVault)}.
      </FieldDescription>
    </Field>
  );

  const quoteTimer = (
    <Stack gap="xs" className="mt-auto">
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
        if (!o) reset();
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
                  {quantityField}
                  {amountField}
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    It can take up to three working days for funds to clear in
                    your wallet when you sell.
                  </p>
                </>
              ) : (
                <>
                  {amountField}
                  {quantityField}
                  {vaultField}
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
            <DialogHeader className="shrink-0">
              <DialogTitle>
                <Row gap="sm" align="center">
                  <MetalMark metal={metal} />
                  Review order
                </Row>
              </DialogTitle>
            </DialogHeader>
            <Stack gap="md" className={BODY_CLASS}>
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
                  label={<span className="pl-3 text-xs">Fee included</span>}
                  value={
                    <span className="text-xs text-muted-foreground">
                      {`${Persona.fmtMoney(fee)} (${feePct}%)`}
                    </span>
                  }
                />
                {!selling && (
                  <PropertyList.Row
                    label="Vault"
                    value={Accounts.vaultLabel(vault)}
                  />
                )}
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
              <p className="text-sm leading-relaxed text-muted-foreground">
                By clicking &ldquo;{verb} {label}&rdquo;, you authorise Glint to
                execute the market order detailed above.
              </p>
              {quoteTimer}
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
            <DialogHeader className="shrink-0">
              <DialogTitle>
                <Row gap="sm" align="center">
                  <CheckCircle2 className="size-5 text-success" />
                  Order complete
                </Row>
              </DialogTitle>
              <DialogDescription>
                You {selling ? "sold" : "bought"} {Market.fmtQty(order.qty, unit)}{" "}
                of {label.toLowerCase()} for {Persona.fmtMoney(order.cash)}.
              </DialogDescription>
            </DialogHeader>
            <Stack gap="sm" className={BODY_CLASS}>
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
                {!selling && (
                  <PropertyList.Row
                    label="Vault"
                    value={Accounts.vaultLocation(order.vault)}
                  />
                )}
                <PropertyList.Row
                  label="New USD balance"
                  value={
                    <span className="font-medium text-foreground">
                      {Persona.fmtMoney(order.nextFiat)}
                    </span>
                  }
                />
              </PropertyList>
              {selling && (
                <p className="text-sm leading-relaxed text-muted-foreground">
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
