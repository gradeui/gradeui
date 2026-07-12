---
name: Breadcrumb
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/breadcrumb"
subcomponents: [BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbEllipsis]
props:
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
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
