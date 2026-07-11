---
name: DatePickerRoot
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/date-picker"
subcomponents: [DatePickerTrigger, DatePickerContent, DatePickerCalendar, DatePickerPresets]
props:
  - mode? (single | range)
  - date? — TODO(review): type + one-line description from src
  - onDateChange? — TODO(review): type + one-line description from src
  - dateRange? — TODO(review): type + one-line description from src
  - onDateRangeChange? — TODO(review): type + one-line description from src
  - disabled? — TODO(review): type + one-line description from src
  - dateFormat? — TODO(review): type + one-line description from src
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
aliases: [datepicker]
---

Date input with calendar dropdown for selecting dates.

## Guidance

DatePicker is a composable date selection component with calendar popover. Built on [react-day-picker](https://daypicker.dev/).

### When to Use
- Single date selection (birthdays, due dates)
- Date range selection (booking periods, reports)
- Quick date presets (today, tomorrow, next week)

### Features
- **Composable API** - Build custom layouts with Root, Trigger, Content, Calendar, and Presets
- Single date or date range selection via `mode` prop
- Quick preset options with DatePickerPresets
- Accessible keyboard navigation
- Customizable date format using date-fns tokens

## Props (from BrightLocal MCP)

- primary?
- enums?
- subComponents?

<!-- Harvested from BrightLocal's MCP server (get_component_api "date-picker") — re-run harvest-brightlocal-mcp.mjs to refresh. -->
