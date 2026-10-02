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
//   - NO RING LATTICE (Ali, 2 Oct: "We need to drop the ring decoration
//     from the web cards"). That reverses 1 Oct, when Figma's G-unit
//     lattice went back on the web faces; the face is the bare metal
//     gradient again;
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
// where the grams go, the same rule, and a second line where the value
// goes. It holds no vaults, so there is no pin.
//
// NO AUTO-BUY ON STAGING (Ali, 2 Oct: "I need staging not to have
// auto-buy, but we do need a layout where auto-buy exists in the
// future"). Behind StagingSwitches.useAutoBuy(), off unless ?autobuy=on:
//   - off: no Auto-buy chip on the metal cards, and the USD card's second
//     line is the balance available, "$1,842.60 available" (the Web DS
//     card set's wording), so the three cards keep one height;
//   - on: the chip and "Auto-buy to Gold" / "Auto-buy off", as before.
//
// THE FIGURE IS THE WEB DS DisplayNumber, Size=md (2 Oct, confirmed from
// the Figma node): Raleway 700, lining tabular figures, the whole number
// 36 and the "$", the fraction and the unit 30. It was 30 / 20 here.
//
// TWO LOOKS FOR GOLD AND SILVER, `variant` (Ali, 2 Oct: "I'd also like to
// have a more subtle version of the gold and silver web cards, maybe an
// inner shiny border, 2px thick ... I think for business this full gold
// and silver might be too much"):
//   - "metal": the metal face above, with ?cards=metal.
//   - "subtle", THE DEFAULT ON WEB (Ali, 2 Oct: "I think the subtle metals
//     work for Web"): the USD card's quiet surface (the DS card, so white in
//     Light and the theme's neutral 900 in Dark, with the DS card shadow
//     and hover), and a 2px metal edge INSIDE the card's outline, like
//     light catching a bevel. The edge is a 135deg gradient of the metal's
//     own ramp: pale at the top left, a brighter catch past the middle,
//     the deepest step at the bottom right. Light takes steps two deeper
//     than Dark, so it still reads on white:
//       Gold   Light  gold/400 0%, gold/600 35%, gold/300 55%, gold/700 100%
//              Dark   gold/200 0%, gold/400 35%, gold/100 55%, gold/500 100%
//       Silver Light  silver/400, silver/600, silver/300, silver/700
//              Dark   silver/200, silver/400, silver/100, silver/500
//     It is a layer over the card's own 1px border, so it sits flush with
//     the card's edge, follows its radius exactly and moves no content: the
//     text sits where the USD card's does. A mask cuts the middle out, so
//     the DS surface and its hover lift show through untouched.
//     The type is the metal face's, in the theme's foreground where the
//     face has its on-metal ink (the value too, not muted as on USD: a
//     muted line is the theme's blue, which fought the gold). Where the
//     face uses its accent (the G, the unit, the Auto-buy chip), Subtle
//     uses the metal instead: gold/600 or silver/600 in
//     Light, gold/400 or silver/400 in Dark, the steps the drawer's G uses
//     against the same surfaces. No glow and no motion: it is for business.
//     ASSUMPTION: no sheen was tried. The brief allowed a very slow one,
//     off by default; the still gradient already reads as a lit edge.
//   USD has one look; `variant` does nothing there.
//
// THE STAGING SWITCH: a card with no `variant` takes its look from the
// address, ?cards=subtle or ?cards=metal, through StagingSwitches.useCards
// (the one module every staging switch lives in). The choice is kept for
// the tab, so it follows the cards from Wallets to the Gold and Silver
// pages, whose links drop the query. A new tab starts on subtle again.
//
// THE ACTIONS sit under the face (Ali, 1 Oct: "we are also losing the buy
// and sell buttons entirely, no CTAs"), both opening TradeFlowV2 with this
// card's metal. Buy is the DS primary and Sell the DS secondary (Ali,
// later on 1 Oct: "too many primaries"), in a two-column grid so the pair
// is exactly the card's width, edges flush with the card's, split 50/50
// with an 8px gap at every breakpoint. 40 tall with the DS button radius,
// not pills (Ali, 1 Oct: the Web DS Button wins). USD has
// NO button (Ali, 1 Oct): depositing happens offline, and the account
// details stay on the USD wallet page and Bank accounts.
//
// `vaults` adds the per-vault table under the actions, for the metal's own
// page. `link` makes the face the way into that page.
//
// RALEWAY FOR THE GRAMS AND THE PLACE (Ali, 1 Oct: as in the App DS),
// with lining figures and no ligatures, as the iOS app sets them. The
// grams are DisplayNumber's (above); the place keeps RALEWAY here. The app
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
import { AutoInvestToggle } from "@/components/auto-invest-toggle";
import { DisplayNumber } from "@/components/display-number";
import { StagingSwitches } from "@/lib/staging-switches";

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

