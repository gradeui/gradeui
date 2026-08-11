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

export interface PersonaRecord {
  id: string;
  owner: string;
  business: string;
  businessMeta: string;
  account: string;
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
