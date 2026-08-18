---
name: PageHeader
import: "@brightlocal/proposal"
props:
  - title — Page title (an h2, sized by --gds-page-header-title-size, default 24px below sm and 30px/text-3xl from sm up — one step BELOW the DS TypographyH2, which is 36px from md up). It is the current page and never appears in the breadcrumb.
  - breadcrumbs? — Ancestor trail, MAX TWO ({label, href?}[]). Ancestors only — BreadcrumbPage is deliberately unused. `[]` (the default) renders an invisible spacer so crumb-less pages keep the row's height and nothing jumps on navigation; `false` drops the utility row ENTIRELY (and collapses `utility` into the title row). Below sm the trail collapses to the LAST crumb behind a back arrow. (default [])
  - description? — Subtitle line under the title (muted, measured). Every proposal page should carry one — BrightLocal use page descriptions often (Ali, 18 Aug), so the description row is expected furniture, not an exception. String or node. (default none)
  - lastUpdated?: string — Timestamp shown muted at the RIGHT of the status row, level with the description — the arrangement BrightLocal's replatformed header uses. Renders as "Last updated August 13, 2026" (their format: month first, no ordinal, no colon), and when the source string carries a time the DATE is dot-underlined with the full stamp ("August 13, 2026 at 10:20 AM UTC") on hover or keyboard focus. That affordance is built in — never hand-roll a tooltip on a header date. Pass "auto" to BIND data.aiInsights.lastUpdated (the AI Insights pages own it — it was removed from the AreaInsights header so it lives in ONE place); any other string renders literally; omit to hide.
  - meta? — Muted line in the status row, under the description. EXPLICIT-ONLY: omitted (or null) renders nothing; pass any node to render it. (The old data-bound NAP + status Badge default was dropped — the location already leads the breadcrumb.) (default none)
  - status?: boolean — The status row (description + meta left, "Last updated" right) is RESERVED: it renders on every page at --gds-page-header-status-height (22px) even when nothing fills it, so the header band is the same height page to page and nothing below it shifts on navigation — the same reasoning as the invisible breadcrumb spacer. The height is a FLOOR, not a clip: a screen stacking `meta` under a description still gets both lines. Pass status={false} to drop the row and reclaim the space. (default true)
  - actions? — Page-level CTAs (Buttons, menus). Rendered on the TITLE row, right, vertically centred on the title — NOT in the breadcrumb row. Below sm they drop to their own line under the title. DO NOT pass `size` to a Button in here and DO NOT wrap them in your own flex div: the header re-sizes every Button in `actions` to `actionSize` (overriding a size you pass) and its own cluster owns the wrap and the gap. One header, one CTA size.
  - actionSize? (sm | default | lg) — The size EVERY Button in `actions` renders at. The header decides this, not the screen, so CTAs cannot drift a size apart page to page. Set it here once if a header genuinely needs a different size. (default "default")
  - utility? — App chrome at the right end of the breadcrumb row. Defaults to the help affordance alone; pass a node to EXTEND it (your node leads, help follows unless help={false}); pass utility={false} to suppress the cluster, help included. With breadcrumbs={false} it collapses into the title row's right cluster, leading `actions`.
  - help?: boolean — Help/support entry (quiet "?" icon button opening a support popover) at the end of the utility cluster. Pass help={false} to hide on a screen. (default true)
  - align? (center | justify) — Where the header CONTENT sits inside the full-width band the shell paints. "center" (default) caps it at the DS content width (--breakpoint-lg) and CENTRES it, so it lines up exactly with the body (GlobalLayoutContent centres the same way — a left-aligned header drifts right of the body at wide viewports; this is the fix). "justify" drops the cap so crumbs/title pin hard-left and actions hard-right at the column edges (full-width toolbar look). Almost every page wants "center". (default "center")
  - dataHook?: string — Instance name. (default "page-header")
when_to_use: The page header for every proposal screen — utility row (breadcrumbs left, help right), then the title row (title left, CTAs right), then the reserved status row (description left, "Last updated" right). EVERY page should carry a `description` (Ali, 18 Aug) — the row holds its height either way, but an empty one is a wasted slot. Pass to AppLayoutShell's `header` slot (padding + sticky behaviour are the SHELL's job — this component renders identically sticky or not). There is NO PageHeader in the BL package; this composition (upstream ask - it should be a component) ships in "@brightlocal/proposal".
composes_with: [AppLayoutShell, ProposalSidebar, Breadcrumb, Badge]
---

```jsx
<PageHeader
  breadcrumbs={[{ label: "Your Locations", href: "#" }, { label: "Location Hub", href: "#" }]}
  title="Rankings Table"
  actions={<Button variant="primary" dataHook="add-keywords-button">Add Keywords</Button>}
/>
```

Omit `meta` and nothing renders under the description — that's the
default (the old bound location line was dropped). The status ROW is
still there, holding its 22px, because a header that changes height
between pages shifts everything below it on navigation; `status={false}`
is the opt-out. Ships in "@brightlocal/proposal" — never inline a copy.

SIZING IS A VARIABLE SEAM, NOT A className (Ali, 18 Aug). PageHeader
takes no className for sizing, the same way `navDensity` on
AppLayoutShell doesn't: set the variable on any ancestor (the screen
root, or the shell) and the header follows. Defaults in brackets:

- `--gds-page-header-title-size` [1.5rem / 24px below sm, 1.875rem / 30px
  from sm up — the DEFAULT steps down on mobile, where the band was eating
  a third of a 375px viewport. Setting this variable overrides both.]
- `--gds-page-header-title-leading` [1.875rem below sm, 2.25rem from sm up]
- `--gds-page-header-title-weight` [600]
- `--gds-page-header-crumb-size` [0.875rem]
- `--gds-page-header-crumb-gap` [0.375rem / 6px] — breadcrumb row →
  title. Deliberately tighter than the other seams: the crumbs label
  the title, so they read as one block with it.
- `--gds-page-header-status-gap` [0.25rem / 4px] — title → status row.
  (`--gds-page-header-row-gap` is RETIRED: it named one gap for all three
  rows, and the two seams that replaced it are 6px and 4px.)
- `--gds-page-header-status-height` [1.375rem / 22px] — the status
  row's reserved height, held on every page (a floor, not a clip)
- `--gds-page-header-cluster-gap` [0.5rem] — inside the CTA / utility
  clusters

Each row seam is its own variable, not one flex `gap` on the container —
that is what lets the crumb→title and title→status distances differ.

```jsx
// A denser header on one screen — no module edit, no className.
<div style={{ "--gds-page-header-title-size": "1.5rem", "--gds-page-header-crumb-gap": "0.25rem" }}>
```

AI INSIGHTS SECTION RULES (Ali, 18 Jul):
- Sub pages (Website and Content / GBP / Reviews / Citations / Export)
  crumb EXACTLY two deep: `[{ bind: "location", goto: <hub> },
  { label: "AI Insights", goto: "screen:dmrotrgwxijez" }]` — never
  "All Locations > … > …" three-deep trails.
- No meta line under the description — this is the component default,
  so no per-page `meta={null}` is needed (the location is already the
  first crumb). `description` + `lastUpdated="auto"` fill the row.