/** Subtle's metal, per mode (see the header): the 2px edge and the accent.
 *  Every value is a step of the metal's own ramp (Glint-Styleguide
 *  brand/colours.ts), named beside it. */
const SUBTLE: Record<
  MetalKey,
  { ringLight: string; ringDark: string; accentLight: string; accentDark: string }
> = {
  gold: {
    /* gold/400, gold/600, gold/300, gold/700 */
    ringLight: "linear-gradient(135deg, #BC9B55 0%, #6C4F04 35%, #ECD19C 55%, #533C00 100%)",
    /* gold/200, gold/400, gold/100, gold/500 */
    ringDark: "linear-gradient(135deg, #EAEBBA 0%, #BC9B55 35%, #FEF3DE 55%, #8E6D25 100%)",
    /* ASSUMPTION: the Light G is gold/600, not the face's gold/700, which
       reads brown on white; 600 is the step nearest the drawer's Light G.
       Make it #533C00 (gold/700) if Ali wants the face's own accent. */
    accentLight: "#6C4F04", // gold/600
    accentDark: "#BC9B55", // gold/400
  },
  silver: {
    /* silver/400, silver/600, silver/300, silver/700 */
    ringLight: "linear-gradient(135deg, #9F9F9F 0%, #545454 35%, #D4D4D4 55%, #404040 100%)",
    /* silver/200, silver/400, silver/100, silver/500 */
    ringDark: "linear-gradient(135deg, #E7E7E7 0%, #9F9F9F 35%, #F4F4F4 55%, #737373 100%)",
    accentLight: "#545454", // silver/600
    accentDark: "#9F9F9F", // silver/400
  },
};

/* The mode picks the pair. A <style> element rather than a dark: class:
   Fast Frame's stylesheet is precompiled, so a variant class this file
   invents would not exist in Studio (TradeFlowV2's G does the same). */
const SUBTLE_CSS =
  ".glint-card-subtle{--glint-card-ring:var(--glint-ring-light);--glint-card-accent:var(--glint-accent-light)}" +
  ".dark .glint-card-subtle{--glint-card-ring:var(--glint-ring-dark);--glint-card-accent:var(--glint-accent-dark)}";

/** The 2px edge: a layer over the Card's own 1px (transparent) border, so
 *  its outer edge IS the card's and `inherit` gives it the card's radius;
 *  the mask keeps only its 2px padding. The -webkit- pair first, for
 *  older Safari. */
const SUBTLE_EDGE: React.CSSProperties = {
  position: "absolute",
  inset: "-1px",
  borderRadius: "inherit",
  padding: "2px",
  background: "var(--glint-card-ring)",
  pointerEvents: "none",
  WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
  WebkitMaskComposite: "xor",
  mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
  maskComposite: "exclude",
};

type CardVariant = "metal" | "subtle";

