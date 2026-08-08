# STUDIO-FLOWS — multi-screen navigation (click from screen to screen)

**Status:** F0 in build (July 2026, urgent — BrightLocal proposal needs
screen-to-screen navigation). Siblings: STUDIO-EMBED (the render
surface flows ride), STUDIO-CAPTURE (a flow is a walkable capture
target), STUDIO-DIRECTOR (scripted tours are the *directed* cousin of
free navigation).

## The decision

Flows live **in Grade**, not in a ported Next.js app. Porting
(`consume-app` pattern) buys real routing at the cost of the entire
iteration loop — every change re-ported by hand, no inspector, no
tweaker, no shares, no comments. The in-Grade version is small because
everything already exists except one primitive: **screens are ordered
rows in a project, and every render surface can already render any one
of them — what's missing is a way for a click inside screen A to mean
"now render screen B".**

## The wire contract

One attribute, stamped by the author (or the model) on any clickable
element in a screen's JSX:

```jsx
<HubStatCard data-grade-goto="Rankings Table" … />
<Button data-grade-goto="screen:dmrn…" …>Open</Button>
```

- Value is a **screen name** (matched case-insensitively against the
  project's screens) or `screen:<id>` for an exact pin. Names are the
  authoring ergonomic; ids survive renames.
- The **sandbox** (both renderers) owns ONE delegated click listener:
  `closest("[data-grade-goto]")` → `preventDefault` → post
  `{ type: "grade:goto" | "ext:goto", target }` to the host. No
  per-element wiring, works through DS components via rest-spread —
  the same trick as the `data-slot="app-layout-shell"` selection stamp.
- The **host** (`FastIframeHost` / `ExternalIframeHost`) surfaces it as
  an `onGoto(target: string)` callback. Hosts do not resolve targets —
  resolution needs the screen list, which is the consumer's knowledge.

Two-agent rule applies: the `grade:goto` handler lands in BOTH
`apps/docs/app/fast-sandbox/page.tsx` AND `apps/docs/lib/chat-sandpack.ts`;
`ext:goto` in `apps/docs/app/external-sandbox/page.tsx`.

## Resolution + the flow map

Consumers hold a **flow map** — `{ id, name, appSource }[]` for the
project's screens — and resolve a target to an `appSource`, then swap
the render. Swapping is what every surface already does when source
changes; navigation is just "source push with a different screen".

- **Share view (`/s/<token>`)**: the server component fetches the
  sibling screens (service-role, same project as the token's screen)
  and passes the map to `SharedScreen`. The token still *names* one
  screen — the entry point — but navigation may traverse siblings **the
  author explicitly wired** (`data-grade-goto` is authored intent; an
  unwired screen is unreachable). This is the "share a flow" answer:
  **a flow share IS a screen share whose screen links onward.**
- **Embed (`/e/<token>`)**: same map, same swap, minus chrome.
- **Studio canvas**: goto clicks do NOT navigate in edit mode (a click
  is selection). Interact/preview mode navigates. F0 ships edit-mode
  as a toast ("→ Rankings Table") so authors can verify wiring without
  leaving the canvas.

Unresolvable targets no-op with a console warn (and the toast in
Studio) — never a broken screen.

### Navigation is a page change, not an edit (8 Aug 2026)

Because navigation is a source push into the SAME sandbox document, it
inherited two edit-turn behaviours it should not have:

- **Scroll**: the new screen kept the old screen's scroll position, and
  React could carry the clicked goto button into the new tree, where
  the browser scrolled its new position into view. Long forms opened
  mid-page.
- **Flash**: the STUDIO-EDITS changed-node pulse fired on arrival.
  Sibling screens share chrome (same wizard rail, same field shapes),
  so the edit-diff heuristic saw "an edit" and pulsed the title and
  half the fields on every hop.

The fix is protocol-level, not a parent-side scroll (that fires before
the morph and loses):

- `FastIframeHost` takes a `navigationKey` prop, keyed on the FLOW
  ENTRY id, never the source. When the key changes, the next
  `grade:fast-compile` push carries a one-shot `navigation: true`.
- The Fast sandbox treats that compile as a page change: it scrolls its
  document to the top (and blurs the carried focus) AFTER the flushSync
  commit, so it wins over any focus-into-view scrolling, and it skips
  the changed-node flash.
- Viewer surfaces go further: the share view (single frame + compare
  panes) and the embed also pass `flashEdits={false}`, which disables
  the flash wholesale. Nothing on a share or embed is ever an edit.
- Streamed EDITS keep their scroll position and their flash by design:
  the key does not change when only the source does. Fast Frame only;
  share/embed flows never run on Sandpack.

## Showing the flow (the viewer's model)

- **History, not a sitemap.** The share view keeps an in-memory stack;
  Back is a chip in the share chrome (and Escape). No URL change — the
  token stays the address of the *flow*, not the position (captures and
  OG stay stable).
- The share header names the CURRENT screen (it already shows the
  screen name — it updates on navigation).
- Later (F2): an optional flow bar — dots/names of visited screens,
  click to jump back; a "flow" badge on shares whose entry screen has
  outgoing links.

## Transitions

- **F0: instant swap.** Both renderers already re-render fast on source
  push; correctness first.
- **F1: cross-fade** via the double-buffered preview (STUDIO-EDITS'
  draft-gate machinery) — old screen holds while the new one compiles,
  200ms fade on ready. This also hides compile latency.
- **F2: View Transitions API** inside the sandbox document for
  element-level morphs (shared elements matched by `data-hook`).

## Comments / tweaker / theming across a flow

- The tweaker's override state lives in the SHELL inside each screen's
  source — it resets on navigation in F0. F1 option: the host persists
  the tweak object and re-applies via a `grade:set-tweaks` push.
- Comments stay per-screen (threads are keyed by design_id); the share
  view swaps thread sets on navigation.

## Rollout

- **F0 (now):** wire contract in both sandboxes + hosts; flow map +
  swap + back chip in share view and embed; Studio edit-mode toast.
- **F1:** cross-fade; tweak persistence across navigation; Sandpack
  parity check; flow-aware MCP (save a `goto` map, preview walks it).
- **F2:** flow bar; "flow" badge on share management; View Transitions.
- **F3:** flow-aware capture (STUDIO-CAPTURE walks the graph → a
  clickable static export), Director records across navigations.

## F1/F2 build notes (16 Jul evening — Ali's priorities, build-ready)

> STATUS (16 Jul, late): **F1 precompile BUILT** (compile cache +
> ext:precompile in the external sandbox; precompileSources on
> ExternalIframeHost; share/embed wired). **@brightlocal/proposal M0
> BUILT** — via `runtime.libModules` + boot-time require registration
> rather than the blob-URL import map (screens are CJS-compiled;
> require is synchronous), Sandpack parity via file mount + import
> alias, hub-page.jsx migrated, plus a ProposalDataProvider data seam.
> Transitions (cross-fade / View Transitions) still open — the lib
> already stamps data-grade-transition. Detail: BRIGHTLOCAL-SIDENAV.md.

**F1 precompile ("instant linkage"):** new `ext:precompile { sources }`
message; external sandbox keeps a compile cache keyed by source hash,
idle-compiles flow siblings AFTER the current screen's ext:rendered;
ext:source checks the cache first. `ExternalIframeHost` gets
`precompileSources?: string[]`; share/embed pass the other flowScreens'
sources when 2+.

**Transitions are DATA ON THE LINK (Ali):** `data-grade-transition`
rides next to data-grade-goto (goto/`transition` fields in nav data and
card props). Values are presets ("fade" default | "slide-left" |
"slide-right" | "none" — extend in code, the toggles-with-presets
rule). Implementation ladder: double-buffered cross-fade first (hold
old screen until new stamps rendered), then View Transitions API inside
the sandbox document with data-hook-matched shared elements. The Back
chip plays the reverse of the transition that got you there.

**@brightlocal/proposal (M0) — the verbosity killer:** shared user-land
components (AppLayoutShell + tones/frames/layers presets, proposal
sidenav incl. SECTIONS-driven nav, PageHeader, HubStatCard, HubHeroCard,
ShellTweakerPanel) live in packages/studio/registries/brightlocal/lib/
proposal.jsx, compiled into the registry bundle as a SOURCE STRING.
Screens shrink to just the page: import { AppLayoutShell, ProposalSidebar,
PageHeader, HubStatCard } from "@brightlocal/proposal".
- External sandbox: sucrase-compile the lib source at boot, register as
  a blob-URL module in the import map BEFORE screen modules load (import
  maps are static — build the map with the blob entry up front).
- Sandpack/CodeSandbox parity (Ali's constraint — screens are a
  one-to-one copy today): the same source ships as a FILE in
  chat-sandpack's file map (/brightlocal-proposal.jsx) with the import
  aliased to it, so an exported sandbox = screen + one lib file, runs
  as-is. The copy stays one-to-one, just two files instead of one.
- Templates/recipes regenerate to import from the module instead of
  carrying in-file copies; generation prompt pins the import as the
  default scaffold for hub/dashboard asks (Ali: "used by default by any
  agent").
- Migration: new screens import; existing screens keep working (in-file
  copies are self-contained) and migrate on regen.

