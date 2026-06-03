import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Input variants — `size` lets dense surfaces (the Studio inspector,
 * settings sheets) reach for a compact `sm` input without hand-rolling
 * className overrides. Default keeps the existing h-9 padding /
 * text-base-md:text-sm so this is a no-op for every existing call
 * site.
 *
 * `pl-3 pr-3` is preserved verbatim from the original so the search-
 * input pattern (leading icon overrides `pl-*`) still wins via
 * twMerge. See packages/ui/components/ui/input.tsx for the full
 * rationale.
 */
const inputVariants = cva(
  "flex w-full rounded-md border border-input bg-transparent shadow-sm transition-colors file:border-0 file:bg-transparent file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      size: {
        default: "h-9 pl-3 pr-3 py-1 text-base file:text-sm md:text-sm",
        sm: "h-8 pl-2 pr-2 py-1 text-sm file:text-xs",
        // Figma-density — for tool panels (the Studio inspector) where
        // many controls stack in a narrow column and 28px rows matter.
        // shadow-none so they sit flush with SelectTrigger (no drop
        // shadow) — every field in a dense panel should read identically.
        xs: "h-7 pl-2 pr-2 py-0 text-xs file:text-xs shadow-none",
        // 2xs: h-6 (24px) — densest tool-panel input.
        "2xs": "h-6 pl-2 pr-2 py-0 text-2xs file:text-2xs shadow-none",
      },
    },
    defaultVariants: { size: "default" },
  }
);

type InputSize = NonNullable<VariantProps<typeof inputVariants>["size"]>;

type InputProps = Omit<React.ComponentProps<"input">, "size"> & {
  size?: InputSize;
  /** Adornment rendered inside the field on the leading edge — an icon,
   *  a unit, a prefix. Non-interactive by default (clicks pass through
   *  to focus the input); pass an element with its own pointer-events
   *  if you need it clickable. */
  startSlot?: React.ReactNode;
  /** Adornment rendered inside the field on the trailing edge — a unit
   *  ("px"), a clear button, a stepper. Same pointer rules as
   *  `startSlot`. */
  endSlot?: React.ReactNode;
};

// Reserved space + adornment inset per size, so the text never collides
// with a slot. Consumers can still override via `className` (twMerge
// lets a later pl-*/pr-* win) for extra-tight cases.
const SLOT_PADDING: Record<
  InputSize,
  { startPad: string; endPad: string; startInset: string; endInset: string }
> = {
  default: { startPad: "pl-9", endPad: "pr-9", startInset: "pl-3", endInset: "pr-3" },
  sm: { startPad: "pl-7", endPad: "pr-6", startInset: "pl-2", endInset: "pr-2" },
  xs: { startPad: "pl-6", endPad: "pr-5", startInset: "pl-2", endInset: "pr-2" },
  "2xs": { startPad: "pl-6", endPad: "pr-5", startInset: "pl-2", endInset: "pr-2" },
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, size = "default", startSlot, endSlot, ...props }, ref) => {
    if (!startSlot && !endSlot) {
      return (
        <input
          type={type}
          className={cn(inputVariants({ size }), className)}
          ref={ref}
          {...props}
        />
      );
    }
    const pad = SLOT_PADDING[size];
    return (
      <div className="relative flex w-full items-center">
        {startSlot ? (
          <span
            className={cn(
              "pointer-events-none absolute inset-y-0 left-0 flex items-center text-muted-foreground [&_svg]:size-3.5",
              pad.startInset,
            )}
          >
            {startSlot}
          </span>
        ) : null}
        <input
          type={type}
          ref={ref}
          className={cn(
            inputVariants({ size }),
            startSlot && pad.startPad,
            endSlot && pad.endPad,
            className,
          )}
          {...props}
        />
        {endSlot ? (
          <span
            className={cn(
              "pointer-events-none absolute inset-y-0 right-0 flex items-center text-muted-foreground [&_svg]:size-3.5",
              pad.endInset,
            )}
          >
            {endSlot}
          </span>
        ) : null}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
