import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Stack — vertical layout primitive.
 *
 * Reach for this as the default top-level wrapper inside the Studio main
 * slot when composing multiple regions (hero + content + footer). The
 * point is to stop the agent from freestyling `flex flex-col gap-6`
 * inline on every generation — a named layout component with a bounded
 * gap scale gives the Studio settings panel something to mutate, and
 * keeps vertical rhythm consistent across designs.
 *
 * Cross-axis default is `stretch` so Sections/Cards fill the container
 * width, which is what 95% of callers want. Override with `align="center"`
 * for a centred narrow column (auth cards, marketing copy).
 */
const stackVariants = cva("rds-stack flex flex-col", {
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
    },
    /**
     * Main-axis (vertical) distribution. Added to mirror Row's `justify`
     * so consumers stop reaching for `flex flex-col justify-end` inline
     * on absolute-positioned heroes, footer pinning, etc. Default `start`
     * keeps the historical behaviour (children pack to the top) and the
     * full distribution scale matches CSS `justify-content`.
     */
    justify: {
      start: "justify-start",
      center: "justify-center",
      end: "justify-end",
      between: "justify-between",
      around: "justify-around",
      evenly: "justify-evenly",
    },
  },
  defaultVariants: {
    gap: "md",
    align: "stretch",
    justify: "start",
  },
});

export interface StackProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof stackVariants> {
  /** When true, render as the single child element via Radix Slot — lets
   *  you stamp Stack's layout classes onto an existing semantic tag
   *  (`<section>`, `<main>`, `<nav>`) without nesting an extra `<div>`. */
  asChild?: boolean;
}

const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  ({ className, gap, align, justify, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "div";
    return (
      <Comp
        ref={ref}
        data-gds-part="stack"
        className={cn(stackVariants({ gap, align, justify, className }))}
        {...props}
      />
    );
  }
);
Stack.displayName = "Stack";

export { Stack, stackVariants };
