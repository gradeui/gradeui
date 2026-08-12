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
/** The two assets that sit in vaults. */
export type MetalAsset = "gold" | "silver";

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
      /* SALT LAKE CITY is where a new purchase lands (Ali, 12 Aug: "I
         also want the default vault to be Salt Lake City"). It is the
         only vault holding silver, and it is where the most recent Direct
         Gold conversion went, so a new order landing there reads as the
         current habit. NOTE the gold slices still have Salt Lake City
         smallest at 20.1%: that is history, not the default, but it does
         mean the default vault is this persona's smallest gold holding. */
      vault: "saltlake",
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
          /* SALT LAKE CITY IS THE MAIN VAULT (Ali, 12 Aug: "Salt lake
             City should be the main vault here, not Zurich"). The same
             three uneven figures, reassigned: the standing default vault
             is Salt Lake City and the two most recent Direct Gold
             conversions landed there, so it holding the most is the story
             the activity list already tells. Zurich keeps second place
             because the 1 Aug conversion, under the older default, went
             there. Sum is unchanged and still exactly the gold balance. */
          { vault: "saltlake", amount: 2891.44 },
          { vault: "zurich", amount: 2410.63 },
          { vault: "miami", amount: 1334.73 },
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
        /* SALT LAKE CITY (Ali, 12 Aug: "the last Direct Gold purchase
           [should] be Salt Lake City"). Direct Gold buys land in
           preferences.vault, and that default is now Salt Lake City, so
           this row and the preference agree: the customer placed no
           order, so there was no per-order choice to make.
           The 1 Aug Direct Gold row a few entries down still reads
           Zurich, deliberately: it predates the change of default, which
           is what a standing preference looks like in a history. */
        vault: "saltlake",
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
        /* Direct Gold again, so the standing default vault again, but
           the OLDER default: this is 1 Aug and the customer moved the
           default to Salt Lake City later. See the 11 Aug row. */
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
  return DEFAULT_PERSONA.activity.filter((tx) => touches(tx, account));
}

/**
 * ACTIVITY, INCLUDING WHAT THIS SESSION DID (Ali, 12 Aug: "one thing I'm
 * not seeing is actions show up in activity", and "let's make things
 * appear in activity").
 *
 * A trade used to move the balances and leave no trace: the history was
 * static persona data, so buying gold changed every figure on the page
 * except the list of things that had happened. Live rows now live in one
 * FlowStore key, newest first, and every activity surface reads them
 * AHEAD of the seeded history.
 *
 * ONE CHANNEL, FIVE SURFACES: the dashboard's recent list, the full
 * history, and the three wallet screens all read through useActivity, so
 * a trade shows up in all of them or in none of them. The Bank Accounts
 * screen filters the same list down to deposits, which live trades are
 * not, so it stays as it was.
 *
 * THEY ARE REAL ActivityRow VALUES, not a lighter "recent trade" shape.
 * That is what lets them through the same table, the same detail sheet
 * and the same Money in / Money out filters as the seeded rows, and it is
 * why TradeFlow fills in vault, fee, rate and reference rather than just
 * an amount.
 *
 * SESSION-SCOPED, because FlowStore is: they survive a reload and go away
 * with the tab, which is what a demo wants.
 */
const NO_LIVE_ROWS: ActivityRow[] = [];

export function useLiveActivity(): {
  rows: ActivityRow[];
  add: (row: ActivityRow) => void;
} {
  const [rows, setRows] = useFlowField<ActivityRow[]>(
    "activity.live",
    NO_LIVE_ROWS,
  );
  /* Newest first, and an absolute set rather than an updater: the same
     lesson as the vault credit, so it cannot depend on either store's
     updater semantics. */
  const add = (row: ActivityRow) => setRows([row, ...rows]);
  return { rows, add };
}

/** Does this row touch that wallet? Either leg counts. */
function touches(row: ActivityRow, account: AssetKey): boolean {
  return row.account === account || row.counterAccount === account;
}

/**
 * Every row a surface should show, newest first: this session's trades,
 * then the seeded history. Omit `account` for the whole history.
 */
export function useActivity(account?: AssetKey): ActivityRow[] {
  const { rows: live } = useLiveActivity();
  const all = [...live, ...DEFAULT_PERSONA.activity];
  return account ? all.filter((row) => touches(row, account)) : all;
}

