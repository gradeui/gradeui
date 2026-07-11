"use client";

import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Switch — shadcn (radix) styling (shadow-xs, ring-[3px] focus, dark
 * track + thumb variants) over Grade's size scale.
 *
 * Grade trait kept on purpose: four sizes (the upstream shadcn switch
 * ships only `sm`/`default`). Track + thumb scale together via the
 * shared control-size scale; dimensions stay on Tailwind's spacing
 * scale (no arbitrary values). With `border-2`, thumb travel =
 * trackWidth − thumbWidth − 2×border, which lands on a clean
 * `translate-x-*` step at each size. `xs`/`2xs` are the dense
 * tool-panel sizes (the Studio inspector).
 */
const switchTrackVariants = cva(
  "peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-xs outline-none transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input dark:data-[state=unchecked]:bg-input/80",
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
  "pointer-events-none block rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=unchecked]:translate-x-0 dark:data-[state=checked]:bg-primary-foreground dark:data-[state=unchecked]:bg-foreground",
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
    data-slot="switch"
    data-size={size}
    className={cn(switchTrackVariants({ size }), className)}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      data-slot="switch-thumb"
      className={cn(switchThumbVariants({ size }))}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
