# BrightLocal side-nav update — working context

Orientation file for Claude sessions working on the BrightLocal side navigation
proposal. Read this before re-exploring; it captures what's already known so a
session doesn't start cold.

## The task

Ali wants to propose updates to the BrightLocal application side navigation,
informed by their Storybook (https://storybook.brightlocal.com) and their
design system. **Deliverable: design proposal / mockups in Studio**, using the
BrightLocal registry — not code changes in a BrightLocal repo (none is mounted).

## Ground truth already established

- BrightLocal exists as a **DesignSystemRegistry** in this repo (STUDIO-BYODS.md):
  - Source assets: `packages/studio/registries/brightlocal/` — `blocks/`,
    `recipes/`, `rules/`, `sidecars/`, `templates/`
  - Compiled: `packages/studio/src/registry/brightlocal.ts` +
    `src/registry/brightlocal/*.generated.ts`
- **Harvest is FRESH (July 2026) — do NOT re-run the harvest scripts.**
  The `harvest-brightlocal-*.mjs` scripts in `packages/studio/scripts/` exist
  and are idempotent, but Ali confirmed a recent run; skip unless he asks.
- Sidebar assets already in the registry:
  - `sidecars/sidebar.md` — full frontmatter (34 subcomponents, props incl.
    required `dataHook`, deprecated `embedded`) + guidance body
  - 16 `blocks/blocks-sidebar-*.jsx` files harvested from Storybook story
    source (`parameters.docs.source.originalSource`) — Default, Content,
    Footer, Group ×3, HeaderButton ×2, InboxItem ×2, MenuSkeleton,
    MenuSubButton, Switcher ×3, AccountDropdown
  - Templates carrying the sidebar shell: `templates/page-skeleton.jsx`,
    `templates/location-dashboard.jsx`
- **BrightLocal DS MCP server is connected** in Cowork (tools
  `mcp__ca3628d6…__*`): `search_components`, `get_component_api` (returns
  whenToUse / alternatives / knownGaps), `get_tokens`, `get_composition_recipe`,
  `get_component_accessibility`, `search_icons`, `validate_usage`, `health`.
  The `sidebar` component is import path `@brightlocal/ui-components/sidebar`.
- Known drift/gotchas (see `BYODS-BRIGHTLOCAL-PLAN.md` for the full list):
  - Published 2.20.0 vs Storybook differ in places (e.g. AccountDropdown —
    Storybook shows only a bare "logout")
  - Story-file-LOCAL helper components aren't recoverable from Storybook;
    reconstruct from rendered DOM via their `data-slot` marks if needed
  - `SidebarDrawer` deprecated → use `SidebarTrigger`; `embedded` prop
    deprecated (inline desktop / Sheet mobile is now automatic)

## Agreed plan

1. ~~Re-harvest from Storybook~~ — SKIPPED, harvest is fresh.
2. **MCP ↔ sidecar diff**: pull `get_component_api` / accessibility / tokens
   for `sidebar` from the DS MCP and reconcile against
   `registries/brightlocal/sidecars/sidebar.md`; update frontmatter where the
   MCP is more current. Regen with
   `pnpm -F @gradeui/studio generate:registry-sidecars brightlocal`.
3. **Studio proposal project**: with the BrightLocal registry active, create a
   project whose screens are side-nav variants (grouping, collapsible
   sections, SidebarSwitcher, inbox items, account dropdown, collapsed rail).
   Seed screens from `page-skeleton.jsx` / `location-dashboard.jsx` +
   `blocks-sidebar--default.jsx`.
4. Iterate variants with Ali; the project doubles as the shareable proposal.

## MCP server: registry-aware validation (shipped 2026-07-15, needs restart)

`save_screen` used to validate ALL JSX against gradeui's
COMPONENT_CONTRACTS — BrightLocal screens failed on name collisions
(<Sidebar dataHook>, <Card variant="filled">…). Fixed:

- `apps/mcp-server/src/registry-contracts.ts` (new) — transport-side twin
  of `apps/docs/lib/registry-contracts.ts`: resolves contracts through the
  project's registry (brightlocal → BRIGHTLOCAL_CONTRACTS converted
  spec→zod; gradeui → package contracts; other → empty map).
