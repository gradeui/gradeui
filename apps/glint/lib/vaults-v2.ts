/**
 * VaultsV2 (2 Oct 2026): the vaults as the Glint business portal v2 sees
 * them. ZURICH AND MIAMI ONLY (Ali, 2 Oct: "Swap Salt Lake City for Miami
 * (it will always just be Miami for now)").
 *
 * TWIN of the Studio shared component VaultsV2 (cmuqxkeewvfvgm). Editing
 * one does not touch the other. Keep the pair in sync.
 *
 * WHY IT EXISTS. Studio's Persona and Accounts are shared with the live
 * demo's screens (glintpay-demo.gradeui.com is promoted from them) and
 * still seed a third vault key from August's Utah choice. Staging changes
 * without touching the live demo, so Studio's v2 components read vaults
 * through VaultsV2, which REMAPS that old key onto the existing Miami
 * vault rather than renaming any label.
 *
 * THE ONE LINE THAT DIFFERS FROM STUDIO: `REMAP` is empty here. On
 * glint-staging the app's own Persona and Accounts were migrated (the old
 * vault's slices, rows and preference now say "miami", and the directory
 * has two entries), so there is nothing left to fold. Everything else is
 * the Studio module line for line, so the v2 components call the same
 * helpers on both sides and promotion stays a pure import rewrite.
 *
 * TOTALS STILL ADD UP: the fold only regroups per-vault slices, so the
 * folded rows sum to Persona's own total. Gold is Miami 4,226.17 and
 * Zurich 2,410.63 (6,636.80); Silver is all in Miami, 2,984.15.
 */

import {
  useMetalVaults as usePersonaMetalVaults,
  type AssetKey,
  type VaultBalance,
} from "@/lib/persona";
import { vaultLabel, vaultLocation, type VaultId } from "@/lib/accounts";

type MetalAsset = Exclude<AssetKey, "fiat">;

/** The v2 vaults, in the order Buy offers them. */
const IDS: VaultId[] = ["zurich", "miami"];

/** Older vault keys and the v2 vault each counts as. Empty on staging:
 *  the app's Persona was migrated (see the header). */
const REMAP: Partial<Record<string, VaultId>> = {};

/** A stored vault id in v2 terms. Empty in, empty out (cash rows). */
function id(vault: VaultId): VaultId;
function id(vault: VaultId | undefined): VaultId | undefined;
function id(vault: VaultId | undefined): VaultId | undefined {
  if (!vault) return vault;
  return REMAP[vault] ?? vault;
}

/** "Miami": the city alone, for a table cell, a radio or the card pin. */
function label(vault: VaultId): string {
  return vaultLabel(id(vault));
}

/** "Miami, United States": the fuller form a detail panel has room for. */
function location(vault: VaultId): string {
  return vaultLocation(id(vault));
}

/** Regroup per-vault rows by their v2 vault: summed to the cent, empty
 *  vaults dropped, largest first. */
function fold(rows: VaultBalance[]): VaultBalance[] {
  const byVault = new Map<VaultId, number>();
  for (const row of rows) {
    const v = id(row.vault);
    byVault.set(v, Math.round(((byVault.get(v) ?? 0) + row.amount) * 100) / 100);
  }
  return [...byVault.entries()]
    .map(([vault, amount]) => ({ vault, amount }))
    .filter((row) => row.amount > 0)
    .sort((a, b) => b.amount - a.amount);
}

/** Persona.useMetalVaults in v2 terms: rows folded, credit landing on
 *  real keys (a sale takes the vault's own slice first, then any older
 *  slice folded into it, largest first). */
function useMetalVaults(metal: MetalAsset) {
  const base = usePersonaMetalVaults(metal);
  const rows = fold(base.rows);
  const credit = (vault: VaultId, usd: number) => {
    const target = id(vault);
    if (usd >= 0) {
      base.credit(target, usd);
      return;
    }
    const sources = base.rows
      .filter((row) => id(row.vault) === target)
      .sort((a, b) =>
        a.vault === target ? -1 : b.vault === target ? 1 : b.amount - a.amount,
      );
    let left = -usd;
    for (const source of sources) {
      if (left <= 0) break;
      const take = Math.min(left, source.amount);
      base.credit(source.vault, -take);
      left -= take;
    }
  };
  return { total: base.total, rows, credit, setTotal: base.setTotal };
}

/** The folded per-vault rows for any asset. Empty for cash. */
function useVaults(asset: AssetKey): VaultBalance[] {
  const vaults = useMetalVaults(asset === "fiat" ? "gold" : asset);
  return asset === "fiat" ? [] : vaults.rows;
}

export const VaultsV2 = {
  IDS,
  REMAP,
  id,
  label,
  location,
  useMetalVaults,
  useVaults,
};
