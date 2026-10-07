// @ts-nocheck: a MECHANICAL twin (7 Oct 2026). The body is the Studio
// JSX byte for byte; only the imports and the export line are rewritten
// (scripts/mechanical-twin.py), so the pair cannot drift by
// hand-porting.
"use client";

// TradeFlowV2 (1 Oct 2026, rebuilt 7 Oct): Buy and Sell for the Glint
// business portal v2 on staging, as "Glint - Web Portal - Full New" draws
// them on the Buy and Sell pages, state by state. One component both ways:
// Buy pays from the USD wallet into a vault, Sell pays a vault's metal
// back into the USD wallet. Wrap any trigger:
//
//   <TradeFlowV2 metal="gold"><Button>Buy Gold</Button></TradeFlowV2>
//   <TradeFlowV2 metal="silver" direction="sell"><Button>Sell</Button></TradeFlowV2>
//
// TWIN: the Studio shared component "TradeFlowV2" (cmuppmluj1r1r5). Editing one does
// not touch the other. Keep the pair in sync.
//
// THE DRAWER is SideDrawer (the Web DS Sheet, 384). The header is the
// metal's G (28, gold-accent or silver-accent) and "Buy Gold" / "Sell
// Silver" in Raleway Bold 24/32.
//
// BUY (Buy Gold · Amount · Default, Over balance; Review · 30s hold, Price
// refreshed; Success):
//   - Vault: Web DS OptionRows (the same radio row Auto-buy uses), one per
//     vault, "X g held here" under the name, "Latest" on the vault of the
//     most recent trade in this metal, which is preselected.
//   - Amount: Web DS FormField, the default Input with a "USD" suffix,
//     "$X in your USD wallet" under it. Over the balance the field turns
//     destructive and says "$X more than your USD wallet holds, with the
//     0.9% fee." and Review is disabled.
//   - The order on a muted panel: Gold (the grams), Rate, Fee 0.9%, a rule,
//     Total. Review (xl) in the footer.
//   - Review order: Vault, Amount, You get, Rate, Fee 0.9%, rule, Total;
//     the footer holds "Rate held for" with the seconds and a Progress,
//     Back (secondary) and Buy Gold (primary), and "By clicking “Buy
//     Gold”, you authorise Glint to execute the market order detailed
//     above." When the 30 seconds run out the rate refreshes and an info
//     Alert says "Rate refreshed / Gold is now 1 g = $X. Check the order
//     before you buy."
//   - Success: "9.4940 g added", then You paid, Rate, Fee 0.9%, Vault, and
//     Done.
// SELL (Sell Silver · Amount · Default; Sell Gold · Vault · Choose; Review
// · 30s hold; Success):
//   - Sell from: the vault as plain text when one vault holds the metal,
//     the radio rows when several do.
//   - Amount: "USD | g" (Web DS segmented, sm) beside the label, the lg
//     Input with the unit as suffix and Sell all (secondary, lg) beside
//     it, and "X g held" (one vault) or "X g in Zurich" (several) under.
//   - The order: Value, rule, Rate, Fee 0.9%, rule, Total.
//   - Review order: Vault, rule, Amount, Value, rule, Rate, Fee 0.9%,
//     rule, Total; "By clicking “Sell Silver”, ..." and "It can take up to
//     three working days for funds to clear in your wallet when you
//     sell."; the rate hold, Back (ghost) and Sell Silver.
//   - Success: "$X added to your USD wallet", then You sold, Vault, Rate,
//     Fee 0.9%; "Funds can take up to three working days to clear."; View
//     in Activity (outline) and Done.
//
// THE MATHS (Ali, 1 Oct: "Keep 0.9%"): the rate is the market rate, the
// fee is 0.9% shown on its own line. Buy: You get = amount / rate, Total
// = amount + fee. Sell: Value = quantity x rate, Total = value - fee.
// ASSUMPTION: Figma's Amount slides total $1,000.00 beside a $9.00 fee
// while its Review totals $1,009.00 for the same order; the Amount panel
// here totals the same way Review does, so the two never disagree. Its
// sample figures (28.4819 g for $1,000, $154.92 for 100 g) do not
// reconcile either; every figure here is computed from Market.
//
// RATES: "1 g = $105.33" (2 places) for gold, "1 g = $1.5633" (4 places)
// for silver, as the slides write them; ounces read "1 oz = $X".
//
// ASSUMPTIONS, NOT IN FIGMA:
//   - the Default slide's amount field shows a search icon, a leftover of
//     the FormField's default prefix (the Over balance slide has none); it
//     is left out;
//   - the 30s hold slide repeats the authorise line in the body and the
//     footer; it is shown once, under the buttons, as Price refreshed has
//     it;
//   - a sale above the holding has no slide: the field turns destructive,
//     "That’s more than you hold in Zurich." and Review is disabled.
//
// A DEMO: no money moves. Confirming moves the persona's balances for the
// tab and adds an activity row, so the cards and lists update.
import * as React from "react";
import { Persona } from "@/lib/persona";
import { Market } from "@/lib/market";
import { VaultsV2 } from "@/lib/vaults-v2";
import { Wordmark } from "@/components/wordmark";
import { SideDrawer } from "@/components/side-drawer";
import { WebDsV2 } from "@/components/web-ds-v2";