- `assertProject` (designs.ts) now returns `{ registryId }` from the
  project row.
- `save_screen` (tools.ts) validates against the project registry's
  contracts and names the registry in the violation message.

NOT yet registry-aware: `create_screen` / `list_components` refs (still
gradeui playbook). Known gap, fine for now — author BrightLocal JSX from
the registry assets in this repo instead.

The dev MCP server runs `tsx src/index.ts` (no watch) — **restart the
gradeui-dev MCP server** to pick the fix up.

## Working target

- Studio project: **"Brightlocal - DS"** — id `8df61b83-5f54-4e63-8762-cbb58c44be06`
  (brightlocal registry; screens import from `@brightlocal/ui-components` +
  `@brightlocal/icons`).
- First screen brief: SidebarSwitcher at top (account switching, popover
  via SidebarPopoverMenu items {label, icon, shortcut}), sections as
  SidebarMenuCollapsible with SidebarMenuCollapsibleContent
  variant={SidebarMenuSubVariant.BORDER} sub-items; footer
  SidebarAccountDropdown. JSX drafted in-session, pending save after MCP
  restart.

## Layout composability (2026-07-15)

- AUDIT FINDING (logged in `rules/90-audit.md`): GlobalLayout bakes
  `p-section-sm` as a string literal (no cn merge) and ScrollArea bakes
  `p-1` on its viewport — not prop-overridable; blocks sticky headers /
  edge-locked sidebars. NOTE: the live platform DOES ship this padding
  (Ali verified) — removing it is a proposal-level deviation from live,
  not package/live drift.
- `AppLayoutShell` — in-file layout component (screens are self-contained
  single-file JSX; local imports don't resolve in the sandbox, so it's
  defined per-screen and codified as a recipe for generation retrieval):
  `registries/brightlocal/recipes/app-layout-shell.jsx`. Props: flush
  (cancels the padding via arbitrary variants), stickyHeader,
  pinnedSidebar, sidebarTone (default|dark|brand — pure --sidebar-* CSS
  var swaps). The sidebar-switcher template now composes with it via a
  LAYOUT knobs object.
- The earlier custom.css padding patch is now optional — flush handles it
  per-screen with classes.

## Known gaps (gradeui side, hit during this work)

- MCP server `save_screen` now registry-aware (fixed; NOTE: the server
  runs BUILT dist — contract/registry changes need
  `pnpm -F @gradeui/mcp-server build` + MCP restart).
- `generate-brightlocal-contracts.mjs` forces subcomponent-prefixed
  props optional+plumbing (was: SidebarAccountDropdown's email etc.
  REQUIRED on <Sidebar>, blocking valid saves).
- Studio source mutator: sourceId hits are rejected when the tag name ≠
  selected component (user-land wrapper components like AppLayoutShell
  were silently no-oping inspector edits).
- STILL OPEN: `/e/[token]` embed route (and thus MCP preview_screen /
  preview_image) is NOT registry-aware — BrightLocal screens fail with
  "generated code couldn't run". Render via Studio instead. Fix = give
  the embed route the same external-sandbox path the share view uses
  (share view already fetches project registry_id server-side and mounts
  ExternalIframeHost when external — embed-screen.tsx needs the same
  branch at its two FastIframeHost callsites, /e/[token]/page.tsx needs
  the registry_id fetch; ?flat=1 capture path needs thought).
- STILL OPEN: mcp-server bundles BRIGHTLOCAL_CONTRACTS at build time —
  every sidecar/contract iteration costs `pnpm -F @gradeui/mcp-server
  build` + MCP restart (hit 3× in one session). Fix idea: in dev, re-read
  the generated contracts from disk per request so sidecar changes are
  live immediately.

## The design thesis that fell out of this work

