---
name: AlertDialog
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/alert-dialog"
subcomponents: [AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel]
props:
  - open? — TODO(review): type + one-line description from src
  - onOpenChange? — TODO(review): type + one-line description from src
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
when_to_use: User is about to perform an irreversible or destructive action (delete, discard, overwrite) Action has significant consequences that require explicit confirmation Two clear actions: confirm or cancel — no other options needed Do NOT use for: informational dialogs (use Dialog); toast messages (use Sonner). Use Dialog when content is informational or includes a form — not a simple confirm/cancel. Use Sonner for non-blocking success/error feedback after an action completes.
composes_with: [Dialog, Sonner]
aliases: [confirmation dialog, confirm modal, destructive action dialog]
---

Modal dialog for confirming destructive or irreversible actions.

## Guidance

AlertDialog interrupts the user with important content and expects a response. Built on [Radix UI Alert Dialog](https://www.radix-ui.com/primitives/docs/components/alert-dialog).

### When to Use
- Destructive actions requiring confirmation (delete, remove)
- Critical decisions that can't be undone
- Important warnings before proceeding

### Features
- Accessible by default with proper ARIA attributes
- Keyboard navigation (Escape to close, Tab to navigate)
- Focus trapping within dialog when open
- Animated entry and exit transitions
- Compositional sub-components for flexible layouts

## Props (from BrightLocal MCP)

- primary?
- enums?
- subComponents?

<!-- Harvested from BrightLocal's MCP server (get_component_api "alert-dialog") — re-run harvest-brightlocal-mcp.mjs to refresh. -->
