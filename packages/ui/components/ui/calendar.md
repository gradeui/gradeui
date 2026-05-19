---
name: Calendar
import: "@gradeui/ui"
subcomponents: [CalendarDayButton]
props:
  - mode?: "single" | "multiple" | "range" — picks one date, several dates, or a [from, to] range
  - selected?: Date | Date[] | { from: Date; to?: Date } — controlled selection; shape matches `mode`
  - onSelect?: (value) => void — fires with the new selection
  - month?: Date — controlled displayed month
  - defaultMonth?: Date — uncontrolled initial month
  - onMonthChange?: (date: Date) => void
  - numberOfMonths?: number (default 1) — render multiple months side by side, useful for range pickers
  - disabled?: Date | Date[] | { before?: Date; after?: Date } | (date: Date) => boolean
  - captionLayout?: "label" | "dropdown" | "dropdown-months" | "dropdown-years"
  - className?: string
when_to_use: An inline date grid — date-of-birth pickers in profile forms, scheduling screens with a month view, range selection in reporting filters. For a compact trigger-and-popover input, use DatePicker / DateRangePicker (which wrap Calendar internally). For one-off relative dates ("yesterday", "last week") use a Select instead.
composes_with: [Popover (DatePicker composes them), Card (inline scheduling card), Dialog (full-screen mobile date pick)]
aliases: [calendar, date grid, month view, scheduler grid, calendar view, multidate picker, react native calendars]
---

```jsx
// Single-date inline calendar.
<Calendar
  mode="single"
  selected={date}
  onSelect={setDate}
  captionLayout="dropdown"
/>
```

```jsx
// Two-month range picker — typical reporting filter shape.
<Calendar
  mode="range"
  numberOfMonths={2}
  selected={range}
  onSelect={setRange}
/>
```
