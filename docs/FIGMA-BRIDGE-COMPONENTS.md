# Using real DS components through the Figma bridge

Hard-won notes from 27–28 Aug 2026, building BrightLocal RM screens in
`Brightlocal - Reviews` from the `Design System - UI Components` library.
Read this before concluding a component "doesn't exist" or reaching for a
hand-built substitute.

---

## START HERE (cold open)

**The job:** rebuild the RM screens in Figma out of real DS components,
instead of the flat screenshots currently pinned to each page.

**Before touching anything:**

1. Ask for the bridge to be running on **`Brightlocal - Reviews`**, and pin it:
   `figma_navigate` with `lock: true`. Unpinned, a call meant for the working
   file will silently run against whatever is active.
2. To look up a component, ask for the **live library** to be opened with the
   bridge too, then read it with `fileKey: p3krmC8DBUgqpbq6cLzaal`. Do not
   guess what the library contains, and do not use the drafts copy.
3. Read "The mistake to avoid" below before reporting anything as missing.

**What already exists in `Brightlocal - Reviews`:**

- Pages: `Components`, and one per section (Review Inbox, Review Performance,
  Reply Templates, Review Widgets, Get Reviews).
- Each section page has an empty `GlobalLayoutSlots` instance (the app shell,
  1280x900, with `nav` / `header-slot` / `main-slot`) and a
  **`Captured states`** section holding one `StateCard` per screenshot.
- `StateCard` (local): a 1280x900 `shot` slot with a title and note beside it.
  All 32 captured states have a card; the Review Inbox ones are filled.
- **Eight `REBUILD — … (Sheet)` frames**, one per overlay state, built on the
  library's real **`Sheet`** (28 Aug). Each is a 1280x900 frame holding an
  optional cloned backdrop, a scrim rectangle and the Sheet itself:

  | Page | Frame | Panel width |
  |---|---|---|
  | Review Inbox | `REBUILD — reply panel (Sheet)` | 640 |
  | Review Inbox | `REBUILD — reply composer (Sheet)` | 640 |
  | Review Inbox | `REBUILD — read-only source (Sheet)` | 640, no footer |
  | Review Inbox | `REBUILD — send failed, blocking (Sheet)` | 640 |
  | Reply Templates | `REBUILD — template editor (Sheet)` | 640 |
  | Reply Templates | `REBUILD — auto-reply rule editor (Sheet)` | 640 |
  | Review Widgets | `REBUILD — widget detail (Sheet)` | 640 |
  | Get Reviews | `REBUILD — campaign detail, Summary (Sheet)` | 896 |
  | Get Reviews | `REBUILD — customer preview (Sheet)` | 448 |

  Not built: the inbox **filters** drawer (a mobile-only bottom sheet, not in
  the captured desktop set), the widget picker's bottom-sheet filters (same
  reason), the wizard steps (in-page Cards, not overlays) and the centre
  dialogs (`Delete template`, `Stop campaign`, `Download`, `SMS credits`).
- **`Drawer / Right`** (local, built 28 Aug): **obsolete — delete it.** It was
  built before the library's `Sheet` was found. The DS calls this component a
  **Sheet**, not a Drawer, and it already ships `Sheet Body` and `Sheet Footer`
  slots, so no local substitute is needed. See "Working with Sheet" below.
- `Badge` and `ReviewRow` (local): **throwaway.** Built before the library was
  properly enumerated. The DS has a real Badge and a real Table/Data Table.
  Delete these and rebuild against the library.

**Where the screenshots and notes live:**
`~/Downloads/brightlocal-rm-figma-<stamp>/`, one folder per section, each with
a `NOTES.md`. Regenerate with `node scripts/capture-states.mjs` (see
`scripts/flows/RM-VIDEO-SPEC.md` for the sibling video pipeline).

**Suggested order of work:** one screen end to end before scaling up. The
Review Inbox list is the flagship and the hardest (needs Table, Badge, Tabs,
Input, Rating), so proving it proves the rest.

---

## The files

| File | Key | What it is |
|---|---|---|
| `Brightlocal - Reviews` | `gxrBnTlbab2cmrJuqZ4Q18` | The working file. RM pages live here. |
| `Design System - UI Components` | `p3krmC8DBUgqpbq6cLzaal` | The LIVE library. Read-only to us. |
| `Design System - UI Components (Copy)` | `fsyVNsGrRxdB7u2y1FQG1m` | A drafts duplicate. **Do not build against it.** |

