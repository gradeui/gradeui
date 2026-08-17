# BrightLocal DS findings — RM Review Inbox

**Date:** 17 Aug 2026
**Package under test:** `@brightlocal/ui-components@2.25.0`, `@brightlocal/icons@2.3.1`
**Screen:** `RM — Review Inbox (DataTable)` (`dmsxf5zjggd0n`), project *Brightlocal Vision - Share*
**Method:** the screen was rebuilt from hand-rolled stand-ins onto real DS components,
one component at a time, verifying each in a live render. Every finding below
came out of composing the real package, not from reading its docs.

Class strings are quoted verbatim from the shipped `dist/*.js`. Pixel values are
`getComputedStyle` / `getBoundingClientRect` measurements from the running screen,
not estimates.

---

## Why this list looks different from the earlier ones

The August reports (`brightlocal-ds-harness-failures.md`,
`grade-registry-contract-drift.md`, `brightlocal-validator-contract-fix.md`) were
dominated by *"the DS can't do this"* conclusions. Most of those were wrong. They
came from a contract registry that had drifted from the shipped package, so
`save_screen` rejected props that genuinely existed and authors hand-rolled
replacements for components that worked.

That is fixed: contracts are now extracted from the package's own `.d.ts` via the
TypeScript checker, so they follow `extends` / `Omit<>` / `ComponentProps<>` /
`VariantProps<>`. **Every "missing" component in those reports turned out to
exist.** `Checkbox.checked`, `Button.onClick`, `TabsTrigger.value`,
`DataTablePagination.table`, `Progress.value` are all real.

One specific claim is worth retracting by name. `DataTableSelectRowCheckbox`
"renders but does not toggle" was not a DS bug. It renders
`disabled={!row.getCanSelect()}`, and `getCanSelect()` is false unless
`enableRowSelection: true` is passed to `useDataTable`. It was never enabled.

So the findings that remain are almost all **composition** defects: components
that are individually fine and wrong when assembled. That is a much better class
of problem to have, and it is also the class that only shows up when someone
builds a real screen.

---

## 1. `size` means three different things

Building one toolbar row at one size needs three separate corrections.

| Component | `sm` does | Result |
|---|---|---|
| `Button` | `py-2 px-3 h-8 text-xs` | box **and** type rescale (14px → 12px) |
| `DataTableSearch` / `InputGroup` | `h-8` only | box rescales, type does not |
| `Button` + `iconOnly` | appends `size-9 p-0` **after** the size variant | `size` is overridden entirely |

`InputGroup`'s size variants are height-only:

```
size: { default: "h-9", sm: "h-8", lg: "h-10" }
```

Measured in a single toolbar row at `size="sm"`: filter buttons 32px/12px, search
field 32px but with a **16px** input. The icon-only clear button rendered **36px**
next to 32px siblings until corrected with `className="size-8"`.

**Suggested:** make `size` rescale type consistently, and have `iconOnly` respect
`size` (`size-9` at default, `size-8` at sm, `size-10` at lg) instead of hardcoding.

## 2. `Input` and `InputGroup` disagree about type size

`InputGroup` sets `text-sm` on the wrapper. `Input` sets `text-base` on the
control. The control wins, so **every DS input renders at 16px** regardless of the
group's size.

The 16px is doing useful work by accident: iOS Safari zooms the viewport when a
focused input is under 16px. But it is a contradiction rather than a decision, and
at `size="sm"` it puts a 16px field beside 12px buttons.

It reaches further than form fields. `CommandInput` inherits it, so a facet
menu's search box renders **16px in a 48px (h-12) header above 14px/30px rows** —
the search line reads as a different component from the list it filters.

**Suggested:** decide deliberately. The common resolution is `text-base
sm:text-sm` on the control, which keeps the iOS behaviour on touch and matches the
surrounding type on desktop.

## 3. The DS's own toolbar recipe mixes shapes

`InputGroup` is `rounded-md` (6px). `Button` is `rounded-full`. The published
`DataTableToolbarLeft` composition is a search field plus `sm` filter buttons,
which renders a **rounded rectangle in a row of pills**.

Measured: search radius 6px, facet button radius 9999px, at identical 32px heights.

Worse, the DS's own field-shaped controls declare **three different radii**:

