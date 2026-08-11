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

export interface ActivityRow {
  date: string;
  name: string;
  amount: number;
  account: string;
  method: string;
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
    owner: "Ali",
    business: "Ridgeline Construction",
    businessMeta: "Business account",
    account: "AD",
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
      first: "Ali",
      last: "Driver",
      middle: "",
      email: "ali@ridgelineconstruction.com",
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
    activity: [
      { date: "Aug 7", name: "Bought gold — 3.6 g", amount: -310.2, account: accountLabel("gold"), method: "Market order" },
      { date: "Aug 6", name: "Sold silver — 26 oz", amount: 1050, account: accountLabel("silver"), method: "Market order" },
      { date: "Aug 5", name: "USD deposit", amount: 8400, account: accountLabel("fiat"), method: "Wire transfer" },
      { date: "Aug 4", name: "Bought silver — 46 oz", amount: -1862.1, account: accountLabel("silver"), method: "Market order" },
      { date: "Aug 2", name: "Bought gold — 14.4 g", amount: -1240.15, account: accountLabel("gold"), method: "Market order" },
      { date: "Aug 1", name: "USD deposit", amount: 3200, account: accountLabel("fiat"), method: "ACH" },
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
  return `${n < 0 ? "−" : "+"}${fmtMoney(n)}`;
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
