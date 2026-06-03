"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const labelVariants = cva(
  "font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
  {
    variants: {
      // Mirrors Input/Select/Textarea so a field + its label scale
      // together. `xs` is the dense tool-panel label (the inspector).
      size: {
        default: "text-sm",
        sm: "text-sm",
        xs: "text-xs",
        // 2xs (11px) — dense tool-panel labels (the Studio inspector).
        "2xs": "text-2xs",
      },
    },
    defaultVariants: { size: "default" },
  }
)

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, size, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants({ size }), className)}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
