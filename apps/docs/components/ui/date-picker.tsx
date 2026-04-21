"use client"

/**
 * DatePicker + DateRangePicker
 *
 * Sealed complex components built on top of the Popover + Button + Calendar
 * primitives. Consumers get a single import with a `value` / `onChange`
 * contract — no need to know about Popover, DayPicker, or date-fns.
 *
 * The primitives remain exported from the barrel so anyone who needs a
 * different trigger, different positioning, or a custom layout can still
 * compose their own — see `apps/docs/app/components/date-picker/page.tsx`
 * for the hand-assembled recipe.
 *
 * API:
 *   <DatePicker value={date} onChange={setDate} />
 *   <DatePicker value={date} onChange={setDate} format="PP" placeholder="..." />
 *   <DateRangePicker value={range} onChange={setRange} numberOfMonths={2} />
 *
 * The `value` / `onChange` shape matches react-day-picker's `selected` /
 * `onSelect` internally — we just rename them so consumers speak form.
 */

import * as React from "react"
import { format as formatDate } from "date-fns"
import { CalendarIcon } from "lucide-react"
import type { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

type PopoverAlign = "start" | "center" | "end"
type PopoverSide = "top" | "right" | "bottom" | "left"

// Props shared by both DatePicker and DateRangePicker.
interface DatePickerBaseProps {
  /** Placeholder text shown when no date is selected. */
  placeholder?: string
  /** Disable the trigger. */
  disabled?: boolean
  /** Classes on the outer trigger button. */
  className?: string
  /** Classes forwarded to PopoverContent. */
  contentClassName?: string
  /** Forwarded to PopoverContent — which edge to align to. Defaults to "start". */
  align?: PopoverAlign
  /** Forwarded to PopoverContent — which side of the trigger to render on. */
  side?: PopoverSide
  /**
   * date-fns format string for the trigger label. Defaults to "PPP"
   * (e.g. "April 19th, 2026"). Pass "PP" for shorter "Apr 19, 2026".
   */
  format?: string
  /** Forwarded to the underlying `react-day-picker` Calendar. */
  captionLayout?: React.ComponentProps<typeof Calendar>["captionLayout"]
  /** Icon shown in the trigger. Defaults to lucide's CalendarIcon. */
  icon?: React.ReactNode
  /** Accessible label for screen readers when no date is selected. */
  "aria-label"?: string
}

export interface DatePickerProps extends DatePickerBaseProps {
  /** The selected date, or undefined when empty. */
  value?: Date
  /** Called when the user selects or clears the date. */
  onChange?: (date: Date | undefined) => void
}

export interface DateRangePickerProps extends DatePickerBaseProps {
  /** The selected range, or undefined when empty. */
  value?: DateRange
  /** Called when the user selects or clears the range. */
  onChange?: (range: DateRange | undefined) => void
  /** Number of months to show side-by-side. Defaults to 2. */
  numberOfMonths?: number
}

const DEFAULT_FORMAT = "PPP"
const RANGE_FORMAT = "LLL dd, y"

function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled,
  className,
  contentClassName,
  align = "start",
  side,
  format = DEFAULT_FORMAT,
  captionLayout,
  icon,
  "aria-label": ariaLabel,
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          aria-label={ariaLabel ?? (value ? undefined : placeholder)}
          data-empty={!value}
          className={cn(
            "w-[280px] justify-start text-left font-normal data-[empty=true]:text-muted-foreground",
            className
          )}
        >
          {icon ?? <CalendarIcon className="mr-2 h-4 w-4" aria-hidden />}
          {value ? formatDate(value, format) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn("w-auto p-0", contentClassName)}
        align={align}
        side={side}
      >
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          captionLayout={captionLayout}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

function DateRangePicker({
  value,
  onChange,
  placeholder = "Pick a date range",
  disabled,
  className,
  contentClassName,
  align = "start",
  side,
  format = RANGE_FORMAT,
  captionLayout,
  icon,
  numberOfMonths = 2,
  "aria-label": ariaLabel,
}: DateRangePickerProps) {
  const hasFrom = !!value?.from
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          aria-label={ariaLabel ?? (hasFrom ? undefined : placeholder)}
          data-empty={!hasFrom}
          className={cn(
            "w-[300px] justify-start text-left font-normal data-[empty=true]:text-muted-foreground",
            className
          )}
        >
          {icon ?? <CalendarIcon className="mr-2 h-4 w-4" aria-hidden />}
          {value?.from ? (
            value.to ? (
              <>
                {formatDate(value.from, format)} –{" "}
                {formatDate(value.to, format)}
              </>
            ) : (
              formatDate(value.from, format)
            )
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn("w-auto p-0", contentClassName)}
        align={align}
        side={side}
      >
        <Calendar
          mode="range"
          selected={value}
          onSelect={onChange}
          defaultMonth={value?.from}
          numberOfMonths={numberOfMonths}
          captionLayout={captionLayout}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

export { DatePicker, DateRangePicker }
