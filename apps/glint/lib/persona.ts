"use client";

/**
 * Glint demo persona, ported from the Studio shared component "Persona"
 * (cmsnajawrulypm): the single source of truth for WHO the demo user
 * is, what they hold, and what they've done. The main persona is a
 * CONSTRUCTION COMPANY (CEO request, 10 Aug 2026): Ridgeline
 * Construction holding treasury in gold and silver via Glint. One
 * persona for now; add records to PERSONAS and swap DEFAULT_PERSONA
 * when the demo needs more. The cash asset displays as "USD" but its
 * KEY stays "fiat" so stored balance overrides survive the rename.
 * Both metals display in GRAMS (Ali, 11 Aug): mixing units across the
 * balance cards read as a bug. Flip a value to "oz" if a metal
 * should differ. Account identifiers (labels, last four, routing
 * numbers, institutions) live in lib/accounts.ts, so a number changes
 * in one place. This file MIRRORS the Studio shared component: a change
 * here needs the same change there, or the next promoted screen fights
 * the app.
 *
 * WHICH WALLETS A ROW MOVES, and how a wallet screen filters (Ali,
 * 11 Aug):
 *   account         the wallet the row BELONGS to, and the wallet whose
 *                   screen leads with it. An exchange belongs to the
 *                   metal it acquired or released, so a USD-to-Gold buy
 *                   is account "gold". Every row has one.
 *   counterAccount  the OTHER wallet the row moved, when there is one.
 *                   Every exchange here is paid from or into the USD
 *                   wallet, so all five carry counterAccount "fiat".
 *                   The two deposits have none: that money came from
 *                   outside Glint.
 * So a wallet screen is an EQUALITY CHECK, which is the whole point of
 * storing the key: gold is account === "gold" (4 rows), silver is
 * account === "silver" (1 row), and USD is account === "fiat" ||
 * counterAccount === "fiat" (all 7). activityFor(account) IS that
 * filter, kept here so the three wallet screens cannot drift apart.
 * WHY THE SECOND LEG EXISTS: filtering USD on account alone shows the
 * two deposits and hides the Direct Gold conversions that spent them,
 * which is the story of that wallet, and it would leave the activity
 * table's Money in / Money out tabs testing the sign of a figure whose
 * other half is missing. Filtering on `metal` instead cannot express
 * the cash wallet AT ALL, because fiat rows have metal null. A row that
 * leaves USD out entirely, a gold-to-silver swap or a card payment
 * settled from metal, correctly drops off the USD screen: that is why
 * this is a wallet key and not a "has a cash leg" boolean.
 *
 * NO SUBTITLE ON A ROW: the field exists on the type and the detail
 * sheet still falls back to it, but no row sets one. The table composes
 * the second line from txMethodLabel + txPlace, so a stored subtitle of
 * "Market order" only repeated the method sitting next to it.
 *
 * BALANCES ARE REACTIVE: useBalance("gold") reads a FlowStore override
 * (key `bal.<asset>`) falling back to the persona default, so a future
 * Buy Gold / Sell Silver flow calls the setter and every subscribed
 * card re-renders. The landing's Start reset also restores defaults.
 *
 * VAULTS (Ali, 11 Aug): each METAL balance carries a per-vault
 * breakdown, every metal activity row names the vault it settled in,
 * and preferences.vault is the vault a new purchase lands in. The vault
 * directory itself, the three ids and the label helpers, lives in
 * lib/accounts.ts; this file only ever stores an id.
 *
 * THE INVARIANT, and its limit. Each metal's vault figures SUM EXACTLY
 * to that metal's balance: 3318.40 + 1991.04 + 1327.36 = 6636.80 for
 * gold, 1193.66 + 1044.45 + 746.04 = 2984.15 for silver, both in USD,
 * the unit `amount` is stored in. That is the ONLY arithmetic these
 * figures satisfy. They do not reconcile against the five metal
 * activity rows, and they are not meant to: a balance here is a stated
 * standing position, while the activity is a recent window that opens
 * partway through the account's life and carries no running vault
 * total. So do not "fix" the balances to match the rows. Worth knowing
 * before trying: the four gold rows move 98.6569 g between them, more
 * metal than $6,636.80 represents at Market's price, so there is no
 * adjustment that makes the two agree in either direction.
 * WHAT A REAL RECONCILIATION WOULD NEED, if it is ever wanted: an
 * opening per-vault position per metal; the complete row history from
 * that opening rather than a five-row window; and a stated rule for
 * turning a row's grams into the USD a balance is quoted in, because a
 * row settles at its own execution rate while a balance is marked at
 * today's price. With those three, balances would be DERIVED from the
 * rows and this block would describe a computation, not an invariant.
 *
 * ACTIVITY: the persona's transaction rows, shared by the Dashboard's
 * recent list and /activity's filtered views. Static for now; appended
 * rows will ride a FlowStore key when Buy/Sell flows land. The figures
 * RECONCILE against Market's LBMA prices and its 0.9% fee, so a row's
 * rate, quantity, fee and cash actually agree: every gold rate of
 * 140.2856 is 139.0343 x 1.009, and the silver sell's 2.0371 is
 * 2.0556 x 0.991. Change a price in lib/market.ts and these rows stop
 * reconciling. See the note above the rows: that has already happened
 * once to silver, and the note carries the re-derivation.
 */

