---
name: DatePicker
import: ./components/ui/date-picker
props:
  - value?: Date (single) | DateRange (range)
  - onChange?: (value) => void — called on select or clear
  - placeholder?: string — trigger label when empty (default "Pick a date" / "Pick a date range")
  - disabled?: boolean
  - format?: string — date-fns format token for the trigger label (default "PPP" single, "LLL dd, y" range)
  - align?: "start" | "center" | "end" — popover align (default "start")
  - side?: "top" | "right" | "bottom" | "left" — popover side
  - captionLayout?: "label" | "dropdown" | "dropdown-months" | "dropdown-years"
  - className?: string — on the trigger button
  - contentClassName?: string — on the PopoverContent
  - icon?: ReactNode — replaces the default CalendarIcon
  - numberOfMonths?: number — DateRangePicker only, default 2
when_to_use: Any date or date-range entry. Use DatePicker for a single date (DOB, due date, booking). Use DateRangePicker for a span (report period, stay dates, filter window). Prefer these over <Input type="date"> — consistent theming, keyboard nav, a11y, and no browser-native UI drift.
composes_with: [Label, Form, Card (in CardContent), Button (form submit)]
exports: [DatePicker, DateRangePicker]
---

```jsx
// Single date
<div className="grid gap-1.5">
  <Label htmlFor="dob">Date of birth</Label>
  <DatePicker
    value={date}
    onChange={setDate}
    placeholder="Select your birthday"
  />
</div>
```

```jsx
// Date range
<DateRangePicker
  value={range}
  onChange={setRange}
  numberOfMonths={2}
/>
```

```jsx
// With presets — pair with Button shortcuts
<div className="flex items-center gap-2">
  <DatePicker value={date} onChange={setDate} />
  <Button variant="outline" size="sm" onClick={() => setDate(new Date())}>Today</Button>
</div>
```

Built internally from Popover + Button + Calendar. If you need a custom trigger or different popover positioning, compose the primitives directly — Calendar and Popover are exported from the same barrel.
