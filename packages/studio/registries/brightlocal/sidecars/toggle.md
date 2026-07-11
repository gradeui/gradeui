---
name: Toggle
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/toggle"
variants: [default, outline]
sizes: [default, sm, lg]
props:
  - pressed? — TODO(review): type + one-line description from src
  - onPressedChange? — TODO(review): type + one-line description from src
  - ariaLabel? — TODO(review): type + one-line description from src
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
---

Two-state button that can be pressed or unpressed.

## Guidance

A two-state button that can be toggled on or off. Built on [Radix UI Toggle](https://www.radix-ui.com/primitives/docs/components/toggle).

### When to Use
- Text formatting toolbars (bold, italic, underline)
- Binary on/off settings (mute, visibility)
- Single-option selection (favorites, bookmarks)

### Features
- Two variants: Simple (transparent) and Outline (with border)
- Three sizes: Small (32px), Default (36px), and Large (40px)
- Icon support with text, icon-only, or icon + text combinations
- Keyboard navigation with Space/Enter key activation
- ARIA attributes for screen reader accessibility

## Props (from BrightLocal MCP)

- primary?
- enums?

<!-- Harvested from BrightLocal's MCP server (get_component_api "toggle") — re-run harvest-brightlocal-mcp.mjs to refresh. -->
