---
name: Breadcrumb
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/breadcrumb"
subcomponents: [BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbEllipsis]
props:
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
  - trackingEl?: string — Tracking element identifier for analytics
  - trackingLabel?: string — Tracking label for analytics context
  - ariaLabel?: string — Accessible label for the breadcrumb navigation. (default "breadcrumb")
  - asChild?: boolean — BreadcrumbLink: Render as a different element (Radix Slot pattern)
  - href?: string — BreadcrumbLink: URL the breadcrumb link navigates to
  - srLabel?: string — BreadcrumbEllipsis: Screen-reader-only label for the ellipsis. (default "More")
---

```jsx
<Breadcrumb dataHook="navigation-breadcrumb">
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Home</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbLink href="/components">Components</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
```
```jsx
<Breadcrumb dataHook="nav" ariaLabel={t("breadcrumb.nav")}>
  <BreadcrumbList>
    ...
    <BreadcrumbEllipsis srLabel={t("breadcrumb.more")} />
  </BreadcrumbList>
</Breadcrumb>
```
```jsx
<Breadcrumb dataHook="breadcrumb-current">
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Home</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbLink href="/components">Components</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
```

<!-- Examples harvested from https://storybook.brightlocal.com (ui-components-breadcrumb--docs); re-run harvest-brightlocal-stories.mjs to refresh. -->
