/**
 * The demo's account directory: every account the persona holds, with
 * the identifiers a US business customer would be shown.
 *
 * WHY A SEPARATE FILE: the CEO asked for routing numbers to be called
 * out explicitly (11 Aug 2026), which means they belong in one place
 * that the screens read from, not typed into each card. Persona reads
 * this for its balance metadata, so an account's number, institution
 * or logo changes in exactly one spot.
 *
 * ROUTING NUMBERS ARE PLACEHOLDERS. Every value below starts "00",
 * a prefix the ABA never assigns to a real institution, so these
 * cannot collide with a live bank while the real ones are confirmed.
 * They are deliberately obvious rather than realistic: a plausible
 * nine digits could match somebody's actual routing number, which is
 * not a risk worth taking in a client demo. Replace `routingNumber`
 * on each record with the real value and delete this paragraph.
 *
 * LOGOS: `institution.logo` is a slot, not a file. Drop an SVG or PNG
 * into apps/glint/public/institutions/ and set the path here; the UI
 * falls back to the institution's initials until then, so nothing
 * breaks while artwork is outstanding. Bank marks are trademarks:
 * only ship artwork the client has cleared for use.
 *
 * US TERMINOLOGY: the cash account is a CHECKING account, not a
 * "current" account (Ali, 11 Aug) — the UK term had leaked in from
 * the Glint iOS app, whose home market is the UK.
 */

export interface Institution {
  /** Display name on statements and account cards. */
  name: string;
  /** Path under /public, or undefined while artwork is outstanding. */
  logo?: string;
  /** Fallback mark when there is no logo: kept short, 1-3 chars. */
  initials: string;
}

export interface AccountRecord {
  /** Matches the Persona balance key where one exists. */
  id: "fiat" | "gold" | "silver";
  /** What the customer calls it: "Checking", "Gold wallet". */
  label: string;
  /** Last four of the account number, shown as ··2502. */
  last4: string;
  /**
   * ABA routing number. Cash accounts have one; metal wallets are
   * custody positions rather than deposit accounts, so they do not.
   */
  routingNumber?: string;
  institution: Institution;
}

const GLINT_BANK: Institution = {
  name: "Glint Trust Bank",
  initials: "GT",
};

const GLINT_CUSTODY: Institution = {
  name: "Glint Custody",
  initials: "GC",
};

export const ACCOUNTS: Record<AccountRecord["id"], AccountRecord> = {
  fiat: {
    id: "fiat",
    label: "Checking",
    last4: "2502",
    routingNumber: "001000025", // PLACEHOLDER — see the note above
    institution: GLINT_BANK,
  },
  gold: {
    id: "gold",
    label: "Gold wallet",
    last4: "5679",
    institution: GLINT_CUSTODY,
  },
  silver: {
    id: "silver",
    label: "Silver wallet",
    last4: "4102",
    institution: GLINT_CUSTODY,
  },
};

/** "Checking ··2502" — the inline form used on cards and in flows. */
export function accountLabel(id: AccountRecord["id"]): string {
  const a = ACCOUNTS[id];
  return `${a.label} ··${a.last4}`;
}

/** "Routing 001000025 · Account ··2502", or just the account when the
 *  record has no routing number (the metal wallets). */
export function accountIdentifiers(id: AccountRecord["id"]): string {
  const a = ACCOUNTS[id];
  return a.routingNumber
    ? `Routing ${a.routingNumber} · Account ··${a.last4}`
    : `Account ··${a.last4}`;
}
