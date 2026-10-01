"use client";

// MetalWalletCardV2 (1 Oct 2026): the wallet card for the Glint business
// portal v2, one design for all three wallets (Ali, 1 Oct: the Gold and
// Silver cards "matching our new Gold and silver wallet cards", and all
// three Wallets cards the same design). A fork of MetalWalletCard, which
// the live demo still uses.
//
// TWIN: the Studio shared component "MetalWalletCardV2" (cmuppmnb1qa09h).
// Editing one does not touch the other. Keep the pair in sync.
//
//   <MetalWalletCardV2 asset="gold" link="Gold — wallet v2" />   Wallets
//   <MetalWalletCardV2 asset="gold" vaults />                    Gold page
//   <MetalWalletCardV2 asset="fiat" link="USD — wallet v2" />     Wallets
//
// THE FACE is the metal wallet card from the App DS and the iOS app
// (Figma WalletGroupCard, Metal=Gold|Silver, Display=Metal,
// Surface=Metal; MetalFace and MetalCardContent in the iOS sample):
//   - the base gradient, Figma's exact stops in the face's own unit space
//     from (0.1528, 0.1528) to (0.8472, 0.8472). In CSS that is a "to
//     bottom right" gradient with the stops at 15.28% to 84.72%;
//   - BARE METAL: no G-unit ring lattice. Ali took the pattern off the
//     cards on 30 Sep ("remove remove remove"; the iOS default, Pattern
//     Subtle, "leaves the metal bare"). The lattice stays a band
//     treatment;
//   - the emboss: a white hairline along the top edge, a dark one along
//     the bottom, and type stamped with a 1px white shadow at 20%;
//   - the G and the metal's name, Auto-buy as an outline chip on the
//     metal it buys, the grams with a smaller fraction and the unit in
//     the accent, the pin with where it is held ("Zurich, Miami"), a
//     rule, then the value in USD.
// Every colour is the App DS's own: metal/on-metal #141B3D for the type,
// gold/700 or silver/700 for the G, the unit and the chip, gold/300 or
// silver/200 for the rule (Glint-Styleguide brand/colours.ts).
//
// USD, NOT METAL: the same card in its own treatment. The DS card surface
// instead of a metal face, the G in the action blue as before, the balance
// where the grams go, the same rule, and the Auto-buy setting where the
// value goes. It holds no vaults, so there is no pin.
//
// THE ACTIONS sit under the face (Ali, 1 Oct: "we are also losing the buy
// and sell buttons entirely, no CTAs"): Buy as the metal button, Sell as an
// outline button, both opening TradeFlowV2 with this card's metal. USD has
// one, Deposit, which goes to the USD wallet and its account details.
//
// `vaults` adds the per-vault table under the actions, for the metal's own
// page. `link` makes the face the way into that page.
//
// RALEWAY FOR THE GRAMS AND THE PLACE (Ali, 1 Oct: as in the App DS),
// with lining figures and no ligatures, as the iOS app sets them. The app
// registers the face with next/font as --font-raleway (app/layout.tsx), so
// it is self-hosted and its fallback is metric-matched: no layout shift.
// STUDIO DIFFERS HERE: the docs app has no Raleway loader, so this copy
// fetches the face from Google Fonts once (useRaleway below). The app twin
// has no such hook. The permanent Studio fix is a Raleway loader beside the
// others in apps/docs/app/layout.tsx.
import * as React from "react";
import {
  Card,
  Badge,
  Separator,
  Stack,
  Row,
  Button,
} from "@gradeui/ui";
import { ChevronRight, MapPin } from "lucide-react";
import { Persona, type AssetKey, type VaultBalance } from "@/lib/persona";
import { Market, type MetalKey, type MetalUnit } from "@/lib/market";
import { Accounts } from "@/lib/accounts";
import { Wordmark } from "@/components/wordmark";
import { TradeFlowV2 } from "@/components/trade-flow-v2";
import { MetalButton } from "@/components/metal-button";
import { AutoInvestToggle } from "@/components/auto-invest-toggle";

