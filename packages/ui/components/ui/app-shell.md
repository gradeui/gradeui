---
name: AppShell
import: "@gradeui/ui"
role: layout
subcomponents: [AppShellNav, AppShellMain]
props:
  - nav?: "none" | "top" | "side" (default "none") — layout structure. "top" puts the nav above main, "side" to the left, "none" hides it
  - asChild?: boolean (default false) — render as the child element via Slot
  - className?: string
  - children: React.ReactNode
when_to_use: The top-level page scaffold for app-like layouts — any screen that needs a nav region plus a content region. Reach for AppShell instead of hand-rolled `grid grid-cols-[auto_1fr]` so the layout shape (top vs side nav, constrained vs full-width main) is a prop the settings panel can mutate. Drop a Stack of nav items into AppShellNav for the nav region; drop a Stack into AppShellMain for the page's vertical rhythm.
composes_with: [Stack, Row, Card, Button, Separator, any page content]
aliases: [app shell, page shell, layout, app layout, dashboard shell, scaffold, navigation split view, navigationsplitview, split view layout, safe area view, safeareaview]
notes: |
  Three parts:
    AppShell        — <div> by default; sets the grid (nav=none|top|side)
    AppShellNav     — <nav> by default; props: placement ("top"|"side"|"none", match AppShell.nav), sticky (boolean, default true)
    AppShellMain    — <main> by default; props: maxWidth ("full"|"container", default "full")
  All three support asChild and emit data-gds-part ("app-shell", "app-shell-nav", "app-shell-main").
  Pure structure — no collapse state, no context. Server-renders cleanly.
  For nav placement="side" + sticky=true the nav gets h-screen + self-scroll, so long nav lists don't push main down.
---

```jsx
// Side nav + full-width main — the classic dashboard shape.
<AppShell nav="side">
  <AppShellNav placement="side">
    {/* nav items — Stack of Buttons, a Sidebar, etc. */}
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
    <Row justify="between" align="center" className="px-6 py-3">
      {/* logo + nav buttons */}
    </Row>
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
