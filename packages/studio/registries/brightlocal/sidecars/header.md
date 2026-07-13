---
name: Header
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/header"
props:
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
  - align? (left | center | right) — Content alignment: "left" (default), "center", or "right"
  - trackingEl?: string — Tracking element identifier for analytics
  - trackingLabel?: string — Tracking label for analytics context
---

```jsx
// Basic usage with Logo
<Header dataHook="main-header">
  <Logo dataHook="header-logo" />
</Header>

// With navigation (future use)
<Header dataHook="main-header" className="justify-between w-full">
  <Logo dataHook="header-logo" />
  <nav>Navigation items</nav>
</Header>
```
```jsx
<Header
  aria-label="Header with navigation example"
  className="justify-between gap-4"
  dataHook="header-with-nav"
  storyDescription="Header with Logo and Navigation"
  trackingEl="header-element"
  trackingLabel="Main Header"
>
  <React.Fragment key=".0">
    <Logo dataHook="header-logo-nav" />
    <nav className="text-muted-foreground flex items-center gap-4 text-sm">
      <span>
        Home
      </span>
      <span>
        Products
      </span>
      <span>
        About
      </span>
    </nav>
  </React.Fragment>
</Header>
```

<!-- Examples harvested from https://storybook.brightlocal.com (ui-components-header--docs); re-run harvest-brightlocal-stories.mjs to refresh. -->
