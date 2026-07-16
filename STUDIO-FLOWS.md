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
