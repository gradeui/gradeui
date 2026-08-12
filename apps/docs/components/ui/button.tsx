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
 *   2xs: h-5  (20px)
 *   xs:  h-6  (24px)
 *   sm:  h-7  (28px)
 *   md:  h-8  (32px) — default
 *   lg:  h-10 (40px)
 *
 * `default` is preserved as an alias for `md`. `iconOnly` squares the
 * button at the current `size` height (icon-only use) — see packages/ui
 * Button for the canonical comment.
 */

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // Tactile "physical key" treatment — see packages/ui Button for
        // the canonical comment. Heavy lift lives in .gds-button-raised.
        raised: "gds-button-raised gds-button-raised-surface",
      },
      size: {
        // 2xs: h-5 (20px) — densest tool-panel button (the Studio inspector); matches Figma Button size=2xs.
        "2xs": "h-5 gap-1 px-1.5 text-2xs [&_svg]:size-3",
        // xs: h-6 (24px) — Figma-density for tool panels; matches Figma Button size=xs.
        xs: "h-6 gap-1 px-2 text-xs [&_svg]:size-3",
        sm: "h-7 gap-1.5 px-2.5 text-sm [&_svg]:size-3.5",
        md: "h-8 gap-1.5 px-3 text-base [&_svg]:size-4",
        default: "h-8 gap-1.5 px-3 text-base [&_svg]:size-4",
        lg: "h-10 gap-2 px-4 text-lg [&_svg]:size-5",
      },
      // Squares the button at the current `size` height for icon-only use.
      iconOnly: {
        true: "px-0",
        false: "",
      },
    },
    compoundVariants: [
      { size: "2xs", iconOnly: true, class: "w-5" },
      { size: "xs", iconOnly: true, class: "w-6" },
      { size: "sm", iconOnly: true, class: "w-7" },
      { size: "md", iconOnly: true, class: "w-8" },
      { size: "default", iconOnly: true, class: "w-8" },
      { size: "lg", iconOnly: true, class: "w-10" },
    ],
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
  /** Presence TRAIT: tactile elevation (bevel + drop + hover glow +
   *  pressed sink) layered onto WHATEVER variant the button wears —
   *  a raised primary, raised outline, etc. Glow tone reads
   *  --btn-glow → --accent-glow → --selected-glow; override
   *  per-button via style={{ "--btn-glow": "var(--warning)" }}.
   *  variant="raised" remains the neutral-key alias (trait +
   *  secondary surface). */
  raised?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, iconOnly, asChild = false, raised = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn("gds-button", buttonVariants({ variant, size, iconOnly }), raised && "gds-button-raised", className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
