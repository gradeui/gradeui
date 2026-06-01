import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Button — primary action primitive.
 *
 * Sizes (t-shirt scale) align EXACTLY to Tabs / ToggleGroup outer
 * heights so a button placed next to a tab strip lines up without
 * any per-call className overrides:
 *
 *   sm:  h-7 (28px)  — matches `<TabsList size="sm">` height
 *   md:  h-8 (32px)  — matches `<TabsList size="md">` height (default)
 *   lg:  h-10 (40px) — matches `<TabsList size="lg">` height
 *   icon: h-8 w-8    — square variant, md height
 *
 * `default` is preserved as an alias for `md` so existing call sites
 * keep working through the rename.
 *
 * Type and icon sizes also follow the Tabs scale (text-xs + size-3.5
 * at sm/md, text-sm + size-4 at lg) so the visual rhythm reads
 * consistent across primitives.
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
        // Tactile "physical key" treatment — inner bevel + outer drop +
        // ambient hover glow keyed off `--btn-glow` (defaults to the
        // --selected-glow blue). Drive the tone per-button with a style
        // override, e.g. `style={{ '--btn-glow': 'var(--warning)' }}`,
        // or with `data-state="on"` / `aria-pressed="true"` for a held
        // selected look. Heavy lift lives in .gds-button-raised so the
        // multi-stop shadow stack stays readable.
        raised: "gds-button-raised",
      },
      size: {
        // xs: h-6 (24px) — Figma-density for tool panels (the Studio
        // inspector), matches `<TabsList size="sm">`-era 24px controls.
        xs: "h-6 gap-1 px-2 text-[11px] [&_svg]:size-3",
        sm: "h-7 gap-1.5 px-2.5 text-xs [&_svg]:size-3.5",
        md: "h-8 gap-1.5 px-3 text-xs [&_svg]:size-3.5",
        // Alias for md — back-compat with usages that predate the
        // t-shirt rename. Same classes as md verbatim.
        default: "h-8 gap-1.5 px-3 text-xs [&_svg]:size-3.5",
        lg: "h-10 gap-2 px-4 text-sm [&_svg]:size-4",
        icon: "h-8 w-8 [&_svg]:size-3.5",
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
        // `data-gds-part="button"` is the identity attribute Studio's
        // selection agent looks for to map a click to a DS component.
        // Without it, clicking a Button (or anything inside it — the
        // common case is a Lucide icon child) ends up selecting the
        // inner SVG instead, and the inspector can't load the Button
        // contract because there's no componentName to look up.
        data-gds-part="button"
        className={cn("gds-button", buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
