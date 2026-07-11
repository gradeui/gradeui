---
name: SplitLayout
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/split-layout"
subcomponents: [SplitLayoutHeader, SplitLayoutContentLeft, SplitLayoutContentRight]
props:
  - left? — TODO(review): type + one-line description from src
  - right? — TODO(review): type + one-line description from src
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
  - left — DEPRECATED since 1.2.0: Use <SplitLayoutContentLeft> composition instead (DS-450)
  - right — DEPRECATED since 1.2.0: Use <SplitLayoutContentRight> composition instead (DS-450)
when_to_use: Two-column pages where one side is content and the other is decorative/marketing Auth pages with form on the left and branding on the right Any page where the right column should be hidden on mobile Do NOT use for: centered single-column layouts (use CentredLayout); app shells with sidebar navigation (use GlobalLayout + Sidebar); equal-width columns that should both be visible on mobile (use CSS grid). Use CentredLayout for single-column centered content. Use GlobalLayout for full app shells with persistent sidebar.
composes_with: [CentredLayout, GlobalLayout]
---

Two-column layout with resizable split pane.

## Guidance

SplitLayout is a responsive two-column layout component. Custom implementation using Tailwind CSS.

### When to Use
- Login, signup, and onboarding pages with form and marketing content
- Landing pages with content and imagery sections
- Authentication flows where form is prioritized on mobile
- Split-screen layouts that need responsive behavior

### Features
- Responsive behavior (stacked on mobile, side-by-side on desktop)
- Right section hidden on mobile/tablet (<1024px)
- Equal-width columns on desktop
- Built-in background colors (bg-background, bg-card)
- Automatic scrolling for overflowing content
- Composition pattern with `SplitLayoutHeader`, `SplitLayoutContentLeft`, and `SplitLayoutContentRight` sub-components
- Full-bleed image support via `flush` prop and `SplitLayoutImage`

## Props (from BrightLocal MCP)

- primary?
- enums?
- subComponents?

<!-- Harvested from BrightLocal's MCP server (get_component_api "split-layout") — re-run harvest-brightlocal-mcp.mjs to refresh. -->
