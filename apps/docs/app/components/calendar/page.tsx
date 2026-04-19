"use client";

import * as React from "react";
import { Calendar } from "@/components/ui/calendar";
import { ComponentNav } from "@/components/component-nav";
import type { DateRange } from "react-day-picker";

export default function CalendarPage() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">Calendar</h1>
        <p className="text-lg text-muted-foreground mt-2">
          A date field component that allows users to enter and edit dates.
        </p>
      </div>

      {/* Basic */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Basic Calendar
        </h2>
        <div className="rounded-lg border p-4 w-fit">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Selected: {date?.toDateString() || "None"}
        </p>
      </div>

      {/* Date Range */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Date Range
        </h2>
        <p className="text-muted-foreground">
          Select a range of dates.
        </p>
        <div className="rounded-lg border p-4 w-fit">
          <Calendar
            mode="range"
            selected={dateRange}
            onSelect={setDateRange}
            numberOfMonths={2}
            className="rounded-md"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Range: {dateRange?.from?.toDateString()} - {dateRange?.to?.toDateString() || "..."}
        </p>
      </div>

      {/* With Disabled Dates */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Disabled Dates
        </h2>
        <p className="text-muted-foreground">
          Disable past dates or specific dates.
        </p>
        <div className="rounded-lg border p-4 w-fit">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            disabled={(date) => date < new Date()}
            className="rounded-md"
          />
        </div>
      </div>

      {/* Usage */}
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight">
          Usage
        </h2>
        <div className="rounded-lg bg-rds-gray-100 dark:bg-rds-gray-800 border border-rds-gray-200 dark:border-transparent p-4 font-mono text-sm text-rds-gray-900 dark:text-white overflow-x-auto">
          <pre>
            <code>{`import { Calendar } from "@/components/ui/calendar"

const [date, setDate] = React.useState<Date | undefined>(new Date())

{/* Single date */}
<Calendar
  mode="single"
  selected={date}
  onSelect={setDate}
/>

{/* Date range */}
<Calendar
  mode="range"
  selected={dateRange}
  onSelect={setDateRange}
  numberOfMonths={2}
/>

{/* Disabled dates */}
<Calendar
  mode="single"
  disabled={(date) => date < new Date()}
/>`}</code>
          </pre>
        </div>
      </div>

      <ComponentNav currentHref="/components/calendar" />
    </div>
  );
}
