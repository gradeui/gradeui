---
name: Sonner
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/sonner"
subcomponents: [sonner]
props:
  - title? — TODO(review): type + one-line description from src
  - description? — TODO(review): type + one-line description from src
  - icon? — TODO(review): type + one-line description from src
  - colorSchema? — TODO(review): type + one-line description from src
  - button? — TODO(review): type + one-line description from src
  - duration? — TODO(review): type + one-line description from src
  - dataHook?: string — optional on structural components (renders data-hook)
when_to_use: Do NOT use for: persistent alerts (use Alert); confirmation dialogs (use AlertDialog).
aliases: [toast, notification, snackbar, flash message]
---

Toast notification system with auto-dismiss and action support.

## Guidance

Sonner is a toast notification system for displaying temporary messages. Built on [sonner](https://sonner.emilkowal.ski/).

### When to Use
- Success/error feedback after form submissions
- Progress updates for async operations (uploads, saves)
- Non-blocking notifications that auto-dismiss
- Undo actions with timed toast messages

### Features
- Multiple icon types (info, success, warning, error, loading)
- Action buttons with custom handlers
- Color schemas (default, success)
- Auto-dismiss after 4 000 ms by default (configurable via `duration`)
- Persistent toasts (`duration: Infinity`) are not swipeable — they can only be dismissed programmatically via `sonner.dismiss(id)` or through an action button
- Accessible with ARIA live regions
- Dark mode support

<!-- Harvested from BrightLocal's MCP server (get_component_api "sonner") — re-run harvest-brightlocal-mcp.mjs to refresh. -->