/** The App DS metal tokens for the face. */
const INK = "#141B3D";
const FACE: Record<
  MetalKey,
  { base: string; accent: string; rule: string; unit: string }
> = {
  gold: {
    base: "linear-gradient(to bottom right, #E3E5BC 15.28%, #D0B26D 38.43%, #A48544 61.57%, #7F6124 84.72%)",
    accent: "#533C00",
    rule: "#ECD19C",
    unit: "#533C00",
  },
  silver: {
    base: "linear-gradient(to bottom right, #FFFFFF 15.28%, #F0F0F0 38.43%, #D1D1D1 61.57%, #B1B1B1 84.72%)",
    accent: "#404040",
    rule: "#E7E7E7",
    unit: "rgb(20 27 61 / 0.66)",
  },
};
const EMBOSS = "inset 0 1px 0 rgb(255 255 255 / 0.35), inset 0 -1px 0 rgb(0 0 0 / 0.2)";
const STAMP = "0 1px 0 rgb(255 255 255 / 0.2)";
/** The App DS figure face: Raleway, lining figures, no ligatures. */
const RALEWAY: React.CSSProperties = {
  fontFamily: "var(--font-raleway, Raleway), var(--font-sans), sans-serif",
  fontVariantNumeric: "lining-nums tabular-nums",
  fontVariantLigatures: "none",
};

/* No useRaleway here: app/layout.tsx registers Raleway with next/font. */

/** "1,423" and ".9395": the grams with the fraction set smaller. */
function splitFigure(n: number, places: number): [string, string] {
  const text = n.toLocaleString("en-US", {
    minimumFractionDigits: places,
    maximumFractionDigits: places,
  });
  const at = text.indexOf(".");
  return at === -1 ? [text, ""] : [text.slice(0, at), text.slice(at)];
}

/** Where the metal is held: one vault by name, two as "Zurich, Miami",
 *  more as a count, as the iOS card's pin does. */
function heldIn(vaults: VaultBalance[]): string {
  if (vaults.length === 0) return "";
  if (vaults.length > 2) return `${vaults.length} vaults`;
  return vaults.map((v) => Accounts.vaultLabel(v.vault)).join(", ");
}