The copy is a trap. Duplicating a Figma file re-keys its local components, so
the copy's `Badge` key points at nothing the working file can resolve. Anything
built from it links to the copy and never updates with the library.

## The mistake to avoid

**Do not infer the library's contents from what the working file happens to
use.** The plugin sandbox has no component-discovery API, so a scan of
`Brightlocal - Reviews` only ever returns components already instantiated
there. On 27 Aug that produced a confident, wrong claim that the DS had "no
Table, Badge, Input or Tabs" — it has all of them, plus Data Table, Drawer,
Select, Switch, Textarea, Rating, Tooltip and more. The claim reached a commit
message before it was caught.

To see what actually exists: **open the live library with the bridge plugin
running**, then enumerate its pages. Every page is a component family.

```js
// run with the LIVE LIBRARY as the active file
await figma.loadAllPagesAsync();
figma.root.children.map(p => p.name);            // the component families
// keys for one family:
const page = figma.root.children.find(p => p.name === 'Badge');
const set  = page.children.find(n => n.type === 'COMPONENT_SET');
set.children.map(v => ({ name: v.name, key: v.key }));   // VARIANT keys
```

## Getting a component into the working file

Three routes. Only the third is reliable.

**1. `importComponentSetByKeyAsync(setKey)` — hangs.** Never returned in
testing, even for a set already used in the file.

**2. `importComponentByKeyAsync(variantKey)` — unreliable.** Worked once
(`Icon / Star`), then began timing out at 8–12s for every key, including
`Button`, which is used all over the working file. Do not build a workflow
on it. If you must try, race it against a timeout so a hang fails fast:

```js
const res = await Promise.race([
  figma.importComponentByKeyAsync(key).then(c => ({ ok: true, c })),
  new Promise(r => setTimeout(() => r({ ok: false, timedOut: true }), 8000)),
]);
```

**3. Reach the main component through an EXISTING instance, then
`createInstance()`. This is the one that works** — ~280ms, and the result is
a genuine remote instance (`mainComponent.remote === true`) that tracks the
library.

```js
await figma.loadAllPagesAsync();
async function mainComponentNamed(name) {
  for (const p of figma.root.children) {
    for (const n of p.findAll(x => x.type === 'INSTANCE')) {
      let mc = null;
      try { mc = await n.getMainComponentAsync(); } catch { continue; }  // detached sublayers throw
      if (!mc) continue;
      const set = mc.parent?.type === 'COMPONENT_SET' ? mc.parent : null;
      if ((set ? set.name : mc.name) === name) return mc;
    }
  }
  return null;
}
const btn = await mainComponentNamed('Button');
const inst = btn.createInstance();
```

### The consequence, and the one manual step

Route 3 needs the component to exist in the file already. So for anything not
yet used, **ask for one instance to be dragged in from the Assets panel**, once
per component. After that it is harvestable and reusable forever, and the
scratch instance can be deleted.

That one drag is cheaper than any workaround, and far cheaper than hand-building
a substitute that then has to be replaced.

## The build harness (read this before writing another panel)

Three things live in the working file's **root plugin data**, and together they
turn a panel from a 300-line script into a 30-line one:

| Key | What |
|---|---|
| `rmHelper` | The whole helper library, as source. `const H = await eval(figma.root.getPluginData('rmHelper'))` |
| `rmReg` | `{ familyName: componentSetNodeId }` for every set the panels use |
| `rmIcons` | `{ iconName: componentNodeId }` |

**`eval` works in this sandbox** (so does `new Function`), which is what makes
the stored-helper trick possible. Without it every call would re-paste ~14KB of
boilerplate.

`H` exposes `panel`, `shellBody`, `footerRow`, `head`, `metaBlock`,
`reviewBlock`, `card`, `codeBlock`, `box`, `btn`, `iconBtn`, `badge`, `sepH`,
`social`, `rating`, `textarea`, `input`, `select`, `checkbox`, `progress`,
`tabTrigger`, `alertBox`, `alertWithButton`, `T`, `F`, `wide`, `tall`,
`addWide`, `detailRow`, `labelled`, `findNamed`, `setText`. A whole panel is:

