---
name: Alert
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/alert"
subcomponents: [AlertTitle, AlertDescription, AlertSuccess, AlertInfo, AlertDestructive, AlertWarning]
variants: [default, success, info, destructive, warning]
props:
  - variant? (default | success | info | destructive | warning)
  - ref? — Allows getting a ref to the component instance. Once the component unmounts, React will set `ref.current` to `null` (or call the ref with `null` if you passed a callback ref). @see {@link https://react.dev/learn/referencing-values-with-refs#refs-and-the-dom React Docs}
  - key?
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
when_to_use: Do NOT use for: toast notifications (use Sonner); inline validation (use FieldError).
aliases: [notification, banner, message, status message]
---

```jsx
<AlertSuccess
  title="Success"
  description="Your changes have been saved successfully."
  dataHook="save-success"
/>
```
```jsx
<AlertDestructive
  dataHook="alert-destructive"
  description="Your session has expired. Please log in again."
  storyDescription="Without title"
  trackingEl="alert-destructive-element"
  trackingLabel="Destructive Alert"
/>
```
```jsx
<AlertSuccess
  dataHook="alert-success"
  description="Your changes have been saved successfully."
  storyDescription="Without title"
  trackingEl="alert-success-element"
  trackingLabel="Success Alert"
/>
```

<!-- Examples harvested from https://storybook.brightlocal.com (ui-components-alert--docs); re-run harvest-brightlocal-stories.mjs to refresh. -->
