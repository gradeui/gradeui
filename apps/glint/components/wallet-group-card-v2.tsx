// @ts-nocheck: a MECHANICAL twin (7 Oct 2026). The body is the Studio
// JSX byte for byte; only the imports and the export line are rewritten
// (scripts/mechanical-twin.py), so the pair cannot drift by
// hand-porting.
"use client";

// WalletGroupCardV2 (7 Oct 2026): the Web DS "WalletGroupCard", for the
// business portal v2 on staging, as "Glint - Web Portal - Full New" draws
// it on Wallets · Default (72:163336) and the wallet pages.
//
// TWIN: the Studio shared component "WalletGroupCardV2" (cmuyguojgaasay). Editing one does
// not touch the other. Keep the pair in sync.
//
//   <WalletGroupCardV2 asset="gold" link="Gold — wallet v2" />
//   <WalletGroupCardV2 asset="fiat" link="USD — wallet v2" />
//
// VALUE FOR VALUE (Web DS WalletGroupCard):
//   - card: 20 all round, 8 between, 16 corners, on card. Subtle (the
//     metal default, Ali 2 Oct) draws a 2px inside edge in the metal's
//     edge gradient: edge-1 at 0, edge-2 at 35%, edge-3 at 55%, edge-4 at
//     100% along the diagonal (gold-edge-* and silver-edge-*, Dark and
//     Light). Solid (USD) is a 1px border. ?cards=metal still shows the
//     full metal face for comparison.
//   - top row: the G (24, gold-accent, silver-accent, or primary on USD)
//     and the name in Raleway Bold 20/28, and a 36 round ghost chevron
//     (16, foreground) that opens the wallet's page.
//   - the figure: Web DS DisplayNumber md ("1,125,825" 36, ".2057" and
//     " g" 30, the unit in the metal's accent); under it the vaults, a 24
//     pin and Raleway Bold 20/28 ("Zurich", "Zurich, Miami" or "2 vaults").
//   - a border rule, the holding's dollar value (Chivo 16/24
//     muted-foreground), another rule, then the actions: Buy Gold (the
//     Web DS gold Button, with the DS button's 8 corners rather than the
//     pill, so it matches Sell: Ali, 7 Oct) and Sell (secondary), both lg. USD: "$X
//     available" with 6 above and below, then Deposit and Withdraw
//     (secondary, lg).
//
// THE PLACE: Figma writes "2 vaults" for the gold held in two. Here one
// vault reads "Zurich", two read "2 vaults", as the slide does.
//
// THE WHOLE CARD IS THE LINK (Ali, 7 Oct: "the whole card should be a hot
// area ... as well as having buttons in there"): the chevron is the link,
// and its ::after stretches over the card, so a press anywhere opens the
// wallet's page; the buttons sit above it (relative, z-10) and work on
// their own. Hover is a one-step surface change, card-hover, and pressed
// one step further, card-pressed (WebDsV2 explains the pair; the Web DS
// card has no hover of its own); the focus ring draws
// round the card. Tab reaches the link, then each button.
//
// ACTIONS: Buy and Sell open TradeFlowV2; Deposit and Withdraw open the
// TransferV2 drawers, so every USD card (Wallets and the USD page) works
// the same.
import * as React from "react";
import { ChevronRight, MapPin } from "lucide-react";
import { Persona } from "@/lib/persona";
import { Market } from "@/lib/market";
import { VaultsV2 } from "@/lib/vaults-v2";
import { Wordmark } from "@/components/wordmark";
import { TradeFlowV2 } from "@/components/trade-flow-v2";
import { StagingSwitches } from "@/lib/staging-switches";
import { DisplayNumber } from "@/components/display-number";
import { WebDsV2 } from "@/components/web-ds-v2";
import { TransferV2 } from "@/components/transfer-v2";

const cx = (...c) => c.filter(Boolean).join(" ");

