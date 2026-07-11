---
name: CentredLayout
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/centred-layout"
subcomponents: [CentredLayoutHeader, CentredLayoutContent]
props:
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
when_to_use: Single-column centered pages (login, signup, password reset, onboarding) Pages with a centered Card and branded header Do NOT use for: two-column layouts (use SplitLayout); app shells with sidebar navigation (use GlobalLayout + Sidebar). Use SplitLayout for two-column pages with marketing content on one side. Use GlobalLayout for full app shells with sidebar navigation.
composes_with: [SplitLayout, GlobalLayout]
---

Page layout centered horizontally with max-width constraint.

## Guidance

CentredLayout is a full-page centered layout container. Custom implementation using Tailwind CSS.

### When to Use
- Full-page layouts with centered content
- Login/signup pages and onboarding flows
- Settings pages and form containers
- Layouts with optional header (Logo, navigation)

### Features
- Full page width and height (w-full, min-h-screen)
- Automatic centering horizontally and vertically
- Responsive padding using section-padding tokens (16px mobile, 24px desktop)
- Composition pattern with `CentredLayoutHeader` and `CentredLayoutContent` sub-components
- Automatic spacing (16px gap) between header and content
- Header is centered on mobile/tablet, left-aligned from lg breakpoint
- Flexible content support for Cards, forms, or custom components

## Props (from BrightLocal MCP)

- primary?
- enums?
- subComponents?

<!-- Harvested from BrightLocal's MCP server (get_component_api "centred-layout") — re-run harvest-brightlocal-mcp.mjs to refresh. -->
