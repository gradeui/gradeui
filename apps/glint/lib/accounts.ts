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
 * TWIN: this mirrors the Studio project's `Accounts` shared component
 * (id cmsojsyybpgu7o). Editing one does not touch the other, and the
 * pair has already drifted once: the Sutton rename and the minted
 * routing number below landed here first and left Studio rendering
 * "Glint Trust Bank" with a 00-prefixed placeholder. Change both.
 *
 * ROUTING NUMBER: the USD account carries a MINTED number, not a
 * placeholder and not the sponsor bank's real one. It is checksum
 * valid and correctly prefixed, but invented; see the note on SUTTON
 * below for the reasoning. Metal wallets are custody positions rather
 * than deposit accounts, so they carry no routing number at all.
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
 *
 * VAULTS: the file also carries the vault directory, the three places
 * the metal physically sits. It lives here because this file is
 * already the directory of where this customer's money and metal are,
 * and it already names GLINT_CUSTODY as the institution behind the
 * metal wallets; a vault is where that custody sits. Read the block
 * above VaultId before adding to it: a vault is NOT an account.
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
  /** Matches the Persona balance key where one exists. "external" has
   *  none: it is the customer's own bank, so Glint holds no balance for
   *  it. */
  id: "fiat" | "gold" | "silver" | "external";
  /**
   * The NAME the customer knows it by: "Glint USD", "Gold wallet".
   *
   * NOT the kind of account it is (Ali, 11 Aug: the USD wallet page
   * "says Checking but this is actually our Glint USD wallet"). One
   * field was carrying both facts, so a card title showing the label
   * read "Checking", which is the sort of account it is rather than the
   * thing the customer holds. The kind moved to `type`.
   */
  label: string;
  /** The KIND of account, for the account-details row: "Checking".
   *  Only deposit accounts have one; metal wallets are custody. */
  type?: string;
  /**
   * Full account number. MINTED, like the routing number: see the note on
   * SUTTON. An account number is meaningless without a routing number, and
   * the routing number this pairs with is invented, so the pair cannot
   * resolve to a real account anywhere.
   *
   * Metal wallets have no deposit-account number, so this is optional and
   * they carry only a `last4` for display continuity.
   */
  number?: string;
  /** Last four, shown as ··2502. DERIVED from `number` where there is one,
   *  so the two can never disagree; stored only for the metal wallets,
   *  which have no full number to derive from. */
  last4: string;
  /**
   * ABA routing number. Cash accounts have one; metal wallets are
   * custody positions rather than deposit accounts, so they do not.
   */
  routingNumber?: string;
  institution: Institution;
  /**
   * The legal holder, when that is NOT the customer (Ali, 11 Aug: "Glint
   * USD, the account holder would be Glintpay LLC maybe"). A pooled
   * fintech deposit account is held by the operator at the sponsor bank
   * FOR THE BENEFIT OF the customer, and that is the one fact on the
   * Bank Accounts screen that is not the customer's own name. Absent on
   * every account the customer holds directly, where a screen falls back
   * to the persona's legal name.
   */
  holder?: string;
  /** True for an account that is NOT Glint's: the customer's own bank,
   *  linked so money can move in. See the EXTERNAL record below. */
  external?: boolean;
  /** ISO date the customer linked an external account, formatted at
   *  render. Absent on Glint's own accounts. */
  linkedOn?: string;
  /** Micro-deposit / instant-auth outcome on an external account. The
   *  screen turns this into "Verified"; false reads "Pending". */
  verified?: boolean;
}

/* Glint's US banking partner. Sutton Bank is the real sponsor bank the
   product references. The ROUTING NUMBER below is minted, not theirs:
   it satisfies the ABA checksum (3·[1,4,7] + 7·[2,5,8] + 1·[3,6,9] ≡ 0
   mod 10) and carries the 04x Ohio Federal Reserve prefix so it reads
   correctly, but it is deliberately NOT 041215663, which is Sutton's
   actual number. A number that passes the checksum could in principle
   belong to someone; pairing an invented one with a real bank name is
   the compromise Ali signed off for a demo. */
/* LOGO PROVENANCE (Ali, 11 Aug, asked for the real bank marks rather
   than initials tiles). Both files are the banks' own square site icons,
   pulled from suttonbank.com and zionsbank.com and converted to PNG:
   Zions' is their ZB monogram, Sutton's their S emblem. They are square
   because the tile that shows them is, and neither site publishes a
   larger square version.
   THEY ARE TRADEMARKS. Fine for a demo of a real partnership; if this
   ships anywhere public, get the artwork cleared and replace the files.
   Served from BOTH apps' public/institutions/ (glint and docs) so a
   Studio render and the promoted app resolve the same path. */
const SUTTON: Institution = {
  name: "Sutton Bank",
  logo: "/institutions/sutton-bank.png",
  initials: "SB",
};

const GLINT_CUSTODY: Institution = {
  name: "Glint Custody",
  initials: "GC",
};

/* The customer's OWN bank, the one they fund from: Zions Bank, Ali's
   pick (11 Aug, pointing at zionsbank.com/business). A real Mountain
   West business bank, and the one Glint's Salt Lake City vault shares a
   city with. The routing number is minted on the same terms as Sutton's
   above: 124 is the Utah prefix and the ABA checksum passes, so it
   reads correctly, and it is deliberately not 124000054, which is
   Zions' actual number. */
const ZIONS: Institution = {
  name: "Zions Bank",
  logo: "/institutions/zions-bank.png",
  initials: "ZB",
};

