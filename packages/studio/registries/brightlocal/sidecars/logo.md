---
name: Logo
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/logo"
variants: [logotype, mark]
props:
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
  - ariaLabel?: string — Accessible label for the logo image. (default "BrightLocal) Logo"
  - trackingEl?: string — Optional tracking element identifier for analytics
  - trackingLabel?: string — Optional tracking label for analytics
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
