import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Flex — the unopinionated flexbox primitive.
 *
 * The CSS-aligned partner to Stack / Row / Grid. Where Stack and Row bake in
 * a direction and a sensible gap/align default, Flex exposes the raw CSS
 * knobs and ships with CSS's own defaults — direction=row, gap=none,
 * justify=start, align=stretch, wrap=nowrap. Nothing is opinionated; you pay
 * for exactly the props you set.
 *
 * Use Flex when:
 *   - You need `direction="col-reverse"` or `"row-reverse"` — Stack and Row
 *     can't express either without falling back to className.
 *   - You want CSS defaults (stretch alignment, no baked-in gap) rather than
 *     Row's "items-center gap-md" starting point.
 *   - You're reaching for `className="flex …"` and want the settings-panel
 *     editability you lose when hand-rolling utility classes.
 *
 * Otherwise prefer Stack (vertical) / Row (horizontal) / Grid (2D) —
 * they're easier to read at a glance and have defaults tuned for the 95%
 * case. Flex is the escape hatch, not the default.
 */
const flexVariants = cva("rds-flex flex", {
  variants: {
    direction: {
      row: "flex-row",
      col: "flex-col",
      "row-reverse": "flex-row-reverse",
      "col-reverse": "flex-col-reverse",
    },
    gap: {
      none: "gap-0",
      xs: "gap-1",
      sm: "gap-2",
      md: "gap-4",
      lg: "gap-6",
      xl: "gap-8",
      "2xl": "gap-12",
    },
    align: {
      start: "items-start",
      center: "items-center",
      end: "items-end",
      stretch: "items-stretch",
      baseline: "items-baseline",
    },
    justify: {
      start: "justify-start",
      center: "justify-center",
      end: "justify-end",
      between: "justify-between",
      around: "justify-around",
      evenly: "justify-evenly",
    },
    wrap: {
      nowrap: "flex-nowrap",
      wrap: "flex-wrap",
      "wrap-reverse": "flex-wrap-reverse",
    },
  },
  // CSS-aligned defaults on purpose — Flex's whole point is "don't surprise
  // me with baked-in rhythm". Consumers who want Row-style defaults should
  // use Row.
  defaultVariants: {
    direction: "row",
    gap: "none",
    align: "stretch",
    justify: "start",
    wrap: "nowrap",
  },
});

export interface FlexProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof flexVariants> {
  /** When true, render as the single child element via Radix Slot — lets
   *  you stamp Flex's layout classes onto an existing semantic tag without
   *  nesting an extra `<div>`. */
  asChild?: boolean;
}

const Flex = React.forwardRef<HTMLDivElement, FlexProps>(
  (
    {
      className,
      direction,
      gap,
      align,
      justify,
      wrap,
      asChild = false,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "div";
    return (
      <Comp
        ref={ref}
        data-gds-part="flex"
        className={cn(
          flexVariants({ direction, gap, align, justify, wrap, className })
        )}
        {...props}
      />
    );
  }
);
Flex.displayName = "Flex";

export { Flex, flexVariants };
