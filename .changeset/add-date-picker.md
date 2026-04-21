---
"@gradeui/ui": minor
---

Add `DatePicker` and `DateRangePicker` as sealed complex components, and export the underlying `Calendar` and `Popover` primitives from the barrel.

Previously consumers had to compose Popover + Button + Calendar themselves (or fall back to `<input type="date">`). Now:

```tsx
import { DatePicker, DateRangePicker } from "@gradeui/ui"

<DatePicker value={date} onChange={setDate} />
<DateRangePicker value={range} onChange={setRange} numberOfMonths={2} />
```

The DatePicker exposes a `value` / `onChange` contract over a `Date` (or `DateRange`), with optional `placeholder`, `format` (date-fns token, default `"PPP"`), `align`, `side`, `captionLayout`, `icon`, `contentClassName`, and `numberOfMonths` (range only). Internally it still composes Popover + Button + Calendar, so consumers who need a custom trigger can import those primitives directly and build their own.