/* The full metal face, kept for ?cards=metal (Web DS Surface=metal). */
const METAL_FACE = {
  gold: "linear-gradient(to bottom right, #E3E5BC 15.28%, #D0B26D 38.43%, #A48544 61.57%, #7F6124 84.72%)",
  silver: "linear-gradient(to bottom right, #FFFFFF 15.28%, #F0F0F0 38.43%, #D1D1D1 61.57%, #B1B1B1 84.72%)",
};

/** The 2px inside edge of a Subtle card, drawn as a masked layer so the
 *  card keeps its own fill. */
function SubtleEdge({ metal }) {
  const e = (n) => `var(--wds-${metal}-edge-${n})`;
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 rounded-[inherit]"
      style={{
        padding: 2,
        background: `linear-gradient(135deg, ${e(1)} 0%, ${e(2)} 35%, ${e(3)} 55%, ${e(4)} 100%)`,
        WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
        WebkitMaskComposite: "xor",
        mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
        maskComposite: "exclude",
      }}
    />
  );
}

/** "Zurich" for one vault, "2 vaults" for more. */
function heldIn(vaults) {
  const held = vaults.filter((v) => v.amount > 0);
  if (held.length === 0) return "";
  if (held.length > 1) return `${held.length} vaults`;
  return VaultsV2.label(held[0].vault);
}

