---
name: AppShell
import: "@gradeui/ui"
role: layout
parts: [AppShell, AppShellNav, AppShellMain]
props:
  - nav?: "none" | "top" | "side" (default "none") — layout structure. "top" puts the nav above main, "side" to the left, "none" hides it
  - asChild?: boolean (default false) — render as the child element via Slot
  - className?: string
  - children: React.ReactNode
subparts:
  AppShellNav:
    - placement?: "none" | "top" | "side" (default "top") — must match the parent AppShell's nav direction
    - sticky?: boolean (default true) — stick the nav as the page scrolls
    - asChild?: boolean (default false)
    - className?: string
  AppShellMain:
    - maxWidth?: "full" | "container" (default "full") — "container" caps main at max-w-7xl with responsive padding
    - asChild?: boolean (default false)
    - className?: string
when_to_use: The top-level page scaffold for app-like layouts — any screen that needs a nav region plus a content region. Reach for AppShell instead of hand-rolled `grid grid-cols-[auto_1fr]` so the layout shape (top vs side nav, constrained vs full-width main) is a prop the settings panel can mutate. Drop a SideMenu or TopMenu into AppShellNav for ready-made nav content; drop a Stack into AppShellMain for the page's vertical rhythm.
composes_with: [SideMenu, TopMenu, Stack, Row, Card, any page content]
aliases: [app shell, page shell, layout, app layout, dashboard shell]
---

```jsx
// Side nav + full-width main — the classic dashboard shape.
<AppShell nav="side">
  <AppShellNav placement="side">
    <SideMenu items={navItems} />
  </AppShellNav>
  <AppShellMain>
    <Stack gap="lg" className="p-6">
      {/* page content */}
    </Stack>
  </AppShellMain>
</AppShell>
```

```jsx
// Top nav + constrained content — marketing / docs / settings pages.
<AppShell nav="top">
  <AppShellNav placement="top">
    <TopMenu title="My App" />
  </AppShellNav>
  <AppShellMain maxWidth="container">
    <Stack gap="lg" className="py-8">
      {/* page content */}
    </Stack>
  </AppShellMain>
</AppShell>
```

```jsx
// No nav — just a shell for a single-screen prototype.
<AppShell nav="none">
  <AppShellMain maxWidth="container">
    {/* page content */}
  </AppShellMain>
</AppShell>
```
