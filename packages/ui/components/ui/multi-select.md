---
name: MultiSelect
import: "@gradeui/ui"
props:
  - options: { value: string; label: string; icon?: ComponentType; disabled?: boolean }[]
  - value?: string[] — controlled selection
  - defaultValue?: string[] — uncontrolled initial selection
  - onValueChange?: (next: string[]) => void
  - placeholder?: string (default "Select…")
  - searchPlaceholder?: string (default "Search…")
  - emptyMessage?: string (default "Nothing matches.")
  - maxCount?: number (default 3) — badges shown on the trigger before collapsing to "+N more"
  - searchable?: boolean (default true) — hide for short option lists
  - badgeDismissible?: boolean (default true) — show × on each selected badge
  - disabled?: boolean
  - modalPopover?: boolean (default false) — Popover modal mode
  - className?: string
when_to_use: |
  Picking multiple items from a finite list — tag selectors, filter chips,
  "share with N people", multi-region settings.

  **This is the answer for ANY "removable-chips-inside-an-input" pattern.**
  MultiSelect's trigger renders the current selection as Badges with X
  icons (the "chip-in-trigger" / "chip-in-input" shape), opens a Popover
  with a searchable Command list, and supports "+N more" collapse past
  `maxCount`. Reach for it for:
    - Linear-style filter bars (assignee, label, project chips inside one trigger)
    - Slack channel pickers (selected channels as removable chips)
    - Notion relation properties (related-page chips)
    - GitHub label / assignee pickers
    - tag / category / mention pickers anywhere
  Don't invent a `<ChipInput>` or `<TagInput>` for these — MultiSelect
  already covers the trigger-with-badges shape.

  Use `<Select>` instead for SINGLE selection. Use `<Command>` directly
  (no MultiSelect wrapper) when the option set is unbounded or async
  (users to @-mention, email recipients, search-as-you-type API results).
composes_with: [Popover, Command, Badge, Checkbox-style row indicator, Separator]
aliases: [
  multi select, multiselect, multi-select, tag picker, chips input,
  chip input, chipinput, tag input, taginput, chip picker, badge picker,
  multi picker, multi-pick combobox, multipicker, tag select,
  react native multi select, multi-select combobox,
  filter chips, filter bar chips, removable chips, removable pills,
  channel picker, label picker, recipient picker, relation picker,
  picker with chips, selected items as chips, badges in input,
  badges in trigger, pills in input, multi-select with badges
]
---

```jsx
const frameworks = [
  { value: "next", label: "Next.js" },
  { value: "remix", label: "Remix" },
  { value: "astro", label: "Astro" },
  { value: "nuxt", label: "Nuxt" },
];

<MultiSelect
  options={frameworks}
  defaultValue={["next", "remix"]}
  onValueChange={setSelected}
  placeholder="Pick frameworks"
  maxCount={2}
/>
```

```jsx
// With per-option icons — the icon renders both in the dropdown row
// and on the selected badge.
import { Code2, Server, Cloud } from "lucide-react";
const services = [
  { value: "edge", label: "Edge runtime", icon: Cloud },
  { value: "node", label: "Node runtime", icon: Server },
  { value: "browser", label: "Browser only", icon: Code2 },
];

<MultiSelect options={services} placeholder="Select runtimes" />
```

```jsx
// Filter-bar chip picker (Linear / Jira style). Selected status chips
// render INSIDE the trigger with X icons; click the trigger to open the
// Popover and toggle more. Pair with a search Input to the left for the
// "search + scoped filters" composition (e.g. Reddit / Linear / GitHub
// header search). Don't reach for a custom ChipInput — this IS it.
const statuses = [
  { value: "todo", label: "Todo" },
  { value: "doing", label: "In Progress" },
  { value: "done", label: "Done" },
];

<Row gap="sm" align="center">
  <Input placeholder="Search issues…" className="flex-1" />
  <MultiSelect
    options={statuses}
    placeholder="Status"
    maxCount={2}
    badgeDismissible
  />
</Row>
```

### Anti-patterns

DO NOT use MultiSelect for single-pick — that's `<Select>`. The visual semantics differ (badges vs single value) and screen-reader announcements differ ("combobox, 2 selected" vs "combobox, Apple").

DO NOT pass `value` without `onValueChange` — the component becomes a read-only display of the controlled state and selections inside the popover silently no-op. Either go fully uncontrolled (`defaultValue`) or wire both.

DO NOT inline `options` as `[{value, label}, ...]` from scratch on every render — memoise it. The component memoises its internal lookup, but a fresh array reference on every parent render still forces React to reconcile every row.

DO NOT reach for MultiSelect when the list is unbounded or async (users to mention, email recipients, search-as-you-type API results). Use `<Command>` directly with custom rendering — MultiSelect's `options` model expects the full set up front.

DO NOT hand-roll a "chip input" / "tag input" / "search with removable filter chips" composition with raw Badge + Input + state. MultiSelect already covers the trigger-with-removable-Badges pattern (the chip-in-trigger shape). If your screenshot has selected items rendered as removable pills, MultiSelect is the answer — even if the source visual integrates the chips with a search field. (Genuine gap: the *typed-text-immediately-next-to-chips* search composition where the input is freeform and the chips are scopes — that's a Row of `<Input>` + `<MultiSelect>`, not a new primitive.)
