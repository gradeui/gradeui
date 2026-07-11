---
name: InputPasswordRoot
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/input-password"
subcomponents: [InputPasswordField, InputPasswordStrength, InputPasswordToggle]
props:
  - strengthLevels? — TODO(review): type + one-line description from src
  - onStrengthChange? — TODO(review): type + one-line description from src
  - showMeter? — TODO(review): type + one-line description from src
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
aliases: [inputpassword]
---

Password input with show/hide toggle.

## Guidance

Password input with visibility toggle and strength indicator. Composable architecture for flexible layouts.

### When to Use
- User registration forms with password creation
- Login forms requiring password entry
- Account settings for password changes

### Features
- **Composable API** - Build custom layouts with InputPasswordRoot, InputPasswordField, and InputPasswordStrength
- Show/hide password toggle button
- Real-time password strength indicator
- Strength levels: Meter, Weak, Ok, Good, Great
- Debounced strength calculation for performance
- Built on InputGroup for consistent styling

## Props (from BrightLocal MCP)

- primary?
- enums?
- subComponents?

<!-- Harvested from BrightLocal's MCP server (get_component_api "input-password") — re-run harvest-brightlocal-mcp.mjs to refresh. -->
