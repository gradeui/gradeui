# @gradeui/brightlocal

The BrightLocal replatform prototype as a real Next.js app: the Reviews
area of the Studio project "Brightlocal Vision"
(`47e40175-0d55-4d21-960b-26bdf6b01282`) promoted into routed pages on
the published `@brightlocal/ui-components` package.

**Why this exists:** Studio stays the drafting space. This app is the
locked, deployable prototype that user tests and reviews point at, with
personas, screen options and a comment surface (Vercel toolbar). It runs
on the real design system package, compiled the way a BrightLocal app
would compile it, so what renders here is what their package renders.

## Running it

```bash
pnpm -F @gradeui/brightlocal dev      # http://localhost:3020
pnpm -F @gradeui/brightlocal build
```

`Cmd K` (or `Ctrl K`) anywhere opens the demo menu: persona, layout
engine, layout preset, every screen, layout options, page notes, the
settings page and the docs. `Cmd .` opens the page notes. `Alt T` on any
screen opens the proposal module's layout tweaker (modified engine).
`/settings` is the long-form version of the menu. `?persona=<id>` on any
link selects a persona; `?variant=<slug>` on a base route pins a layout
option.

## Layout engine

Two ways to render every screen, from the same source:

- **De facto GlobalLayout**: the DS's `GlobalLayout`, `Sidebar` parts
  and `GlobalLayoutContentHeader` exactly as shipped in 2.27.0. Nothing
  overridden, no className on anything. The page header takes
  breadcrumbs, title, description, date and actions; it has no help
  slot yet.
- **Modified GlobalLayout**: the proposal shell built on top of the DS
  (padding cancelled, sidebar tones and frames, the sticky band, the
  tweaker, the tightened nav rhythm).

Screens render `<AppLayoutShell>`, `<ProposalSidebar>` and
`<PageHeader>` and the setting decides (`ds/proposal-shell.jsx`,
`ds/proposal-nav.jsx`, `ds/proposal-page.jsx` each carry a native and a
modified implementation behind one export).

## Overriding the DS

`app/custom.css` is the one place: redeclare a DS variable, or target a
`data-slot` (component part) or `data-hook` (instance). Each rule
carries a note so the file doubles as the list of things the DS needs
to change.

## Page notes

`notes/<route-with-dashes>.md` is rendered in a sheet for that route
(`/reviews/tracker` reads `notes/reviews-tracker.md`). See
`notes/README.md`.

## Layout

```
app/
  page.tsx                demo home
  settings/               demo settings page
  api/notes/              serves notes/*.md for the page notes sheet
  docs/                   proposed components + proposed DS changes
  s/[id]/                 /s/<designId> stable links (307 to the route)
  (app)/                  the product: one folder per promoted screen
    [...area]/            skeleton "coming soon" pages for every other area
components/               goto bridge, demo command menu, option switch, page notes
notes/                    one markdown file per route
app/custom.css            the one place to override the DS
lib/
  screens.ts              the screen registry (route, Studio id, variants)
  personas.ts             the four demo personas
  demo.tsx                DemoProvider: settings, key combo, seams into the shell
ds/                       the proposal module, copied from
                          packages/studio/registries/brightlocal/lib (JSX)
ds/data/                  the named datasets (JSON)
scripts/
  promote-screen.py       Studio JSX to app page
  check-promotions.mts    drift guard
```

## How it works

- **The design system is the npm package.** `app/globals.css` imports
  `@brightlocal/tokens/tailwind-preset.css` (their Tailwind v4 preset:
  tokens, fonts, utilities) and `@source`s the component dist so every
  class the components emit is compiled. Studio painted these screens
  through an in-browser compiler fed hand-extracted copies of the same
  files; here the package is the source, so there is no esm.sh and no
  runtime compiler.
- **The proposal module is app code.** `ds/*.jsx` is a verbatim copy of
  the Studio registry lib (`AppLayoutShell`, `ProposalSidebar`,
  `PageHeader`, the tweaker, datasets). `tsconfig.json` paths map the
  `@brightlocal/proposal*` import names onto it, so promoted screens
  import exactly what they imported in Studio. Real packages
  (`@brightlocal/ui-components`, `/icons`, `/illustrations`) resolve
  from node_modules as normal.
- **Screens are promoted, not rewritten.** `scripts/promote-screen.py`
  strips Studio's selection markers, renames the default export and
  stamps a provenance header. Screens stay `.jsx`. Each carries its own
  shell as authored, so a screen renders here as it did in Studio.
- **Navigation stays on the Studio protocol.** Promoted JSX keeps
  `data-grade-goto="screen:<id>"`; `components/goto-bridge.tsx`
  resolves ids through `lib/screens.ts` and drives the Next router.
  Areas with no promoted screen resolve to a skeleton page.
- **Personas drive the data.** `lib/demo.tsx` pushes the persona's
  dataset into the proposal module's session dataset seam and the look
  preset into its host seed, then remounts the screen. No screen edits
  needed for that; screens that should differ per persona (empty states
  for the starter persona, multi-location chrome) read `usePersona()`.
- **Comments** come from the Vercel toolbar, mounted only on Vercel
  builds (`VERCEL=1`). Commenters need a Vercel account.

## Promoting a screen from Studio

1. Dump the raw source (from `apps/mcp-server`, docs env loaded):

   ```bash
   cd apps/mcp-server && set -a && source ../docs/.env.local && set +a && npx tsx scripts/dump-screen.mts 47e40175-0d55-4d21-960b-26bdf6b01282 <designId> /tmp/screen.jsx
   ```

2. Transform it:

   ```bash
   python3 scripts/promote-screen.py /tmp/screen.jsx "app/(app)/<route>/page.jsx" --name "<Studio screen name>" --id <designId> --version <updatedAt ms>
   ```

3. Add or refresh the entry in `lib/screens.ts`. If the screen uses
   `React.` without importing it (the Studio sandbox provides a global),
   add `import * as React from "react"` under the `"use client"` line.
4. `pnpm -F @gradeui/brightlocal build`, then check the page.

`pnpm -F @gradeui/brightlocal check:promotions` reports any screen that
has moved in Studio since it was promoted.
