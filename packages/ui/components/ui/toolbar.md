---
name: Toolbar
import: "@gradeui/ui"
role: layout
subcomponents: [ToolbarSlot]
props:
  - leading?: React.ReactNode — left-aligned region (logo + primary nav)
  - center?: React.ReactNode — center region (search, page title, segmented control)
  - trailing?: React.ReactNode — right-aligned region (action icons, avatar, primary CTA)
  - children?: React.ReactNode — escape hatch; bypasses slot layout
  - position?: "top" | "bottom" | "inline" (default "top") — border placement
  - variant?: "default" | "subtle" | "transparent" (default "default")
  - size?: "sm" | "md" | "lg" (default "md") — height + padding
  - sticky?: boolean (default false) — pin to top/bottom of scroll container
  - aria-label?: string (default "Toolbar") — required by WAI-ARIA toolbar pattern
  - className?: string
when_to_use: |
  ANY three-region chrome bar — the leading/center/trailing pattern Apple HIG
  describes as a "Toolbar." App window chrome (Reddit, Twitter, GitHub, Linear,
  most desktop apps), section toolbars inside Cards or panels, bottom action
  bars on mobile layouts, persistent footer toolbars.

  Don't hand-roll `<Row justify="between">` with a flex-1 on a middle child and
  manual min-width juggling — Toolbar gives you the canonical `auto 1fr auto`
  grid for free, with `role="toolbar"`, `data-gds-part` markers, position
  variants for top/bottom borders, and sticky sizing.

  Slot semantics:
    leading   — Logo + nav rail (e.g. a `<Row>` of Buttons or Link components)
    center    — Search input, page title chip, segmented Tab strip
    trailing  — Icon buttons, notification bell, avatar, primary CTA

  When a slot is omitted, its column collapses cleanly. Center stays visually
  centered in the bar regardless of leading/trailing widths because the grid
  template is `auto 1fr auto` (the center column absorbs available width).

  Use as the top child of `<AppShellHeader>` for window-level chrome:
    <AppShellHeader>
      <Toolbar leading={<Logo/>} center={<Search/>} trailing={<Avatar/>} />
    </AppShellHeader>

  Use directly inside a Card or page section for section-scoped toolbars:
    <Card>
      <Toolbar size="sm" variant="subtle" leading={...} trailing={...} />
      {content}
    </Card>
composes_with: [Button, Avatar, Input, Logo, Badge, AppShellHeader, Card, Row, Stack]
aliases: [
  toolbar, tool bar, top bar, topbar, app bar, appbar, header bar, header,
  navigation bar, nav bar, navbar, window chrome, window toolbar, title bar,
  titlebar, action bar, actionbar, command bar, ribbon,
  three-region nav, leading center trailing, leading-center-trailing,
  apple hig toolbar, hig toolbar, native toolbar, segmented toolbar,
  bottom toolbar, footer toolbar, fixed toolbar, sticky header
]
notes: |
  Apple HIG reference: https://developer.apple.com/design/human-interface-guidelines/toolbars
  WAI-ARIA toolbar pattern: https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/

  Roving tabindex for arrow-key navigation between toolbar items is NOT
  implemented in v1. For a tight cluster of related controls (an editor
  toolbar — B / I / S / link), compose with @radix-ui/react-toolbar inside
  the slots if you need arrow-key navigation. For an app chrome bar (logo
  + nav + actions), standard tab order is the expected pattern and a
  single aria-label is sufficient.

  Center vs. leading for the page title:
    - Use `center` for a CENTERED page title (Apple-style window chrome).
    - Use `leading` after the logo for a LEFT-ALIGNED page title (web-app
      style — GitHub, Linear). Mixing is fine.
---

```jsx
// App window chrome — Reddit / Twitter / GitHub shape.
<Toolbar
  leading={
    <Row gap="sm" align="center">
      <Logo />
      <Button variant="ghost" size="sm">Home</Button>
      <Button variant="ghost" size="sm">Explore</Button>
    </Row>
  }
  center={
    <Input placeholder="Search" className="max-w-md" />
  }
  trailing={
    <Row gap="xs" align="center">
      <Button variant="ghost" size="icon"><Bell /></Button>
      <Avatar><AvatarFallback>AL</AvatarFallback></Avatar>
    </Row>
  }
/>
```

```jsx
// Section toolbar inside a Card — small, subtle, no border.
<Card>
  <Toolbar
    size="sm"
    variant="subtle"
    position="inline"
    leading={<span className="text-sm font-medium">Recent activity</span>}
    trailing={
      <Button variant="ghost" size="sm">View all</Button>
    }
  />
  <CardContent>…</CardContent>
</Card>
```

```jsx
// Bottom action toolbar — common on mobile-style detail pages.
<Toolbar
  position="bottom"
  sticky
  leading={<Button variant="outline" size="sm">Cancel</Button>}
  trailing={<Button size="sm">Save changes</Button>}
/>
```

```jsx
// Inside AppShellHeader — the canonical "app chrome" composition.
<AppShell nav="side">
  <AppShellHeader>
    <Toolbar
      leading={<Logo />}
      trailing={
        <Row gap="xs">
          <Button variant="ghost" size="icon"><Bell /></Button>
          <Avatar><AvatarFallback>AL</AvatarFallback></Avatar>
        </Row>
      }
    />
  </AppShellHeader>
  <AppShellNav placement="side">{/* sidebar */}</AppShellNav>
  <AppShellMain>{/* content */}</AppShellMain>
</AppShell>
```

## Anti-patterns

```jsx
// ❌ Hand-rolling the three-region grid every time.
<Row justify="between" align="center" className="px-4 py-3 border-b border-border">
  <Row gap="sm" align="center"><Logo /></Row>
  <div className="flex-1 flex justify-center"><Input className="max-w-md" /></div>
  <Row gap="xs" align="center"><Bell /><Avatar /></Row>
</Row>

// ✅ Toolbar collapses this to slot props + the right ARIA role.
<Toolbar
  leading={<Logo />}
  center={<Input className="max-w-md" />}
  trailing={<Row gap="xs"><Bell /><Avatar /></Row>}
/>
```

```jsx
// ❌ Cramming an editor-style toolbar (B / I / S / link) into the leading
//    slot. Toolbar's slot layout is for chrome bars; for a tight cluster
//    of related controls with arrow-key navigation, compose with Radix
//    Toolbar primitives inside the leading slot OR use a plain <Row>.

// ✅ Editor toolbar lives inside the section it's editing, not in the
//    window chrome. Use a Row of Buttons or @radix-ui/react-toolbar
//    inside the section.
```
