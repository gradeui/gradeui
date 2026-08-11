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
 * should differ. The silver ACTIVITY rows still describe ounces in
 * their copy: those are historical text, not computed figures.
 * Account identifiers (labels, last four, routing numbers,
 * institutions) live in lib/accounts.ts, so a number changes in
 * one place. Keep in sync with the Studio component.
 *
 * BALANCES ARE REACTIVE: useBalance("gold") reads a FlowStore override
 * (key `bal.<asset>`) falling back to the persona default, so a future
 * Buy Gold / Sell Silver flow calls the setter and every subscribed
 * card re-renders. The landing's Start reset also restores defaults.
 *
 * ACTIVITY: the persona's transaction rows, shared by the Dashboard's
 * recent list and /activity's filtered views. Static for now; appended
 * rows will ride a FlowStore key when Buy/Sell flows land. NOTE: rows
 * predate the live LBMA pricing in lib/market.ts and don't reconcile
 * exactly with it.
 */

import { getFlowField, useFlowField } from "@/lib/flow-store";
import { accountLabel } from "@/lib/accounts";

export type AssetKey = "gold" | "silver" | "fiat";

export interface BalanceMeta {
  label: string;
  amount: number;
  account: string;
}

export type TxKind = "exchange-buy" | "exchange-sell" | "spend" | "deposit";
export type TxType = "exchange" | "card" | "deposit" | "withdrawal";
export type TxStatus = "completed" | "pending" | "failed" | "reversed";
export type TxMethod = "market-order" | "card" | "wire" | "ach";

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
  /** The ACCOUNT ITSELF, not its label. accountLabel(id) renders
   *  "Gold wallet ··5679" at display time; storing that string would
   *  bake a number into every row and make a wallet filter a substring
   *  match rather than an equality check. */
  account: AssetKey;
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

/** Flat, namespaced preference keys: display units per metal plus the
 *  autoInvest behaviour a USD deposit triggers (data only until the
 *  deposit flow consumes it). */
export interface PersonaPreferences {
  "unit.gold": MetalUnit;
  "unit.silver": MetalUnit;
  autoInvest: AutoInvest;
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
      autoInvest: "none",
    },
    balances: {
      gold: { label: "Gold", amount: 6636.8, account: accountLabel("gold") },
      silver: { label: "Silver", amount: 2984.15, account: accountLabel("silver") },
      fiat: { label: "USD", amount: 15210.4, account: accountLabel("fiat") },
    },
    /* Figures are consistent with Market's LBMA prices (gold $139.0343/g,
       silver $2.0569/g) and its 0.9% fee, so a row's rate, quantity and
       cash actually reconcile. The old rows were priced at roughly $86/g
       and no longer matched anything the product quotes. */
    activity: [
      {
        id: "tx-20260811-1110",
        kind: "exchange-buy",
        description: "Exchange USD to Gold",
        subtitle: "Market order",
        timestamp: "2026-08-11T11:10:00",
        metalAmount: 7.1283,
        metal: "gold",
        fiatAmount: -1000,
        rate: 140.2856,
        type: "exchange",
        status: "completed",
        account: "gold",
        method: "market-order",
        fee: 8.92,
        reference: "GX-4471-0083",
      },
      {
        id: "tx-20260810-0834",
        kind: "spend",
        description: "FREENOW* DY46BQ-2",
        merchant: { city: "Denver", country: "USA" },
        timestamp: "2026-08-10T08:34:00",
        metalAmount: -0.1597,
        metal: "gold",
        fiatAmount: -22.2,
        rate: 139.0343,
        type: "card",
        status: "pending",
        account: "gold",
        method: "card",
        card: { name: "Glint Mastercard", last4: "4417" },
        reference: "GC-8820-4417",
      },
      {
        id: "tx-20260806-1542",
        kind: "exchange-sell",
        description: "Exchange Silver to USD",
        subtitle: "Market order",
        timestamp: "2026-08-06T15:42:00",
        metalAmount: -510,
        metal: "silver",
        fiatAmount: 1039.58,
        rate: 2.0384,
        type: "exchange",
        status: "completed",
        account: "silver",
        method: "market-order",
        fee: 9.44,
        reference: "GX-4390-0117",
      },
      {
        id: "tx-20260805-0902",
        kind: "deposit",
        description: "Deposit from Ridgeline Construction",
        subtitle: "Wire transfer",
        timestamp: "2026-08-05T09:02:00",
        metalAmount: null,
        metal: null,
        fiatAmount: 8400,
        rate: null,
        type: "deposit",
        status: "completed",
        account: "fiat",
        method: "wire",
        reference: "WT-2026-08-0551",
      },
      {
        id: "tx-20260802-1015",
        kind: "exchange-buy",
        description: "Exchange USD to Gold",
        subtitle: "Market order",
        timestamp: "2026-08-02T10:15:00",
        metalAmount: 8.8402,
        metal: "gold",
        fiatAmount: -1240.15,
        rate: 140.2856,
        type: "exchange",
        status: "completed",
        account: "gold",
        method: "market-order",
        fee: 11.06,
        reference: "GX-4318-0092",
      },
      {
        id: "tx-20260801-0741",
        kind: "deposit",
        description: "Deposit from Ridgeline Construction",
        subtitle: "ACH",
        timestamp: "2026-08-01T07:41:00",
        metalAmount: null,
        metal: null,
        fiatAmount: 3200,
        rate: null,
        type: "deposit",
        status: "completed",
        account: "fiat",
        method: "ach",
        reference: "AC-2026-08-0117",
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

/** Signed variant for activity rows: −$310.20 / +$1,050.00. */
export function fmtSigned(n: number): string {
  return `${n < 0 ? "-" : "+"}${fmtMoney(n)}`;
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
 *  etc.), so promoted screens keep working with minimal edits. */
export const Persona = {
  ALL: PERSONAS,
  DEFAULT: DEFAULT_PERSONA,
  useBalance,
  getBalance,
  usePreference,
  getPreference,
  fmtMoney,
  fmtSigned,
};
