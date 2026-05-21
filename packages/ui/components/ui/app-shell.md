---
name: AppShell
import: "@gradeui/ui"
role: layout
subcomponents: [AppShellHeader, AppShellNav, AppShellAside, AppShellMain, AppShellFooter]
props:
  - nav?: "none" | "top" | "side" | "three-pane" (default "none") — layout structure
  - asChild?: boolean (default false) — render as the child element via Slot
  - className?: string
  - children: React.ReactNode
when_to_use: |
  The top-level page scaffold for any app-like or marketing layout. Reach for AppShell
  instead of hand-rolling `grid grid-cols-[auto_1fr]` so the layout shape (top nav,
  side nav, three-pane Slack/Mail/Notion shape, constrained vs full-width main) is a
  prop the settings panel can mutate. Don't compose top-level layouts from raw grid
  templates — the four variants below cover most app shapes.

  Pick the `nav` variant from the source:
    nav="none"        — Single column. Marketing landing, login, splash.
    nav="top"         — Top bar + content. Reddit, Twitter chrome.
    nav="side"        — Left nav + content. Linear, Notion sidebar shape.
    nav="three-pane"  — **Narrow icon rail + Aside + Main.** The Slack /
                        WhatsApp / Mail / Plane / Discord / Notion-with-pages
                        shape. ANY time you see a vertical icon rail next to
                        a separate list/sidebar, this is the answer — don't
                        reach for raw `<div className="grid">` with three
                        column tracks.
composes_with: [Stack, Row, Card, Button, Separator, Sidebar, Toolbar, any page content]
aliases: [
  app shell, page shell, layout, app layout, dashboard shell, scaffold,
  navigation split view, navigationsplitview, split view layout,
  safe area view, safeareaview,
  three pane, three-pane, three column, three-column, master-detail-detail,
  rail and sidebar, icon rail, sidebar layout, mail shape, slack shape,
  notion shape, discord shape, whatsapp shape, plane shape
]
notes: |
  Five slots, all CSS-grid placed by `grid-area` so child order doesn't matter:

    AppShellHeader  — <header>; full-bleed across the top
    AppShellNav     — <nav>;    placement="top"|"side"|"none"
    AppShellAside   — <aside>;  middle column in three-pane
    AppShellMain    — <main>;   props: maxWidth ("full"|"container", default "full")
    AppShellFooter  — <footer>; full-bleed across the bottom

  Three-pane sizing: the Aside column reads `--rds-app-shell-aside` (default 320px).
  Override on the AppShell root to tighten or widen:
    style={{ "--rds-app-shell-aside": "245px" }}    // Plane-style
    style={{ "--rds-app-shell-aside": "380px" }}    // WhatsApp-style

  Nav rail in three-pane sizes to its content's intrinsic width (column track is
  `auto`). Add `w-[60px]` etc. to the AppShellNav child so the rail has a stable width.

  All slots support asChild and emit data-gds-part ("app-shell", "app-shell-nav",
  "app-shell-aside", "app-shell-main", "app-shell-header", "app-shell-footer").
  Pure structure — no collapse state, no context. Server-renders cleanly.
  For nav placement="side" + sticky=true (default) the nav gets h-screen + self-scroll,
  so long nav lists don't push main down.
---

```jsx
// nav="side" — classic dashboard: left nav + main.
<AppShell nav="side">
  <AppShellNav placement="side">
    <Sidebar>{/* sidebar items */}</Sidebar>
  </AppShellNav>
  <AppShellMain>
    <Stack gap="lg" className="p-6">
      {/* page content */}
    </Stack>
  </AppShellMain>
</AppShell>
```

```jsx
// nav="three-pane" — Slack / WhatsApp / Mail / Plane shape.
// Narrow icon rail + middle Aside + main content area. Override
// the Aside width via the CSS var on the root.
<AppShell nav="three-pane" style={{ "--rds-app-shell-aside": "260px" }}>
  <AppShellNav placement="side">
    {/* icon rail — stack of icon buttons, ~60px wide */}
    <Stack gap="sm" align="center" className="w-[60px] py-3">
      <RailButton icon={<Home/>} />
      <RailButton icon={<Inbox/>} />
      <RailButton icon={<Settings/>} />
    </Stack>
  </AppShellNav>
  <AppShellAside>
    {/* middle column — chat list, project list, mailbox list */}
    <Sidebar collapsible={false}>
      <SidebarHeader>…</SidebarHeader>
      <SidebarContent>…</SidebarContent>
    </Sidebar>
  </AppShellAside>
  <AppShellMain>
    {/* main content — active chat, active project page, etc. */}
  </AppShellMain>
</AppShell>
```

```jsx
// nav="top" — marketing / docs / settings layout.
<AppShell nav="top">
  <AppShellNav placement="top">
    <Toolbar leading={<Logo/>} trailing={<Avatar/>} />
  </AppShellNav>
  <AppShellMain maxWidth="container">
    <Stack gap="lg" className="py-8">
      {/* page content */}
    </Stack>
  </AppShellMain>
</AppShell>
```

```jsx
// nav="none" — single screen prototype, login, splash.
<AppShell nav="none">
  <AppShellMain maxWidth="container">
    {/* page content */}
  </AppShellMain>
</AppShell>
```

```jsx
// Full chrome — header + three-pane body + footer.
<AppShell nav="three-pane">
  <AppShellHeader>
    <Toolbar leading={<Logo/>} center={<Search/>} trailing={<Avatar/>} />
  </AppShellHeader>
  <AppShellNav placement="side">{/* icon rail */}</AppShellNav>
  <AppShellAside>{/* list pane */}</AppShellAside>
  <AppShellMain>{/* content */}</AppShellMain>
  <AppShellFooter>
    <Row justify="between" className="px-4 py-2 text-xs">© Brand · v1.0</Row>
  </AppShellFooter>
</AppShell>
```

## Anti-patterns

```jsx
// ❌ Hand-rolling a three-pane grid when AppShell nav="three-pane" exists.
//    You lose: the CSS-var Aside sizing knob, the rail's auto-width
//    column track, the grid-area routing that lets you add a Header
//    later without re-doing the grid.
<div className="grid h-screen" style={{ gridTemplateColumns: "60px 280px 1fr" }}>
  <Rail />
  <Sidebar />
  <Main />
</div>

// ✅ The Grade way.
<AppShell nav="three-pane" style={{ "--rds-app-shell-aside": "280px" }}>
  <AppShellNav placement="side"><Rail /></AppShellNav>
  <AppShellAside><Sidebar /></AppShellAside>
  <AppShellMain><Main /></AppShellMain>
</AppShell>
```

```jsx
// ❌ Stacking nav at the top + another nav on the side via raw grid.
//    Use AppShellHeader + nav="side" instead.
<div className="min-h-screen grid" style={{ gridTemplateRows: "auto 1fr" }}>
  <TopBar />
  <div className="grid" style={{ gridTemplateColumns: "260px 1fr" }}>
    <Sidebar />
    <Main />
  </div>
</div>

// ✅ Use AppShellHeader for the full-bleed top bar; pick nav based on
//    what's below it.
<AppShell nav="side">
  <AppShellHeader><Toolbar leading={<Logo/>} trailing={<Avatar/>} /></AppShellHeader>
  <AppShellNav placement="side"><Sidebar /></AppShellNav>
  <AppShellMain><Main /></AppShellMain>
</AppShell>
```