const METAL_LABEL = { gold: "Gold", silver: "Silver" };
const FEE = 0.009;
const FEE_LABEL = "Fee 0.9%";
const QUOTE_WINDOW_MS = 30000;
const QUOTE_TICK_MS = 250;
const QUOTE_DRIFT = 0.0012;

function money(n) {
  return Persona.fmtMoney(n);
}
function qtyText(n, unit) {
  return Market.fmtQty(n, unit);
}
function rateText(rate, metal, unit) {
  const places = unit === "g" && metal === "silver" ? 4 : 2;
  return `1 ${unit} = $${rate.toLocaleString("en-US", { minimumFractionDigits: places, maximumFractionDigits: places })}`;
}
function fieldText(n, places) {
  if (!Number.isFinite(n) || n <= 0) return "";
  return n.toFixed(places);
}

function Mark({ metal }) {
  return (
    <Wordmark lockup="mark" tone="current" className="size-7" style={{ color: `var(--wds-${metal}-accent)` }} />
  );
}

/** "Rate held for 15s" over a Progress, in the footer while reviewing. */
function RateHold({ msLeft }) {
  const secs = Math.ceil(msLeft / 1000);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2 text-sm leading-5">
        <span className="text-[color:var(--wds-muted-foreground)]">Rate held for</span>
        <span className="font-medium text-[color:var(--wds-foreground)]">{secs}s</span>
      </div>
      <WebDsV2.Progress value={(msLeft / QUOTE_WINDOW_MS) * 100} />
    </div>
  );
}