import { getFlowField, useFlowField } from "@/lib/flow-store";
import { accountLabel, type VaultId } from "@/lib/accounts";

export type AssetKey = "gold" | "silver" | "fiat";

/** How much of a metal sits in ONE vault, in USD, the same unit as the
 *  parent balance's `amount`. An entity pair, never a rendered line: the
 *  id composes through Accounts.vaultLabel / vaultLocation at display,
 *  so the same record serves a chip, a table cell and a detail panel. */
export interface VaultBalance {
  vault: VaultId;
  amount: number;
}

export interface BalanceMeta {
  label: string;
  amount: number;
  account: string;
  /**
   * Where this balance physically sits, split by vault. Present on the
   * METALS only, which is why it is optional rather than required: see
   * the note on the fiat balance for why cash has none. The figures sum
   * exactly to `amount`; the header block explains what that invariant
   * does and does not promise.
   */
  vaults?: VaultBalance[];
}

export type TxKind = "exchange-buy" | "exchange-sell" | "spend" | "deposit";
export type TxType = "exchange" | "card" | "deposit" | "withdrawal";
export type TxStatus = "completed" | "pending" | "failed" | "reversed";
export type TxMethod = "market-order" | "direct-gold" | "card" | "wire" | "ach";

/** One row of activity. Rich enough to drive both the table and the
 *  transaction detail view, which is the shape the real app shows:
 *  description, amount in metal AND cash, type, rate, status. */