export const ACCOUNTS: Record<AccountRecord["id"], AccountRecord> = {
  fiat: {
    id: "fiat",
    /* The NAME, which is what a card title shows. "Checking" moved to
       `type`: see the note on the field. */
    label: "Glint USD",
    type: "Checking",
    /* MINTED (Ali, 11 Aug, asked to show the full number on the USD
       wallet). Ends 2502 so it matches the last four already shown
       everywhere else. Safe to display for the reason in the interface
       doc above: the routing number it pairs with is invented, so this
       pair addresses nothing. */
    number: "8823402502",
    /* Glint holds this one, not the customer: see the field's note. The
       beneficiary is composed at render from the persona's legal name, so
       it is never typed twice.

       PROVISIONAL. Ali's own word was "maybe", and he is confirming the
       real entity name with Glint on 12 Aug. One string, one place: when
       the real one lands it replaces this and every card follows. */
    holder: "Glintpay LLC",
    last4: "2502",
    routingNumber: "041215032", // minted, checksum-valid; see the note on SUTTON
    institution: SUTTON,
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
  /* THE LINKED EXTERNAL ACCOUNT: the customer's own business checking,
     verified so deposits can be pulled from it. Not a Glint account, so
     it holds no balance and never appears in the wallet list.

     SHOWN IN FULL, at Ali's request (11 Aug). I had it masked on the
     grounds that a linked account is the one number a product never
     shows back to you, only its last four. He asked for the full number
     on this screen, and it is safe on the same terms as the Glint
     account beside it: both the account number and the routing number
     it pairs with are minted, so the pair addresses nothing. Ends 4417,
     which is where the masked form already ended, and accountLast4()
     derives from this so the two cannot drift. */
  external: {
    id: "external",
    label: "Business checking",
    type: "Checking",
    number: "6104814417",
    last4: "4417",
    routingNumber: "124000041", // minted; see the note on ZIONS
    institution: ZIONS,
    external: true,
    linkedOn: "2026-07-28",
    verified: true,
  },
};

/** The last four, derived from the full number where there is one so the
 *  two cannot drift, falling back to the stored value for the metal
 *  wallets, which have no full number. */
export function accountLast4(id: AccountRecord["id"]): string {
  const a = ACCOUNTS[id];
  return a.number ? a.number.slice(-4) : a.last4;
}

/** The full number, unbroken. NOT grouped: this one is ten digits, and
 *  grouping in fours leaves a two-digit orphan ("8823 4025 02") that reads
 *  as a rendering bug. Render it with tabular figures instead, which is
 *  what makes a long digit run checkable. Returns undefined for an account
 *  with no full number (the metal wallets are custody, not deposit). */
export function accountNumberFull(id: AccountRecord["id"]): string | undefined {
  return ACCOUNTS[id].number;
}

/** "Glint USD ··2502", the inline form used on cards and in flows. */
export function accountLabel(id: AccountRecord["id"]): string {
  const a = ACCOUNTS[id];
  return `${a.label} ··${accountLast4(id)}`;
}

/** "Routing 041215032 · Account ··2502", or just the account when the
 *  record has no routing number (the metal wallets). */
export function accountIdentifiers(id: AccountRecord["id"]): string {
  const a = ACCOUNTS[id];
  return a.routingNumber
    ? `Routing ${a.routingNumber} · Account ··${accountLast4(id)}`
    : `Account ··${accountLast4(id)}`;
}

/**
 * The vault directory: the three places Glint's metal physically sits
 * (Ali, 11 Aug 2026). Balances, activity rows and the purchase flow all
 * need to name a vault, so the list is defined once here and everything
 * else references an id.
 *
 * WHY VAULTS ARE A SEPARATE DIRECTORY, NOT MORE ACCOUNTS: a metal
 * wallet is ONE custody account whose contents are distributed across
 * vaults. So a vault is not an account. It has no routing number and no
 * last four, and it must never be added to ACCOUNTS. The tempting wrong
 * move later is to model each vault as its own account: that would turn
 * one gold wallet held in three places into three gold wallets, and
 * every balance the screens show would then be a subtotal that has to
 * be summed back up before it means anything to the customer.
 *
 * Rows elsewhere store the id ("zurich"), never a display string, and
 * compose through the two helpers below.
 */
export type VaultId = "zurich" | "miami" | "saltlake";

export interface VaultRecord {
  /** The stored key: what a balance, activity row or order holds. */
  id: VaultId;
  /** City alone, the short form a table cell or a chip has room for. */
  city: string;
  /** Kept separate from the city so display composes it, or omits it. */
  country: string;
}

export const VAULTS: Record<VaultId, VaultRecord> = {
  zurich: { id: "zurich", city: "Zurich", country: "Switzerland" },
  miami: { id: "miami", city: "Miami", country: "United States" },
  saltlake: {
    id: "saltlake",
    city: "Salt Lake City",
    country: "United States",
  },
};

/** "Zurich": the city alone, for a dense table cell or a chip. */
export function vaultLabel(id: VaultId): string {
  return VAULTS[id].city;
}

/** "Zurich, Switzerland": the fuller form a detail panel has room for. */
export function vaultLocation(id: VaultId): string {
  const v = VAULTS[id];
  return `${v.city}, ${v.country}`;
}

/**
 * Namespace mirroring the Studio module's statics, so a promoted screen
 * can keep calling `Accounts.identifiers("fiat")` exactly as it does in
 * Studio and the promotion is a pure import rewrite with no call-site
 * surgery. The named exports above stay: they are what the app's own
 * hand-written code uses.
 *
 * The vault keys are spelled the same on both sides for the same
 * reason, so `Accounts.vaultLabel(row.vault)` survives promotion. Keep
 * any new key added here in step with the Studio statics.
 */
export const Accounts = {
  ALL: ACCOUNTS,
  label: accountLabel,
  identifiers: accountIdentifiers,
  last4: accountLast4,
  numberFull: accountNumberFull,
  VAULTS,
  vaultLabel,
  vaultLocation,
};
