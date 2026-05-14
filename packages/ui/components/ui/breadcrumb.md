---
name: Breadcrumb
import: "@gradeui/ui"
subcomponents: [BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbEllipsis]
props:
  - Breadcrumb: aria-label? (defaults to "breadcrumb") — passed to the underlying <nav>
  - BreadcrumbList: className? — the <ol> wrapper; usually no overrides needed
  - BreadcrumbItem: className? — wraps a single crumb (link or page)
  - BreadcrumbLink: href? — renders as <a> when set, <button> when not; asChild? wraps a custom element
  - BreadcrumbPage: className? — the current page; rendered as a non-interactive <span> with aria-current="page"
  - BreadcrumbSeparator: children? (defaults to a chevron) — the visual separator between crumbs
  - BreadcrumbEllipsis: className? — collapsed middle crumbs marker, use between BreadcrumbItems
when_to_use: Reach for Breadcrumb whenever a screen sits inside a hierarchy and you want the path back to the top to be visible. Common spots: above page titles in admin/CMS screens, top of Settings detail pages, after a router redirect when the URL implies depth. Use the current page as a <BreadcrumbPage> (non-clickable) and prior levels as <BreadcrumbLink>. For a horizontal "top nav" of peer destinations use Side Menu or Tabs instead — Breadcrumb is strictly for hierarchical path.
composes_with: [AppShellMain, Card (in CardHeader), Dialog]
aliases: [breadcrumb, breadcrumbs, crumbs, path, page hierarchy]
---

```jsx
// Two-level path — Dashboard → current page.
<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>Settings</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
```

```jsx
// Deep path with collapsed middle — useful when the path is long.
<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Home</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbEllipsis />
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbLink href="/projects/acme">Acme</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>Billing</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
```
