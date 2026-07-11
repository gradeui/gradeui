---
name: Progress
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/progress"
props:
  - value? — TODO(review): type + one-line description from src
  - ariaLabel? — TODO(review): type + one-line description from src
  - label? — TODO(review): type + one-line description from src
  - indicatorClassName? — TODO(review): type + one-line description from src
  - disabled? — TODO(review): type + one-line description from src
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
---

Horizontal progress bar with animated fill (0-100).

## Guidance

Progress displays completion status with an animated indicator bar. Built on [Radix UI Progress](https://www.radix-ui.com/primitives/docs/components/progress) with Framer Motion animation.

### When to Use
- File uploads and downloads showing transfer status
- Multi-step forms indicating current step completion
- Loading states for long-running operations

### Features
- Smooth spring animation for value changes
- Optional visible label for accessibility
- Supports 0-100% range with visual fill indicator
- ARIA attributes for screen reader announcements

## Props (from BrightLocal MCP)

- primary?
- enums?

<!-- Harvested from BrightLocal's MCP server (get_component_api "progress") — re-run harvest-brightlocal-mcp.mjs to refresh. -->
