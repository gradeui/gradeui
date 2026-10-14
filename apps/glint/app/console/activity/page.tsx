// @ts-nocheck: promoted Studio JSX, see scripts/promotion-patches.json.
"use client";

// Promoted from Studio screen "Activity — history v2"
// (design dmupumb6uwgoj, version 1792016110753). Registry: lib/screens.ts;
// re-promotion workflow: apps/glint/README.md.
// source-hash: 2040bdf14317
// (the drift guard's signature of the Studio source this page was
// built from, so check:promotions measures Studio against THIS copy
// and not against a baseline that --update can rewrite.)

// Activity — history v2: the business portal's Activity page on our
// prototype. A copy of "Activity — history", which stays untouched because
// the live demo is promoted from it.
//
// 14 OCT, ALI'S CALL: "Glint build + drawer - and keep the two top right
// buttons, Ctas". So:
//   - breadcrumb "Activity"; Figma's title (Raleway Bold 24/32) with
//     Download statement and Tax report on the right (Web DS Button
//     outline, sm), in place of the Glint build's single Statements;
//   - the Glint build's Wallet select, one wallet per vault: Gold (Zurich)
//     GGM, Gold (Miami) GGM_USMIA, Silver (Zurich) SIL, Silver (Miami)
//     SIL_USMIA, US Dollar USD (the label Chivo Medium 14/20 over a 320
//     wide, 36 tall select, the code in muted-foreground). The address's
//     ?wallet= picks it, as on the Glint build; it opens on Gold (Zurich)
//     like the Glint build does;
//   - on US Dollar, the pending sells alert when any sell is still
//     settling (ASSUMPTION: the Glint build's "Metal Sell transactions in
//     PENDING state" in our alert style and sentence case, "Pending metal
//     sells" over the total);
//   - the Glint build's table (ActivityListV2.Table: Description with type,
//     Amount metal over cash, Status, Date over time, 20 to a page with
//     Previous and Next), a row opening the agreed detail drawer.
// Download statement opens Statements; Tax report opens it on Tax reports
// (the choice is stored on pointer down: the goto bridge takes the click)
// (ASSUMPTION, see Statements v2). ?state=empty keeps System · Empty ·
// Activity: the title and the Web DS EmptyState, nothing else.
import * as React from "react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@gradeui/ui";
import { AppChromeV2 } from "@/components/layouts/app-chrome-v2";
import { Persona } from "@/lib/persona";
import { VaultsV2 } from "@/lib/vaults-v2";
import { FlowStore } from "@/lib/flow-store";
import { ActivityListV2 } from "@/components/activity-list-v2";
import { StagingSwitches } from "@/lib/staging-switches";
import { WebDsV2 } from "@/components/web-ds-v2";

const STATEMENTS = "Statements v2";

/* The Glint build's wallets: one per vault, and the cash wallet. */
const WALLETS = [
  { code: "GGM", label: "Gold (Zurich)", metal: "gold", vault: "Zurich" },
  { code: "GGM_USMIA", label: "Gold (Miami)", metal: "gold", vault: "Miami" },
  { code: "SIL", label: "Silver (Zurich)", metal: "silver", vault: "Zurich" },
  { code: "SIL_USMIA", label: "Silver (Miami)", metal: "silver", vault: "Miami" },
  { code: "USD", label: "US Dollar", metal: null, vault: null },
];

function walletFromAddress() {
  try {
    const w = new URLSearchParams(window.location.search).get("wallet") ?? "";
    return WALLETS.some((x) => x.code === w) ? w : "GGM";
  } catch {
    return "GGM";
  }
}

/** The rows a wallet shows: a metal vault's own, or everything the USD
 *  wallet moved. */
function inWallet(row, w) {
  if (!w.metal) return row.account === "fiat" || row.counterAccount === "fiat";
  return row.account === w.metal && VaultsV2.label(row.vault) === w.vault;
}

export default function ActivityPage() {
  const [code, setCode] = React.useState("GGM");
  React.useEffect(() => setCode(walletFromAddress()), []);
  const [, setView] = FlowStore.useField("v2.statements.view", "statements");
  const all = Persona.useActivity();
  const wallet = WALLETS.find((w) => w.code === code) ?? WALLETS[0];
  const rows = all.filter((r) => inWallet(r, wallet));
  const pendingSells = all
    .filter((r) => r.kind === "exchange-sell" && r.status === "pending")
    .reduce((sum, r) => sum + Math.abs(r.fiatAmount), 0);
  const empty = StagingSwitches.useState() === "empty";
  return (
    <>
      <AppChromeV2.Main className="md:gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <AppChromeV2.Title>Activity</AppChromeV2.Title>
          <div className={empty ? "hidden" : "flex items-center gap-2"}>
            <WebDsV2.Button variant="outline" size="sm" data-grade-goto={STATEMENTS} onPointerDown={() => setView("statements")} onKeyDown={() => setView("statements")}>
              Download statement
            </WebDsV2.Button>
            <WebDsV2.Button variant="outline" size="sm" data-grade-goto={STATEMENTS} onPointerDown={() => setView("tax")} onKeyDown={() => setView("tax")}>
              Tax report
            </WebDsV2.Button>
          </div>
        </div>
        {empty ? (
          <WebDsV2.EmptyState title="No activity yet" body="Trades, deposits and withdrawals will show here." />
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium leading-5 text-[color:var(--wds-foreground)]">Wallet</span>
              <Select value={code} onValueChange={setCode}>
                <SelectTrigger
                  aria-label="Wallet"
                  className="h-9 w-full max-w-[320px] gap-3 rounded-[8px] border-[color:var(--wds-input)] bg-[var(--wds-input-background)] px-3 text-sm leading-5 text-[color:var(--wds-foreground)] dark:bg-[var(--wds-input-background)]"
                >
                  <SelectValue>
                    {wallet.label}
                    <span className="ml-2 text-[color:var(--wds-muted-foreground)]">{wallet.code}</span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {WALLETS.map((w) => (
                    <SelectItem key={w.code} value={w.code}>
                      {w.label}
                      <span className="ml-2 text-[color:var(--wds-muted-foreground)]">{w.code}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {wallet.code === "USD" && pendingSells > 0 ? (
              <WebDsV2.Alert tone="warning" title="Pending metal sells">
                {Persona.fmtMoney(pendingSells)}
              </WebDsV2.Alert>
            ) : null}
            <ActivityListV2.Table rows={rows} lead={wallet.metal ? "metal" : "cash"} />
          </>
        )}
      </AppChromeV2.Main>
    </>
  );
}
