---
name: SideMenu
import: "@gradeui/ui"
props:
  - sections: SideMenuSection[] — top-level groups; each section has `{ title?, items }`
  - sections[].title?: string — optional group heading
  - sections[].items: SideMenuItem[] — `{ label, href?, icon?, active?, badge?, onClick? }`
  - activeHref?: string — auto-derives `active` on matching items; falls back to per-item `active`
  - onItemClick?: (item) => void — fires for client-side routing; complements per-item onClick
  - className?: string
when_to_use: The primary navigation rail inside an AppShell — Admin/Settings/Billing, Inbox/Sent/Archive, file-tree-ish sidebars. Always sits inside <AppShellNav placement="side">. For top horizontal nav, compose Row + Button/Link directly — Side Menu is vertical-stack-of-items by design. For palette-style jump-to, use Command.
composes_with: [AppShellNav, AppShell, Avatar (header above the menu), Badge (item counts)]
aliases: [side menu, sidebar nav, side nav, vertical nav, sidebar items, rail, side bar]
---

```jsx
// Inbox/Sent/Archive rail inside AppShellNav.
<AppShellNav placement="side">
  <SideMenu
    activeHref="/inbox"
    sections={[
      {
        title: "Mail",
        items: [
          { label: "Inbox", href: "/inbox", icon: <Inbox />, badge: "12" },
          { label: "Sent", href: "/sent", icon: <Send /> },
          { label: "Archive", href: "/archive", icon: <Archive /> },
        ],
      },
      {
        title: "Labels",
        items: [
          { label: "Work", href: "/label/work", icon: <Tag /> },
          { label: "Personal", href: "/label/personal", icon: <Tag /> },
        ],
      },
    ]}
  />
</AppShellNav>
```
