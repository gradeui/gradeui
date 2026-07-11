---
name: Sheet
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/sheet"
subcomponents: [SheetTrigger, SheetPortal, SheetClose, SheetOverlay, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription]
props:
  - side? (top | right | bottom | left)
  - open? — TODO(review): type + one-line description from src
  - onOpenChange? — TODO(review): type + one-line description from src
  - dataHook?: string — optional on structural components (renders data-hook)
when_to_use: Side panel for editing details, settings, or supplementary info Right-side panel pattern (most common: filters, detail views, forms) Content that should slide in from an edge without navigating away Do NOT use for: centered dialogs (use Dialog); confirmations (use AlertDialog). Use Dialog for centered content requiring focused attention. Use Drawer when you need non-modal behavior or mobile bottom-sheet pattern. Use Sidebar for persistent collapsible navigation — Sheet is for temporary overlays.
composes_with: [Dialog, Drawer, Sidebar]
aliases: [side panel, drawer, flyout, tray, slide-out]
---

Modal slide-in panel from screen edge (always modal, renders via portal).

## Guidance

Sheet is a drawer component that slides in from the edge of the screen. Built on [Radix UI Dialog](https://www.radix-ui.com/primitives/docs/components/dialog).

### When to Use
- Side navigation menus that slide in from the left
- Form panels and settings drawers that slide in from the right
- Bottom sheets for mobile-style action menus
- Quick edit panels without leaving the current page

### Features
- Four position options (top, right, bottom, left)
- Keyboard navigation (Escape to close, Tab to move focus)
- Focus trap when open
- Overlay backdrop with click-to-close
- Smooth slide-in/out animations
- Portal rendering for proper z-index layering

## Props (from BrightLocal MCP)

- primary?
- enums?
- subComponents?

<!-- Harvested from BrightLocal's MCP server (get_component_api "sheet") — re-run harvest-brightlocal-mcp.mjs to refresh. -->
