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
        sm: "h-8 pl-2 pr-2 py-1 text-xs file:text-xs",
      },
    },
    defaultVariants: { size: "default" },
  }
);

type InputSize = NonNullable<VariantProps<typeof inputVariants>["size"]>;

type InputProps = Omit<React.ComponentProps<"input">, "size"> & {
  size?: InputSize;
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, size = "default", ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ size }), className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
