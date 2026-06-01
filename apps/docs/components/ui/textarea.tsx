import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Textarea variants — `size` mirrors Input so the whole form-control
 * family scales together. Default keeps the existing min-h-[80px] /
 * px-3 / text-sm; `sm` and `xs` are for dense tool panels.
 */
const textareaVariants = cva(
  "flex w-full rounded-md border border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      size: {
        default: "min-h-[80px] px-3 py-2 text-sm",
        sm: "min-h-[64px] px-2 py-1.5 text-xs",
        xs: "min-h-[52px] px-2 py-1 text-xs",
      },
    },
    defaultVariants: { size: "default" },
  }
);

type TextareaSize = NonNullable<VariantProps<typeof textareaVariants>["size"]>;

type TextareaProps = Omit<React.ComponentProps<"textarea">, "size"> & {
  size?: TextareaSize;
};

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, size = "default", ...props }, ref) => {
    return (
      <textarea
        className={cn(textareaVariants({ size }), className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