```js
const p = await panel({ page: 'Brightlocal - Review Inbox', name: '…', x, y, behind: '48:7947' });
const { scroll } = shellBody(p.bodySlot, await head('1 of 60'));
addWide(scroll, await metaBlock({ source: 'Google', mark: 'Google', rating: '5.0', … }));
await footerRow(p.footSlot, [await btn('Outline', 'Skip reply'), await btn('Primary', 'Send reply')]);
```

To extend the helper, read `rmHelper`, string-replace the piece you want, write
it back, and `eval` to check it still parses. Patching beats re-pasting.

### `figma_execute` has a hard 30-second cap

The `timeout` argument does **not** raise it — the plugin side kills the call at
30s regardless. A script that builds more than about one panel will die
part-way and leave orphans at the page root. So:

- **One panel per call.** Split a big panel into 2–3 calls, returning the
  `scroll` and `footSlot` ids from the first so later calls can continue.
- **Sweep strays before re-running.** `createInstance()` parents to the current
  page, so a mid-script failure leaves `Button / …`, `panel-nav`, `panel-header`
  and friends scattered at the page root.

### Never import by key inside a build script

`importComponentSetByKeyAsync` — which the earlier notes recorded as hanging —
**does work now**, but each call costs 1–2s, and ten of them is most of the 30s
budget. Import everything **once** into `rmReg` / `rmIcons`, then resolve with
`figma.getNodeByIdAsync`, which is instant. Every key is in
[`docs/figma-library-keys.tsv`](./figma-library-keys.tsv) — 1,691 rows of
`page \t SET|CMP \t name \t key`, dumped from the live library. Regenerate it
by walking `figma.root.children` with the library as the active file.

**One trap:** the id an import returns may be a **stale cached version** of the
component. `Sheet` came back as a node predating the slots, so
`Show Footer#27228:1` did not exist on it, and `Button` came back with 95
variants where the file's own copy has 121. When a set is already used in the
file, prefer the id reached through an existing instance
(`(await inst.getMainComponentAsync()).parent.id`) over the imported one.

### Build content BEFORE reparenting into a slot

Once a node is inside a slot that is itself inside an instance, **its sublayer
ids go stale** — `children` throws `The node (instance sublayer or table cell)
… does not exist`, and the content becomes unreachable to the API even though
it renders correctly. So fill a Card's content slot first, then append the Card
to the panel:

```js
const c = await card({ title: 'Live preview', desc: '…' });
c.content.appendChild(body);       // fill it while it is still loose
scroll.appendChild(c.card);        // now mount it — after this, c.content is dead
```

If you get it the wrong way round the only fix is to remove that child and
rebuild it — the scroll frame's own direct children stay reachable.

### `setProperties` succeeds, text silently does not

`node.characters = '…'` throws when the layer's font is not loaded, and the
usual `try/catch` swallows it — which is how a Card shipped reading
"This is a card description." Always go through `setText`, which loads
`node.fontName` first.

## Component property maps

Every DS component ships label / description / placeholder sub-layers turned ON
by default. Forgetting to turn them off is what makes a rebuild look wrong: a
Textarea renders "Label Text" above and "729 characters left." below, and a
Card renders "This is a card description."

| Component | Property | Use |
|---|---|---|
| Textarea | `Show Label#183:11`, `Show Description#183:16`, `Placeholder Text#183:5`, `Label Text#183:2`, `Description Text#183:8` | placeholder is the visible value |
| Input | `Show Label#65:9`, `Show Description#334:40`, `Show Link#501:47`, `Placeholder Text#65:12`, `Label Text#65:6` | variant `Horizontal Layout=No, Variant=Text, State=Filled` for a filled field |
| Select | `Show Label#345:164`, `Show Description#345:170`, `Placeholder#3001:0` | `State=Filled` when it carries a value |
| Checkbox | `Show Text#266:18`, `Show Description#48:23`, `Label Text#53:0` | `Status=Active` means **ticked**, `Inactive` unticked. Also force `layoutSizingHorizontal = 'HUG'` — it defaults to FILL and shoves its row's label to the far right |
| Card | `Show Media#28396:0`, `Show Header#28091:0`, `Show Content#28091:9`, `Show Footer#28091:18`, slots `Card Content#30788:108` / `Card Footer#30788:81` | no boolean for the description — hide the `Card Description` **instance** with `.visible = false` |
| Progress | `Label#29423:0`, `Value#29423:6`, variants `Percent=0/25/50/75/100%` x `Colour=Green/Red/Orange` | only those five steps exist |
| Tabs / Trigger | `Tab Text#183:21`, `Badge#17421:0`, `Active=On/Off` | the count lives on the nested `Badge Number` text |
| Badge | `Show Left Icon#17100:0`, `Show Right Icon#17100:11`, `Badge Text#26:6` | `Variant=Primary` is the green one |
| Alert | `Title#17096:0`, `Description#17096:3`, `Button#17096:7`, `Icon#17096:5`, `Title Text#26:5`, `Description Text#26:4`, `Variant=Destructive/Info/Success/Warning` | the action button lays out as a **second column** and squeezes the copy — the same reason the code puts its buttons inside the description instead |
| Rating | `Rating=1.0…5.0` x `Size=Default/Small` | no thumb up/down variant |

