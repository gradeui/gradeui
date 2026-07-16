---
name: AppLayoutShell
import: "@brightlocal/proposal"
props:
  - flush?: boolean — Cancel GlobalLayout's baked-in p-section-sm and the scroll viewport's p-1 (string literals in the dist, not prop-overridable — see rules/90-audit.md). (default true)
  - stickyHeader?: boolean — Pin the content header to the top of the scroll viewport (bg-background, border-b). Requires flush, otherwise it sticks 24px down inside the padding. (default false)
  - pinnedSidebar?: boolean — Lock the sidebar to the viewport edge, full height (top 0 / 100dvh). The DS default offsets it by --ds-section-padding-y-sm, which is wrong once flush. (default true)
  - sidebarTone? (default | white | subtle | dark | brand) — Re-skin the sidebar by re-pointing the --sidebar-* CSS variables on its container. Pure token swap; component internals untouched. (default "white")
  - contentMaxWidth?: string — Max width of the content column (passed to GlobalLayoutContent; default the DS's breakpoint-lg). Note the DS's ContentHeader hardcodes its own breakpoint-lg cap, so only the body follows a custom value.
  - sidebarFrame? (flush | floating) — How the sidebar sits against the screen edge (desktop only). "flush" = hard against it; "floating" = lifted off a little (12px margin + 16px radius — presets in SIDEBAR_FRAMES, tweak them in code). (default "floating")
  - sidebarShadow? (frame | none | sm | md | lg) — Sidebar drop shadow on Tailwind's scale, independent of the frame. "frame" (default) defers to the frame preset (floating ships shadow-sm). (default "frame")
  - tweaker?: boolean — Render the hidden ShellTweakerPanel (bottom-right corner hover / Alt+T): session-local overrides of the look knobs for stakeholder demos; literal props stay the authored truth. (default true)
  - pageLayers? (default | raised) — Page-wide layer treatment: re-points the canvas + card tokens on the layout root. "raised" = subtlest green-grey canvas (neutral-50), WHITE elevated cards, muted up to neutral-100. Presets in PAGE_LAYERS — tweak in code. (default "raised")
  - sidebarBorder?: string — Optional 1px border color around the sidebar container. Any CSS color; tokens welcome ("var(--sidebar-border)").
  - dataset?: string — Named dataset (lib/data/*.json) applied via a nested ProposalDataProvider around the shell; "default" mounts nothing. Also a ShellTweakerPanel row (Alt+T switches live, session-only). (default "default")
  - mobileTone?: boolean — Carry the sidebar tone onto the mobile Sheet overlay too (scoped style targeting its data-sidebar/data-mobile marks — the Sheet portals outside the shell's tree). Off = mobile keeps the default light tone. (default true)
  - dataHook?: string — Instance name stamped through to the underlying GlobalLayout parts. (default "app-layout")
  - sidebar? — Slot: the Sidebar compound to render inside GlobalLayoutSidebar.
  - header? — Slot: content for the (optionally sticky) GlobalLayoutContentHeader.
  - mobileBar? — Slot: mobile top bar (SidebarTrigger + Logo, lg:hidden). Rendered first in the content column so it sits above the page header below lg.
  - children? — Slot: page content rendered inside GlobalLayoutContent.
  - className?: string — Merged onto GlobalLayout after the flush classes.
---

Layout-exploration wrapper over the GlobalLayout compound family. IMPORT
IT — do NOT copy shell code into the screen: it ships in the shared
registry module "@brightlocal/proposal" (authored at
registries/brightlocal/lib/proposal.jsx; editing that file updates
every importing screen). The old in-file-copy pattern
(recipes/app-layout-shell.jsx) is legacy — existing copies keep
working, new screens import.

```jsx
import { AppLayoutShell, ProposalSidebar, PageHeader } from "@brightlocal/proposal";

<SidebarProvider dataHook="provider" defaultOpen>
  <AppLayoutShell
    flush
    stickyHeader
    pinnedSidebar
    sidebarTone="white"
    sidebar={<ProposalSidebar activeId="rk-table" />}
    header={<PageHeader breadcrumbs={[…]} title="Page title" />}
  >
    <GlobalLayoutContentBody dataHook="page-body">…</GlobalLayoutContentBody>
  </AppLayoutShell>
</SidebarProvider>
```

The sticky header sits at z-30 — page content may use z-indexes up to
z-20 and stays underneath; the tweaker (z-50) and portalled overlays
stay above.

Selection note: the shell passes data-slot="app-layout-shell" to
GlobalLayout, whose inner div spreads rest props AFTER its own
data-slot="global-layout" — so the stamp overrides it and the selection
agent resolves clicks to AppLayoutShell (kebab→Pascal). Anything
targeting [data-slot="global-layout"] must target
[data-slot="app-layout-shell"] instead when the shell is in play.
