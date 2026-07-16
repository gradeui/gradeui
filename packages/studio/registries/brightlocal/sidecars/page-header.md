---
name: PageHeader
import: "@brightlocal/proposal"
props:
  - title — Page title (rendered as TypographyH2 — the current page; it never appears in the breadcrumb).
  - breadcrumbs? — Ancestor trail, MAX TWO ({label, href?}[]). Ancestors only — BreadcrumbPage is deliberately unused. (default [])
  - meta? — Muted row under the title. DEFAULT is data-bound: current location name + status Badge from the proposal data context (follows dataset switches). Pass null to suppress, any node to replace.
  - actions? — Right-aligned actions (Buttons, menus). Rendered shrink-0 beside the title block.
  - dataHook?: string — Instance name. (default "page-header")
when_to_use: The page header for every proposal screen — breadcrumb trail above, H2 title, data-bound location meta below, actions right. Pass to AppLayoutShell's `header` slot (padding + sticky behaviour are the SHELL's job — this component renders identically sticky or not). There is NO PageHeader in the BL package; this composition (upstream ask - it should be a component) ships in "@brightlocal/proposal".
composes_with: [AppLayoutShell, ProposalSidebar, Breadcrumb, Badge]
---

```jsx
<PageHeader
  breadcrumbs={[{ label: "Your Locations", href: "#" }, { label: "Location Hub", href: "#" }]}
  title="Rankings Table"
  actions={<Button variant="primary" dataHook="add-keywords-button">Add Keywords</Button>}
/>
```

Omit `meta` to get the bound location line for free; the hub/module
pages all do. Ships in "@brightlocal/proposal" — never inline a copy.
