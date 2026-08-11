# Glint — what's next

Written 11 Aug 2026, at the end of a long session. Everything below is
committed and pushed (`b2cc3fb`). Working tree clean, all 15 screens pass
`pnpm -F @gradeui/glint check:promotions`.

Read `apps/glint/README.md` first — it has the working rules. The one that
matters most: **Studio first, then promote.** Screens and shared components
are edited in the Studio project (`8e65f8f7-f995-4c47-bc39-8f68b42a86e4`) and
promoted down with `scripts/promote-screen.py`. Design-system changes are the
exception: they live in `packages/ui` (+ the `apps/docs` twin) and reach both
surfaces through `packages/ui/dist`, so they need `pnpm -F @gradeui/ui build`.

## Open work, in the order Ali asked for it

1. **Glint USD page** (`/wallets/usd`, screen not yet created). Same shape as
   the gold and silver wallets: balance, activity filtered to the fiat wallet,
   and the US routing details called out. The account data is already in
   `lib/accounts.ts` — `Sutton Bank`, routing `041215032` (minted, checksum
   valid, deliberately NOT Sutton's real `041215663`), account `··2502`. There
   is no price chart for USD, so that card should become the routing/account
   detail instead. Note the activity filter: fiat rows have `metal: null`, so
   filter on `row.method` / `kind` rather than metal, or add an explicit
   wallet key.

2. **Checkbox multi-select in DataView.** Parked deliberately. DataView has an
   active row (`activeId`) but no `rowSelection`. An agent scoped the exact
   change: add `RowSelectionState` to the TanStack import, a leading synthetic
   `__select` column, `enableRowSelection` + state in `useReactTable`, a
   select-all in the header, `e.stopPropagation()` in the checkbox cell (the
   row-level onClick would otherwise fire), and a guard where `TileView` builds
   `cols[0]` — about 11 sites in `packages/ui/components/ui/data-view.tsx`,
   plus the docs twin, plus the sidecar and `generate:contracts`.

3. **Custom USD mark** to match the Glint G. The wallet cards currently give
   USD the G in the action blue (`AssetMark` in the wallets screen); Ali wants
   a dollar mark drawn to sit beside it. The G's paths are in
   `components/wordmark.tsx` and `public/glint-mark.svg`.

## Things worth knowing before you touch anything

- **The MCP validator caches contracts at process start.** After changing a
  component's props you must run `pnpm -F @gradeui/ui generate:contracts` AND
  restart the app, or `save_screen` rejects the new prop as unknown. This cost
  a chunk of the session.
- **Contracts come from the sidecar `.md`, not the TS interface.** A prop that
  is not in the sidecar's `props:` list does not exist as far as Studio is
  concerned.
- **`check:promotions` compares SOURCE, not timestamps.** `designs.updated_at`
  moves on any metadata write, so a timestamp check cries wolf; it hashes the
  live Studio source, normalising away `data-gds-source-id` stamps and
  whitespace.
- **The comparison is two-sided, and that matters.** It measures live Studio
  against the `// source-hash:` stamp `promote-screen.py` writes into the
  generated page, not against `sourceHash` in `lib/screens.ts`. The registry
  field was both sides of the old comparison, so `--update` without a
  re-promotion re-blessed a stale app copy: that is how the gold wallet ended
  up filtering on `tx.metal` here while Studio filtered on `tx.account`, with
  the guard reporting all 15 screens matching. Pages promoted before 11 Aug
  2026 carry no stamp and report `~ legacy` (registry fallback, one-sided)
  until they are next promoted.
- **Figures must reconcile against `lib/market.ts`** (LBMA prices + the 0.9%
  fee). The activity rows do: $8,400 buys 59.8778 g at $140.2856/g, fee $74.93.
- **No em or en dashes in the interface.** Ali is firm on this.
- **Store entities, never concatenated display strings** — `account: "gold"`,
  not `"Gold wallet ··5679"`. Compose at render.

## Added 11 Aug, evening session (read this first tomorrow)

**Shipped since the note above:** the Glint USD wallet, the metal price and
wallet cards as shared components, vaults across balances/activity/purchase,
`PhoneField`, the AppChrome page-slot, the toolbar action row, and the
**Bank Accounts** screen (Studio `Bank Accounts` / `dmsp02q871y5u` ->
`/bank-accounts`). The demo landing now has a second card, "The logged-in
account", with a pill per product screen.

### Waiting on you

- **The Glint account holder is PROVISIONAL.** `Accounts.ALL.fiat.holder` is
  `"Glintpay LLC"`, which was your own "maybe". You said you would confirm the
  real entity with Glint. It is one string in `lib/accounts.ts` (+ the Studio
  twin) and every card follows.
- **The bank logos are the banks' own site icons**, in
  `public/institutions/` in BOTH apps (glint and docs, so Studio and the app
  resolve the same path). Zions' is their ZB monogram at 48px; Sutton's is a
  16px favicon upscaled to 96px, so it is a little soft up close. Both are
  trademarks: get artwork cleared before this goes anywhere public, then drop
  the files in and change nothing else.

### Not done, and asked for

- **`/wallets/usd` still needs the Glint mark in its card header and the
  auto-invest toggle inside the card.** The "says Checking" half is fixed:
  `Accounts.ALL.fiat.label` is now `"Glint USD"` and `type` carries
  `"Checking"`, so the title reads correctly. The toggle wants extracting:
  `AutoInvest` currently lives inside the dashboard screen only, so putting it
  on a second screen means a new shared component + app twin + a `TWINS` entry,
  not a copy.
- **Back arrows on the wallet screens should be chevrons**, like the
  onboarding back button. Two places: `BackToWallets` in
  `app/(product)/layout.tsx`, and the `toolbarLeading` in each of the three
  Studio wallet screens (promotion strips it, so the app copy is the one that
  renders, but the Studio copy is what you see in Studio).
- **Four twin pairs are still unguarded** (`FlowStore`, `Wordmark`,
  `MetalButton`, `PhoneField`): no baseline recorded, so `check:twins` cannot
  see drift on them. FlowStore is the one with real divergence, two bugs the
  app copy fixed. Reconcile, then `check:twins --update --only <Name>`.
- **The vault breakdown is not reactive**: `vaultsFor` reads the persona
  default while the headline balance is a live FlowStore read, so buying gold
  moves the total and leaves the vault rows behind. Needs per-vault keys in one
  coordinated change across Persona, TradeFlow and MetalWalletCard.

### One new script

`pnpm -F @gradeui/glint read:screen -- --id <designId> --out <file>` dumps a
screen's raw JSX and prints the `--version` to promote with. It completes the
set (`read:component`, `mirror:component`, `write:screen`) and it is what the
promote step should always be fed, because retyping a screen is the one way to
lose bytes the drift guard is hashing.
