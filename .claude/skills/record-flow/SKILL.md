---
name: record-flow
description: Record a walked FLOW of a gradeui Studio project (click links across screens, scroll, open the tweaker, switch theme) as a clean, crisp, chrome-free video — with an optional teleprompter. Use when the user says "record a flow/demo", "make a product video", "screen-record the walkthrough", "capture me clicking through X". Works with any registry (gradeui or external like brightlocal) because it drives the real /e/ embed.
---

# Record a flow as video

Two recorders, SAME flow-JSON format — iterate on the fast one, final-render on the pristine one:

- **`scripts/record-flow.mjs`** — real-time Playwright capture (lossy VP8→h264). FAST (~1s per video-second). Captures view transitions natively. Use to iterate on choreography/pacing.
- **`scripts/record-flow-lossless.mjs`** — frame-stepped, true 2×-native, **mathematically lossless** (h264 `qp0`/yuv444p). Deterministic view transitions via WAAPI scrubbing (pauses the `::view-transition-*` animations and seeks 1000/fps per frame). ~1.5s per video-second. Use for the final.

Both: content laid out at **W×H = 1280×834** (H default is Ali's 834 minimum), captured at 2× → **2560×1668**. They hide chrome (Next "N" nub, flow Back chips), trim the loading head, and emit `.mp4` + `.webm`. ffmpeg comes from the `ffmpeg-static` devdep; Supabase key is read from `.mcp.json`. Dev server must be up (`pnpm dev`), or pass `--base=https://gradeui.com`.

```bash
node scripts/record-flow.mjs          --flow=scripts/flows/brightlocal-tour.json --out=~/Desktop/tour.mp4
node scripts/record-flow-lossless.mjs --flow=scripts/flows/brightlocal-tour.json --out=~/Desktop/tour.mp4 --fps=60
```

## Flow JSON

`{ "project": "<uuid>", "start": "<designId>", "w": 1280, "h": 834, "steps": [ … ] }`

Step types (any step may add `"caption": "…"` for the teleprompter):

| Step | Effect |
|---|---|
| `{ "dwell": 2500 }` | hold (talk-over pause). Lossless holds ONE screenshot — long pauses are ~free. |
| `{ "click": "<css>", "waitFor": "<css proving next screen>" }` | click a `[data-grade-goto]` link; waits for the swap. VT handled automatically. |
| `{ "scrollBy": 500, "ms": 900 }` | human-eased partial scroll ("scroll down a bit"). |
| `{ "scrollTo": "<css>", "ms": 900 }` | smooth-scroll an element into view (pre-click reveal). |
| `{ "scroll": "top" | "bottom", "ms": 900 }` | smooth to an end. |
| `{ "key": "Alt+T" }` | dispatch a keypress into the screen — **Alt+T opens the shell tweaker**. |
| `{ "select": "[data-hook=\"tweaker-preset\"]", "value": "live-site" }` | set a native `<select>` — switches the tweaker theme preset live. |

The scroll target is the largest `[data-radix-scroll-area-viewport]` inside the embed iframe.

## Teleprompter

Any step with `caption` makes the recorder emit, next to the mp4 (timed to the ACTUAL run so re-pacing re-syncs): `<name>.srt`, `<name>-script.txt` (readable), and `<name>-teleprompter.mp4` (your lines on a dark bg + brand accent, same duration). Or skip captions entirely and just talk over the clean demo.

## Brightlocal selectors (the example tour)

`scripts/flows/brightlocal-tour.json` walks: hub → AI Insights → Website → open an accordion → click a glossary acronym → GBP (left nav) → breadcrumb back to hub → tap Local Search Grid (view-transition morph) → zoom the map → back → open tweaker → Live theme.

- Hub cards: `[data-hook="hub-ai-insights"]`, `[data-hook="hub-local-search-grid"]`
- AI Insights module cards: `[data-hook="ai-stat-website"]` (also -google-business-profile, -reviews, -citations)
- AI Insights left sub-nav item: `[data-hook="sub-btn-ai-insights-google-business-profile"]`
- Actions accordion: `[data-slot="accordion-trigger"]`
- Glossary acronym (dashed underline → popover): `.decoration-dashed`
- LSG map zoom-in control: `[data-hook="lsg-zoom-in"]` (and `-zoom-out`)
- The shared-element VT card cover on the hub: `[data-grade-transition="cross-fade"]`
- Breadcrumb back to the hub (distinct from the sidebar card): `[data-grade-goto="screen:dmrurue2wmp9u"]:not([data-hook])`
- Tweaker theme preset: `[data-hook="tweaker-preset"]` (values: current, subtle-depth, heavy-depth, live-site)

## Notes

- The lossless recorder's smooth-VT trick is WAAPI scrubbing; `HeadlessExperimental.beginFrame` is unavailable on macOS (would work on Linux CI — see `scripts/spike-truelossless.mjs`, the go/no-go spike).
- To find selectors on a new screen, load its `/e/<token>?w=1280` in headless and query `[data-grade-goto]` / `[data-hook]` / `[data-slot]`.
- The share-view Back chips are hidden in recordings only; the back-stack still works in the live share.
