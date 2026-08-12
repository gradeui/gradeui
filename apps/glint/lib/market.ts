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
 * THREE RATES, deliberately separate:
 *   - latest()/toQty()/toUsd() are the MARKET rate, which values holdings.
 *   - buyRate() is market +0.9%: what you pay per unit when buying.
 *   - sellRate() is market -0.9%: what you receive when selling. This is
 *     why the iOS app quotes a lower rate on its Sell screen than its
 *     Buy screen at the same moment (those screens are GBP; this demo is
 *     USD, so the figures differ while the mechanics match).
 * ASSUMPTION: the sell fee matches the buy fee at 0.9%, which is what
 * both iOS screens state. Change SELL_FEE alone if the real spread is
 * asymmetric.
 * The fee lives INSIDE the quoted rate, so a BUY's cash fee is
 * buyFee(amount) = amount * (1 - 1/1.009), not amount * 0.009. A SELL's
 * fee is charged on the gross proceeds, so sellFee() is exact.
 *
 * REFRESHED 12 Aug 2026 to the 11 Aug prints (Ali: "update our gold and
 * silver values to todays prices, or yesterdays, whichever we can get").
 * 11 Aug is the newest the feed carries, because LBMA publishes one
 * auction price per day in arrears. Gold $4,383.35/oz -> $140.928/g,
 * silver $65.185/oz -> $2.0957/g, from prices.lbma.org.uk
 * (gold_pm.json, silver.json), USD column, divided by OZ. The 10 Aug
 * figures already in the series match that feed exactly, which is how I
 * know the two agree. Appended to EVERY range, so each chart ends on the
 * latest print rather than only the 1M one moving.
 *
 * BOTH METALS ARE [date, USD PER GRAM], from each feed's USD column.
 * This comment used to say silver was GBP per gram converted through
 * GBPUSD, which was true once and had not been updated when that hop was
 * removed: the stored silver rows are and were USD (10 Aug reads 2.0556,
 * which is the feed's USD figure to the cent, not the 1.5227 the GBP
 * column gives). A stale unit note on a price series is the kind of thing
 * that gets a metal mispriced by a factor of 1.35, so it is worth being
 * exact about.
 * One print per day, published with a lag: latest() is the last
 * settled auction, not today.
 */

export type MetalKey = "gold" | "silver";

export const OZ = 31.1034768; // grams per troy ounce

export const GBPUSD = 1.3501; // implied by the 2026-08-11 gold auction row
/* Reference only: it is NOT on the price path any more, since both
   metals are stored in USD. Kept because the onboarding copy quotes a
   sterling figure. */

/** The product's dealing fee, built into every quoted rate. */
export const BUY_FEE = 0.009;
export const SELL_FEE = 0.009;

type PriceRow = [date: string, usdPerG: number];

/** Chart ranges. 5 YEARS IS THE CEILING (Ali) and 1 MONTH IS THE FLOOR:
 *  the app offers 1D and 1W, but LBMA publishes ONE auction price per
 *  day, so anything intraday would be invented. Points are thinned per
 *  range (daily, alternate days, weekly, monthly) because a five-year
 *  daily series is 1,250 points to draw a line nobody reads that
 *  closely, and this module ships inside a shared component. */
export const RANGES = ["1M", "3M", "1Y", "5Y"] as const;
export type Range = (typeof RANGES)[number];

export const RANGE_LABEL: Record<Range, string> = {
  "1M": "1M",
  "3M": "3M",
  "1Y": "1Y",
  "5Y": "5Y",
};

/** LBMA settled auction prices, USD per gram, both metals taken from
 *  the USD column directly (silver used to be stored in GBP and
 *  converted, which added a rounding hop for no reason). */
export const SERIES: Record<MetalKey, Record<Range, PriceRow[]>> = {
  gold: {
    "1M": [
      ["2026-07-10", 131.7907], ["2026-07-13", 129.881], ["2026-07-14", 131.0304],
      ["2026-07-15", 130.6028], ["2026-07-16", 128.3956], ["2026-07-17", 128.4535],
      ["2026-07-20", 128.7171], ["2026-07-21", 130.2845], ["2026-07-22", 133.5896],
      ["2026-07-23", 130.0466], ["2026-07-24", 130.7667], ["2026-07-27", 131.0143],
      ["2026-07-28", 129.3167], ["2026-07-29", 128.6303], ["2026-07-30", 132.1733],
      ["2026-07-31", 129.4582], ["2026-08-03", 129.508], ["2026-08-04", 131.3101],
      ["2026-08-05", 135.2453], ["2026-08-06", 137.2146], ["2026-08-07", 139.3912],
      ["2026-08-10", 139.0343],
      ["2026-08-11", 140.928],
    ],
    "3M": [
      ["2026-05-11", 152.0457], ["2026-05-13", 150.3272], ["2026-05-15", 145.5786],
      ["2026-05-19", 144.5723], ["2026-05-21", 144.8472], ["2026-05-26", 145.1767],
      ["2026-05-28", 142.0886], ["2026-06-01", 143.0483], ["2026-06-03", 142.8972],
      ["2026-06-05", 140.3428], ["2026-06-09", 139.1372], ["2026-06-11", 131.0095],
      ["2026-06-15", 140.0229], ["2026-06-17", 139.5937], ["2026-06-19", 133.4545],
      ["2026-06-23", 132.9594], ["2026-06-25", 128.6609], ["2026-06-29", 129.4534],
      ["2026-07-01", 131.4789], ["2026-07-03", 133.8805], ["2026-07-07", 133.6121],
      ["2026-07-09", 132.7874], ["2026-07-13", 129.881], ["2026-07-15", 130.6028],
      ["2026-07-17", 128.4535], ["2026-07-21", 130.2845], ["2026-07-23", 130.0466],
      ["2026-07-27", 131.0143], ["2026-07-29", 128.6303], ["2026-07-31", 129.4582],
      ["2026-08-04", 131.3101], ["2026-08-06", 137.2146], ["2026-08-10", 139.0343],
      ["2026-08-11", 140.928],
    ],
    "1Y": [
      ["2025-08-11", 107.9108], ["2025-08-18", 107.1391], ["2025-08-26", 108.2548],
      ["2025-09-02", 112.2061], ["2025-09-09", 117.3358], ["2025-09-16", 118.8099],
      ["2025-09-23", 121.652], ["2025-09-30", 122.9863], ["2025-10-07", 127.9278],
      ["2025-10-14", 132.6636], ["2025-10-21", 134.0558], ["2025-10-28", 126.9472],
      ["2025-11-04", 127.0308], ["2025-11-11", 132.5672], ["2025-11-18", 130.5594],
      ["2025-11-25", 132.6684], ["2025-12-02", 135.5074], ["2025-12-09", 134.9688],
      ["2025-12-16", 139.0263], ["2025-12-23", 143.0515], ["2026-01-06", 144.3681],
      ["2026-01-13", 148.6345], ["2026-01-20", 152.6453], ["2026-01-27", 162.8194],
      ["2026-02-03", 158.2122], ["2026-02-10", 161.7633], ["2026-02-17", 156.2992],
      ["2026-02-24", 164.6199], ["2026-03-03", 161.8356], ["2026-03-10", 167.4957],
      ["2026-03-17", 161.2939], ["2026-03-24", 141.8989], ["2026-03-31", 148.1619],
      ["2026-04-09", 153.1211], ["2026-04-16", 154.1178], ["2026-04-23", 151.7242],
      ["2026-04-30", 148.2583], ["2026-05-08", 152.4395], ["2026-05-15", 145.5786],
      ["2026-05-22", 144.8761], ["2026-06-01", 143.0483], ["2026-06-08", 138.9105],
      ["2026-06-15", 140.0229], ["2026-06-22", 134.9351], ["2026-06-29", 129.4534],
      ["2026-07-06", 133.1346], ["2026-07-13", 129.881], ["2026-07-20", 128.7171],
      ["2026-07-27", 131.0143], ["2026-08-03", 129.508], ["2026-08-10", 139.0343],
      ["2026-08-11", 140.928],
    ],
    "5Y": [
      ["2021-08-10", 55.407], ["2021-09-09", 57.4936], ["2021-10-08", 57.0113],
      ["2021-11-08", 58.5899], ["2021-12-07", 57.2717], ["2022-01-12", 58.5594],
      ["2022-02-10", 59.0079], ["2022-03-11", 63.6167], ["2022-04-11", 62.7438],
      ["2022-05-13", 58.2427], ["2022-06-15", 58.6349], ["2022-07-14", 54.6788],
      ["2022-08-12", 57.6174], ["2022-09-13", 54.8122], ["2022-10-13", 52.9876],
      ["2022-11-11", 56.5644], ["2022-12-12", 57.4405], ["2023-01-17", 61.5301],
      ["2023-02-15", 58.8744], ["2023-03-16", 61.8178], ["2023-04-18", 64.2822],
      ["2023-05-19", 63.0669], ["2023-06-20", 62.0654], ["2023-07-19", 63.509],
      ["2023-08-17", 60.9691], ["2023-09-18", 61.842], ["2023-10-17", 61.9931],
      ["2023-11-15", 62.9576], ["2023-12-14", 65.7836], ["2024-01-19", 65.2194],
      ["2024-02-19", 64.8497], ["2024-03-19", 69.2816], ["2024-04-19", 76.5091],
      ["2024-05-21", 78.0395], ["2024-06-20", 75.6057], ["2024-07-19", 77.2743],
      ["2024-08-19", 80.2016], ["2024-09-18", 82.6306], ["2024-10-17", 86.4485],
      ["2024-11-15", 82.6853], ["2024-12-16", 85.3345], ["2025-01-21", 88.0223],
      ["2025-02-19", 94.4219], ["2025-03-20", 97.6788], ["2025-04-22", 110.3912],
      ["2025-05-22", 105.5831], ["2025-06-23", 108.6872], ["2025-07-22", 109.6292],
      ["2025-08-20", 107.533], ["2025-09-19", 117.773], ["2025-10-20", 138.0666],
      ["2025-11-18", 130.5594], ["2025-12-17", 139.6018], ["2026-01-22", 155.354],
      ["2026-02-20", 162.4642], ["2026-03-23", 143.5933], ["2026-04-23", 151.7242],
      ["2026-05-26", 145.1767], ["2026-06-24", 129.3891], ["2026-07-23", 130.0466],
      ["2026-08-10", 139.0343],
      ["2026-08-11", 140.928],
    ],
  },
  silver: {
    "1M": [
      ["2026-07-10", 1.908], ["2026-07-13", 1.8773], ["2026-07-14", 1.8609],
      ["2026-07-15", 1.8631], ["2026-07-16", 1.8165], ["2026-07-17", 1.7776],
      ["2026-07-20", 1.8265], ["2026-07-21", 1.8934], ["2026-07-22", 1.9078],
      ["2026-07-23", 1.886], ["2026-07-24", 1.8752], ["2026-07-27", 1.898],
      ["2026-07-28", 1.8381], ["2026-07-29", 1.8453], ["2026-07-30", 1.8665],
      ["2026-07-31", 1.8559], ["2026-08-03", 1.8636], ["2026-08-04", 1.89],
      ["2026-08-05", 1.9697], ["2026-08-06", 1.9848], ["2026-08-07", 2.0679],
      ["2026-08-10", 2.0556],
      ["2026-08-11", 2.0957],
    ],
    "3M": [
      ["2026-05-11", 2.5849], ["2026-05-13", 2.7873], ["2026-05-15", 2.5315],
      ["2026-05-19", 2.4447], ["2026-05-21", 2.4034], ["2026-05-26", 2.4513],
      ["2026-05-28", 2.3476], ["2026-06-01", 2.4324], ["2026-06-03", 2.3902],
      ["2026-06-05", 2.3359], ["2026-06-09", 2.2055], ["2026-06-11", 2.0511],
      ["2026-06-15", 2.2727], ["2026-06-17", 2.2443], ["2026-06-19", 2.079],
      ["2026-06-23", 1.9995], ["2026-06-25", 1.8443], ["2026-06-29", 1.8553],
      ["2026-07-01", 1.8728], ["2026-07-03", 2.0015], ["2026-07-07", 1.9496],
      ["2026-07-09", 1.8913], ["2026-07-13", 1.8773], ["2026-07-15", 1.8631],
      ["2026-07-17", 1.7776], ["2026-07-21", 1.8934], ["2026-07-23", 1.886],
      ["2026-07-27", 1.898], ["2026-07-29", 1.8453], ["2026-07-31", 1.8559],
      ["2026-08-04", 1.89], ["2026-08-06", 1.9848], ["2026-08-10", 2.0556],
      ["2026-08-11", 2.0957],
    ],
    "1Y": [
      ["2025-08-11", 1.2139], ["2025-08-18", 1.2245], ["2025-08-26", 1.2352],
      ["2025-09-02", 1.3027], ["2025-09-09", 1.3261], ["2025-09-16", 1.3725],
      ["2025-09-23", 1.4251], ["2025-09-30", 1.4846], ["2025-10-07", 1.5577],
      ["2025-10-14", 1.6564], ["2025-10-21", 1.6058], ["2025-10-28", 1.4931],
      ["2025-11-04", 1.5355], ["2025-11-11", 1.6474], ["2025-11-18", 1.6172],
      ["2025-11-25", 1.6463], ["2025-12-02", 1.8467], ["2025-12-09", 1.885],
      ["2025-12-16", 2.0249], ["2025-12-23", 2.2422], ["2026-01-02", 2.3861],
      ["2026-01-09", 2.5123], ["2026-01-16", 2.9193], ["2026-01-23", 3.1829],
      ["2026-01-30", 3.3176], ["2026-02-06", 2.4094], ["2026-02-13", 2.4869],
      ["2026-02-20", 2.5883], ["2026-02-27", 2.8928], ["2026-03-06", 2.6473],
      ["2026-03-13", 2.6909], ["2026-03-20", 2.3267], ["2026-03-27", 2.1797],
      ["2026-04-07", 2.3182], ["2026-04-14", 2.4893], ["2026-04-21", 2.5401],
      ["2026-04-28", 2.3531], ["2026-05-06", 2.4954], ["2026-05-13", 2.7873],
      ["2026-05-20", 2.4322], ["2026-05-28", 2.3476], ["2026-06-04", 2.3624],
      ["2026-06-11", 2.0511], ["2026-06-18", 2.1782], ["2026-06-25", 1.8443],
      ["2026-07-02", 1.9175], ["2026-07-09", 1.8913], ["2026-07-16", 1.8165],
      ["2026-07-23", 1.886], ["2026-07-30", 1.8665], ["2026-08-06", 1.9848],
      ["2026-08-10", 2.0556],
      ["2026-08-11", 2.0957],
    ],
    "5Y": [
      ["2021-08-10", 0.752], ["2021-09-09", 0.7763], ["2021-10-08", 0.725],
      ["2021-11-08", 0.7806], ["2021-12-07", 0.7213], ["2022-01-10", 0.7219],
      ["2022-02-08", 0.735], ["2022-03-09", 0.8415], ["2022-04-07", 0.7838],
      ["2022-05-11", 0.7004], ["2022-06-13", 0.6932], ["2022-07-12", 0.6065],
      ["2022-08-10", 0.657], ["2022-09-09", 0.6033], ["2022-10-11", 0.6236],
      ["2022-11-09", 0.6855], ["2022-12-08", 0.7297], ["2023-01-11", 0.7674],
      ["2023-02-09", 0.7223], ["2023-03-10", 0.6459], ["2023-04-12", 0.8084],
      ["2023-05-15", 0.7681], ["2023-06-14", 0.766], ["2023-07-13", 0.78],
      ["2023-08-11", 0.7295], ["2023-09-12", 0.7363], ["2023-10-11", 0.7096],
      ["2023-11-09", 0.725], ["2023-12-08", 0.7649], ["2024-01-11", 0.7404],
      ["2024-02-09", 0.7284], ["2024-03-11", 0.783], ["2024-04-11", 0.9007],
      ["2024-05-13", 0.9042], ["2024-06-12", 0.9446], ["2024-07-11", 0.9972],
      ["2024-08-09", 0.8866], ["2024-09-10", 0.9142], ["2024-10-09", 0.9865],
      ["2024-11-07", 1.0], ["2024-12-06", 1.0002], ["2025-01-09", 0.9737],
      ["2025-02-07", 1.0377], ["2025-03-10", 1.0451], ["2025-04-08", 0.9746],
      ["2025-05-12", 1.0295], ["2025-06-11", 1.1639], ["2025-07-10", 1.1835],
      ["2025-08-08", 1.2311], ["2025-09-09", 1.3261], ["2025-10-08", 1.5755],
      ["2025-11-06", 1.5653], ["2025-12-05", 1.8681], ["2026-01-08", 2.4179],
      ["2026-02-06", 2.4094], ["2026-03-09", 2.6828], ["2026-04-09", 2.3816],
      ["2026-05-11", 2.5849], ["2026-06-10", 2.0724], ["2026-07-09", 1.8913],
      ["2026-08-07", 2.0679], ["2026-08-10", 2.0556],
      ["2026-08-11", 2.0957],
    ],
  },
};

/** The rows for a metal over a range, oldest first. */
export function series(asset: MetalKey, range: Range = "1M"): PriceRow[] {
  return SERIES[asset][range] ?? SERIES[asset]["1M"];
}

/** Most recent settled price: { date, usdPerG, usdPerOz }. */
export function latest(asset: MetalKey) {
  const rows = SERIES[asset]["1M"];
  const [date, usdPerG] = rows[rows.length - 1];
  return { date, usdPerG, usdPerOz: usdPerG * OZ };
}

export type MetalUnit = "g" | "oz";
export type TradeDirection = "buy" | "sell";

/** USD balance -> quantity at the latest price, in "g" or "oz". */
export function toQty(usd: number, asset: MetalKey, unit: MetalUnit): number {
  const grams = usd / latest(asset).usdPerG;
  return unit === "oz" ? grams / OZ : grams;
}

/**
 * "47.7350 g" / "1.5347 oz" formatting for every quantity in the app.
 *
 * FOUR DECIMAL PLACES EVERYWHERE (Ali, 11 Aug: "It should be 4dp
 * everywhere"). It used to be 2dp, which had two costs. Figures stopped
 * adding up on screen: the per-vault breakdown rounded each slice
 * independently to 23.87 + 14.32 + 9.55 against a 47.73 total. And it was
 * too coarse for the fraction of a gram a small order buys, which is why
 * TradeFlow had grown its OWN 4dp formatter beside this one. 4dp is what
 * the activity rows always showed (+59.8778 g), so this makes one
 * precision for the whole app instead of three.
 *
 * No `dp` parameter on purpose: a knob here is how the app ended up with
 * different precisions in different places. If one surface ever genuinely
 * needs a coarser figure, round the VALUE at that call site so the
 * intent is visible there.
 */
export function fmtQty(n: number, unit: MetalUnit): string {
  return `${n.toLocaleString("en-US", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  })} ${unit}`;
}

/** Quantity -> USD at the MARKET rate. */
export function toUsd(qty: number, asset: MetalKey, unit: MetalUnit): number {
  const grams = unit === "oz" ? qty * OZ : qty;
  return grams * latest(asset).usdPerG;
}

/** The market rate per `unit` — no fee. */
export function marketRate(asset: MetalKey, unit: MetalUnit): number {
  const l = latest(asset);
  return unit === "oz" ? l.usdPerOz : l.usdPerG;
}

/** What you pay per unit when buying: market +0.9%. */
export function buyRate(asset: MetalKey, unit: MetalUnit): number {
  return marketRate(asset, unit) * (1 + BUY_FEE);
}

/** What you receive per unit when selling: market -0.9%. */
export function sellRate(asset: MetalKey, unit: MetalUnit): number {
  return marketRate(asset, unit) * (1 - SELL_FEE);
}

/** The quoted rate for a direction. */
export function rateFor(
  direction: TradeDirection,
  asset: MetalKey,
  unit: MetalUnit,
): number {
  return direction === "sell" ? sellRate(asset, unit) : buyRate(asset, unit);
}

/** The cash fee on a SELL of `qty`: charged on the gross proceeds. */
export function sellFee(qty: number, asset: MetalKey, unit: MetalUnit): number {
  if (!Number.isFinite(qty) || qty <= 0) return 0;
  return qty * marketRate(asset, unit) * SELL_FEE;
}

/** Quantity sold -> USD proceeds after the fee. */
export function sellProceeds(qty: number, asset: MetalKey, unit: MetalUnit): number {
  return qty * sellRate(asset, unit);
}

/** USD proceeds wanted -> quantity that must be sold. */
export function sellQty(usd: number, asset: MetalKey, unit: MetalUnit): number {
  return usd / sellRate(asset, unit);
}

/** The cash fee inside a BUY. The fee lives in the rate, so this is
 *  usd * (1 - 1/1.009), not usd * 0.009. */
export function buyFee(usd: number): number {
  if (!Number.isFinite(usd) || usd <= 0) return 0;
  return usd * (1 - 1 / (1 + BUY_FEE));
}

/** USD -> quantity at the DEALING rate (what an order actually buys). */
/** Alias kept for pre-sell call sites. */
export function feeOn(usd: number): number {
  return buyFee(usd);
}

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
  SERIES,
  RANGES,
  RANGE_LABEL,
  series,
  BUY_FEE,
  SELL_FEE,
  latest,
  marketRate,
  sellRate,
  rateFor,
  sellFee,
  sellProceeds,
  sellQty,
  toQty,
  toUsd,
  buyRate,
  buyFee,
  feeOn,
  buyQty,
  buyCost,
  fmtQty,
  toOunces,
  fmtOz,
};
