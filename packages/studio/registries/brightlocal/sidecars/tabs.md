---
name: Tabs
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/tabs"
subcomponents: [TabsList, TabsTrigger, TabsContent]
props:
  - value? — TODO(review): type + one-line description from src
  - defaultValue? — TODO(review): type + one-line description from src
  - onValueChange? — TODO(review): type + one-line description from src
  - lazyMount? — TODO(review): type + one-line description from src
  - unmountOnExit? — TODO(review): type + one-line description from src
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
when_to_use: Do NOT use for: page navigation (use NavigationMenu); step-by-step wizards.
aliases: [tab bar, tab group, tabbed interface]
---

Tabbed interface for switching between content panels.

## Guidance

A set of layered sections of content—known as tab panels—that display one at a time. Built on [Radix UI Tabs](https://www.radix-ui.com/primitives/docs/components/tabs).

### When to Use
- Organizing related content into distinct sections (settings, profile)
- Reducing visual clutter by showing one panel at a time
- Navigation within a page where URL changes aren't needed

### Features
- Keyboard navigation (Arrow keys, Home, End)
- Automatic and manual activation modes
- Full ARIA accessibility with proper roles and states
- Support for icons and custom content in triggers
- Disabled state support per trigger
- Lazy mounting via `lazyMount` prop (only mount panels on first activation)
- Optional unmount on exit via `unmountOnExit` prop
- Responsive and mobile-friendly
- Generic value type for type-safe `onValueChange` callbacks

## Props (from BrightLocal MCP)

- primary?
- enums?
- subComponents?

<!-- Harvested from BrightLocal's MCP server (get_component_api "tabs") — re-run harvest-brightlocal-mcp.mjs to refresh. -->
