---
name: PageHeader
import: "@brightlocal/proposal"
props:
  - title — Page title (rendered as TypographyH2 — the current page; it never appears in the breadcrumb).
  - breadcrumbs? — Ancestor trail, MAX TWO ({label, href?}[]). Ancestors only — BreadcrumbPage is deliberately unused. (default [])
  - meta? — Muted row under the title. EXPLICIT-ONLY: omitted (or null) renders nothing; pass any node to render it. (The old data-bound NAP + status Badge default was dropped — the location already leads the breadcrumb.) (default none)
  - actions? — Right-aligned actions (Buttons, menus). Rendered shrink-0 beside the title block.
  - dataHook?: string — Instance name. (default "page-header")
when_to_use: The page header for every proposal screen — breadcrumb trail above, H2 title, optional meta row below, actions right. Pass to AppLayoutShell's `header` slot (padding + sticky behaviour are the SHELL's job — this component renders identically sticky or not). There is NO PageHeader in the BL package; this composition (upstream ask - it should be a component) ships in "@brightlocal/proposal".
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

