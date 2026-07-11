---
name: Link
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/link"
variants: [inline, filled, outline, ghost]
props:
  - variant? — TODO(review): type + one-line description from src
  - external? — TODO(review): type + one-line description from src
  - showExternalIcon? — TODO(review): type + one-line description from src
  - asChild? — TODO(review): type + one-line description from src
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
when_to_use: Inline text links within paragraphs or sentences (inline variant) Navigation to internal or external URLs Button-styled navigation or inline actions that need a button appearance (filled, outline, ghost variants) Links inside i18n <Trans> blocks — use Link as a component in the components map Do NOT use for: actions that don't navigate (submit, delete, toggle) — use Button. Use Button for actions (submit, delete, open). Use a button-styled Link (variant filled/outline/ghost) for navigation that needs a button appearance.
composes_with: [Button]
---

Styled anchor element for navigation with design system theming.

## Guidance

Link is a styled anchor element. The default `inline` variant renders a text link for navigation; the `filled`, `outline` and `ghost` variants render button-styled treatments for inline actions and high-priority navigation while remaining a semantic `<a>`.

### When to Use
- `inline` — navigation inside content (breadcrumbs, menus, inline links) and external links
- `filled` / `outline` / `ghost` — button-styled links for high-priority navigation or inline actions that need a button appearance

### Features
- Four visual variants (`inline`, `filled`, `outline`, `ghost`) sharing the Button's styling tokens
- Consistent link styling with design tokens
- External link support with automatic icon and security attributes
- Next.js / router Link integration via asChild prop
- Focus ring for keyboard navigation
- Visited state styling (inline variant)

## Props (from BrightLocal MCP)

- primary?
- enums?

<!-- Harvested from BrightLocal's MCP server (get_component_api "link") — re-run harvest-brightlocal-mcp.mjs to refresh. -->
