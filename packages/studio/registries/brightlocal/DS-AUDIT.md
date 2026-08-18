# BrightLocal DS audit log

Known gaps between BrightLocal's docs, the npm package, and the live
platform. **This is the findings ledger for the upstream report.** Append
new discrepancies here.

## Why this is not a rules file

This lived at `rules/90-audit.md` and therefore rode into EVERY generation
prompt, at 10,275 chars a turn. It was serving two audiences at once: the
model, which needs the handful of imperatives ("add `max-w-none` to
full-width cards"), and us, which needs the diagnosis, the evidence and the
upstream ask. Only the first has to be in the prompt.

So the split is by AUDIENCE, not by topic:

- **`rules/90-audit.md`** keeps the imperatives, terse, no rationale. That
  file still rides every prompt, and is now a fraction of the size.
- **this file** keeps the full finding: what is broken, how we know, what
  we do about it, and what BrightLocal should change.

They are not duplicates and should not be merged back. If you add a finding
that changes what the model should EMIT, add the one-line imperative to the
rules file too, and keep the reasoning here.

## Package / docs / live drift

- `component-meta.json` lists ~23 exports that don't exist in the real
  barrel and omits SidebarAccountDropdown entirely. The contract generator
  is grounded in the published `dist/index.d.ts` for exactly this reason.
- Their MCP composition recipes appear nowhere in Storybook, and 8 of 29
  contain placeholder slots that have never been rendered. Treat recipe
  slots as structure, not finished content.
- The published npm package lags the live product (account trigger,
  possibly more). When a live screenshot disagrees with what the package
  renders, the package wins for generation. Log the difference here.
- Account dropdown: the live platform wraps the user in a bordered card
  (`data-slot="dropdown-menu-trigger-avatar"`) that does NOT exist in the
  published package; Storybook shows only a bare logout.
- Mobile shell: SidebarTrigger + the built-in mobile sheet exist in the
  package but are documented nowhere.
- The LIVE platform's display font doesn't render: headings declare Poppins
  (the inspector shows the stack) but paint in a fallback, and the
  double-storey 'a' gives it away (Poppins' 'a' is single-storey). Likely a
  failed webfont load masked by `font-display: swap`. Studio's preview loads
  real Poppins from Google Fonts, so generated screens are MORE on-brand
  than production. When comparing against live screenshots, trust the DS
  tokens (`--ds-font-font-display: Poppins`), not live's rendered type.
- Sidebar icon sizing: AI_USAGE says 16px-no-overrides, the sidebar docs say
  nothing, the live platform ships 24px at strokeWidth 1.33. Our convention
  is 20px `size-5` (see the product map).
- Icon stroke invariant (undocumented): the live platform keeps the ABSOLUTE
  stroke at ~1.33px across sizes, so 24px icons at strokeWidth 1.33 and 14px
  meta icons at 2.28 (both ≈ 1.33px drawn). A real system, written down
  nowhere.

## Things we patch, with the upstream ask

- **`--sidebar-width` is not overridable.** Set INLINE by SidebarProvider
  (224px) and hardcoded on the live platform's container, so neither `:root`
  vars nor classes reach it. The project's `custom.css` patches it at
  `[data-slot="sidebar-provider"]`.
- **GlobalLayout padding is a string literal.** `p-section-sm` is baked into
  its inner div with no `cn()` merge (the className prop lands on the outer
  ScrollArea), and ScrollArea hardcodes `p-1` on
  `data-slot="scroll-area-viewport"` (focus-ring breathing room; className
  only reaches the Root). Neither is prop-overridable, and the live platform
  ships this padding too (verified July 2026), so this is a proposal-level
  deviation from live, not package/live drift. It blocks sticky headers and
  edge-locked layouts. `custom.css` zeroes both, scoped:
  `[data-hook="global-layout-scroll"] > [data-slot="scroll-area-viewport"]`
  and `[data-slot="global-layout"]`.
  *Upstream ask:* run the padding through `cn()`, or expose it as a
  prop/variant.
- **The desktop Sidebar paints no background.** `bg-sidebar-background`
  exists only in its mobile Sheet branch (2.20.0 dist); the desktop branch
  sets `text-sidebar-foreground` only, so the "sidebar background" is the
  page background showing through, invisible because both tokens resolve to
  neutral-50. Re-pointing `--sidebar-background` recolors nothing on
  desktop. AppLayoutShell's `sidebarTone` paints the container directly,
  plus the `--sidebar-*` / `--color-sidebar-*` doubles for the accent/hover
  utilities.
  *Upstream ask:* paint `bg-sidebar-background` on the desktop branch too,
  so the token actually themes the sidebar.
- **Card ships `max-w-[400px]` in its BASE classes.** Any card meant to span
  a slot wider than 400px silently clamps ("why is my card narrow?"). Their
  own deprecation message sanctions the fix: className max-width utilities.
  The old `maxWidth` prop is deprecated.
- **Card border token is transparent.** `--ds-colors-card-border-light` maps
  to `base-transparent`, so the filled Card's `border border-card-border`
  renders NO visible border by default. Figma's card border is `base/border`
  (neutral-200, #E6EDE8), the semantic `--border` token, not `--card-border`.
  *Upstream ask:* point card-border at base/border, or document the
  transparent default.
- **Badge has no success/warning/info variants** (their MCP lists this as a
  limitation), yet the live product's "Active" status badge paints itself
  with `className="border-transparent bg-success-background
  text-success-foreground"`, violating their own no-restyling rule out of
  necessity. That exact className is the ONE sanctioned exception until they
  ship the variants (see the location-page-header recipe).
- **SidebarSeparator vs Separator.** The generic `Separator` paints the PAGE
  border token (`bg-border`), which reads harsh inside a toned sidebar.
  `SidebarSeparator` is tone-aware (`bg-sidebar-border`); its only flaw is a
  baked `my-5` rhythm, airier than the tightened nav.
  *Upstream ask:* give SidebarSeparator a spacing variant like Separator's,
  and have the Sidebar docs point at it. Nothing currently steers
  composition away from the generic one.
- **Nav truncation is baked in.** SidebarMenuButton and SidebarMenuSubButton
  hardcode `[&>span:last-of-type]:truncate`, and SidebarMenuSub's border
  variant bakes `pr-10` (40px right padding per nesting level). Together
  they force ellipsis on deep/long nav labels with no opt-out. Navigation
  labels must never truncate; data values like business names may.
  *Upstream ask:* make truncation opt-in and the sub-list right padding a
  variant/token.
- **SidebarContent overflow nudge** (16 Jul 2026). `SidebarContent` adds
  `pr-2` only when its nav overflows (`hasOverflow` state in sidebar.tsx),
  so the entire nav shifts 8px left the moment it becomes scrollable.
  *Upstream ask:* reserve the gutter unconditionally, or
  `scrollbar-gutter: stable`.
- **Chip vs Badge** (16 Jul 2026). `Chip` ALWAYS renders a remove button
  (`data-slot="chip-delete"`; a loading spinner replaces it while
  `loading`). There is no non-dismissible mode in 2.20.0. It is an INPUT
  control (filters, selected values), never a status label. Symptom that
  prompted this: every "badge" on the hub cards sprouting a ✕.
- **Font-weight ramp is shifted** (16 Jul 2026). The theme remaps the whole
  scale one step down: `--ds-font-weight-normal: 300`, `medium: 400`,
  `semibold: 500`, `bold: 600`, so DS defaults like CardDescription's
  `font-normal` paint at 300, visibly thin in Inter at text-sm.
  PROPOSAL DECISION (same day): every proposal screen re-points the ramp to
  the standard scale (normal=400 … bold=700) via `BRIGHTLOCAL_WEIGHT_RAMP_FIX`
  appended to the registry `previewThemeCss`, so weight utilities mean what
  they say and no per-component overrides are needed.
  *Upstream ask:* ship that ramp.
- **Bing missing from the social icon set** (23 Jul 2026).
  `@brightlocal/icons`' social-media family (~50 services, `-Original` and
  `-Neutral` treatments) has NO Bing mark, yet the legacy platform ships one
  via its icon font (`bl-icon-se-bing`, the `se-*` search-engine family). A
  "Bing Places" connection row can't show its provider mark from the
  published package.
  *Upstream ask:* port the legacy `se-*` search-engine icons (Bing at
  minimum) into the social-media set.
- **LSG pins overlap at low zoom** (23 Jul 2026). On the live platform's
  Local Search Grid, zooming out lets the rank pins collide: pin size is
  fixed while the grid's geographic spacing shrinks. RankGrid derives pin
  size from zoom and clamps the map to min/max zoom bounds so pins can never
  overlap.
  *Upstream ask:* same clamp and zoom-aware pin sizing on the live LSG map.
- **No drill-arrow affordance component** (24 Jul 2026). Every clickable
  card in the proposal wears the same drill affordance, a circular arrow
  Button that flips to its hover state when the CARD is hovered
  (group/group-hover), but the DS has no such component and its Button has
  no icon size, so the anatomy was hand-rolled at every site: the hub
  screen's local DrillArrow (solid secondary), the AI Insights module cards'
  inline copy, and LocationCard's module-private glass variant (white/70 +
  backdrop blur, for sitting on photography).
  INTERIM (later on 24 Jul, after the standalone copies shipped to prod):
  the proposal lib now exports `DrillArrow` (variant "solid" | "glass") and
  every card uses it.
  *Upstream ask:* publish a drill-down arrow component (solid + on-media
  looks, plus an icon Button size). When it lands, swap the ONE lib
  definition.

## Conventions the DS never wrote down

- `data-hook` names INSTANCES ("settings-save-button"), not components.
  Component identity comes from `data-slot`.
