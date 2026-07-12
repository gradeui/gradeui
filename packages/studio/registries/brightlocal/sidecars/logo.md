---
name: Logo
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/logo"
variants: [logotype, mark]
props:
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
---

```jsx
<Logo
  variant="logotype"
  dataHook="header-logo"
/>
```
```jsx
<Logo dataHook="header-logo" ariaLabel={t("logo.label")} />
```
```jsx
<Logo
  ariaLabel="Logo de BrightLocal"
  dataHook="logo-logotype-i18n"
  storyDescription="Custom label (i18n)"
  trackingEl="logo-element"
  trackingLabel="BrightLocal Logo"
  variant="logotype"
/>
```

<!-- Examples harvested from https://storybook.brightlocal.com (ui-components-logo--docs); re-run harvest-brightlocal-stories.mjs to refresh. -->
