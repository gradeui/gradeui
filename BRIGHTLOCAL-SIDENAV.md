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

- STUDIO external-mount pinch parity: the share view's external zoom is
  now pointer-anchored (session machinery, 16 Jul); Studio's
  ExternalDsMount still does plain centre zoomBy with no anchor/counter-
  translate — feels shonky by contrast. Give it the FocusedFastMount
  treatment (anchor from ext:zoom-gesture coords, camera counter-
  translate). Also queued: tags T1 (group-by/filter rail views —
  STUDIO-TAGS.md; T0 substrate + inspector editor shipped f60db6b).

- PAGE HEADER needs real rules: a composable recipe/component spec with
  slots — breadcrumbs, title, subtitle, right-hand actions — plus its
  OWN padding so it renders identically sticky or not (today the sticky
  variant adds py-3/border-b and the non-sticky has none). Upstream: a
  PageHeader component should exist.
- Embed registry-awareness (/e/[token]) — scoped above.
- mcp-server dev-mode contract reload — scoped above.

## DESIGN NOTE (18 Jul, ~4am) — where does a viewer's comment LIVE?

Decided tonight (shipped in the viewer-pin route): comments stay
ATTACHED TO SCREENS — share-attached comments would fragment feedback
per link (three links to one screen = three conversations that can't
see each other; re-minting orphans feedback). The pin sits ON the
element, so the metaphor holds ("I commented on this button", like a
Doc comment lives on the sentence, not the sharing email).

The share becomes PROVENANCE, not ownership: the pin route knows the
token — one additive column (comment_threads.share_token or a detail
on the audit event) records which link collected the feedback,
filterable in Studio later ("what did the Friday link say?").

OPEN (Ali's bag of snakes — decide at the F2 comments pass, not now):
- FLOW/SHARE-LEVEL comments — "this journey feels long" has no element
  home. A distinct comment KIND (no anchor, panel not pin), visible in
  the share/flow context it was made in. Maybe surfaced per Ali as a
  setting: "flow-level comments" vs "screen-level comments".
- Whether flow-made pins should default to visible-only-in-flows
  (Ali's instinct) — provenance filtering may give this for free
  without a second attachment model (a VIEW over provenance, same
  trick as tags: one storage, many lenses).

## NEXT SESSION (REFRESHED 18 Jul ~3am, after the late-night burst)

### DAYTIME 18 Jul (nav model v2 → pages) — SHIPPED, don't re-do
- Nav model v2 (25): top-level rows NAVIGATE (no accordions/chevrons),
  subs contextual (visible only inside their section), max 1 sub level.
  Rules in rules/15; blank starter at templates/hub-blank.jsx.
- Module SPLIT (335f3b1): proposal.jsx is now a BARREL over
  proposal-data / proposal-shell / proposal-nav / proposal-page.
- 11 top-level LANDINGS live (scripts/create-landing-pages.mjs),
  tagged section:"Top-Level Pages"; DEFAULT navLinks in proposal-data
  wire every top-level row (+ rankings-table). "Your Locations" →
  "All Locations" everywhere.
- ALL LOCATIONS page live (86e157f + scripts/build-all-locations.mjs):
  LocationCard/LocationCardSkeleton in proposal-page, data.locations
  (7 dirty-data demo entries) in proposal-data, search + Card/Table
  toggle + CONDITIONAL pagination (renders only >1 page — deliberate
  deviation from the live product). Cards goto "Location Hub - New
  Template".
- BREADCRUMBS: separators interleaved + all crumbs linked (cbbd46a);
  crumb `{ bind: "location" }` resolves the REAL location name from
  data at render (86e157f) — landings + hubs rewired in DB. HARNESS
  INVARIANT (Ali, after separators went missing twice): separators
  === crumbs - 1, asserted in create-ai-insights-pages.mjs; copy that
  check into every future screen-builder script.
- AI INSIGHTS subs (45806a2 + scripts/create-ai-insights-pages.mjs):
  five placeholders "AI Insights - <label>", tagged
  section:"AI Insights"; DEFAULT navLinks wire the sub rows. NOTE the
  AI Insights LANDING was retagged section:"AI Insights" per Ali's
  instruction — section is single-cardinality, so it LEFT the
  Top-Level Pages group (flagged to him; swap back if grouping looks
  wrong).
- HARNESS LEARNING: React 19 SSR emits a <link rel="preload"> per
  <img> — count `<img` tags, not URL occurrences.
- SCREEN_VT OFF (Ali): goto swaps are instant — the const in
  external-sandbox render() flips it back. Mode-flip fade kept.
- OPEN BUG (parked, Ali will repro): pinch/ctrl+wheel zoom on shares
  is FLAKY — sometimes works. Note for the debug session: the zoom
  forwarder coalesces via requestAnimationFrame (external-sandbox
  onWheel); if the sandbox doc's rAF stalls (hidden tab, wedged VT,
  heavy main thread) the pending zoomRaf swallows every later gesture
  while still preventDefault-ing — "dead zoom" symptom. Consider
  posting immediately (no rAF) or a setTimeout fallback.
- NEXT: Ali picks real datasets (has a BL login) → populate AI
  Insights + section landings with linked-data content.


Ali's day: daily meeting from tag shares (Friday link live + unfurling
— see Slack-cache note below), then SCREEN BUILDING on the BrightLocal
product: rules, linked-data content, screens. Before MCP-driven screen
work: restart the gradeui-dev MCP once (dist current: saveScreen merge
fix + latest contracts).

