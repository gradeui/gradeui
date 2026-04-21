# @gradeui/ui

## 0.3.0

### Minor Changes

- 899d77c: Add `DatePicker` and `DateRangePicker` as sealed complex components, and export the underlying `Calendar` and `Popover` primitives from the barrel.

  Previously consumers had to compose Popover + Button + Calendar themselves (or fall back to `<input type="date">`). Now:

  ```tsx
  import { DatePicker, DateRangePicker } from "@gradeui/ui"

  <DatePicker value={date} onChange={setDate} />
  <DateRangePicker value={range} onChange={setRange} numberOfMonths={2} />
  ```

  The DatePicker exposes a `value` / `onChange` contract over a `Date` (or `DateRange`), with optional `placeholder`, `format` (date-fns token, default `"PPP"`), `align`, `side`, `captionLayout`, `icon`, `contentClassName`, and `numberOfMonths` (range only). Internally it still composes Popover + Button + Calendar, so consumers who need a custom trigger can import those primitives directly and build their own.

## 0.2.0

### Minor Changes

- fc1241a: Alert gains paired soft/deep status tokens across success, warning, info,
  highlight, and destructive. The `-soft` token drives tinted surfaces and
  `-deep` drives on-surface text and icon colour, derived through
  `deriveAlertPair` in the theme pipeline so both remain legible across
  generated palettes. Exposed as `bg-*-soft`, `text-*-deep`, and
  `border-*/30` utilities via the Tailwind preset.

  Finishes the Ramp → Grade rename: `ramp-mode-switcher`,
  `ramp-theme-provider`, and `ramp-theme-switcher` are now `grade-*`.
  `@ramp-ds/ui` consumers should switch to `@gradeui/ui` (the old package
  is defunct).

## 0.1.1

### Patch Changes

- 74baf04: Initial public release of @gradeui/core, @gradeui/ui, and @gradeui/pro.