function TradeFlowV2({ metal = "gold", direction = "buy", children }) {
  const selling = direction === "sell";
  const label = METAL_LABEL[metal] ?? metal;
  const verb = selling ? "Sell" : "Buy";
  const title = `${verb} ${label}`;

  const [open, setOpen] = React.useState(false);
  const [step, setStep] = React.useState("form");
  /* A sale can be entered in metal or dollars; a buy is dollars. The
     Figma Sell slides open on the metal ("g"). */
  const [entry, setEntry] = React.useState(selling ? "qty" : "usd");
  const [raw, setRaw] = React.useState(selling ? "" : "1000.00");
  const [vaultChoice, setVaultChoice] = React.useState(null);
  const [locked, setLocked] = React.useState(null);
  const [order, setOrder] = React.useState(null);
  const [refreshed, setRefreshed] = React.useState(false);

  const [fiat, setFiat] = Persona.useBalance("fiat");
  const [unit] = Persona.usePreference(metal === "silver" ? "unit.silver" : "unit.gold");
  const vaults = VaultsV2.useMetalVaults(metal);
  const { add: addActivity } = Persona.useLiveActivity();
  const history = Persona.useActivity(metal);

  /* The vaults on offer: every vault for a buy, the ones holding this
     metal for a sale. Latest is the vault of the most recent trade in this
     metal among them, preselected. */
  const held = (v) => vaults.rows.find((row) => row.vault === v)?.amount ?? 0;
  const choices = selling ? vaults.rows.filter((r) => r.amount > 0).map((r) => r.vault) : VaultsV2.IDS;
  let latestRow = null;
  for (const row of history) {
    const v = VaultsV2.id(row.vault);
    if (!v || !choices.includes(v)) continue;
    if (!latestRow || row.timestamp > latestRow.timestamp) latestRow = row;
  }
  const latest = latestRow ? VaultsV2.id(latestRow.vault) : undefined;
  const vault = vaultChoice ?? latest ?? choices[0];
  const heldQty = (v) => Market.toQty(held(v), metal, unit);

  /* The quote: the market rate, held for 30 s on Review, then refreshed
     with a little drift. */
  const base = Market.marketRate(metal, unit);
  const [quote, setQuote] = React.useState(base);
  const [msLeft, setMsLeft] = React.useState(QUOTE_WINDOW_MS);
  const [round, setRound] = React.useState(0);

  const typed = Number.parseFloat(raw.replace(/,/g, ""));
  const has = Number.isFinite(typed) && typed > 0;
  const inQty = selling && entry === "qty";
  const fromLock = step !== "form" && locked;
  /* Buy: the dollars spent before the fee. Sell: the metal sold. */
  const amount = fromLock ? locked.amount : !has ? 0 : selling ? (inQty ? typed : typed / quote) : typed;
  const qty = selling ? amount : amount / quote;
  const value = selling ? amount * quote : amount;
  const fee = value * FEE;
  const total = selling ? value - fee : value + fee;
  const holdingQty = selling ? heldQty(vault) : 0;
  const over = !fromLock && has && (selling ? qty > holdingQty + 0.00005 : total > fiat + 0.005);
  const valid = has && !over;

  React.useEffect(() => {
    if (step !== "review" || order) return;
    const ends = Date.now() + QUOTE_WINDOW_MS;
    setMsLeft(QUOTE_WINDOW_MS);
    const id = window.setInterval(() => setMsLeft(Math.max(0, ends - Date.now())), QUOTE_TICK_MS);
    return () => window.clearInterval(id);
  }, [step, order, round]);

  React.useEffect(() => {
    if (msLeft > 0 || step !== "review" || order) return;
    setQuote(base * (1 + (Math.random() * 2 - 1) * QUOTE_DRIFT));
    setRefreshed(true);
    setRound((n) => n + 1);
  }, [msLeft, step, order, base]);

  const reset = () => {
    setStep("form");
    setEntry(selling ? "qty" : "usd");
    setRaw(selling ? "" : "1000.00");
    setVaultChoice(null);
    setLocked(null);
    setOrder(null);
    setRefreshed(false);
    setQuote(base);
    setMsLeft(QUOTE_WINDOW_MS);
  };

  const switchEntry = (next) => {
    if (!next || next === entry) return;
    setRaw(next === "qty" ? fieldText(qty, 4) : fieldText(value, 2));
    setEntry(next);
  };
  const sellAll = () => setRaw(inQty ? holdingQty.toFixed(4) : (holdingQty * quote).toFixed(2));

  const review = () => {
    if (!valid) return;
    setLocked({ amount });
    setRefreshed(false);
    setStep("review");
  };

  const confirm = () => {
    if (!vault) return;
    const moved = Market.toUsd(qty, metal, unit);
    setOrder({ qty, value, fee, total, rate: quote, vault, unit });
    vaults.credit(vault, selling ? -moved : moved);
    setFiat(Math.max(0, Math.round((selling ? fiat + total : fiat - total) * 100) / 100));
    const at = Date.now();
    const stamped = new Date(at - new Date(at).getTimezoneOffset() * 60000).toISOString().slice(0, 19);
    const grams = Math.round(Market.toQty(moved, metal, "g") * 1e4) / 1e4;
    addActivity({
      id: `tx-live-${at}`,
      kind: selling ? "exchange-sell" : "exchange-buy",
      description: selling ? `Exchange ${label} to USD` : `Exchange USD to ${label}`,
      timestamp: stamped,
      metalAmount: selling ? -grams : grams,
      metal,
      fiatAmount: selling ? Math.round(total * 100) / 100 : -Math.round(total * 100) / 100,
      rate: quote,
      type: "exchange",
      status: "completed",
      account: metal,
      counterAccount: "fiat",
      vault,
      method: "market-order",
      fee: Math.round(fee * 100) / 100,
      reference: `GX-${String(at).slice(-8, -4)}-${String(at).slice(-4)}`,
    });
    setStep("done");
  };

  const onOpenChange = (next) => {
    setOpen(next);
    if (!next) reset();
  };

  const vaultRows = (
    <div className="flex flex-col gap-2" role="radiogroup" aria-label={selling ? "Sell from" : "Vault"}>
      {choices.map((v) => (
        <WebDsV2.OptionRow
          key={v}
          selected={v === vault}
          title={VaultsV2.label(v)}
          badge={v === latest ? "Latest" : undefined}
          description={`${qtyText(heldQty(v), unit)} held here`}
          onSelect={() => setVaultChoice(v)}
        />
      ))}
    </div>
  );

  const authorise = (
    <p className="text-sm leading-5 text-[color:var(--wds-muted-foreground)]">
      By clicking “{title}”, you authorise Glint to execute the market order detailed above.
    </p>
  );

  let body;
  let footer;
  if (step === "done" && order) {
    body = (
      <div className="flex flex-col gap-4">
        <h3 className="font-display text-2xl font-bold leading-8 text-[color:var(--wds-foreground)]">
          {selling ? `${money(order.total)} added to your USD wallet` : `${qtyText(order.qty, order.unit)} added`}
        </h3>
        <WebDsV2.Summary>
          {selling ? (
            <>
              <WebDsV2.DescriptionItem label="You sold" value={qtyText(order.qty, order.unit)} />
              <WebDsV2.DescriptionItem label="Vault" value={VaultsV2.label(order.vault)} />
            </>
          ) : (
            <WebDsV2.DescriptionItem label="You paid" value={money(order.total)} />
          )}
          <WebDsV2.DescriptionItem label="Rate" value={rateText(order.rate, metal, order.unit)} />
          <WebDsV2.DescriptionItem label={FEE_LABEL} value={money(order.fee)} />
          {selling ? null : <WebDsV2.DescriptionItem label="Vault" value={VaultsV2.label(order.vault)} />}
        </WebDsV2.Summary>
        {selling ? (
          <p className="text-sm leading-5 text-[color:var(--wds-muted-foreground)]">
            Funds can take up to three working days to clear.
          </p>
        ) : null}
      </div>
    );
    footer = selling ? (
      <div className="flex gap-2">
        <WebDsV2.Button
          variant="outline"
          size="xl"
          className="flex-1"
          data-grade-goto="Activity — history v2"
          onClick={() => onOpenChange(false)}
        >
          View in Activity
        </WebDsV2.Button>
        <WebDsV2.Button size="xl" className="flex-1" onClick={() => onOpenChange(false)}>
          Done
        </WebDsV2.Button>
      </div>
    ) : (
      <WebDsV2.Button size="xl" className="w-full" onClick={() => onOpenChange(false)}>
        Done
      </WebDsV2.Button>
    );
  } else if (step === "review") {
    body = (
      <div className="flex flex-col gap-4">
        {refreshed ? (
          <WebDsV2.Alert title="Rate refreshed">
            {label} is now {rateText(quote, metal, unit)}. Check the order before you {selling ? "sell" : "buy"}.
          </WebDsV2.Alert>
        ) : null}
        <h3 className="text-base font-semibold leading-6 text-[color:var(--wds-foreground)]">Review order</h3>
        <WebDsV2.Summary>
          <WebDsV2.DescriptionItem label="Vault" value={VaultsV2.label(vault)} />
          {selling ? (
            <>
              <WebDsV2.Divider />
              <WebDsV2.DescriptionItem label="Amount" value={qtyText(qty, unit)} />
              <WebDsV2.DescriptionItem label="Value" value={money(value)} />
              <WebDsV2.Divider />
            </>
          ) : (
            <>
              <WebDsV2.DescriptionItem label="Amount" value={money(value)} />
              <WebDsV2.DescriptionItem label="You get" value={qtyText(qty, unit)} />
            </>
          )}
          <WebDsV2.DescriptionItem label="Rate" value={rateText(quote, metal, unit)} />
          <WebDsV2.DescriptionItem label={FEE_LABEL} value={money(fee)} />
          <WebDsV2.Divider />
          <WebDsV2.DescriptionItem label="Total" value={money(total)} emphasis="total" />
        </WebDsV2.Summary>
        {selling ? (
          <>
            {authorise}
            <p className="text-sm leading-5 text-[color:var(--wds-muted-foreground)]">
              It can take up to three working days for funds to clear in your wallet when you sell.
            </p>
          </>
        ) : null}
      </div>
    );
    footer = (
      <div className="flex flex-col gap-4">
        <RateHold msLeft={msLeft} />
        <div className="flex gap-2">
          <WebDsV2.Button
            variant={selling ? "ghost" : "secondary"}
            size="xl"
            className="flex-1"
            onClick={() => {
              setStep("form");
              setLocked(null);
              setRefreshed(false);
            }}
          >
            Back
          </WebDsV2.Button>
          <WebDsV2.Button size="xl" className="flex-1" onClick={confirm}>
            {title}
          </WebDsV2.Button>
        </div>
        {selling ? null : authorise}
      </div>
    );
  } else {
    const cashHelper = `${money(fiat)} in your USD wallet`;
    const shortfall = total - fiat;
    body = (
      <div className="flex flex-col gap-6">
        {selling ? (
          <section className="flex flex-col gap-2">
            <span className="text-sm font-medium leading-5 text-[color:var(--wds-foreground)]">Sell from</span>
            {choices.length > 1 ? (
              vaultRows
            ) : (
              <span className="text-base leading-6 text-[color:var(--wds-foreground)]">
                {vault ? VaultsV2.label(vault) : ""}
              </span>
            )}
          </section>
        ) : (
          <section className="flex flex-col gap-2">
            <span className="text-sm font-medium leading-5 text-[color:var(--wds-foreground)]">Vault</span>
            {vaultRows}
          </section>
        )}

        {selling ? (
          <WebDsV2.Field
            label="Amount"
            htmlFor="trade-amount"
            gap={2}
            aside={
              <WebDsV2.Segmented
                aria-label="Amount in"
                value={entry}
                onValueChange={switchEntry}
                options={[
                  { value: "usd", label: "USD" },
                  { value: "qty", label: unit },
                ]}
              />
            }
            helper={
              over
                ? null
                : choices.length > 1
                  ? `${qtyText(holdingQty, unit)} in ${VaultsV2.label(vault)}`
                  : `${qtyText(holdingQty, unit)} held`
            }
            error={over ? `That’s more than you hold in ${VaultsV2.label(vault)}.` : null}
          >
            <div className="flex items-center gap-2">
              <WebDsV2.Input
                id="trade-amount"
                inputMode="decimal"
                autoComplete="off"
                placeholder={inQty ? "0.0000" : "0.00"}
                suffix={inQty ? unit : "USD"}
                invalid={over}
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                className="flex-1"
              />
              <WebDsV2.Button variant="secondary" size="lg" onClick={sellAll}>
                Sell all
              </WebDsV2.Button>
            </div>
          </WebDsV2.Field>
        ) : (
          <WebDsV2.Field
            label="Amount"
            htmlFor="trade-amount"
            helper={cashHelper}
            error={over ? `${money(shortfall)} more than your USD wallet holds, with the 0.9% fee.` : null}
          >
            <WebDsV2.Input
              id="trade-amount"
              size="default"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0.00"
              suffix="USD"
              invalid={over}
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
            />
          </WebDsV2.Field>
        )}

        <WebDsV2.Summary>
          {selling ? (
            <>
              <WebDsV2.DescriptionItem label="Value" value={has ? money(value) : "$0.00"} />
              <WebDsV2.Divider />
            </>
          ) : (
            <WebDsV2.DescriptionItem label={label} value={has ? qtyText(qty, unit) : qtyText(0, unit)} />
          )}
          <WebDsV2.DescriptionItem label="Rate" value={rateText(quote, metal, unit)} />
          <WebDsV2.DescriptionItem label={FEE_LABEL} value={money(has ? fee : 0)} />
          <WebDsV2.Divider />
          <WebDsV2.DescriptionItem label="Total" value={money(has ? total : 0)} emphasis="total" />
        </WebDsV2.Summary>
      </div>
    );
    footer = (
      <WebDsV2.Button size="xl" className="w-full" disabled={!valid} onClick={review}>
        Review
      </WebDsV2.Button>
    );
  }

  return (
    <SideDrawer open={open} onOpenChange={onOpenChange} trigger={children}>
      <SideDrawer.Header icon={<Mark metal={metal} />} title={title} />
      <SideDrawer.Body>{body}</SideDrawer.Body>
      <SideDrawer.Footer>{footer}</SideDrawer.Footer>
    </SideDrawer>
  );
}

/* Exported untyped: the body is plain JSX (see the header). */
const __TradeFlowV2: any = TradeFlowV2;
export { __TradeFlowV2 as TradeFlowV2 };