export interface ActivityRow {
  /** Stable id. DataView keys rows on String(row.id), so it must be
   *  present and unique or the active row collides across rows. */
  id: string;
  kind: TxKind;
  /** Row title, and the detail view's Description. Card rows carry the
   *  acquirer string exactly as the network sends it. */
  description: string;
  /** Second line: the merchant locality, or how the order was placed. */
  subtitle?: string;
  /** ISO 8601, NOT a display string: the table sorts on the raw value,
   *  and ISO sorts lexicographically the same way it sorts in time. */
  timestamp: string;
  /** Where the merchant is. Stored as parts, never "Denver, USA":
   *  the row composes them, so a table can show one and a detail view
   *  can show both. */
  merchant?: { city: string; country: string };
  /** Signed grams of metal moved; null for cash-only rows. */
  metalAmount: number | null;
  metal: "gold" | "silver" | null;
  /** Signed USD. Negative is money out. Always present. */
  fiatAmount: number;
  /** USD per gram at execution; null for cash-only rows. */
  rate: number | null;
  type: TxType;
  status: TxStatus;
  /** The wallet this row BELONGS to, and the wallet whose screen leads
   *  with it. An exchange belongs to the metal it acquired or released,
   *  so a USD-to-Gold buy is "gold". Required: every row has one, which
   *  is what makes a wallet screen an equality check. */
  account: AssetKey;
  /** The OTHER wallet the row moved, when there is one. Every exchange
   *  here is paid from or into the USD wallet, so all five carry "fiat";
   *  the two deposits carry nothing, because that money came from
   *  outside Glint. */
  counterAccount?: AssetKey;
  /** The vault the metal settled in. Typed as the VaultId from
   *  lib/accounts so the three ids are defined in exactly one place, and
   *  OPTIONAL because the two cash deposits have none: dollars are not
   *  in a vault, the same reasoning as the fiat balance. A stored id,
   *  never a display string, so composition stays at render:
   *  Accounts.vaultLabel(row.vault) in a cell, vaultLocation in a sheet.
   *  Present on every row whose `metal` is non-null, which makes
   *  "metal row" and "has a vault" the same set today; keep the field
   *  optional anyway, because a future cash withdrawal or a card row
   *  settled from metal would need to opt out or in on its own. */
  vault?: VaultId;
  method: TxMethod;
  /** The instrument, when the method is a card. Name and last four are
   *  separate fields, composed for display. */
  card?: { name: string; last4: string };
  fee?: number;
  feeNote?: string;
  reference?: string;
}

export const TX_TYPE_LABEL: Record<TxType, string> = {
  exchange: "Exchange",
  card: "Card payment",
  deposit: "Deposit",
  withdrawal: "Withdrawal",
};

export const TX_METHOD_LABEL: Record<TxMethod, string> = {
  "market-order": "Market order",
  /* Direct Gold: money landing in the USD wallet is converted to metal
     automatically, so a deposit is followed by a purchase the customer
     did not place by hand. Driven by the autoInvest preference. */
  "direct-gold": "Direct Gold",
  card: "Card",
  wire: "Wire transfer",
  ach: "ACH",
};

export const TX_STATUS_LABEL: Record<TxStatus, string> = {
  completed: "Completed",
  pending: "Pending",
  failed: "Failed",
  reversed: "Reversed",
};

/** "+7.1283 g" / "-0.1597 g" */
export function fmtGrams(n: number): string {
  return `${n < 0 ? "-" : "+"}${Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  })} g`;
}

/** Split so a cell can stack the day over the time, or join them. */
export function fmtTxDate(iso: string) {
  const d = new Date(iso);
  const day = d.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return { day, time, full: `${day} at ${time}` };
}

/** The method as shown: the card instrument when there is one, else
 *  the plain method label. Composed here so no screen concatenates. */
export function txMethodLabel(row: ActivityRow): string {
  if (row.card) return `${row.card.name} ··${row.card.last4}`;
  return TX_METHOD_LABEL[row.method];
}

/** Where a card transaction happened, composed from its parts. */
export function txPlace(row: ActivityRow): string {
  if (!row.merchant) return "";
  return [row.merchant.city, row.merchant.country].filter(Boolean).join(", ");
}

/** "1 g = $140.2856" */
export function fmtRate(rate: number): string {
  return `1 g = $${rate.toLocaleString("en-US", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  })}`;
}

export type MetalUnit = "g" | "oz";
export type AutoInvest = "none" | "gold" | "silver";

/** Flat, namespaced preference keys: display units per metal, the
 *  autoInvest behaviour a USD deposit triggers, and the default vault
 *  (the last two are data only until the deposit and purchase flows
 *  consume them). */
export interface PersonaPreferences {
  "unit.gold": MetalUnit;
  "unit.silver": MetalUnit;
  autoInvest: AutoInvest;
  /** The vault a NEW purchase lands in. Exactly the standing autoInvest
   *  has: a stored default the purchase flow reads to prefill its vault
   *  field, reactive through usePreference("vault") so a demo can change
   *  it live and the next order follows without a reload. It is not a
   *  filter and it says nothing about where the metal already held sits:
   *  that is the per-balance `vaults` breakdown, and the two can
   *  disagree, which is the normal state after a customer switches. */
  vault: VaultId;
}

