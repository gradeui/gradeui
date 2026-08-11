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
 *   buy  — wallet (USD source), Amount, then Quantity.
 *   sell — Quantity FIRST with "x available" beneath it, then the
 *          destination wallet, then the Amount it pays out, plus the
 *          product's three-working-days clearing note. The metal is
 *          what you are spending, so it leads.
 *
 * RATES: buy is market +0.9%, sell is market -0.9% (Market.rateFor),
 * which is why the app's sell rate is visibly lower than its buy rate
 * at the same moment. The iOS screenshots are GBP; this demo is USD.
 *
 * FORM, top to bottom (matching the iOS app):
 *   - "Current rate" as a titled Callout showing the DEALING rate,
 *     with "incl. 0.9% fee" beneath it exactly as the app labels it.
 *     No source/date line: in the product the rate updates live, so a
 *     settlement date would read as staleness.
 *   - the funding or destination wallet (USD, live balance);
 *   - LINKED FIELDS: Amount (USD) and Quantity (metal). Typing in
 *     either drives the other through the DEALING rate. The field
 *     being typed in is never reformatted under the caret; only the
 *     derived one is rewritten.
 *   - Amount carries the spend headroom / over-balance warning;
 *     Quantity carries the current metal balance (the iOS app's
 *     "0.0000 g Balance" slot).
 *
 * FEE: 0.9%, the product's real dealing fee, living INSIDE the quoted
 * rate (Market.BUY_FEE). The cash fee is Market.feeOn(amount) =
 * amount * (1 - 1/1.009), a touch under 0.9% of the amount. Review
 * spells it out so the recap is honest about what is being paid.
 *
 * The metal credited is the quantity bought valued at MARKET rate: the
 * fee is Glint's, so it does not land in the customer's wallet. That
 * is why the new balance rises by slightly less than the amount spent.
 *
 * THE RECEIPT IS A SNAPSHOT, not a recomputation (bug, 11 Aug): the
 * done step used to derive its quantity from the live balances, and
 * `valid` re-checks "amount <= fiat" — which is false once the order
 * has already been paid for. Spending $10,000 of $15,210 left $5,210,
 * the check failed, and the receipt read "You bought 0.00 g" even
 * though the balances had moved correctly. An executed order is
 * history: confirm() freezes it into `order` and the receipt renders
 * only from that.
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
  Stack,
  Row,
  Separator,
} from "@gradeui/ui";
import { CheckCircle2, ChevronRight, TrendingUp } from "lucide-react";
import { Persona } from "@/lib/persona";
import { Market, type MetalKey, type TradeDirection } from "@/lib/market";
import { METALS } from "@/components/wordmark";
import { MetalButton } from "@/components/metal-button";
import { accountIdentifiers } from "@/lib/accounts";

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
   *  this — see the note at the top of this file. */
  const [order, setOrder] = React.useState<{
    qty: number;
    cash: number;
    fee: number;
    nextMetal: number;
    nextFiat: number;
  } | null>(null);
  const [fiat, setFiat] = Persona.useBalance("fiat");
  const [metalBal, setMetalBal] = Persona.useBalance(metal);
  const [unit] = Persona.usePreference(
    metal === "gold" ? "unit.gold" : "unit.silver",
  );

  const selling = direction === "sell";
  const label = METAL_LABEL[metal];
  const verb = selling ? "Sell" : "Buy";
  const fiatMeta = Persona.DEFAULT.balances.fiat;
  const metalMeta = Persona.DEFAULT.balances[metal];
  const amount = Number.parseFloat(amountRaw);
  const qtyTyped = Number.parseFloat(qtyRaw);
  const held = Market.toQty(metalBal, metal, unit);
  const heldQty = Market.fmtQty(held, unit);
  const dealRate = Market.rateFor(direction, metal, unit);

  /* Buy is limited by cash, sell by metal. */
  const overBalance = selling
    ? Number.isFinite(qtyTyped) && qtyTyped > held
    : Number.isFinite(amount) && amount > fiat;
  const valid = selling
    ? Number.isFinite(qtyTyped) && qtyTyped > 0 && qtyTyped <= held
    : Number.isFinite(amount) && amount > 0 && amount <= fiat;

  const qty = selling
    ? valid
      ? qtyTyped
      : 0
    : valid
      ? Market.buyQty(amount, metal, unit)
      : 0;
  const cash = selling
    ? valid
      ? Market.sellProceeds(qtyTyped, metal, unit)
      : 0
    : valid
      ? amount
      : 0;
  const fee = valid
    ? selling
      ? Market.sellFee(qtyTyped, metal, unit)
      : Market.buyFee(amount)
    : 0;

  /* Linked fields, both converting at the dealing rate. */
  const onAmount = (v: string) => {
    setAmountRaw(v);
    const n = Number.parseFloat(v);
    setQtyRaw(
      fmtDerived(
        selling ? Market.sellQty(n, metal, unit) : Market.buyQty(n, metal, unit),
        4,
      ),
    );
  };
  const onQty = (v: string) => {
    setQtyRaw(v);
    const n = Number.parseFloat(v);
    setAmountRaw(
      fmtDerived(
        selling
          ? Market.sellProceeds(n, metal, unit)
          : Market.buyCost(n, metal, unit),
        2,
      ),
    );
  };

  const reset = () => {
    setStep("form");
    setAmountRaw("");
    setQtyRaw("");
    setOrder(null);
  };

  const confirm = () => {
    /* Buy: USD falls by the amount, the wallet gains the metal bought
       (amount less the fee: the fee is Glint's).
       Sell: the metal leaves at MARKET value, USD rises by the
       proceeds. Freeze the receipt BEFORE the balances move. */
    const nextMetal = selling
      ? metalBal - Market.toUsd(qtyTyped, metal, unit)
      : metalBal + (amount - fee);
    const nextFiat = selling ? fiat + cash : fiat - amount;
    setOrder({ qty, cash, fee, nextMetal, nextFiat });
    setMetalBal(nextMetal);
    setFiat(nextFiat);
    setStep("done");
  };

  const walletRow = (
    <Row
      justify="between"
      align="center"
      className="min-h-14 rounded-md border border-input px-4 py-2"
    >
      <Stack gap="none" className="min-w-0">
        <span className="truncate text-sm font-medium text-foreground">
          USD{" "}
          <span className="font-normal text-muted-foreground">
            {fiatMeta.account}
          </span>
        </span>
        <span className="truncate text-xs text-muted-foreground">
          {accountIdentifiers("fiat")}
        </span>
      </Stack>
      <span className="shrink-0 text-sm font-medium text-foreground">
        {Persona.fmtMoney(fiat)}
      </span>
    </Row>
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

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {step === "form" && (
          <>
            <DialogHeader>
              <DialogTitle>
                {verb} {label}
              </DialogTitle>
              <DialogDescription>
                {selling
                  ? "A one-time market order into your USD account."
                  : "A one-time market order from your USD account."}
              </DialogDescription>
            </DialogHeader>
            <Stack gap="md">
              <Callout>
                <TrendingUp />
                <CalloutTitle>Current rate</CalloutTitle>
                <CalloutDescription>
                  1 {unit} = {Persona.fmtMoney(dealRate)}
                  <span className="text-muted-foreground">
                    {" "}
                    incl.{" "}
                    {((selling ? Market.SELL_FEE : Market.BUY_FEE) * 100).toFixed(1)}%
                    fee
                  </span>
                </CalloutDescription>
              </Callout>

              {selling ? (
                <>
                  {quantityField}
                  <Field>
                    <FieldLabel>Destination</FieldLabel>
                    {walletRow}
                  </Field>
                  {amountField}
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    It can take up to three working days for funds to clear in
                    your wallet when you sell.
                  </p>
                </>
              ) : (
                <>
                  <Field>
                    <FieldLabel>Wallet</FieldLabel>
                    {walletRow}
                  </Field>
                  {amountField}
                  {quantityField}
                </>
              )}
            </Stack>
            <DialogFooter>
              <Button
                variant="ghost"
                size="lg"
                className="rounded-full"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
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
            <DialogHeader>
              <DialogTitle>Review order</DialogTitle>
              <DialogDescription>
                {selling
                  ? `Sell ${label.toLowerCase()} into ${fiatMeta.account}`
                  : `Buy ${label.toLowerCase()} from ${fiatMeta.account}`}
              </DialogDescription>
            </DialogHeader>
            <Stack gap="md">
              <Stack gap="none">
                <span className="text-3xl font-semibold text-foreground">
                  {selling ? Market.fmtQty(qty, unit) : Persona.fmtMoney(cash)}
                </span>
                <span className="text-sm text-muted-foreground">
                  {selling
                    ? `Pays out about ${Persona.fmtMoney(cash)} at ${Persona.fmtMoney(dealRate)}/${unit}.`
                    : `About ${Market.fmtQty(qty, unit)} at ${Persona.fmtMoney(dealRate)}/${unit}.`}{" "}
                  The order will execute at the next available price.
                </span>
              </Stack>
              <Separator />
              <Stack gap="sm">
                <Row justify="between">
                  <span className="text-sm text-muted-foreground">From</span>
                  <span className="text-sm font-medium text-foreground">
                    {selling ? metalMeta.account : `USD · ${fiatMeta.account}`}
                  </span>
                </Row>
                <Row justify="between">
                  <span className="text-sm text-muted-foreground">To</span>
                  <span className="text-sm font-medium text-foreground">
                    {selling ? `USD · ${fiatMeta.account}` : metalMeta.account}
                  </span>
                </Row>
                <Row justify="between">
                  <span className="text-sm text-muted-foreground">
                    Fee (
                    {((selling ? Market.SELL_FEE : Market.BUY_FEE) * 100).toFixed(1)}
                    %, included)
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {Persona.fmtMoney(fee)}
                  </span>
                </Row>
              </Stack>
              <p className="text-sm leading-relaxed text-muted-foreground">
                By clicking &ldquo;{verb} {label}&rdquo;, you authorise Glint to
                execute the market order detailed above.
              </p>
            </Stack>
            <DialogFooter>
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
            <DialogHeader>
              <DialogTitle>
                <Row gap="sm" align="center">
                  <CheckCircle2 className="size-5 text-success" />
                  Order complete
                </Row>
              </DialogTitle>
              <DialogDescription>
                You {selling ? "sold" : "bought"}{" "}
                {Market.fmtQty(order.qty, unit)} of {label.toLowerCase()} for{" "}
                {Persona.fmtMoney(order.cash)}.
              </DialogDescription>
            </DialogHeader>
            <Stack gap="sm">
              <Row justify="between">
                <span className="text-sm text-muted-foreground">
                  New {label} balance
                </span>
                <span className="text-sm font-medium text-foreground">
                  {Persona.fmtMoney(order.nextMetal)} ·{" "}
                  {Market.fmtQty(Market.toQty(order.nextMetal, metal, unit), unit)}
                </span>
              </Row>
              <Row justify="between">
                <span className="text-sm text-muted-foreground">
                  New USD balance
                </span>
                <span className="text-sm font-medium text-foreground">
                  {Persona.fmtMoney(order.nextFiat)}
                </span>
              </Row>
              {selling && (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Funds can take up to three working days to clear.
                </p>
              )}
            </Stack>
            <DialogFooter>
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