export function MetalWalletCardV2({
  asset = "gold",
  link,
  vaults: showVaults = false,
  className,
}: {
  asset?: AssetKey;
  /** A Studio screen name: the face becomes the way into that screen. */
  link?: string;
  /** Show the per-vault table, for the metal's own page. */
  vaults?: boolean;
  className?: string;
}) {
  const metal: MetalKey | null = asset === "fiat" ? null : asset;
  const [amount] = Persona.useBalance(asset);
  const [unit] = Persona.usePreference(asset === "silver" ? "unit.silver" : "unit.gold");
  const [autoInvest] = Persona.usePreference("autoInvest");
  const vaults = Persona.useVaults(asset);
  const vaultTotal = vaults.reduce((sum, v) => sum + v.amount, 0);
  const label = Persona.DEFAULT.balances[asset].label;
  const face = metal ? FACE[metal] : null;

  const [whole, fraction] = metal
    ? splitFigure(Market.toQty(amount, metal, unit as MetalUnit), 4)
    : splitFigure(amount, 2);
  const place = metal ? heldIn(vaults) : "";

  const title = (
    <Row justify="between" align="center" gap="sm">
      <Row gap="sm" align="center">
        <Wordmark
          lockup="mark"
          tone="current"
          className="size-6"
          style={{ color: face ? face.accent : "oklch(var(--primary))" }}
        />
        <span
          className={`text-xl font-semibold ${face ? "" : "text-foreground"}`}
          style={face ? { textShadow: STAMP } : undefined}
        >
          {label}
        </span>
        {metal && autoInvest === metal ? (
          <Badge
            variant="outline"
            style={{ color: face!.accent, borderColor: face!.accent }}
          >
            Auto-buy
          </Badge>
        ) : null}
      </Row>
      {link ? <ChevronRight aria-hidden className="size-5 shrink-0" /> : null}
    </Row>
  );

  const figure = (
    <Row justify="between" align="baseline" gap="sm" className="mt-1">
      <span
        className={`font-bold ${face ? "" : "text-foreground"}`}
        style={face ? { ...RALEWAY, textShadow: STAMP } : RALEWAY}
      >
        {metal ? null : <span className="text-xl">$</span>}
        <span className="text-3xl">{whole}</span>
        <span className="text-xl">{fraction}</span>
        {metal ? (
          <span className="text-xl" style={{ color: face!.unit }}>
            {` ${unit}`}
          </span>
        ) : null}
      </span>
      {place ? (
        <Row gap="xs" align="center" className="min-w-0 font-bold">
          <MapPin aria-hidden className="size-4 shrink-0" />
          <span className="truncate" style={{ ...RALEWAY, textShadow: STAMP }}>
            {place}
          </span>
        </Row>
      ) : null}
    </Row>
  );

  const footer = (
    <span
      className={`text-base tabular-nums ${face ? "" : "text-muted-foreground"}`}
      style={face ? { textShadow: STAMP } : undefined}
    >
      {metal
        ? Persona.fmtMoney(amount)
        : autoInvest === "none"
          ? "Auto-buy off"
          : `Auto-buy to ${AutoInvestToggle.labelFor(autoInvest)}`}
    </span>
  );

  const body = (
    <Stack gap="sm">
      {title}
      {figure}
      <Separator style={face ? { backgroundColor: face.rule } : undefined} />
      {footer}
    </Stack>
  );

  return (
    <Stack gap="md" className={className}>
      <Card
        interactive={Boolean(link)}
        data-grade-goto={link}
        aria-label={link ? `Open ${label}` : undefined}
        className="rounded-2xl p-5"
        style={
          face
            ? { background: face.base, color: INK, borderColor: "transparent", boxShadow: EMBOSS }
            : undefined
        }
      >
        {body}
      </Card>

      {metal ? (
        <Row gap="sm">
          <TradeFlowV2 metal={metal}>
            <MetalButton metal={metal} size="md" className="flex-1" aria-label={`Buy ${label}`}>
              Buy
            </MetalButton>
          </TradeFlowV2>
          <TradeFlowV2 metal={metal} direction="sell">
            <Button
              variant="outline"
              size="md"
              className="flex-1 rounded-full"
              aria-label={`Sell ${label}`}
            >
              Sell
            </Button>
          </TradeFlowV2>
        </Row>
      ) : (
        <Row gap="sm">
          <Button
            size="md"
            className="flex-1 rounded-full"
            data-grade-goto="USD — wallet v2"
          >
            Deposit
          </Button>
        </Row>
      )}

      {metal && showVaults && vaults.length > 0 ? (
        <Card className="p-5">
          <Stack gap="xs">
            <span className="text-sm font-medium text-foreground">Vaults</span>
            {/* The per-vault table from MetalWalletCard: shares from the USD
                slices so the column sums to 100%, 4dp grams, hairlines
                between rows, none under the last. */}
            <div className="grid grid-cols-[1fr_auto_auto]">
              {vaults.map((v, i) => {
                const rule = i === vaults.length - 1 ? "" : "border-b border-border";
                return (
                  <React.Fragment key={v.vault}>
                    <span className={`py-1.5 pr-4 text-sm text-muted-foreground ${rule}`}>
                      {Accounts.vaultLabel(v.vault)}
                    </span>
                    <span className={`py-1.5 pr-4 text-right text-sm tabular-nums text-muted-foreground ${rule}`}>
                      {vaultTotal ? ((v.amount / vaultTotal) * 100).toFixed(1) : "0.0"}%
                    </span>
                    <span className={`py-1.5 text-right text-sm tabular-nums text-foreground ${rule}`}>
                      {Market.fmtQty(
                        Market.toQty(v.amount, metal, unit as MetalUnit),
                        unit as MetalUnit,
                      )}
                    </span>
                  </React.Fragment>
                );
              })}
            </div>
          </Stack>
        </Card>
      ) : null}
    </Stack>
  );
}
