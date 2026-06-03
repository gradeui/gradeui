import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Button — primary action primitive.
 *
 * Sizes (t-shirt scale) align EXACTLY to Tabs / ToggleGroup outer
 * heights so a button placed next to a tab strip lines up without
 * any per-call className overrides.
 *
 *   sm:  h-7  (28px)
 *   md:  h-8  (32px) — default
 *   lg:  h-10 (40px)
 *   icon: h-8 w-8     — square, md height
 *
 * `default` is preserved as an alias for `md` so existing call sites
 * keep working through the rename.
 */

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // Tactile "physical key" treatment — see packages/ui Button for
        // the canonical comment. Heavy lift lives in .gds-button-raised.
        raised: "gds-button-raised",
      },
      size: {
        // 2xs: h-6 (24px) — densest tool-panel button (the Studio inspector).
        "2xs": "h-6 gap-1 px-1.5 text-2xs [&_svg]:size-3",
        // xs: h-6 (24px) — Figma-density for tool panels.
        xs: "h-6 gap-1 px-2 text-xs [&_svg]:size-3",
        sm: "h-7 gap-1.5 px-2.5 text-sm [&_svg]:size-3.5",
        md: "h-8 gap-1.5 px-3 text-base [&_svg]:size-4",
        default: "h-8 gap-1.5 px-3 text-base [&_svg]:size-4",
        lg: "h-10 gap-2 px-4 text-lg [&_svg]:size-5",
        icon: "h-8 w-8 [&_svg]:size-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn("gds-button", buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