function WalletGroupCardV2({
  asset = "gold",
  link,
  surface: surfaceProp,
  actions = true,
  className,
}) {
  const metal = asset === "fiat" ? null : asset;
  const [amount] = Persona.useBalance(asset);
  const [unit] = Persona.usePreference(asset === "silver" ? "unit.silver" : "unit.gold");
  const vaults = VaultsV2.useVaults(asset);
  const cards = StagingSwitches.useCards();
  const label = Persona.DEFAULT.balances[asset].label;
  const surface = metal ? surfaceProp ?? (cards === "metal" ? "metal" : "subtle") : "solid";
  const face = surface === "metal";
  const accent = metal ? `var(--wds-${metal}-accent)` : "var(--wds-primary)";
  const ink = face ? "var(--wds-metal-foreground)" : undefined;
  const place = metal ? heldIn(vaults) : "";

  return (
    <div
      className={cx(
        "relative flex flex-col gap-2 rounded-[16px] p-5",
        surface === "solid" ? "border border-[color:var(--wds-border)] bg-[var(--wds-card)]" : "",
        surface === "subtle" ? "bg-[var(--wds-card)]" : "",
        link && !face ? "cursor-pointer transition-colors hover:bg-[var(--wds-card-hover)] active:bg-[var(--wds-card-pressed)]" : "",
        className,
      )}
      style={face ? { background: METAL_FACE[metal], color: "#141b3d" } : undefined}
    >
      {surface === "subtle" ? <SubtleEdge metal={metal} /> : null}

      {/* row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 py-1">
          <Wordmark lockup="mark" tone="current" className="size-6 shrink-0" style={{ color: face ? ink : accent }} />
          <span
            className={cx("wds-display text-xl font-bold leading-7", face ? "" : "text-[color:var(--wds-card-foreground)]")}
          >
            {label}
          </span>
        </div>
        {link ? (
          <button
            type="button"
            data-grade-goto={link}
            aria-label={`Open ${label}`}
            className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full outline-none transition-colors after:absolute after:inset-0 after:z-[1] after:rounded-[16px] after:content-[''] focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-[color:var(--wds-ring)]"
          >
            <ChevronRight className="size-4" />
          </button>
        ) : null}
      </div>

      {/* amount */}
      <div className="relative flex flex-col gap-2">
        <DisplayNumber
          value={metal ? Market.toQty(amount, metal, unit) : amount}
          places={metal ? 4 : 2}
          currency={!metal}
          suffix={metal ? ` ${unit}` : undefined}
          suffixColor={metal ? (face ? ink : accent) : undefined}
          size="md"
          className={face ? "" : "text-[color:var(--wds-foreground)]"}
        />
        {place ? (
          <span className="flex items-center gap-1">
            <MapPin aria-hidden className="size-6 shrink-0" strokeWidth={2} />
            <span className="wds-display text-xl font-bold leading-7">{place}</span>
          </span>
        ) : null}
      </div>

      <WebDsV2.Divider className="relative" />
      <span
        className={cx(
          "relative text-base leading-6",
          metal ? "" : "py-1.5",
          face ? "" : "text-[color:var(--wds-muted-foreground)]",
        )}
      >
        {metal ? Persona.fmtMoney(amount) : `${Persona.fmtMoney(amount)} available`}
      </span>

      {actions ? (
        <>
          <WebDsV2.Divider className="relative" />
          {/* The row rides above the card's stretched link, but only the
              buttons take the press: the gaps and the space beside them
              fall through to the card (7 Oct evening: the row was a dead
              strip across the card). */}
          <div className="pointer-events-none relative z-10 flex items-center gap-2 [&>*]:pointer-events-auto">
            {metal ? (
              <>
                <TradeFlowV2 metal={metal}>
                  <WebDsV2.MetalButton metal={metal} shape="square">Buy {label}</WebDsV2.MetalButton>
                </TradeFlowV2>
                <TradeFlowV2 metal={metal} direction="sell">
                  <WebDsV2.Button variant="secondary" size="lg" aria-label={`Sell ${label}`}>
                    Sell
                  </WebDsV2.Button>
                </TradeFlowV2>
              </>
            ) : (
              <>
                <TransferV2.Deposit>
                  <WebDsV2.Button variant="secondary" size="lg">
                    Deposit
                  </WebDsV2.Button>
                </TransferV2.Deposit>
                <TransferV2.Withdraw>
                  <WebDsV2.Button variant="secondary" size="lg">
                    Withdraw
                  </WebDsV2.Button>
                </TransferV2.Withdraw>
              </>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}

/** The Vaults card beside a metal's wallet card (Silver · Default): 20
 *  all round, 4 between, 16 corners, card with a border; "Vaults" in
 *  Raleway Bold 20/28, then a row per vault, 10 above and below: the
 *  vault in Chivo Medium 16/24 over its share in 14/20 muted on the left,
 *  the holding in Medium 16/24 over its dollar value in 14/20 muted on the
 *  right. ASSUMPTION: Figma's right-hand second line repeats "100%"; the
 *  dollar value is what that slot most plausibly means, and the share
 *  already sits on the left. */
WalletGroupCardV2.Vaults = function WalletGroupCardV2Vaults({ asset = "gold", className }) {
  const vaults = VaultsV2.useVaults(asset).filter((v) => v.amount > 0);
  const [unit] = Persona.usePreference(asset === "silver" ? "unit.silver" : "unit.gold");
  const total = vaults.reduce((sum, v) => sum + v.amount, 0);
  return (
    <div
      className={cx(
        "flex flex-col gap-1 rounded-[16px] border border-[color:var(--wds-border)] bg-[var(--wds-card)] p-5",
        className,
      )}
    >
      <span className="wds-display text-xl font-bold leading-7 text-[color:var(--wds-foreground)]">Vaults</span>
      {vaults.map((v) => (
        <div key={v.vault} className="flex items-center justify-between gap-4 py-2.5">
          <span className="flex flex-col gap-0.5">
            <span className="text-base font-medium leading-6 text-[color:var(--wds-foreground)]">
              {VaultsV2.label(v.vault)}
            </span>
            <span className="text-sm leading-5 text-[color:var(--wds-muted-foreground)]">
              {total ? `${((v.amount / total) * 100).toFixed(0)}%` : "0%"}
            </span>
          </span>
          <span className="flex flex-col items-end gap-0.5">
            <span className="text-base font-medium leading-6 text-[color:var(--wds-foreground)]">
              {Market.fmtQty(Market.toQty(v.amount, asset, unit), unit)}
            </span>
            <span className="text-sm leading-5 text-[color:var(--wds-muted-foreground)]">
              {Persona.fmtMoney(v.amount)}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
};

/* Exported untyped: the body is plain JSX (see the header). */
const __WalletGroupCardV2: any = WalletGroupCardV2;
export { __WalletGroupCardV2 as WalletGroupCardV2 };
