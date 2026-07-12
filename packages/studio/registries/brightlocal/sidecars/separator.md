---
name: Separator
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/separator"
subcomponents: [SeparatorWithText]
props:
  - orientation? (horizontal | vertical)
  - spacing? (default | sm | md | lg)
  - decorative? — TODO(review): type + one-line description from src
  - dataHook?: string — optional on structural components (renders data-hook)
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
