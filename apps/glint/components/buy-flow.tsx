"use client";

/**
 * Glint buy flow, ported from the Studio shared component "BuyFlow"
 * (cmsodiwy5iqcn8): the Buy Gold / Buy Silver modal, carrying the real
 * Glint iOS app's information order. One component, parametrized by
 * metal; wrap the trigger button:
 *
 *   <BuyFlow metal="gold">
 *     <Button ...>Buy Gold</Button>
 *   </BuyFlow>
 *
 * FORM, top to bottom (matching the iOS app):
 *   - "Current rate" as a titled Callout showing the DEALING rate,
 *     with "incl. 0.9% fee" beneath it exactly as the app labels it.
 *     No source/date line: in the product the rate updates live, so a
 *     settlement date would read as staleness.
 *   - the funding wallet (USD, live balance);
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
import { Market, type MetalKey } from "@/lib/market";
import { METALS } from "@/components/wordmark";

const METAL_LABEL: Record<MetalKey, string> = {
  gold: "Gold",
  silver: "Silver",
};

function metalButtonStyle(metal: MetalKey): React.CSSProperties {
  const ladder = METALS[metal];
  return {
    background: `linear-gradient(180deg, oklch(${ladder[metal === "gold" ? 600 : 500]}) 0%, oklch(${ladder[metal === "gold" ? 800 : 700]}) 100%)`,
    color: `oklch(${ladder[50]})`,
    borderColor: `oklch(${ladder[metal === "gold" ? 500 : 400]} / 0.45)`,
  };
}

/** Derived-field formatting: money to 2dp, metal to 4dp (the iOS app
 *  shows 4dp grams). Empty in, empty out, so clearing one field clears
 *  the other. */
function fmtDerived(n: number, places: number): string {
  if (!Number.isFinite(n) || n <= 0) return "";
  return n.toFixed(places);
}

export function BuyFlow({
  metal = "gold",
  children,
}: {
  metal?: MetalKey;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [step, setStep] = React.useState<"form" | "review" | "done">("form");
  const [amountRaw, setAmountRaw] = React.useState("");
  const [qtyRaw, setQtyRaw] = React.useState("");
  const [fiat, setFiat] = Persona.useBalance("fiat");
  const [metalBal, setMetalBal] = Persona.useBalance(metal);
  const [unit] = Persona.usePreference(
    metal === "gold" ? "unit.gold" : "unit.silver",
  );

  const label = METAL_LABEL[metal];
  const fiatMeta = Persona.DEFAULT.balances.fiat;
  const metalMeta = Persona.DEFAULT.balances[metal];
  const amount = Number.parseFloat(amountRaw);
  const overBalance = Number.isFinite(amount) && amount > fiat;
  const valid = Number.isFinite(amount) && amount > 0 && amount <= fiat;
  const dealRate = Market.buyRate(metal, unit);
  const qty = valid ? Market.buyQty(amount, metal, unit) : 0;
  const fee = valid ? Market.feeOn(amount) : 0;
  /* What the wallet gains: the metal bought, valued at market. */
  const credited = valid ? amount - fee : 0;
  const heldQty = Market.fmtQty(Market.toQty(metalBal, metal, unit), unit);

  /* Linked fields, both converting at the dealing rate. */
  const onAmount = (v: string) => {
    setAmountRaw(v);
    setQtyRaw(fmtDerived(Market.buyQty(Number.parseFloat(v), metal, unit), 4));
  };
  const onQty = (v: string) => {
    setQtyRaw(v);
    setAmountRaw(fmtDerived(Market.buyCost(Number.parseFloat(v), metal, unit), 2));
  };

  const reset = () => {
    setStep("form");
    setAmountRaw("");
    setQtyRaw("");
  };

  const confirm = () => {
    /* USD falls by the full amount; the wallet gains the metal bought
       (amount less the fee), both reactive so every subscribed balance
       card follows immediately. */
    setFiat(fiat - amount);
    setMetalBal(metalBal + credited);
    setStep("done");
  };

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
              <DialogTitle>Buy {label}</DialogTitle>
              <DialogDescription>
                A one-time market order from your USD account.
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
                    incl. {(Market.BUY_FEE * 100).toFixed(1)}% fee
                  </span>
                </CalloutDescription>
              </Callout>

              <Field>
                <FieldLabel>Wallet</FieldLabel>
                <Row
                  justify="between"
                  align="center"
                  className="h-11 rounded-md border border-input px-4"
                >
                  <span className="text-sm font-medium text-foreground">
                    USD{" "}
                    <span className="font-normal text-muted-foreground">
                      {fiatMeta.account}
                    </span>
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {Persona.fmtMoney(fiat)}
                  </span>
                </Row>
              </Field>

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
                  {overBalance
                    ? "That is more than your USD balance."
                    : `Up to ${Persona.fmtMoney(fiat)} available`}
                </FieldDescription>
              </Field>

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
                  {heldQty} balance
                </FieldDescription>
              </Field>
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
                Buy {label.toLowerCase()} from {fiatMeta.account}
              </DialogDescription>
            </DialogHeader>
            <Stack gap="md">
              <Stack gap="none">
                <span className="text-3xl font-semibold text-foreground">
                  {Persona.fmtMoney(amount)}
                </span>
                <span className="text-sm text-muted-foreground">
                  About {Market.fmtQty(qty, unit)} at {Persona.fmtMoney(dealRate)}/{unit}.
                  The order will execute at the next available price.
                </span>
              </Stack>
              <Separator />
              <Stack gap="sm">
                <Row justify="between">
                  <span className="text-sm text-muted-foreground">From</span>
                  <span className="text-sm font-medium text-foreground">
                    USD · {fiatMeta.account}
                  </span>
                </Row>
                <Row justify="between">
                  <span className="text-sm text-muted-foreground">To</span>
                  <span className="text-sm font-medium text-foreground">
                    {metalMeta.account}
                  </span>
                </Row>
                <Row justify="between">
                  <span className="text-sm text-muted-foreground">
                    Fee ({(Market.BUY_FEE * 100).toFixed(1)}%, included)
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {Persona.fmtMoney(fee)}
                  </span>
                </Row>
              </Stack>
              <p className="text-sm leading-relaxed text-muted-foreground">
                By clicking &ldquo;Buy {label}&rdquo;, you authorise Glint to
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
              <Button
                size="lg"
                className="rounded-full border"
                style={metalButtonStyle(metal)}
                onClick={confirm}
              >
                Buy {label}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "done" && (
          <>
            <DialogHeader>
              <DialogTitle>
                <Row gap="sm" align="center">
                  <CheckCircle2 className="size-5 text-success" />
                  Order complete
                </Row>
              </DialogTitle>
              <DialogDescription>
                You bought {Market.fmtQty(qty, unit)} of {label.toLowerCase()}.
              </DialogDescription>
            </DialogHeader>
            <Stack gap="sm">
              <Row justify="between">
                <span className="text-sm text-muted-foreground">
                  New {label} balance
                </span>
                <span className="text-sm font-medium text-foreground">
                  {Persona.fmtMoney(metalBal)} ·{" "}
                  {Market.fmtQty(Market.toQty(metalBal, metal, unit), unit)}
                </span>
              </Row>
              <Row justify="between">
                <span className="text-sm text-muted-foreground">
                  New USD balance
                </span>
                <span className="text-sm font-medium text-foreground">
                  {Persona.fmtMoney(fiat)}
                </span>
              </Row>
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
