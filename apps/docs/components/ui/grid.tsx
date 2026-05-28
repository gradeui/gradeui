import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Grid — 2D layout primitive. The partner to Stack and Row.
 *
 * Stack handles vertical, Row handles horizontal, Grid handles the
 * responsive 2D case — most commonly a set of equal-width tiles (stat
 * cards, feature cards, pricing columns) that needs to collapse
 * gracefully on narrow viewports. Without this primitive, every
 * vibe-coded dashboard reinvents `grid grid-cols-1 md:grid-cols-2
 * lg:grid-cols-4` and the settings panel has nothing to mutate.
 *
 * `cols` names the DESIRED desktop column count. Each value is a
 * baked-in responsive ladder that matches the standard pattern for that
 * count (1→2→N for small counts, 2→3→N for denser grids) so the model
 * just writes `<Grid cols="4">` and gets the same behaviour it would
 * hand-roll. If you need bespoke breakpoints, override via `className`.
 *
 * Sharing the `gap` / `align` scale with Stack and Row is deliberate:
 * when the Studio panel offers a "switch layout type" control between
 * Stack / Row / Grid, those props transfer cleanly — only `cols`
 * (Grid-only) and `justify` / `wrap` (Row-only) are lost.
 */
const gridVariants = cva("gds-grid grid", {
  variants: {
    cols: {
      "1": "grid-cols-1",
      "2": "grid-cols-1 md:grid-cols-2",
      "3": "grid-cols-1 sm:grid-cols-2 md:grid-cols-3",
      "4": "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
      "5": "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5",
      "6": "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
      "12": "grid-cols-4 md:grid-cols-6 lg:grid-cols-12",
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
    },
  },
  defaultVariants: {
    cols: "3",
    gap: "md",
    align: "stretch",
  },
});

export interface GridProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof gridVariants> {
  /** When true, render as the single child element via Radix Slot — lets
   *  you stamp Grid's layout classes onto an existing semantic tag
   *  without nesting an extra `<div>`. */
  asChild?: boolean;
}

const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  ({ className, cols, gap, align, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "div";
    return (
      <Comp
        ref={ref}
        data-gds-part="grid"
        className={cn(gridVariants({ cols, gap, align, className }))}
        {...props}
      />
    );
  }
);
Grid.displayName = "Grid";

export { Grid, gridVariants };
