"use client";

// TradeFlowV2 (1 Oct 2026): the Buy / Sell dialog for the Glint business
// portal v2. A FORK of TradeFlow, not an edit of it: the live demo
// (glintpay-demo.gradeui.com) is promoted from screens that import
// TradeFlow, so the original stays exactly as it was and only the v2
// screens import this. Wrap the trigger:
//
//   <TradeFlowV2 metal="gold">                  // buy gold
//   <TradeFlowV2 metal="gold" direction="sell"> // sell, gold preselected
//
// TWIN: the Studio shared component "TradeFlowV2" (cmuppmluj1r1r5).
// Editing one does not touch the other. Keep the pair in sync. The
// spellings differ where the modules do: Studio reads metalSolid and
// METALS off Wordmark, this app imports them by name.
//
// THE BUSINESS MODEL (Ali, 1 Oct). A business account has exactly three
// wallets: Gold, Silver and USD. A buy is always paid FROM the USD wallet
// and a sale always pays INTO it. Both are moves between the customer's
// own Glint wallets, so there is no wallet, currency or payment picker and
// no routing or bank detail anywhere in here. The header says which way
// the money goes, on every step.
//
// WHAT CHANGED FROM TradeFlow:
//   - ONE amount field, labelled and left-aligned at the form's size (Ali:
//     "these centralised numbers in the drawer look bloody awful"). The
//     balance sits UNDER it, the converted figure on the same line at the
//     right. Buy is entered in USD. Sell takes USD or grams, switched on
//     the label line, with Sell all for the most that can be sold.
//   - OVER THE BALANCE a buy says so in plain words under the field ("You
//     have $2,159.58 in your USD wallet. This is $657.40 more.") and Review
//     stays disabled. NO deposit action or link (Ali, 1 Oct): depositing
//     happens offline, at the business's own bank.
//   - THE METAL COMES FROM WHERE IT WAS OPENED, for both directions (Ali,
//     1 Oct: "Web sell, we don't need a toggle for gold and silver"). Sell
//     on the Gold wallet sells gold; the header says which. There is no
//     metal choice inside the dialog, so every trigger passes `metal`.
//   - THE VAULT IS A SET OF RADIOS, all on screen (Ali, 1 Oct). Buy shows
//     both vaults, Zurich and Miami, with what the business holds in each.
//     The one its most recent trade in this metal used is tagged Latest
//     and preselected. Sell uses the same radios when more than one vault
//     holds the metal, and names the one vault as text when only one does.
//     Glint has dropped the primary vault: nothing here says default or
//     primary.
//
//   - NO METAL RING ON THE RECEIPT (Ali, 1 Oct: "not sure why we suddenly
//     introduced a gold strip, let's remove it"). On a full-height drawer
//     the old gradient hairline read as a strip down the edge. Success is
//     plain: the header, the sentence, the footer.
//   - A SIDE DRAWER, NOT A CENTRED MODAL (Ali, 1 Oct, from the layout
//     audit): SideDrawer, the one drawer spec the transaction detail
//     shares. From the right, 448 wide from 640 up, the full screen below;
//     the header stays put, the body scrolls, the buttons sit in a footer
//     pinned to the bottom and spaced when they stack on mobile. The
//     panel no longer animates its height: a full-height drawer has none
//     to animate.
//
// UNCHANGED: the rate callout with the 0.9% fee inside the quoted rate;
// the 30 second price hold on Review (QUOTE_WINDOW_MS, a Progress bar
// above the confirm); the receipt as a frozen snapshot of the order; and
// a completed order moving the Persona balances, the vault it touched and
// the live activity, so the wallet cards behind the dialog follow.
import * as React from "react";
import {
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
  RadioGroup,
  RadioCard,
  Badge,
  FieldTitle,
  ToggleGroup,
  ToggleGroupItem,
  Stack,
  Row,
} from "@gradeui/ui";
import { ChevronRight } from "lucide-react";
import { Persona, type ActivityRow } from "@/lib/persona";
import { Accounts, type VaultId } from "@/lib/accounts";
import {
  Market,
  type MetalKey,
  type MetalUnit,
  type TradeDirection,
} from "@/lib/market";
import { Wordmark, METALS, metalSolid } from "@/components/wordmark";
import { SideDrawer } from "@/components/side-drawer";