/**
 * An asset's per-vault breakdown as the PERSONA SEEDS it, in USD.
 *
 * The static answer, kept for anything that wants the starting shape
 * rather than the live one. SCREENS SHOULD USE useVaults(asset), which is
 * reactive and reflects trades; this returns the figures the demo starts
 * from and never changes.
 *
 * RETURNS AN EMPTY ARRAY FOR "fiat" rather than throwing, and that is the
 * contract, not a lenient fallback: cash genuinely has no vaults (see the
 * note on the fiat balance), so a caller mapping over all three assets
 * should render nothing for the cash one instead of guarding first.
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

/** The three vaults, in registry order. The source of truth for what a
 *  vault IS lives in lib/accounts.ts; this is just the iteration order,
 *  spelled out so the hooks below can be written one per vault. */
const VAULT_IDS: VaultId[] = ["zurich", "miami", "saltlake"];

/** A metal's seed figure for one vault: the persona slice, or zero where
 *  that metal does not sit in that vault today. Zero is a real answer,
 *  not a missing one, which is why a purchase can put metal into a vault
 *  the persona never used. */
function sliceDefault(metal: MetalAsset, vault: VaultId): number {
  const slices = DEFAULT_PERSONA.balances[metal].vaults ?? [];
  return slices.find((s) => s.vault === vault)?.amount ?? 0;
}

/**
 * PER-VAULT BALANCES, and why the metal totals are now COMPUTED (Ali, 12
 * Aug: "I think our totals should always be computed").
 *
 * Each metal's money lives in THREE FlowStore keys, one per vault
 * (`bal.gold.zurich` and so on), seeded from the persona's slices. A
 * metal's balance is their SUM, never a stored figure. Before this, the
 * total lived in `bal.<metal>` and the slices were static persona data,
 * so a purchase moved the headline and left the vault table behind: buy
 * $500 of gold and the card read 51.2991 g held above three rows adding
 * up to 47.7350. The two could not be reconciled because nothing tied
 * them together. Now they cannot disagree: the same numbers make both.
 *
 * THE LEGACY `bal.<metal>` KEY IS DEAD. It is not read and not written.
 * A value left in a browser's storage from before this change is simply
 * ignored, which is the right outcome for a demo: the vault slices are
 * the truth and a stale total should not override them.
 *
 * WHERE A TRADE LANDS:
 *   BUY  credits ONE vault, the one chosen in the buy form (default
 *        preferences.vault). That is the whole point of the picker.
 *   SELL debits PRO RATA across the vaults that hold the metal. This is
 *        an ASSUMPTION, not a requirement Ali gave: the sell form has no
 *        vault picker, so something has to decide, and taking it in
 *        proportion keeps the shape of the holding rather than draining
 *        one vault first. If sells should instead come out of a chosen
 *        vault, or largest-first, this is the one function to change.
 *
 * A FOURTH VAULT means a fourth line in useMetalVaults: the hooks are
 * written out one per vault rather than looped, because React needs the
 * same hooks in the same order every render and a loop over a list is
 * both a lint error and a trap if the list ever becomes dynamic.
 */
/**
 * A stored slice, defended against a bad value.
 *
 * FlowStore persists to sessionStorage, so a bad write OUTLIVES a reload:
 * JSON turns NaN into null, the next credit computes `null + n`, and the
 * vault's seeded figure is gone for the rest of the tab's life. That is
 * exactly what one NaN did to the gold wallet on 12 Aug. The write path is
 * fixed, and this is the belt: anything that is not a finite number reads
 * as the persona's seed, so a corrupted value heals itself on next render
 * instead of spreading. Zero passes through, because zero is a real
 * balance.
 */
function storedSlice(
  value: unknown,
  metal: MetalAsset,
  vault: VaultId,
): number {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : sliceDefault(metal, vault);
}

