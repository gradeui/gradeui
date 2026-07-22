---
name: PageHeader
import: "@brightlocal/proposal"
props:
  - title — Page title (rendered as TypographyH2 — the current page; it never appears in the breadcrumb).
  - breadcrumbs? — Ancestor trail, MAX TWO ({label, href?}[]). Ancestors only — BreadcrumbPage is deliberately unused. (default [])
  - description? — Subtitle line under the H2 (muted, measured). Every proposal page should carry one. String or node. (default none)
  - lastUpdated?: string — Timestamp shown muted beneath the description. Pass "auto" to BIND data.aiInsights.lastUpdated (the AI Insights pages own it — it was removed from the AreaInsights header so it lives in ONE place); any other string renders literally; omit to hide.
  - meta? — Muted row under the title. EXPLICIT-ONLY: omitted (or null) renders nothing; pass any node to render it. (The old data-bound NAP + status Badge default was dropped — the location already leads the breadcrumb.) (default none)
  - actions? — Right-aligned actions (Buttons, menus). Rendered shrink-0 beside the title block.
  - help?: boolean — Help/support entry top-right on every page (quiet "?" icon button opening a support popover). Pass help={false} to hide on a screen. (default true)
  - align? (center | justify) — Where the header CONTENT sits inside the full-width band the shell paints. "center" (default) caps it at the DS content width (--breakpoint-lg) and CENTRES it, so it lines up exactly with the body (GlobalLayoutContent centres the same way — a left-aligned header drifts right of the body at wide viewports; this is the fix). "justify" drops the cap so crumbs/title pin hard-left and actions hard-right at the column edges (full-width toolbar look). Almost every page wants "center". (default "center")
  - dataHook?: string — Instance name. (default "page-header")
when_to_use: The page header for every proposal screen — breadcrumb trail above (extra space to the H1), H2 title, a description subtitle, an optional "Last updated" line, actions right. Pass to AppLayoutShell's `header` slot (padding + sticky behaviour are the SHELL's job — this component renders identically sticky or not). There is NO PageHeader in the BL package; this composition (upstream ask - it should be a component) ships in "@brightlocal/proposal".
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

AI INSIGHTS SECTION RULES (Ali, 18 Jul):
- Sub pages (Website and Content / GBP / Reviews / Citations / Export)
  crumb EXACTLY two deep: `[{ bind: "location", goto: <hub> },
  { label: "AI Insights", goto: "screen:dmrotrgwxijez" }]` — never
  "All Locations > … > …" three-deep trails.
- No meta row under the title — this is now the component default, so
  no per-page `meta={null}` needed (the location is already the first
  crumb).

