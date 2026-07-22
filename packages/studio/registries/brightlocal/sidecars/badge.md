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
when_to_use: Displaying a status label (active/inactive, new, draft) Showing a count or numeric indicator Non-interactive categorical labels Do NOT use for: removable tags (use Chip); interactive elements (use Button). Use Chip when the user can remove/dismiss the tag — Badge is non-interactive. Use Button for interactive status toggles. VARIANT SEMANTICS — "primary" IS the green SUCCESS badge (bg-success-background); there is no variant named success/warning. Status mapping across the proposal: Active → primary, any other status → outline. "Active" is the ONLY location status VERIFIED on the live product — never invent status strings (no "Needs attention", "Paused", …) in datasets or screens until Ali verifies them on live. "outline" carries its own bg-background fill (not transparent), so it stays legible over photos — LocationCard overlays the status pill on the location photo this way. Never hand-roll badge colours with utility classes; pick a variant. ONE sanctioned exception: the SOFT score-band tints (red-100/amber-100/green-100 pills in Ali's v2 mock) have no upstream variant yet — use ScoreStatusPill from "@brightlocal/proposal" (a Badge with the band tint over it, the upstream-ask noted there) rather than tinting Badges ad hoc.
composes_with: [Chip, Button]
aliases: [tag, chip, pill, label, status indicator]
---

```jsx
<Badge variant="primary" dataHook="status-badge">Active</Badge>   {/* green success — the only verified location status */}
<Badge variant="secondary">Draft</Badge>
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