export function useMetalVaults(metal: MetalAsset) {
  const zurich = useFlowField<number>(
    `bal.${metal}.zurich`,
    sliceDefault(metal, "zurich"),
  );
  const miami = useFlowField<number>(
    `bal.${metal}.miami`,
    sliceDefault(metal, "miami"),
  );
  const saltlake = useFlowField<number>(
    `bal.${metal}.saltlake`,
    sliceDefault(metal, "saltlake"),
  );
  /* Each pair is [value, set]; the value goes through the guard above, so
     a corrupted store cannot make a total NaN. */
  const slices: Record<VaultId, [number, (v: number | ((p: number) => number)) => void]> = {
    zurich: [storedSlice(zurich[0], metal, "zurich"), zurich[1]],
    miami: [storedSlice(miami[0], metal, "miami"), miami[1]],
    saltlake: [storedSlice(saltlake[0], metal, "saltlake"), saltlake[1]],
  };
  const total = slices.zurich[0] + slices.miami[0] + slices.saltlake[0];
  /* LARGEST FIRST, and only vaults that hold something: a vault at zero
     is not a holding, so it drops off the table until a purchase puts
     metal in it, at which point it appears. That is why silver shows one
     row today and would show two the moment you buy silver into Miami. */
  const rows: VaultBalance[] = VAULT_IDS.map((vault) => ({
    vault,
    amount: slices[vault][0],
  }))
    .filter((row) => row.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  /**
   * Move one vault's balance. `usd` is SIGNED: a buy credits the vault it
   * chose, a sell debits the vault it came from (Ali, 12 Aug: sells pick a
   * source vault, because spreading a sale across all of them "is
   * complicated"). Both are the same one-vault operation with opposite
   * signs, which is why there is one function.
   *
   * IT SETS AN ABSOLUTE VALUE rather than passing a function updater.
   * Both stores support updaters, but Studio's passed the RAW stored
   * value, which is undefined until a key's first write, so the first
   * credit to a vault computed `undefined + n` and stored NaN. That bug
   * is fixed in the Studio FlowStore now; this reads the hook's own value
   * instead, which carries the seeded default in both implementations, so
   * it cannot depend on that detail again.
   *
   * ROUNDED TO CENTS, and floored at zero. These are dollar figures, and
   * selling a vault out completely otherwise leaves a rounding crumb like
   * 4.5e-13 behind, which is enough to keep the vault in the table at
   * 0.0% forever. Rounding also keeps the slices summing to a figure that
   * looks like money rather than to a long float.
   */
  const credit = (vault: VaultId, usd: number) => {
    const [current, set] = slices[vault];
    set(Math.max(0, Math.round((current + usd) * 100) / 100));
  };

  /**
   * Set the TOTAL, distributing the change across the vaults in their
   * current proportions.
   *
   * NOT THE SELL PATH ANY MORE: sells name their source vault and go
   * through credit() with a negative. This stays because useBalance has to
   * return a setter to keep its [value, set] shape, and pro rata is the
   * only sane answer to "set the total" once the money lives per vault.
   * Nothing in the app calls it today. If something needs to, that is
   * worth a second look: setting a total is usually a sign the caller
   * actually knows which vault it means.
   */
  const setTotal = (next: number) => {
    if (total <= 0) {
      const fallback = getPreference("vault");
      slices[fallback][1](Math.max(0, next));
      return;
    }
    const ratio = Math.max(0, next) / total;
    for (const vault of VAULT_IDS) {
      const [amount, set] = slices[vault];
      if (amount > 0) set(amount * ratio);
    }
  };

  return { total, rows, credit, setTotal };
}

/** The per-vault rows for any asset, reactive. Empty for cash, which has
 *  no vaults: see the note on the fiat balance. */
export function useVaults(asset: AssetKey): VaultBalance[] {
  const vaults = useMetalVaults(asset === "fiat" ? "gold" : asset);
  return asset === "fiat" ? [] : vaults.rows;
}

/**
 * Reactive balance for an asset: [amount, setAmount].
 *
 * Cash reads its own single key. A METAL's amount is the sum of its
 * vaults, and its setter distributes pro rata: see the note above. The
 * signature is unchanged, so every existing caller keeps working.
 */
export function useBalance(asset: AssetKey): [number, (n: number) => void] {
  const cash = useFlowField<number>(
    "bal.fiat",
    DEFAULT_PERSONA.balances.fiat.amount,
  );
  /* Called for cash too, with the gold keys, so the hook count never
     varies with the argument. The result is discarded. */
  const vaults = useMetalVaults(asset === "fiat" ? "gold" : asset);
  if (asset === "fiat") return cash;
  return [vaults.total, vaults.setTotal];
}

/** Non-subscribing read, summed the same way. */
export function getBalance(asset: AssetKey): number {
  if (asset === "fiat") {
    return getFlowField("bal.fiat", DEFAULT_PERSONA.balances.fiat.amount);
  }
  return VAULT_IDS.reduce(
    (sum, vault) =>
      sum +
      getFlowField(`bal.${asset}.${vault}`, sliceDefault(asset, vault)),
    0,
  );
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
  useMetalVaults,
  useVaults,
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
  useActivity,
  useLiveActivity,
  vaultsFor,
  fullName,
  TX_METHOD_LABEL,
  TX_TYPE_LABEL,
  TX_STATUS_LABEL,
};
