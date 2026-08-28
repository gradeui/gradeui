# Using real DS components through the Figma bridge

Hard-won notes from 27–28 Aug 2026, building BrightLocal RM screens in
`Brightlocal - Reviews` from the `Design System - UI Components` library.
Read this before concluding a component "doesn't exist" or reaching for a
hand-built substitute.

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
