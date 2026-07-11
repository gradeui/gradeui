---
name: Button
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/button"
variants: [default, destructive, outline, secondary, ghost, warning]
sizes: [default, sm, lg]
props:
  - loading? — TODO(review): type + one-line description from src
  - fullWidth? — TODO(review): type + one-line description from src
  - iconOnly? — TODO(review): type + one-line description from src
  - asChild? — TODO(review): type + one-line description from src
  - type? — TODO(review): type + one-line description from src
  - ariaLabel? — TODO(review): type + one-line description from src
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
when_to_use: Triggering an action (submit, save, delete, open) Primary and secondary CTAs in forms, dialogs, and cards Icon-only actions using the iconOnly prop Do NOT use for: navigation links (use Link); toggle state (use Toggle or Switch). Use Link for navigation to a URL — even if it looks like a button, use Button with asChild wrapping a router Link for button-styled navigation. Use Toggle for on/off state that persists (e.g., bold, italic). Use Button + DropdownMenu for a button with secondary actions (SplitButton recipe).
composes_with: [Link, Toggle, DropdownMenu]
aliases: [btn, cta, action button, submit button, confirm button]
---

Interactive button with variants (default, destructive, outline, secondary, ghost, warning), sizes, loading state, and iconOnly mode.

## Guidance

Button triggers an action or event when clicked. Custom implementation using Tailwind CSS and class-variance-authority.

### When to Use
- Primary actions (submit form, save changes)
- Secondary actions (cancel, go back)
- Destructive actions (delete, remove)

### Features
- Six style variants: Primary, Secondary, Destructive, Outline, Ghost, Warning
- Three sizes: Small (sm), Default, Large (lg)
- Loading state with spinner animation
- Icon-only and icon with text support
- Full-width option for block-level buttons
- Proper accessibility with ARIA attributes

## Props (from BrightLocal MCP)

- primary?
- enums?

<!-- Harvested from BrightLocal's MCP server (get_component_api "button") — re-run harvest-brightlocal-mcp.mjs to refresh. -->
