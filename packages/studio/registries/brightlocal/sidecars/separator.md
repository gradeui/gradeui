---
name: Separator
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/separator"
subcomponents: [SeparatorWithText]
props:
  - orientation? (horizontal | vertical) — Visual orientation of the separator. Horizontal renders a native `<hr>`, vertical renders a `<div>`. (default "horizontal")
  - spacing? (default | sm | md | lg) — Controls the spacing around the separator. (default "default")
  - decorative?: boolean — When true, the separator is purely decorative (role="none"). When false, it carries separator semantics for assistive technology. (default true)
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
  - trackingEl?: string — Tracking element identifier for analytics
  - trackingLabel?: string — Tracking label for analytics context
  - className?: string — SeparatorWithText: Additional CSS classes
  - children — SeparatorWithText: Text content to display between separators
---

```jsx
{/* Horizontal separator */}
<Separator dataHook="divider" />

{/* With spacing */}
<Separator spacing="md" dataHook="divider" />

{/* Vertical separator */}
<div className="flex h-10 items-center gap-4">
  <span>Left</span>
  <Separator orientation="vertical" dataHook="divider" />
  <span>Right</span>
</div>

{/* Separator with text */}
<SeparatorWithText dataHook="or-divider">OR</SeparatorWithText>
```
```jsx
<Separator orientation="horizontal" dataHook="separator" />
```
```jsx
<SeparatorWithText dataHook="or-divider">OR</SeparatorWithText>
```

<!-- Examples harvested from https://storybook.brightlocal.com (ui-components-separator--docs); re-run harvest-brightlocal-stories.mjs to refresh. -->
