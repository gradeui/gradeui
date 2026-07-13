---
name: Calendar
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/calendar"
props:
  - numberOfMonths? — Number of months to display (1-3) (default 1)
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
  - trackingEl?: string — Tracking element identifier
  - trackingLabel?: string — Tracking label for analytics
---

```jsx
const [date, setDate] = React.useState<Date | undefined>(new Date());

<Calendar
  mode="single"
  selected={date}
  onSelect={setDate}
  captionLayout="dropdown"
  dataHook="date-picker"
/>
```
```jsx
const [date, setDate] = React.useState<Date | undefined>(new Date());
const [month, setMonth] = React.useState<Date>(new Date());
const getDayPrice = () => 100;

<Calendar
  mode="single"
  selected={date}
  onSelect={setDate}
  month={month}
  onMonthChange={setMonth}
  showOutsideDays={true}
  fixedWeeks={true}
  dataHook="calendar-custom-days"
  classNames={{
    weekday: "h-[21px] w-12 text-xs font-normal text-muted-foreground",
    day: "size-12 p-0 rounded-md text-center",
    day_button: "size-12",
  }}
  components={{
    DayButton: ({ day, modifiers, className, ...props }) => (
      <button className={className} {...props}>
        <span className="text-sm">{day.date.getDate()}</span>
        <span className="text-xs">${getDayPrice()}</span>
      </button>
    ),
  }}
/>
```
```jsx
const [date, setDate] = React.useState<Date | undefined>(new Date());

<Calendar
  mode="single"
  selected={date}
  onSelect={setDate}
  captionLayout="dropdown"
  dataHook="calendar-simple"
/>
```

<!-- Examples harvested from https://storybook.brightlocal.com (ui-components-calendar--docs); re-run harvest-brightlocal-stories.mjs to refresh. -->
