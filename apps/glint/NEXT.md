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
  live Studio source against `sourceHash` in `lib/screens.ts`, normalising away
  `data-gds-source-id` stamps and whitespace.
- **Figures must reconcile against `lib/market.ts`** (LBMA prices + the 0.9%
  fee). The activity rows do: $8,400 buys 59.8778 g at $140.2856/g, fee $74.93.
- **No em or en dashes in the interface.** Ali is firm on this.
- **Store entities, never concatenated display strings** — `account: "gold"`,
  not `"Gold wallet ··5679"`. Compose at render.