| Component | radius |
|---|---|
| `SelectTrigger` | `rounded-sm` |
| `InputGroup` / `DataTableSearch` | `rounded-md` |
| `Button` | `rounded-full` |

They resolve to the same 6px under the current theme, so the inconsistency is
invisible until someone re-themes and the row splits into three shapes. It also
makes "match the design system" genuinely ambiguous for anyone building a filter
bar: a facet trigger is a Button by construction but a Select by behaviour, and
those two answers disagree.

**Suggested:** one declared radius for field-shaped controls, and either give
`InputGroup` a pill option or change the toolbar recipe.

## 4. `Command` inside `Popover` double-borders

`Command` root:

```
bg-popover text-popover-foreground flex w-full flex-col overflow-hidden rounded-lg border shadow-md
```

`PopoverContent`:

```
bg-popover text-popover-foreground z-50 w-72 rounded-md border p-4 shadow-md
```

Nesting them — which is the standard combobox / faceted-filter composition — stacks
**two borders, two shadows and two mismatched radii** (`md` outer, `lg` inner).

Also note `PopoverContent`'s `p-4`. That is sized for prose popovers and is far too
generous around Command's own insets; every menu-in-a-popover needs `p-0`.

**Suggested:** drop Command's surface chrome when nested, or ship the composed
Combobox so consumers never assemble it by hand.

## 5. `CommandGroup` padding is uneven

```
overflow-hidden px-2 py-1
```

8px horizontal against 4px vertical, so an item's highlight sits unevenly in the
panel. Upstream shadcn uses a uniform `p-1`. Measured after correcting to `p-1`:
5px on left, right and top (4px padding + 1px border).

## 5b. `CommandItem` rows are out of proportion with the DS's own controls

```
relative flex cursor-default items-center gap-2 rounded-sm px-2 py-3 text-sm
```

`py-3` gives a **42px** row. The `size="sm"` Button that opens the menu is
**32px**, so the panel reads noticeably heavier than the control it belongs to.
Upstream shadcn's CommandItem is `py-1.5`, which lands at 32px exactly.

If the intent is a comfortable touch target, it should scale with context
rather than being fixed — a filter menu on desktop is the common case and it is
the one that looks wrong.

**Suggested:** `py-1.5` as the default, or a density prop on `Command`.

## 5c. `CommandItem selected` shifts anything already right-aligned

`selected` appends its checkmark with `ml-auto`, and only when selected:

```jsx
children, r && <Check className="text-foreground ml-auto" />
```

In a faceted filter every row carries a count, so toggling an option moves that
count sideways by the tick's width. A column of numbers dances as you select.

Reserving the slot is easy once you know (`<span className="flex w-4 shrink-0
justify-end">`), but it means dropping `selected` and drawing the tick yourself,
which also loses the `data-selected-item` hook.

**Suggested:** render the tick slot unconditionally and toggle only the glyph,
so trailing content never reflows. Counts beside a selection control are the
common case, not an exotic one.

## 5d. `Command` has no arrow-key navigation outside `CommandVirtualList`

The only `ArrowDown` / `ArrowUp` handling in `command.js` sits inside
`CommandVirtualList`, as a keydown listener it attaches to the closest
`[data-slot="command"]`:

```js
const d = v.current?.closest('[data-slot="command"]');
const p = (i) => { switch (i.key) { case "ArrowDown": … case "ArrowUp": … case "Enter": … } }
```

So `Command` + `CommandList` + `CommandItem` — the composition in the DS's own
docs, and the one shadcn's combobox uses — is **mouse-only**. Verified live:
focus on the `CommandInput`, two ArrowDowns, highlight never moves and
`aria-activedescendant` stays `null`. Same with focus moved onto the `Command`
root itself.

This matters more than it first looks. A "searchable action menu" that cannot
be driven from the keyboard is not a menu, and every consumer following the
documented composition inherits the problem silently — nothing errors, the
arrows simply do nothing.

**Suggested:** move the keyboard model onto `Command` itself so every
composition gets it, rather than only the virtualised one.

## 6. `SheetContent` has no scroll region

```
bg-background fixed z-50 flex flex-col gap-4 p-6 shadow-lg
```

plus `side="right"`: `inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm`.

It is a flex column at full height with **no overflow handling anywhere**, and
`SheetFooter` is `mt-auto`, which silently assumes the content fits. Any Sheet
taller than the viewport becomes unscrollable — content is simply unreachable.

