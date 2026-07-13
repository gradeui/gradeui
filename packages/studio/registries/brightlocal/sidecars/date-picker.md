---
name: DatePickerRoot
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/date-picker"
subcomponents: [DatePickerTrigger, DatePickerContent, DatePickerCalendar, DatePickerPresets]
props:
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
  - trackingEl?: string — Tracking element identifier for analytics
  - trackingLabel?: string — Tracking label for analytics context
  - mode? — Selection mode: 'single' for single date, 'range' for date range
  - date? — Selected date value (single mode)
  - onDateChange? — Callback fired when date selection changes (single mode)
  - dateRange? — Selected date range value (range mode)
  - onDateRangeChange? — Callback fired when date range selection changes (range mode)
  - placeholder?: string — Placeholder text when no date is selected
  - disabled?: boolean — Disabled state
  - dateFormat?: string — Format string for displaying selected date Uses date-fns format tokens
  - open?: boolean — Controlled open state
  - onOpenChange? — Callback fired when open state changes
  - defaultOpen?: boolean — Default open state for uncontrolled usage
  - children — Children components
  - error?: boolean — DatePickerTrigger: Whether the trigger has an error state
  - triggerLabel?: string — DatePickerTrigger: Accessible label for the trigger button. (default "Select) date" (single) or "Select date range" (range)
  - contentLabel?: string — DatePickerContent: Accessible label for the date picker popover. (default "Date) picker" (single) or "Date range picker" (range)
  - closeOnSelect?: boolean — DatePickerCalendar: Whether to close the popover when a date is selected (single mode only) (default true)
  - presets? — DatePickerPresets: Array of preset options (default DEFAULT_DATE_PRESETS)
  - className?: string — DatePickerPresets: Additional class name
aliases: [datepicker]
---

```jsx
function Example() {
  const [date, setDate] = React.useState<Date | undefined>();

  return (
    <DatePickerRoot dataHook="my-date-picker" date={date} onDateChange={setDate}>
      <DatePickerTrigger />
      <DatePickerContent>
        <DatePickerCalendar />
      </DatePickerContent>
    </DatePickerRoot>
  );
}
```
```jsx
function Example() {
  const [date, setDate] = React.useState<Date | undefined>();

  return (
    <DatePickerRoot dataHook="my-date-picker" date={date} onDateChange={setDate}>
      <DatePickerTrigger />
      <DatePickerContent>
        <div className="flex flex-col gap-2 p-2">
          <DatePickerPresets />
          <DatePickerCalendar className="rounded-lg border" />
        </div>
      </DatePickerContent>
    </DatePickerRoot>
  );
}
```
```jsx
function Example() {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>();

  return (
    <DatePickerRoot
      dataHook="my-date-picker"
      mode="range"
      dateRange={dateRange}
      onDateRangeChange={setDateRange}
    >
      <DatePickerTrigger />
      <DatePickerContent>
        <DatePickerCalendar numberOfMonths={2} />
      </DatePickerContent>
    </DatePickerRoot>
  );
}
```

<!-- Examples harvested from https://storybook.brightlocal.com (ui-components-datepicker--docs); re-run harvest-brightlocal-stories.mjs to refresh. -->
