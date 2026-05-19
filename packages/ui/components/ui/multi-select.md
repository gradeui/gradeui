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
when_to_use: Picking multiple items from a finite list — tag selectors, filter chips, "share with N people", multi-region settings. The trigger renders the current selection as removable Badges so the choice is always visible. For SINGLE selection use Select. For huge unbounded sets (users, autocompleted email addresses) reach for Command directly with custom rendering.
composes_with: [Popover, Command, Badge, Checkbox-style row indicator, Separator]
aliases: [multi select, multiselect, multi-select, tag picker, chips input, multi picker, multi-pick combobox, multipicker, tag select, react native multi select, multi-select combobox]
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

### Anti-patterns

DO NOT use MultiSelect for single-pick — that's `<Select>`. The visual semantics differ (badges vs single value) and screen-reader announcements differ ("combobox, 2 selected" vs "combobox, Apple").

DO NOT pass `value` without `onValueChange` — the component becomes a read-only display of the controlled state and selections inside the popover silently no-op. Either go fully uncontrolled (`defaultValue`) or wire both.

DO NOT inline `options` as `[{value, label}, ...]` from scratch on every render — memoise it. The component memoises its internal lookup, but a fresh array reference on every parent render still forces React to reconcile every row.

DO NOT reach for MultiSelect when the list is unbounded or async (users to mention, email recipients, search-as-you-type API results). Use `<Command>` directly with custom rendering — MultiSelect's `options` model expects the full set up front.
