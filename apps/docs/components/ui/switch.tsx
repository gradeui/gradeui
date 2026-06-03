"use client";

import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Switch — track + thumb scale together via the shared control size
 * scale. Dimensions stay on Tailwind's spacing scale (no arbitrary
 * values): thumb travel = trackWidth − thumbWidth − 2×border, which
 * lands on a clean `translate-x-*` step at each size. `xs`/`sm` are the
 * dense tool-panel sizes (the Studio inspector).
 */
const switchTrackVariants = cva(
  "peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
  {
    variants: {
      size: {
        default: "h-6 w-11", // 24×44 — thumb 20, travel 20
        sm: "h-5 w-9", // 20×36 — thumb 16, travel 16
        xs: "h-4 w-7", // 16×28 — thumb 12, travel 12
        "2xs": "h-3 w-5", // 12×20 — thumb 8, travel 8
      },
    },
    defaultVariants: { size: "default" },
  }
);

const switchThumbVariants = cva(
  "pointer-events-none block rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=unchecked]:translate-x-0",
  {
    variants: {
      size: {
        default: "h-5 w-5 data-[state=checked]:translate-x-5",
        sm: "h-4 w-4 data-[state=checked]:translate-x-4",
        xs: "h-3 w-3 data-[state=checked]:translate-x-3",
        "2xs": "h-2 w-2 data-[state=checked]:translate-x-2",
      },
    },
    defaultVariants: { size: "default" },
  }
);

type SwitchSize = NonNullable<VariantProps<typeof switchTrackVariants>["size"]>;

const Switch = React.forwardRef<
  React.ComponentRef<typeof SwitchPrimitives.Root>,
  Omit<React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>, "size"> & {
    size?: SwitchSize;
  }
>(({ className, size = "default", ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(switchTrackVariants({ size }), className)}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb className={cn(switchThumbVariants({ size }))} />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
