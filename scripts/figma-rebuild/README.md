# figma-rebuild: captured app states -> Figma, out of real DS components

Rebuilds every captured BrightLocal Reviews state (scripts/capture-states.mjs
`--app`) in Figma from the live `Design System - UI Components` library, laid
out exactly where the browser put each node. Built 1 Oct 2026 for the
"Brightlocal - Review Manager - 1 Oct 2026" share file (x0kmVAyJZJoX52OnZPk96Q).

## The pipeline

1. **Capture with specs.** `node scripts/capture-states.mjs --app --spec
   --out=$HOME/Desktop/brightlocal-screens/ds-rebuild` shoots every state
   AND runs `extract.js` in the page at the moment of the shot, writing
   `<run>/specs/<state>.json`. Flags take `--flag=value`; `--only x` with a
   space is silently ignored and the whole suite runs.
   The app must be the DEV server (`preview_start brightlocal`, port 3020):
   the extractor reads component names and props off React's fiber tree,
   which a production build mangles.
2. **Serve.** `node scripts/figma-rebuild/serve.mjs ~/Desktop/brightlocal-screens/ds-rebuild 9228`.
   The plugin sandbox fetch()es the builder and specs from here and POSTs
   PNG exports back. 9228 because the figma-console bridge holds most of
   9223-9232 (check `lsof`); binds dual-stack because the plugin resolves
   localhost to ::1.
3. **Plan.** `python3 scripts/figma-rebuild/jobs.py <data> <run>` reads
   `lib/cardmap.json` (page / section / order of every StateCard in the share
   file) and stacks each state on `DS · <page>` in a section of the same name
   and x. `todo.py` narrows that to states not yet exported.
4. **Build.** One figma_execute per ~8 states, passing `fileKey`:
   `eval(fetch("/lib/batch.js"))(todo.slice(0, 8), run)`. About 2s a state.
5. **Check.** `python3 scripts/figma-rebuild/sweep.py <data>/<run>` diffs every
   export against its screenshot (`cmp/` side-by-sides, `sweep.txt` ranked).
   Under ~2% is text-metric drift between Chrome's and Figma's Inter; above
   that, look.

## How a node becomes Figma

- **Geometry first.** Every kept DOM node carries its border box; frames are
  absolute (no auto-layout), so the rebuild lines up with the shot by
  construction. Wrappers that paint nothing are dropped and their children
  hoisted.
- **DS identity on top.** Where the fiber tree names a DS component, a real
  library instance goes there instead: Button, Badge (incl. StatusChip), Tabs
  trigger (+ Badge Number count), Card (contents through its Card Content
  SLOT), Card Title, Card Description, Breadcrumb item, Pagination item,
  Avatar, Checkbox, Switch, Separator, Sidebar menu buttons, Logo. Lucide
  icons become `Icon / <Name>` instances. Anything unmapped is drawn.
- **Slots are filled loose, then mounted.** A node inside a slot inside an
  instance stops being reachable (docs/FIGMA-BRIDGE-COMPONENTS.md), so a
  Card's body is built in full before it is appended to the slot.

## Traps found building it

- **Imported sets are garbage-collected** unless an instance of them exists
  in the file. `lib/pin.js` imports and keeps one instance of each on the
  `DS rebuild · library` page; nested components (Badge Number, Card Title,
  Icon / Star...) are then reachable through those pins without a download.
- **One stalled library download blocks every later one.** Importing the
  full `Global Layout` / `Sidebar` sets never finished, and from then on no
  set that was not already cached would import. Cached sets still import in
  milliseconds. A plugin UI reload does not clear it; restarting the bridge
  plugin in that file (or Figma) is the only cure found. Build with
  `noImport: true` meanwhile.
- **Variable-font text hangs.** Library text carries Inter with axis
  `variationSettings` (or an empty family on a stale import); loading that
  can wait on the stalled download queue forever. `setLayerText` always
  normalises to static Inter at the same weight.
- **Tailwind v4 colours compute to oklab().** `bg-black/50` came back as
  `oklab(0 0 0 / 0.5)` and the scrim vanished; the extractor resolves every
  colour through a 1px canvas to rgb/rgba.
- **CSS paint beats SVG attributes.** A `fill-yellow-400` star has
  `fill="none"` in its markup; the extractor writes each part's computed
  fill/stroke back as attributes.
- **A timed-out figma_execute keeps running** in the plugin and keeps
  mutating; never assume it stopped.