Three tiers of "hardcoded" in BL's DS, and the riff cost scales with
them: TOKENIZED values (--sidebar-* colors) riff as a one-object
variable swap; CLASS values behind cn() (header pb-9, separator
spacing) riff as a className override; LITERAL values with no merge
(GlobalLayout p-section-sm, viewport p-1) need structural workarounds.
Upstream recommendation: run every literal through cn(), and promote
product-variable values (header rhythm, nav density, sidebar frame) to
component-level tokens. AppLayoutShell is the demo of what that buys.

## Polish round (2026-07-15, late) — the alignment spec

The template now encodes a deliberate spec: a 32px left alignment line
(logo, switcher trigger via -ml-1.5 keeping its hover-pill padding,
group label via pl-6, nav icons natively, footer via px-2 matching the
groups' p-2 — the DS's footer default p-1 sat 4px off), consistent
chevrons (switcher's hardcoded ChevronDown-16-opacity-50 retuned to the
collapsibles' 12/full via [&>svg:last-child] on triggerClassName),
header pb-3 vs the DS's hardcoded pb-9, tone-aware dividers everywhere
(incl. SidebarFooter's built-in one via descendant variants), and a
page header from the new recipes/page-header-with-breadcrumbs.jsx
(breadcrumb trail, no avatar; NO PageHeader component exists in the DS
— the page header is a composition, hence recipe status + an upstream
"should be a component" note). mobileBar is a shell slot so the
hamburger bar sits above the page header below lg.

## Variant set (2026-07-15, end of session)

Three sibling screens in "Brightlocal - DS", identical except knobs:
- "Sidebar — Brand (floating)" — dmrlzc8nnp1tg (tone brand, floating)
- "Sidebar — Subtle (floating)" — dmrm5z3k05aec (NEW `subtle` tone:
  neutral-100 bg / neutral-600 fg — the grey/green light version; tone
  set as the shell's DEFAULT param because the mcp-server's bundled
  enum predates "subtle"; after next rebuild pass sidebarTone="subtle"
  normally)
- "Sidebar — Default + Border (flush)" — dmrm60jmqkk2p (no tone,
  edge-pinned, 1px var(--sidebar-border))
Also: header gap-3 (logo↔switcher air). Note: the contract validator
DOES evaluate literal expressions ({"subtle"} was caught as
invalid-enum) — its "can't evaluate expressions" doc is conservative.

## Footer restructure (2026-07-15, last round)

- FINDING: SidebarFooter PORTALS into the content scroll area
  (SidebarContent's mt-auto target) — it CANNOT be pinned; with an
  overflowing nav it scrolls away. Stuck footer = plain sibling of the
  scroll area (shrink-0 border-t). Upstream: non-portalling option.
- New bottom block (Brand screen + template): full-width SidebarSwitcher
  row + SidebarAccountDropdown with a Chip in the `email` slot ("Trial —
  14 days left") — the dist renders email as span children so it takes
  an entity; upstream: rename to typed `meta` ReactNode slot. "Billing &
  plan" added to menu. Header is logo-only; nav scrolls between pinned
  header/footer. Sub-rail: ml-8 (on-scale) + items-stretch + w-full rows.
  Header owns pt-6 pb-4 sticky-or-not.
- Subtle + Bordered sibling screens still carry the previous footer
  layout — propagate on request.

## New IA (2026-07-15, from Ali's tree) — OPEN QUESTION with Harry (UX)

The Brand screen + template now render the full new IA: AI Insights /
Set-up Tasks / Location Profile (→ Core Information → 10 leaves) /
Rankings (active; → Settings → 4 leaves) / Local Search Grid / Citations
/ Reviews / GBP Manager / Website SEO / Google Analytics / Agency Tools
· All Locations · footer: Acme switcher (no trigger icon) + Joe Bloggs
(Chip: "Trial — 14 days left"; menu: Account/Billing/Addons/Support/
Logout). `paid: true` renders a $ mark. Nav supports THREE levels via
recursive SubRows (nested SidebarMenuCollapsible, trigger restyled to
sub rhythm).

OPEN: whether level 3 belongs in the sidebar at all — Ali to discuss
with Harry. Alternatives on the table: page-header tabs for level 3
(fits the queued composable PageHeader spec), flyout panels, or a
secondary contextual rail. The live product uses header tabs today.

## Layer system (2026-07-15, final) — tones × frames × page layers

Three orthogonal preset axes on AppLayoutShell, all pure token swaps:
- sidebarTone: default | white (NEW) | subtle | dark | brand
- sidebarFrame: flush (default border-r var(--sidebar-border) — pinned
  navs need a containing edge, ref Claude UI) | floating
- pageLayers: default | tinted (canvas neutral-100 #f2f7f3 — the ramp
  is green-tinted; cards → base-white; muted → neutral-50; vars +
  canvas paint ride GlobalLayout's rest-spread onto its inner div)
Their neutral-50 = #fcfdfc and IS the default page bg, so "tinted" is
one ramp step down with white cards lifted.
Current screen state: "Sidebar — White + Border on Tinted"
(white/flush/tinted via shell defaults for the two new enum values —
normalize to plain props after next mcp-server rebuild). Also this
round: nav truncation banned (whitespace-normal! + h-auto; audit'd:
truncate + pr-10 are baked into the DS's nav primitives), 16+16 inset
split for the 32px line, rail ml-6.

## Next up (from Ali, queued)

- PAGE HEADER needs real rules: a composable recipe/component spec with
  slots — breadcrumbs, title, subtitle, right-hand actions — plus its
  OWN padding so it renders identically sticky or not (today the sticky
  variant adds py-3/border-b and the non-sticky has none). Upstream: a
  PageHeader component should exist.
- Embed registry-awareness (/e/[token]) — scoped above.
- mcp-server dev-mode contract reload — scoped above.

## Status log

- 2026-07-15 — File created. MCP registry-validation fix written; awaiting
  server restart, then save the switcher+submenus screen and preview.
- 2026-07-15 (final round) — AppLayoutShell knob set now: flush,
  stickyHeader, pinnedSidebar (true edge-pin: also kills GlobalLayout's
  container max-width; content column still self-caps at breakpoint-lg,
  adjustable via contentMaxWidth), sidebarTone (+ mobileTone toggle —
  scoped <style> reaches the portalled mobile Sheet), sidebarPadding /
  sidebarMargin / sidebarRadius (desktop-only frame; floating-panel
  look). Template also: tone-aware separators (Separator paints the PAGE
  border token by default — harsh in a toned sidebar; it IS a native
  <hr> but fully styled, so className bg-sidebar-border is the whole
  fix) and token-pinned AvatarFallbacks. Contracts/sidecars regen'd;
  mcp-server rebuilt; screen saved with brand tone + 8px vertical
  sidebar padding.
- 2026-07-15 (later) — Screen "Sidebar — Switcher + Layout Options"
  (dmrlzc8nnp1tg) saved via MCP after rebuild; renders correctly in
  Studio (brand tone bg painted, sticky header, pinned rail). External
  sandbox hardened: recharts/canvas-confetti now best-effort with a
  lazy-throwing fallback (an esm.sh flake on recharts was killing
  non-chart screens).
- 2026-07-15 — Sidebar authored as a REGISTRY TEMPLATE (durable home, per
  Ali: must survive regen/harvest runs):
  `registries/brightlocal/templates/sidebar-switcher.jsx`, compiled into
  `templates.generated.ts` (now 5 templates). Harvest scripts only rewrite
  blocks/ + sidecar bodies, so templates/ is safe. Still pending: save the
  same JSX as a screen in "Brightlocal - DS" for live preview (needs the
  MCP server restart first).

## Inspector correctness pass (16 Jul 2026)

- **Slot aliases** — `global-layout.js` breaks BL's "data-slot = component name" convention (shortened slots, verified in 2.20.0 dist). Added `selection.partAliases` to the registry contract (`types.ts` + `brightlocal.ts`) and threaded it through the external sandbox's resolver: `sidebar-container→GlobalLayoutSidebar`, `content-wrapper→GlobalLayoutContent`, `content-header/body/actions→GlobalLayoutContent*`, `mobile-header→GlobalLayoutMobileHeader`, `global-container→GlobalLayout`. Clicking the sidebar aside now resolves to a REAL source tag, so className/prop writes pass the mutator's tag guard instead of no-opping.
- **Subcomponent contracts** — the panel looks contracts up by clicked name (`BreadcrumbLink`), but sidecars folded sub props onto the root with a name prefix → parts showed no props. `generate-brightlocal-contracts.mjs` now splits them back out: +292 contracts (all props optional — panel-driving, never save-blocking). Clicking a breadcrumb link now shows `href`/`asChild`.
- **Needs**: docs dev-server picks these up on reload; the MCP server needs `pnpm -F @gradeui/mcp-server build` + restart to validate with the new contracts (existing screens unaffected — all new props optional).

## OPEN — registry-centric token layer (fill picker / TokenField)

The inspector's PROP layer is registry-aware (contracts); the STYLE layer is not — the Fill picker and TokenField offer gradeui tokens even on BrightLocal projects. Needed: the registry seam described in STUDIO-FILLS/STUDIO-TOKENFIELD feeding BL's `--ds-*` palette (and its Tailwind class vocabulary) into the token picker + className editing. Until then, BL styling edits via the panel should use the className field with BL-valid classes.

## QUEUED — share-link OG images via Playwright capture of the embed

Problem: /s/<token> generateMetadata sets title only; scrapers fall back
to the gradeui OG image — an advert on a client share.

Design (agreed 16 Jul, Ali: capture the EMBED, not the share view — the
share view carries chrome):
1. DONE (16 Jul): /e/[token] is registry-aware — page fetches
   projects.registry_id, EmbedScreen takes registryId and branches both
   FastIframeHost callsites to ExternalIframeHost (share-view pattern);
   external embeds stamp data-grade-ready on a display:contents wrapper
   (0/1/error via ext:rendered / ext:error) so the capture loop waits
   for the REAL render, not the esm.sh loading status; external ?flat=1
   falls through to the live embed (FlatScreen compiles against gradeui
   vocabulary — capture seam is STUDIO-CAPTURE work). Unblocks MCP
   preview_screen / mobile previews for BL screens.
2. Capture at SHARE TIME, not scrape time (scrapers allow ~2s; chromium
   cold-start + DS module boot won't make it): on share-link create (and
   on revision change), run the existing serverless Playwright pipeline
   (apps/mcp-server/src/preview-serverless.ts — playwright-core +
   @sparticuz/chromium-min, Chromium 147 lockstep) against /e/<token>,
   1200x630, store PNG in Supabase Storage.
3. generateMetadata: openGraph.images → stored capture, fallback to the
   default OG only when no capture exists.
Note: third consumer of the STUDIO-CAPTURE primitive (posters, exports,
now OG).

## QUEUED — inspector "Attributes" section (attribute adder)

Ali (16 Jul): a generic add/edit-attribute control in the properties
panel — first use case: stamping data-grade-goto="<screen>" on a
selected element without the code view. Shape: an Attributes section in
selection-inspector listing existing data-*/aria-* attrs with add/remove;
writes via the source mutator (same literal-attr path as className);
value field for goto should offer the project screen names as options.
Pairs with STUDIO-FLOWS F1/F2.

## QUEUED — STUDIO-FLOWS F1 (Ali: instant linkage + view transitions)

1. PRECOMPILE flow targets: on share/embed load, idle-compile every
   goto-referenced sibling (sucrase output cached per screen id) so a
   navigation swap is paint-only. "I want instant linkage."
2. Cross-fade on swap (double-buffer: hold old screen until new one
   stamps rendered, 200ms fade), then View Transitions API inside the
   sandbox document for element-level morphs (match by data-hook).
3. Browser history: pushState + popstate with ?screen=<id> so the
   browser Back button works and flow positions deep-link.
4. Comment-thread swap on navigation (TODO F1 in shared-screen.tsx).
Also queued: promote the AppLayoutShell scaffold as the default hub-page
example in the agent harness (retrieval already carries the recipe;
system-prompt stitching should PIN it for hub/dashboard asks).
Clobber guard shipped in supabase-adapter saveProject (bulk upsert now
version-filtered per design).