/** The vaults a purchase can land in (Ali, 1 Oct: "both vaults, Zurich
 *  and Miami"). Ids only: labels are composed through Accounts. */
const VAULT_CHOICES: VaultId[] = ["zurich", "miami"];

const METAL_LABEL: Record<MetalKey, string> = { gold: "Gold", silver: "Silver" };

/** How long a quoted price is held on Review before it refreshes. */
const QUOTE_WINDOW_MS = 30000;
/** Fine enough that the bar drains smoothly rather than in steps. */
const QUOTE_TICK_MS = 250;
/** How far a refresh may move the rate: plus or minus 0.12%. */
const QUOTE_DRIFT = 0.0012;

/* THE G, THEME-AWARE (Ali, 1 Oct: too faint in light mode). The flat
   metal, step 400, on dark surfaces; step 700 on light ones, which clears
   3:1 against white for a graphic (the iOS cards set the G at 700). Both
   are Wordmark's pinned brand ladder, passed in as variables, and one
   class picks between them by mode. A <style> element rather than a
   utility class: Fast Frame's stylesheet is precompiled, so a variant
   class this file invents would not exist in Studio. */
const MARK_CSS =
  ".glint-metal-mark{color:oklch(var(--glint-mark-light))}" +
  ".dark .glint-metal-mark{color:oklch(var(--glint-mark-dark))}";

/** The Glint G in the metal's colour, darker in light mode. */
function MetalMark({ metal }: { metal: MetalKey }) {
  const ladder = METALS[metal];
  return (
    <>
      <style>{MARK_CSS}</style>
      <Wordmark
        lockup="mark"
        tone="current"
        className="glint-metal-mark size-5"
        style={
          {
            "--glint-mark-light": ladder[700],
            "--glint-mark-dark": ladder[400],
          } as React.CSSProperties
        }
      />
    </>
  );
}

/** A figure written back into the field: cents for USD, 4dp for metal.
 *  Empty in, empty out. */
function fmtField(n: number, places: number): string {
  if (!Number.isFinite(n) || n <= 0) return "";
  return n.toFixed(places);
}

