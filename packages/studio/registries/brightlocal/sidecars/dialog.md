---
name: Dialog
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/dialog"
subcomponents: [DialogTrigger, DialogPortal, DialogClose, DialogOverlay, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription]
props:
  - open? — TODO(review): type + one-line description from src
  - onOpenChange? — TODO(review): type + one-line description from src
  - modal? — TODO(review): type + one-line description from src
  - dataHook?: string — optional on structural components (renders data-hook)
when_to_use: Presenting informational content or forms that require focused attention Content that should block interaction with the page behind it Multi-step flows or forms that don't fit inline Do NOT use for: confirmation actions (use AlertDialog); side panels (use Sheet or Drawer). Use AlertDialog when the user must confirm or cancel a destructive/irreversible action. Use Sheet for side panels with supplementary content or forms that don't need centered focus. Use Drawer for mobile-friendly bottom/side slide-out panels.
composes_with: [AlertDialog, Sheet, Drawer]
aliases: [modal, popup, lightbox]
---

Modal overlay for focused content or forms with focus trapping.

## Guidance

Dialog displays content in a modal overlay that interrupts the user's workflow. Built on [Radix UI Dialog](https://www.radix-ui.com/primitives/docs/components/dialog).

### When to Use
- Forms requiring user input (edit profile, settings)
- Content that needs focused attention
- Multi-step flows within a modal context

### Features
- Accessible by default with proper ARIA attributes
- Keyboard navigation (Escape to close, Tab to navigate)
- Focus trapping within dialog when open
- Animated entry and exit transitions
- Compositional sub-components for flexible layouts
- Controlled and uncontrolled modes

## Props (from BrightLocal MCP)

- primary?
- enums?
- subComponents?

<!-- Harvested from BrightLocal's MCP server (get_component_api "dialog") — re-run harvest-brightlocal-mcp.mjs to refresh. -->