/** The applying business. Every value is a wizard option VALUE or a
 *  string in the exact format the matching input stores, so it can drop
 *  straight into a FlowStore fallback with no transformation. State
 *  codes are LOWERCASE (step7 does STATE_LABELS[value]; "CO" misses and
 *  silently reads as Delaware) and dates are MM/DD/YYYY (step2's
 *  DatePicker splits on "/" and anything else is an Invalid Date). */
export interface PersonaCompany {
  legalName: string;
  dba: string;
  usesDba: boolean;
  entityType: "smllc" | "mmllc" | "partnership" | "corporation";
  formationState: string;
  formationDate: string;
  ein: string;
  address: { street: string; city: string; state: string; zip: string };
  industry: string;
  email: string;
  phone: string;
  cell: string;
  website: string;
  employees: string;
  revenue: string;
}

/** The human filling the application in. */
export interface PersonaApplicant {
  first: string;
  last: string;
  middle: string;
  email: string;
  mobile: string;
  role: string;
  title: string;
  dob: string;
  ssn: string;
  citizenship: string;
  taxResidence: string;
  twoFactor: string;
  hasPersonalAccount: boolean;
  address: { street: string; city: string; state: string; zip: string };
}

export interface PersonaRecord {
  id: string;
  owner: string;
  business: string;
  businessMeta: string;
  account: string;
  company: PersonaCompany;
  applicant: PersonaApplicant;
  preferences: PersonaPreferences;
  balances: Record<AssetKey, BalanceMeta>;
  activity: ActivityRow[];
}

