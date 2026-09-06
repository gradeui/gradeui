# RM section videos — spec

One video per RM section, showing the section in action with natural pauses
and scrolls. Written 27 Aug 2026 so the work can be picked up cold.

## Use the existing pipeline, not `capture-states.mjs --video`

`scripts/record-flow-lossless.mjs` is the documented recorder (see the
`record-flow` skill). It is 2× native, mathematically lossless, drives
`/s/<token>?fullscreen=1` so the project's custom CSS loads, emits per-section
clips plus `sections.json`, and can carry captions.

`capture-states.mjs --video` was a stopgap written before that pipeline was
found. **It is superseded and has been removed.** Do not reintroduce it: two
recorders with different step formats is worse than one.

```bash
# iterate on choreography (fast, lossy)
node scripts/record-flow.mjs --flow=scripts/flows/rm-inbox.json --out=rm-inbox.mp4

# final render
node scripts/record-flow-lossless.mjs --flow=scripts/flows/rm-inbox.json \
  --out=rm-inbox.mp4 --fps=30
```

Dev server must be up (`pnpm dev`). Output nests in
`~/Desktop/brightlocal-videos/<name>-<stamp>/`.

## Screen ids

| Section | Screen | id |
|---|---|---|
| Review Manager | RM — Review Manager (DataTable) | `dmsxf5zjggd0n` |
| Review Tracker | RM — Review Tracker | `dmswb0i9c6oe5` |
| Reply Templates | RM — Reply Templates | `dmtaq1rm9eok2` |
| Review Showcase | RM — Review Showcase | `dmt094lhmpwbs` |
| Review Builder | RM — Review Builder | `dmt094j963aye` |

Project is `47e40175-0d55-4d21-960b-26bdf6b01282` throughout.

## Pacing

Ali's house pacing from `brightlocal-tour-narrated.json`: dwells of
**5000–6700ms** on a screen worth reading, **~2500ms** after a small change,
scrolls of **520–560px over ~950ms**. Hover-before-click is automatic (1200ms)
and should be left on: it puts the hover state on camera the way a human
would.

Do not chain fast steps. A demo that moves faster than a viewer can read is
the most common failure here, and it is not fixable in the edit.

## What each video must show

Mirror the captured states in `scripts/capture-states.mjs`, in the same order.
The `NOTES.md` in each screenshot folder is the caption source: the note beside
a state definition is written once and feeds the still, the markdown and the
video caption.

1. **Inbox** — list, open a reply panel, a read-only source, then the failure
   ladder (recoverable → blocking → terminal), then the AI quota walk
   (3 left → 2 → 1 → used up). The failure ladder is the point of this
   section; give it room.
2. **Insights** — donut with grouping, hover Other, switch Review Performance
   to table, scroll to Timeline, switch that to table.
3. **Templates** — list, open a template drawer, open a rule drawer, attempt a
   delete that is blocked, expand rule activity.
4. **Widgets** — dashboard, wizard type step, filters, format, then the detail
   drawer with the embed snippet.
5. **Review Builder** — hub, open the campaign drawer, switch to the All feedback
   tab, open the wizard.

## Interaction gotchas, all learned the hard way

These cost hours on 27 Aug. Read before writing selectors.

- **`data-hook` is dropped by `asChild`.** A `Button` inside
  `TooltipTrigger` / `ToggleGroupItem` / `CollapsibleTrigger` with `asChild`
  loses its `data-hook` on the way to the DOM. That is DS finding 3.2 in
  `RM-GET-REVIEWS-AND-WIDGETS-REPORT.md`, and it has bitten in three places.
  Target those by `aria-label` or `data-slot` instead:
  - Insights chart/table toggle → `[data-hook="perf-view-toggle"] [aria-label="Table view"]`
  - Rule activity → `[data-slot="collapsible-trigger"]`
- **The page scrolls in the shell's own container**, not the document.
  `record-flow` already targets the right element; a hand-rolled
  `document.scrollingElement.scrollTop` moves nothing.
- **Inbox failure rows are DERIVED, not fixed.** The five codes attach to the
  first five reviews that are both repliable and needing action, which lands
  them on rows **0, 2, 4, 8, 10** — not 0–4. Re-derive rather than hardcode if
  the seed changes: `node scripts/capture-states.mjs --dump-states` and the
  comment above `SIMULATED_FAILURES` in the screen source.
- **Row 10 has no composer.** It arrives already failed and blocking, so it
  cannot be used for anything needing a reply box or an AI button.
- **The AI quota decrements on a review's FIRST use only.** To show a count
  you must spend on N reviews and then open a *different* fresh one; a review
  that already used AI shows "AI suggestion" instead of the counter.
- **The pending send lasts ~900ms.** Anything that waits longer than that
  before capturing gets the resolved state instead.

## Verifying the result

A video that recorded the wrong thing looks like a video that recorded the
right thing. Before calling it done:

1. Check `sections.json` boundaries are non-trivial — a section of ~0s means
   its steps did nothing.
2. Scrub each section clip, or extract a frame per section and look at it.
3. For the inbox, confirm the failure alerts actually appear. The most likely
   silent failure is a click that matched nothing, leaving the list on screen
   for the whole clip.

The equivalent lesson from the stills: three frames passed their assertions
and were still wrong, and the thing that caught it was **hashing the output
and finding byte-identical frames**. Apply the same suspicion here — if two
section clips are the same length to the frame, look closer.