## Instance sublayers: what can and cannot be overridden

The bridge hits several hard API limits when editing inside an instance. All
of these **fail silently or throw** — none of them warn.

| Operation on an instance sublayer | Result |
|---|---|
| `node.resize(w, h)` / `resizeWithoutConstraints` | **Silently no-ops.** Reads back the main component's width. |
| `node.layoutSizingHorizontal = 'FILL'` | **Works.** This is the only way to change a sublayer's width. |
| `node.layoutMode = 'HORIZONTAL'` | **Silently no-ops.** Direction is fixed by the main component. |
| `node.padding*` / `itemSpacing` / `strokes` / `fills` | **Work.** |
| `node.rotation = 180` | **Throws** `This property cannot be overridden in an instance: relative-transform`. |
| `node.visible = false` | **Works** (use it instead of a boolean prop when the prop is unreadable). |
| `slot.appendChild(anyNode)` | **Works**, even when the slot declares `allowPreferredValuesOnly: true`. That restriction is UI-only. |

Two consequences worth knowing before you plan a build:

**To widen a Sheet panel**, resize the *Sheet root* and set its `_SheetContent`
to `FILL`. The root's own fill is the 50% scrim, so drop it and lay a separate
scrim rectangle behind if you still want the dimmed backdrop:

```js
sheet.fills = [];                 // keep a copy first, it is the scrim paint
sheet.resize(640, 900);
content.layoutSizingHorizontal = 'FILL';   // now 640, resize() never would have
```

**To rotate an icon**, rotate the whole Button. `rotation` is blocked on an
instance's children but allowed on an instance whose parent is a plain frame,
so a chevron-up is a ghost icon Button holding `Icon / ChevronDown`, rotated
180. The background is transparent, so nothing gives it away. (The library has
`Icon / ChevronUp`, but it is not yet instantiated in the working file, and
route 3 cannot reach what is not already there.)

**Slot layout is fixed**, so a footer slot that is `VERTICAL, align CENTER`
stays that way. Put a full-width horizontal frame inside it and fill that:

```js
row.layoutMode = 'HORIZONTAL'; footSlot.appendChild(row);
row.layoutSizingHorizontal = 'FILL';   // buttons now sit left, in a row
```

## Working with `Sheet`

`Sheet` is the DS's right/left/top/bottom overlay — what the code calls a
Drawer. 8 variants (`Breakpoint` md/sm x `Position` left/right/top/bottom),
and md/right is 384 wide with the panel right-aligned inside a scrim.

Its properties:

| Property | Type | Notes |
|---|---|---|
| `Sheet Body#31063:0` | SLOT | free-form |
| `Sheet Footer#31063:9` | SLOT | declares Button as its only preferred value; the API ignores that |
| `Show Header#27228:10` | BOOLEAN | false hides the DS title/description block |
| `Show Footer#27228:1` | BOOLEAN | |
| `Show icon#29064:0` | BOOLEAN | the icon beside the title |
| `Title Text#220:40`, `Description Text#220:49` | TEXT | |

`Sheet / Close Icon` is an **absolutely positioned sibling** of the header with
a MAX horizontal constraint, so it survives `Show Header = false` and stays
pinned top-right when the panel is widened. The RM panels use a ghost icon
Button on the header's own centre line instead, so hide it.

