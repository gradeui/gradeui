---
name: screenshot-screens
description: Capture retina (@2x) screenshots of a gradeui Studio project's built screens — for slide decks, proposals, or docs. Use when the user says "get me screenshots of all the pages/screens", "screenshot the screens", "grab retina shots of the proposal", or similar. Produces three variants per screen (full content height, fixed 1280x900, and the flow-video 1280x834 frame) in a timestamped run folder, and skips empty placeholder pages.
---

# Screenshot a project's screens (@2x)

Runs `scripts/capture-screens.mjs`, which renders each screen via its
**`/s/<token>?fullscreen=1` share view** in headless Chromium at
`deviceScaleFactor: 2` and writes PNGs. The share route (not the `/e/`
embed) is deliberate: it loads the project's **custom CSS from the
rules area** — e.g. the brightlocal sidebar-width rule that stops
"Google Business Profile" wrapping — which the embed omits. Share
renders at natural viewport size, so no scale-up tricks are needed.
(8 Aug 2026: fullscreen keeps the plain responsive fill for tall pages,
so they render as natively scrolling documents starting at the top, not
a centred content-height artboard. Full-height variants should use
Playwright's `fullPage` capture or an explicit tall viewport.
`?mode=dark|light` forces colour mode per run.)

Three variants per screen:

- `full/<NN>-<slug>.png` — full content height, nothing crops.
- `1280x900/<NN>-<slug>.png` — fixed desktop frame so the sidebar
  never crops when dropped into a deck.
- `1280x834/<NN>-<slug>.png` — the **flow-video frame**: identical
  dimensions to the recorder's section clips (2560×1668 @2x), so stills
  and clips mix cleanly in one Figma Slides deck.

Every run lands in a fresh **timestamped folder** so re-runs never
overwrite: `<out>/<YYYYMMDD-HHMMSS>/{full,1280x900,1280x834}/` plus a
`manifest.json`. `--out` defaults to `~/Desktop/brightlocal-screens`
(where Ali keeps them).

Empty placeholder screens (the dashed "page content goes here" stub or
the shared `<EmptyPrototypePage/>`) are **skipped** by default. The
Next.js dev "N" nub (localhost only) and the shell tweaker corner are
hidden in every shot. PNGs are tagged 144 DPI (pHYs, eXIf stripped) so
Figma imports them as crisp 2x assets.

## How to run

1. The dev server must be running (`pnpm dev`, default
   `http://localhost:3000`) — localhost is the source of truth for the
   current state. Use `--base=https://gradeui.com` only to capture the
   deployed build.
2. Get the project id (Supabase `projects` / `designs.project_id`). The
   BrightLocal "UI Vision" proposal project is
   `47e40175-0d55-4d21-960b-26bdf6b01282`.

   That project also contains scratch/iteration screens (older hub
   variants, component showcases). **The presentation set is these 9
   demo screens, in flow order** — pass them as `--ids` (order is
   preserved and drives the `NN-` prefixes):

   ```
   dmrotrgstba3l   All Locations
   dmrurue2wmp9u   UI Vision - Location Hub   (the demo hub — NOT "Location Hub", an older iteration)
   dmrotrgwxijez   AI Insights
   dmrouiz2ajnqw   AI Insights - Website
   dmrouiz5q03hr   AI Insights - Google Business Profile
   dmrouizaw0c9u   AI Insights - Reviews
   dmrouize7iinr   AI Insights - Citations
   dmroutf7bsndb   Local Search Grid
   dmrp1zpedr1co   Location Summary
   ```

3. From the repo root:

   ```bash
   node scripts/capture-screens.mjs --project=<uuid> --ids=<the 9 above>
   # themed set (one folder per look preset, applied via the shell tweaker):
   node scripts/capture-screens.mjs --project=<uuid> --ids=… --themes=heavy-depth,live-site
   ```

   The run takes a while (each screen is rendered three times with a
   map/font settle) — run it in the **background** (a foreground shell
   will hit the 2-minute cap) and read `manifest.json` / the log when
   done.

### Options

| Flag | Effect |
|---|---|
| `--project=<uuid>` | Required. Project to capture. |
| `--out=<dir>` | Output home (default `~/Desktop/brightlocal-screens`); the run nests in `<out>/<stamp>/`. |
| `--all` | Include empty placeholder screens too. |
| `--ids=id1,id2` | Only these design ids, **numbered in the order given** (flow order for storyboards). |
| `--themes=a,b` | Shoot each screen under each shell-tweaker look preset (`current`, `subtle-depth`, `heavy-depth`, `live-site`), one subfolder per preset. Applied like the flow recorder: synthetic Alt+T opens the tweaker, `selectOption` on `[data-hook="tweaker-preset"]`, Alt+T closes before the shot. Screens without the tweaker are shot as-is and flagged in the log + manifest. |
| `--base=<url>` | Render host (default `http://localhost:3000`). |

## Notes

- Reads the Supabase service-role key from `.mcp.json` at runtime
  (never printed, never committed). No secrets live in the script.
- "Built vs empty" is detected from the source: a screen is a
  placeholder if its `appSource` contains `page content goes here` or
  `EmptyPrototypePage`. If that convention changes, update
  `isPlaceholder()` in the script.
- Requires Playwright + Chromium (devdep of `apps/mcp-server`; run
  `npx playwright install chromium` if the launch fails).
- Map-heavy screens (Local Search Grid, the hub mini-map) need the
  Google Maps key wired in the registry lib to render tiles; without
  it they fall back to the wireframe grid. The 4.5s settle is tuned for
  tiles to load.
- `?motion=off` is an `/e/`-only param — the share route doesn't take
  it; the settle time outlasts entrance motion instead.
