import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Row — horizontal layout primitive.
 *
 * The partner to Stack. Use for button groups, inline form layouts,
 * split hero/logo rows, anything on one line. The default `align="center"`
 * matches what most real rows want — vertically-centred icon-plus-text,
 * centred button groups. `justify` covers the main-axis distribution
 * explicitly so the agent doesn't reach for `ml-auto` to push things
 * apart.
 *
 * Distinct from a two-pane Split: Row is for evenly flowing children
 * with a shared gap; Split enforces an explicit pane ratio (1/3 + 2/3
 * etc.) and is a separate primitive.
 */
const rowVariants = cva("rds-row flex flex-row", {
  variants: {
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
      true: "flex-wrap",
      false: "flex-nowrap",
    },
  },
  defaultVariants: {
    gap: "md",
    align: "center",
    justify: "start",
    wrap: false,
  },
});

export interface RowProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof rowVariants> {
  /** When true, render as the single child element via Radix Slot — lets
   *  you stamp Row's layout classes onto an existing semantic tag without
   *  nesting an extra `<div>`. */
  asChild?: boolean;
}

const Row = React.forwardRef<HTMLDivElement, RowProps>(
  (
    { className, gap, align, justify, wrap, asChild = false, ...props },
    ref
  ) => {
    const Comp = asChild ? Slot : "div";
    return (
      <Comp
        ref={ref}
        data-gds-part="row"
        className={cn(rowVariants({ gap, align, justify, wrap, className }))}
        {...props}
      />
    );
  }
);
Row.displayName = "Row";

export { Row, rowVariants };
