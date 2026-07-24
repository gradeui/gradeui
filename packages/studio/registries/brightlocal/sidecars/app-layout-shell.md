---
name: AppLayoutShell
import: "@brightlocal/proposal"
props:
  - flush?: boolean — Cancel GlobalLayout's baked-in p-section-sm and the scroll viewport's p-1 (string literals in the dist, not prop-overridable — see rules/90-audit.md). (default true)
  - stickyHeader?: boolean — Pin the content header to the top of the scroll viewport (bg-background, border-b unless headerBorder says otherwise). Requires flush, otherwise it sticks 24px down inside the padding. (default false)
  - headerBorder?: boolean — Header band bottom border, independent of stickiness. Unset = auto (border only while sticky); true/false forces it on/off. Also a tweaker row (Alt+T).
  - headerSpace? (default | spacious) — Band breathing room: "spacious" roughly doubles the vertical padding (HEADER_SPACES presets) for presentation looks. Also a tweaker row (Header → Space). (default "default")
  - headerSurface? (none | white | subtle | dark | brand | brand-dark) — Named band colour preset (HEADER_SURFACES) — THE canonical header-colour knob; dark presets also re-point the header's text tokens + colorScheme so titles/crumbs/controls stay readable. "brand" = green-900, "brand-dark" = green-950 (pure ramp tokens, matching the sidebar tones of the same names) — layer them for depth between adjacent surfaces. Beats headerBackground when set. Also a tweaker row. (default "none")
  - headerBackground?: string — The header band is a SHELL-OWNED element (a sibling of the DS content wrapper), so it spans the content column edge-to-edge by construction; PageHeader's `align` decides where the content lands inside it ("center" = capped + centred to match the body). This className paints the band's surface; unset = transparent (page background shows, no visible change). Pass a bg utility or scope class for a distinct full-width header surface. (default none)
  - pinnedSidebar?: boolean — Lock the sidebar to the viewport edge, full height (top 0 / 100dvh). The DS default offsets it by --ds-section-padding-y-sm, which is wrong once flush. (default true)
  - sidebarTone? (default | white | subtle | muted | dark | brand | brand-dark) — Re-skin the sidebar by re-pointing the --sidebar-* CSS variables on its container. "muted" is one step darker than "subtle" (neutral-200) — the depth step for sitting a tone below the page background. Pure token swap; component internals untouched. (default "white")
  - contentMaxWidth?: string — Max width of the content column (passed to GlobalLayoutContent; default the DS's breakpoint-lg). Note the DS's ContentHeader hardcodes its own breakpoint-lg cap, so only the body follows a custom value.
  - sidebarFrame? (flush | floating | attached) — How the sidebar sits (desktop only). "flush" = pinned hard against the viewport edge (border-r by default); "floating" = pinned but lifted off a little (12px margin + 16px radius); "attached" = LIVES WITH THE CONTENT — no viewport pinning, in-flow inside the centred layout container, BORDERLESS by default. Presets in SIDEBAR_FRAMES; explicit sidebarBorder overrides any frame. (default "floating")
  - sidebarShadow? (frame | none | sm | md | lg) — Sidebar drop shadow on Tailwind's scale, independent of the frame. "frame" (default) defers to the frame preset (floating ships shadow-sm). (default "frame")
  - contentOverSidebar?: boolean — Flip the depth order at the sidebar seam: the content panel sits ABOVE the sidebar and casts a soft left shadow onto it (an elevated sheet over the nav rail). FLUSH FRAME ONLY — silently no-ops on floating (has its own lift) and attached (in-flow, no seam). Desktop only (below lg the aside is hidden). Also a tweaker row (Sidebar → Content above). (default false)
  - tweaker?: boolean — Render the hidden ShellTweakerPanel (bottom-right corner hover / Alt+T): session-local overrides of the look knobs for stakeholder demos; literal props stay the authored truth. Set FALSE to lock a screen to its authored props (comparison variants, hard-set client data) — no panel, no override layer, viewers can't flip it. (default true)
  - tweaks? / onTweaksChange? — Controlled override pair (advanced): pass a tweaks object to hard-set the tweaker's override layer from the screen instead of the panel; with onTweaksChange omitted the overrides are frozen. Prefer plain authored props + tweaker={false} unless you specifically need the override layer.
  - pageLayers? (default | raised | outline | subtle | white) — CARD treatment (tweaker: Page → Cards). outline = transparent cards + border; subtle = faint tinted cards; white = white elevated cards — these three touch card tokens ONLY (canvas is pageBackground's job). Legacy: "raised" = white cards + tinted canvas combo; "default" = DS stock. (default "raised")
  - pageBackground? (auto | white | subtle | muted) — CANVAS colour on its own, independent of the card treatment. "auto" defers to the pageLayers preset; the rest re-point the page background (white / neutral-50 / neutral-100, dark-mode aware). Also a tweaker row (Page → Background). (default "auto")
  - sidebarBorder?: string — Optional 1px border color around the sidebar container. Any CSS color; tokens welcome ("var(--sidebar-border)").
  - navDensity? (compact | comfortable | expansive) — Nav rhythm via the --gds-nav-* variables. "compact" = fitted 30px rows/16px icons; "comfortable" = roomier rows, 20px icons; "expansive" = the LIVE product's generous nav (~48px rows, 15px labels, 20px icons). Also a tweaker row. (default "compact")
  - dataset?: string — Named dataset (lib/data/*.json) applied via a nested ProposalDataProvider around the shell; "default" mounts nothing (generic demo data). Also a ShellTweakerPanel row (Alt+T switches live, session-only). (default "minus-one-studios" — the real captured client is the baseline)
  - mobileTone?: boolean — Carry the sidebar tone onto the mobile Sheet overlay too (scoped style targeting its data-sidebar/data-mobile marks — the Sheet portals outside the shell's tree). Off = mobile keeps the default light tone. (default true)
  - dataHook?: string — Instance name stamped through to the underlying GlobalLayout parts. (default "app-layout")
  - sidebar? — Slot: the Sidebar compound to render inside GlobalLayoutSidebar.
  - header? — Slot: content for the (optionally sticky) GlobalLayoutContentHeader.
  - mobileBar? — Slot: mobile top bar (SidebarTrigger + Logo, lg:hidden). Rendered first in the content column so it sits above the page header below lg. The shell WRAPS it in the headerSurface treatment (same preset as the band, incl. the .dark fence), so its background/text/hamburger/Logo follow the band automatically — don't paint a surface in the slot markup.
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
    sidebar={<ProposalSidebar activeId="rankings-table" />}
    header={<PageHeader breadcrumbs={[…]} title="Page title" />}
  >
    <GlobalLayoutContentBody dataHook="page-body">…</GlobalLayoutContentBody>
  </AppLayoutShell>
</SidebarProvider>
```

The sticky header sits at z-30 — page content may use z-indexes up to
z-20 and stays underneath; the tweaker (z-50) and portalled overlays
stay above.

LOCKED VARIANTS (A/B comparisons): to author "Nav White vs Nav Brand"
style screen pairs, duplicate the screen, hard-set the differing knobs
as plain props, and set tweaker={false} on BOTH so the screens stay
locked to their authored look (no Alt+T, no override layer — the
authored props are exactly what every viewer sees, in Studio, shares
and embeds). Hard-set data the same way: dataset="northside-dental"
with tweaker={false} pins the client too.

```jsx
// Screen "Nav — Brand":
<AppLayoutShell sidebarTone="brand" tweaker={false} …>
// Screen "Nav — White" (the duplicate):
<AppLayoutShell sidebarTone="white" tweaker={false} …>
```

Selection note: the shell passes data-slot="app-layout-shell" to
GlobalLayout, whose inner div spreads rest props AFTER its own
data-slot="global-layout" — so the stamp overrides it and the selection
agent resolves clicks to AppLayoutShell (kebab→Pascal). Anything
targeting [data-slot="global-layout"] must target
[data-slot="app-layout-shell"] instead when the shell is in play.