SHIPPED AFTER THE ORIGINAL BOARD (late 17 Jul → 3am 18 Jul), so
don't re-do: tag manager dialog (rename value/type, delete-everywhere,
counts — e88aa14) + SHARE-A-TAG from any manager value row (the
universal entry: flow tags/labels had NO ui path — 5b6ab87) + stable
URL recall on tag shares ("Existing link", 0479a86); exclude filters
(chip click flips include⇄exclude — c86d650); rich list rows with lazy
LIVE thumbnails (e88aa14); milestone-tags pattern doc'd (STUDIO-TAGS);
OG cover sheet (Poppins, real BL mark, live re-render, count-free
Screens pill) + twitter card fix (a37892e — the page metadata was
CLOBBERING the root summary_large_image); dark-mode trifecta:
tone-aware scrollbars (color-scheme islands), smooth light⇄dark VT
fade (host + sandbox), subpixel white sliver killed at BOTH layers
(document bg + iframe box, 1f05c41 + 41b04e0); persistent nav across
gotos (view-transition-name gds-sidebar/gds-page-header — 1ee8e0f);
keyless-keydown crash guard (a9be65c); Design.description SEAM.

LEARNED: Slack caches unfurls per exact URL ~indefinitely — URLs
pasted before a metadata deploy keep the stale card; append ?x=1 to
force a re-scrape. New shares unfurl correctly first time.

