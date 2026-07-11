---
name: Calendar
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/calendar"
props:
  - numberOfMonths? — TODO(review): type + one-line description from src
  - mode? — TODO(review): type + one-line description from src
  - selected? — TODO(review): type + one-line description from src
  - onSelect? — TODO(review): type + one-line description from src
  - disabled? — TODO(review): type + one-line description from src
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
---

Date picker calendar grid for selecting single dates or date ranges.

## Guidance

Calendar provides date and range selection functionality. Built on [react-day-picker](https://daypicker.dev).

### When to Use
- Standalone date selection interfaces
- Booking and scheduling applications
- Date range filtering for reports

### Features
- Single, multiple, and range date selection modes
- Month/year dropdown navigation
- Custom day rendering for prices, events, or availability
- Preset buttons for quick date selection
- Time input integration for datetime selection
- Full keyboard navigation and ARIA support

## Props (from BrightLocal MCP)

- primary?
- enums?

<!-- Harvested from BrightLocal's MCP server (get_component_api "calendar") — re-run harvest-brightlocal-mcp.mjs to refresh. -->
