---
name: Sidebar
import: "@gradeui/ui"
subcomponents: [SidebarHeader, SidebarContent, SidebarFooter, SidebarSection, SidebarItem]
props:
  - Sidebar: collapsed?: boolean — controlled collapsed state (wire onCollapsedChange when set)
  - Sidebar: defaultCollapsed?: boolean — uncontrolled initial value (default false)
  - Sidebar: onCollapsedChange?: (next: boolean) => void
  - Sidebar: collapsible?: boolean — show the affordance for the user to collapse (default true)
  - SidebarHeader: any children — brand / logo / org switcher; hides nothing when collapsed (centred)
  - SidebarContent: any children — scrollable body
  - SidebarFooter: any children — user block, settings link, pinned chrome
  - SidebarSection: title?: ReactNode — group label; hidden when sidebar is collapsed
  - SidebarSection: icon?: ReactNode — optional icon beside the title
  - SidebarSection: collapsible?: boolean — title acts as expand/collapse trigger (default true)
  - SidebarSection: defaultExpanded?: boolean — initial open state (default true)
  - SidebarItem: icon?: ReactNode — leading icon
  - SidebarItem: badge?: ReactNode — trailing count / label (hidden when collapsed)
  - SidebarItem: active?: boolean — current route; adds aria-current="page"
  - SidebarItem: href?: string — renders as <a>; for routing use `asChild` with your link component
  - SidebarItem: asChild?: boolean — wrap a custom link (<Link href> from Next.js etc.) via Radix Slot
  - SidebarItem: asButton?: boolean — render as <button> for action rows (open dialog, log out)
  - SidebarItem: disabled?: boolean
  - SidebarItem: collapsedLabel?: ReactNode — tooltip override when sidebar is collapsed (defaults to children text)
when_to_use: Vertical app navigation. Drop inside `<AppShellNav placement="side">` for full-page layouts. Compound API — `<SidebarHeader>` for brand, `<SidebarContent>` for the scrollable body of `<SidebarSection>` + `<SidebarItem>` rows, `<SidebarFooter>` for user / settings chrome. For top nav reach for TopMenu; for command-palette style search reach for Command.
composes_with: [AppShell (inside AppShellNav), Avatar (in Footer), Tooltip (auto-wrapped on collapsed items), Button (asChild for custom routing)]
aliases: [sidebar, side menu, sidemenu, navigation sidebar, app sidebar, side nav, side nav rail, master pane, sidebarmenu, navigation rail, react native drawer]
---

```jsx
<Sidebar defaultCollapsed={false}>
  <SidebarHeader>
    <div className="flex items-center gap-2 font-semibold">
      <Logo className="h-5 w-5" />
      <span>Acme</span>
    </div>
  </SidebarHeader>

  <SidebarContent>
    <SidebarSection title="Workspace">
      <SidebarItem href="/" icon={<Home />} active>Dashboard</SidebarItem>
      <SidebarItem href="/inbox" icon={<Inbox />} badge={3}>Inbox</SidebarItem>
      <SidebarItem href="/team" icon={<Users />}>Team</SidebarItem>
    </SidebarSection>
    <SidebarSection title="Personal">
      <SidebarItem href="/settings" icon={<Settings />}>Settings</SidebarItem>
    </SidebarSection>
  </SidebarContent>

  <SidebarFooter>
    <Row gap="sm" align="center">
      <Avatar><AvatarFallback>AL</AvatarFallback></Avatar>
      <Stack gap="none" className="text-xs">
        <span className="font-medium">Ali</span>
        <span className="text-muted-foreground">Pro plan</span>
      </Stack>
    </Row>
  </SidebarFooter>
</Sidebar>
```

```jsx
// With Next.js routing — wrap any link component via `asChild`.
import Link from "next/link";

<SidebarItem asChild icon={<Home />} active={pathname === "/"}>
  <Link href="/">Dashboard</Link>
</SidebarItem>
```

```jsx
// Action row — `asButton` renders a <button> instead of an <a>.
<SidebarItem asButton icon={<LogOut />} onClick={signOut}>
  Sign out
</SidebarItem>
```

### Anti-patterns

DO NOT pass a `sections={[...]}` data array — that was the old SideMenu shape (retired May 2026). Compose `<SidebarSection>` and `<SidebarItem>` directly so any non-list-shaped chrome (search input, drag handle, custom brand block) can sit alongside the nav.

DO NOT set `href` AND `onClick` AND `asChild` at once — pick one mode per row. `href` = anchor, `asButton` = button, `asChild` = wrap your own link component. Mixing modes makes the DOM ambiguous.

DO NOT use Sidebar for primary marketing-style top navigation — that's TopMenu. Sidebar is for app chrome (logged-in product surfaces), not landing pages.

DO NOT rely on the collapsed-state tooltip to convey critical-only information. When the sidebar is collapsed, only the icon is visible by default; the label is in the tooltip on hover, but mobile users + screen readers won't reliably see it. Keep icons recognisable and ship the label as actual text on hover/focus, not just as a tooltip.
