---
name: Breadcrumb
import: "@gradeui/ui"
subcomponents: [BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbEllipsis]
props:
  - Breadcrumb: aria-label? (defaults to "breadcrumb") — passed to the underlying <nav>
  - Breadcrumb: separator? — **tree-wide default** for every <BreadcrumbSeparator/> inside. Pass a string ("/", "›", "•"), a lucide icon (`<Slash/>`, `<ChevronRight/>`), or any ReactNode. Default: `<ChevronRight/>`. Set once on the root; every separator below picks it up via context.
  - BreadcrumbList: className? — the <ol> wrapper; usually no overrides needed
  - BreadcrumbItem: className? — wraps a single crumb (link or page)
  - BreadcrumbLink: href? — renders as <a> when set, <button> when not; asChild? wraps a custom element
  - BreadcrumbPage: className? — the current page; rendered as a non-interactive <span> with aria-current="page"
  - BreadcrumbSeparator: children? — per-instance override of the separator glyph. When set, beats the root's `separator` prop for this one slot. When not set, falls back to the root's `separator`, then to `<ChevronRight/>`.
  - BreadcrumbEllipsis: className? — collapsed middle crumbs marker, use between BreadcrumbItems
when_to_use: Reach for Breadcrumb whenever a screen sits inside a hierarchy and you want the path back to the top to be visible. Common spots: above page titles in admin/CMS screens, top of Settings detail pages, after a router redirect when the URL implies depth. Use the current page as a <BreadcrumbPage> (non-clickable) and prior levels as <BreadcrumbLink>. For a horizontal "top nav" of peer destinations use Side Menu or Tabs instead — Breadcrumb is strictly for hierarchical path.
composes_with: [AppShellMain, Card (in CardHeader), Dialog]
aliases: [breadcrumb, breadcrumbs, crumbs, path, page hierarchy, path bar, navigation trail, finder path]
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
// Slash-separated, finder / URL-style. Set once on the root and every
// <BreadcrumbSeparator/> below picks it up via context.
import { Slash } from "lucide-react";

<Breadcrumb separator={<Slash />}>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Home</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbLink href="/blog">Blog</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>Article</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
```

```jsx
// Plain glyph — string children also work.
<Breadcrumb separator="›">…</Breadcrumb>
<Breadcrumb separator="/">…</Breadcrumb>
<Breadcrumb separator="•">…</Breadcrumb>
```

```jsx
// Per-instance override beats the root default. Useful for "different
// separator just before the current page" designs (e.g. an arrow that
// points at the leaf).
import { ArrowRight, ChevronRight } from "lucide-react";

<Breadcrumb separator={<ChevronRight />}>
  <BreadcrumbList>
    <BreadcrumbItem><BreadcrumbLink href="/">Home</BreadcrumbLink></BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem><BreadcrumbLink href="/team">Team</BreadcrumbLink></BreadcrumbItem>
    <BreadcrumbSeparator><ArrowRight /></BreadcrumbSeparator>
    <BreadcrumbItem><BreadcrumbPage>Settings</BreadcrumbPage></BreadcrumbItem>
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
