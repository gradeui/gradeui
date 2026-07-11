---
name: InputOTP
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/input-otp"
subcomponents: [InputOTPGroup, InputOTPSlot, InputOTPSeparator]
props:
  - maxLength? — TODO(review): type + one-line description from src
  - pattern? — TODO(review): type + one-line description from src
  - error? — TODO(review): type + one-line description from src
  - disabled? — TODO(review): type + one-line description from src
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
---

One-time password input with individual character cells.

## Guidance

One-time password input component for verification codes and 2FA. Built on [input-otp](https://input-otp.rodz.dev/).

### When to Use
- Two-factor authentication code entry
- Email or phone verification flows
- PIN code entry for secure actions

### Features
- Composition with Field, FieldLabel, and FieldError
- Multiple pre-built variants (connected, spaced, with separators)
- Configurable digit count (4-8 digits)
- Automatic focus management between slots
- Paste support with automatic transformation
- Error state support via context
- ARIA labels for screen reader accessibility

## Props (from BrightLocal MCP)

- primary?
- enums?
- subComponents?

<!-- Harvested from BrightLocal's MCP server (get_component_api "input-otp") — re-run harvest-brightlocal-mcp.mjs to refresh. -->
