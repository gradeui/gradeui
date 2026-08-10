"use client";

/**
 * Glint demo persona, ported from the Studio shared component "Persona"
 * (cmsnajawrulypm): the single source of truth for WHO the demo user is
 * and what they hold. One persona for now; add records to PERSONAS and
 * swap DEFAULT_PERSONA when the demo needs more. Keep in sync with the
 * Studio component.
 *
 * BALANCES ARE REACTIVE: useBalance("gold") reads a FlowStore override
 * (key `bal.<asset>`) falling back to the persona default, so a future
 * Buy Gold / Sell Silver flow calls the setter and every subscribed
 * card re-renders. The landing's Start reset also restores defaults.
 * Figures deliberately non-round (real holdings never are): gold
 * ≈ 77.2 g at ~$86/g, silver ≈ 74.6 oz at ~$40/oz.
 */

import { getFlowField, useFlowField } from "@/lib/flow-store";

export type AssetKey = "gold" | "silver" | "fiat";

export interface BalanceMeta {
  label: string;
  amount: number;
  account: string;
}

export interface PersonaRecord {
  id: string;
  owner: string;
  business: string;
  businessMeta: string;
  account: string;
  balances: Record<AssetKey, BalanceMeta>;
}

export const PERSONAS: Record<string, PersonaRecord> = {
  pebble: {
    id: "pebble",
    owner: "Ali",
    business: "Pebble Interactive",
    businessMeta: "Business account",
    account: "AD",
    balances: {
      gold: { label: "Gold", amount: 6636.8, account: "Gold wallet ··5679" },
      silver: { label: "Silver", amount: 2984.15, account: "Silver wallet ··4102" },
      fiat: { label: "Fiat", amount: 15210.4, account: "Current ··2502" },
    },
  },
};

export const DEFAULT_PERSONA = PERSONAS.pebble;

/** $1,234.56 formatting for balances and transaction amounts. */
export function fmtMoney(n: number): string {
  return `$${Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
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

/** Namespace mirroring the Studio statics pattern (Persona.useBalance
 *  etc.), so promoted screens keep working with minimal edits. */
export const Persona = {
  ALL: PERSONAS,
  DEFAULT: DEFAULT_PERSONA,
  useBalance,
  getBalance,
  fmtMoney,
};
