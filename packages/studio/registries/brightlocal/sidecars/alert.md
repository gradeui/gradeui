---
name: Alert
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/alert"
subcomponents: [AlertTitle, AlertDescription, AlertSuccess, AlertInfo, AlertDestructive, AlertWarning]
variants: [default, success, info, destructive, warning]
props:
  - title? — TODO(review): type + one-line description from src
  - description? — TODO(review): type + one-line description from src
  - action? — TODO(review): type + one-line description from src
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
when_to_use: Do NOT use for: toast notifications (use Sonner); inline validation (use FieldError).
aliases: [notification, banner, message, status message]
---

Informational banner for success, warning, error, or info messages.

## Guidance

Alert displays contextual feedback messages to communicate status to users. Custom implementation using Tailwind CSS.

### When to Use
- Form submission success/error feedback
- System status notifications (warnings, errors)
- Informational banners and tips

### Features
- Four semantic variants: Success, Info, Warning, Destructive
- Optional title and description content
- Support for action buttons (undo, retry, etc.)
- Proper ARIA role="alert" for screen readers
- Consistent iconography per variant

## Props (from BrightLocal MCP)

- primary?
- enums?

<!-- Harvested from BrightLocal's MCP server (get_component_api "alert") — re-run harvest-brightlocal-mcp.mjs to refresh. -->
