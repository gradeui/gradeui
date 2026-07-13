---
name: Badge
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/badge"
variants: [primary, secondary, destructive, outline]
props:
  - asChild?: boolean — Render as a different element (Radix Slot pattern)
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
  - trackingEl?: string — Tracking element identifier for analytics
  - trackingLabel?: string — Tracking label for analytics context
when_to_use: Displaying a status label (active/inactive, new, draft) Showing a count or numeric indicator Non-interactive categorical labels Do NOT use for: removable tags (use Chip); interactive elements (use Button). Use Chip when the user can remove/dismiss the tag — Badge is non-interactive. Use Button for interactive status toggles.
composes_with: [Chip, Button]
aliases: [tag, chip, pill, label, status indicator]
---

```jsx
<Badge variant="primary" dataHook="status-badge">New</Badge>
<Badge variant="secondary">Draft</Badge>
<Badge variant="outline">Published</Badge>
<Badge variant="destructive">Error</Badge>
```
```jsx
<Badge
  asChild
  dataHook="badge"
  storyDescription="Focus (asChild button)"
  trackingEl="badge-element"
  trackingLabel="Badge Component"
  variant="destructive"
>
  <button>
    Destructive
  </button>
</Badge>
```
```jsx
<Badge
  asChild
  dataHook="badge"
  storyDescription="Focus (asChild button)"
  trackingEl="badge-element"
  trackingLabel="Badge Component"
  variant="primary"
>
  <button>
    Badge
  </button>
</Badge>
```

<!-- Examples harvested from https://storybook.brightlocal.com (ui-components-badge--docs); re-run harvest-brightlocal-stories.mjs to refresh. -->
