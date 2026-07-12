---
name: Button
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/button"
variants: [default, destructive, outline, secondary, ghost, warning]
sizes: [default, sm, lg]
props:
  - loading? — TODO(review): type + one-line description from src
  - fullWidth? — TODO(review): type + one-line description from src
  - iconOnly? — TODO(review): type + one-line description from src
  - asChild? — TODO(review): type + one-line description from src
  - type? — TODO(review): type + one-line description from src
  - ariaLabel? — TODO(review): type + one-line description from src
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
when_to_use: Triggering an action (submit, save, delete, open) Primary and secondary CTAs in forms, dialogs, and cards Icon-only actions using the iconOnly prop Do NOT use for: navigation links (use Link); toggle state (use Toggle or Switch). Use Link for navigation to a URL — even if it looks like a button, use Button with asChild wrapping a router Link for button-styled navigation. Use Toggle for on/off state that persists (e.g., bold, italic). Use Button + DropdownMenu for a button with secondary actions (SplitButton recipe).
composes_with: [Link, Toggle, DropdownMenu]
aliases: [btn, cta, action button, submit button, confirm button]
---

```jsx
<Button
  variant="primary"
  size="default"
  dataHook="submit-button"
>
  Submit
</Button>
```
```jsx
<Button
  dataHook="destructive-button"
  size="default"
  storyDescription="With left icon"
  variant="destructive"
>
  <React.Fragment key=".0">
    <Trash2 />
    {' '}Delete Item
  </React.Fragment>
</Button>
```
```jsx
<Button
  dataHook="outline-button"
  size="default"
  storyDescription="With left icon"
  variant="outline"
>
  <React.Fragment key=".0">
    <Download />
    {' '}Download
  </React.Fragment>
</Button>
```

<!-- Examples harvested from https://storybook.brightlocal.com (ui-components-button--docs); re-run harvest-brightlocal-stories.mjs to refresh. -->