export const PERSONAS: Record<string, PersonaRecord> = {
  ridgeline: {
    id: "ridgeline",
    owner: "Wade",
    business: "Ridgeline Construction",
    businessMeta: "Business account",
    account: "WJ",
    /* The applying business. The invented values are UNISSUABLE on
       purpose, the same trick as the 00-prefixed routing numbers: an
       EIN prefix of 00 has never been issued by the IRS, SSN area 000
       has never been issued by the SSA, and 555-01xx is the reserved
       fictional telephone block. None can collide with a real
       company or person. Keep in sync with the Studio Persona. */
    company: {
      legalName: "Ridgeline Construction LLC",
      dba: "Ridgeline Builders",
      usesDba: false,
      entityType: "smllc",
      formationState: "co",
      formationDate: "04/18/2016",
      ein: "00-3184627",
      address: {
        street: "1180 Quarry Ridge Road",
        city: "Denver",
        state: "co",
        zip: "80223",
      },
      industry: "construction",
      email: "hello@ridgelineconstruction.com",
      phone: "(303) 555-0148",
      cell: "(303) 555-0192",
      website: "ridgelineconstruction.com",
      employees: "25-99",
      revenue: "1m-10m",
    },
    applicant: {
      first: "Wade",
      last: "Jones",
      middle: "",
      email: "wade@ridgelineconstruction.com",
      mobile: "(303) 555-0166",
      role: "owner",
      title: "Managing Member",
      dob: "06/14/1984",
      ssn: "000-55-0142",
      citizenship: "us",
      taxResidence: "us",
      twoFactor: "sms",
      hasPersonalAccount: false,
      address: {
        street: "2214 Bluestem Lane",
        city: "Golden",
        state: "co",
        zip: "80401",
      },
    },
    preferences: {
      "unit.gold": "g",
      "unit.silver": "g",
      autoInvest: "gold",
      /* Zurich is where a new purchase lands. It is also this persona's
         largest holding in both metals, so the default reads as the
         habit rather than as an arbitrary pick. */
      vault: "zurich",
    },
    balances: {
      /* The vault splits are ordered LARGEST FIRST, so a list, a chip
         row or a stacked bar renders in that order without sorting at
         the call site. Each metal's three figures sum exactly to the
         `amount` above them; the header block has the arithmetic and,
         more importantly, the limits of what that sum proves. */
      gold: {
        label: "Gold",
        amount: 6636.8,
        account: accountLabel("gold"),
        vaults: [
          { vault: "zurich", amount: 2891.44 },
          { vault: "miami", amount: 2410.63 },
          { vault: "saltlake", amount: 1334.73 },
        ],
      },
      silver: {
        label: "Silver",
        amount: 2984.15,
        account: accountLabel("silver"),
        /* ONE VAULT (Ali, 11 Aug: "we wouldnt always have it in multiple
           vaults, maybe silver could just have it in Salt Lake City").
           It also fits the history: the 6 Aug sale of 510 g came out of
           MIAMI, which closed that position, and the holding that remains
           sits in Salt Lake City. So the breakdown reads as the result of
           what the activity list shows rather than a tidy allocation.
           Worth keeping as the single-entry case: it is what proves the
           vault table renders one row, at 100%, with no divider under it. */
        vaults: [{ vault: "saltlake", amount: 2984.15 }],
      },
      /* NO VAULTS ON CASH, and this is a decision rather than an
         oversight: the dollars sit in the Sutton Bank checking account,
         which is a deposit account and not a custody position, so there
         is no vault to name. Giving all three balances the same shape is
         the tidy-looking wrong move: it would put cash somewhere it
         cannot be and invite a screen to print "Zurich" under a routing
         number. vaultsFor("fiat") returns an empty array for exactly
         this reason, so a caller mapping all three assets needs no
         special case. */
      fiat: { label: "USD", amount: 1842.6, account: accountLabel("fiat") },
    },
    /* Figures are consistent with Market's LBMA prices and its 0.9% fee,
       so a row's rate, quantity, fee and cash actually reconcile. The old
       rows were priced at roughly $86/g and no longer matched anything
       the product quotes.
       ASSUMPTION, verified 11 Aug: the four gold rows still reconcile
       against Market's latest print, 139.0343 x 1.009 = 140.2856, and
       every buy fee is amount * (1 - 1/1.009). The SILVER row WAS priced
       off 2.0569, the figure Market carried while its silver history was
       GBP per gram converted through GBPUSD at read time. Market now
       stores silver as USD per gram direct, so 2.0569 exists nowhere in
       the product any more, and the row is re-derived off the latest
       settled print, 2.0556 on 10 Aug:
         sell rate  2.0556 x 0.991          = 2.0371
         proceeds   510 x 2.0370996         = 1038.92
         fee        510 x 2.0556 x 0.009    = 9.44, unchanged
       WHY THE ROW TRACKS TODAY'S PRINT AT ALL, given a rate is the price
       at EXECUTION on 6 Aug and not a live quote: these rows exist so a
       reviewer can check every figure against Market in one pass, and a
       number derived from a price the app no longer holds cannot be
       checked. Re-derive again whenever a Market price moves. */
    activity: [
      {
        id: "tx-20260811-1110",
        kind: "exchange-buy",
        description: "Exchange USD to Gold",
        timestamp: "2026-08-11T11:10:00",
        metalAmount: 7.1283,
        metal: "gold",
        fiatAmount: -1000,
        rate: 140.2856,
        type: "exchange",
        status: "completed",
        account: "gold",
        counterAccount: "fiat",
        /* Every metal row names a vault. On a BUY that is where the
           metal landed; on the sell below it is where it left from, so
           the field reads as "which vault this row touched" rather than
           as a direction. The cash deposits carry none. */
        vault: "zurich",
        method: "market-order",
        fee: 8.92,
        reference: "GX-4471-0083",
      },
      {
        id: "tx-20260806-1542",
        kind: "exchange-sell",
        description: "Exchange Silver to USD",
        timestamp: "2026-08-06T15:42:00",
        metalAmount: -510,
        metal: "silver",
        fiatAmount: 1038.92,
        rate: 2.0371,
        type: "exchange",
        status: "completed",
        account: "silver",
        counterAccount: "fiat",
        /* A sell, so the 510 g left Miami. */
        vault: "miami",
        method: "market-order",
        fee: 9.44,
        reference: "GX-4390-0117",
      },
      {
        id: "tx-20260811-1420",
        kind: "deposit",
        description: "Deposit to USD",
        timestamp: "2026-08-11T14:20:00",
        metalAmount: null,
        metal: null,
        fiatAmount: 8400,
        rate: null,
        type: "deposit",
        status: "completed",
        /* No counterAccount: the money came from outside Glint. And no
           vault, because a vault holds metal: these dollars landed in
           the Sutton Bank checking account. */
        account: "fiat",
        method: "wire",
        reference: "WT-2026-08-0551",
      },
      {
        /* The Direct Gold half of the wire above, one minute later: the
           deposit landed and autoInvest converted it without the
           customer placing an order. The pair is the feature demo, and
           the id carries that minute so it cannot drift from the
           timestamp. */
        id: "tx-20260811-1421-dg",
        kind: "exchange-buy",
        description: "Exchange USD to Gold",
        timestamp: "2026-08-11T14:21:00",
        metalAmount: 59.8778,
        metal: "gold",
        fiatAmount: -8400,
        rate: 140.2856,
        type: "exchange",
        status: "completed",
        account: "gold",
        counterAccount: "fiat",
        /* Direct Gold buys land in preferences.vault, which is Zurich:
           the customer placed no order, so there was no per-order vault
           choice to make and the standing default is what applied. */
        vault: "zurich",
        method: "direct-gold",
        fee: 74.93,
        reference: "DG-2026-08-0551",
      },
      {
        id: "tx-20260802-1015",
        kind: "exchange-buy",
        description: "Exchange USD to Gold",
        timestamp: "2026-08-02T10:15:00",
        metalAmount: 8.8402,
        metal: "gold",
        fiatAmount: -1240.15,
        rate: 140.2856,
        type: "exchange",
        status: "completed",
        account: "gold",
        counterAccount: "fiat",
        /* Salt Lake City on this one, so the demo has a row that is not
           the default vault: a hand-placed order can pick any of the
           three, and a screen that only ever showed Zurich would hide
           the fact that the field varies. */
        vault: "saltlake",
        method: "market-order",
        fee: 11.06,
        reference: "GX-4318-0092",
      },
      {
        id: "tx-20260801-0741",
        kind: "deposit",
        description: "Deposit to USD",
        timestamp: "2026-08-01T07:41:00",
        metalAmount: null,
        metal: null,
        fiatAmount: 3200,
        rate: null,
        type: "deposit",
        status: "completed",
        /* Cash again, so neither a counterAccount nor a vault. */
        account: "fiat",
        method: "ach",
        reference: "AC-2026-08-0117",
      },
      {
        /* The Direct Gold half of the ACH above. */
        id: "tx-20260801-0742-dg",
        kind: "exchange-buy",
        description: "Exchange USD to Gold",
        timestamp: "2026-08-01T07:42:00",
        metalAmount: 22.8106,
        metal: "gold",
        fiatAmount: -3200,
        rate: 140.2856,
        type: "exchange",
        status: "completed",
        account: "gold",
        counterAccount: "fiat",
        /* Direct Gold again, so the standing default vault again. */
        vault: "zurich",
        method: "direct-gold",
        fee: 28.54,
        reference: "DG-2026-08-0117",
      },
    ],
  },
};

