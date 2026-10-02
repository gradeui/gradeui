"use client";

// DisplayNumber (2 Oct 2026): a large figure, set the way the Web DS sets
// one, for the Glint business portal v2 on staging. Named after the Web DS
// component it follows (Figma "DisplayNumber", Size=lg and Size=md).
//
// TWIN: the Studio shared component "DisplayNumber" (cmuqwdhfz3jstj).
// Editing one does not touch the other. Keep the pair in sync.
//
// Ali, 2 Oct: "the large numbers seem to be in the wrong font on Web ...
// sort the numbers out and make sure they are tabular". The Web DS sets
// the Wallets Balance like the card figures:
//   - Raleway Bold (700), LINING figures (Raleway's default figures are
//     old-style) and TABULAR ones (Ali's call: Figma has proportional
//     only because its plugin cannot set OpenType features, and Ali will
//     switch Figma over to match), no ligatures;
//   - the whole number large, and the "$", the decimals and the unit
//     smaller beside it: "$" 36, "15,706" 48, ".04" 36 at Size=lg.
//
//   <DisplayNumber value={15706.04} currency size="lg" />        $15,706.04
//   <DisplayNumber value={105.33} currency suffix="/g" />         $105.33/g
//   <DisplayNumber value={117.2057} places={4} suffix=" g" />     117.2057 g
//   <DisplayNumber value={-8400} currency sign />                 -$8,400.00
//
// SIZES (Web DS, confirmed from the Figma node on 2 Oct), whole / small:
//   lg  48 / 36   the page Balance on Wallets
//   md  36 / 30   the card grams, and every other page-level figure here
// The small parts are set in em of the whole, so the ratio holds at any
// size. MOBILE SCALES PROPORTIONALLY TO FIT (Ali, 2 Oct, keeping the same
// ratios): the whole number is capped by the viewport width, so the set
// shrinks as one piece on a narrow screen and is the Figma size from about
// 440 wide up.
// ASSUMPTION: 11vw for lg and 9.3vw for md are the caps. At 390 that is
// 43 / 32 for lg, and md stays at its full 36 / 30 because a card is the
// full width there. Ali to confirm against a mobile frame when the Web DS
// has one.
//
// The SIGN and the "$" ride together at the small size, before the whole
// number, as fmtSigned writes them ("-$8,400.00").
// ASSUMPTION: the Web DS has no signed figure yet; the sign takes the
// currency's size so the whole number stays the thing you read first.
//
// Colour is inherited: give the figure a text colour (or the metal face's
// ink) from outside. The suffix is muted unless `suffixColor` says
// otherwise, as the Figma unit is.
//
// No useRaleway here: app/layout.tsx registers Raleway with next/font as
// --font-raleway. The Studio copy fetches it from Google Fonts.

import * as React from "react";

type DisplayNumberSize = "lg" | "md";

const SIZES: Record<DisplayNumberSize, { whole: number; small: number; fit: string }> = {
  lg: { whole: 48, small: 36, fit: "11vw" },
  md: { whole: 36, small: 30, fit: "9.3vw" },
};

/** The Web DS figure face. */
const FACE: React.CSSProperties = {
  fontFamily: "var(--font-raleway, Raleway), var(--font-sans), sans-serif",
  fontWeight: 700,
  fontVariantNumeric: "lining-nums tabular-nums",
  fontVariantLigatures: "none",
  lineHeight: 1.15,
  whiteSpace: "nowrap",
};

/** "15,706" and ".04". */
function split(n: number, places: number): [string, string] {
  const text = Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: places,
    maximumFractionDigits: places,
  });
  const at = text.indexOf(".");
  return at === -1 ? [text, ""] : [text.slice(0, at), text.slice(at)];
}

export function DisplayNumber({
  value = 0,
  size = "md",
  currency = false,
  places = 2,
  suffix,
  suffixColor,
  sign = false,
  className,
  style,
}: {
  value?: number;
  /** "lg" for the page Balance, "md" for every other large figure. */
  size?: DisplayNumberSize;
  /** A "$" before the figure, at the small size. */
  currency?: boolean;
  /** Decimal places: 2 for money, 4 for grams. */
  places?: number;
  /** After the decimals, verbatim and small: " g", "/g". */
  suffix?: string;
  /** The suffix's colour; muted when unset. */
  suffixColor?: string;
  /** A "+" or "-" before everything, for signed amounts. */
  sign?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const s = SIZES[size] ?? SIZES.md;
  const small: React.CSSProperties = { fontSize: `${s.small / s.whole}em` };
  const [whole, fraction] = split(value, places);
  const lead = `${sign ? (value < 0 ? "-" : "+") : ""}${currency ? "$" : ""}`;
  return (
    <span
      className={`inline-block ${className ?? ""}`}
      style={{ ...FACE, fontSize: `min(${s.whole}px, ${s.fit})`, ...style }}
    >
      {lead ? <span style={small}>{lead}</span> : null}
      <span>{whole}</span>
      {fraction ? <span style={small}>{fraction}</span> : null}
      {suffix ? (
        <span
          className={suffixColor ? undefined : "text-muted-foreground"}
          style={suffixColor ? { ...small, color: suffixColor } : small}
        >
          {suffix}
        </span>
      ) : null}
    </span>
  );
}
