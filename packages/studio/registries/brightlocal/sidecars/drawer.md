---
name: Drawer
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/drawer"
subcomponents: [DrawerTrigger, DrawerPortal, DrawerClose, DrawerOverlay, DrawerContent, DrawerHeader, DrawerFooter, DrawerTitle, DrawerDescription]
props:
  - open? — TODO(review): type + one-line description from src
  - onOpenChange? — TODO(review): type + one-line description from src
  - direction? — TODO(review): type + one-line description from src
  - dataHook?: string — optional on structural components (renders data-hook)
when_to_use: Mobile-friendly slide-out panel from any edge Non-modal supplementary content on touch devices Bottom sheet pattern on mobile viewports Do NOT use for: centered dialogs (use Dialog); confirmation prompts (use AlertDialog). Use Sheet for always-modal side panels with overlay — Sheet is modal-only, Drawer supports non-modal. Use Dialog when content should be centered and focused, not sliding from an edge.
composes_with: [Sheet, Dialog]
---

Slide-in panel from screen edge with drag-to-dismiss gesture.

## Guidance

Drawer is a slide-out panel component optimized for mobile interactions. Built on [vaul](https://vaul.emilkowal.ski/).

### When to Use
- Mobile-first navigation or actions
- Settings panels and filters on small screens
- Quick actions that don't require full-screen attention

### Features
- Swipe to dismiss on touch devices
- Keyboard accessible (Escape to close)
- Focus trapping within drawer when open
- Multi-directional support (top, bottom, left, right)
- Responsive design with handle bar for mobile
- Compositional sub-components for flexible layouts

## Props (from BrightLocal MCP)

- primary?
- enums?
- subComponents?

<!-- Harvested from BrightLocal's MCP server (get_component_api "drawer") — re-run harvest-brightlocal-mcp.mjs to refresh. -->