export const DEFAULT_PERSONA = PERSONAS.ridgeline;

/** $1,234.56 formatting for balances and activity amounts. */
export function fmtMoney(n: number): string {
  return `$${Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Signed variant for activity rows: -$310.20 / +$1,050.00. The sign is
 *  an ASCII hyphen, the character the function actually emits. */
export function fmtSigned(n: number): string {
  return `${n < 0 ? "-" : "+"}${fmtMoney(n)}`;
}

/** Every row that moves a wallet, either side. The filter each wallet
 *  screen uses, kept here so the three screens cannot drift apart:
 *  gold and silver match on `account` alone, USD picks up the second leg
 *  of every exchange through `counterAccount`. */
export function activityFor(account: AssetKey): ActivityRow[] {
  return DEFAULT_PERSONA.activity.filter(
    (tx) => tx.account === account || tx.counterAccount === account,
  );
}

/**
 * An asset's per-vault breakdown, in USD, largest vault first.
 *
 * RETURNS AN EMPTY ARRAY FOR "fiat" rather than throwing, and that is
 * the contract, not a lenient fallback: cash genuinely has no vaults
 * (see the note on the fiat balance), so a caller mapping over all three
 * assets should render nothing for the cash one instead of guarding
 * first. `vaultsFor(asset).length > 0` is therefore the honest test for
 * "does this asset sit in vaults". It also returns empty for any future
 * metal balance whose splits have not been filled in, which is the same
 * answer for the same reason: we do not know of any vault holding.
 *
 * The figures are the PERSONA DEFAULTS and do not track the reactive
 * useBalance override, so a trade that moves `bal.gold` leaves this
 * breakdown where it was and the two stop summing. That is acceptable
 * while the balances are static; when the purchase flow starts crediting
 * preferences.vault it will need per-vault FlowStore keys, and this
 * helper becomes the fallback underneath them.
 */
export function vaultsFor(asset: AssetKey): VaultBalance[] {
  return DEFAULT_PERSONA.balances[asset].vaults ?? [];
}

/** The applicant's full name, the form the wizard asks for. Composed
 *  from the parts, so no screen concatenates first and last itself. */
export function fullName(): string {
  return [DEFAULT_PERSONA.applicant.first, DEFAULT_PERSONA.applicant.last]
    .filter(Boolean)
    .join(" ");
}

/** Reactive balance for an asset: [amount, setAmount]. */
export function useBalance(asset: AssetKey) {
  return useFlowField<number>(
    `bal.${asset}`,
    DEFAULT_PERSONA.balances[asset].amount,
  );
}

/** Non-subscribing read (mirrors FlowStore.get). */
export function getBalance(asset: AssetKey): number {
  return getFlowField(`bal.${asset}`, DEFAULT_PERSONA.balances[asset].amount);
}

/** Reactive preference (e.g. "unit.gold", "autoInvest"): [value, set].
 *  Reads the FlowStore override (key `pref.<key>`), falls back to the
 *  persona default, so a future settings screen can flip units or
 *  autoInvest and every surface follows. */
export function usePreference<K extends keyof PersonaPreferences>(key: K) {
  return useFlowField<PersonaPreferences[K]>(
    `pref.${key}`,
    DEFAULT_PERSONA.preferences[key],
  );
}

/** Non-subscribing preference read. */
export function getPreference<K extends keyof PersonaPreferences>(
  key: K,
): PersonaPreferences[K] {
  return getFlowField(`pref.${key}`, DEFAULT_PERSONA.preferences[key]);
}

/** Namespace mirroring the Studio statics pattern (Persona.useBalance
 *  etc.), so promoted screens keep working with minimal edits. It must
 *  carry EVERY static the Studio component exposes: a screen promoted
 *  with Persona.fmtGrams or Persona.TX_STATUS_LABEL[row.status] in it
 *  reads undefined off a short namespace and throws at render, which
 *  looks like a broken screen rather than a missing key. App code should
 *  prefer the named exports above; this is the promotion seam. */
export const Persona = {
  ALL: PERSONAS,
  DEFAULT: DEFAULT_PERSONA,
  useBalance,
  getBalance,
  usePreference,
  getPreference,
  fmtMoney,
  fmtSigned,
  fmtGrams,
  fmtTxDate,
  fmtRate,
  txMethodLabel,
  txPlace,
  activityFor,
  vaultsFor,
  fullName,
  TX_METHOD_LABEL,
  TX_TYPE_LABEL,
  TX_STATUS_LABEL,
};
