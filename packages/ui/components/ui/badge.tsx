import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 [&_svg]:size-3 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // Semantic solid variants
        highlight:
          "border-transparent bg-gds-yellow-400 text-gds-gray-900 hover:bg-gds-yellow-500",
        success:
          "border-transparent bg-gds-green-500 text-gds-gray-900 hover:bg-gds-green-600",
        warning:
          "border-transparent bg-orange-500 text-white hover:bg-orange-600",
        info:
          "border-transparent bg-blue-500 text-white hover:bg-blue-600",
        // Semantic soft variants — colored text on tinted background
        "success-soft":
          "border-gds-green-500/20 bg-gds-green-500/10 text-gds-green-600 dark:text-gds-green-400",
        "warning-soft":
          "border-orange-500/20 bg-orange-500/10 text-orange-600 dark:text-orange-400",
        "destructive-soft":
          "border-destructive/20 bg-destructive/10 text-destructive dark:text-red-400",
        "info-soft":
          "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400",
        "highlight-soft":
          "border-gds-yellow-500/20 bg-gds-yellow-400/10 text-gds-yellow-600 dark:text-gds-yellow-400",
        // Outline variants - just border and text, no background
        "success-outline":
          "border-gds-green-500/50 bg-transparent text-gds-green-600 dark:text-gds-green-400",
        "warning-outline":
          "border-orange-500/50 bg-transparent text-orange-600 dark:text-orange-400",
        "destructive-outline":
          "border-destructive/50 bg-transparent text-destructive dark:text-red-400",
        "info-outline":
          "border-blue-500/50 bg-transparent text-blue-600 dark:text-blue-400",
      },
      rounded: {
        default: "rounded-md",
        full: "rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      rounded: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, rounded, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, rounded }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
