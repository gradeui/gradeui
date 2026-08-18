---
name: PageHeader
import: "@brightlocal/proposal"
props:
  - title — Page title (an h2, sized by --gds-page-header-title-size, default 30px/text-3xl — one step BELOW the DS TypographyH2, which is 36px from md up). It is the current page and never appears in the breadcrumb.
  - breadcrumbs? — Ancestor trail, MAX TWO ({label, href?}[]). Ancestors only — BreadcrumbPage is deliberately unused. `[]` (the default) renders an invisible spacer so crumb-less pages keep the row's height and nothing jumps on navigation; `false` drops the utility row ENTIRELY (and collapses `utility` into the title row). Below sm the trail collapses to the LAST crumb behind a back arrow. (default [])
  - description? — Subtitle line under the title (muted, measured). Every proposal page should carry one. String or node. (default none)
  - lastUpdated?: string — Timestamp shown muted at the right of the description row, bottom-aligned with it. Pass "auto" to BIND data.aiInsights.lastUpdated (the AI Insights pages own it — it was removed from the AreaInsights header so it lives in ONE place); any other string renders literally; omit to hide.
  - meta? — Muted row under the title. EXPLICIT-ONLY: omitted (or null) renders nothing; pass any node to render it. (The old data-bound NAP + status Badge default was dropped — the location already leads the breadcrumb.) (default none)
  - actions? — Page-level CTAs (Buttons, menus). Rendered on the TITLE row, right, vertically centred on the title — NOT in the breadcrumb row. Below sm they drop to their own line under the title.
  - utility? — App chrome at the right end of the breadcrumb row. Defaults to the help affordance alone; pass a node to EXTEND it (your node leads, help follows unless help={false}); pass utility={false} to suppress the cluster, help included. With breadcrumbs={false} it collapses into the title row's right cluster, leading `actions`.
  - help?: boolean — Help/support entry (quiet "?" icon button opening a support popover) at the end of the utility cluster. Pass help={false} to hide on a screen. (default true)
  - align? (center | justify) — Where the header CONTENT sits inside the full-width band the shell paints. "center" (default) caps it at the DS content width (--breakpoint-lg) and CENTRES it, so it lines up exactly with the body (GlobalLayoutContent centres the same way — a left-aligned header drifts right of the body at wide viewports; this is the fix). "justify" drops the cap so crumbs/title pin hard-left and actions hard-right at the column edges (full-width toolbar look). Almost every page wants "center". (default "center")
  - dataHook?: string — Instance name. (default "page-header")
when_to_use: The page header for every proposal screen — utility row (breadcrumbs left, help right), then the title row (title left, CTAs right), then the description. Pass to AppLayoutShell's `header` slot (padding + sticky behaviour are the SHELL's job — this component renders identically sticky or not). There is NO PageHeader in the BL package; this composition (upstream ask - it should be a component) ships in "@brightlocal/proposal".
composes_with: [AppLayoutShell, ProposalSidebar, Breadcrumb, Badge]
---

```jsx
<PageHeader
  breadcrumbs={[{ label: "Your Locations", href: "#" }, { label: "Location Hub", href: "#" }]}
  title="Rankings Table"
  actions={<Button variant="primary" dataHook="add-keywords-button">Add Keywords</Button>}
/>
```

Omit `meta` and nothing renders under the title — that's the default
now (the old bound location line was dropped). Ships in
"@brightlocal/proposal" — never inline a copy.

SIZING IS A VARIABLE SEAM, NOT A className (Ali, 18 Aug). PageHeader
takes no className for sizing, the same way `navDensity` on
AppLayoutShell doesn't: set the variable on any ancestor (the screen
root, or the shell) and the header follows. Defaults in brackets:

- `--gds-page-header-title-size` [1.875rem / 30px]
- `--gds-page-header-title-leading` [2.25rem]
- `--gds-page-header-title-weight` [600]
- `--gds-page-header-crumb-size` [0.875rem]
- `--gds-page-header-row-gap` [1rem] — between the utility, title and
  description rows
- `--gds-page-header-cluster-gap` [0.5rem] — inside the CTA / utility
  clusters

```jsx
// A denser header on one screen — no module edit, no className.
<div style={{ "--gds-page-header-title-size": "1.5rem", "--gds-page-header-row-gap": "0.25rem" }}>
```

AI INSIGHTS SECTION RULES (Ali, 18 Jul):
- Sub pages (Website and Content / GBP / Reviews / Citations / Export)
  crumb EXACTLY two deep: `[{ bind: "location", goto: <hub> },
  { label: "AI Insights", goto: "screen:dmrotrgwxijez" }]` — never
  "All Locations > … > …" three-deep trails.
- No meta row under the title — this is now the component default, so
  no per-page `meta={null}` needed (the location is already the first
  crumb).
