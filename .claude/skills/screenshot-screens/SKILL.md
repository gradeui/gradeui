---
name: screenshot-screens
description: Capture retina (@2x) screenshots of a gradeui Studio project's built screens — for slide decks, proposals, or docs. Use when the user says "get me screenshots of all the pages/screens", "screenshot the screens", "grab retina shots of the proposal", or similar. Produces two variants per screen (full content height + fixed 1280x900) and skips empty placeholder pages.
---

# Screenshot a project's screens (@2x)

Runs `scripts/capture-screens.mjs`, which renders each screen via its
`/e/<token>` embed in headless Chromium at `deviceScaleFactor: 2` and
writes PNGs. Two variants per screen:

- `full/<NN>-<slug>@2x.png` — full content height, nothing crops.
- `1280x900/<NN>-<slug>@2x.png` — fixed desktop frame so the sidebar
  never crops when dropped into a deck.

Empty placeholder screens (the dashed "page content goes here" stub or
the shared `<EmptyPrototypePage/>`) are **skipped** by default. The
Next.js dev "N" nub (localhost only) and the shell tweaker corner are
hidden in every shot.

## How to run

1. The dev server must be running (`pnpm dev`, default
   `http://localhost:3000`) — localhost is the source of truth for the
   current state. Use `--base=https://gradeui.com` only to capture the
   deployed build.
2. Get the project id (Supabase `projects` / `designs.project_id`). The
   BrightLocal "UI Vision" proposal project is
   `47e40175-0d55-4d21-960b-26bdf6b01282`.
3. From the repo root:

   ```bash
   node scripts/capture-screens.mjs --project=<uuid> --out=./shots
   ```

   The run takes a while (each screen is rendered twice with a map/font
   settle) — run it in the **background** (a foreground shell will hit
   the 2-minute cap) and read `manifest.json` / the log when done.

### Options

| Flag | Effect |
|---|---|
| `--project=<uuid>` | Required. Project to capture. |
| `--out=<dir>` | Required. Output dir (creates `full/` + `1280x900/`). |
| `--all` | Include empty placeholder screens too. |
| `--ids=id1,id2` | Only these design ids. |
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
