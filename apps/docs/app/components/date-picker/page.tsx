"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { DatePicker, DateRangePicker } from "@/components/ui/date-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { InstallBlock } from "@/components/install-block";
import { cn } from "@/lib/utils";
import { ComponentNav } from "@/components/component-nav";
import { SidecarBlock } from "@/components/sidecar-block";
import type { DateRange } from "react-day-picker";

export default function DatePickerPage() {
  const [date, setDate] = React.useState<Date>();
  const [dateRange, setDateRange] = React.useState<DateRange>();
  const [customDate, setCustomDate] = React.useState<Date>();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">
          Date Picker
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          A sealed <code>&lt;DatePicker /&gt;</code> composed internally from{" "}
          Popover + Button + Calendar. Prefer this over{" "}
          <code>&lt;Input type=&quot;date&quot; /&gt;</code> for consistent
          theming, keyboard nav, and a11y.
        </p>
      </div>

      {/* Basic */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Basic Date Picker
        </h2>
        <div className="grid gap-1.5">
          <Label htmlFor="basic-date">Date of birth</Label>
          <DatePicker
            value={date}
            onChange={setDate}
            placeholder="Select your birthday"
          />
        </div>
      </div>

      {/* Date Range Picker */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Date Range Picker
        </h2>
        <p className="text-muted-foreground">
          Select a range of dates for filtering or scheduling.
        </p>
        <DateRangePicker
          value={dateRange}
          onChange={setDateRange}
          numberOfMonths={2}
          placeholder="Pick a date range"
        />
      </div>

      {/* With Presets */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          With Presets
        </h2>
        <p className="text-muted-foreground">
          Add quick selection presets for common date ranges.
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <DatePicker value={date} onChange={setDate} />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDate(new Date())}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDate(new Date(Date.now() + 24 * 60 * 60 * 1000))}
          >
            Tomorrow
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
            }
          >
            In a week
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDate(undefined)}>
            Clear
          </Button>
        </div>
      </div>

      {/* Usage */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Usage
        </h2>
        <InstallBlock>{`import { DatePicker, DateRangePicker } from "@gradeui/ui"

const [date, setDate] = React.useState<Date>()
const [range, setRange] = React.useState<DateRange>()

<DatePicker value={date} onChange={setDate} />

<DateRangePicker
  value={range}
  onChange={setRange}
  numberOfMonths={2}
/>`}</InstallBlock>
      </div>

      {/* Compose it yourself */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Compose your own
        </h2>
        <p className="text-muted-foreground">
          Need a different trigger, custom positioning, or a non-standard
          layout? Drop the sealed <code>DatePicker</code> and reach for the
          primitives directly — <code>Calendar</code> and <code>Popover</code>{" "}
          are exported from the same barrel.
        </p>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[280px] justify-start text-left font-normal",
                !customDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {customDate ? format(customDate, "PPP") : <span>Custom trigger</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={customDate}
              onSelect={setCustomDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <InstallBlock>{`import { Calendar, Popover, PopoverTrigger, PopoverContent, Button } from "@gradeui/ui"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">
      <CalendarIcon className="mr-2 h-4 w-4" />
      {date ? format(date, "PPP") : "Pick a date"}
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-auto p-0">
    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
  </PopoverContent>
</Popover>`}</InstallBlock>
      </div>

      <SidecarBlock slug="date-picker" />

      <ComponentNav currentHref="/components/date-picker" />
    </div>
  );
}
