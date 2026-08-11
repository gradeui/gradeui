"use client";

/**
 * Glint market data, ported from the Studio shared component "Market"
 * (cmsnb3km7zkw9g): LBMA price tails, the same source the wallet
 * charts use, trimmed to the last month of settled auctions. Keep in
 * sync with the Studio component.
 *
 * Refreshed 11 Aug 2026 from prices.lbma.org.uk; last settled auction
 * 2026-08-10. To refresh: curl gold_pm.json and silver.json, take the
 * tail from the same start date for both so the charts align, convert
 * with OZ, and re-derive GBPUSD from the latest gold row.
 *
 * TWO RATES, deliberately separate: latest()/toQty()/toUsd() are the
 * MARKET rate and value holdings; buyRate() adds the product's 0.9%
 * dealing fee and is what the buy flow quotes and converts on. The fee
 * lives INSIDE the quoted rate, so the cash fee on an order is
 * feeOn(amount) = amount * (1 - 1/1.009), not amount * 0.009.
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

export const GBPUSD = 1.3508; // implied by the 2026-08-10 gold auction row

/** The product's dealing fee, built into every quoted buy rate. */
export const BUY_FEE = 0.009;

type PriceRow = [date: string, pricePerG: number];

export const GOLD_USD_PER_G: PriceRow[] = [
  ["2026-07-08", 130.7314], ["2026-07-09", 132.7874], ["2026-07-10", 131.7907],
  ["2026-07-13", 129.881], ["2026-07-14", 131.0304], ["2026-07-15", 130.6028],
  ["2026-07-16", 128.3956], ["2026-07-17", 128.4535], ["2026-07-20", 128.7171],
  ["2026-07-21", 130.2845], ["2026-07-22", 133.5896], ["2026-07-23", 130.0466],
  ["2026-07-24", 130.7667], ["2026-07-27", 131.0143], ["2026-07-28", 129.3167],
  ["2026-07-29", 128.6303], ["2026-07-30", 132.1733], ["2026-07-31", 129.4582],
  ["2026-08-03", 129.508], ["2026-08-04", 131.3101], ["2026-08-05", 135.2453],
  ["2026-08-06", 137.2146], ["2026-08-07", 139.3912], ["2026-08-10", 139.0343],
];

export const SILVER_GBP_PER_G: PriceRow[] = [
  ["2026-07-08", 1.4072], ["2026-07-09", 1.4121], ["2026-07-10", 1.4201],
  ["2026-07-13", 1.4011], ["2026-07-14", 1.3915], ["2026-07-15", 1.3905],
  ["2026-07-16", 1.3452], ["2026-07-17", 1.3233], ["2026-07-20", 1.3561],
  ["2026-07-21", 1.4111], ["2026-07-22", 1.4269], ["2026-07-23", 1.4111],
  ["2026-07-24", 1.4076], ["2026-07-27", 1.4252], ["2026-07-28", 1.3841],
  ["2026-07-29", 1.3883], ["2026-07-30", 1.3934], ["2026-07-31", 1.3812],
  ["2026-08-03", 1.3844], ["2026-08-04", 1.406], ["2026-08-05", 1.4625],
  ["2026-08-06", 1.4744], ["2026-08-07", 1.5387], ["2026-08-10", 1.5227],
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

export type MetalUnit = "g" | "oz";

/** USD balance -> quantity at the latest price, in "g" or "oz". */
export function toQty(usd: number, asset: MetalKey, unit: MetalUnit): number {
  const grams = usd / latest(asset).usdPerG;
  return unit === "oz" ? grams / OZ : grams;
}

/** "48.37 g" / "48.28 oz" formatting for holdings. */
export function fmtQty(n: number, unit: MetalUnit): string {
  return `${n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${unit}`;
}

/** Quantity -> USD at the MARKET rate. */
export function toUsd(qty: number, asset: MetalKey, unit: MetalUnit): number {
  const grams = unit === "oz" ? qty * OZ : qty;
  return grams * latest(asset).usdPerG;
}

/** The fee-inclusive dealing rate per `unit` — what the buy flow
 *  quotes and converts on. */
export function buyRate(asset: MetalKey, unit: MetalUnit): number {
  const l = latest(asset);
  const market = unit === "oz" ? l.usdPerOz : l.usdPerG;
  return market * (1 + BUY_FEE);
}

/** The cash fee inside an order. The fee lives in the rate, so this is
 *  usd * (1 - 1/1.009), not usd * 0.009. */
export function feeOn(usd: number): number {
  if (!Number.isFinite(usd) || usd <= 0) return 0;
  return usd * (1 - 1 / (1 + BUY_FEE));
}

/** USD -> quantity at the DEALING rate (what an order actually buys). */
export function buyQty(usd: number, asset: MetalKey, unit: MetalUnit): number {
  return usd / buyRate(asset, unit);
}

/** Quantity -> USD at the DEALING rate (what an order actually costs). */
export function buyCost(qty: number, asset: MetalKey, unit: MetalUnit): number {
  return qty * buyRate(asset, unit);
}

/** Legacy ounce helpers (pre-preferences call sites). */
export function toOunces(usd: number, asset: MetalKey): number {
  return toQty(usd, asset, "oz");
}
export function fmtOz(n: number): string {
  return fmtQty(n, "oz");
}

/** Namespace mirroring the Studio statics pattern. */
export const Market = {
  OZ,
  GBPUSD,
  gold: GOLD_USD_PER_G,
  silver: SILVER_GBP_PER_G,
  BUY_FEE,
  latest,
  toQty,
  toUsd,
  buyRate,
  feeOn,
  buyQty,
  buyCost,
  fmtQty,
  toOunces,
  fmtOz,
};
