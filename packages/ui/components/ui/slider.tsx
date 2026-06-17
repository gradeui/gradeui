"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

/**
 * `size` controls the visual weight. `default` is the standard control;
 * `sm` is the dense, subtle track for tool panels / inspectors (thin
 * muted track, small thumb) so a panel of sliders reads quietly.
 */
type SliderSize = "default" | "sm";

const SIZE: Record<
  SliderSize,
  { track: string; range: string; thumb: string }
> = {
  default: {
    track: "h-2 bg-secondary",
    range: "bg-primary",
    thumb:
      "h-5 w-5 border-2 border-primary focus-visible:ring-2 focus-visible:ring-offset-2",
  },
  sm: {
    track: "h-[3px] bg-border",
    range: "bg-foreground/40",
    thumb:
      "h-3 w-3 border border-border hover:border-foreground/40 focus-visible:ring-2",
  },
};

const Slider = React.forwardRef<
  React.ComponentRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
    size?: SliderSize;
  }
>(({ className, size = "default", ...props }, ref) => {
  const s = SIZE[size];
  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track
        className={cn(
          "relative w-full grow overflow-hidden rounded-full",
          s.track
        )}
      >
        <SliderPrimitive.Range className={cn("absolute h-full rounded-full", s.range)} />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        className={cn(
          "block rounded-full bg-background shadow-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          s.thumb
        )}
      />
    </SliderPrimitive.Root>
  );
});
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
