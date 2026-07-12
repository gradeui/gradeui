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
