"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

/**
 * The fill colour of the bar.
 *
 * `primary` is the default and the long-standing look. `accent` is the
 * quieter option (Ali, 11 Aug 2026: a full-width wizard progress bar in
 * primary "is too strong"): a bar that spans the whole header is a large
 * area of colour, and at that size the action colour stops reading as
 * progress and starts competing with the actual actions on the page.
 * `muted` is for a bar that is pure information, a quota meter or a
 * storage gauge, where any brand colour would over-signal.
 *
 * A PROP, not a className override on the indicator. The indicator is an
 * inner element, so tinting it from outside means reaching through the
 * component with a child selector, which breaks the moment the internals
 * change and has to be repeated at every call site.
 */
const TONE_FILL = {
  primary: "bg-primary",
  accent: "bg-accent",
  muted: "bg-muted-foreground",
} as const;

export type ProgressTone = keyof typeof TONE_FILL;

export interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  tone?: ProgressTone;
}

const Progress = React.forwardRef<
  React.ComponentRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, tone = "primary", ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    data-tone={tone}
    className={cn(
      "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn("h-full w-full flex-1 transition-all", TONE_FILL[tone])}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