To reproduce a panel whose header is not a title (the reply panel's is
prev/next/counter/close), set `Show Header = false`, zero `_SheetContent`'s
padding, and build header + scroll region as two children of the body slot.

## Button's component set has errors

`Button` has duplicate variants in the library
(`Variant=Destructive, State=Default, Size=default` appears twice). Any read of
`componentProperties` or `componentPropertyDefinitions` on a Button — or on the
set — throws `Component set for node has existing errors`, and `setProperties`
is therefore unusable. **Wrap every property read in try/catch**, or one bad
set kills a whole document scan.

The workaround is to instantiate the exact variant component and edit its
layers directly:

```js
const b = set.children.find(c => c.name === 'Variant=Outline, State=Default, Size=default')
             .createInstance();
for (const n of b.findAll(n => n.type === 'INSTANCE')) n.visible = false;  // drop placeholder icons
b.findOne(n => n.type === 'TEXT').characters = 'Edit reply';
```

Note `createInstance()` parents to the **current page**, not to your target. If
a script throws between `createInstance()` and `appendChild()`, it leaves
strays at the page root — sweep them by name before re-running.

## Colour variables

Bind fills rather than hard-coding hex. The ids below are from the live
library's base collection (`.../23479:98`):

| Token | Variable id |
|---|---|
| `base/foreground` | `VariableID:79bce71fe1f71efc32d4c728dfd226e038f4d4b5/30282:910` |
| `base/muted-foreground` | `VariableID:d1a429d113c8a646d7ed44879bbe3c501ff353b9/30282:913` |
| `base/muted` | `VariableID:90a546c02d71c69eeb9dc12efe8aa98563804ee8/30282:912` |
| `base/border` | `VariableID:9e76c67e238efde83e68c18b734285bc2d80d011/30282:905` |
| `base/success-background` | `VariableID:cb35b3c72ef9a3d10aa4520b6283eec8dc344c84/23479:159` |

```js
const v = await figma.variables.getVariableByIdAsync(id);
const paint = figma.variables.setBoundVariableForPaint(
  { type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', v);
```

To discover more, read any existing text node's `fills[0].boundVariables.color.id`,
resolve it, then walk its collection's `variableIds`.

## Known gaps in the library

Real absences, found while building the RM screens. Each one currently ships a
stand-in, so check here before hand-drawing another:

- **No TripAdvisor mark.** `Social Media Icon` has Google, Facebook and Yelp
  (Original and Neutral) but no TripAdvisor. The Figma rebuild carries a named
  blank placeholder; the code carries a redrawn stand-in marked "must not ship".
- **`Rating` has no thumb up/down variant**, so Facebook's recommend/not model
  renders as stars in Figma.
- **No `Icon / Trash2` or `Icon / Pencil`** instantiated in the working file, so
  the reply panel's footer buttons are text-only where the build has icons.
- **No area/line `Chart` instance** was placed: the campaign panel's "Reviews
  over time" carries a labelled placeholder box where `Chart / Area Chart`
  belongs.
- **`Progress` only has 0/25/50/75/100%**, so the funnel and NPS bars are
  rounded to the nearest quarter rather than showing their true ratios. On a
  real distribution that is fatal, not untidy: Review Insights' ratings run
  836 / 93 / 21 / 13 / 33 / 106 / 14 against a peak of 836, so six of the seven
  bars snap to zero and the chart reads as one bar and six empty tracks. Those
  are drawn as track + fill at the true ratio instead, named
  `rating-bar (hand-drawn: Figma Progress is quantised to 25% steps)`.
- **The chart components under-report their height.** A `Chart / Line Chart`
  instance measures 246 tall and draws its x-axis labels BELOW that, outside
  the frame's bounds, so the next sibling in an auto-layout stack lands on top
  of the month labels. Leave a spacer, or budget roughly 24px more than the
  instance says it needs. Forcing the instance shorter makes it worse: the plot
  squashes and the labels stay where they were.
- **The chart components carry their own demo data.** `Donut` exposes only
  `Donut Text` and `Description Text`, the centre pair; the arcs, the axis
  labels and the series values are baked geometry with no prop to set them. So
  the Review Insights rebuild carries the right centre figure (1116 reviews)
  against slice proportions and month labels that belong to the component
  rather than the product. Changing them means editing vectors inside an
  instance.

