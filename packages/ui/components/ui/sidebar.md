---
name: Sidebar
import: "@gradeui/ui"
subcomponents: [SidebarHeader, SidebarContent, SidebarFooter, SidebarSection, SidebarItem]
props:
  - Sidebar: collapsed?: boolean — controlled collapsed state (wire onCollapsedChange when set)
  - Sidebar: defaultCollapsed?: boolean — uncontrolled initial value (default false)
  - Sidebar: onCollapsedChange?: (next: boolean) => void
  - Sidebar: collapsible?: boolean — show the affordance for the user to collapse (default true)
  - Sidebar: variant?: 'rail' | 'panel' — outer chrome treatment. `rail` (default) is the classic nav rail with a single right-border + tracked width via `--gds-sidebar-width`; drops cleanly into `<AppShellNav placement="side">`. `panel` is a card-style floating sidebar with full border + rounded corners + parent-controlled width; use when the sidebar is one of several adjacent panes in a body row (e.g. Projects | Canvas | Settings). The compound children (Header/Content/Footer/Section/Item) are identical in both treatments.
  - Sidebar: bordered?: boolean — draw the OUTER edge: the right-hand rule in `rail`, the full outline in `panel` (default true). Set false where the rail's own `bg-card` already separates it from the content beside it and the rule reads as an artefact, which is typical on dark high-contrast themes. A borderless rail keeps its width transition and a borderless panel keeps its rounding and clipping. Controls the outer edge ONLY: the rules under SidebarHeader and above SidebarFooter are internal structure and stay.
  - SidebarHeader: any children — brand / logo / org switcher; hides nothing when collapsed (centred)
  - SidebarContent: any children — scrollable body
  - SidebarFooter: any children — user block, settings link, pinned chrome
  - SidebarSection: title?: ReactNode — group label, tracking-wide muted styling; hidden when sidebar is collapsed. CASE: static (non-collapsible) headers historically render UPPERCASE (Notion / Linear / Slack-style "GAMES", "FAVORITES"); collapsible headers render the authored case. Control it explicitly with titleTransform.
  - SidebarSection: titleTransform? ("uppercase" | "none") — title casing for BOTH header variants. "none" renders the authored case (sentence-case headers like a "Recents" list); "uppercase" forces the shouty group label. Unset = the per-variant legacy default above.
  - SidebarSection: icon?: ReactNode — optional icon beside the title
  - SidebarSection: trailing?: ReactNode — **action(s) on the right edge of the header** — the canonical "+" / "..." slot (Notion's "+ Add page" next to Pages, Linear's "+" next to Favorites, Slack's "+" next to Channels). Pointer events isolated so a Button here doesn't toggle collapse.
  - SidebarSection: collapsible?: boolean — title acts as expand/collapse trigger with a **chevron indicator** (default true). Set `false` for a static, non-clickable header.
  - SidebarSection: defaultExpanded?: boolean — initial open state (default true)
  - SidebarItem: icon?: ReactNode — leading icon. Sized by the row: 20px at size md, 16px at size sm. That is a default, not a pin — put a size-* class on the icon itself (icon={<Home className="size-6" />}) to override it.
  - SidebarItem: badge?: ReactNode — trailing count / label (hidden when collapsed)
  - SidebarItem: active?: boolean — current route; adds aria-current="page"
  - SidebarItem: href?: string — renders as <a>; for routing use `asChild` with your link component
  - SidebarItem: asChild?: boolean — wrap a custom link (<Link href> from Next.js etc.) via Radix Slot
  - SidebarItem: asButton?: boolean — render as <button> for action rows (open dialog, log out)
  - SidebarItem: disabled?: boolean
  - SidebarItem: collapsedLabel?: ReactNode — tooltip override when sidebar is collapsed (defaults to children text)
  - SidebarItem: size?: 'sm' | 'md' — row size. `md` (default) is the standard `text-sm font-medium` nav row; `sm` is `text-xs` + lighter weight + tighter padding for visually subordinate rows (nested screens under a project, sub-pages under a section). Active state still wins on color + weight so the current row pops at either size.
  - SidebarItem: description?: ReactNode — secondary line beneath the label (metadata like 'Edited 2m ago', '12 items', a brief description). Row layout adapts: label + description stacked vertically; icon vertically-centered against the stack; badge stays on trailing edge. Hidden when sidebar collapsed.
  - SidebarTreeItem: description?: ReactNode — secondary line beneath the label, same shape as SidebarItem.description. Useful when a branch needs more than just a name (last-edited timestamp, item count, owner).
  - SidebarTreeItem: trailing?: ReactNode — right-edge action slot (settings cog, more-actions overflow, "+ add child"). Rendered as a SIBLING of the branch button (not nested inside it, so `<button>` children in `trailing` stay valid HTML). Vertically centered against the row; click events are stopPropagation'd so a tap on a trailing button doesn't toggle expand/collapse. The branch row wrapper carries a `group/row` named-group, so consumer-provided trailing can opt into hover-only visibility via `hidden group-hover/row:flex` — the hover state is scoped to the branch row alone, not the nested children.
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

```jsx
// Section header with a trailing action — the Notion / Linear / Slack
// "+" next to a section name. The trailing slot isolates pointer events
// from the collapse toggle, so the Button doesn't also flip expand.
<SidebarSection
  title="Pages"
  trailing={
    <Button variant="ghost" size="icon" className="h-5 w-5">
      <Plus className="h-3 w-3" />
    </Button>
  }
>
  <SidebarItem>Notes</SidebarItem>
  <SidebarItem>Drafts</SidebarItem>
</SidebarSection>
```

```jsx
// Non-collapsible static header — for sections the user shouldn't
// be able to fold. `collapsible={false}` hides the chevron.
<SidebarSection title="Workspace" collapsible={false}>
  <SidebarItem>...</SidebarItem>
</SidebarSection>
```

### Anti-patterns

DO NOT pass a `sections={[...]}` data array — that was the old SideMenu shape (retired May 2026). Compose `<SidebarSection>` and `<SidebarItem>` directly so any non-list-shaped chrome (search input, drag handle, custom brand block) can sit alongside the nav.

DO NOT set `href` AND `onClick` AND `asChild` at once — pick one mode per row. `href` = anchor, `asButton` = button, `asChild` = wrap your own link component. Mixing modes makes the DOM ambiguous.

DO NOT use Sidebar for primary marketing-style top navigation — that's TopMenu. Sidebar is for app chrome (logged-in product surfaces), not landing pages.

DO NOT rely on the collapsed-state tooltip to convey critical-only information. When the sidebar is collapsed, only the icon is visible by default; the label is in the tooltip on hover, but mobile users + screen readers won't reliably see it. Keep icons recognisable and ship the label as actual text on hover/focus, not just as a tooltip.

DO NOT hand-roll an uppercase "SECTION NAME" header above your items. `<SidebarSection title="…">` already gives you the uppercase + tracking-wide + muted styling, plus the chevron + expand/collapse behaviour. If your design has a "+" or "..." next to the section name, use the `trailing` prop — don't render the action as a separate SidebarItem below the section.

DO NOT bypass `<Sidebar>` and compose an icon rail or projects pane from raw `<Stack>` + buttons. You lose the collapsed-state handling, the per-item tooltip, the `data-gds-part` markers that Studio's selection layer reads, and the consistent padding/gap CSS vars (`--gds-sidebar-*`). If you find yourself writing `<button className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-muted">{icon}{label}</button>`, that's a SidebarItem.