SHIPPED IN THE 4AM BURST (the viewer-interaction stack — Ali: "all the
other tools have it, so it has to be in here"):
- Multiview comment pins (cbea555): /s fetches threads for ALL scoped
  members; per-pane overlays (ref map), pins follow pane-local
  navigation; single view scoped to entryThreads.
- Sign-in-and-return (cbea555): reply drawer's unsigned state links
  /sign-in?next=<share path> — Google OAuth round-trips back to the
  exact URL. Identity only; shares stay token-scoped.
- VIEWER PIN CREATION (7afaa1d): New Pin chrome button → sandbox
  selection agent pick (single view or focused pane) → composer →
  POST /api/shares/[token]/comments — server route validates signed-in
  user + live token + scope membership, writes with service role
  (comment_threads RLS rightly refuses outsiders client-side).
  Optimistic pin + local author cache. anchorSourceId fallback
  (272153a) means pins land on module components everywhere.
- PROVENANCE + STAY-IN-FLOW (af53d6c, 61affb5): comment_threads.
  share_token (migration 0024, APPLIED) stamps the link a thread was
  collected through; the share view fetches Studio-authored (null)
  + own-token threads only — one client's flow feedback never leaks
  into another's. Studio sees all. Design note above has the full
  reasoning (screen-attached home, share as lens).
- Also: comments-on-module-internals (be355b5 + 272153a), keyless
  keydown crash (a9be65c), unfurl card fix (a37892e), dark sliver
  killed both layers (1f05c41 + 41b04e0), sidebar scrollbar
  gutter/thin/tone-aware + overrideable via --gds-sidebar-scrollbar,
  mode-flip VT fade, persistent-nav view-transition-names (1ee8e0f).
MIGRATIONS APPLIED: 0022, 0023, 0024. Untested by Ali (5h sleep won):
viewer pin end-to-end on live; first OUTSIDE commenter will confirm
the users-row-on-signup assumption.
NEW OPEN from the burst: F2 comments display (provenance badge +
"collected via <link>" filter in Studio; flow-level no-anchor comments
— design note above); per-row pin precision inside module components
(needs lib-internal ids — registry-editor territory); viewer pin
UX polish (pin-mode cursor/hint, composer placement near click).

The board, in rough order of value:

1. **Jumpy menu** (UNDIAGNOSED — need Ali's repro: which menu, what
   action, dark tone only?).
2. **Screen description UI** — seam shipped; needs the textarea row in
   StageBScreenInfo (same wiring as status/tags), the detail line in
   the rich rows, maybe the share cover.
3. **Compare-row polish pass** (#22) — NOTE: viewer Arrange
   (group-by) is BENCHED behind ARRANGE_ENABLED=false in shared-screen
   (Ali: "half baked"); machinery stays live, re-enable + polish here.
4. **Transitions next notch** — active-row SLIDE between screens
   (view-transition-name on the active nav row; unmatched degrades to
   fades); Fast Frame parity (goto fade + mode fade + names);
   host-driven swap fades (Back chip).
5. **Chrome-hide + capture trio** (#21): a proper "open clean" mode —
   hide ALL share chrome with an obvious way back (Esc + floating
   chip); seed exists (shared-screen chromeVisible toggle). Browser
   Fullscreen API optional garnish ("worth playing with"), not the
   essence. Per-pane variant via embed ?screen= param —
   the same key that unlocks per-pane screenshot + Download/COPY PNG
   (ClipboardItem), OG v2 moody corner, poster thumbs. One serverless
   capture route unlocks all (preview-serverless.ts).
6. **Share toolbar + version dropdown design block** (#11) — incl. the
   milestone worms (per-member revision pinning on scoped shares).
7. **Tag registry T2 leftovers** — projects.tag_defs storage
   (descriptions, strict, milestone semantics), rename propagation
   into share scopes, per-value colours.
8. **Screen-info panel restyle** (#16).
9. **Infra**: mcp-server dev-mode contract reload, apps/mcp-server in
   the CI build filter.

## Status log

- 2026-07-17 (close) — **Session sealed, ready to ship.** Everything
  committed through cbe8afb (viewer-side Arrange/group-by in the
  compare row — member tags now ride the share payload). Ali's plan:
  tomorrow is SCREEN-MAKING for the BrightLocal product only; the
  sharing/tweaks toolkit is considered feature-complete for that work:
  - SHARE: tag shares (LIVE membership — tag a new screen, it appears
    in the link) + selection shares (frozen sets); compare row with
    focus/dim, pane-local goto + cross-fade, scope dropdown, zoom-out,
    Arrange by member facets. Test links: /s/2da2464c… (flow),
    /s/82f94612… (hub A/B).
  - TWEAKS: authored props = permanent + travel; tweaker={false} =
    locked variants; Alt+T = session-only, PER SHELL (dataHook-keyed),
    reload → authored; toolbar Reset clears all stashes.
  - REMEMBER before MCP-driven screen work: restart the gradeui-dev
    MCP once (picks up the saveScreen state-MERGE fix — without it a
    save via MCP clobbers state.tags — plus current contracts).
  - Next session's board: spacebar-pan forwarding (diagnosed),
    per-pane full-screen, stable URL per tag, PageHeader mobile,
    list rich rows, panel restyle.

- 2026-07-17 (later) — **Compare row: scoped shares are multiview**
  (Ali: "the screens sit SIDE by SIDE… as many iframes as needed"):
  - Scoped shares open as N live panes in a row — ONE wide artboard to
    the camera (resolveDeviceSize returns row dims; Fit/zoom/pan/pinch
    unchanged). Opens in Fit. 21ff723 → 0875100.
  - Tap a pane → camera glides to it IN PLACE, siblings dim
    (opacity-70 + saturate-0 static, hover restores opacity only —
    scale/filter hover re-rastered iframes, the jerky hover). Esc /
    "← All screens" / chrome zoom-out return to the fitted row. Scope
    name in the breadcrumb = member dropdown (glide to any pane).
  - Pane-local goto: links inside a focused pane swap THAT pane
    (per-pane stack + back chip); the row never collapses. Targets
    resolve within scoped members only. F1 cross-fade rides per pane.
  - Tag rename shipped (group-header pencil, bulk rewrite; shares
    scoped to the old value do NOT follow yet — T2 registry). Tag
    display is ALWAYS the human string as typed. Duplicates inherit
    tags except flow (live share membership = leak risk).
  - Per-shell tweak stash (keyed by dataHook — sessionStorage is
    tab-wide across same-origin iframes, one pane's tweaks painted
    all) + share-toolbar "Reset tweaks" (clears stash keys, reloads).
  - Test shares live: /s/2da2464c… (flow, 3 panes, renamed tag),
    /s/82f94612… (hub A/B explicit set).
  - QUEUED from the demo pass: per-pane open-full-screen (needs embed
    ?screen= param or on-demand single share — pair with F1 pushState),
    stable URL per tag (mint-once), viewer-side facet switcher for
    multi-tag scopes, share full-screen toggle.

- 2026-07-17 — **Rename shipped + tags T1 + T2 share slice + F1
  cross-fade** (one session):
  - Nav-id rename DONE (see the DONE block above): repo 7928474, DB
    via scripts/rename-nav-ids-supabase.mjs, harness-verified.
  - mcp-server saveScreen state-clobber FIXED (fa9796c — merges over
    existing designs.state; was dropping state.tags). Server rebuilt;
    **needs the usual MCP restart**.
  - Tags T1 SHIPPED (33dec48 + f9a35a5): list view / group-by /
    filters / bulk tag / datalist autocomplete / chart-ramp colours;
    view prefs in projects.view_prefs (migration 0022, APPLIED) +
    localStorage mirror.
  - T2 first slice SHIPPED (50878b1): share_links.scope (migration
    0023, APPLIED) — share a tag (live membership) or an explicit
    screen set; /s + /e scope their flow maps; mint from group header
    / multi-select. Queued next: scope.tags sets + viewer-side facet
    switcher + named presets-as-tag-groups (STUDIO-TAGS "Tag groups").
  - STUDIO-FLOWS F1 cross-fade SHIPPED (e72c57d): View Transitions on
    goto swaps in the external sandbox (flushSync commit, 200ms fade,
    slide variants via data-grade-transition, reduced-motion safe).
    Queued: host-driven swaps (Back/flow bar) + Fast Frame parity.
  - Tweaker lock DOCUMENTED (sidecar + rules/15): tweaker={false} +
    hard-set props = locked A/B variant screens; dataset pinning.
  - Live screens tagged (section/status/flow) as T1 seed data.
  - STILL QUEUED from today: share-chrome tag surface + per-screen
    toolbar/version dropdown (design block), spacebar-pan on share
    with live screens (diagnosis in task: iframe swallows keydown —
    forward Space as messages from both sandboxes), PageHeader mobile
    + Keyword Rankings card-header responsive fix (flex-row hardcoded),
    screen-info panel restyle, list-view rich rows (posters).

- 2026-07-16 (night) — **Proposal module joins the sidecar pattern**
  (Ali: "our single proposal.jsx circumvents the platform/studio
  pattern" — correct, fixed):
  - Sidecars for every module export: app-layout-shell.md REWRITTEN
    (import "@brightlocal/proposal", not copy-from-recipes; + dataset
    prop), NEW proposal-sidebar.md, page-header.md, hub-stat-card.md,
    hub-hero-card.md, proposal-data.md (provider + hook + shape
    convention + don't-starve rule). 74 sidecars → 366 contract specs;
    Studio retrieval/refs + inspector panels now cover the module.
  - **Baked active flags removed from PROPOSAL_SECTIONS** — activeId is
    the only active mechanism (a screen without it highlights nothing;
    the bug: every proposal screen showed Rankings Table active). Old
    in-file Location Hub screen patched in-project (flags stripped).
  - mcp-server REBUILT with current contracts (white/subtle tones,
    proposal components, externalImports incl. @brightlocal/proposal) —
    **needs the MCP restart**, then create_screen/save_screen accept
    module imports and validate against current enums. STILL OPEN:
    create_screen/list_components REFS remain gradeui-playbook (the
    known registry-awareness gap) — the STUDIO chat harness is the one
    that leans proposal (rules/15 + sidecars); MCP-driven agents get
    validation but should read the registry assets for guidance.
  - In-project (Brightlocal Vision - Share): "Rankings Table" screen
    created (dmrnyiy9g9f7o — stat row, filters, keyword table bound to
    data.keywords, View Grid goto→LSG); navLinks wired across all
    proposal screens (keyword rows → LSG, rk-table → Rankings Table);
    hub-new-template refreshed from template; sticky-header z-30 fix
    (shell beats page z — the LSG map nodes screenshot).

- 2026-07-16 (latest) — **Active nav row + per-project nav links**
  (Ali: "set a navigation item to true for a page" + goto links that
  are stable per project but editable):
  - `<ProposalSidebar activeId="lp-hours" />` — the per-screen "which
    page is this" knob: the row highlights AND every collapsible on its
    trail opens (subtreeHas walks the tree). Overrides the IA's baked
    flags; an id matching nothing (hub landing) renders all-collapsed.
  - `data.navLinks` — row id → screen name (or { goto, transition }),
    applied by buildProposalSections: nav flow wiring is per-project
    DATA, never forked sections. hub-page.jsx demonstrates both
    (PROJECT_DATA const + activeId="location-hub").
  - ProposalDataProvider now merges over its PARENT context, so
    providers STACK — the tweaker's dataset switch keeps the screen
    provider's navLinks. Location Profile flagged as the main data
    stream; its area section lands in the JSON as screens are built.
  - rules/15 updated (always set activeId; wire flows via navLinks).
    Harness-verified: leaf highlight + trail, template navLink stamps,
    provider stacking under a dataset switch.

- 2026-07-16 (late evening) — **Named datasets + data binding** (Ali +
  Harry's "switch the data" request, extended live in-session):
  - Raw JSON datasets at `registries/brightlocal/lib/data/<name>.json`
    (harbour-co, northside-dental) — PARTIAL patches deep-merged over
    PROPOSAL_DATA; arrays (keywords) replace wholesale. Folded by
    generate-registry-lib.mjs into a second lib module
    `@brightlocal/data` (lib-to-lib requires work; Sandpack lib files
    get the same import aliasing).
  - Merge order: defaults → dataset → data prop.
    `<ProposalDataProvider dataset="…">`, or authored on the shell:
    `<AppLayoutShell dataset="…">` (wraps in a nested provider, beats
    any outer one — deliberate for demos). ShellTweakerPanel gained a
    **Data row** — Alt+T flips the whole interface between clients
    live, session-only.
  - Data binding at render position (so tweaker switches reach
    everything): HubStatCard `metricKey`, PageHeader default meta =
    current location, ProposalSidebar keyword rows from data.keywords
    (buildProposalSections). hub-page.jsx is now fully bound — zero
    hardcoded metrics.
  - `aiInsights` seeded as its own data section ({ summary, items:
    [{id, area, severity, title, action}] }) — the headline featureset;
    shape to be refined against real product output (the JSON is the
    contract). Per-area convention: each product area gets its own
    top-level key; data shape stays SEPARATE from nav structure.
  - rules/15-proposal-module.md: datasets, binding, per-area
    convention, and a "don't starve the page" rule (seam = shared
    identity/area data; page-specific tables/charts stay invented
    in-page; never render sparse because the seam lacks a key).
  - Verified via the sandbox-pipeline harness against the GENERATED
    module strings: lib-to-lib require, dataset switch (provider +
    shell prop), keyword nav, metricKey binding, goto stamps. docs +
    studio tsc clean.

- 2026-07-16 (evening) — STUDIO-FLOWS **F1 precompile** + **@brightlocal/
  proposal M0** built (see the BUILT block above for the file map).
  F1: external sandbox owns a bounded FIFO compile cache (FNV-1a keyed
  on the exact pushed source, ids included); ext:precompile queues flow
  siblings and idle-compiles them AFTER the current screen's
  ext:rendered; render() reads the cache first, so goto swaps (and
  Back) skip sucrase. Host: `precompileSources?: string[]` on
  ExternalIframeHost (injectSourceIds-matched, re-posted on change);
  share view + embed derive it from flowScreens (2+, current excluded).
  Transitions NOT implemented yet — but the lib components already
  stamp data-grade-transition from `transition` props/nav-data fields,
  so F1's cross-fade can read them off the clicked element. Verified:
  docs + studio tsc clean for touched files (pre-existing scaffold
  .jsx errors and stale .next validator errors unrelated); lib +
  migrated template compile-and-render smoke-tested through the exact
  sandbox pipeline (sucrase CJS + stubbed require + renderToStaticMarkup)
  incl. goto stamps and data-provider deep-merge patching.

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

## SHIPPED (17 Jul) — share OG cover sheet (typographic); Playwright capture still queued for v2

`/s/[token]/opengraph-image.tsx` — next/og ImageResponse at request
time (no browser, no storage): registry wordmark (brightlocal →
"BrightLocal"), kicker with tag-accent dot (fixed hexes mirroring the
tagTypeColor hash INDEX), share title (scope tag value as typed /
screen name), member-count pill for scoped shares, project footer,
"Made with Grade". Degrades to a plain branded card on any failure.
V2 (Ali): the entry screen AS A SCREENSHOT bottom-right, "moody" —
needs the capture pipeline below (ImageResponse embeds an <img> once a
capture URL exists; same plumbing as the per-pane screenshot task).

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

1. ~~PRECOMPILE flow targets~~ — BUILT 16 Jul (see status log): compile
   cache + ext:precompile in the external sandbox, precompileSources on
   ExternalIframeHost, share + embed pass flow siblings when 2+.
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

## BUILT (M0, 16 Jul) — shared REGISTRY module: @brightlocal/proposal

Registry-scoped (NOT project-scoped — Ali runs play projects + share
projects on the same registry and needs one source of truth). SHIPPED:

- **Authoring home:** `packages/studio/registries/brightlocal/lib/proposal.jsx`
  — AppLayoutShell (+ SIDEBAR_TONES/FRAMES/SHADOWS, PAGE_LAYERS presets,
  controlled-tweaks pair `tweaks`/`onTweaksChange`), ProposalSidebar
  (SECTIONS-driven three-level nav; account/user rows resolve props →
  data context), PageHeader (breadcrumbs/title/meta/actions slots),
  HubStatCard, HubHeroCard (both take `goto`/`transition` — stamps
  data-grade-goto/-transition), ShellTweakerPanel (standalone export;
  prototype chrome, not layout), and the **proposal data seam**:
  `ProposalDataProvider` / `useProposalData` / `PROPOSAL_DATA`
  (context default IS the demo data — zero setup; partial objects
  deep-merge recursively, so `{metrics:{reviews:{metric:"4.9"}}}`
  patches one value; Harry's "switch the data and it would be magic").
- **Compile:** `scripts/generate-registry-lib.mjs` →
  `src/registry/brightlocal/lib.generated.ts` → `runtime.libModules` on
  the registry (new `RegistryRuntime.libModules` field in types.ts).
  `@brightlocal/proposal` added to `externalImports`.
- **External sandbox:** lib modules compile + register at boot, BEFORE
  ext:ready invites the first screen — makeRequire resolves the
  specifier synchronously (deviation from the blob-URL sketch, by
  design: screens are CJS-compiled, require is synchronous).
- **Sandpack parity:** same source mounts as `/brightlocal-proposal.jsx`
  in buildSandpackFiles; `rewriteRegistryLibImports` aliases the import.
  Exported sandbox = screen + one lib file.
- **Templates:** hub-page.jsx migrated — ~140 lines, just the page,
  reads metrics/location from `useProposalData()`. Other templates
  migrate on their next touch; saved screens with in-file copies keep
  working unchanged (migrate on regen — update propagation applies only
  to importing screens).
- **Generation:** new rules file `rules/15-proposal-module.md` pins the
  import as the default scaffold for hub/dashboard asks + documents the
  canonical skeleton and the "no in-file copies" rule.

Update semantics (Ali's question, confirmed): editing proposal.jsx +
regen updates EVERY screen that imports the module, on every surface
(Studio, share, embed, Sandpack) at next load. In-file-copy screens are
frozen until migrated. NOTE: mcp-server validation needs its usual
`pnpm -F @gradeui/mcp-server build` + restart to learn the new
externalImports entry before save_screen accepts the import.

Still queued from this block: comments passing through flow navigation
(thread-set swap on goto — the F1 TODO in shared-screen.tsx).

## BUG→FIXED (host overlay) — comment pins invisible on BL shares

FIXED 16 Jul (late): the share view's external branch now mounts
CanvasCommentPinsOverlay (the same host-side overlay Studio's
ExternalDsMount uses — fixed-position pins anchored via the same-origin
iframe's contentDocument, scale-aware, mounted OUTSIDE the camera's
transformed div so position:fixed stays viewport-relative). Same gating
as the fast branch: toggle on, entry screen only, faded during zoom
gestures. Same pass also fixed SHARE PINCH-ZOOM on BL screens: the
share view only listened for Fast Frame's grade:zoom-gesture
(raw deltaY + coords) and dropped the external sandbox's
ext:zoom-gesture (pre-multiplied factor) — the listener now takes both
dialects, and the external sandbox forwards anchor coords so the zoom
tracks the pointer.

STILL QUEUED: the INLINE pin channel (ext:comment-pins push, pins in
the live DOM like Fast Frame) + comments-follow-navigation (thread-set
swap on goto) — bundle as the F1 comments package. Ali's use case:
capturing notes in meetings on shared prototypes.


## DONE (16 Jul) — nav id rename: no cryptic abbreviations

SHIPPED: repo sweep in 7928474 (proposal.jsx, hub-page +
sidebar-switcher templates, rules/15, sidecars; regen + mcp-server
rebuild) + DB sweep via `scripts/rename-nav-ids-supabase.mjs` (the
rename-rds-to-gds pattern: checked-in one-off, dry-run then --write,
optimistic-concurrency guarded, patches state.appSource ONLY so
state.tags survives). 6 live screens touched, 61 replacements incl.
dataHooks the queued map missed (rk-sidebar/-page-header/-page-body/
-app-layout, lsg-sidebar/-provider/-page-header/-page-body/-app-layout).
Harness-verified (sucrase CJS + stubbed require + renderToStaticMarkup):
new activeId renders the active row + trail, OLD id matches nothing,
keyword rows are local-search-grid-keyword-N, live Rankings Table
screen renders with zero old tokens and intact goto stamps.

FOUND EN ROUTE (queued): mcp-server saveScreen replaces `state`
WHOLESALE ({appSource, status, kind}) — it would DROP state.tags (T0!)
on any tagged screen it saves. Fix: read-merge existing state. Original
map kept below for the record.

### The original queue entry

Ali (16 Jul, wrap): "it's precisely that shit where things get
shortened" — our own IA ids commit the sin we audit BL for. Rename to
full words, one pass, repo + DB together (model: the
scripts/rename-rds-to-gds.py precedent — single sweep, no migration):
  rk-positions→rankings-positions, rk-table→rankings-table,
  rk-keywords→rankings-keyword-groups, rk-competitors→
  rankings-competitors, rk-settings→rankings-settings (+ rk-general/
  rk-search/rk-advanced/rk-alerts → rankings-*), lp-*→
  location-profile-* (lp-hours→location-profile-hours etc.),
  lsg-*→local-search-grid-* (incl. generated keyword rows
  lsg-kw-N→local-search-grid-keyword-N in buildProposalSections),
  cit-*→citations-*, ai-*→ai-insights-*.
Touchpoints: PROPOSAL_SECTIONS + buildProposalSections (proposal.jsx),
templates/hub-page.jsx navLinks, rules/15, sidecars (proposal-sidebar,
stat-card examples), and the THREE live screens' activeId + navLinks
in Supabase (Brightlocal Vision - Share). Regen lib/templates/rules/
sidecars + contracts, rebuild mcp-server, verify via the harness.

## Final entries (16 Jul, session close)

- Tweak persistence hardened: sessionStorage stash (152e45d) — survives
  sandbox remounts + any number of hops; tab-scoped (fresh viewer =
  authored look). Ali confirming across many pages; if any hop drops
  the colour, note WHICH hop.
- Breadcrumbs on Rankings Table + Local Search Grid repointed (in
  Supabase) from the name "Location Hub" (the OLD in-file hub — no
  stash, authored-look always) to screen:dmrnwiqjdknxy (module hub).
  Retire the old hub when the new-template one becomes homepage.
- CodeSandbox export fixed (823ca90): chat-export-npm ships lib modules
  as src/*.jsx + aliases imports. Re-export; never "install" the fake
  package.
- Nav-id rename queued FIRST (map above): full words, no acronyms —
  incl. cit-* → citations-* ("a ct-table is a citation-table").
- Tags: T0 SHIPPED (f60db6b) — editor in right panel → Layout tab →
  screen info, `type:value` syntax. Ali testing next; T1 = rail views.