## Bridge mechanics

- `figma_list_open_files` shows every file with the plugin running.
  `figma_navigate` with `lock: true` pins the target so it cannot silently
  switch mid-task. **Pin it.** A call that was meant for the working file ran
  against the library because the active file had moved.
- Passing `fileKey` to `figma_execute` targets a connected file without
  switching, but in testing it timed out where navigating first did not.
  Navigate and pin instead.
- `figma_execute` has a 5s default timeout. Pass `timeout` for anything that
  loads pages or walks the document.
- `getMainComponentAsync()` throws on instance sublayers. Always wrap it in
  try/catch inside a `findAll` loop, or one detached node kills the whole scan.
- `figma_capture_screenshot` will not go below `scale: 0.5`.

## Images

Images cannot be placed programmatically through this bridge:

- `figma.createImageAsync(url)` is blocked by the plugin manifest's
  `allowedDomains`, including for `http://localhost:9230`, which IS in the
  allowlist.
- Plain `fetch` from the sandbox fails outright — the sandbox has no network.
- `figma_set_image_fill` works but takes base64 through the tool call, which
  costs roughly 70k tokens per 1280x900 screenshot.

**So: a person drags the images in.** Build the frames and captions
programmatically, leave an empty `SLOT` in each, and place the dropped
rectangles into slots afterwards — that part IS automatable:

```js
const base = n => n.replace(/\s+\d+$/, '').replace(/\.png$/i, '');  // Figma suffixes " 1", " 2"
slot.appendChild(rect); rect.x = 0; rect.y = 0; rect.resize(slot.width, slot.height);
```

Watch for a repeated filename: Figma's " 1"/" 2" suffix is the only sign that
the same file was dropped twice and another was missed. That is how a missing
`inbox-04` was spotted.

## Component families in the live library

Accordion, Alert, Alert Dialog, Aspect Ratio, Avatar, Badge, Badge Number,
Breadcrumb, Button, Calendar, Card, Carousel, Centred Layout, Chart, Checkbox,
Chip, Combobox, Collapsible, Command, Context Menu, **Data Table**, Date Picker,
Dialog, **Drawer**, Dropdown Menu, Global Layout, Hover Card, Header, Input,
Input OTP, Input Password, Input Chip, Label, Link, List, Logo, Menubar,
Multi-select [WIP], Navigation Menu, Pagination, Popover, Progress, Radio Group,
Rating, Resizable, Skeleton, Scroll Area, Select, Separator, Sheet, Sidebar,
Slider, Sonner, Split Layout, Switch, **Table**, **Tabs**, Textarea, Toggle,
Toggle Group, Tooltip.

Set keys captured 28 Aug (variant keys are on the children, read them live):

| Component | Set key |
|---|---|
| Alert | `554c7cfc95a06b87fc36c1fbbecb211dbec6c3e3` |
| Badge | `5c75da4590351a2d1e25391c4ac03bf8e2d27e8d` |
| Breadcrumb | `278fedbfb508449ee4731820b5224325a06ea06e` |
| Card | `2e1b50dd6bc1b825057b4c12a517830f3b53d7d0` |
| Data Table | `2e6cc6b6dac756213cbc158a9615df480bf33ddb` |
| Drawer | `e158ff602896cbf110e881e83aad6ec92154d90c` |
| Input | `549f27cf9297db49200573fe5f8be6ce62ef779d` |
| Pagination | `42373662d6bad88673cc35062115d86451210615` |
| Switch | `4b8748dceac66a16cb2fd9176cb1267256a51be9` |
| Tabs | `a2996f66bacd449a4e938b83d8332687aab474cd` |
| Textarea | `3109289adb50aa37951b594bc4dffaa7c7335809` |
| Tooltip | `44be25a8fcc096b35c2d79b2213df56cfd632912` |

Keys are for reference and for route 2 if it ever becomes reliable. Route 3
does not need them.

## REST-backed tools

`figma_get_library_components`, `figma_get_library_component_by_key` and
friends need `FIGMA_ACCESS_TOKEN`. As of 28 Aug that token is **expired**
(`401 Token has expired`), so every REST route is unavailable and the
plugin-side approaches above are the only ones that work. Refreshing it would
make library enumeration much easier than opening the library file each time.
