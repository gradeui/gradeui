---
name: Description
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/description"
props:
  - dataHook?: string — optional on structural components (renders data-hook)
---

```jsx
<Description dataHook="help-text">
  This is a helpful description that provides additional context.
</Description>
```
```jsx
<Description dataHook="terms-info">
  By signing up, you agree to our <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>.
</Description>
```
```jsx
<Description
  dataHook="description-with-links"
  storyDescription="With links"
>
  By signing up, you agree to our{' '}
  <a href="#terms">
    Terms of Service
  </a>
  {' '}and{' '}
  <a href="#privacy">
    Privacy Policy
  </a>
  .
</Description>
```

<!-- Examples harvested from https://storybook.brightlocal.com (ui-components-description--docs); re-run harvest-brightlocal-stories.mjs to refresh. -->