There is no `SheetBody`. `DrawerBody` exists but is `mx-auto w-full max-w-sm px-4`,
a width wrapper rather than a scroller, so `Drawer` has the same problem.

The fix a consumer must find is not obvious: `flex-1 min-h-0 overflow-y-auto`,
where `min-h-0` is load-bearing because a flex child's default `min-height: auto`
refuses to shrink below its content, so `overflow-y-auto` never engages without it.

**Suggested:** ship `SheetBody` (and make `DrawerBody` scroll), so the default
composition cannot strand content.

## 7. No safe-area handling anywhere in the package

`grep -r safe-area-inset dist/` returns nothing. `side="right"` is `inset-y-0
h-full`, so on iOS a Sheet's footer buttons sit under the home indicator.

**Suggested:** `pb-[env(safe-area-inset-bottom)]` on bottom-anchored surfaces —
`SheetFooter`, `DrawerFooter`, and any fixed bottom bar.

## 8. `DataTableRow` accepts no props

`DataTable` renders rows itself:

```js
function W({ row }) {
  return <TableRow data-state={row.getIsSelected() ? "selected" : undefined}>…</TableRow>
}
```

No handlers, no passthrough. Two consequences:

- **Row clicks** must be attached per-cell.
- **An "open in panel" row** cannot be marked. `data-state="selected"` is already
  taken by checkbox selection, so reusing it makes the open row read as checked and
  fight bulk selection.