export function TradeFlowV2({
  metal = "gold",
  direction = "buy",
  children,
}: {
  metal?: MetalKey;
  direction?: TradeDirection;
  children: React.ReactNode;
}) {
  const selling = direction === "sell";
  const [open, setOpen] = React.useState(false);
  const [step, setStep] = React.useState<"form" | "review" | "done">("form");
  /* What the amount field is entered in: "usd" or "qty". A buy is always
     USD; only a sale offers the switch. */
  const [entry, setEntry] = React.useState<"usd" | "qty">("usd");
  const [raw, setRaw] = React.useState("");
  /* THE ORDER AS REVIEWED, fixed when Review is pressed: the QUANTITY for
     a sale (what you hand over is metal) and the CASH for a buy (what you
     spend is dollars). A price refresh on Review then moves only the other
     side, as TradeFlow does, and can never push a sale over what is held
     or blank the total mid-review. */
  const [locked, setLocked] = React.useState<{ qty: number; cash: number } | null>(
    null,
  );
  /** The executed order, frozen at confirm. The receipt reads only this. */
  const [order, setOrder] = React.useState<{
    metal: MetalKey;
    unit: MetalUnit;
    qty: number;
    cash: number;
    fee: number;
    vault: VaultId;
  } | null>(null);
  const [vaultChoice, setVaultChoice] = React.useState<VaultId | null>(null);

  /* The metal is fixed for the life of the dialog (its trigger passes
     it), so these hooks sit on one store key each and never move. */
  const [fiat, setFiat] = Persona.useBalance("fiat");
  const [metalBal] = Persona.useBalance(metal);
  const [unit] = Persona.usePreference(
    metal === "silver" ? "unit.silver" : "unit.gold",
  );
  const vaults = Persona.useMetalVaults(metal);
  const { add: addActivity } = Persona.useLiveActivity();
  /* This metal's history, live trades first, for the Latest tag. */
  const history = Persona.useActivity(metal);

  const label = METAL_LABEL[metal] ?? metal;
  const verb = selling ? "Sell" : "Buy";
  const feePct = ((selling ? Market.SELL_FEE : Market.BUY_FEE) * 100).toFixed(1);

  /* WHICH VAULT. Buy: where the metal lands, Zurich or Miami. Sell: where
     it comes out of (Ali, 12 Aug), only the vaults that hold this metal.
     LATEST (Ali, 1 Oct) is the vault of the most recent trade in this
     metal among the ones on offer. It is preselected; with no such trade
     the first vault on offer is. */
  const sellRows = vaults.rows;
  const vaultChoices: VaultId[] = selling
    ? sellRows.map((row) => row.vault)
    : VAULT_CHOICES;
  let latestRow: ActivityRow | null = null;
  for (const row of history) {
    if (!row.vault || !vaultChoices.includes(row.vault)) continue;
    if (!latestRow || row.timestamp > latestRow.timestamp) latestRow = row;
  }
  const latestVault: VaultId | undefined = latestRow?.vault ?? undefined;
  const vault: VaultId | undefined =
    vaultChoice ?? latestVault ?? vaultChoices[0];
  const vaultName = vault ? Accounts.vaultLabel(vault) : "";
  /* Radios only when there is a choice to make. */
  const showVaultField = vaultChoices.length > 1;
  const vaultUsd = sellRows.find((row) => row.vault === vault)?.amount ?? 0;
  /** The most that can be sold: the chosen vault's holding. */
  const held = Market.toQty(selling ? vaultUsd : metalBal, metal, unit);

  /* The settled dealing rate and the live quote everything converts at.
     Seeded from the settled rate so server and client agree on the first
     render; the only randomness is the refresh, after mount. */
  const baseRate = Market.rateFor(direction, metal, unit);
  const [quote, setQuote] = React.useState(baseRate);
  const [quoteMsLeft, setQuoteMsLeft] = React.useState(QUOTE_WINDOW_MS);
  const [quoteWindow, setQuoteWindow] = React.useState(0);

  React.useEffect(() => {
    setQuote(baseRate);
    setQuoteMsLeft(QUOTE_WINDOW_MS);
  }, [baseRate]);

  /* ONE FIELD, TWO READINGS. The typed figure is either dollars or metal,
     and the other side comes through the quote. */
  const typed = Number.parseFloat(raw);
  const hasAmount = Number.isFinite(typed) && typed > 0;
  const inQty = selling && entry === "qty";
  const qtyWanted = !hasAmount ? 0 : inQty ? typed : typed / quote;
  const cashWanted = !hasAmount ? 0 : inQty ? typed * quote : typed;
  /* ROUNDING SLACK. The field holds cents or 4dp metal, so Sell all can
     land a hair over the exact holding, and a balance moved by earlier
     orders can sit a hair under its displayed cents. Within the slack it
     IS the balance. */
  const slackQty = inQty ? 0.0001 : 0.01 / quote;
  const overBalance = selling
    ? hasAmount && qtyWanted > held + slackQty
    : hasAmount && cashWanted > fiat + 0.005;
  const formValid = hasAmount && !overBalance;
  const shortfall = !selling && overBalance ? cashWanted - fiat : 0;
  /* A sale within the slack of the holding sells exactly the holding, so
     Sell all in dollars leaves no dust behind. */
  const sellsAll =
    selling && hasAmount && Math.abs(qtyWanted - held) <= slackQty;
  const formQty = !formValid ? 0 : sellsAll ? held : qtyWanted;
  const formCash = !formValid ? 0 : sellsAll ? held * quote : cashWanted;
  const reviewing = step === "review" && locked;
  const valid = reviewing ? true : formValid;
  const qty = reviewing
    ? selling
      ? locked.qty
      : locked.cash / quote
    : formQty;
  const cash = reviewing
    ? selling
      ? locked.qty * quote
      : locked.cash
    : formCash;
  /* The fee lives inside the quoted rate. A buy's fee is a share of the
     cash; a sale's is charged on the gross, so it follows the quote. */
  const fee = !valid
    ? 0
    : selling
      ? (cash * Market.SELL_FEE) / (1 - Market.SELL_FEE)
      : Market.buyFee(cash);
  /** The other side of the typed figure, shown under the field. */
  const converted = !hasAmount
    ? null
    : inQty
      ? Persona.fmtMoney(sellsAll ? formCash : cashWanted)
      : Market.fmtQty(sellsAll ? formQty : qtyWanted, unit);

  /* THE COUNTDOWN: a deadline, not a tally of ticks, so a throttled
     background tab still holds the price for 30 seconds and no longer. It
     runs only while an unplaced order is on Review. */
  React.useEffect(() => {
    if (step !== "review" || order) return;
    const endsAt = Date.now() + QUOTE_WINDOW_MS;
    setQuoteMsLeft(QUOTE_WINDOW_MS);
    const id = window.setInterval(() => {
      setQuoteMsLeft(Math.max(0, endsAt - Date.now()));
    }, QUOTE_TICK_MS);
    return () => window.clearInterval(id);
  }, [step, order, quoteWindow]);

  /* THE REFRESH, jittered off the settled rate so a dialog left open does
     not random-walk away from the market. One field means nothing needs
     rewriting: the converted side is computed from the quote. */
  React.useEffect(() => {
    if (quoteMsLeft > 0 || step !== "review" || order) return;
    setQuote(baseRate * (1 + (Math.random() * 2 - 1) * QUOTE_DRIFT));
    setQuoteWindow((n) => n + 1);
  }, [quoteMsLeft, step, order, baseRate]);

  const reset = () => {
    setStep("form");
    setRaw("");
    setLocked(null);
    setOrder(null);
    setVaultChoice(null);
    setEntry("usd");
    setQuote(baseRate);
    setQuoteMsLeft(QUOTE_WINDOW_MS);
  };

  /* Switching what the field is in keeps the order the same size: the
     figure is rewritten in the new unit. */
  const switchEntry = (value: string) => {
    const next = value as "usd" | "qty";
    if (!next || next === entry) return;
    setRaw(next === "qty" ? fmtField(qtyWanted, 4) : fmtField(cashWanted, 2));
    setEntry(next);
  };

  const sellAll = () =>
    setRaw(inQty ? held.toFixed(4) : (held * quote).toFixed(2));

  const confirm = () => {
    /* A valid order always has a vault: a buy starts on one, and a sale
       is only valid when some vault holds the metal. */
    if (!vault) return;
    /* The metal moves at MARKET value (the fee is Glint's and never lands
       in a wallet); the USD wallet moves by the cash. Rounded to cents so
       the balance stays a figure that looks like money. Freeze the receipt
       BEFORE the balances move. */
    const moved = Market.toUsd(qty, metal, unit);
    const nextFiat = Math.max(
      0,
      Math.round((selling ? fiat + cash : fiat - cash) * 100) / 100,
    );
    setOrder({ metal, unit, qty, cash, fee, vault });
    vaults.credit(vault, selling ? -moved : moved);
    setFiat(nextFiat);
    /* Into the history as a full ActivityRow, with the seeded signs and
       grams at 4dp whatever unit the field was in. */
    const at = Date.now();
    const stamped = new Date(at - new Date(at).getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 19);
    const grams = Math.round(Market.toQty(moved, metal, "g") * 1e4) / 1e4;
    const row: ActivityRow = {
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
      fee: Math.round(fee * 100) / 100,
      reference: `GX-${String(at).slice(-8, -4)}-${String(at).slice(-4)}`,
    };
    addActivity(row);
    setStep("done");
  };

  /* ONE HEADER FOR THE WHOLE FLOW (Ali, 12 Aug), now with the direction
     of the money under the title (Ali, 1 Oct). */
  const header = (
    <SideDrawer.Header
      icon={<MetalMark metal={metal} />}
      title={`${verb} ${label}`}
      description={selling ? "To your USD wallet" : "From your USD wallet"}
    />
  );

  const rateCallout = (
    <Callout>
      <CalloutTitle>Current rate</CalloutTitle>
      <CalloutDescription>
        1 {unit} = {Persona.fmtMoney(quote)}
        <span className="text-muted-foreground"> incl. {feePct}% fee</span>
      </CalloutDescription>
    </Callout>
  );

  /* THE VAULT RADIOS: every vault on screen as a whole-card choice, the
     place and what is held there on one line ("Zurich · 17.1054 g"), and
     the Latest tag where it applies. A vault holding none of this metal
     shows its place alone. */
  const vaultTitle = selling ? "Sell from" : "Vault";
  const vaultField = (
    <Stack gap="sm">
      <FieldTitle>{vaultTitle}</FieldTitle>
      <RadioGroup
        value={vault}
        onValueChange={(v) => v && setVaultChoice(v as VaultId)}
        aria-label={vaultTitle}
        className="grid gap-2"
      >
        {vaultChoices.map((id) => {
          const usd = sellRows.find((row) => row.vault === id)?.amount ?? 0;
          return (
            <RadioCard
              key={id}
              value={id}
              indicatorPosition="leading"
              label={
                usd > 0
                  ? `${Accounts.vaultLabel(id)} · ${Market.fmtQty(
                      Market.toQty(usd, metal, unit),
                      unit,
                    )}`
                  : Accounts.vaultLabel(id)
              }
              aside={
                id === latestVault ? (
                  <Badge variant="secondary">Latest</Badge>
                ) : null
              }
            />
          );
        })}
      </RadioGroup>
    </Stack>
  );

  /* ONE VAULT, NO CHOICE: a sale from a metal held in a single vault
     names it as text. */
  const vaultText = (
    <Stack gap="xs">
      <FieldTitle>Sell from</FieldTitle>
      <span className="text-sm text-foreground">{vaultName}</span>
    </Stack>
  );

  /* What sits under the field, left: the balance that limits the order.
     A sale names the vault when there is a choice of vault. */
  const heldQty = Market.fmtQty(held, unit);
  const heldWhere = showVaultField
    ? `in ${vaultName}`
    : overBalance
      ? "you hold"
      : "held";
  const balanceLine = !selling
    ? overBalance
      ? `You have ${Persona.fmtMoney(fiat)} in your USD wallet. This is ${Persona.fmtMoney(shortfall)} more.`
      : `${Persona.fmtMoney(fiat)} in your USD wallet`
    : overBalance
      ? `More than the ${heldQty} ${heldWhere}`
      : `${heldQty} ${heldWhere}`;

  const amountField = (
    <Field data-invalid={overBalance || undefined}>
      {selling ? (
        <Row justify="between" align="center" gap="sm">
          <FieldLabel>Amount</FieldLabel>
          <ToggleGroup
            type="single"
            variant="segmented"
            size="xs"
            value={entry}
            onValueChange={switchEntry}
            aria-label="Amount in"
          >
            <ToggleGroupItem value="usd" className="min-w-12">
              USD
            </ToggleGroupItem>
            <ToggleGroupItem value="qty" className="min-w-12">
              {unit}
            </ToggleGroupItem>
          </ToggleGroup>
        </Row>
      ) : (
        <FieldLabel>Amount</FieldLabel>
      )}
      <InputGroup size="lg">
        {inQty ? null : (
          <InputGroupAddon align="inline-start">
            <InputGroupText>$</InputGroupText>
          </InputGroupAddon>
        )}
        <InputGroupInput
          placeholder={inQty ? "0.0000" : "0.00"}
          inputMode="decimal"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          aria-invalid={overBalance || undefined}
        />
        {inQty || (selling && held > 0) ? (
          <InputGroupAddon align="inline-end">
            {inQty ? <InputGroupText>{unit}</InputGroupText> : null}
            {selling && held > 0 ? (
              /* Secondary at the addon's own size (Ali, 12 Aug): a
                 convenience, quieter than the Sell button. */
              <InputGroupButton variant="secondary" onClick={sellAll}>
                Sell all
              </InputGroupButton>
            ) : null}
          </InputGroupAddon>
        ) : null}
      </InputGroup>
      <Row justify="between" align="baseline" gap="sm">
        <FieldDescription>{balanceLine}</FieldDescription>
        {converted ? (
          <span className="text-sm tabular-nums text-muted-foreground">
            {converted}
          </span>
        ) : null}
      </Row>
    </Field>
  );


  const quoteTimer = (
    <Stack gap="xs">
      <Row justify="between" align="center">
        <span className="text-xs text-muted-foreground">Rate held for</span>
        <span className="text-xs font-medium text-foreground">
          {Math.ceil(quoteMsLeft / 1000)}s
        </span>
      </Row>
      <Progress
        value={(quoteMsLeft / QUOTE_WINDOW_MS) * 100}
        tone="accent"
        className="h-1"
        aria-label="Time left on this rate"
      />
    </Stack>
  );

  return (
    <SideDrawer
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        /* Reset on OPEN, not close, so every entry starts at the form and
           the receipt never blanks while the panel animates out. */
        if (o) reset();
      }}
      trigger={children}
    >
        {step === "form" && (
          <>
            {header}
            <SideDrawer.Body>
            <Stack gap="md" className="flex-1">
              {rateCallout}
              {selling ? (
                <>
                  {showVaultField ? vaultField : vault ? vaultText : null}
                  {amountField}
                </>
              ) : (
                <>
                  {amountField}
                  {vaultField}
                </>
              )}
            </Stack>
            </SideDrawer.Body>
            <SideDrawer.Footer>
              <Button
                size="lg"
                className="h-12"
                disabled={!valid}
                onClick={() => {
                  setLocked({ qty: formQty, cash: formCash });
                  setStep("review");
                }}
              >
                Review
                <ChevronRight className="size-4" />
              </Button>
            </SideDrawer.Footer>
          </>
        )}

        {step === "review" && (
          <>
            {header}
            <SideDrawer.Body>
            <Stack gap="md" className="flex-1">
              <span className="text-base font-medium text-foreground">
                Review order
              </span>
              <PropertyList labelWidth="8.5rem">
                <PropertyList.Row
                  label={selling ? "Chosen quantity" : "Chosen amount"}
                >
                  <span className="font-medium text-foreground">
                    {selling ? Market.fmtQty(qty, unit) : Persona.fmtMoney(cash)}
                  </span>{" "}
                  <span className="text-muted-foreground">
                    {`(${selling ? Persona.fmtMoney(cash) : Market.fmtQty(qty, unit)})`}
                  </span>
                </PropertyList.Row>
                <PropertyList.Row
                  className="-mt-1.5"
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
            </SideDrawer.Body>
            <SideDrawer.Footer>
              {/* Secondary, as the Web DS Sheet's second action: a full-width
                  ghost read as an empty bar. */}
              <Button
                variant="secondary"
                size="lg"
                className="h-12"
                onClick={() => setStep("form")}
              >
                Back
              </Button>
              {/* The DS primary, as every Web DS drawer action is. */}
              <Button size="lg" className="h-12" onClick={confirm}>
                {verb} {label}
              </Button>
            </SideDrawer.Footer>
          </>
        )}

        {step === "done" && order && (
          <>
            {header}
            <SideDrawer.Body>
            <Stack gap="md" className="flex-1">
              {/* The headline is a paragraph, not a second description:
                  the header already owns that slot. */}
              <p className="text-lg leading-snug text-muted-foreground">
                You {selling ? "sold" : "bought"}{" "}
                <span className="font-medium text-foreground">
                  {Market.fmtQty(order.qty, order.unit)}
                </span>{" "}
                of{" "}
                <span
                  className="font-medium"
                  style={{ color: metalSolid(order.metal) }}
                >
                  {METAL_LABEL[order.metal]}
                </span>{" "}
                {selling && order.vault ? (
                  <>
                    from{" "}
                    <span className="font-medium text-foreground">
                      {Accounts.vaultLabel(order.vault)}
                    </span>{" "}
                  </>
                ) : null}
                for{" "}
                <span className="font-medium text-foreground">
                  {Persona.fmtMoney(order.cash)}
                </span>
                {selling ? (
                  <>, paid into your USD wallet.</>
                ) : order.vault ? (
                  <>
                    . It will be vaulted in{" "}
                    <span className="font-medium text-foreground">
                      {Accounts.vaultLabel(order.vault)}
                    </span>
                    .
                  </>
                ) : (
                  "."
                )}
              </p>
              {selling && (
                <p className="mt-auto text-sm leading-relaxed text-muted-foreground">
                  Funds can take up to three working days to clear.
                </p>
              )}
            </Stack>
            </SideDrawer.Body>
            <SideDrawer.Footer>
              <Button
                size="lg"
                className="h-12"
                onClick={() => setOpen(false)}
              >
                Done
              </Button>
            </SideDrawer.Footer>
          </>
        )}
    </SideDrawer>
  );
}
