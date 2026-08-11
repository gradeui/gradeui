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
        // Semantic solid variants — role colour at full strength. These track
        // the theme's --success / --warning / --info / --highlight tokens, so a
        // semantic-colour edit re-tones them (same source the Callout uses).
        highlight:
          "border-transparent bg-highlight text-gds-gray-900 hover:bg-highlight/90",
        success:
          "border-transparent bg-success text-gds-gray-900 hover:bg-success/90",
        warning:
          "border-transparent bg-warning text-white hover:bg-warning/90",
        info:
          "border-transparent bg-info text-white hover:bg-info/90",
        // Semantic soft variants — deep on-surface text over a tinted surface.
        // -soft / -deep re-voice per light/dark, so no dark: overrides needed.
        // SOFT = STATUS AS TEXT, no chip (Ali, 11 Aug). These used to be
        // a saturated dark fill plus vivid text, which on a dark card
        // reads as a warning label stuck to the surface — garish next to
        // calm content, and the two colours fight each other. Colour on
        // the glyphs alone says the same thing quietly, and it matches
        // what the product does: the Glint app's activity list renders
        // "Pending" as plain green text, not a pill.
        //
        // Padding is dropped with the fill so these align as text in a
        // row rather than sitting in an invisible box. For a chip WITH a
        // surface, use the solid variants (`success`, `destructive`) or
        // `outline`; the name is kept because these remain the quiet end
        // of the status scale.
        "success-soft": "border-transparent bg-transparent px-0 text-success-deep",
        "warning-soft": "border-transparent bg-transparent px-0 text-warning-deep",
        "destructive-soft":
          "border-transparent bg-transparent px-0 text-destructive-deep",
        "info-soft": "border-transparent bg-transparent px-0 text-info-deep",
        "highlight-soft":
          "border-transparent bg-transparent px-0 text-highlight-deep",
        // Outline variants - border + deep text, no fill
        "success-outline":
          "border-success/50 bg-transparent text-success-deep",
        "warning-outline":
          "border-warning/50 bg-transparent text-warning-deep",
        "destructive-outline":
          "border-destructive/50 bg-transparent text-destructive-deep",
        "info-outline":
          "border-info/50 bg-transparent text-info-deep",
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