Worked around here by marking a cell we own and reaching the row with
`[&_tbody_tr:has([data-open-row])]:bg-accent`. It works, and it should not be
necessary. (`TableRow` itself is fine — it extends `ComponentProps<"tr">` and takes
`onClick` — so this is specific to `DataTable`'s internal row.)

**Suggested:** an `onRowClick` prop, or a `rowProps` / `getRowProps` passthrough.

## 9. `DataTableBulkActions` cannot show a resting state

```js
return selectedCount === 0 ? null : …
```

Correct for the action buttons. But it also hides the summary, so the row loses its
count entirely at zero selection and leaves a visible void. "0 of 24 selected" is
the more useful resting state.

Worked around by keeping the DS component for the actions and rendering the summary
separately.

**Suggested:** a `showWhenEmpty` prop, or let `DataTableBulkActionsSummary` render
outside the hidden root.

Credit where due: `DataTableBulkActionsSummary` takes `children` as a **render
function** receiving `{ selectedCount, totalCount }`, which made rewording it to
"N of M review(s) selected" trivial. More components should do this.

## 10. `Tabs` ships exactly one look

`TabsList` is `inline-flex h-9 w-fit items-center justify-center bg-muted
rounded-lg`; `TabsTrigger` is `data-[state=active]:bg-background
data-[state=active]:shadow-sm`. A pill strip on a muted track, with **no `variant`
prop**.

An underlined strip — full width, flush on a border, active marked by
`border-primary` — is a common tab pattern and needs every one of those baked-in
classes neutralised.

**Suggested:** `variant: "pill" | "underlined"`.

## 11. No multi-select facet, though `Command` is already the substrate

`Combobox` is `value?: string` with `onValueChange?: (value: string) => void`.
`Select` is Radix single-select. Neither does multi-select.

The important part: **`Command` does not impose a selection model.** `CommandItem`
takes `selected` and `onSelect`, and `selected` renders a trailing checkmark. So a
multi-select facet is a *packaging* job over primitives that already work, not new
interaction design.

What a `FacetedFilter` should package, all of which this screen now does by hand
and repeats per facet: trigger with a dynamic label, popover, Command, search
input, a force-mounted "All" reset, grouped options, per-option counts, a disabled
"no data yet" group, and the label logic ("All sources" → "TripAdvisor" → "2
sources").

The part consumers will get wrong is counts: they want the **pre-facet** dataset,
or the numbers collapse to zero as you select.

## 13. `ChartContainer` forces `aspect-video`

```
flex aspect-video justify-center text-xs …
```

So `width` / `height` are misleading: `height="100%"` never applies and any
non-16:9 chart is silently distorted. A 190px square box measured **190 x 107**
(190 x 9/16 = 106.875) and the donut inside it read as cropped when it was
actually squashed.

`className` IS forwarded through `cn`, so `aspect-square` displaces it — but
nothing in the API suggests you need to. Note also that Recharts' default 5px
chart margin clips an `outerRadius` sized to fill the box.

The earlier failure log blamed a nested `ResponsiveContainer` for invisible
charts. This is the second, quieter half of the same problem.

**Suggested:** drop `aspect-video` when an explicit `height` is passed, or
document that the aspect ratio wins.

## 14. The registry's preview CSS is missing the `--brand-*` colour tokens

*(Our gap, not the DS's — recorded here because it presents as a DS bug.)*

`Progress`'s colour map:

```js
green:  { track: "bg-brand-primary-foreground/20", indicator: "bg-green-400" }
red:    { track: "bg-brand-red/20",                indicator: "bg-brand-red" }
orange: { track: "bg-brand-orange/20",             indicator: "bg-brand-orange" }
yellow: { track: "bg-brand-yellow/20",             indicator: "bg-brand-yellow" }
```

`preview-css.generated.ts` defines only `--brand-primary-foreground`, so
**three of the four documented colours render fully transparent** — the bar
disappears with no error. `green` works solely because its indicator is plain
Tailwind `bg-green-400`.

The same missing tokens made a hand-rolled `bg-[var(--brand-orange)]` bar
invisible, and `var(--brand-red)` paint a Recharts wedge black.

**Suggested:** extend the preview CSS extract to carry the full `--brand-*`
set. An unresolved CSS variable fails silently in both `fill` and `bg-*`,
which makes it an expensive class of bug to chase.

## 12. Missing brand marks

TripAdvisor and Bing Places have no icon in the 127-asset social-media set
(checked `src/assets/social-media/`, and `@brightlocal/icons@2.3.1` is the latest
published). Both are RM-monitored directories.

The screen carries a **redrawn TripAdvisor approximation** marked
`data-ds-standin="brand-mark"`. **It must not ship** — it is a trademark and it is
visibly not quite right. Bing Places falls back to a generic globe.

*(Trustpilot does exist — `trustpilot-neutral.svg` / `trustpilot-original.svg` —
but it is a different directory, not a substitute.)*

---

## What the screen uses now

DS throughout: `useDataTable` / `DataTable`, `DataTableSelectAllCheckbox`,
`DataTableSelectRowCheckbox`, `DataTableBulkActions` + `Actions`,
`DataTableSearch`, `DataTablePagination`, `Tabs` / `TabsList` / `TabsTrigger`,
`Popover` + `Command` for every facet menu, `Checkbox`, `Button`, `AlertInfo`,
`Sheet`, `Card`, `Badge`, `Rating`, `Separator`.

Removed: `Btn` (an `asChild` wrapper that existed only to smuggle `onClick` past
the old validator), `CheckboxStandIn`, `MenuRow`, `MenuLabel`, a hand-rolled search
input, hand-rolled pagination and its arithmetic, and all per-menu filter state.

Components under contract went from 28 to 77.

## Accessibility, resolved

The earlier report's headline was that the screen was mouse-only. Verified fixed:

- **Checkboxes**: 13 `<button role="checkbox">` with `tabIndex: 0` and correct
  `aria-checked`, including `"mixed"` on select-all. Previously `<span
  role="checkbox">` with no `tabIndex`.
- **Tabs**: `role="tablist"` / `role="tab"` / `aria-selected`, arrow-key
  navigation. Previously plain buttons.
- **Facet menus**: Command's listbox model, arrow keys and type-ahead. Previously
  a stack of buttons.

Rows are still not focusable, which is finding 8.

---

## Open, not yet decided

**Filters on mobile.** The DS has no guidance here, and neither do we. A row of
facet triggers plus a search field does not survive a 375px viewport, and the
usual answers (a bottom sheet of filters, a horizontally scrolling chip rail, a
single "Filters" button opening a full-screen panel) are all product decisions
rather than component ones. Worth settling before another screen invents its own.

**A packaged faceted filter.** See finding 11. Both RM screens now carry an
identical hand-built one, and between them they apply FIVE corrections to
`Command` just to sit it in a popover: `p-0` on the content, then
`rounded-[inherit] border-0 shadow-none`, `[&_group]:p-1`,
`[&_item]:py-1.5`, and `[&_input]:text-sm [&_input-wrapper]:h-10`. Every
consumer will rediscover those independently and land on slightly different
numbers. Proposal to be written up under proposed components.