function isCardVariant(v: unknown): v is CardVariant {
  return v === "metal" || v === "subtle";
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
  variant: variantProp,
  className,
}: {
  asset?: AssetKey;
  /** A Studio screen name: the face becomes the way into that screen. */
  link?: string;
  /** Show the per-vault table, for the metal's own page. */
  vaults?: boolean;
  /** Gold and Silver only: "metal" (the face) or "subtle" (the quiet
   *  surface with a 2px metal edge). Unset, the staging switch decides. */
  variant?: CardVariant;
  className?: string;
}) {
  const metal: MetalKey | null = asset === "fiat" ? null : asset;
  const [amount] = Persona.useBalance(asset);
  const [unit] = Persona.usePreference(asset === "silver" ? "unit.silver" : "unit.gold");
  const [autoInvest] = Persona.usePreference("autoInvest");
  const vaults = Persona.useVaults(asset);
  const vaultTotal = vaults.reduce((sum, v) => sum + v.amount, 0);
  const label = Persona.DEFAULT.balances[asset].label;
  const switched = StagingSwitches.useCards();
  const autoBuy = StagingSwitches.useAutoBuy();
  const variant = isCardVariant(variantProp) ? variantProp : switched;
  /* The metal face, or Subtle's metal; USD has neither. */
  const face = metal && variant === "metal" ? FACE[metal] : null;
  const subtle = metal && variant === "subtle" ? SUBTLE[metal] : null;
  /* The G, the unit and the chip: the face's accent, Subtle's metal for
     the mode, or the action blue on USD. */
  const accent = face
    ? face.accent
    : subtle
      ? "var(--glint-card-accent)"
      : "oklch(var(--primary))";

  const place = metal ? heldIn(vaults) : "";

  const title = (
    <Row justify="between" align="center" gap="sm">
      <Row gap="sm" align="center">
        <Wordmark
          lockup="mark"
          tone="current"
          className="size-6"
          style={{ color: accent }}
        />
        {/* ASSUMPTION: on Subtle the name stays in the foreground and only
            the G, the unit and the chip take the metal (Ali: the name
            "maybe" could). To try it, give this span `color: accent` when
            `subtle` is set. */}
        <span
          className={`text-xl font-semibold ${face ? "" : "text-foreground"}`}
          style={face ? { textShadow: STAMP } : undefined}
        >
          {label}
        </span>
        {/* The chip only with ?autobuy=on (see the header). */}
        {metal && autoBuy && autoInvest === metal ? (
          <Badge
            variant="outline"
            style={{ color: accent, borderColor: accent }}
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
      {/* The Web DS DisplayNumber, Size=md: "117" 36 and ".2057 g" 30, or
          "$1,842" 36 with "$" and ".60" 30 on USD. */}
      <DisplayNumber
        value={metal ? Market.toQty(amount, metal, unit as MetalUnit) : amount}
        places={metal ? 4 : 2}
        currency={!metal}
        suffix={metal ? ` ${unit}` : undefined}
        suffixColor={metal ? (face ? face.unit : accent) : undefined}
        size="md"
        className={face ? "" : "text-foreground"}
        style={face ? { textShadow: STAMP } : undefined}
      />
      {place ? (
        <Row gap="xs" align="center" className="min-w-0 font-bold">
          <MapPin aria-hidden className="size-4 shrink-0" />
          <span className="truncate" style={face ? { ...RALEWAY, textShadow: STAMP } : RALEWAY}>
            {place}
          </span>
        </Row>
      ) : null}
    </Row>
  );

  const footer = (
    <span
      className={`text-base tabular-nums ${face ? "" : subtle ? "text-foreground" : "text-muted-foreground"}`}
      style={face ? { textShadow: STAMP } : undefined}
    >
      {metal
        ? Persona.fmtMoney(amount)
        : !autoBuy
          ? /* The balance available, formatted as the figure above it
               is, in the Web DS card set's words (2 Oct). */
            `${Persona.fmtMoney(amount)} available`
          : autoInvest === "none"
            ? "Auto-buy off"
            : `Auto-buy to ${AutoInvestToggle.labelFor(autoInvest)}`}
    </span>
  );

  const body = (
    <Stack gap="sm" className="relative">
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
        className={`relative rounded-2xl p-5 ${subtle ? "glint-card-subtle" : ""}`}
        style={
          face
            ? { background: face.base, color: INK, borderColor: "transparent", boxShadow: EMBOSS }
            : subtle
              ? {
                  borderColor: "transparent",
                  "--glint-ring-light": subtle.ringLight,
                  "--glint-ring-dark": subtle.ringDark,
                  "--glint-accent-light": subtle.accentLight,
                  "--glint-accent-dark": subtle.accentDark,
                } as React.CSSProperties
              : undefined
        }
      >
        {subtle ? (
          <>
            <style>{SUBTLE_CSS}</style>
            <span aria-hidden style={SUBTLE_EDGE} />
          </>
        ) : null}
        {body}
      </Card>

      {metal ? (
        <div className="grid grid-cols-2 gap-2">
          <TradeFlowV2 metal={metal}>
            <Button size="lg" className="w-full" aria-label={`Buy ${label}`}>
              Buy
            </Button>
          </TradeFlowV2>
          <TradeFlowV2 metal={metal} direction="sell">
            <Button
              variant="secondary"
              size="lg"
              className="w-full"
              aria-label={`Sell ${label}`}
            >
              Sell
            </Button>
          </TradeFlowV2>
        </div>
      ) : null}

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
