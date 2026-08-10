"use client";

/**
 * Glint market data, ported from the Studio shared component "Market"
 * (cmsnb3km7zkw9g): LBMA price tails, the same source the wallet
 * charts use, trimmed to the last month of settled auctions. Keep in
 * sync with the Studio component.
 *
 * Gold rows: [date, USD per gram] (LBMA gold PM auction, USD column).
 * Silver rows: [date, GBP per gram] (the LBMA silver auction publishes
 * GBP only; converted to USD via GBPUSD, the FX implied by the
 * same-day gold row's GBP and USD columns).
 * One print per day, published with a lag: latest() is the last
 * settled auction, not today.
 */

export type MetalKey = "gold" | "silver";

export const OZ = 31.1034768; // grams per troy ounce

export const GBPUSD = 1.34771; // implied by the 2026-08-06 gold auction row

type PriceRow = [date: string, pricePerG: number];

export const GOLD_USD_PER_G: PriceRow[] = [
  ["2026-07-08", 130.7314], ["2026-07-09", 132.7874], ["2026-07-10", 131.7907],
  ["2026-07-13", 129.881], ["2026-07-14", 131.0304], ["2026-07-15", 130.6028],
  ["2026-07-16", 128.3956], ["2026-07-17", 128.4535], ["2026-07-20", 128.7171],
  ["2026-07-21", 130.2845], ["2026-07-22", 133.5896], ["2026-07-23", 130.0466],
  ["2026-07-24", 130.7667], ["2026-07-27", 131.0143], ["2026-07-28", 129.3167],
  ["2026-07-29", 128.6303], ["2026-07-30", 132.1733], ["2026-07-31", 129.4582],
  ["2026-08-03", 129.508], ["2026-08-04", 131.3101], ["2026-08-05", 135.2453],
  ["2026-08-06", 137.2146],
];

export const SILVER_GBP_PER_G: PriceRow[] = [
  ["2026-07-08", 1.4072], ["2026-07-09", 1.4121], ["2026-07-10", 1.4201],
  ["2026-07-13", 1.4011], ["2026-07-14", 1.3915], ["2026-07-15", 1.3905],
  ["2026-07-16", 1.3452], ["2026-07-17", 1.3233], ["2026-07-20", 1.3561],
  ["2026-07-21", 1.4111], ["2026-07-22", 1.4269], ["2026-07-23", 1.4111],
  ["2026-07-24", 1.4076], ["2026-07-27", 1.4252], ["2026-07-28", 1.3841],
  ["2026-07-29", 1.3883], ["2026-07-30", 1.3934], ["2026-07-31", 1.3812],
  ["2026-08-03", 1.3844], ["2026-08-04", 1.406], ["2026-08-05", 1.4625],
  ["2026-08-06", 1.4744],
];

/** Most recent settled price: { date, usdPerG, usdPerOz }. */
export function latest(asset: MetalKey) {
  if (asset === "gold") {
    const [date, usdPerG] = GOLD_USD_PER_G[GOLD_USD_PER_G.length - 1];
    return { date, usdPerG, usdPerOz: usdPerG * OZ };
  }
  const [date, gbpPerG] = SILVER_GBP_PER_G[SILVER_GBP_PER_G.length - 1];
  const usdPerG = gbpPerG * GBPUSD;
  return { date, usdPerG, usdPerOz: usdPerG * OZ };
}

/** USD balance -> troy ounces at the latest price. */
export function toOunces(usd: number, asset: MetalKey): number {
  return usd / latest(asset).usdPerOz;
}

/** "48.28 oz" formatting for holdings. */
export function fmtOz(n: number): string {
  return `${n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} oz`;
}

/** Namespace mirroring the Studio statics pattern. */
export const Market = {
  OZ,
  GBPUSD,
  gold: GOLD_USD_PER_G,
  silver: SILVER_GBP_PER_G,
  latest,
  toOunces,
  fmtOz,
};
