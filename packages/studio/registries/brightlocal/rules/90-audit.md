BrightLocal DS audit log — known gaps between their docs, the npm package (2.20.0), and the live platform. Work around these; don't fight them. (This file doubles as the running findings ledger for the upstream report — append new discrepancies here.)
- --sidebar-width is set INLINE by SidebarProvider (224px) and hardcoded on the live platform's container — not overridable from :root. The project's custom.css patches it at [data-slot="sidebar-provider"]; never try to set it via classes or :root vars.
- Sidebar icon sizing: AI_USAGE says 16px-no-overrides, the sidebar docs say nothing, the live platform ships 24px at strokeWidth 1.33. Our convention is 20px size-5 (see the product map) — follow it, not the live platform.
- Account dropdown: the live platform wraps the user in a bordered card (data-slot="dropdown-menu-trigger-avatar") that does NOT exist in the published package; Storybook shows only a bare logout. Use SidebarAccountDropdown exactly as published — do not fake the border with utility classes.
- Mobile shell: SidebarTrigger + the built-in mobile sheet exist in the package but are documented nowhere — mount them per the product map's responsive-shell rule; never hand-roll a drawer.
- component-meta.json lists ~23 exports that don't exist in the real barrel and omits SidebarAccountDropdown entirely — trust the component allowlist, not component-meta.
- data-hook names INSTANCES ("settings-save-button"), not components; component identity comes from data-slot.
- Their MCP composition recipes appear nowhere in Storybook, and 8 of 29 contain placeholder slots that have never been rendered — treat recipe slots as structure, not finished content.
- The LIVE platform's display font doesn't render: headings declare Poppins (inspector shows the stack) but paint in a fallback — the double-storey 'a' gives it away (Poppins' 'a' is single-storey). Likely a failed webfont load masked by font-display: swap. Studio's preview loads real Poppins from Google Fonts, so generated screens are MORE on-brand than production — when comparing against live screenshots, trust the DS tokens (--ds-font-font-display: Poppins), not live's rendered type.
- Card ships max-w-[400px] in its BASE classes — any card meant to span a slot wider than 400px silently clamps ("why is my card narrow?"). Their own deprecation message sanctions the fix: className max-width utilities. Add className="max-w-none" to full-width cards (and w-full where the card must stretch). The old maxWidth prop is deprecated — never use it.
- Badge has NO success/warning/info variants (their MCP lists this as a limitation) — yet the live product's "Active" status badge paints itself with className="border-transparent bg-success-background text-success-foreground", violating their own no-restyling rule out of necessity. This exact className is the ONE sanctioned exception for status badges until they ship the variants (see the location-page-header recipe).
- Icon stroke invariant (undocumented): the live platform keeps the ABSOLUTE stroke at ~1.33px across sizes — 24px icons at strokeWidth 1.33, 14px meta icons at 2.28 (both ≈ 1.33px drawn). A real system, written down nowhere.
- The published npm package lags the live product (account trigger, possibly more). When a live screenshot disagrees with what the package renders, the package wins for generation; log the difference here.
- GlobalLayout bakes `p-section-sm` into its inner div as a STRING LITERAL (no cn() merge — the className prop lands on the outer ScrollArea), and ScrollArea hardcodes `p-1` on data-slot="scroll-area-viewport" (focus-ring breathing room; className only reaches the Root). Neither is prop-overridable — and the live platform DOES ship this padding too (verified July 2026), so this is a proposal-level deviation from live, not a package/live drift. It blocks sticky headers and edge-locked layouts. The project's custom.css zeroes both, scoped: `[data-hook="global-layout-scroll"] > [data-slot="scroll-area-viewport"]` + `[data-slot="global-layout"]`. When the padding is stripped, GlobalLayoutSidebar's sticky geometry (top/height offset by --ds-section-padding-y-sm) must be reset per-screen via style={{ top: 0, height: "100dvh" }} (its style prop merges, user wins). Upstream ask: run the padding through cn(), or expose it as a prop/variant.
- The desktop Sidebar paints NO background: `bg-sidebar-background` exists only in its mobile Sheet branch (2.20.0 dist); the desktop branch sets `text-sidebar-foreground` only, so the "sidebar background" is the page background showing through — invisible because both tokens resolve to neutral-50. Re-pointing --sidebar-background recolors nothing on desktop; anything theming the sidebar area must paint the container itself (AppLayoutShell's sidebarTone sets backgroundColor + color directly, plus the --sidebar-*/--color-sidebar-* doubles for the accent/hover utilities). Upstream ask: paint bg-sidebar-background on the desktop branch too, so the token actually themes the sidebar.
- Sidebar dividers: use the sidebar family's OWN `SidebarSeparator` (bg-sidebar-border, tone-aware), NOT the generic `Separator` — that one paints the PAGE border token (`bg-border`), which reads harsh inside a toned sidebar. SidebarSeparator's only flaw is its baked `my-5` rhythm (20px each side, airier than the tightened nav); override with className="my-2" (their cn is tailwind-merge, so the override wins). Upstream ask: give SidebarSeparator a spacing variant like Separator's, and have the Sidebar docs point at it — nothing currently steers composition away from the generic Separator.
- Nav truncation is BAKED IN: SidebarMenuButton and SidebarMenuSubButton hardcode `[&>span:last-of-type]:truncate`, and SidebarMenuSub's border variant bakes `pr-10` (40px right padding per nesting level) — together they force ellipsis on deep/long nav labels with no opt-out. Navigation labels must never truncate (data values like business names may). Workaround: `[&>span:last-of-type]:whitespace-normal!` + h-auto/min-h rows + overriding pr-10 via className. Upstream ask: make truncation opt-in and the sub-list right padding a variant/token.

## Chip vs Badge (16 Jul 2026)

`Chip` ALWAYS renders a remove button (`data-slot="chip-delete"`; a loading spinner replaces it while `loading`) — there is no non-dismissible mode in 2.20.0. It is an INPUT control (filters, selected values), never a status label. For read-only status, plan, or delta labels use `Badge` (primary | secondary | destructive | outline). Symptom that prompted this: every "badge" on the hub cards sprouting a ✕.

## SidebarContent overflow nudge (16 Jul 2026)

`SidebarContent` adds `pr-2` only when its nav overflows (`hasOverflow` state in sidebar.tsx), so the entire nav shifts 8px left the moment it becomes scrollable. Account for it by passing `pr-2` permanently via className — cn dedupes when the DS adds its own. Upstream ask: reserve the gutter unconditionally (or scrollbar-gutter: stable).

## Font-weight ramp is shifted (16 Jul 2026)

The theme remaps the whole weight scale one step down: `--ds-font-weight-normal: 300`, `medium: 400`, `semibold: 500`, `bold: 600`. Consequence: DS defaults like CardDescription's `font-normal` paint at 300 — visibly light/thin, especially in Inter at text-sm. For body copy that should read as regular weight, use `font-medium` (= 400). Deliberate at token level, but worth an upstream conversation about whether description text should sit at 300. PROPOSAL DECISION (same day): every proposal screen re-points the ramp to the standard scale (normal=400 … bold=700) via BRIGHTLOCAL_WEIGHT_RAMP_FIX appended to the registry previewThemeCss — weight utilities mean what they say, no per-component overrides needed. The upstream recommendation is to ship that ramp.

## Card border token is transparent (16 Jul 2026)

`--ds-colors-card-border-light` maps to `base-transparent` — the filled Card's `border border-card-border` renders NO visible border by default. Figma's card border is `base/border` (= neutral-200, #E6EDE8), i.e. the semantic `--border` token, not `--card-border`. Proposal screens paint `border-color: var(--border)` on cards via the raised layer. Upstream ask: point card-border at base/border (or document the transparent default).


## Bing missing from the social icon set (23 Jul 2026)

`@brightlocal/icons`' social-media family (~50 services, `-Original` +
`-Neutral` treatments) has NO Bing mark — yet the legacy platform ships
one via its icon font (`<span class="bl-icon medium bl-icon-se-bing">`,
the `se-*` search-engine family). Consequence: a "Bing Places"
connection row can't show its provider mark from the published package.
Proposal fallback: lucide `Globe` in the neutral grey. Upstream ask:
port the legacy `se-*` search-engine icons (Bing at minimum) into the
social-media set.

## LSG pins overlap at low zoom (23 Jul 2026)

On the live platform's Local Search Grid, zooming the map out lets the
rank pins COLLIDE/overlap — the pin size is fixed while the grid's
geographic spacing shrinks. Proposal contract (RankGrid): derive pin
size from the zoom level and clamp the map to default min/max zoom
bounds so pins can never overlap. Upstream ask: same clamp + zoom-aware
pin sizing on the live LSG map.
